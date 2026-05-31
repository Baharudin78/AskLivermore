import { NextRequest, NextResponse } from "next/server"
import { getStockBars }               from "@/lib/polygon/client"
import { calculateIndicators }        from "@/lib/indicators/calculator"
import { calculateEntryLevels }       from "@/lib/strategy/calculator"
import { analyzeTechnicalConfluence } from "@/lib/strategy/confluence"
import { generateTradeSummary }       from "@/lib/groq/entry-summary"
import {
  getCachedEntryStrategy,
  setCachedEntryStrategy,
} from "@/lib/supabase/cache"
import type { EntryStrategy, StockIndicators } from "@/types"

interface RequestBody {
  ticker:      string
  pattern:     string
  tradeType:   "swing" | "day"
  patternData: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { ticker, pattern, tradeType = "swing", patternData = {} } = body
  if (!ticker || !pattern) {
    return NextResponse.json({ error: "ticker and pattern are required" }, { status: 400 })
  }

  // Cache hit
  const { data: cachedData } = await getCachedEntryStrategy(ticker, pattern, tradeType)
  if (cachedData && "setupQuality" in cachedData) {
    return NextResponse.json({ strategy: cachedData as unknown as EntryStrategy, fromCache: true })
  }

  // Fetch OHLCV
  const ohlcvResult = await getStockBars(ticker, 260)
  if (ohlcvResult.error || !ohlcvResult.data) {
    return NextResponse.json(
      { error: `Failed to fetch market data: ${ohlcvResult.error ?? "no data returned"}` },
      { status: 502 }
    )
  }
  const ohlcv = ohlcvResult.data

  if (ohlcv.length < 60) {
    return NextResponse.json(
      { error: `Insufficient historical data for ${ticker} (${ohlcv.length} bars, need 60)` },
      { status: 400 }
    )
  }

  const indicators  = calculateIndicators(ohlcv)
  const levels      = calculateEntryLevels(pattern, patternData, indicators, ohlcv)
  const confluence  = analyzeTechnicalConfluence(indicators, patternData)

  // Groq AI summary (non-blocking failure)
  const aiSummary = await generateTradeSummary({
    ticker,
    pattern,
    tradeType,
    setupQuality:  (patternData.setupQuality as number) ?? 7,
    entryLevel:    levels.entryZoneLow,
    stopLoss:      levels.stopLoss,
    target1:       levels.targets[0]?.price ?? levels.entryZoneLow * 1.1,
    riskReward:    levels.riskReward,
    rsiValue:      indicators.rsi14,
    volumeRatio:   indicators.volRatio,
    marketRegime:  "confirmed-uptrend",
  })

  const strategy: EntryStrategy = {
    setupQuality:       (patternData.setupQuality as number) ?? 7,
    setupQualityReason: buildQualityReason(pattern, patternData),
    tradeType,
    holdDuration:       tradeType === "swing" ? "5–20 trading days" : "Intraday — close by EOD",
    entry: {
      trigger:      buildEntryTrigger(pattern, levels.entryZoneLow),
      zoneLow:      levels.entryZoneLow,
      zoneHigh:     levels.entryZoneHigh,
      confirmation: buildConfirmation(pattern, indicators),
    },
    stopLoss: {
      price:   levels.stopLoss,
      logic:   buildStopLogic(pattern, patternData),
      riskPct: levels.riskPct,
    },
    targets: levels.targets.map((t, i) => ({
      ...t,
      logic: i === 0 ? "Take partial profit at measured move" :
             i === 1 ? "Trail stop to breakeven, let runners run" :
                       "Extended target — keep only if market cooperates",
    })),
    riskReward:       levels.riskReward,
    positionSizeNote: `Risk ≤ 1% of account. With ${levels.riskPct.toFixed(1)}% stop, position = (Account × 0.01) / (Entry × ${(levels.riskPct / 100).toFixed(3)})`,
    technicalConfluence: confluence,
    risks:        buildRisks(pattern, indicators, patternData),
    invalidation: buildInvalidation(pattern),
    aiSummary,
  }

