import { NextRequest, NextResponse } from "next/server"
import { SCANNER_REGISTRY, getScannerMeta } from "@/lib/scanners/registry"
import { getGroupedDaily, getStockBars, getTickerDetails } from "@/lib/polygon/client"
import { calculateIndicators } from "@/lib/indicators/calculator"
import { calculateRelativeStrength } from "@/lib/scoring/rs-rating"
import { calculateTAScore, calculateFAScore, calculateALSScore } from "@/lib/scoring/als-score"
import type { ScannerResult, OHLCV, Fundamentals } from "@/types"

// ---------------------------------------------------------------------------
// Cache helpers — wrapped so missing Supabase tables don't crash the API
// ---------------------------------------------------------------------------

async function safeGetCache(name: string, date: string): Promise<ScannerResult[] | null> {
  try {
    const { getCachedScannerResults } = await import("@/lib/supabase/cache")
    return await getCachedScannerResults(name, date)
  } catch {
    return null
  }
}

async function safeSetCache(name: string, results: ScannerResult[], date: string) {
  try {
    const { setCachedScannerResults } = await import("@/lib/supabase/cache")
    await setCachedScannerResults(name, results, date)
  } catch {
    // Cache write failure is non-fatal
  }
}

async function safeGetOHLCV(ticker: string, days: number): Promise<OHLCV[] | null> {
  try {
    const { getCachedOHLCV } = await import("@/lib/supabase/cache")
    return await getCachedOHLCV(ticker, days)
  } catch {
    return null
  }
}

