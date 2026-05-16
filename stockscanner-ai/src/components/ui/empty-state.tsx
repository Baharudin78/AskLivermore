import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?:        ReactNode
  title:        string
  description?: string
  action?:      ReactNode
  className?:   string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="mb-4 w-14 h-14 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#5A8080]">
          {icon}
        </div>
      )}
      <h3 className="text-white font-display font-600 text-base mb-1">{title}</h3>
      {description && (
        <p className="text-[#5A8080] text-sm max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
