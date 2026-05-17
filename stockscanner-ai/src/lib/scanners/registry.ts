import { BullFlagScanner }      from "./bull-flag"
import { VCPScanner }            from "./vcp"
import { TrendTemplateScanner }  from "./trend-template"
import { MACDCrossScanner }      from "./macd-cross"
import { GoldenCrossScanner }    from "./golden-cross"
import type { BaseScanner }      from "./base"
import type { ScannerMeta }      from "@/types"

// ---------------------------------------------------------------------------
// Runtime scanner instances
// ---------------------------------------------------------------------------

export const SCANNER_REGISTRY: Record<string, BaseScanner> = {
  "bull-flag":      new BullFlagScanner(),
  "vcp":            new VCPScanner(),
  "trend-template": new TrendTemplateScanner(),
  "macd-cross":     new MACDCrossScanner(),
  "golden-cross":   new GoldenCrossScanner(),
}

// ---------------------------------------------------------------------------
// SEO + UI metadata per scanner
// ---------------------------------------------------------------------------

export const SCANNER_METADATA: ScannerMeta[] = [
  {
    slug:        "bull-flag",
    name:        "Bull Flag",
    description: "Tight consolidation after a sharp rally — breakout continuation",
    signal:      "bullish",
    timeframe:   ["swing"],
    category:    ["breakout", "pattern", "continuation"],
    traderRef:   null,
    likes:       247,
    seoDescription:
      "Scan US stocks forming Bull Flag patterns today. Find stocks with strong pole rallies and tight consolidations ready to break out.",
    seoKeywords: [
      "bull flag scanner", "bull flag stocks today", "bull flag pattern",
      "bull flag trading", "breakout stocks", "swing trading scanner",
    ],
  },
  {
    slug:        "vcp",
    name:        "VCP",
    description: "Volatility Contraction Pattern — Minervini's tightening base breakout",
    signal:      "bullish",
    timeframe:   ["swing"],
    category:    ["breakout", "pattern", "contraction"],
    traderRef:   "Mark Minervini",
    likes:       389,
    seoDescription:
      "Find stocks forming VCP (Volatility Contraction Pattern) setups. Minervini's signature pattern for explosive breakouts.",
    seoKeywords: [
      "VCP scanner", "volatility contraction pattern", "Minervini VCP",
      "VCP stocks", "VCP pattern trading", "stage 2 stocks",
    ],
  },
  {
    slug:        "trend-template",
    name:        "Trend Template",
    description: "Minervini's 8-criteria Stage 2 uptrend filter",
    signal:      "bullish",
    timeframe:   ["swing", "long-term"],
    category:    ["trend", "filter", "stage2"],
    traderRef:   "Mark Minervini",
    likes:       312,
    seoDescription:
      "Screen stocks passing all 8 Minervini Trend Template criteria. Find stocks in Stage 2 confirmed uptrends.",
    seoKeywords: [
      "Minervini trend template", "stage 2 stocks", "trend template scanner",
      "Minervini criteria", "growth stock scanner",
    ],
  },
  {
    slug:        "macd-cross",
    name:        "MACD Cross",
    description: "MACD line crossing above signal line — bullish momentum shift",
    signal:      "bullish",
    timeframe:   ["swing", "day"],
    category:    ["momentum", "indicator"],
    traderRef:   null,
    likes:       198,
    seoDescription:
      "Scan for stocks where MACD just crossed above the signal line. Find early momentum shifts in uptrending stocks.",
    seoKeywords: [
      "MACD crossover scanner", "MACD bullish cross", "MACD signal cross",
      "momentum stocks", "MACD stock scanner",
    ],
  },
  {
    slug:        "golden-cross",
    name:        "Golden Cross",
    description: "SMA50 crossing above SMA200 — major bullish trend signal",
    signal:      "bullish",
    timeframe:   ["swing", "long-term"],
    category:    ["trend", "moving-average"],
    traderRef:   null,
    likes:       276,
    seoDescription:
      "Find stocks where the 50-day SMA just crossed above the 200-day SMA. Classic Golden Cross signal for major trend reversals.",
    seoKeywords: [
      "golden cross scanner", "golden cross stocks", "SMA50 SMA200 cross",
      "golden cross today", "moving average crossover",
    ],
  },
]

/** Helper: get scanner metadata by slug */
export function getScannerMeta(slug: string): ScannerMeta | undefined {
  return SCANNER_METADATA.find((m) => m.slug === slug)
}

/** Helper: get all scanner slugs (for generateStaticParams) */
export function getAllScannerSlugs(): string[] {
  return SCANNER_METADATA.map((m) => m.slug)
}
