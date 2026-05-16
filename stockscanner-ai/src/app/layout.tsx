import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stockscanner.ai";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "StockScanner AI — AI-Powered Stock Scanner & Market Intelligence",
    template: "%s | StockScanner AI",
  },
  description:
    "Scan 5000+ US stocks with 30+ pattern scanners. Bull Flag, VCP, Cup & Handle. AI entry strategies with entry, stop loss, and targets. Free to start.",
  keywords: [
    "stock scanner",
    "bull flag scanner",
    "VCP scanner",
    "swing trading tools",
    "AI stock analysis",
    "technical analysis",
    "entry strategy",
    "stock market",
  ],
  authors: [{ name: "StockScanner AI" }],
  creator: "StockScanner AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "StockScanner AI",
    title: "StockScanner AI — AI-Powered Stock Scanner & Market Intelligence",
    description:
      "Scan 5000+ US stocks with 30+ pattern scanners. Bull Flag, VCP, Cup & Handle. AI entry strategies with entry, stop loss, and targets.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StockScanner AI — AI-Powered Stock Scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StockScanner AI — AI-Powered Stock Scanner & Market Intelligence",
    description:
      "Scan 5000+ US stocks with 30+ pattern scanners. AI entry strategies with entry, stop loss, and targets.",
    images: ["/og-image.png"],
    creator: "@stockscannerai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#050E0E",
  width: "device-width",
  initialScale: 1,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "StockScanner AI",
      description:
        "AI-powered stock scanner and market intelligence platform",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${APP_URL}/scanner?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#app`,
      name: "StockScanner AI",
      url: APP_URL,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Scan 5000+ US stocks with 30+ pattern-based scanners. Get AI-powered entry strategies with precise entry, stop loss, and profit targets.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
        </head>
        <body className="min-h-full flex flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
