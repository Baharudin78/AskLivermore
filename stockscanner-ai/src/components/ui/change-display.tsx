import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChangeDisplayProps {
  value:      number       // percentage change, e.g. 2.45 = +2.45%
  showArrow?: boolean
  className?: string
}

export function ChangeDisplay({ value, showArrow = true, className }: ChangeDisplayProps) {
  const isUp      = value > 0
  const isDown    = value < 0
  const formatted = `${isUp ? "+" : ""}${value.toFixed(2)}%`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-ticker text-sm font-500",
        isUp   ? "text-[#62D84E]" :
        isDown ? "text-[#FF4757]" :
                 "text-[#A8C4C0]",
        className
      )}
    >
      {showArrow && (
        isUp   ? <TrendingUp  size={14} aria-hidden="true" /> :
        isDown ? <TrendingDown size={14} aria-hidden="true" /> :
                 <Minus size={14} aria-hidden="true" />
      )}
      <span aria-label={`${isUp ? "up" : isDown ? "down" : "unchanged"} ${Math.abs(value).toFixed(2)} percent`}>
        {formatted}
      </span>
    </span>
  )
}
