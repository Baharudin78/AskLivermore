"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type Time,
  type LineData,
} from "lightweight-charts"
import type { OHLCV } from "@/types"

interface StrategyChartProps {
  ohlcv:       OHLCV[]
  pattern:     string
  entryZone:   [number, number]
  stopLoss:    number
  targets:     number[]
  height?:     number
}

export function StrategyChart({
  ohlcv,
  pattern,
  entryZone,
  stopLoss,
  targets,
  height = 340,
}: StrategyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || ohlcv.length < 20) return

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: height - 80,   // reserve space for volume
      layout: {
        background: { type: ColorType.Solid, color: "#081A1A" },
        textColor:  "#5A8080",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair:       { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale:       { borderColor: "rgba(255,255,255,0.1)", timeVisible: true },
    })
    chartRef.current = chart

    const sliced = ohlcv.slice(-90)

    // ── Candlestick ───────────────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:         "#62D84E",
      downColor:       "#FF4757",
      borderUpColor:   "#62D84E",
      borderDownColor: "#FF4757",
      wickUpColor:     "#62D84E",
      wickDownColor:   "#FF4757",
    })
    candleSeries.setData(
      sliced.map((b) => ({ time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close }))
    )

    // ── SMA50 ─────────────────────────────────────────────────────────────────
    if (ohlcv.length >= 50) {
      const closes = ohlcv.map((b) => b.close)
      const sma50: LineData[] = []
      for (let i = 49; i < ohlcv.length; i++) {
        const avg = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50
        sma50.push({ time: ohlcv[i].time as Time, value: avg })
      }
      const sma50Series = chart.addSeries(LineSeries, {
        color: "#FFB800", lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
        title: "SMA50",
      })
      sma50Series.setData(sma50.slice(-90))
    }

    // ── SMA200 ────────────────────────────────────────────────────────────────
    if (ohlcv.length >= 200) {
      const closes = ohlcv.map((b) => b.close)
      const sma200: LineData[] = []
      for (let i = 199; i < ohlcv.length; i++) {
        const avg = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200
        sma200.push({ time: ohlcv[i].time as Time, value: avg })
      }
      const sma200Series = chart.addSeries(LineSeries, {
        color: "#8B5CF6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
        title: "SMA200",
      })
      sma200Series.setData(sma200.slice(-90))
    }

    // ── Entry zone band (two dashed lines + price line) ───────────────────────
    const [entryLow, entryHigh] = entryZone
    const entryLineData = sliced.map((b) => ({ time: b.time as Time, value: entryLow }))

    const entryLowSeries = chart.addSeries(LineSeries, {
      color: "rgba(98,216,78,0.8)", lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: true, title: "Entry",
    })
    entryLowSeries.setData(entryLineData)

    if (entryHigh !== entryLow) {
      const entryHighSeries = chart.addSeries(LineSeries, {
        color: "rgba(98,216,78,0.4)", lineWidth: 1, lineStyle: 2,
        priceLineVisible: false, lastValueVisible: false,
      })
      entryHighSeries.setData(sliced.map((b) => ({ time: b.time as Time, value: entryHigh })))
    }

    // ── Stop loss ─────────────────────────────────────────────────────────────
    const slSeries = chart.addSeries(LineSeries, {
      color: "rgba(255,71,87,0.9)", lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: true, title: `SL $${stopLoss}`,
    })
    slSeries.setData(sliced.map((b) => ({ time: b.time as Time, value: stopLoss })))

    // ── Targets ───────────────────────────────────────────────────────────────
    const targetColors = ["rgba(77,217,192,0.7)", "rgba(98,216,78,0.8)", "rgba(255,184,0,0.8)"]
    const targetLabels = ["T1", "T2", "T3"]
    targets.forEach((price, idx) => {
      if (!price) return
      const targetSeries = chart.addSeries(LineSeries, {
        color:            targetColors[idx] ?? "rgba(98,216,78,0.7)",
        lineWidth:        1,
        lineStyle:        0,   // solid
        priceLineVisible: false,
        lastValueVisible: true,
        title:            `${targetLabels[idx]} $${price}`,
      })
      targetSeries.setData(sliced.map((b) => ({ time: b.time as Time, value: price })))
    })

    chart.timeScale().fitContent()

    // ── Volume pane (separate chart below) ────────────────────────────────────
    const volContainer = containerRef.current.querySelector<HTMLDivElement>(".vol-pane")
    if (volContainer) {
      const volChart = createChart(volContainer, {
        width:  volContainer.clientWidth,
        height: 70,
        layout: { background: { type: ColorType.Solid, color: "#081A1A" }, textColor: "transparent" },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        crosshair:       { mode: CrosshairMode.Hidden },
        rightPriceScale: { visible: false },
        leftPriceScale:  { visible: false },
        timeScale:       { visible: false, borderVisible: false },
        handleScroll: false, handleScale: false,
      })
      const volSeries = volChart.addSeries(HistogramSeries, {
        color:            "rgba(77,217,192,0.3)",
        priceLineVisible: false,
        lastValueVisible: false,
      })
      volSeries.setData(
        sliced.map((b) => ({
          time:  b.time as Time,
          value: b.volume,
          color: b.close >= b.open ? "rgba(98,216,78,0.3)" : "rgba(255,71,87,0.25)",
        }))
      )
      volChart.timeScale().fitContent()
    }

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        chart.applyOptions({ width: w })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ohlcv, pattern, entryZone[0], entryZone[1], stopLoss, targets.join(","), height])

  if (ohlcv.length < 20) {
    return (
      <div className="flex items-center justify-center text-[#5A8080] text-sm rounded-lg bg-[#081A1A]" style={{ height }}>
        Insufficient chart data
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden bg-[#081A1A]" style={{ height }}>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-3 pt-2 pb-1 text-[10px] font-mono">
        <LegendItem color="#FFB800" label="SMA50" />
        <LegendItem color="#8B5CF6" label="SMA200" />
        <LegendItem color="#62D84E" label="Entry zone" />
        <LegendItem color="#FF4757" label="Stop loss" />
        {targets.map((_, i) => (
          <LegendItem key={i} color={["#4DD9C0","#62D84E","#FFB800"][i]} label={`T${i+1}`} />
        ))}
      </div>
      {/* Main candlestick pane */}
      <div ref={containerRef} style={{ height: height - 80 }} />
      {/* Volume pane */}
      <div className="vol-pane" style={{ height: 70 }} />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[#5A8080]">
      <span className="inline-block w-5 h-px" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
