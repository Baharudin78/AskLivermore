"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { X, TrendingUp, AlertTriangle, Target, Shield, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EntryStrategy, OHLCV, ScannerResult } from "@/types"

const StrategyChart = dynamic(
  () => import("@/components/charts/StrategyChart").then((m) => m.StrategyChart),
  { ssr: false }
)

interface EntryStrategyModalProps {
  result:  ScannerResult
  pattern: string
  onClose: () => void
}

export function EntryStrategyModal({ result, pattern, onClose }: EntryStrategyModalProps) {
  const [tradeType,  setTradeType]  = useState<"swing" | "day">("swing")
  const [strategy,   setStrategy]   = useState<EntryStrategy | null>(null)
  const [ohlcv,      setOhlcv]      = useState<OHLCV[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  const fetch = useCallback(async (type: "swing" | "day") => {
    setLoading(true)
    setError(null)
    try {
      const res  = await window.fetch("/api/entry-strategy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ticker:      result.ticker,
          pattern,
          tradeType:   type,
          patternData: result.patternData ?? {},
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Strategy fetch failed")
      setStrategy(data.strategy)

      // Also fetch OHLCV for chart
      const ohlcvRes = await window.fetch(`/api/ohlcv/${result.ticker}`)
      if (ohlcvRes.ok) {
        const ohlcvData = await ohlcvRes.json()
        setOhlcv(ohlcvData.bars ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [result, pattern])

  useEffect(() => { fetch(tradeType) }, [fetch, tradeType])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleTradeTypeSwitch = (t: "swing" | "day") => {
    setTradeType(t)
    // fetch() is triggered by the useEffect above
  }

  const patternLabel = pattern.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet / Modal */}
      <div className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#0A2020] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-display font-800 text-white">{result.ticker}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-600 bg-[rgba(98,216,78,0.15)] text-[#62D84E] border border-[rgba(98,216,78,0.3)] uppercase">
                  {patternLabel}
                </span>
              </div>
              <p className="text-[#5A8080] text-xs mt-0.5 truncate">{result.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Trade type tabs */}
            <div className="flex rounded-md border border-[rgba(255,255,255,0.1)] overflow-hidden text-xs">
              {(["swing", "day"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTradeTypeSwitch(t)}
                  className={cn(
                    "px-3 py-1.5 font-600 capitalize transition-colors",
                    tradeType === t
                      ? "bg-[rgba(98,216,78,0.15)] text-[#62D84E]"
                      : "text-[#5A8080] hover:text-white hover:bg-[rgba(255,255,255,0.04)]",
                    t === "day" && "border-l border-[rgba(255,255,255,0.1)]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#5A8080] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <StrategySkeleton />
          ) : error ? (
            <div className="p-6 text-center text-[#FF4757]">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-60" />
              <p>{error}</p>
              <button onClick={() => fetch(tradeType)} className="mt-3 text-sm text-[#4DD9C0] underline">Retry</button>
            </div>
          ) : strategy ? (
            <StrategyBody result={result} strategy={strategy} ohlcv={ohlcv} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Strategy body — 2-column layout
// ---------------------------------------------------------------------------

function StrategyBody({
  result,
  strategy,
  ohlcv,
}: {
  result:   ScannerResult
  strategy: EntryStrategy
  ohlcv:    OHLCV[]
}) {
  const rrColor = strategy.riskReward >= 2 ? "text-[#62D84E]" : strategy.riskReward >= 1.5 ? "text-[#FFB800]" : "text-[#FF4757]"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(255,255,255,0.06)]">

      {/* ── LEFT COLUMN ────────────────────────────────────────────────────── */}
      <div className="p-5 space-y-4 overflow-y-auto">

        {/* Setup quality */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#5A8080] text-xs uppercase tracking-wider">Setup Quality</span>
            <span className="text-white font-display font-700 text-lg">{strategy.setupQuality}<span className="text-[#5A8080] text-sm">/10</span></span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#62D84E] to-[#4DD9C0] transition-all duration-500"
              style={{ width: `${strategy.setupQuality * 10}%` }}
            />
          </div>
          <p className="text-[#5A8080] text-[11px] mt-1">{strategy.setupQualityReason}</p>
        </div>

        {/* AI Summary */}
        {strategy.aiSummary && (
          <div className="p-3 rounded-lg bg-[rgba(77,217,192,0.07)] border border-[rgba(77,217,192,0.15)]">
            <div className="flex items-center gap-1.5 text-[#4DD9C0] text-xs font-600 mb-1.5">
              <Sparkles size={12} />
              AI Analysis
            </div>
            <p className="text-[#A8C4C0] text-sm leading-relaxed">{strategy.aiSummary}</p>
          </div>
        )}

        {/* Entry card */}
        <Card icon={<TrendingUp size={14} />} title="Entry" color="green">
          <Row label="Trigger"      value={strategy.entry.trigger} />
          <Row label="Zone"         value={`$${strategy.entry.zoneLow} – $${strategy.entry.zoneHigh}`} mono />
          <Row label="Confirmation" value={strategy.entry.confirmation} />
        </Card>

        {/* Stop loss card */}
        <Card icon={<Shield size={14} />} title="Stop Loss" color="red">
          <Row label="Price"  value={`$${strategy.stopLoss.price}`} mono />
          <Row label="Risk %"  value={`${strategy.stopLoss.riskPct.toFixed(1)}% from entry`} />
          <Row label="Logic"   value={strategy.stopLoss.logic} />
        </Card>

        {/* Risk/reward + hold duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-center">
            <div className="text-[#5A8080] text-[10px] uppercase tracking-wider mb-1">Risk / Reward</div>
            <div className={cn("font-display font-800 text-2xl", rrColor)}>{strategy.riskReward.toFixed(1)}:1</div>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-center">
            <div className="text-[#5A8080] text-[10px] uppercase tracking-wider mb-1">Hold Duration</div>
            <div className="text-white text-sm font-600 leading-snug mt-1">{strategy.holdDuration}</div>
          </div>
        </div>

        {/* Targets */}
        <Card icon={<Target size={14} />} title="Profit Targets" color="teal">
          {strategy.targets.map((t, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5A8080] font-600">T{i+1}</span>
                <span className="text-white font-mono font-700">${t.price}</span>
                <span className="text-[#62D84E]">+{t.pctGain.toFixed(1)}%</span>
                <span className="text-[#5A8080] text-xs">{t.sizePct}% of position</span>
              </div>
              <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((t.price / (result.price * 1.3)) * 100, 100)}%`,
                    backgroundColor: ["#4DD9C0","#62D84E","#FFB800"][i],
                  }}
                />
              </div>
            </div>
          ))}
        </Card>

        {/* Technical confluence */}
        {strategy.technicalConfluence.length > 0 && (
          <div>
            <h4 className="text-[#5A8080] text-xs uppercase tracking-wider mb-2">Technical Confluence</h4>
            <div className="space-y-1.5">
              {strategy.technicalConfluence.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={cn(
                    "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                    c.signal === "bullish" ? "bg-[#62D84E]" :
                    c.signal === "bearish" ? "bg-[#FF4757]" : "bg-[#FFB800]"
                  )} />
                  <div className="min-w-0">
                    <span className="text-white font-600">{c.indicator}</span>
                    <span className="text-[#5A8080] mx-1">·</span>
                    <span className="font-mono text-[#A8C4C0]">{c.value}</span>
                    <p className="text-[#5A8080] mt-0.5">{c.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {strategy.risks.length > 0 && (
          <div>
            <h4 className="text-[#5A8080] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle size={11} /> Risks & Invalidation
            </h4>
            <ul className="space-y-1.5">
              {strategy.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#A8C4C0]">
                  <span className="text-[#FF4757] mt-0.5 shrink-0">›</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Position size note */}
        <p className="text-[10px] text-[#5A8080] leading-relaxed border-t border-[rgba(255,255,255,0.05)] pt-3">
          {strategy.positionSizeNote}
        </p>
      </div>

      {/* ── RIGHT COLUMN ───────────────────────────────────────────────────── */}
      <div className="p-5">
        <h4 className="text-[#5A8080] text-xs uppercase tracking-wider mb-3">Chart</h4>
        {ohlcv.length >= 20 ? (
          <StrategyChart
            ohlcv={ohlcv}
            pattern={strategy.entry.trigger.split(" ")[0].toLowerCase()}
            entryZone={[strategy.entry.zoneLow, strategy.entry.zoneHigh]}
            stopLoss={strategy.stopLoss.price}
            targets={strategy.targets.map((t) => t.price)}
            height={420}
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-[#5A8080] text-sm bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.06)]">
            Chart data loading&hellip;
          </div>
        )}

        {/* Price snapshot */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Price"   value={`$${result.price.toFixed(2)}`} />
          <Stat label="Change"  value={`${result.changePct >= 0 ? "+" : ""}${result.changePct.toFixed(2)}%`}
            valueClass={result.changePct >= 0 ? "text-[#62D84E]" : "text-[#FF4757]"} />
          <Stat label="Volume"  value={fmtVol(result.volume)} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Card({
  icon, title, color = "green", children,
}: {
  icon:     React.ReactNode
  title:    string
  color?:   "green" | "red" | "teal"
  children: React.ReactNode
}) {
  const borderColor = color === "red" ? "rgba(255,71,87,0.2)" : color === "teal" ? "rgba(77,217,192,0.2)" : "rgba(98,216,78,0.2)"
  const textColor   = color === "red" ? "#FF4757" : color === "teal" ? "#4DD9C0" : "#62D84E"
  return (
    <div className="p-3.5 rounded-lg bg-[rgba(255,255,255,0.02)] border space-y-2" style={{ borderColor }}>
      <div className="flex items-center gap-1.5 text-xs font-600 uppercase tracking-wider" style={{ color: textColor }}>
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-[#5A8080] shrink-0 w-24">{label}</span>
      <span className={cn("text-[#A8C4C0] text-right", mono && "font-mono")}>{value}</span>
    </div>
  )
}

function Stat({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <div className="text-[#5A8080] text-[10px] uppercase tracking-wider">{label}</div>
      <div className={cn("font-mono font-700 text-sm mt-0.5", valueClass)}>{value}</div>
    </div>
  )
}

function StrategySkeleton() {
  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-[rgba(255,255,255,0.04)] animate-pulse" />
      ))}
    </div>
  )
}

function fmtVol(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}
