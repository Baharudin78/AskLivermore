import type { OHLCV } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** % performance from start to end of a slice */
function performance(ohlcv: OHLCV[], lookbackDays: number): number | null {
  if (ohlcv.length < 2) return null
  const slice    = ohlcv.slice(-Math.min(lookbackDays, ohlcv.length))
  const startBar = slice[0]
  const endBar   = slice[slice.length - 1]
  if (!startBar || startBar.close === 0) return null
  return (endBar.close - startBar.close) / startBar.close
}

/** Convert raw score array to percentile rank 0-99 */
function toPercentile(scores: number[], idx: number): number {
  const score   = scores[idx]
  const below   = scores.filter((s) => s < score).length
  const pct     = below / scores.length
  return Math.min(99, Math.round(pct * 100))
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Calculate IBD-style Relative Strength rating for an entire universe.
 * Weights: 40% last 3 months, 20% each for 1 month, 6 months, 12 months.
 *
 * @param universe Map of ticker → OHLCV array (oldest first)
 * @returns Map of ticker → RS percentile (0-99)
 */
export function calculateRelativeStrength(
  universe: Map<string, OHLCV[]>
): Map<string, number> {
  const tickers   = Array.from(universe.keys())
  const rawScores = new Map<string, number>()

  for (const ticker of tickers) {
    const ohlcv = universe.get(ticker)!

    const perf1m  = performance(ohlcv, 21)
    const perf3m  = performance(ohlcv, 63)
    const perf6m  = performance(ohlcv, 126)
    const perf12m = performance(ohlcv, 252)

    // Skip if we don't have enough data for at least 1m and 3m
    if (perf1m === null || perf3m === null) continue

    const rs =
      (perf3m  * 0.40) +
      (perf1m  * 0.20) +
      ((perf6m  ?? perf3m)  * 0.20) +
      ((perf12m ?? perf6m ?? perf3m) * 0.20)

    rawScores.set(ticker, rs)
  }

  // Convert raw scores to percentile ranks
  const validTickers  = Array.from(rawScores.keys())
  const scoreValues   = validTickers.map((t) => rawScores.get(t)!)
  const result        = new Map<string, number>()

  for (let i = 0; i < validTickers.length; i++) {
    result.set(validTickers[i], toPercentile(scoreValues, i))
  }

  // Tickers without enough data get 0
  for (const ticker of tickers) {
    if (!result.has(ticker)) result.set(ticker, 0)
  }

  return result
}
