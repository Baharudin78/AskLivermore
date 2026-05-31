import { supabase } from "./client"
import type { OHLCV, ScannerResult, Result } from "@/types"

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

/** Read cached OHLCV bars for a ticker. data=null on cache miss or stale. */
export async function getCachedOHLCV(
  ticker: string,
  days:   number
): Promise<Result<OHLCV[] | null>> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - Math.ceil(days * 1.5))

    const { data: rows, error: supaError } = await supabase
      .from("ohlcv_cache")
      .select("date, open, high, low, close, volume, cached_at")
      .eq("ticker", ticker)
      .gte("date", since.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (supaError) return { data: null, error: supaError.message }
    if (!rows?.length) return { data: null, error: null }

    const latest = rows[rows.length - 1]
    if (!isCacheValid(String(latest.cached_at ?? ""), 24 * 60)) {
      return { data: null, error: null }
    }

    return {
      data: rows.map((row) => ({
        time:   String(row.date),
        open:   Number(row.open),
        high:   Number(row.high),
        low:    Number(row.low),
        close:  Number(row.close),
        volume: Number(row.volume),
      })),
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/** Write OHLCV bars to cache (upsert by ticker+date) */
export async function setCachedOHLCV(
  ticker: string,
  bars:   OHLCV[]
): Promise<Result<null>> {
  if (!bars.length) return { data: null, error: null }

  try {
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

    const { error: supaError } = await supabase
      .from("ohlcv_cache")
      .upsert(rows, { onConflict: "ticker,date" })

    if (supaError) return { data: null, error: supaError.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ---------------------------------------------------------------------------
// Scanner results cache (4-hour TTL)
// ---------------------------------------------------------------------------

/** Read cached scanner results for a pattern on a date. data=null on miss or stale. */
export async function getCachedScannerResults(
  pattern: string,
  date:    string = today()
): Promise<Result<ScannerResult[] | null>> {
  try {
    // Freshness check first (single row, cheap)
    const { data: freshnessRows, error: checkError } = await supabase
      .from("scanner_results")
      .select("scanned_at")
      .eq("pattern", pattern)
      .eq("date", date)
      .order("scanned_at", { ascending: false })
      .limit(1)

    if (checkError) return { data: null, error: checkError.message }
    if (!freshnessRows?.length) return { data: null, error: null }

    const scannedAt = freshnessRows[0]?.scanned_at
    if (!isCacheValid(scannedAt ? String(scannedAt) : null, 240)) {
      return { data: null, error: null }
    }

    // Full result fetch
    const { data: results, error: resultsError } = await supabase
      .from("scanner_results")
      .select("*")
      .eq("pattern", pattern)
      .eq("date", date)
      .order("setup_quality", { ascending: false })

    if (resultsError) return { data: null, error: resultsError.message }
    if (!results) return { data: null, error: null }

    return {
      data: results.map((r) => ({
        ticker:       String(r.ticker       ?? ""),
        companyName:  String(r.company_name ?? ""),
        price:        Number(r.price        ?? 0),
        change:       0,   // not stored — computed at scan time
        changePct:    Number(r.change_pct   ?? 0),
        volume:       Number(r.volume       ?? 0),
        marketCap:    Number(r.market_cap   ?? 0),
        sector:       String(r.sector       ?? "Unknown"),
        patternData:  typeof r.pattern_data === "object" && r.pattern_data !== null
          ? r.pattern_data as Record<string, unknown>
          : {},
        taScore:      Number(r.ta_score     ?? 0),
        faScore:      Number(r.fa_score     ?? 0),
        arsRating:    Number(r.ars_rating   ?? 0),
        alsScore:     Number(r.als_score    ?? 0),
        setupQuality: Number(r.setup_quality ?? 0),
      })),
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/** Write scanner results to cache */
export async function setCachedScannerResults(
  pattern: string,
  results: ScannerResult[],
  date:    string = today()
): Promise<Result<null>> {
  if (!results.length) return { data: null, error: null }

  try {
    // Delete stale rows for this pattern+date first
    await supabase
      .from("scanner_results")
      .delete()
      .eq("pattern", pattern)
      .eq("date", date)

    const rows = results.map((r) => ({
      ticker:        r.ticker,
      pattern,
      company_name:  r.companyName,
      price:         r.price,
      change_pct:    r.changePct,
      volume:        r.volume,
      market_cap:    r.marketCap,
      sector:        r.sector,
      pattern_data:  r.patternData,
      ta_score:      r.taScore,
      fa_score:      r.faScore,
      ars_rating:    r.arsRating,
      als_score:     r.alsScore,
      setup_quality: r.setupQuality,
      scanned_at:    new Date().toISOString(),
      date,
    }))

    const { error: supaError } = await supabase.from("scanner_results").insert(rows)
    if (supaError) return { data: null, error: supaError.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ---------------------------------------------------------------------------
// Entry strategy cache (4-hour TTL)
// ---------------------------------------------------------------------------

export async function getCachedEntryStrategy(
  ticker:    string,
  pattern:   string,
  tradeType: string
): Promise<Result<Record<string, unknown> | null>> {
  try {
    const { data, error: supaError } = await supabase
      .from("entry_strategies")
      .select("strategy, expires_at")
      .eq("ticker", ticker)
      .eq("pattern", pattern)
      .eq("trade_type", tradeType)
      .gt("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)

    if (supaError) return { data: null, error: supaError.message }

    const strategy = data?.[0]?.strategy
    if (typeof strategy === "object" && strategy !== null) {
      return { data: strategy as Record<string, unknown>, error: null }
    }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function setCachedEntryStrategy(
  ticker:    string,
  pattern:   string,
  tradeType: string,
  strategy:  Record<string, unknown>
): Promise<Result<null>> {
  try {
    const { error: supaError } = await supabase.from("entry_strategies").insert({
      ticker,
      pattern,
      trade_type:   tradeType,
      strategy,
      generated_at: new Date().toISOString(),
      expires_at:   addMinutes(240),
    })

    if (supaError) return { data: null, error: supaError.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ---------------------------------------------------------------------------
// Fundamentals cache (7-day TTL)
// ---------------------------------------------------------------------------

export async function getCachedFundamentals(
  ticker: string
): Promise<Result<Record<string, unknown> | null>> {
  try {
    const { data, error: supaError } = await supabase
      .from("fundamentals_cache")
      .select("data, expires_at")
      .eq("ticker", ticker)
      .gt("expires_at", new Date().toISOString())
      .limit(1)

    if (supaError) return { data: null, error: supaError.message }

    const fundData = data?.[0]?.data
    if (typeof fundData === "object" && fundData !== null) {
      return { data: fundData as Record<string, unknown>, error: null }
    }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function setCachedFundamentals(
  ticker:   string,
  fundData: Record<string, unknown>
): Promise<Result<null>> {
  try {
    const { error: supaError } = await supabase
      .from("fundamentals_cache")
      .upsert(
        {
          ticker,
          data:       fundData,
          cached_at:  new Date().toISOString(),
          expires_at: addMinutes(7 * 24 * 60),
        },
        { onConflict: "ticker" }
      )

    if (supaError) return { data: null, error: supaError.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
