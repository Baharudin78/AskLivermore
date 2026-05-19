"use client"

import { BarChart2, LineChart } from "lucide-react"
import { ChangeDisplay } from "@/components/ui/change-display"
import { PriceDisplay }  from "@/components/ui/price-display"
import { SectorBadge }   from "@/components/ui/sector-badge"
import type { ScannerResult } from "@/types"

interface ScannerResultRowProps {
  result:     ScannerResult
  rank:       number
  onStrategy: (result: ScannerResult) => void
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct   = (value / max) * 100
  const color =
    pct >= 80 ? "#62D84E" :
    pct >= 60 ? "#FFB800" :
                "#5A8080"
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-ticker text-xs" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  )
}

function ARSBadge({ rating }: { rating: number }) {
  const color =
    rating >= 80 ? "text-[#62D84E] bg-[rgba(98,216,78,0.12)] border-[rgba(98,216,78,0.25)]" :
    rating >= 60 ? "text-[#FFB800] bg-[rgba(255,184,0,0.12)] border-[rgba(255,184,0,0.25)]" :
                   "text-[#5A8080] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-ticker font-600 border ${color}`}>
      {rating}
    </span>
  )
}

export function ScannerResultRow({ result, rank, onStrategy }: ScannerResultRowProps) {
  return (
    <tr
      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(98,216,78,0.04)] transition-colors cursor-pointer group"
      onClick={() => onStrategy(result)}
    >
      {/* Rank */}
      <td className="px-4 py-3 text-[#5A8080] font-ticker text-sm w-10">
        {rank <= 10
          ? <span className="text-[#FFB800] font-600">{rank}</span>
          : rank
        }
      </td>

      {/* Ticker + Company */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-ticker text-white font-700 text-sm">{result.ticker}</span>
          <span className="text-[#5A8080] text-xs truncate max-w-[160px]">{result.companyName}</span>
        </div>
      </td>

      {/* Sector */}
      <td className="px-4 py-3 hidden md:table-cell">
        <SectorBadge sector={result.sector} />
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <PriceDisplay price={result.price} className="text-sm" />
      </td>

      {/* % Change */}
      <td className="px-4 py-3">
        <ChangeDisplay value={result.changePct} />
      </td>

      {/* Volume */}
      <td className="px-4 py-3 hidden lg:table-cell font-ticker text-[#A8C4C0] text-sm">
        {formatVol(result.volume)}
      </td>

      {/* Market Cap */}
      <td className="px-4 py-3 hidden xl:table-cell font-ticker text-[#A8C4C0] text-sm">
        {formatCap(result.marketCap)}
      </td>

      {/* TA Score */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <ScoreBar value={result.taScore} />
      </td>

      {/* FA Score */}
      <td className="px-4 py-3 hidden xl:table-cell">
        <ScoreBar value={result.faScore} />
      </td>

      {/* ARS Rating */}
      <td className="px-4 py-3 hidden md:table-cell">
        <ARSBadge rating={result.arsRating} />
      </td>

      {/* Setup Quality */}
      <td className="px-4 py-3">
        <ScoreBar value={result.setupQuality} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onStrategy(result) }}
            className="p-1.5 rounded-md text-[#62D84E] hover:bg-[rgba(98,216,78,0.12)] transition-colors"
            aria-label={`View strategy for ${result.ticker}`}
          >
            <BarChart2 size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#4DD9C0] hover:bg-[rgba(77,217,192,0.12)] transition-colors"
            aria-label={`View chart for ${result.ticker}`}
          >
            <LineChart size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function formatVol(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return v.toString()
}

function formatCap(v: number) {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(1)}T`
  if (v >= 1_000_000_000)     return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)         return `$${(v / 1_000_000).toFixed(0)}M`
  return `$${v}`
}