  await setCachedEntryStrategy(ticker, pattern, tradeType, strategy as unknown as Record<string, unknown>)

  return NextResponse.json({ strategy, fromCache: false })
}

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------

function buildEntryTrigger(pattern: string, entryPrice: number): string {
  switch (pattern) {
    case "bull-flag":    return `Buy stop at $${entryPrice} — triggered on break above flag resistance`
    case "vcp":          return `Buy stop at $${entryPrice} — 1% above pivot high on volume surge`
    case "macd-cross":   return `Market or limit order near $${entryPrice} — confirm MACD cross on close`
    case "golden-cross": return `Pullback entry to $${entryPrice} — buy on retest of 50-day MA`
    default:             return `Limit order at $${entryPrice}`
  }
}

function buildConfirmation(pattern: string, indicators: StockIndicators): string {
  const vol = indicators.volRatio
  const volStr = vol ? `${vol.toFixed(1)}× average volume` : "above-average volume"
  switch (pattern) {
    case "bull-flag":    return `Breakout candle closes above flag with ${volStr}`
    case "vcp":          return `Pivot breakout with ${volStr} and daily close above pivot high`
    case "macd-cross":   return `MACD line remains above signal line on daily close`
    case "golden-cross": return `Price holds above SMA50 with volume confirmation`
    default:             return `Daily close above entry zone with ${volStr}`
  }
}

function buildStopLogic(pattern: string, data: Record<string, unknown>): string {
  switch (pattern) {
    case "bull-flag":    return `Below flag consolidation low — pattern is invalid if flag low breaks`
    case "vcp":          return `Below the tightest contraction low — VCP structure invalidated`
    case "macd-cross":   return `Below recent swing low — momentum thesis cancelled`
    case "golden-cross": return `Below 50-day MA — golden cross setup invalidated`
    default:             return `Below key support level — cut loss if pattern breaks`
  }
  void data
}

function buildQualityReason(pattern: string, data: Record<string, unknown>): string {
  const parts: string[] = []
  if (pattern === "bull-flag") {
    if (data.poleGainPct) parts.push(`Pole gain: ${(data.poleGainPct as number).toFixed(1)}%`)
    if (data.pullbackPct) parts.push(`Pullback: ${(data.pullbackPct as number).toFixed(1)}%`)
    if (data.volContraction) parts.push("Volume contraction in flag")
  }
  if (pattern === "vcp") {
    if (data.contractionCount) parts.push(`${data.contractionCount} contractions`)
    if (data.pctFrom52wHigh)   parts.push(`Within ${(data.pctFrom52wHigh as number).toFixed(1)}% of 52wk high`)
  }
  return parts.length ? parts.join(" · ") : "Pattern meets baseline criteria"
}

function buildInvalidation(pattern: string): string {
  switch (pattern) {
    case "bull-flag":    return "Pattern invalidated on close below the flag low"
    case "vcp":          return "Pattern invalidated on close below the tightest contraction pivot"
    case "macd-cross":   return "Signal invalidated if MACD crosses back below signal line"
    case "golden-cross": return "Signal invalidated if price closes below the 50-day MA"
    default:             return "Exit immediately on close below stop loss"
  }
}

function buildRisks(
  pattern:     string,
  indicators:  StockIndicators,
  patternData: Record<string, unknown>
): string[] {
  const risks: string[] = []

  if (indicators.rsi14 && indicators.rsi14 > 75)
    risks.push("RSI overbought — risk of short-term pullback before breakout")

  if (indicators.volRatio && indicators.volRatio < 0.7)
    risks.push("Below-average volume — breakout may lack institutional backing")

  if (pattern === "bull-flag")
    risks.push("False breakout risk if market breadth weakens")

  if (pattern === "vcp")
    risks.push("VCP can fail at final contraction — ensure volume dries up before entry")

  if (indicators.pctFrom52wHigh && Math.abs(indicators.pctFrom52wHigh) > 20)
    risks.push("Stock is far below 52-week high — needs significant base work")

  void patternData
  risks.push("Always honor your stop — no thesis justifies holding through a planned stop loss")

  return risks
}

