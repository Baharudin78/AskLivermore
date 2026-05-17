import { BaseScanner, findPivots } from "./base"
import type { ScannerConfig } from "./base"
import type { OHLCV, StockIndicators, PatternResult } from "@/types"

export class VCPScanner extends BaseScanner {
  config: ScannerConfig = {
    name:        "VCP",
    slug:        "vcp",
    description: "Volatility Contraction Pattern — Minervini's tightening base breakout",
    tradeType:   ["swing"],
    signal:      "bullish",
    category:    ["breakout", "pattern", "contraction"],
  }

  detect(ohlcv: OHLCV[], ind: StockIndicators): PatternResult | null {
    if (ohlcv.length < 100) return null

    const closes = ohlcv.map((b) => b.close)
    const close  = closes[closes.length - 1]

    // ── Stage 2 check ──────────────────────────────────────────────────────
    if (!ind.sma150 || !ind.sma200) return null
    const stage2 =
      close > ind.sma150 &&
      close > ind.sma200 &&
      ind.sma150 > ind.sma200

    // SMA200 trending up: compare to 20 bars ago
    const recentCloses = closes.slice(-220)
    const sma200Slope  = recentCloses.length >= 220
      ? recentCloses[recentCloses.length - 1] - recentCloses[recentCloses.length - 21]
      : 1   // assume trending if not enough data
    const sma200Up = sma200Slope > 0

    if (!stage2 || !sma200Up) return null

    // ── Within 25% of 52-week high ─────────────────────────────────────────
    if (!ind.pctFrom52wHigh) return null
    if (ind.pctFrom52wHigh < -0.25) return null

    // ── Find swing pivots in last 60 bars ──────────────────────────────────
    const window    = ohlcv.slice(-60)
    const pivots    = findPivots(window, 5)
    const highPivots = pivots.filter((p) => p.type === "high")
    const lowPivots  = pivots.filter((p) => p.type === "low")

    if (highPivots.length < 2 || lowPivots.length < 2) return null

    // ── Measure contraction depth between paired pivots ────────────────────
    const contractions: Array<{
      highPrice:   number
      lowPrice:    number
      pullbackPct: number
      startIdx:    number
      endIdx:      number
    }> = []

    // Pair consecutive high→low pivots
    for (let i = 0; i < highPivots.length - 1 && i < lowPivots.length; i++) {
      const hi  = highPivots[i]
      const lo  = lowPivots.find((p) => p.index > hi.index)
      if (!lo) continue

      const pullback = (hi.price - lo.price) / hi.price
      if (pullback > 0.01) {
        contractions.push({
          highPrice:   hi.price,
          lowPrice:    lo.price,
          pullbackPct: pullback,
          startIdx:    ohlcv.length - 60 + hi.index,
          endIdx:      ohlcv.length - 60 + lo.index,
        })
      }
    }

    if (contractions.length < 2) return null

    // ── Verify contractions are getting smaller ────────────────────────────
    const depths = contractions.map((c) => c.pullbackPct)
    let isContracting = true
    for (let i = 1; i < depths.length; i++) {
      if (depths[i] >= depths[i - 1] * 0.90) {  // allow 10% slack
        isContracting = false
        break
      }
    }

    if (!isContracting && contractions.length < 3) return null

    // ── Latest pivot high is the breakout level ────────────────────────────
    const latestPivotHigh = highPivots[highPivots.length - 1].price

    // Price should be near the latest pivot high (within 5%)
    if (close < latestPivotHigh * 0.90 || close > latestPivotHigh * 1.02) return null

    // ── Volume contraction during base ─────────────────────────────────────
    const baseVolumes  = ohlcv.slice(-30).map((b) => b.volume)
    const priorVolumes = ohlcv.slice(-60, -30).map((b) => b.volume)
    const avgBaseVol   = baseVolumes.reduce((a, b) => a + b, 0)  / baseVolumes.length
    const avgPriorVol  = priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length
    const volContracting = avgBaseVol < avgPriorVol * 0.80

    // ── Setup quality ──────────────────────────────────────────────────────
    let quality = 5
    if (contractions.length >= 3)        quality += 1.5
    if (contractions.length >= 4)        quality += 0.5
    if (isContracting)                   quality += 1
    if (volContracting)                  quality += 1
    if (ind.pctFrom52wHigh >= -0.10)     quality += 1
    if (ind.rsi14 && ind.rsi14 >= 45 && ind.rsi14 <= 65) quality += 0.5
    quality = Math.min(10, quality)

    return {
      ticker:        "",
      setupQuality:  Math.round(quality * 10) / 10,
      breakoutLevel: latestPivotHigh,
      stopLevel:     contractions[contractions.length - 1]?.lowPrice,
      notes: [
        `Stage 2: ${stage2 ? "✓" : "✗"}`,
        `${contractions.length} contractions detected`,
        `Pullback depths: ${depths.map((d) => (d * 100).toFixed(1) + "%").join(" → ")}`,
        isContracting ? "Properly contracting ✓" : "Contracting loosely",
      ],
      patternData: {
        stage2,
        numContractions:  contractions.length,
        pullbackDepths:   depths,
        isContracting,
        latestPivotHigh,
        volumeContracting: volContracting,
        contractionPivots: contractions,
      },
    }
  }
}
