import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { SCANNER_METADATA } from "@/lib/scanners/registry"
import { StockBadge } from "@/components/ui/stock-badge"

export const metadata: Metadata = {
  title: "Stock Scanner — 5 Pattern-Based Scanners",
  description:
    "Scan US stocks with Bull Flag, VCP, Trend Template, MACD Cross, and Golden Cross scanners. AI-powered pattern detection updated daily.",
  keywords: [
    "stock scanner", "bull flag scanner", "VCP scanner",
    "technical analysis scanner", "pattern scanner",
  ],
  robots: { index: false, follow: false },
}

export default function ScannerIndexPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-700 text-white mb-2">
          Stock Scanner
        </h1>
        <p className="text-[#A8C4C0]">
          Pattern-based scanners updated daily. Click a scanner to see today&apos;s results.
        </p>
      </div>

      {/* Scanner cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SCANNER_METADATA.map((scanner) => (
          <Link
            key={scanner.slug}
            href={`/scanner/${scanner.slug}`}
            className="group flex flex-col gap-4 p-5 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(145deg,#0D3535_0%,#081A1A_100%)] hover:border-[rgba(98,216,78,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(98,216,78,0.12)] hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-white font-display font-700 text-base mb-1">
                  {scanner.name}
                </h2>
                <p className="text-[#A8C4C0] text-sm leading-snug line-clamp-2">
                  {scanner.description}
                </p>
              </div>
              <StockBadge signal={scanner.signal} label={scanner.signal} className="shrink-0 capitalize" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {scanner.timeframe.map((tf) => (
                <span
                  key={tf}
                  className="px-2 py-0.5 rounded-md text-[10px] font-500 bg-[rgba(255,255,255,0.06)] text-[#5A8080] border border-[rgba(255,255,255,0.08)] uppercase tracking-wider"
                >
                  {tf}
                </span>
              ))}
              {scanner.category.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 rounded-md text-[10px] font-500 bg-[rgba(77,217,192,0.08)] text-[#4DD9C0] border border-[rgba(77,217,192,0.15)]"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-1.5 text-[#5A8080] text-xs">
                <Users size={12} />
                <span>{scanner.likes.toLocaleString()} traders</span>
                {scanner.traderRef && (
                  <span className="text-[#4DD9C0]">· {scanner.traderRef}</span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[#62D84E] text-xs font-600 group-hover:gap-2 transition-all">
                Run Scanner <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
