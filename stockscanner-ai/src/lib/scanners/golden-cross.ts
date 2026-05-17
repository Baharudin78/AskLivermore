import { BaseScanner, slope } from "./base"
import type { ScannerConfig } from "./base"
import type { OHLCV, StockIndicators, PatternResult } from "@/types"
import { SMA } from "technicalindicators"

export class GoldenCrossScanner extends BaseScanner {
  config: ScannerConfig = {
    name:        "Golden Cross",
    slug:        "golden-cross",
    description: "SMA50 crossing above SMA200 — major bullish trend signal",
    tradeType:   ["swing", "long-term"],
    signal:      "bullish",
    category:    ["trend", "moving-average"],
  }

  detect(ohlcv: OHLCV[], ind: StockIndicators): PatternResult | null {
    if (ohlcv.length < 220) return null

    const closes = ohlcv.map((b) => b.close)
    const close  = closes[closes.length - 1]

    // Compute recent SMA50 and SMA200 series (last 12 bars)
    const sma50arr  = SMA.calculate({ period: 50,  values: closes })
    const sma200arr = SMA.calculate({ period: 200, values: closes })

    if (sma50arr.length < 12 || sma200arr.length < 12) return null

    const sma50recent  = sma50arr.slice(-12)
    const sma200recent = sma200arr.slice(-12)

    // ── Find where SMA50 crossed above SMA200 in last 10 bars ─────────────
    let crossDaysAgo = -1
    for (let i = sma50recent.length - 1; i >= 1; i--) {
      const curAbove  = sma50recent[i]  > sma200recent[i]
      const prevBelow = sma50recent[i - 1] <= sma200recent[i - 1]
      if (curAbove && prevBelow) {
        crossDaysAgo = sma50recent.length - 1 - i
        break
      }
    }

    if (crossDaysAgo === -1) return null  // no cross in last 10 bars

    const sma50now  = sma50arr[sma50arr.length   - 1]
    const sma200now = sma200arr[sma200arr.length - 1]

    // ── Both MAs must be trending up ───────────────────────────────────────
    const sma50slope  = slope(sma50arr.slice(-10))
    const sma200slope = slope(sma200arr.slice(-10))

    if (sma50slope <= 0 || sma200slope <= 0) return null

    // ── Price must be above both MAs ───────────────────────────────────────
    const priceAboveBothMAs = close > sma50now && close > sma200now
    if (!priceAboveBothMAs) return null

    // ── Volume expansion: check if volume was above avg around cross ───────
    const crossIdx      = ohlcv.length - 1 - crossDaysAgo
    const crossWindow   = ohlcv.slice(Math.max(0, crossIdx - 2), crossIdx + 3)
    const priorVolumes  = ohlcv.slice(crossIdx - 20, crossIdx).map((b) => b.volume)
    const avgPriorVol   = priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length
    const crossAvgVol   = crossWindow.reduce((a, b) => a + b.volume, 0) / crossWindow.length
    const volumeExpansion = crossAvgVol > avgPriorVol * 1.1

    // ── Setup quality ──────────────────────────────────────────────────────
    let quality = 6
    if (crossDaysAgo <= 2)   quality += 1.5   // fresh cross
    if (crossDaysAgo <= 5)   quality += 0.5
    if (volumeExpansion)     quality += 1
    if (sma200slope > 0.05)  quality += 0.5   // strong SMA200 slope
    if (ind.rsi14 && ind.rsi14 >= 50) quality += 0.5
    quality = Math.min(10, quality)

    return {
      ticker:        "",
      setupQuality:  Math.round(quality * 10) / 10,
      breakoutLevel: Math.max(sma50now, close),
      notes: [
        `Golden Cross occurred ${crossDaysAgo === 0 ? "today" : `${crossDaysAgo} days ago`}`,
        `SMA50: ${sma50now.toFixed(2)} > SMA200: ${sma200now.toFixed(2)}`,
        volumeExpansion ? "Volume expansion at cross ✓" : "Low volume at cross",
        `SMA50 slope: ${sma50slope > 0 ? "↑" : "↓"} | SMA200 slope: ${sma200slope > 0 ? "↑" : "↓"}`,
      ],
      patternData: {
        crossDaysAgo,
        sma50Value:        sma50now,
        sma200Value:       sma200now,
        sma50Slope:        sma50slope,
        sma200Slope:       sma200slope,
        priceAboveBothMAs,
        volumeExpansion,
      },
    }
  }
}
