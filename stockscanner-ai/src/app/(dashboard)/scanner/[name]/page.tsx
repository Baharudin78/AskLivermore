import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getAllScannerSlugs, getScannerMeta } from "@/lib/scanners/registry"
import { ScannerPageClient } from "./ScannerPageClient"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface PageProps {
  params: Promise<{ name: string }>
}

export async function generateStaticParams() {
  return getAllScannerSlugs().map((slug) => ({ name: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params
  const meta     = getScannerMeta(name)
  if (!meta) return { title: "Scanner Not Found" }

  return {
    title:       `${meta.name} Scanner — ${meta.description}`,
    description: meta.seoDescription,
    keywords:    meta.seoKeywords,
    alternates:  { canonical: `/scanner/${name}` },
    robots:      { index: false, follow: false },
    openGraph: {
      title:       `${meta.name} Scanner | StockScanner AI`,
      description: meta.seoDescription,
    },
  }
}

export default async function ScannerPage({ params }: PageProps) {
  const { name } = await params
  const meta     = getScannerMeta(name)
  if (!meta) notFound()

  return (
    <div>
      {/* Breadcrumb is handled by Header */}

      {/* Scanner header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <h1 className="text-2xl font-display font-700 text-white">{meta.name} Scanner</h1>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 border ${
              meta.signal === "bullish"
                ? "bg-[rgba(98,216,78,0.12)] text-[#62D84E] border-[rgba(98,216,78,0.25)]"
                : "bg-[rgba(255,71,87,0.12)] text-[#FF4757] border-[rgba(255,71,87,0.25)]"
            }`}
          >
            {meta.signal}
          </span>
          {meta.traderRef && (
            <span className="text-[#4DD9C0] text-sm">by {meta.traderRef}</span>
          )}
        </div>
        <p className="text-[#A8C4C0] text-sm">{meta.seoDescription}</p>
      </div>

      <Suspense fallback={<ScannerLoadingSkeleton />}>
        <ScannerPageClient scannerSlug={name} meta={meta} />
      </Suspense>
    </div>
  )
}

function ScannerLoadingSkeleton() {
  return (
    <div>
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {[120, 100, 90, 110, 95].map((w, i) => (
          <div key={i} className="h-9 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse shrink-0" style={{ width: w }} />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
