import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price:      number
  decimals?:  number   // default: 2
  prefix?:    string   // default: "$"
  className?: string
}

export function PriceDisplay({
  price,
  decimals = 2,
  prefix = "$",
  className,
}: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price)

  return (
    <span
      className={cn("font-ticker text-white font-500", className)}
      aria-label={`Price ${prefix}${formatted}`}
    >
      {prefix}{formatted}
    </span>
  )
}
