import Link from "next/link"
import { TrendingUp } from "lucide-react"

function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,14,14,0.85)] backdrop-blur-md"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#62D84E] flex items-center justify-center">
            <TrendingUp size={16} className="text-[#050E0E]" strokeWidth={2.5} />
          </div>
          <span className="text-white font-display font-700 text-base tracking-tight">
            StockScanner <span className="text-[#62D84E]">AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm"
          aria-label="Marketing navigation"
        >
          <Link href="/scanner" className="text-[#A8C4C0] hover:text-white transition-colors">
            Scanner
          </Link>
          <Link href="/learn" className="text-[#A8C4C0] hover:text-white transition-colors">
            Learn
          </Link>
          <Link href="/sign-in" className="text-[#A8C4C0] hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 rounded-full bg-[#62D84E] text-[#050E0E] font-600 text-sm hover:bg-[#8FFF70] transition-colors"
          >
            Start Free
          </Link>
        </nav>

        {/* Mobile CTA */}
        <Link
          href="/sign-up"
          className="md:hidden px-3 py-1.5 rounded-full bg-[#62D84E] text-[#050E0E] font-600 text-sm"
        >
          Start Free
        </Link>
      </div>
    </header>
  )
}

function MarketingFooter() {
  return (
    <footer
      className="border-t border-[rgba(255,255,255,0.06)] bg-[#050E0E]"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#62D84E] flex items-center justify-center">
                <TrendingUp size={14} className="text-[#050E0E]" strokeWidth={2.5} />
              </div>
              <span className="text-white font-display font-700 text-sm">
                StockScanner <span className="text-[#62D84E]">AI</span>
              </span>
            </div>
            <p className="text-[#5A8080] text-sm leading-relaxed max-w-xs">
              AI-powered stock scanning and market intelligence for serious traders.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-white font-600 text-sm mb-3">Product</h3>
            <ul className="space-y-2">
              {[
                { label: "Scanner",       href: "/scanner" },
                { label: "Top 100",       href: "/top-100" },
                { label: "Theme Tracker", href: "/themes" },
                { label: "Market Brief",  href: "/market-brief" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#5A8080] hover:text-[#A8C4C0] text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn + legal */}
          <div>
            <h3 className="text-white font-600 text-sm mb-3">Resources</h3>
            <ul className="space-y-2">
              {[
                { label: "Learn",         href: "/learn" },
                { label: "Bull Flag",     href: "/learn/bull-flag-pattern" },
                { label: "VCP Pattern",   href: "/learn/vcp-pattern" },
                { label: "Sitemap",       href: "/sitemap.xml" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#5A8080] hover:text-[#A8C4C0] text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[#5A8080] text-xs">
            © {new Date().getFullYear()} StockScanner AI. All rights reserved.
          </p>
          <p className="text-[#5A8080] text-xs max-w-md">
            <strong className="text-[#A8C4C0]">Disclaimer:</strong> StockScanner AI is for informational
            purposes only. Not financial advice. Trading involves risk of loss.
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
