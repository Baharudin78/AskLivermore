import {
  SMA, EMA, RSI, MACD, BollingerBands, ATR, Stochastic,
} from "technicalindicators"
import type { OHLCV, StockIndicators } from "@/types"

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Return last element of array, or null if empty */
function last<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}

/** Rolling max over a window */
function rollingMax(values: number[], window: number): number {
  if (values.length < window) return Math.max(...values)
  return Math.max(...values.slice(-window))
}

/** Rolling min over a window */
function rollingMin(values: number[], window: number): number {
  if (values.length < window) return Math.min(...values)
  return Math.min(...values.slice(-window))
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

/**
 * Calculate all technical indicators for a given OHLCV series.
 * @param ohlcv - Array of OHLCV bars, oldest bar first
 * @returns StockIndicators with all calculated values (null when data insufficient)
 */
export function calculateIndicators(ohlcv: OHLCV[]): StockIndicators {
  if (ohlcv.length < 10) {
    return emptyIndicators()
  }

  const closes  = ohlcv.map((b) => b.close)
  const highs   = ohlcv.map((b) => b.high)
  const lows    = ohlcv.map((b) => b.low)
  const volumes = ohlcv.map((b) => b.volume)
  const close   = closes[closes.length - 1]

  // ── Simple Moving Averages ──────────────────────────────────────────────
  const sma10  = last(SMA.calculate({ period: 10,  values: closes }))  ?? null
  const sma20  = last(SMA.calculate({ period: 20,  values: closes }))  ?? null
  const sma50  = last(SMA.calculate({ period: 50,  values: closes }))  ?? null
  const sma150 = last(SMA.calculate({ period: 150, values: closes }))  ?? null
  const sma200 = last(SMA.calculate({ period: 200, values: closes }))  ?? null

  // ── Exponential Moving Averages ─────────────────────────────────────────
  const ema21 = last(EMA.calculate({ period: 21, values: closes })) ?? null
  const ema65 = last(EMA.calculate({ period: 65, values: closes })) ?? null

  // ── RSI ─────────────────────────────────────────────────────────────────
  const rsi14 = last(RSI.calculate({ period: 14, values: closes })) ?? null

  // ── MACD ────────────────────────────────────────────────────────────────
  const macdResults = MACD.calculate({
    values:         closes,
    fastPeriod:     12,
    slowPeriod:     26,
    signalPeriod:   9,
    SimpleMAOscillator: false,
    SimpleMASignal:     false,
  })
  const macdLast   = last(macdResults)
  const macd       = macdLast?.MACD       ?? null
  const macdSignal = macdLast?.signal     ?? null
  const macdHist   = macdLast?.histogram  ?? null

  // ── Bollinger Bands ──────────────────────────────────────────────────────
  const bbResults = BollingerBands.calculate({
    period: 20, stdDev: 2, values: closes,
  })
  const bbLast   = last(bbResults)
  const bbUpper  = bbLast?.upper  ?? null
  const bbMiddle = bbLast?.middle ?? null
  const bbLower  = bbLast?.lower  ?? null

  // ── ATR ─────────────────────────────────────────────────────────────────
  const atrDaily = last(
    ATR.calculate({ period: 14, high: highs, low: lows, close: closes })
  ) ?? null

  // ── Stochastic ──────────────────────────────────────────────────────────
  const stochResults = Stochastic.calculate({
    high: highs, low: lows, close: closes,
    period: 14, signalPeriod: 3,
  })
  const stochLast = last(stochResults)
  const stochK    = stochLast?.k ?? null
  const stochD    = stochLast?.d ?? null

  // ── Volume ratio (current vol / 50-day avg vol) ─────────────────────────
  const volSma50Arr = SMA.calculate({ period: 50, values: volumes })
  const volSma50    = last(volSma50Arr)
  const volRatio    = volSma50 && volSma50 > 0
    ? volumes[volumes.length - 1] / volSma50
    : null

  // ── Relative position metrics (pure math) ───────────────────────────────
  const high52w = rollingMax(closes, 252)
  const low52w  = rollingMin(closes, 252)

  const pctFrom52wHigh = high52w !== 0
    ? (close - high52w) / high52w
    : null

  const pctFrom52wLow = low52w !== 0
    ? (close - low52w) / low52w
    : null

  const priceVsSMA50  = sma50  && sma50  !== 0 ? (close - sma50)  / sma50  : null
  const priceVsSMA200 = sma200 && sma200 !== 0 ? (close - sma200) / sma200 : null
  const sma50VsSMA200 = sma50 && sma200 && sma200 !== 0
    ? (sma50 - sma200) / sma200
    : null

  return {
    sma10, sma20, sma50, sma150, sma200,
    ema21, ema65,
    rsi14,
    macd, macdSignal, macdHist,
    bbUpper, bbMiddle, bbLower,
    atrDaily,
    stochK, stochD,
    volRatio,
    pctFrom52wHigh,
    pctFrom52wLow,
    priceVsSMA50,
    priceVsSMA200,
    sma50VsSMA200,
  }
}

/** All-null StockIndicators for stocks with insufficient data */
function emptyIndicators(): StockIndicators {
  return {
    sma10: null, sma20: null, sma50: null, sma150: null, sma200: null,
    ema21: null, ema65: null,
    rsi14: null,
    macd: null, macdSignal: null, macdHist: null,
    bbUpper: null, bbMiddle: null, bbLower: null,
    atrDaily: null,
    stochK: null, stochD: null,
    volRatio: null,
    pctFrom52wHigh: null, pctFrom52wLow: null,
    priceVsSMA50: null, priceVsSMA200: null, sma50VsSMA200: null,
  }
}
