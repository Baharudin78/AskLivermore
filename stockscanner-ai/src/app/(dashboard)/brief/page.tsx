import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Today's Market Brief",
  description: "AI-powered daily market briefing with regime analysis and leading indicators.",
  robots: { index: false, follow: false },
}

export default function BriefPage() {
  return (
    <div>
      <h1 className="text-3xl font-display font-700 text-white mb-2">
        Today&apos;s Market Brief
      </h1>
      <p className="text-[#A8C4C0]">Coming in Phase 9.</p>
    </div>
  )
}
