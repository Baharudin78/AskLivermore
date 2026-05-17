import type { OHLCV, StockIndicators, SignalType, TimeFrame, PatternResult } from "@/types"

export interface ScannerConfig {
  name:        string
  slug:        string
  description: string
  tradeType:   TimeFrame[]
  signal:      SignalType
  category:    string[]
}

export abstract class BaseScanner {
  abstract config: ScannerConfig

  /**
   * Run pattern detection on a single stock.
   * @returns PatternResult if pattern is detected, null otherwise
   */
  abstract detect(ohlcv: OHLCV[], indicators: StockIndicators): PatternResult | null
}

// ---------------------------------------------------------------------------
// Shared pivot-finding utility used by multiple scanners
// ---------------------------------------------------------------------------

export interface Pivot {
  index: number
  price: number
  type:  "high" | "low"
}

/**
 * Find swing pivots (local highs and lows) using a left/right lookahead window.
 * A pivot high: highest bar within ±window bars around it.
 * A pivot low:  lowest bar within ±window bars around it.
 */
export function findPivots(ohlcv: OHLCV[], window = 5): Pivot[] {
  const pivots: Pivot[] = []
  const len = ohlcv.length

  for (let i = window; i < len - window; i++) {
    const bar   = ohlcv[i]
    const left  = ohlcv.slice(i - window, i)
    const right = ohlcv.slice(i + 1, i + window + 1)

    const isHigh =
      left.every((b) => b.high  <= bar.high) &&
      right.every((b) => b.high <= bar.high)

    const isLow =
      left.every((b) => b.low  >= bar.low) &&
      right.every((b) => b.low >= bar.low)

    if (isHigh) pivots.push({ index: i, price: bar.high, type: "high" })
    if (isLow)  pivots.push({ index: i, price: bar.low,  type: "low" })
  }

  return pivots
}

/** Rolling max of closes over last n bars */
export function rollingMax(ohlcv: OHLCV[], n: number): number {
  const slice = ohlcv.slice(-n)
  return Math.max(...slice.map((b) => b.high))
}

/** Rolling min of closes over last n bars */
export function rollingMin(ohlcv: OHLCV[], n: number): number {
  const slice = ohlcv.slice(-n)
  return Math.min(...slice.map((b) => b.low))
}

/** Linear regression slope of an array — positive = uptrend */
export function slope(values: number[]): number {
  const n    = values.length
  const xAvg = (n - 1) / 2
  const yAvg = values.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xAvg) * (values[i] - yAvg)
    den += (i - xAvg) ** 2
  }
  return den === 0 ? 0 : num / den
}
