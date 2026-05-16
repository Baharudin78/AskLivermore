"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbSegment {
  label: string
  href:  string
}

/* Maps URL segments to human-readable labels */
const SEGMENT_LABELS: Record<string, string> = {
  brief:            "Today's Brief",
  scanner:          "Stock Scanner",
  "top-100":        "Top 100",
  themes:           "Theme Tracker",
  learn:            "Learn",
  "bull-flag":      "Bull Flag",
  vcp:              "VCP",
  "trend-template": "Trend Template",
  "macd-cross":     "MACD Cross",
  "golden-cross":   "Golden Cross",
}

function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: BreadcrumbSegment[] = [{ label: "Home", href: "/brief" }]
  let accumulated = ""
  for (const seg of segments) {
    accumulated += `/${seg}`
    crumbs.push({
      label: SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " "),
      href:  accumulated,
    })
  }
  return crumbs
}

/** JSON-LD BreadcrumbList for SEO */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbSegment[],
  baseUrl: string
): object {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type":    "ListItem",
      position:   idx + 1,
      name:       item.label,
      item:       `${baseUrl}${item.href}`,
    })),
  }
}

function MarketStatusBadge() {
  const now   = new Date()
  const day   = now.getUTCDay()
  const hours = now.getUTCHours()
  // NYSE: Mon-Fri 13:30–20:00 UTC
  const isOpen =
    day >= 1 && day <= 5 &&
    (hours > 13 || (hours === 13 && now.getUTCMinutes() >= 30)) &&
    hours < 20

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 font-mono",
        isOpen
          ? "bg-[rgba(98,216,78,0.12)] text-[#62D84E] border border-[rgba(98,216,78,0.25)]"
          : "bg-[rgba(255,255,255,0.06)] text-[#5A8080] border border-[rgba(255,255,255,0.08)]"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isOpen ? "bg-[#62D84E] animate-pulse" : "bg-[#5A8080]"
        )}
      />
      {isOpen ? "MARKET OPEN" : "MARKET CLOSED"}
    </span>
  )
}

interface HeaderProps {
  onMobileMenuOpen: () => void
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const pathname   = usePathname()
  const breadcrumbs = buildBreadcrumbs(pathname)

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,14,14,0.85)] backdrop-blur-md"
      aria-label="Site header"
    >
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="lg:hidden text-[#5A8080] hover:text-white transition-colors p-1 -ml-1"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span className="text-[#5A8080] text-xs">/</span>
              )}
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-white font-500 capitalize">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-[#5A8080] hover:text-[#A8C4C0] transition-colors capitalize"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Mobile: show current page only */}
        <span className="sm:hidden text-white font-600 text-sm capitalize">
          {breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard"}
        </span>
      </div>

      {/* Right: market status + search + bell */}
      <div className="flex items-center gap-2 lg:gap-3">
        <MarketStatusBadge />

        {/* Global search placeholder — implemented in Phase 11 */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#5A8080] hover:text-[#A8C4C0] hover:border-[rgba(255,255,255,0.12)] transition-all text-sm"
          aria-label="Search stocks (⌘K)"
        >
          <Search size={14} />
          <span className="hidden md:inline text-xs">Search stocks…</span>
          <kbd className="hidden md:inline text-xs bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {/* Mobile search icon */}
        <button
          className="sm:hidden text-[#5A8080] hover:text-white transition-colors p-1"
          aria-label="Search stocks"
        >
          <Search size={18} />
        </button>

        <button
          className="relative text-[#5A8080] hover:text-white transition-colors p-1"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#62D84E]" />
        </button>
      </div>
    </header>
  )
}
