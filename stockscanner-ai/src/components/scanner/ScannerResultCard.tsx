"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChangeDisplay } from "@/components/ui/change-display"
import { PriceDisplay }  from "@/components/ui/price-display"
import { SectorBadge }   from "@/components/ui/sector-badge"
import { StockBadge }    from "@/components/ui/stock-badge"
import { SkeletonCard }  from "@/components/ui/skeleton-card"
import type { ScannerResult } from "@/types"

// Dynamic import — chart uses DOM, skip SSR
const MiniChart = dynamic(
  () => import("@/components/charts/MiniChart").then((m) => m.MiniChart),
  { ssr: false, loading: () => <div className="h-40 rounded-lg bg-[#081A1A] animate-pulse" /> }
)

interface ScannerResultCardProps {
  result:    ScannerResult
  pattern:   string
  ohlcv?:    import("@/types").OHLCV[]
  onStrategy?: (result: ScannerResult) => void
}

function SetupQualityBar({ score }: { score: number }) {
  const pct   = (score / 10) * 100
  const color =
    score >= 8 ? "#62D84E" :
    score >= 6 ? "#FFB800" :
                 "#FF4757"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-ticker text-xs font-600" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

export function ScannerResultCard({
  result,
  pattern,
  ohlcv = [],
  onStrategy,
}: ScannerResultCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className={cn(
        "flex flex-col gap-3 p-4 rounded-[16px] border transition-all duration-200 cursor-pointer",
        "bg-[linear-gradient(145deg,#0D3535_0%,#081A1A_100%)]",
        hovered
          ? "border-[rgba(98,216,78,0.25)] shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(98,216,78,0.12)] -translate-y-0.5"
          : "border-[rgba(255,255,255,0.06)] shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
      )}
      aria-label={`${result.ticker} ${pattern} setup`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onStrategy?.(result)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-ticker text-white font-700 text-lg leading-none">
              {result.ticker}
            </span>
            <ChangeDisplay value={result.changePct} />
          </div>
          <p className="text-[#5A8080] text-xs mt-0.5 truncate">{result.companyName}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <PriceDisplay price={result.price} className="text-sm" />
          <SectorBadge sector={result.sector} />
        </div>
      </div>

      {/* Mini chart */}
      {ohlcv.length > 0 && (
        <MiniChart
          ohlcv={ohlcv}
          pattern={pattern}
          patternData={result.patternData}
          height={140}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Volume",    value: formatVolume(result.volume) },
          { label: "Mkt Cap",   value: formatMarketCap(result.marketCap) },
          { label: "ALS Score", value: result.alsScore.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.03)] rounded-lg px-2 py-2">
            <p className="text-[#5A8080] text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="font-ticker text-white text-sm font-600">{value}</p>
          </div>
        ))}
      </div>

      {/* Setup quality + CTA */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex-1 min-w-0">
          <p className="text-[#5A8080] text-[10px] uppercase tracking-wider mb-1">Setup Quality</p>
          <SetupQualityBar score={result.setupQuality} />
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(98,216,78,0.12)] border border-[rgba(98,216,78,0.25)] text-[#62D84E] text-xs font-600 hover:bg-[rgba(98,216,78,0.20)] transition-colors shrink-0"
          onClick={(e) => { e.stopPropagation(); onStrategy?.(result) }}
          aria-label={`View entry strategy for ${result.ticker}`}
        >
          <BarChart2 size={13} />
          Strategy
        </button>
      </div>

      {/* Signal badge */}
      <div className="flex gap-1.5 flex-wrap">
        <StockBadge signal="bullish" label={pattern.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[rgba(255,255,255,0.06)] text-[#5A8080] border border-[rgba(255,255,255,0.08)]">
          ARS {result.arsRating}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[rgba(255,255,255,0.06)] text-[#5A8080] border border-[rgba(255,255,255,0.08)]">
          TA {result.taScore.toFixed(1)}/10
        </span>
      </div>
    </article>
  )
}

export function ScannerResultCardSkeleton() {
  return <SkeletonCard />
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return v.toString()
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(1)}T`
  if (v >= 1_000_000_000)     return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)         return `$${(v / 1_000_000).toFixed(0)}M`
  return `$${v}`
}
