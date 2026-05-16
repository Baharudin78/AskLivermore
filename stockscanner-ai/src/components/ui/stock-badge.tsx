import { cn } from "@/lib/utils"
import type { SignalType } from "@/types"

interface StockBadgeProps {
  signal: SignalType
  label:  string
  className?: string
}

const CONFIG: Record<SignalType, { bg: string; text: string; border: string }> = {
  bullish: {
    bg:     "bg-[rgba(98,216,78,0.12)]",
    text:   "text-[#62D84E]",
    border: "border-[rgba(98,216,78,0.25)]",
  },
  bearish: {
    bg:     "bg-[rgba(255,71,87,0.12)]",
    text:   "text-[#FF4757]",
    border: "border-[rgba(255,71,87,0.25)]",
  },
  neutral: {
    bg:     "bg-[rgba(255,184,0,0.12)]",
    text:   "text-[#FFB800]",
    border: "border-[rgba(255,184,0,0.25)]",
  },
}

export function StockBadge({ signal, label, className }: StockBadgeProps) {
  const c = CONFIG[signal]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600 border",
        c.bg, c.text, c.border,
        className
      )}
    >
      {label}
    </span>
  )
}
