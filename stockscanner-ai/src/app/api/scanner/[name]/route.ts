import { NextRequest, NextResponse } from "next/server"
import { SCANNER_REGISTRY, getScannerMeta } from "@/lib/scanners/registry"
import { getGroupedDaily, getStockBars, getTickerDetails, getStockFinancials } from "@/lib/polygon/client"
import { calculateIndicators } from "@/lib/indicators/calculator"
import { calculateRelativeStrength } from "@/lib/scoring/rs-rating"
import { calculateTAScore, calculateFAScore, calculateALSScore } from "@/lib/scoring/als-score"
import { getCachedScannerResults, setCachedScannerResults, getCachedOHLCV, setCachedOHLCV } from "@/lib/supabase/cache"
import type { ScannerResult, OHLCV, Fundamentals } from "@/types"

// Cache scanner results for 4 hours
export const revalidate = 14400

interface RouteParams {
  params: Promise<{ name: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { name }   = await params
  const { searchParams } = req.nextUrl

  // ── Validate scanner exists ──────────────────────────────────────────────
  const scanner = SCANNER_REGISTRY[name]
  const meta    = getScannerMeta(name)
  if (!scanner || !meta) {
    return NextResponse.json(
      { error: "Scanner not found", code: "SCANNER_NOT_FOUND" },
      { status: 404 }
    )
  }

  // ── Parse filter params ──────────────────────────────────────────────────
  const minPrice  = parseFloat(searchParams.get("minPrice")  ?? "0")
  const maxPrice  = parseFloat(searchParams.get("maxPrice")  ?? "999999")
  const minVol    = parseInt  (searchParams.get("minVol")    ?? "0", 10)
  const sector    = searchParams.get("sector") ?? "all"
  const sortBy    = searchParams.get("sort")   ?? "setupQuality"

  const today = new Date().toISOString().split("T")[0]

  // ── Check cache first ────────────────────────────────────────────────────
  const cached = await getCachedScannerResults(name, today)
  if (cached) {
    const filtered = applyFilters(cached, { minPrice, maxPrice, minVol, sector })
    const sorted   = sortResults(filtered, sortBy)
    return NextResponse.json(
      { results: sorted, total: sorted.length, scanner: meta, cachedAt: new Date().toISOString(), fromCache: true },
      { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
    )
  }

  // ── Fetch universe from Polygon ───────────────────────────────────────────
  // Use yesterday's date for grouped daily (today might not be available yet)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  // Skip weekends
  if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 2)
  if (yesterday.getDay() === 6) yesterday.setDate(yesterday.getDate() - 1)
  const fetchDate = yesterday.toISOString().split("T")[0]

  let dailyBars
  try {
    dailyBars = await getGroupedDaily(fetchDate)
  } catch (err) {
    console.error("Polygon grouped daily fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch market data", code: "MARKET_DATA_ERROR" },
      { status: 502 }
    )
  }

  // ── Filter universe: price, volume, exchanges ─────────────────────────────
  const universe = dailyBars.filter((bar) =>
    bar.c >= minPrice &&
    bar.c <= maxPrice &&
    bar.v >= Math.max(minVol, 100_000) &&   // minimum 100k volume
    bar.c >= 5                               // minimum $5 price
  )

  // ── Build OHLCV map and run indicators ────────────────────────────────────
  // Process up to 500 candidates to stay within Polygon rate limits
  const candidates = universe
    .sort((a, b) => (b.v * b.c) - (a.v * a.c))  // sort by dollar volume
    .slice(0, 500)

  const ohlcvMap = new Map<string, OHLCV[]>()

  // Fetch historical bars with cache — batched with delay to respect rate limits
  const BATCH_SIZE = 5
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (bar) => {
        // Check OHLCV cache first
        const cachedBars = await getCachedOHLCV(bar.T, 260)
        if (cachedBars) {
          ohlcvMap.set(bar.T, cachedBars)
          return
        }
        try {
          const bars = await getStockBars(bar.T, 260)
          if (bars.length >= 60) {
            ohlcvMap.set(bar.T, bars)
            await setCachedOHLCV(bar.T, bars)
          }
        } catch {
          // Skip tickers that fail — don't crash the whole scan
        }
      })
    )
    // Small delay between batches to respect rate limit
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  // ── Calculate RS ratings for entire universe ──────────────────────────────
  const rsMap = calculateRelativeStrength(ohlcvMap)

  // ── Run scanner on each ticker ────────────────────────────────────────────
  const rawResults: ScannerResult[] = []

  for (const [ticker, ohlcv] of ohlcvMap) {
    const dailyBar = candidates.find((b) => b.T === ticker)
    if (!dailyBar) continue

    const indicators = calculateIndicators(ohlcv)
    const pattern    = scanner.detect(ohlcv, indicators)
    if (!pattern) continue

    // Fetch company details (best-effort — skip on error)
    let companyName = ticker
    let sectorName  = "Unknown"
    let marketCap   = 0
    try {
      const details = await getTickerDetails(ticker)
      companyName   = details.name
      sectorName    = details.sector
      marketCap     = details.marketCap
    } catch { /* skip */ }

    // Apply sector filter
    if (sector !== "all" && sectorName !== sector) continue

    // Fetch fundamentals (best-effort)
    let fundamentals: Fundamentals = {
      eps: null, epsGrowthYoY: null, revenue: null, revenueGrowthYoY: null,
      netMargin: null, operatingMargin: null, roe: null,
      debtToEquity: null, currentRatio: null, peRatio: null, pegRatio: null,
    }
    try {
      fundamentals = await getStockFinancials(ticker)
    } catch { /* skip */ }

    const taScore  = calculateTAScore(indicators, ohlcv)
    const faScore  = calculateFAScore(fundamentals)
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

  // ── Sort and cache ────────────────────────────────────────────────────────
  const sorted = sortResults(rawResults, sortBy)
  await setCachedScannerResults(name, sorted, today)

  const filtered = applyFilters(sorted, { minPrice, maxPrice, minVol, sector })

  return NextResponse.json(
    {
      results:  filtered,
      total:    filtered.length,
      scanner:  meta,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    },
    { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Filters {
  minPrice: number
  maxPrice: number
  minVol:   number
  sector:   string
}

function applyFilters(results: ScannerResult[], filters: Filters): ScannerResult[] {
  return results.filter((r) => {
    if (r.price  < filters.minPrice) return false
    if (r.price  > filters.maxPrice) return false
    if (r.volume < filters.minVol)   return false
    if (filters.sector !== "all" && r.sector !== filters.sector) return false
    return true
  })
}

function sortResults(results: ScannerResult[], sortBy: string): ScannerResult[] {
  return [...results].sort((a, b) => {
    switch (sortBy) {
      case "setupQuality": return b.setupQuality - a.setupQuality
      case "alsScore":     return b.alsScore     - a.alsScore
      case "arsRating":    return b.arsRating    - a.arsRating
      case "marketCap":    return b.marketCap    - a.marketCap
      case "changePct":    return b.changePct    - a.changePct
      case "volume":       return b.volume       - a.volume
      default:             return b.setupQuality - a.setupQuality
    }
  })
}
