import { cn } from "@/lib/utils"

interface StockRatingsProps {
  taScore:   number
  faScore:   number
  arsRating: number
  alsScore:  number
  size?:     "sm" | "md" | "lg"
}

export function StockRatings({
  taScore,
  faScore,
  arsRating,
  alsScore,
  size = "md",
}: StockRatingsProps) {
  if (size === "sm") return <SmRatings {...{ taScore, faScore, arsRating, alsScore }} />
  if (size === "lg") return <LgRatings {...{ taScore, faScore, arsRating, alsScore }} />
  return <MdRatings {...{ taScore, faScore, arsRating, alsScore }} />
}

// ---------------------------------------------------------------------------
// sm — single inline line, mono text
// ---------------------------------------------------------------------------

function SmRatings({ taScore, faScore, arsRating, alsScore }: Omit<StockRatingsProps, "size">) {
  return (
    <span className="font-ticker text-xs text-[#A8C4C0] space-x-2">
      <span>TA {taScore.toFixed(1)}</span>
      <span className="text-[#5A8080]">·</span>
      <span>FA {faScore.toFixed(1)}</span>
      <span className="text-[#5A8080]">·</span>
      <span>RS {arsRating}</span>
      <span className="text-[#5A8080]">·</span>
      <span className={alsColor(alsScore)}>ALS {alsScore}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// md — 4 pill badges
// ---------------------------------------------------------------------------

function MdRatings({ taScore, faScore, arsRating, alsScore }: Omit<StockRatingsProps, "size">) {
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Stock ratings">
      <RatingPill label="TA"  value={taScore.toFixed(1)}   color="text-[#4DD9C0]" />
      <RatingPill label="FA"  value={faScore.toFixed(1)}   color="text-[#4DD9C0]" />
      <RatingPill label="RS"  value={String(arsRating)}    color="text-[#FFB800]" />
      <RatingPill label="ALS" value={String(alsScore)}     color={alsColor(alsScore)} highlight />
    </div>
  )
}

function RatingPill({
  label,
  value,
  color,
  highlight = false,
}: {
  label:      string
  value:      string
  color:      string
  highlight?: boolean
}) {
  return (
    <span
      role="listitem"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border",
        highlight
          ? "bg-[rgba(98,216,78,0.08)] border-[rgba(98,216,78,0.2)]"
          : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
      )}
    >
      <span className="text-[#5A8080]">{label}</span>
      <span className={cn("font-ticker font-semibold", color)}>{value}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// lg — 4 cards with bar chart
// ---------------------------------------------------------------------------

function LgRatings({ taScore, faScore, arsRating, alsScore }: Omit<StockRatingsProps, "size">) {
  const items = [
    { label: "Technical",      value: taScore,           max: 10,  display: taScore.toFixed(1),   color: "bg-[#4DD9C0]" },
    { label: "Fundamental",    value: faScore,           max: 10,  display: faScore.toFixed(1),   color: "bg-[#4DD9C0]" },
    { label: "Rel. Strength",  value: arsRating,         max: 99,  display: String(arsRating),    color: "bg-[#FFB800]" },
    { label: "ALS Composite",  value: alsScore,          max: 99,  display: String(alsScore),     color: alsBarColor(alsScore) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3" role="list" aria-label="Stock ratings">
      {items.map((item) => (
        <div
          key={item.label}
          role="listitem"
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3"
        >
          <p className="text-xs text-[#5A8080] mb-1">{item.label}</p>
          <p className={cn("font-ticker font-bold text-xl mb-2", item.label === "ALS Composite" ? alsColor(item.value) : "text-white")}>
            {item.display}
          </p>
          <div className="h-1 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", item.color)}
              style={{ width: `${Math.min((item.value / item.max) * 100, 100).toFixed(1)}%` }}
              role="progressbar"
              aria-valuenow={item.value}
              aria-valuemin={0}
              aria-valuemax={item.max}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function alsColor(score: number): string {
  if (score >= 80) return "text-[#62D84E]"
  if (score >= 60) return "text-[#FFB800]"
  return "text-[#5A8080]"
}

function alsBarColor(score: number): string {
  if (score >= 80) return "bg-[#62D84E]"
  if (score >= 60) return "bg-[#FFB800]"
  return "bg-[#5A8080]"
}
