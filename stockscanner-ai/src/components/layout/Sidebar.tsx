"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { UserButton } from "@clerk/nextjs"
import {
  Newspaper,
  ScanSearch,
  Trophy,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SCANNERS = [
  { slug: "bull-flag",      name: "Bull Flag" },
  { slug: "vcp",            name: "VCP" },
  { slug: "trend-template", name: "Trend Template" },
  { slug: "macd-cross",     name: "MACD Cross" },
  { slug: "golden-cross",   name: "Golden Cross" },
]

interface NavItem {
  label:    string
  href:     string
  icon:     React.ReactNode
  children?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Today's Brief",
    href:  "/brief",
    icon:  <Newspaper size={18} />,
  },
  {
    label: "Stock Scanner",
    href:  "/scanner",
    icon:  <ScanSearch size={18} />,
    children: SCANNERS.map((s) => ({
      label: s.name,
      href:  `/scanner/${s.slug}`,
    })),
  },
  {
    label: "Top 100",
    href:  "/top-100",
    icon:  <Trophy size={18} />,
  },
  {
    label: "Theme Tracker",
    href:  "/themes",
    icon:  <Layers size={18} />,
  },
  {
    label: "Learn",
    href:  "/learn",
    icon:  <BookOpen size={18} />,
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(
    pathname.startsWith("/scanner")
  )

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 flex flex-col",
          "bg-[#050E0E] border-r border-[rgba(255,255,255,0.06)]",
          "transition-transform duration-300 ease-in-out",
          // Desktop: always visible
          "lg:translate-x-0 lg:static lg:z-auto",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <Link href="/brief" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#62D84E] flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-[#050E0E]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-display font-700 text-sm tracking-tight">
                StockScanner
              </span>
              <span className="text-[#62D84E] font-display font-600 text-xs tracking-wider uppercase">
                AI
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-[#5A8080] hover:text-white transition-colors p-1"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            const hasChildren = !!item.children

            if (hasChildren) {
              return (
                <div key={item.href}>
                  {/* Parent scanner item */}
                  <button
                    onClick={() => setScannerOpen((v) => !v)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                      isActive
                        ? "nav-active font-600"
                        : "text-[#A8C4C0] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                    )}
                    aria-expanded={scannerOpen}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-[#62D84E]" : "text-[#5A8080]"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {scannerOpen
                      ? <ChevronDown size={14} className="text-[#5A8080]" />
                      : <ChevronRight size={14} className="text-[#5A8080]" />
                    }
                  </button>

                  {/* Sub-items */}
                  {scannerOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[rgba(255,255,255,0.06)] pl-3">
                      {item.children!.map((child) => {
                        const childActive = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "block px-3 py-2 rounded-md text-xs transition-all duration-150",
                              childActive
                                ? "text-[#62D84E] bg-[rgba(98,216,78,0.08)] font-600"
                                : "text-[#5A8080] hover:text-[#A8C4C0] hover:bg-[rgba(255,255,255,0.04)]"
                            )}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                      {/* Link to all scanners */}
                      <Link
                        href="/scanner"
                        className="block px-3 py-2 rounded-md text-xs text-[#62D84E] hover:bg-[rgba(98,216,78,0.06)] transition-all duration-150"
                      >
                        View all →
                      </Link>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "nav-active font-600"
                    : "text-[#A8C4C0] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                )}
              >
                <span className={isActive ? "text-[#62D84E]" : "text-[#5A8080]"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[#A8C4C0] truncate">My Account</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
