"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type LineData,
  type Time,
} from "lightweight-charts"
import type { OHLCV } from "@/types"

interface MiniChartProps {
  ohlcv:       OHLCV[]
  pattern:     string
  patternData: Record<string, unknown>
  height?:     number
}

export function MiniChart({ ohlcv, pattern, patternData, height = 160 }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || ohlcv.length < 10) return

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#081A1A" },
        textColor:  "transparent",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair:       { mode: CrosshairMode.Hidden },
      rightPriceScale: { visible: false },
      leftPriceScale:  { visible: false },
      timeScale:       { visible: false, borderVisible: false },
      handleScroll:    false,
      handleScale:     false,
    })
    chartRef.current = chart

    const sliced = ohlcv.slice(-60)

    // ── Candlestick series (v5 API) ───────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:         "#62D84E",
      downColor:       "#FF4757",
      borderUpColor:   "#62D84E",
      borderDownColor: "#FF4757",
      wickUpColor:     "#62D84E",
      wickDownColor:   "#FF4757",
    })

    candleSeries.setData(
      sliced.map((b) => ({
        time:  b.time as Time,
        open:  b.open,
        high:  b.high,
        low:   b.low,
        close: b.close,
      }))
    )

    // ── SMA50 line ────────────────────────────────────────────────────────
    if (ohlcv.length >= 50) {
      const closes  = ohlcv.map((b) => b.close)
      const smaData: LineData[] = []
      for (let i = 49; i < ohlcv.length; i++) {
        const avg = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50
        smaData.push({ time: ohlcv[i].time as Time, value: avg })
      }

      const smaSeries = chart.addSeries(LineSeries, {
        color:            "#FFB800",
        lineWidth:        1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      smaSeries.setData(smaData.slice(-60))
    }

    // ── Pattern-specific overlays ─────────────────────────────────────────
    addPatternOverlay(chart, candleSeries, pattern, patternData, sliced)

    chart.timeScale().fitContent()

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [ohlcv, pattern, patternData, height])

  if (ohlcv.length < 10) {
    return (
      <div
        className="rounded-lg bg-[#081A1A] flex items-center justify-center text-[#5A8080] text-xs"
        style={{ height }}
      >
        Insufficient data
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------------------
// Pattern overlay helpers (v5 API)
// ---------------------------------------------------------------------------

function addPatternOverlay(
  chart:    IChartApi,
  candles:  ISeriesApi<SeriesType>,
  pattern:  string,
  data:     Record<string, unknown>,
  sliced:   OHLCV[]
) {
  switch (pattern) {
    case "bull-flag":
      addHorizontalLine(chart, data.breakoutLevel as number | undefined, "rgba(98,216,78,0.6)", sliced)
      break
    case "vcp":
      addHorizontalLine(chart, data.latestPivotHigh as number | undefined, "rgba(77,217,192,0.6)", sliced)
      break
    case "golden-cross":
    case "macd-cross":
      addCrossMarker(chart, candles, data, sliced, pattern)
      break
    default:
      break
  }
}

function addHorizontalLine(
  chart: IChartApi,
  level: number | undefined,
  color: string,
  sliced: OHLCV[]
) {
  if (!level) return
  const series = chart.addSeries(LineSeries, {
    color,
    lineWidth:        1,
    lineStyle:        2,   // dashed
    priceLineVisible: false,
    lastValueVisible: false,
  })
  series.setData(sliced.map((b) => ({ time: b.time as Time, value: level })))
}

function addCrossMarker(
  _chart:  IChartApi,
  candles: ISeriesApi<SeriesType>,
  data:    Record<string, unknown>,
  sliced:  OHLCV[],
  pattern: string
) {
  const daysAgo  = (data.crossDaysAgo as number) ?? 0
  const crossBar = sliced[sliced.length - 1 - daysAgo]
  if (!crossBar) return

  createSeriesMarkers(candles, [
    {
      time:     crossBar.time as Time,
      position: "belowBar",
      color:    pattern === "golden-cross" ? "#FFB800" : "#62D84E",
      shape:    "arrowUp",
      text:     pattern === "golden-cross" ? "GX" : "MACD",
      size:     1,
    },
  ])
}
