import type { OHLCV, StockIndicators } from "@/types"

export interface EntryLevels {
  entryZoneLow:  number
  entryZoneHigh: number
  stopLoss:      number
  targets: Array<{ price: number; pctGain: number; sizePct: number }>
  riskReward:    number
  riskPct:       number
}

export function calculateEntryLevels(
  pattern:     string,
  patternData: Record<string, unknown>,
  indicators:  StockIndicators,
  ohlcv:       OHLCV[]
): EntryLevels {
  const atr     = indicators.atrDaily ?? fallbackATR(ohlcv)
  const lastBar = ohlcv[ohlcv.length - 1]

  switch (pattern) {
    case "bull-flag":  return bullFlagLevels(patternData, atr, lastBar)
    case "vcp":        return vcpLevels(patternData, atr, ohlcv)
    case "macd-cross": return macdCrossLevels(patternData, atr, lastBar, ohlcv)
    case "golden-cross": return goldenCrossLevels(indicators, atr, lastBar, ohlcv)
    default:           return trendLevels(indicators, atr, lastBar)
  }
}

function bullFlagLevels(
  data:    Record<string, unknown>,
  atr:     number,
  lastBar: OHLCV
): EntryLevels {
  const breakout    = (data.breakoutLevel as number) ?? lastBar.close * 1.03
  const poleHeight  = (data.poleHeight   as number) ?? lastBar.close * 0.25
  const flagLow     = (data.flagLow      as number) ?? lastBar.close * 0.95

  const entryLow  = breakout
  const entryHigh = breakout * 1.005
  const sl        = Math.max(flagLow - atr * 0.5, entryLow * 0.93)
  const risk      = entryLow - sl

  const t1 = entryLow + poleHeight * 0.5
  const t2 = entryLow + poleHeight
  const t3 = entryLow + poleHeight * 1.5

  return {
    entryZoneLow:  round(entryLow),
    entryZoneHigh: round(entryHigh),
    stopLoss:      round(sl),
    targets: [
      { price: round(t1), pctGain: pct(entryLow, t1), sizePct: 50 },
      { price: round(t2), pctGain: pct(entryLow, t2), sizePct: 30 },
      { price: round(t3), pctGain: pct(entryLow, t3), sizePct: 20 },
    ],
    riskReward: round2((t1 - entryLow) / Math.max(risk, 0.01)),
    riskPct:    round2((risk / entryLow) * 100),
  }
}

function vcpLevels(
  data:    Record<string, unknown>,
  atr:     number,
  ohlcv:   OHLCV[]
): EntryLevels {
  const pivotHigh  = (data.latestPivotHigh as number) ?? ohlcv[ohlcv.length - 1].high
  const pivotLow   = (data.latestPivotLow  as number) ?? pivotHigh * 0.92
  const baseDepth  = pivotHigh - pivotLow

  const entryLow  = pivotHigh * 1.01
  const entryHigh = pivotHigh * 1.02
  const sl        = Math.max(pivotLow - atr * 0.5, entryLow * 0.92)
  const risk      = entryLow - sl

  const t1 = entryLow + baseDepth * 0.5
  const t2 = entryLow + baseDepth
  const t3 = entryLow + baseDepth * 1.5

  return {
    entryZoneLow:  round(entryLow),
    entryZoneHigh: round(entryHigh),
    stopLoss:      round(sl),
    targets: [
      { price: round(t1), pctGain: pct(entryLow, t1), sizePct: 40 },
      { price: round(t2), pctGain: pct(entryLow, t2), sizePct: 40 },
      { price: round(t3), pctGain: pct(entryLow, t3), sizePct: 20 },
    ],
    riskReward: round2((t1 - entryLow) / Math.max(risk, 0.01)),
    riskPct:    round2((risk / entryLow) * 100),
  }
}

function macdCrossLevels(
  data:    Record<string, unknown>,
  atr:     number,
  lastBar: OHLCV,
  ohlcv:   OHLCV[]
): EntryLevels {
  const entry    = lastBar.close + atr * 0.1
  const swingLow = recentSwingLow(ohlcv, 10)
  const sl       = Math.min(swingLow, lastBar.close - atr * 1.5)
  const risk     = entry - sl

  const t1 = entry + risk * 2
  const t2 = entry + risk * 3

  // Suppress data unused warning
  void data

  return {
    entryZoneLow:  round(entry),
    entryZoneHigh: round(entry * 1.003),
    stopLoss:      round(sl),
    targets: [
      { price: round(t1), pctGain: pct(entry, t1), sizePct: 60 },
      { price: round(t2), pctGain: pct(entry, t2), sizePct: 40 },
    ],
    riskReward: round2((t1 - entry) / Math.max(risk, 0.01)),
    riskPct:    round2((risk / entry) * 100),
  }
}

function goldenCrossLevels(
  indicators: StockIndicators,
  atr:        number,
  lastBar:    OHLCV,
  ohlcv:      OHLCV[]
): EntryLevels {
  const sma50    = indicators.sma50  ?? lastBar.close
  const entryLow = Math.max(lastBar.close, sma50)
  const sl       = Math.max(recentSwingLow(ohlcv, 15), entryLow - atr * 2)
  const risk     = entryLow - sl

  const t1 = entryLow + risk * 2
  const t2 = entryLow + risk * 3.5
  const t3 = entryLow + risk * 5

  return {
    entryZoneLow:  round(entryLow),
    entryZoneHigh: round(entryLow * 1.005),
    stopLoss:      round(sl),
    targets: [
      { price: round(t1), pctGain: pct(entryLow, t1), sizePct: 40 },
      { price: round(t2), pctGain: pct(entryLow, t2), sizePct: 35 },
      { price: round(t3), pctGain: pct(entryLow, t3), sizePct: 25 },
    ],
    riskReward: round2((t1 - entryLow) / Math.max(risk, 0.01)),
    riskPct:    round2((risk / entryLow) * 100),
  }
}

function trendLevels(indicators: StockIndicators, atr: number, lastBar: OHLCV): EntryLevels {
  const entry = lastBar.close
  const sl    = entry - atr * 2
  const risk  = entry - sl

  return {
    entryZoneLow:  round(entry),
    entryZoneHigh: round(entry * 1.005),
    stopLoss:      round(sl),
    targets: [
      { price: round(entry + risk * 2), pctGain: pct(entry, entry + risk * 2), sizePct: 50 },
      { price: round(entry + risk * 3), pctGain: pct(entry, entry + risk * 3), sizePct: 50 },
    ],
    riskReward: 2,
    riskPct:    round2((risk / entry) * 100),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fallbackATR(ohlcv: OHLCV[]): number {
  const recent = ohlcv.slice(-14)
  if (recent.length < 2) return (ohlcv[ohlcv.length - 1]?.close ?? 50) * 0.02
  const trs = recent.slice(1).map((b, i) => {
    const prev = recent[i]
    return Math.max(b.high - b.low, Math.abs(b.high - prev.close), Math.abs(b.low - prev.close))
  })
  return trs.reduce((a, b) => a + b, 0) / trs.length
}

function recentSwingLow(ohlcv: OHLCV[], lookback: number): number {
  const slice = ohlcv.slice(-lookback)
  return Math.min(...slice.map((b) => b.low))
}

function round(n: number) { return Math.round(n * 100) / 100 }
function round2(n: number) { return Math.round(n * 100) / 100 }
function pct(base: number, target: number) { return round2(((target - base) / base) * 100) }