async function safeSetOHLCV(ticker: string, bars: OHLCV[]) {
  try {
    const { setCachedOHLCV } = await import("@/lib/supabase/cache")
    await setCachedOHLCV(ticker, bars)
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ name: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { name }         = await params
  const { searchParams } = req.nextUrl

  // ── Validate scanner ──────────────────────────────────────────────────────
  const scanner = SCANNER_REGISTRY[name]
  const meta    = getScannerMeta(name)
  if (!scanner || !meta) {
    return NextResponse.json(
      { error: "Scanner not found", code: "SCANNER_NOT_FOUND" },
      { status: 404 }
    )
  }

  // ── Parse filters ─────────────────────────────────────────────────────────
  const minPrice = parseFloat(searchParams.get("minPrice") ?? "5")
  const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999")
  const minVol   = parseInt  (searchParams.get("minVol")   ?? "500000", 10)
  const sector   = searchParams.get("sector") ?? "all"
  const sortBy   = searchParams.get("sort")   ?? "setupQuality"

  const today = new Date().toISOString().split("T")[0]

  // ── Check Supabase cache (graceful degradation if tables missing) ──────────
  const cached = await safeGetCache(name, today)
  if (cached && cached.length > 0) {
    const filtered = applyFilters(cached, { minPrice, maxPrice, minVol, sector })
    const sorted   = sortResults(filtered, sortBy)
    return NextResponse.json(
      { results: sorted, total: sorted.length, scanner: meta, cachedAt: new Date().toISOString(), fromCache: true },
      { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
    )
  }

  // ── Fetch grouped daily universe from Polygon ─────────────────────────────
  // Use most recent trading day
  const fetchDate = getLastTradingDate()
  let dailyBars
  try {
    dailyBars = await getGroupedDaily(fetchDate)
  } catch (err) {
    return NextResponse.json(
      { error: `Polygon API error: ${err instanceof Error ? err.message : "unknown"}`, code: "MARKET_DATA_ERROR" },
      { status: 502 }
    )
  }

  if (!dailyBars.length) {
    return NextResponse.json(
      { error: `No market data available for ${fetchDate}. Market may be closed.`, code: "NO_DATA" },
      { status: 404 }
    )
  }

  // ── Filter universe: liquidity + price thresholds ─────────────────────────
  const universe = dailyBars
    .filter((bar) =>
      bar.c >= minPrice &&
      bar.c <= maxPrice &&
      bar.v >= Math.max(minVol, 500_000) &&   // min 500k volume
      bar.c >= 5                               // min $5
    )
    .sort((a, b) => (b.v * b.c) - (a.v * a.c))  // sort by dollar volume
    .slice(0, 100)                                // top 100 only — keeps API fast

  // ── Fetch OHLCV for each candidate (cache-first) ───────────────────────────
  const ohlcvMap = new Map<string, OHLCV[]>()

  // Batch in groups of 3 with 300ms delay (respect Polygon free tier 5 req/min)
  const BATCH  = 3
  const DELAY  = 300
  for (let i = 0; i < universe.length; i += BATCH) {
    const batch = universe.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (bar) => {
        const cached = await safeGetOHLCV(bar.T, 260)
        if (cached && cached.length >= 60) {
          ohlcvMap.set(bar.T, cached)
          return
        }
        try {
          const bars = await getStockBars(bar.T, 260)
          if (bars.length >= 60) {
            ohlcvMap.set(bar.T, bars)
            await safeSetOHLCV(bar.T, bars)
          }
        } catch {
          // Skip failed tickers silently
        }
      })
    )
    if (i + BATCH < universe.length) {
      await new Promise((r) => setTimeout(r, DELAY))
    }
  }

  // ── Calculate RS ratings ───────────────────────────────────────────────────
  const rsMap = calculateRelativeStrength(ohlcvMap)

  // ── Run scanner on each ticker ─────────────────────────────────────────────
  const rawResults: ScannerResult[] = []

  for (const [ticker, ohlcv] of ohlcvMap) {
    const dailyBar = universe.find((b) => b.T === ticker)
    if (!dailyBar) continue

    const indicators = calculateIndicators(ohlcv)
    const pattern    = scanner.detect(ohlcv, indicators)
    if (!pattern) continue

    // Sector filter — apply before expensive ticker details fetch
    // (sector unknown at this point, so filter post-details below)

    // Fetch ticker details (best-effort, non-blocking)
    let companyName = ticker
    let sectorName  = "Unknown"
    let marketCap   = 0
    try {
      const details = await getTickerDetails(ticker)
      companyName   = details.name
      sectorName    = details.sector
      marketCap     = details.marketCap
    } catch { /* use defaults */ }

    if (sector !== "all" && sectorName !== sector) continue

    // Default fundamentals (FA score = neutral 5 without financials data)
    const fundamentals: Fundamentals = {
      eps: null, epsGrowthYoY: null, revenue: null, revenueGrowthYoY: null,
      netMargin: null, operatingMargin: null, roe: null,
      debtToEquity: null, currentRatio: null, peRatio: null, pegRatio: null,
    }

    const taScore   = calculateTAScore(indicators, ohlcv)
    const faScore   = calculateFAScore(fundamentals)  // returns 5 (neutral) when null
    const arsRating = rsMap.get(ticker) ?? 0
    const alsScore  = calculateALSScore(taScore, faScore, arsRating, indicators)

    const prevClose = ohlcv.length >= 2 ? ohlcv[ohlcv.length - 2].close : dailyBar.c
    const change    = dailyBar.c - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0

    rawResults.push({
      ticker,
      companyName,
      price:        dailyBar.c,
      change,
      changePct,
      volume:       dailyBar.v,
      marketCap,
      sector:       sectorName,
      patternData:  { ...pattern.patternData, notes: pattern.notes },
      taScore,
      faScore,
      arsRating,
      alsScore,
      setupQuality: pattern.setupQuality,
    })
  }

  const sorted = sortResults(rawResults, sortBy)

  // Cache results (non-fatal if Supabase tables not set up)
  await safeSetCache(name, sorted, today)

  const filtered = applyFilters(sorted, { minPrice, maxPrice, minVol, sector })

  return NextResponse.json(
    {
      results:   filtered,
      total:     filtered.length,
      scanner:   meta,
      cachedAt:  new Date().toISOString(),
      fromCache: false,
    },
    { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the most recent trading date (skips weekends) */
function getLastTradingDate(): string {
  const d = new Date()
  // If before 4pm ET (21:00 UTC), use yesterday's data
  if (d.getUTCHours() < 21) d.setDate(d.getDate() - 1)
  // Skip Sunday and Saturday
  if (d.getDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

interface Filters {
  minPrice: number
  maxPrice: number
  minVol:   number
  sector:   string
}

function applyFilters(results: ScannerResult[], f: Filters): ScannerResult[] {
  return results.filter((r) => {
    if (r.price  < f.minPrice) return false
    if (r.price  > f.maxPrice) return false
    if (r.volume < f.minVol)   return false
    if (f.sector !== "all" && r.sector !== f.sector) return false
    return true
  })
}

function sortResults(results: ScannerResult[], by: string): ScannerResult[] {
  return [...results].sort((a, b) => {
    switch (by) {
      case "setupQuality": return b.setupQuality - a.setupQuality
      case "alsScore":     return b.alsScore     - a.alsScore
      case "arsRating":    return b.arsRating    - a.arsRating
      case "marketCap":    return b.marketCap    - a.marketCap
      case "changePct":    return b.changePct    - a.changePct
      default:             return b.setupQuality - a.setupQuality
    }
  })
}
