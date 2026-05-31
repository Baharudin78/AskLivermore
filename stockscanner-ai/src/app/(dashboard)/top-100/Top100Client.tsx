"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Users, Minus } from "lucide-react"
import { cn }              from "@/lib/utils"
import { ChangeDisplay }   from "@/components/ui/change-display"
import { PriceDisplay }    from "@/components/ui/price-display"
import { SectorBadge }     from "@/components/ui/sector-badge"
import { EmptyState }      from "@/components/ui/empty-state"
import { SkeletonCard }    from "@/components/ui/skeleton-card"
import { EntryStrategyModal } from "@/components/strategy/EntryStrategyModal"
import type { ScannerResult } from "@/types"

interface PortfolioStats {
  avgChangePct: number
  advancers:    number
  decliners:    number
  unchanged:    number
}

interface Top100Response {
  results:        ScannerResult[]
  total:          number
  portfolioStats: PortfolioStats | null
  fromCache:      boolean
  updatedAt:      string
}

const SECTORS = [
  "all", "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Industrials", "Communication Services", "Consumer Staples",
  "Energy", "Materials", "Real Estate", "Utilities",
]

const SORT_OPTIONS = [
  { value: "alsScore",  label: "ALS Score"   },
  { value: "taScore",   label: "TA Score"    },
  { value: "arsRating", label: "RS Rating"   },
  { value: "marketCap", label: "Market Cap"  },
  { value: "changePct", label: "% Change"    },
]

export function Top100Client() {
  const [data,    setData]    = useState<Top100Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [sector,  setSector]  = useState("all")
  const [sortBy,  setSortBy]  = useState("alsScore")
  const [sortAsc, setSortAsc] = useState(false)
  const [modal,   setModal]   = useState<ScannerResult | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ sector, sort: sortBy })
      const res    = await fetch(`/api/top100?${params}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [sector, sortBy])

  useEffect(() => { fetchData() }, [fetchData])

  const results = data?.results ?? []
  const sorted  = sortAsc ? [...results].reverse() : results

  if (loading) return <Top100Loading />

  if (error) {
    return (
      <EmptyState
        icon={<BarChart2 size={32} className="text-[#A8C4C0]" />}
        title="Failed to load Top 100"
        description={error}
        action={
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Livermore Top 100™
          </h1>
          <p className="text-[#A8C4C0] text-sm mt-1">
            Equal-weighted composite ranking by ALS score — updated daily
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5A8080]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              data?.fromCache ? "bg-[#FFB800]" : "bg-[#62D84E]"
            )}
          />
          {data?.fromCache ? "Cached" : "Live"} ·{" "}
          {data?.updatedAt
            ? new Date(data.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </div>
      </div>

      {/* Portfolio stats */}
      {data?.portfolioStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Avg Change Today"
            value={<ChangeDisplay value={data.portfolioStats.avgChangePct} />}
          />
          <StatCard
            label="Advancers / Decliners"
            value={
              <span className="font-ticker text-sm">
                <span className="text-[#62D84E]">{data.portfolioStats.advancers}</span>
                <span className="text-[#5A8080] mx-1">/</span>
                <span className="text-[#FF4757]">{data.portfolioStats.decliners}</span>
              </span>
            }
          />
          <StatCard
            label="Total Stocks"
            value={
              <span className="font-ticker text-white text-lg font-semibold">
                {data.total}
              </span>
            }
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#5A8080] shrink-0">Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-[#0A2A2A] border border-[rgba(255,255,255,0.10)] text-[#A8C4C0] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[rgba(98,216,78,0.4)]"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Sectors" : s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#5A8080] shrink-0">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0A2A2A] border border-[rgba(255,255,255,0.10)] text-[#A8C4C0] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[rgba(98,216,78,0.4)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="text-xs text-[#A8C4C0] border border-[rgba(255,255,255,0.10)] rounded-md px-3 py-1.5 hover:border-[rgba(98,216,78,0.4)] hover:text-white transition-colors"
          aria-label="Toggle sort direction"
        >
          {sortAsc ? "↑ Asc" : "↓ Desc"}
        </button>
        <span className="ml-auto text-xs text-[#5A8080]">{sorted.length} stocks</span>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Users size={28} className="text-[#A8C4C0]" />}
          title="No stocks match your filters"
          description="Try adjusting the sector filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[rgba(255,255,255,0.06)]">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-[rgba(13,53,53,0.6)] text-left text-xs text-[#5A8080] uppercase tracking-wide">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Ticker</th>
                <th className="px-4 py-3 hidden md:table-cell">Sector</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Chg%</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">Volume</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">Mkt Cap</th>
                <th className="px-4 py-3 text-right">TA</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">RS</th>
                <th className="px-4 py-3 text-right">ALS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {sorted.map((stock, idx) => (
                <TableRow
                  key={stock.ticker}
                  rank={idx + 1}
                  stock={stock}
                  onClick={() => setModal(stock)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entry strategy modal */}
      {modal && (
        <EntryStrategyModal
          result={modal}
          pattern="trend-template"
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-[#0D3535] to-[#081A1A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
      <p className="text-xs text-[#5A8080] mb-1">{label}</p>
      <div className="text-lg">{value}</div>
    </div>
  )
}

interface TableRowProps {
  rank:    number
  stock:   ScannerResult
  onClick: () => void
}

function TableRow({ rank, stock, onClick }: TableRowProps) {
  const isTop10 = rank <= 10
  const alsColor =
    stock.alsScore >= 80 ? "text-[#62D84E]" :
    stock.alsScore >= 60 ? "text-[#FFB800]" :
                           "text-[#5A8080]"

  return (
    <tr
      onClick={onClick}
      className={cn(
        "hover:bg-[rgba(98,216,78,0.04)] cursor-pointer transition-colors group",
        isTop10 && "border-l-2 border-l-[rgba(98,216,78,0.4)]"
      )}
      aria-label={`${stock.ticker} — ${stock.companyName}`}
    >
      <td className="px-4 py-3 text-[#5A8080] font-ticker text-xs">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-ticker font-semibold text-white group-hover:text-[#62D84E] transition-colors">
            {stock.ticker}
          </span>
          <span className="text-[#5A8080] text-xs truncate max-w-[140px]">
            {stock.companyName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <SectorBadge sector={stock.sector} />
      </td>
      <td className="px-4 py-3 text-right">
        <PriceDisplay price={stock.price} />
      </td>
      <td className="px-4 py-3 text-right">
        <ChangeDisplay value={stock.changePct} />
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <span className="font-ticker text-[#A8C4C0] text-xs">
          {formatVolume(stock.volume)}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <span className="font-ticker text-[#A8C4C0] text-xs">
          {formatMarketCap(stock.marketCap)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-ticker text-[#A8C4C0] text-xs">
          {stock.taScore.toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className="font-ticker text-[#A8C4C0] text-xs">{stock.arsRating}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={cn("font-ticker font-semibold text-sm", alsColor)}>
          {stock.alsScore}
        </span>
      </td>
    </tr>
  )
}

function Top100Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-64 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
        <div className="h-4 w-80 rounded bg-[rgba(255,255,255,0.04)] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-14 rounded bg-[rgba(255,255,255,0.03)] animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function formatMarketCap(mc: number): string {
  if (mc >= 1_000_000_000_000) return `$${(mc / 1_000_000_000_000).toFixed(1)}T`
  if (mc >= 1_000_000_000)     return `$${(mc / 1_000_000_000).toFixed(1)}B`
  if (mc >= 1_000_000)         return `$${(mc / 1_000_000).toFixed(0)}M`
  return mc > 0 ? `$${mc}` : "—"
}
