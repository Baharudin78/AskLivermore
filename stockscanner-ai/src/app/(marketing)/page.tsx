import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "StockScanner AI — AI-Powered Stock Scanner & Market Intelligence",
  description:
    "Scan 5000+ US stocks with 30+ pattern scanners. Bull Flag, VCP, Cup & Handle. AI entry strategies with entry, stop loss, and targets. Free to start.",
  keywords: [
    "stock scanner",
    "bull flag scanner",
    "VCP scanner",
    "swing trading tools",
    "AI stock analysis",
    "technical analysis",
  ],
}

export default function HomePage() {
  return (
    <section className="hero-section min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-display font-800 text-white leading-tight mb-6">
          AI-Powered{" "}
          <span className="text-[#62D84E]">Stock Scanner</span>{" "}
          for Serious Traders
        </h1>
        <p className="text-lg text-[#A8C4C0] mb-10 leading-relaxed">
          Scan 5000+ US stocks with 30+ pattern-based scanners. Get AI entry strategies
          with precise entry, stop loss, and profit targets.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-8 py-3.5 rounded-full bg-[#62D84E] text-[#050E0E] font-600 text-base hover:bg-[#8FFF70] transition-colors glow-green"
          >
            Start Scanning Free
          </Link>
          <Link
            href="/learn"
            className="px-8 py-3.5 rounded-full border border-[rgba(98,216,78,0.4)] text-[#62D84E] font-600 text-base hover:bg-[rgba(98,216,78,0.08)] transition-colors"
          >
            Learn More
          </Link>
        </div>
        <p className="mt-6 text-[#5A8080] text-sm">Coming in Phase 10 — Full landing page.</p>
      </div>
    </section>
  )
}
