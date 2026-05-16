import { supabase } from "./client"
import type { OHLCV, ScannerResult } from "@/types"

// ---------------------------------------------------------------------------
// TTL helpers
// ---------------------------------------------------------------------------

/** Returns true when a timestamp is within ttlMinutes of now */
export function isCacheValid(timestamp: string | null, ttlMinutes: number): boolean {
  if (!timestamp) return false
  const age = Date.now() - new Date(timestamp).getTime()
  return age < ttlMinutes * 60 * 1000
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

// ---------------------------------------------------------------------------
// OHLCV cache (24-hour TTL — daily bars don't change)
// ---------------------------------------------------------------------------

/** Read cached OHLCV bars for a ticker, returns null on cache miss */
export async function getCachedOHLCV(
  ticker: string,
  days: number
): Promise<OHLCV[] | null> {
  const since = new Date()
  since.setDate(since.getDate() - Math.ceil(days * 1.5))

  const { data, error } = await supabase
    .from("ohlcv_cache")
    .select("date, open, high, low, close, volume, cached_at")
    .eq("ticker", ticker)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true })

  if (error || !data?.length) return null

  // Check freshness of the latest entry
  const latest = data[data.length - 1]
  if (!isCacheValid(latest.cached_at, 24 * 60)) return null

  return data.map((row) => ({
    time:   row.date as string,
    open:   row.open  as number,
    high:   row.high  as number,
    low:    row.low   as number,
    close:  row.close as number,
    volume: row.volume as number,
  }))
}

/** Write OHLCV bars to cache (upsert by ticker+date) */
export async function setCachedOHLCV(
  ticker: string,
  bars:   OHLCV[]
): Promise<void> {
  if (!bars.length) return

  const rows = bars.map((b) => ({
    ticker,
    date:      b.time,
    open:      b.open,
    high:      b.high,
    low:       b.low,
    close:     b.close,
    volume:    b.volume,
    cached_at: new Date().toISOString(),
  }))

  await supabase
    .from("ohlcv_cache")
    .upsert(rows, { onConflict: "ticker,date" })
}

// ---------------------------------------------------------------------------
// Scanner results cache (4-hour TTL)
// ---------------------------------------------------------------------------

/** Read cached scanner results for a pattern on today's date */
export async function getCachedScannerResults(
  pattern: string,
  date:    string = today()
): Promise<ScannerResult[] | null> {
  const { data, error } = await supabase
    .from("scanner_results")
    .select("*")
    .eq("pattern", pattern)
    .eq("date", date)
    .order("scanned_at", { ascending: false })
    .limit(1)

  if (error || !data?.length) return null

  const row       = data[0] as Record<string, unknown>
  const scannedAt = row.scanned_at as string | null
  if (!isCacheValid(scannedAt, 240)) return null  // 4 hours

  // Re-fetch all results for this pattern+date
  const { data: results } = await supabase
    .from("scanner_results")
    .select("*")
    .eq("pattern", pattern)
    .eq("date", date)
    .order("setup_quality", { ascending: false })

  if (!results) return null

  return results.map((r) => ({
    ticker:       r.ticker        as string,
    companyName:  r.company_name  as string,
    price:        r.price         as number,
    change:       0,
    changePct:    r.change_pct    as number,
    volume:       r.volume        as number,
    marketCap:    r.market_cap    as number,
    sector:       r.sector        as string,
    patternData:  r.pattern_data  as Record<string, unknown>,
    taScore:      r.ta_score      as number,
    faScore:      r.fa_score      as number,
    arsRating:    r.ars_rating    as number,
    alsScore:     r.als_score     as number,
    setupQuality: r.setup_quality as number,
  }))
}

/** Write scanner results to cache */
export async function setCachedScannerResults(
  pattern: string,
  results: ScannerResult[],
  date:    string = today()
): Promise<void> {
  if (!results.length) return

  // Delete stale rows for this pattern+date first
  await supabase
    .from("scanner_results")
    .delete()
    .eq("pattern", pattern)
    .eq("date", date)

  const rows = results.map((r) => ({
    ticker:       r.ticker,
    pattern,
    company_name: r.companyName,
    price:        r.price,
    change_pct:   r.changePct,
    volume:       r.volume,
    market_cap:   r.marketCap,
    sector:       r.sector,
    pattern_data: r.patternData,
    ta_score:     r.taScore,
    fa_score:     r.faScore,
    ars_rating:   r.arsRating,
    als_score:    r.alsScore,
    setup_quality: r.setupQuality,
    scanned_at:   new Date().toISOString(),
    date,
  }))

  await supabase.from("scanner_results").insert(rows)
}

// ---------------------------------------------------------------------------
// Entry strategy cache (4-hour TTL)
// ---------------------------------------------------------------------------

export async function getCachedEntryStrategy(
  ticker:    string,
  pattern:   string,
  tradeType: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from("entry_strategies")
    .select("strategy, expires_at")
    .eq("ticker", ticker)
    .eq("pattern", pattern)
    .eq("trade_type", tradeType)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)

  return (data?.[0]?.strategy as Record<string, unknown>) ?? null
}

export async function setCachedEntryStrategy(
  ticker:    string,
  pattern:   string,
  tradeType: string,
  strategy:  Record<string, unknown>
): Promise<void> {
  await supabase.from("entry_strategies").insert({
    ticker,
    pattern,
    trade_type:   tradeType,
    strategy,
    generated_at: new Date().toISOString(),
    expires_at:   addMinutes(240),
  })
}

// ---------------------------------------------------------------------------
// Fundamentals cache (7-day TTL)
// ---------------------------------------------------------------------------

export async function getCachedFundamentals(
  ticker: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from("fundamentals_cache")
    .select("data, expires_at")
    .eq("ticker", ticker)
    .gt("expires_at", new Date().toISOString())
    .limit(1)

  return (data?.[0]?.data as Record<string, unknown>) ?? null
}

export async function setCachedFundamentals(
  ticker: string,
  data:   Record<string, unknown>
): Promise<void> {
  await supabase
    .from("fundamentals_cache")
    .upsert(
      {
        ticker,
        data,
        cached_at:  new Date().toISOString(),
        expires_at: addMinutes(7 * 24 * 60),
      },
      { onConflict: "ticker" }
    )
}
