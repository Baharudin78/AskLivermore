import { NextRequest, NextResponse } from "next/server"
import { getGroupedDaily, getStockBars, getTickerDetails } from "@/lib/polygon/client"
import {
  getCachedOHLCV,
  setCachedOHLCV,
  getCachedScannerResults,
  setCachedScannerResults,
} from "@/lib/supabase/cache"
import { calculateIndicators }                            from "@/lib/indicators/calculator"
import { calculateRelativeStrength }                      from "@/lib/scoring/rs-rating"
import { calculateTAScore, calculateFAScore, calculateALSScore } from "@/lib/scoring/als-score"
import type { ScannerResult, OHLCV, Fundamentals }        from "@/types"

const CACHE_KEY   = "top100"
const CANDIDATE_N = 300   // top N by dollar volume before scoring
const TOP_N       = 100   // final list size
const BATCH       = 3
const DELAY       = 300

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sector       = searchParams.get("sector")       ?? "all"
  const minMarketCap = parseInt(searchParams.get("minMarketCap") ?? "0", 10)
  const sortBy       = searchParams.get("sort")         ?? "alsScore"

  const today = new Date().toISOString().split("T")[0]

  // ── Supabase cache ────────────────────────────────────────────────────────
  const { data: cached } = await getCachedScannerResults(CACHE_KEY, today)
  if (cached && cached.length > 0) {
    const filtered = applyFilters(cached, { sector, minMarketCap })
    const sorted   = sortResults(filtered, sortBy)
    return NextResponse.json(
      { results: sorted, total: sorted.length, portfolioStats: calcPortfolioStats(sorted), fromCache: true, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600" } }
    )
  }

  // ── Fetch universe ────────────────────────────────────────────────────────
  const fetchDate     = getLastTradingDate()
  const groupedResult = await getGroupedDaily(fetchDate)

  if (groupedResult.error) {
    return NextResponse.json(
      { error: `Polygon API error: ${groupedResult.error}`, code: "MARKET_DATA_ERROR" },
      { status: 502 }
    )
  }

  const dailyBars = groupedResult.data
  if (!dailyBars || !dailyBars.length) {
    return NextResponse.json(
      { error: `No market data for ${fetchDate}. Market may be closed.`, code: "NO_DATA" },
      { status: 404 }
    )
  }

  // ── Filter + rank candidates by dollar volume ─────────────────────────────
  const candidates = dailyBars
    .filter((bar) => bar.c >= 5 && bar.v >= 1_000_000)
    .sort((a, b) => b.v * b.c - a.v * a.c)
    .slice(0, CANDIDATE_N)

  // ── Fetch OHLCV (cache-first, batched) ────────────────────────────────────
  const ohlcvMap = new Map<string, OHLCV[]>()

  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH)
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
          await setCachedOHLCV(bar.T, bars)
        }
      })
    )
    if (i + BATCH < candidates.length) {
      await new Promise((r) => setTimeout(r, DELAY))
    }
  }

  // ── RS ratings ────────────────────────────────────────────────────────────
  const rsMap = calculateRelativeStrength(ohlcvMap)

  // ── Score every ticker ────────────────────────────────────────────────────
  const emptyFundamentals: Fundamentals = {
    eps: null, epsGrowthYoY: null, revenue: null, revenueGrowthYoY: null,
    netMargin: null, operatingMargin: null, roe: null,
    debtToEquity: null, currentRatio: null, peRatio: null, pegRatio: null,
  }

  const scored: ScannerResult[] = []

  for (const [ticker, ohlcv] of ohlcvMap) {
    const dailyBar = candidates.find((b) => b.T === ticker)
    if (!dailyBar) continue

    const indicators = calculateIndicators(ohlcv)
    const taScore    = calculateTAScore(indicators, ohlcv)
    const faScore    = calculateFAScore(emptyFundamentals)
    const arsRating  = rsMap.get(ticker) ?? 0
    const alsScore   = calculateALSScore(taScore, faScore, arsRating, indicators)

    // Fetch company details (best-effort)
    let companyName = ticker
    let sectorName  = "Unknown"
    let marketCap   = 0

    const { data: details } = await getTickerDetails(ticker)
    if (details) {
      companyName = details.name
      sectorName  = details.sector
      marketCap   = details.marketCap
    }

    const prevClose = ohlcv.length >= 2 ? ohlcv[ohlcv.length - 2].close : dailyBar.c
    const change    = dailyBar.c - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0

    scored.push({
      ticker,
      companyName,
      price:        dailyBar.c,
      change,
      changePct,
      volume:       dailyBar.v,
      marketCap,
      sector:       sectorName,
      patternData:  {},
      taScore,
      faScore,
      arsRating,
      alsScore,
      setupQuality: Math.round(alsScore / 10),
    })
  }

  // ── Top 100 by ALS score ──────────────────────────────────────────────────
  const top100 = scored
    .sort((a, b) => b.alsScore - a.alsScore)
    .slice(0, TOP_N)

  await setCachedScannerResults(CACHE_KEY, top100, today)

  const filtered = applyFilters(top100, { sector, minMarketCap })
  const sorted   = sortResults(filtered, sortBy)

  return NextResponse.json(
    {
      results:        sorted,
      total:          sorted.length,
      portfolioStats: calcPortfolioStats(top100),
      fromCache:      false,
      updatedAt:      new Date().toISOString(),
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
  sector:       string
  minMarketCap: number
}

function applyFilters(results: ScannerResult[], f: Filters): ScannerResult[] {
  return results.filter((r) => {
    if (f.sector !== "all" && r.sector !== f.sector) return false
    if (f.minMarketCap > 0 && r.marketCap < f.minMarketCap) return false
    return true
  })
}

function sortResults(results: ScannerResult[], by: string): ScannerResult[] {
  return [...results].sort((a, b) => {
    switch (by) {
      case "alsScore":  return b.alsScore  - a.alsScore
      case "taScore":   return b.taScore   - a.taScore
      case "arsRating": return b.arsRating - a.arsRating
      case "marketCap": return b.marketCap - a.marketCap
      case "changePct": return b.changePct - a.changePct
      default:          return b.alsScore  - a.alsScore
    }
  })
}

interface PortfolioStats {
  avgChangePct: number
  advancers:    number
  decliners:    number
  unchanged:    number
}

function calcPortfolioStats(results: ScannerResult[]): PortfolioStats | null {
  if (!results.length) return null
  const total      = results.length
  const sumPct     = results.reduce((acc, r) => acc + r.changePct, 0)
  const advancers  = results.filter((r) => r.changePct > 0.05).length
  const decliners  = results.filter((r) => r.changePct < -0.05).length
  return {
    avgChangePct: parseFloat((sumPct / total).toFixed(2)),
    advancers,
    decliners,
    unchanged:    total - advancers - decliners,
  }
}
