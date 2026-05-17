import { BaseScanner } from "./base"
import type { ScannerConfig } from "./base"
import type { OHLCV, StockIndicators, PatternResult } from "@/types"
import { SMA } from "technicalindicators"

export class TrendTemplateScanner extends BaseScanner {
  config: ScannerConfig = {
    name:        "Trend Template",
    slug:        "trend-template",
    description: "Minervini's 8 criteria — Stage 2 uptrend filter",
    tradeType:   ["swing", "long-term"],
    signal:      "bullish",
    category:    ["trend", "filter", "stage2"],
  }

  detect(ohlcv: OHLCV[], ind: StockIndicators): PatternResult | null {
    if (ohlcv.length < 220) return null

    const closes = ohlcv.map((b) => b.close)
    const close  = closes[closes.length - 1]

    // Pre-compute SMA200 from 30 bars ago for slope check
    const sma200arr = SMA.calculate({ period: 200, values: closes })
    const sma200now = sma200arr[sma200arr.length - 1]  ?? null
    const sma200ago = sma200arr.length >= 21 ? sma200arr[sma200arr.length - 22] : null

    const high52w = Math.max(...ohlcv.slice(-252).map((b) => b.high))
    const low52w  = Math.min(...ohlcv.slice(-252).map((b) => b.low))

    // ── 8 Minervini criteria ───────────────────────────────────────────────
    const criteria: boolean[] = [
      // 1. Price above SMA200
      ind.sma200 !== null && close > ind.sma200,
      // 2. SMA200 trending up (vs 1 month ago)
      sma200now !== null && sma200ago !== null && sma200now > sma200ago,
      // 3. Price above SMA150
      ind.sma150 !== null && close > ind.sma150,
      // 4. Price above SMA50
      ind.sma50 !== null && close > ind.sma50,
      // 5. SMA50 > SMA150
      ind.sma50 !== null && ind.sma150 !== null && ind.sma50 > ind.sma150,
      // 6. SMA150 > SMA200
      ind.sma150 !== null && ind.sma200 !== null && ind.sma150 > ind.sma200,
      // 7. Price at least 130% of 52-week low
      low52w > 0 && close >= low52w * 1.30,
      // 8. Price at least 75% of 52-week high
      high52w > 0 && close >= high52w * 0.75,
    ]

    const criteriaCount = criteria.filter(Boolean).length
    const allPass       = criteriaCount === 8

    // Require all 8 to pass
    if (!allPass) return null

    const sma50VsSMA150  = ind.sma50 && ind.sma150  ? (ind.sma50  - ind.sma150)  / ind.sma150  : null
    const sma150VsSMA200 = ind.sma150 && ind.sma200 ? (ind.sma150 - ind.sma200)  / ind.sma200  : null
    const pctFromLow     = low52w  > 0 ? (close - low52w)  / low52w  : null
    const pctFromHigh    = high52w > 0 ? (close - high52w) / high52w : null

    // ── Setup quality: all 8 pass + bonus factors ──────────────────────────
    let quality = 7   // base quality for passing all 8
    if (sma50VsSMA150  && sma50VsSMA150  > 0.05) quality += 0.5
    if (sma150VsSMA200 && sma150VsSMA200 > 0.03) quality += 0.5
    if (pctFromHigh    && pctFromHigh    >= -0.10) quality += 1
    if (ind.rsi14 && ind.rsi14 >= 50 && ind.rsi14 <= 75) quality += 0.5
    if (ind.volRatio && ind.volRatio >= 1.2) quality += 0.5
    quality = Math.min(10, quality)

    return {
      ticker:        "",
      setupQuality:  Math.round(quality * 10) / 10,
      breakoutLevel: high52w,
      notes: [
        `All 8 Minervini criteria pass`,
        `SMA50/150: +${((sma50VsSMA150 ?? 0) * 100).toFixed(1)}%`,
        `SMA150/200: +${((sma150VsSMA200 ?? 0) * 100).toFixed(1)}%`,
        `${((pctFromHigh ?? 0) * 100).toFixed(1)}% from 52wk high`,
      ],
      patternData: {
        criteriaResults:  criteria,
        criteriaCount,
        allPass,
        sma50VsSMA150,
        sma150VsSMA200,
        pctFrom52wLow:  pctFromLow,
        pctFrom52wHigh: pctFromHigh,
      },
    }
  }
}
