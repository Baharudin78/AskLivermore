import { NextRequest, NextResponse } from "next/server"
import { SCANNER_REGISTRY, getScannerMeta } from "@/lib/scanners/registry"
import { getGroupedDaily, getStockBars, getTickerDetails } from "@/lib/polygon/client"
import {
  getCachedOHLCV,
  setCachedOHLCV,
  getCachedScannerResults,
  setCachedScannerResults,
} from "@/lib/supabase/cache"
import { calculateIndicators } from "@/lib/indicators/calculator"
import { calculateRelativeStrength } from "@/lib/scoring/rs-rating"
import { calculateTAScore, calculateFAScore, calculateALSScore } from "@/lib/scoring/als-score"
import type { ScannerResult, OHLCV, Fundamentals } from "@/types"

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

  // ── Check Supabase cache ──────────────────────────────────────────────────
  const { data: cached } = await getCachedScannerResults(name, today)
  if (cached && cached.length > 0) {
    const filtered = applyFilters(cached, { minPrice, maxPrice, minVol, sector })
    const sorted   = sortResults(filtered, sortBy)
    return NextResponse.json(
      { results: sorted, total: sorted.length, scanner: meta, cachedAt: new Date().toISOString(), fromCache: true },
      { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
    )
  }

  // ── Fetch grouped daily universe from Polygon ─────────────────────────────
  const fetchDate    = getLastTradingDate()
  const groupedResult = await getGroupedDaily(fetchDate)

  if (groupedResult.error) {
    return NextResponse.json(
      { error: `Polygon API error: ${groupedResult.error}`, code: "MARKET_DATA_ERROR" },
      { status: 502 }
    )
  }

  const dailyBars = groupedResult.data
  // Null guard satisfies TS narrowing — data is always set when error is null
  if (!dailyBars || !dailyBars.length) {
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
      bar.v >= Math.max(minVol, 500_000) &&
      bar.c >= 5
    )
    .sort((a, b) => (b.v * b.c) - (a.v * a.c))
    .slice(0, 100)

  // ── Fetch OHLCV for each candidate (cache-first) ───────────────────────────
  const ohlcvMap = new Map<string, OHLCV[]>()

  // Batch in groups of 3 with 300ms delay (respect Polygon free tier 5 req/min)
  const BATCH = 3
  const DELAY = 300

  for (let i = 0; i < universe.length; i += BATCH) {
    const batch = universe.slice(i, i + BATCH)

    await Promise.all(
      batch.map(async (bar) => {
        const { data: cachedBars } = await getCachedOHLCV(bar.T, 260)
        if (cachedBars && cachedBars.length >= 60) {
          ohlcvMap.set(bar.T, cachedBars)
          return
        }

        const { data: bars } = await getStockBars(bar.T, 260)
        if (bars && bars.length >= 60) {
          ohlcvMap.set(bar.T, bars)
          await setCachedOHLCV(bar.T, bars)   // non-fatal — Result ignored
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

    // Fetch ticker details (best-effort)
    let companyName = ticker
    let sectorName  = "Unknown"
    let marketCap   = 0

    const { data: details } = await getTickerDetails(ticker)
    if (details) {
      companyName = details.name
      sectorName  = details.sector
      marketCap   = details.marketCap
    }

    if (sector !== "all" && sectorName !== sector) continue

    const fundamentals: Fundamentals = {
      eps: null, epsGrowthYoY: null, revenue: null, revenueGrowthYoY: null,
      netMargin: null, operatingMargin: null, roe: null,
      debtToEquity: null, currentRatio: null, peRatio: null, pegRatio: null,
    }

    const taScore   = calculateTAScore(indicators, ohlcv)
    const faScore   = calculateFAScore(fundamentals)
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

  const sorted   = sortResults(rawResults, sortBy)
  const filtered = applyFilters(sorted, { minPrice, maxPrice, minVol, sector })

  await setCachedScannerResults(name, sorted, today)  // non-fatal — Result ignored

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

function getLastTradingDate(): string {
  const d = new Date()
  if (d.getUTCHours() < 21) d.setDate(d.getDate() - 1)
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
