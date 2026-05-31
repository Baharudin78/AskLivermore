import type { Metadata } from "next"
import { Suspense }      from "react"
import { Top100Client }  from "./Top100Client"
import { SkeletonCard }  from "@/components/ui/skeleton-card"

export const metadata: Metadata = {
  title:       "Livermore Top 100™ — AI-Ranked Stock Portfolio | StockScanner AI",
  description: "Daily-updated equal-weighted portfolio of 100 highest-rated US stocks by ALS composite score.",
  robots:      { index: false, follow: false },
}

export default function Top100Page() {
  return (
    <Suspense fallback={<Top100Skeleton />}>
      <Top100Client />
    </Suspense>
  )
}

function Top100Skeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-64 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
        <div className="h-4 w-96 rounded bg-[rgba(255,255,255,0.04)] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-[rgba(255,255,255,0.04)] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
