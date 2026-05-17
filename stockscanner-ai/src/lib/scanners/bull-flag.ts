import { BaseScanner, slope } from "./base"
import type { ScannerConfig } from "./base"
import type { OHLCV, StockIndicators, PatternResult } from "@/types"
import { SMA } from "technicalindicators"

export class BullFlagScanner extends BaseScanner {
  config: ScannerConfig = {
    name:        "Bull Flag",
    slug:        "bull-flag",
    description: "Tight consolidation after a sharp rally — breakout continuation",
    tradeType:   ["swing"],
    signal:      "bullish",
    category:    ["breakout", "pattern", "continuation"],
  }

  detect(ohlcv: OHLCV[], ind: StockIndicators): PatternResult | null {
    if (ohlcv.length < 60) return null

    const closes  = ohlcv.map((b) => b.close)
    const volumes = ohlcv.map((b) => b.volume)
    const close   = closes[closes.length - 1]

    // ── Trend filter: must be above SMA50 and SMA200 ──────────────────────
    if (!ind.sma50 || !ind.sma200) return null
    if (close < ind.sma50 || close < ind.sma200) return null

    // ── Find the pole: strongest rally within last 60 bars ────────────────
    const lookback = ohlcv.slice(-60)
    let bestPole: {
      startIdx: number; endIdx: number
      gain: number; bars: number
    } | null = null

    for (let start = 0; start < lookback.length - 4; start++) {
      for (let end = start + 3; end <= Math.min(start + 15, lookback.length - 1); end++) {
        const gain = (lookback[end].close - lookback[start].close) / lookback[start].close
        if (gain >= 0.20) {
          if (!bestPole || gain > bestPole.gain) {
            bestPole = {
              startIdx: start,
              endIdx:   end,
              gain,
              bars:     end - start,
            }
          }
        }
      }
    }

    if (!bestPole) return null

    // Pole must end at least 4 bars ago (flag needs space to form)
    const poleEndOffset = lookback.length - 1 - bestPole.endIdx
    if (poleEndOffset < 4) return null

    // ── Find flag: consolidation bars after pole ───────────────────────────
    const flagBars  = lookback.slice(bestPole.endIdx)
    const flagLen   = flagBars.length
    if (flagLen < 4 || flagLen > 20) return null

    const poleHigh  = lookback[bestPole.endIdx].high
    const flagLow   = Math.min(...flagBars.map((b) => b.low))
    const flagHigh  = Math.max(...flagBars.map((b) => b.high))

    // Pullback must not exceed 50% of pole height
    const poleHeight   = poleHigh - lookback[bestPole.startIdx].low
    const pullbackAmt  = poleHigh - flagLow
    const pullbackPct  = pullbackAmt / poleHeight

    if (pullbackPct > 0.50) return null

    // ── Channel: both highs and lows must slope slightly negative ─────────
    const flagHighs = flagBars.map((b) => b.high)
    const flagLows  = flagBars.map((b) => b.low)
    const upperSlope = slope(flagHighs)
    const lowerSlope = slope(flagLows)

    // Both slopes should be negative (downward channel) or flat
    if (upperSlope > 0.3 || lowerSlope > 0.3) return null

    // ── Volume: declining during flag ─────────────────────────────────────
    const poleVolumes = volumes.slice(
      ohlcv.length - 60 + bestPole.startIdx,
      ohlcv.length - 60 + bestPole.endIdx + 1
    )
    const flagVolumes = volumes.slice(ohlcv.length - flagLen)

    const avgPoleVol = poleVolumes.reduce((a, b) => a + b, 0) / poleVolumes.length
    const avgFlagVol = flagVolumes.reduce((a, b) => a + b, 0) / flagVolumes.length

    // Flag volume should be lower than pole volume (declining interest)
    const volumeContracting = avgFlagVol < avgPoleVol * 0.85

    // ── Setup quality ─────────────────────────────────────────────────────
    let quality = 5
    if (bestPole.gain >= 0.30)    quality += 1
    if (bestPole.gain >= 0.50)    quality += 0.5
    if (pullbackPct <= 0.30)      quality += 1
    if (pullbackPct <= 0.20)      quality += 0.5
    if (volumeContracting)        quality += 1
    if (flagLen >= 5 && flagLen <= 12) quality += 0.5
    if (ind.rsi14 && ind.rsi14 >= 50 && ind.rsi14 <= 70) quality += 0.5
    quality = Math.min(10, quality)

    // ── Build patternData ─────────────────────────────────────────────────
    const absStartIdx = ohlcv.length - 60 + bestPole.startIdx
    const absEndIdx   = ohlcv.length - 60 + bestPole.endIdx
    const flagStartIdx = absEndIdx
    const flagEndIdx   = ohlcv.length - 1

    return {
      ticker:       "",   // filled by scanner runner
      setupQuality: Math.round(quality * 10) / 10,
      breakoutLevel: poleHigh,
      stopLevel:     flagLow,
      notes: [
        `Pole gain: +${(bestPole.gain * 100).toFixed(1)}% over ${bestPole.bars} bars`,
        `Pullback: ${(pullbackPct * 100).toFixed(1)}% of pole`,
        `Flag duration: ${flagLen} bars`,
        volumeContracting ? "Volume contracting ✓" : "Volume not contracting",
      ],
      patternData: {
        poleGain:          bestPole.gain,
        poleBars:          bestPole.bars,
        pullbackPct,
        flagBars:          flagLen,
        breakoutLevel:     poleHigh,
        flagLow,
        flagHigh,
        channelUpperSlope: upperSlope,
        channelLowerSlope: lowerSlope,
        volumeContracting,
        poleStartIdx:      absStartIdx,
        poleEndIdx:        absEndIdx,
        flagStartIdx,
        flagEndIdx,
      },
    }
  }
}
