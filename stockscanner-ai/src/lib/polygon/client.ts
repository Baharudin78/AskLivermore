import type { OHLCV, PolygonDailyBar, TickerDetails, Fundamentals, Result } from "@/types"

const BASE_URL = "https://api.polygon.io"
const API_KEY  = process.env.POLYGON_API_KEY!

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Fetch with exponential backoff retry.
 * Polygon free tier: 5 req/min — retry on 429.
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { next: { revalidate: 3600 } })

    if (res.status === 429) {
      await sleep(12_000 * Math.pow(2, attempt))
      continue
    }

    return res
  }
  throw new Error(`Polygon fetch failed after ${retries} retries: ${url}`)
}

async function polygonGet<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const url = `${BASE_URL}${path}${sep}apiKey=${API_KEY}`
  const res = await fetchWithRetry(url)

  if (!res.ok) {
    throw new Error(`Polygon API error ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// API types (raw Polygon responses)
// ---------------------------------------------------------------------------

interface PolygonGroupedDailyResponse {
  resultsCount: number
  results:      PolygonDailyBar[]
  status:       string
}

interface PolygonBarsResponse {
  resultsCount: number
  results:      Array<{
    t: number
    o: number
    h: number
    l: number
    c: number
    v: number
    vw: number
  }>
  status:  string
  ticker?: string
}

interface PolygonTickerDetailsResponse {
  results: {
    ticker:                          string
    name:                            string
    sic_description:                 string
    market_cap:                      number
    share_class_shares_outstanding:  number
    primary_exchange:                string
    locale:                          string
  }
}

interface PolygonFinancialsResponse {
  results: Array<{
    financials: {
      income_statement: {
        basic_earnings_per_share?: { value: number }
        revenues?:                 { value: number }
        net_income_loss?:          { value: number }
        operating_income_loss?:    { value: number }
      }
      balance_sheet: {
        equity?:              { value: number }
        assets?:              { value: number }
        liabilities?:         { value: number }
        current_assets?:      { value: number }
        current_liabilities?: { value: number }
      }
    }
    fiscal_period: string
    fiscal_year:   string
  }>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch grouped daily OHLCV bars for all stocks on a given date.
 * Used as the universe for scanners.
 */
export async function getGroupedDaily(date: string): Promise<Result<PolygonDailyBar[]>> {
  try {
    const data = await polygonGet<PolygonGroupedDailyResponse>(
      `/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&include_otc=false`
    )
    return { data: data.results ?? [], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/**
 * Fetch historical OHLCV bars for a single ticker.
 * @param days Number of trading days of history (approx, calendar days = days * 1.4)
 */
export async function getStockBars(ticker: string, days: number): Promise<Result<OHLCV[]>> {
  try {
    const toDate   = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - Math.ceil(days * 1.4))

    const from = fromDate.toISOString().split("T")[0]
    const to   = toDate.toISOString().split("T")[0]

    const data = await polygonGet<PolygonBarsResponse>(
      `/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${days * 2}`
    )

    if (!data.results?.length) return { data: [], error: null }

    return {
      data: data.results.map((bar) => ({
        time:   new Date(bar.t).toISOString().split("T")[0],
        open:   bar.o,
        high:   bar.h,
        low:    bar.l,
        close:  bar.c,
        volume: bar.v,
      })),
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/**
 * Fetch company details: name, sector, market cap, shares outstanding.
 */
export async function getTickerDetails(ticker: string): Promise<Result<TickerDetails>> {
  try {
    const data = await polygonGet<PolygonTickerDetailsResponse>(
      `/v3/reference/tickers/${ticker}`
    )
    const r = data.results
    return {
      data: {
        ticker:            r.ticker,
        name:              r.name,
        sector:            r.sic_description ?? "Unknown",
        industry:          r.sic_description ?? "Unknown",
        marketCap:         r.market_cap ?? 0,
        sharesOutstanding: r.share_class_shares_outstanding ?? 0,
        exchange:          r.primary_exchange ?? "Unknown",
        country:           r.locale === "us" ? "US" : r.locale,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/**
 * Fetch fundamental financial data for a ticker.
 * Uses Polygon's Financials API (requires Starter plan or higher).
 * Returns empty fundamentals gracefully for free-tier accounts.
 */
export async function getStockFinancials(ticker: string): Promise<Result<Fundamentals>> {
  try {
    const data = await polygonGet<PolygonFinancialsResponse>(
      `/vX/reference/financials?ticker=${ticker}&limit=4&sort=period_of_report_date`
    )

    const latest = data.results?.[0]
    const prior  = data.results?.[1]

    if (!latest) return { data: emptyFundamentals(), error: null }

    const inc  = latest.financials.income_statement
    const bal  = latest.financials.balance_sheet
    const pinc = prior?.financials.income_statement

    const revenue      = inc.revenues?.value ?? null
    const priorRevenue = pinc?.revenues?.value ?? null
    const eps          = inc.basic_earnings_per_share?.value ?? null
    const priorEps     = pinc?.basic_earnings_per_share?.value ?? null
    const netIncome    = inc.net_income_loss?.value ?? null
    const opIncome     = inc.operating_income_loss?.value ?? null
    const equity       = bal.equity?.value ?? null
    const liabilities  = bal.liabilities?.value ?? null
    const currAssets   = bal.current_assets?.value ?? null
    const currLiab     = bal.current_liabilities?.value ?? null

    return {
      data: {
        eps,
        epsGrowthYoY:     eps && priorEps && priorEps !== 0
          ? (eps - priorEps) / Math.abs(priorEps)
          : null,
        revenue,
        revenueGrowthYoY: revenue && priorRevenue && priorRevenue !== 0
          ? (revenue - priorRevenue) / Math.abs(priorRevenue)
          : null,
        netMargin:        revenue && netIncome ? netIncome / revenue : null,
        operatingMargin:  revenue && opIncome  ? opIncome  / revenue : null,
        roe:              equity && netIncome && equity !== 0
          ? netIncome / equity
          : null,
        debtToEquity:     equity && liabilities && equity !== 0
          ? liabilities / equity
          : null,
        currentRatio:     currLiab && currAssets && currLiab !== 0
          ? currAssets / currLiab
          : null,
        peRatio:  null,
        pegRatio: null,
      },
      error: null,
    }
  } catch {
    // Graceful fallback for free-tier accounts without financials access
    return { data: emptyFundamentals(), error: null }
  }
}

function emptyFundamentals(): Fundamentals {
  return {
    eps: null, epsGrowthYoY: null, revenue: null, revenueGrowthYoY: null,
    netMargin: null, operatingMargin: null, roe: null,
    debtToEquity: null, currentRatio: null, peRatio: null, pegRatio: null,
  }
}
