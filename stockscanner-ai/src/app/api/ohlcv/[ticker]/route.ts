import { NextRequest, NextResponse } from "next/server"
import { getStockBars } from "@/lib/polygon/client"

interface RouteParams {
  params: Promise<{ ticker: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { ticker } = await params

  // Try Supabase cache first
  try {
    const { getCachedOHLCV } = await import("@/lib/supabase/cache")
    const cached = await getCachedOHLCV(ticker, 260)
    if (cached && cached.length >= 20) {
      return NextResponse.json({ bars: cached, fromCache: true })
    }
  } catch { /* fall through */ }

  try {
    const bars = await getStockBars(ticker, 260)
    return NextResponse.json({ bars, fromCache: false })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch OHLCV: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 }
    )
  }
}
