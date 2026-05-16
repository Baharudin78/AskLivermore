import type { StockIndicators, Fundamentals, OHLCV } from "@/types"
import { SMA } from "technicalindicators"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function last<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// ---------------------------------------------------------------------------
// Technical Analysis Score (0-10)
// ---------------------------------------------------------------------------

/**
 * Score a stock's technical setup on a 0-10 scale.
 * Based on trend alignment, momentum, price position, and volume.
 */
export function calculateTAScore(
  ind:   StockIndicators,
  ohlcv: OHLCV[]
): number {
  let score = 0
  const close = ohlcv[ohlcv.length - 1]?.close ?? 0

  // ── Trend (max 4 pts) ────────────────────────────────────────────────────
  if (ind.sma50  !== null && close > ind.sma50)  score += 1
  if (ind.sma200 !== null && close > ind.sma200) score += 1
  if (ind.sma50 !== null && ind.sma200 !== null && ind.sma50 > ind.sma200) score += 1

  // SMA200 trending up: compare current vs 20 bars ago
  if (ohlcv.length >= 220) {
    const closes    = ohlcv.map((b) => b.close)
    const sma200arr = SMA.calculate({ period: 200, values: closes })
    const sma200now = last(sma200arr)
    const sma200ago = sma200arr.length >= 20 ? sma200arr[sma200arr.length - 21] : null
    if (sma200now !== null && sma200ago !== null && sma200now > sma200ago) score += 1
  }

  // ── Momentum (max 3 pts) ─────────────────────────────────────────────────
  if (ind.rsi14 !== null) {
    if (ind.rsi14 >= 50 && ind.rsi14 <= 70)  score += 1.5   // sweet spot
    else if (ind.rsi14 > 70 && ind.rsi14 <= 80) score += 0.75 // overbought but bullish
  }
  if (ind.macd !== null && ind.macdSignal !== null && ind.macd > ind.macdSignal) score += 1
  if (ind.macd !== null && ind.macd > 0) score += 0.5

  // ── Price Position (max 2 pts) ───────────────────────────────────────────
  if (ind.pctFrom52wHigh !== null) {
    if (ind.pctFrom52wHigh >= -0.10) score += 2   // within 10% of 52wk high
    else if (ind.pctFrom52wHigh >= -0.25) score += 1  // within 25%
  }

  // ── Volume (max 1 pt) ────────────────────────────────────────────────────
  if (ind.volRatio !== null && ind.volRatio >= 1.2) score += 1

  return clamp(Math.round(score * 10) / 10, 0, 10)
}

// ---------------------------------------------------------------------------
// Fundamental Analysis Score (0-10)
// ---------------------------------------------------------------------------

/**
 * Score a stock's fundamental quality on a 0-10 scale.
 */
export function calculateFAScore(fund: Fundamentals): number {
  let score = 0

  // ── Profitability (max 3 pts) ────────────────────────────────────────────
  if (fund.roe !== null) {
    if (fund.roe > 0.20)       score += 1
    else if (fund.roe > 0.10)  score += 0.5
  }
  if (fund.netMargin !== null) {
    if (fund.netMargin > 0.15)      score += 1
    else if (fund.netMargin > 0.05) score += 0.5
  }
  if (fund.operatingMargin !== null) {
    if (fund.operatingMargin > 0.15)      score += 1
    else if (fund.operatingMargin > 0.05) score += 0.5
  }

  // ── Growth (max 3 pts) ───────────────────────────────────────────────────
  if (fund.epsGrowthYoY !== null) {
    if (fund.epsGrowthYoY > 0.25)      score += 1.5
    else if (fund.epsGrowthYoY > 0.10) score += 0.75
    else if (fund.epsGrowthYoY > 0)    score += 0.25
  }
  if (fund.revenueGrowthYoY !== null) {
    if (fund.revenueGrowthYoY > 0.15)      score += 1.5
    else if (fund.revenueGrowthYoY > 0.05) score += 0.75
    else if (fund.revenueGrowthYoY > 0)    score += 0.25
  }

  // ── Balance Sheet Health (max 2 pts) ─────────────────────────────────────
  if (fund.debtToEquity !== null) {
    if (fund.debtToEquity < 0.5)       score += 1
    else if (fund.debtToEquity < 1.0)  score += 0.5
  }
  if (fund.currentRatio !== null) {
    if (fund.currentRatio > 2.0)       score += 1
    else if (fund.currentRatio > 1.5)  score += 0.5
  }

  // ── Valuation (max 2 pts) ────────────────────────────────────────────────
  if (fund.pegRatio !== null) {
    if (fund.pegRatio > 0 && fund.pegRatio <= 1.0)  score += 2
    else if (fund.pegRatio <= 1.5)                  score += 1
    else if (fund.pegRatio <= 2.0)                  score += 0.5
  }

  // If fundamentals are mostly null (no access), return neutral 5
  const hasData =
    fund.roe !== null || fund.epsGrowthYoY !== null || fund.netMargin !== null
  if (!hasData) return 5

  return clamp(Math.round(score * 10) / 10, 0, 10)
}

// ---------------------------------------------------------------------------
// Composite ALS Score (0-99)
// ---------------------------------------------------------------------------

/**
 * Composite ALS (Ask Livermore Score) on a 0-99 scale.
 * Weights: TA 35%, FA 25%, RS 30%, Momentum 10%
 */
export function calculateALSScore(
  taScore:    number,
  faScore:    number,
  arsRating:  number,   // 0-99 percentile
  ind:        StockIndicators
): number {
  // Normalize TA and FA from 0-10 → 0-99
  const taNorm = (taScore / 10) * 99
  const faNorm = (faScore / 10) * 99

  // Momentum sub-score (0-99) from RSI + MACD
  let momentumRaw = 0
  if (ind.rsi14 !== null) {
    // RSI 50-70 = bullish zone → map to 0-99
    const rsiNorm = clamp((ind.rsi14 - 30) / 60, 0, 1)
    momentumRaw += rsiNorm * 60
  }
  if (ind.macd !== null && ind.macdSignal !== null) {
    if (ind.macd > ind.macdSignal) momentumRaw += 20
    if (ind.macd > 0)              momentumRaw += 19
  }
  const momentumNorm = clamp(momentumRaw, 0, 99)

  const als =
    (taNorm       * 0.35) +
    (faNorm       * 0.25) +
    (arsRating    * 0.30) +
    (momentumNorm * 0.10)

  return clamp(Math.round(als), 0, 99)
}
