"use client"

import { useState, useEffect, useCallback } from "react"
import { LayoutGrid, List, RefreshCw, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScannerResultCard } from "@/components/scanner/ScannerResultCard"
import { ScannerResultRow }  from "@/components/scanner/ScannerResultRow"
import { SkeletonCard, SkeletonRow } from "@/components/ui/skeleton-card"
import { EmptyState }        from "@/components/ui/empty-state"
import type { ScannerResult, ScannerMeta } from "@/types"

interface ScannerPageClientProps {
  scannerSlug: string
  meta:        ScannerMeta
}

type ViewMode = "card" | "table"
type SortKey  = "setupQuality" | "alsScore" | "arsRating" | "marketCap" | "changePct"

const SECTORS = [
  "all", "Technology", "Health Care", "Financials",
  "Consumer Discretionary", "Industrials", "Energy",
  "Communication Services", "Materials", "Real Estate",
]

export function ScannerPageClient({ scannerSlug, meta }: ScannerPageClientProps) {
  const [results,   setResults]   = useState<ScannerResult[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [cachedAt,  setCachedAt]  = useState<string | null>(null)
  const [view,      setView]      = useState<ViewMode>("card")
  const [sortBy,    setSortBy]    = useState<SortKey>("setupQuality")
  const [sector,    setSector]    = useState("all")
  const [minPrice,  setMinPrice]  = useState("")
  const [maxPrice,  setMaxPrice]  = useState("")

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        sort:   sortBy,
        sector,
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })
      const res  = await fetch(`/api/scanner/${scannerSlug}?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Scanner failed")

      setResults(data.results ?? [])
      setCachedAt(data.cachedAt ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [scannerSlug, sortBy, sector, minPrice, maxPrice])

  useEffect(() => { fetchResults() }, [fetchResults])

  const updatedAgo = cachedAt
    ? Math.round((Date.now() - new Date(cachedAt).getTime()) / 60_000)
    : null

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {/* Left: filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector filter */}
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A8080] pointer-events-none" />
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#A8C4C0] text-sm focus:outline-none focus:border-[rgba(98,216,78,0.4)] appearance-none cursor-pointer"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s} className="bg-[#081A1A]">
                  {s === "all" ? "All Sectors" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <input
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-20 px-3 py-2 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#A8C4C0] text-sm focus:outline-none focus:border-[rgba(98,216,78,0.4)] placeholder:text-[#5A8080]"
          />
          <input
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-20 px-3 py-2 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#A8C4C0] text-sm focus:outline-none focus:border-[rgba(98,216,78,0.4)] placeholder:text-[#5A8080]"
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#A8C4C0] text-sm focus:outline-none focus:border-[rgba(98,216,78,0.4)] cursor-pointer"
          >
            <option value="setupQuality" className="bg-[#081A1A]">Setup Quality</option>
            <option value="alsScore"     className="bg-[#081A1A]">ALS Score</option>
            <option value="arsRating"    className="bg-[#081A1A]">RS Rating</option>
            <option value="marketCap"    className="bg-[#081A1A]">Market Cap</option>
            <option value="changePct"    className="bg-[#081A1A]">% Change</option>
          </select>
        </div>

        {/* Right: view toggle + refresh */}
        <div className="flex items-center gap-2">
          {/* Result count + cache info */}
          {!loading && (
            <span className="text-[#5A8080] text-xs hidden sm:block">
              {results.length} results
              {updatedAgo !== null && ` · updated ${updatedAgo}m ago`}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={fetchResults}
            disabled={loading}
            className="p-2 rounded-md text-[#5A8080] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-40"
            aria-label="Refresh results"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* View toggle */}
          <div className="flex rounded-md border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <button
              onClick={() => setView("card")}
              className={cn(
                "p-2 transition-colors",
                view === "card"
                  ? "bg-[rgba(98,216,78,0.12)] text-[#62D84E]"
                  : "text-[#5A8080] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
              )}
              aria-label="Card view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "p-2 transition-colors border-l border-[rgba(255,255,255,0.08)]",
                view === "table"
                  ? "bg-[rgba(98,216,78,0.12)] text-[#62D84E]"
                  : "text-[#5A8080] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
              )}
              aria-label="Table view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[rgba(255,71,87,0.10)] border border-[rgba(255,71,87,0.25)] text-[#FF4757] text-sm">
          {error} —{" "}
          <button onClick={fetchResults} className="underline">retry</button>
        </div>
      )}

      {/* ── CARD VIEW ─────────────────────────────────────────────────────── */}
      {view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : results.length === 0
            ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<span className="text-2xl">🔍</span>}
                  title="No patterns found"
                  description={`No ${meta.name} setups detected today with your current filters. Try adjusting the filters or check back later.`}
                />
              </div>
            )
            : results.map((r) => (
              <ScannerResultCard
                key={r.ticker}
                result={r}
                pattern={scannerSlug}
                onStrategy={(res) => console.log("Open strategy:", res.ticker)}
              />
            ))
          }
        </div>
      )}

      {/* ── TABLE VIEW ────────────────────────────────────────────────────── */}
      {view === "table" && (
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[rgba(13,53,53,0.6)] border-b border-[rgba(255,255,255,0.06)]">
                  {["#", "Ticker", "Sector", "Price", "% Chg", "Volume", "Mkt Cap", "TA", "FA", "ARS", "Setup", ""].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        "px-4 py-3 text-[#5A8080] text-xs font-600 uppercase tracking-wider whitespace-nowrap",
                        col === "Sector"  && "hidden md:table-cell",
                        col === "Volume"  && "hidden lg:table-cell",
                        col === "Mkt Cap" && "hidden xl:table-cell",
                        col === "TA"      && "hidden lg:table-cell",
                        col === "FA"      && "hidden xl:table-cell",
                        col === "ARS"     && "hidden md:table-cell",
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={12}><SkeletonRow /></td></tr>
                  ))
                  : results.length === 0
                  ? (
                    <tr>
                      <td colSpan={12}>
                        <EmptyState
                          icon={<span className="text-2xl">🔍</span>}
                          title="No patterns found"
                          description="Adjust your filters or check back later."
                        />
                      </td>
                    </tr>
                  )
                  : results.map((r, i) => (
                    <ScannerResultRow
                      key={r.ticker}
                      result={r}
                      rank={i + 1}
                      onStrategy={(res) => console.log("Open strategy:", res.ticker)}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
