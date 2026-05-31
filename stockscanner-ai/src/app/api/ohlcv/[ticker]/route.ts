import { NextRequest, NextResponse } from "next/server"
import { getStockBars } from "@/lib/polygon/client"
import { getCachedOHLCV } from "@/lib/supabase/cache"

interface RouteParams {
  params: Promise<{ ticker: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { ticker } = await params

  // Try Supabase cache first
  const { data: cached } = await getCachedOHLCV(ticker, 260)
  if (cached && cached.length >= 20) {
    return NextResponse.json({ bars: cached, fromCache: true })
  }

  const { data: bars, error } = await getStockBars(ticker, 260)
  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch OHLCV: ${error}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ bars, fromCache: false })
}
