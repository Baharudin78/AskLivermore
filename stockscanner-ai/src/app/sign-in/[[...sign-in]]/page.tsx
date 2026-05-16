import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050E0E] px-4"
         style={{
           backgroundImage:
             "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(13,61,42,0.6) 0%, transparent 70%)",
         }}
    >
      <SignIn
        appearance={{
          variables: {
            colorPrimary:    "#62D84E",
            colorBackground: "#081A1A",
            colorText:       "#FFFFFF",
            colorTextSecondary: "#A8C4C0",
            colorInputBackground: "#0A2A2A",
            colorInputText:  "#FFFFFF",
            borderRadius:    "12px",
          },
          elements: {
            card:        "bg-[#081A1A] border border-[rgba(255,255,255,0.08)] shadow-none",
            headerTitle: "text-white font-display",
            formButtonPrimary:
              "bg-[#62D84E] text-[#050E0E] font-600 hover:bg-[#8FFF70] rounded-full",
          },
        }}
      />
    </div>
  )
}
