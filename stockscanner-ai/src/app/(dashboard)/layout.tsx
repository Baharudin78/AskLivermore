"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  // Show nothing while Clerk loads or redirecting
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050E0E]">
        <div className="w-8 h-8 rounded-full border-2 border-[#62D84E] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050E0E]">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto dashboard-bg dot-pattern">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
