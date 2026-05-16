import { cn } from "@/lib/utils"

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-[rgba(255,255,255,0.06)] animate-pulse",
        className
      )}
    />
  )
}

/** Skeleton that matches ScannerResultCard dimensions */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card-surface p-4 flex flex-col gap-3",
        className
      )}
      aria-hidden="true"
    >
      {/* Header: ticker + sector */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-6 w-16" />
          <Shimmer className="h-3.5 w-28" />
        </div>
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>

      {/* Chart area */}
      <Shimmer className="h-40 w-full rounded-lg" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Shimmer className="h-10" />
        <Shimmer className="h-10" />
        <Shimmer className="h-10" />
      </div>

      {/* Footer: setup quality + button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Shimmer className="h-3.5 w-20" />
          <Shimmer className="h-2 w-full rounded-full" />
        </div>
        <Shimmer className="h-8 w-28 rounded-full" />
      </div>
    </div>
  )
}

/** Skeleton row matching ScannerResultRow */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-4 px-4 py-3", className)}
      aria-hidden="true"
    >
      <Shimmer className="h-4 w-6" />
      <div className="flex flex-col gap-1 flex-1">
        <Shimmer className="h-4 w-14" />
        <Shimmer className="h-3 w-32" />
      </div>
      <Shimmer className="h-4 w-16" />
      <Shimmer className="h-4 w-14" />
      <Shimmer className="h-4 w-20" />
      <Shimmer className="h-6 w-12 rounded-full" />
    </div>
  )
}
