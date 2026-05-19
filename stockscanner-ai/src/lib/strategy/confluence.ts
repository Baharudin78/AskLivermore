import type { StockIndicators } from "@/types"

export interface ConfluenceSignal {
  indicator: string
  value:     string
  signal:    "bullish" | "neutral" | "bearish"
  note:      string
}

export function analyzeTechnicalConfluence(
  indicators:  StockIndicators,
  patternData: Record<string, unknown>
): ConfluenceSignal[] {
  const signals: ConfluenceSignal[] = []

  // RSI
  if (indicators.rsi14 !== null) {
    const rsi = indicators.rsi14
    if (rsi < 30) {
      signals.push({ indicator: "RSI", value: rsi.toFixed(1), signal: "neutral", note: "Oversold — potential bounce but no momentum yet" })
    } else if (rsi < 50) {
      signals.push({ indicator: "RSI", value: rsi.toFixed(1), signal: "neutral", note: "Building momentum — watch for breakout above 50" })
    } else if (rsi <= 70) {
      signals.push({ indicator: "RSI", value: rsi.toFixed(1), signal: "bullish", note: "Bullish sweet spot — momentum without being overbought" })
    } else {
      signals.push({ indicator: "RSI", value: rsi.toFixed(1), signal: "bearish", note: "Overbought — caution on new entries, extension risk" })
    }
  }

  // MACD
  if (indicators.macd !== null && indicators.macdSignal !== null) {
    const line   = indicators.macd
    const signal = indicators.macdSignal
    const aboveSignal = line > signal
    const aboveZero   = line > 0
    const note = [
      aboveSignal ? "MACD above signal line" : "MACD below signal line",
      aboveZero   ? "· above zero (bullish momentum)" : "· below zero (negative territory)",
    ].join(" ")
    signals.push({
      indicator: "MACD",
      value:     `${line.toFixed(3)} / ${signal.toFixed(3)}`,
      signal:    aboveSignal && aboveZero ? "bullish" : aboveSignal ? "neutral" : "bearish",
      note,
    })
  }

  // Volume ratio
  if (indicators.volRatio !== null) {
    const vr = indicators.volRatio
    if (vr >= 1.5) {
      signals.push({ indicator: "Volume", value: `${vr.toFixed(2)}× avg`, signal: "bullish", note: "Above-average volume confirms price action" })
    } else if (vr >= 0.7) {
      signals.push({ indicator: "Volume", value: `${vr.toFixed(2)}× avg`, signal: "neutral", note: "Normal volume — no red flag but lacking conviction" })
    } else {
      signals.push({ indicator: "Volume", value: `${vr.toFixed(2)}× avg`, signal: "bearish", note: "Low volume — weak participation, be cautious" })
    }
  }

  // SMA 50
  if (indicators.priceVsSMA50 !== null) {
    const pct = indicators.priceVsSMA50
    if (pct > 0) {
      signals.push({ indicator: "SMA 50", value: `+${pct.toFixed(1)}%`, signal: "bullish", note: "Price above 50-day MA — intermediate trend is up" })
    } else {
      signals.push({ indicator: "SMA 50", value: `${pct.toFixed(1)}%`, signal: "bearish", note: "Price below 50-day MA — intermediate trend at risk" })
    }
  }

  // SMA 200
  if (indicators.priceVsSMA200 !== null) {
    const pct = indicators.priceVsSMA200
    if (pct > 0) {
      signals.push({ indicator: "SMA 200", value: `+${pct.toFixed(1)}%`, signal: "bullish", note: "Price above 200-day MA — long-term uptrend intact" })
    } else {
      signals.push({ indicator: "SMA 200", value: `${pct.toFixed(1)}%`, signal: "bearish", note: "Price below 200-day MA — long-term trend unfavorable" })
    }
  }

  // 52-week high proximity
  if (indicators.pctFrom52wHigh !== null) {
    const pct = indicators.pctFrom52wHigh  // negative = below 52wk high
    const absPct = Math.abs(pct)
    if (absPct <= 10) {
      signals.push({ indicator: "52-wk High", value: `${pct.toFixed(1)}%`, signal: "bullish", note: "Near 52-week high — institutional accumulation zone" })
    } else if (absPct <= 25) {
      signals.push({ indicator: "52-wk High", value: `${pct.toFixed(1)}%`, signal: "neutral", note: "Moderate pullback from highs — watch for base building" })
    } else {
      signals.push({ indicator: "52-wk High", value: `${pct.toFixed(1)}%`, signal: "bearish", note: "Far from 52-week high — needs significant base work" })
    }
  }

  // Pattern-specific extras
  const breakoutVol = patternData.breakoutVolume as number | undefined
  if (breakoutVol && breakoutVol > 1.5) {
    signals.push({
      indicator: "Breakout Volume",
      value:     `${breakoutVol.toFixed(2)}× avg`,
      signal:    "bullish",
      note:      "Breakout day had heavy volume — strong institutional buying",
    })
  }

  return signals
}
