import { cn } from "@/lib/utils"

interface SectorBadgeProps {
  sector:     string
  className?: string
}

/* GICS sector → color accent */
const SECTOR_COLORS: Record<string, string> = {
  "Technology":             "text-[#4DD9C0] bg-[rgba(77,217,192,0.10)] border-[rgba(77,217,192,0.20)]",
  "Health Care":            "text-[#FF4757] bg-[rgba(255,71,87,0.10)] border-[rgba(255,71,87,0.20)]",
  "Financials":             "text-[#FFB800] bg-[rgba(255,184,0,0.10)] border-[rgba(255,184,0,0.20)]",
  "Consumer Discretionary": "text-[#62D84E] bg-[rgba(98,216,78,0.10)] border-[rgba(98,216,78,0.20)]",
  "Industrials":            "text-[#8FFF70] bg-[rgba(143,255,112,0.10)] border-[rgba(143,255,112,0.20)]",
  "Communication Services": "text-[#A78BFA] bg-[rgba(167,139,250,0.10)] border-[rgba(167,139,250,0.20)]",
  "Energy":                 "text-[#FFA500] bg-[rgba(255,165,0,0.10)] border-[rgba(255,165,0,0.20)]",
  "Materials":              "text-[#4DD9C0] bg-[rgba(77,217,192,0.10)] border-[rgba(77,217,192,0.20)]",
  "Real Estate":            "text-[#FFB800] bg-[rgba(255,184,0,0.10)] border-[rgba(255,184,0,0.20)]",
  "Consumer Staples":       "text-[#62D84E] bg-[rgba(98,216,78,0.10)] border-[rgba(98,216,78,0.20)]",
  "Utilities":              "text-[#A8C4C0] bg-[rgba(168,196,192,0.10)] border-[rgba(168,196,192,0.20)]",
}

const DEFAULT_COLORS =
  "text-[#A8C4C0] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.10)]"

export function SectorBadge({ sector, className }: SectorBadgeProps) {
  const colors = SECTOR_COLORS[sector] ?? DEFAULT_COLORS
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-500 border",
        colors,
        className
      )}
    >
      {sector}
    </span>
  )
}
