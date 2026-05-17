import { BaseScanner } from "./base"
import type { ScannerConfig } from "./base"
import type { OHLCV, StockIndicators, PatternResult } from "@/types"
import { MACD } from "technicalindicators"

export class MACDCrossScanner extends BaseScanner {
  config: ScannerConfig = {
    name:        "MACD Cross",
    slug:        "macd-cross",
    description: "MACD line crossing above signal — bullish momentum shift",
    tradeType:   ["swing", "day"],
    signal:      "bullish",
    category:    ["momentum", "indicator"],
  }

  detect(ohlcv: OHLCV[], ind: StockIndicators): PatternResult | null {
    if (ohlcv.length < 50) return null

    const closes = ohlcv.map((b) => b.close)
    const close  = closes[closes.length - 1]

    // ── Trend filter: above SMA50 and SMA200 ──────────────────────────────
    if (!ind.sma50 || !ind.sma200) return null
    if (close < ind.sma50 || close < ind.sma200) return null

    // ── Compute MACD for the last 6 bars to detect recent crossover ────────
    const macdSeries = MACD.calculate({
      values:             closes,
      fastPeriod:         12,
      slowPeriod:         26,
      signalPeriod:       9,
      SimpleMAOscillator: false,
      SimpleMASignal:     false,
    })

    if (macdSeries.length < 4) return null

    const recent = macdSeries.slice(-4)

    // Find where MACD crossed above signal within last 3 bars
    let crossDaysAgo = -1
    for (let i = recent.length - 1; i >= 1; i--) {
      const cur  = recent[i]
      const prev = recent[i - 1]
      if (
        cur.MACD  !== undefined && cur.signal  !== undefined &&
        prev.MACD !== undefined && prev.signal !== undefined &&
        cur.MACD  > cur.signal &&
        prev.MACD <= prev.signal
      ) {
        crossDaysAgo = recent.length - 1 - i
        break
      }
    }

    if (crossDaysAgo === -1) return null   // no cross in last 3 bars

    const latest        = macdSeries[macdSeries.length - 1]
    const macdValue     = latest.MACD      ?? 0
    const signalValue   = latest.signal    ?? 0
    const histogram     = latest.histogram ?? 0
    const aboveZeroLine = macdValue > 0

    // ── Setup quality ──────────────────────────────────────────────────────
    let quality = 5
    if (crossDaysAgo === 0) quality += 2      // fresh cross today
    if (crossDaysAgo === 1) quality += 1.5
    if (aboveZeroLine)      quality += 1.5    // cross above zero = stronger signal
    if (ind.rsi14 && ind.rsi14 >= 50 && ind.rsi14 <= 70) quality += 0.5
    if (ind.volRatio && ind.volRatio >= 1.2) quality += 0.5
    quality = Math.min(10, quality)

    return {
      ticker:        "",
      setupQuality:  Math.round(quality * 10) / 10,
      breakoutLevel: close * 1.002,
      notes: [
        `MACD crossed signal ${crossDaysAgo === 0 ? "today" : `${crossDaysAgo} day${crossDaysAgo > 1 ? "s" : ""} ago`}`,
        aboveZeroLine ? "Cross above zero line ✓" : "Cross below zero line",
        `MACD: ${macdValue.toFixed(3)}, Signal: ${signalValue.toFixed(3)}`,
      ],
      patternData: {
        crossDaysAgo,
        aboveZeroLine,
        macdValue,
        signalValue,
        histogram,
      },
    }
  }
}
