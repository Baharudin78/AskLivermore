# CLAUDE.md — StockScanner AI Platform
## Master Blueprint for Claude Code

> **Baca ini dulu sebelum mulai coding apapun.**
> Setiap phase harus selesai dan di-verify sebelum lanjut ke phase berikutnya.
> Fokus 1 phase = 1 sesi Claude Code untuk hemat token.

---

## 🎨 Design System & Brand Identity

### Referensi Visual
ServiceNow actual design language (dari website resmi):
- Background: **deep teal-to-near-black gradient** (bukan navy/indigo)
- Accent utama: **neon lime green** (#62D84E / #00E676 range) — ini yang paling khas
- Mid tone: **teal/dark teal** sebagai surface warna
- Gradient flow: neon green tint di atas → dark teal di tengah → near-black di bawah
- CTA button: solid neon green, rounded pill, dark text
- Secondary button: outline style (border only, no fill)
- Semua teks: pure white / off-white di atas dark bg

### Color Palette (ServiceNow-accurate)
```css
/* ═══════════════════════════════════════════
   BACKGROUNDS — Teal-to-Black Gradient Family
   ═══════════════════════════════════════════ */
--color-bg-darkest:  #050E0E;   /* Near black, page root bg */
--color-bg-dark:     #081A1A;   /* Dark teal-black, main sections */
--color-bg-teal:     #0A2A2A;   /* Deep teal, card bg */
--color-bg-teal-mid: #0D3535;   /* Mid teal, elevated card */
--color-bg-teal-lit: #0F4040;   /* Lighter teal, hover/active surface */

/* Hero/landing gradient (kiri atas → kanan bawah):
   from: #0D3D2A (teal-green) → via: #0A2A35 (teal) → to: #050E0E (near black) */
--gradient-hero: linear-gradient(135deg, #0D3D2A 0%, #0A2A35 50%, #050E0E 100%);

/* Section alt bg gradient */
--gradient-section: linear-gradient(180deg, #081A1A 0%, #050E0E 100%);

/* Card surface gradient */
--gradient-card: linear-gradient(145deg, #0D3535 0%, #081A1A 100%);

/* ═══════════════════════════════════════════
   ACCENT — Neon Lime Green (ServiceNow primary)
   ═══════════════════════════════════════════ */
--color-accent-300: #8FFF70;    /* Light neon green, hover */
--color-accent-400: #62D84E;    /* Primary neon green — CTA buttons */
--color-accent-500: #4CC23A;    /* Hover state */
--color-accent-600: #3AAD2A;    /* Active/pressed state */
--color-accent-glow: rgba(98, 216, 78, 0.20);  /* Glow/shadow */

/* ═══════════════════════════════════════════
   SECONDARY — Teal Cyan (ServiceNow secondary)
   ═══════════════════════════════════════════ */
--color-teal-300: #4DD9C0;      /* Light teal, links, highlights */
--color-teal-400: #2CC0A8;      /* Secondary accent */
--color-teal-500: #1A9E8A;      /* Darker teal */

/* ═══════════════════════════════════════════
   BORDERS & DIVIDERS
   ═══════════════════════════════════════════ */
--color-border-subtle:  rgba(255, 255, 255, 0.06);  /* Very subtle card border */
--color-border-default: rgba(255, 255, 255, 0.10);  /* Default border */
--color-border-strong:  rgba(98, 216, 78, 0.25);    /* Accent border (hover) */
--color-border-teal:    rgba(45, 192, 168, 0.20);   /* Teal border */

/* ═══════════════════════════════════════════
   SEMANTIC — Trading specific
   ═══════════════════════════════════════════ */
--color-bullish:         #62D84E;   /* Bullish/Up — same as accent (green = good) */
--color-bullish-subtle:  rgba(98, 216, 78, 0.12);
--color-bearish:         #FF4757;   /* Bearish/Down */
--color-bearish-subtle:  rgba(255, 71, 87, 0.12);
--color-neutral:         #FFB800;   /* Neutral/Caution */
--color-neutral-subtle:  rgba(255, 184, 0, 0.12);

/* ═══════════════════════════════════════════
   TEXT
   ═══════════════════════════════════════════ */
--color-text-primary:   #FFFFFF;    /* Pure white — headings */
--color-text-secondary: #A8C4C0;    /* Muted teal-white — body */
--color-text-muted:     #5A8080;    /* Dimmed — hints, placeholders */
--color-text-accent:    #62D84E;    /* Neon green text — links, CTAs */
```

### Global Background Implementation
```css
/* Root page background — wajib di globals.css */
body {
  background-color: #050E0E;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%,
      rgba(13, 61, 42, 0.6) 0%,    /* neon green tint dari atas */
      transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 20%,
      rgba(10, 42, 53, 0.5) 0%,    /* teal tint kanan atas */
      transparent 60%);
}

/* Hero section gradient */
.hero-section {
  background: linear-gradient(
    160deg,
    #0D3D2A 0%,      /* deep green-teal */
    #0A2E35 35%,     /* dark teal */
    #081A1A 65%,     /* very dark teal */
    #050E0E 100%     /* near black */
  );
}

/* Dashboard main content area */
.dashboard-bg {
  background-color: #081A1A;
  background-image: radial-gradient(
    ellipse 100% 60% at 50% 0%,
    rgba(13, 53, 53, 0.4) 0%,
    transparent 70%
  );
}
```

### Typography
```
Font Display  : "Sora" (headings — modern, geometric, premium feel)
Font Body     : "Inter" (body text, labels)
Font Mono     : "JetBrains Mono" (prices, tickers, numbers)

Kenapa Sora: lebih distinctive dari DM Sans, cocok dengan estetika
tech-corporate ServiceNow yang bold dan clean.

Scale:
  xs   : 11px / 16px line-height
  sm   : 13px / 20px
  base : 15px / 24px
  lg   : 17px / 28px
  xl   : 20px / 32px
  2xl  : 24px / 36px
  3xl  : 30px / 44px
  4xl  : 38px / 52px
  5xl  : 48px / 60px  (hero headlines)
```

### Design Tokens
```
Border radius:
  sm  : 8px    (badges, chips, tags)
  md  : 12px   (buttons, inputs)
  lg  : 16px   (cards)
  xl  : 24px   (modals, panels, drawers)
  full: 9999px (pill buttons — ServiceNow style)

Shadows:
  card    : 0 1px 3px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.06)
  elevated: 0 8px 24px rgba(0,0,0,0.6),
            0 0 0 1px rgba(98,216,78,0.12)
  glow-green: 0 0 32px rgba(98,216,78,0.20),
              0 0 64px rgba(98,216,78,0.08)
  glow-teal:  0 0 24px rgba(45,192,168,0.15)

Spacing scale: 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
```

### Component Patterns (Updated)
```
Buttons:
  Primary   : bg #62D84E, text #050E0E (dark), rounded-full (pill),
              font-weight 600, hover: bg #8FFF70 + glow-green shadow
  Secondary : border rgba(98,216,78,0.4), text #62D84E, transparent bg,
              hover: bg rgba(98,216,78,0.08)
  Ghost     : text #A8C4C0, no border, hover: text white

Cards:
  Default   : bg gradient-card, border border-subtle, rounded-lg
  Hover     : border-color border-strong, shadow elevated, transform translateY(-1px)
  Active    : border-color border-strong + glow-green

Nav Sidebar:
  Background: #050E0E (darkest)
  Active item: left border 3px solid #62D84E + bg rgba(98,216,78,0.08)
  Hover item : bg rgba(255,255,255,0.04)
  Text active: #62D84E
  Text default: #A8C4C0

Badges:
  Bullish  : bg bullish-subtle, text #62D84E, border bullish 20% opacity
  Bearish  : bg bearish-subtle, text #FF4757
  Neutral  : bg neutral-subtle, text #FFB800
  Tag      : bg rgba(255,255,255,0.06), text #A8C4C0

Tables:
  Header bg: rgba(13,53,53,0.6)
  Row hover : bg rgba(98,216,78,0.04)
  Border    : border-subtle between rows

Charts:
  Background: #081A1A
  Grid lines: rgba(255,255,255,0.05)
  Up candle : #62D84E (neon green — consistent dengan brand!)
  Down candle: #FF4757
  SMA50 line: #FFB800 (amber)
  SMA200 line: #4DD9C0 (teal)
  Volume up  : rgba(98,216,78,0.3)
  Volume down: rgba(255,71,87,0.3)
```

---

## 🏗️ Tech Stack

```
Framework    : Next.js 14 (App Router)
Styling      : Tailwind CSS v3 + CSS Variables
UI Library   : shadcn/ui (customized to design system)
Charts       : Lightweight Charts (TradingView) — MIT License
Auth         : Clerk
Database     : Supabase (PostgreSQL)
Market Data  : Polygon.io API
TA Engine    : technicalindicators (npm) — client safe
LLM          : Groq API (Llama 3.3 70B) — for AI narratives only
State        : Zustand
Forms        : React Hook Form + Zod
Icons        : Lucide React
Fonts        : next/font (Sora + Inter + JetBrains Mono)
Deployment   : Vercel
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (marketing)/          # Public landing pages
│   │   └── page.tsx          # Homepage
│   ├── (dashboard)/          # Authenticated app
│   │   ├── layout.tsx        # Dashboard shell
│   │   ├── brief/            # Daily Market Brief
│   │   ├── scanner/          # Stock Scanner
│   │   │   └── [name]/       # Individual scanner
│   │   ├── top100/           # Livermore Top 100
│   │   └── themes/           # Theme Tracker
│   ├── api/
│   │   ├── scanner/[name]/   # Scanner results
│   │   ├── stock/[ticker]/   # Stock data + indicators
│   │   ├── entry-strategy/   # AI entry strategy
│   │   ├── brief/            # Daily brief
│   │   └── themes/           # Theme data
│   ├── layout.tsx            # Root layout
│   └── globals.css           # CSS variables + base styles
├── components/
│   ├── ui/                   # shadcn base components
│   ├── charts/               # Chart components
│   ├── scanner/              # Scanner-specific components
│   ├── strategy/             # Entry strategy components
│   ├── layout/               # Shell, nav, sidebar
│   └── seo/                  # SEO components (structured data)
├── lib/
│   ├── indicators/           # TA calculation functions
│   ├── scanners/             # Pattern detection logic
│   ├── scoring/              # ALS/TA/FA scoring
│   ├── groq/                 # LLM client
│   ├── polygon/              # Market data client
│   └── supabase/             # DB client
├── hooks/                    # Custom React hooks
├── stores/                   # Zustand stores
└── types/                    # TypeScript types
```

---

## 🌐 SEO Requirements (WAJIB di setiap phase)

> **Ini non-negotiable. Setiap komponen, page, dan function harus SEO-aware.**

### Per-Page SEO Checklist
```typescript
// Setiap page WAJIB ada:
export const metadata: Metadata = {
  title: string,           // Unique per page, < 60 chars
  description: string,     // Unique, < 160 chars, include keywords
  keywords: string[],      // 5-10 relevant keywords
  openGraph: { ... },      // OG tags lengkap
  twitter: { ... },        // Twitter card
  canonical: string,       // Canonical URL
  robots: string,          // index,follow atau noindex
}
```

### Structured Data (JSON-LD)
```
Homepage      → WebSite + WebApplication schema
Scanner pages → SoftwareApplication + BreadcrumbList
Stock pages   → FinancialProduct schema (jika ada)
Blog/Learn    → Article + BreadcrumbList
```

### Performance SEO
```
- Semua images: next/image dengan alt text deskriptif
- Font: next/font dengan display: swap
- Core Web Vitals target: LCP < 2.5s, CLS < 0.1, FID < 100ms
- Dynamic pages: generateMetadata() function
- Sitemap: app/sitemap.ts (auto-generated)
- Robots.txt: app/robots.ts
```

### URL Structure (SEO-friendly)
```
/                           → Homepage
/scanner                    → Scanner index
/scanner/bull-flag          → Bull Flag scanner (slug, bukan camelCase)
/scanner/vcp                → VCP scanner
/top-100                    → Livermore Top 100
/themes                     → Theme Tracker
/market-brief               → Daily Market Brief
/learn                      → Learn index
/learn/bull-flag-pattern    → Individual guides
```

---

## ⚠️ Global Rules (Berlaku di SEMUA phase)

1. **TypeScript strict mode** — no `any`, proper typing everywhere
2. **Server Components by default** — `use client` hanya kalau perlu interaktivitas
3. **Error boundaries** — setiap async component wrapnya dengan Suspense + error boundary
4. **Loading states** — skeleton loader untuk semua data-fetching
5. **SEO metadata** — wajib ada di setiap page (lihat SEO Requirements)
6. **Responsive** — mobile-first, breakpoints: sm(640) md(768) lg(1024) xl(1280)
7. **Accessibility** — semantic HTML, ARIA labels, keyboard navigation
8. **No hardcoded colors** — selalu pakai CSS variables atau Tailwind tokens
9. **Comment setiap function** — JSDoc format untuk semua utility functions
10. **Environment variables** — semua API keys di `.env.local`, tidak ada yang hardcoded

---

---

# PHASE 1 — Project Foundation & Design System
## Estimasi: 1 sesi Claude Code

**Objective**: Setup project dari nol dengan semua config yang benar.

### 1.1 — Init Project

```bash
npx create-next-app@latest stockscanner-ai \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd stockscanner-ai
```

### 1.2 — Install Dependencies

```bash
# UI & Styling
npx shadcn@latest init
npx shadcn@latest add button card badge table tabs select input skeleton dialog sheet tooltip

# Charts
npm install lightweight-charts

# State & Forms
npm install zustand react-hook-form zod @hookform/resolvers

# Auth & DB
npm install @clerk/nextjs @supabase/supabase-js @supabase/ssr

# TA & Data
npm install technicalindicators

# LLM
npm install groq-sdk

# Utilities
npm install lucide-react clsx tailwind-merge date-fns numeral

# Fonts — Sora via Google Fonts (via next/font, tidak perlu install manual)
# JetBrains Mono via next/font/google juga
```

### 1.3 — Tasks untuk Claude Code

```
TASK 1.3.1 — globals.css
Buat src/app/globals.css dengan:
- CSS custom properties lengkap (semua color tokens dari Design System di atas)
  Khususnya: --color-bg-*, --color-accent-*, --color-teal-*, --gradient-*
- Body background: #050E0E + radial-gradient teal-green glow (lihat "Global Background Implementation" di atas)
- Typography base styles (Sora, Inter, JetBrains Mono via next/font)
- Base reset yang clean
- Utility classes:
  .font-ticker   → JetBrains Mono, tabular-nums
  .text-bullish  → color: #62D84E
  .text-bearish  → color: #FF4757
  .text-neutral  → color: #FFB800
  .bg-card       → gradient-card + border border-subtle + rounded-lg
  .glow-green    → box-shadow glow-green
- Scrollbar styling: width 6px, track #050E0E, thumb #0D3535, hover thumb #62D84E40
- Smooth scroll behavior
- ::selection: bg #62D84E, color #050E0E (neon green selection)

SEO note: Pastikan font loading tidak block render (display: swap)
```

```
TASK 1.3.2 — tailwind.config.ts
Extend Tailwind config dengan:
- Custom colors dari design system:
  bg: { darkest, dark, teal, 'teal-mid', 'teal-lit' }
  accent: { 300, 400, 500, 600 }
  teal: { 300, 400, 500 }
  bullish, bearish, neutral (dengan DEFAULT dan subtle variant)
- Custom font families:
  display: ['Sora', 'sans-serif']
  sans: ['Inter', 'sans-serif']
  mono: ['JetBrains Mono', 'monospace']
- Custom border radius tokens (sm:8, md:12, lg:16, xl:24, full:9999)
- Custom box shadow tokens (card, elevated, glow-green, glow-teal)
- Custom backgroundImage untuk gradient-hero, gradient-section, gradient-card
- safelist untuk dynamic classes (bullish/bearish/neutral colors)
```

```
TASK 1.3.3 — Root Layout (src/app/layout.tsx)
Buat root layout dengan:
- ClerkProvider wrapping
- next/font setup untuk Sora + Inter + JetBrains Mono (import dari Google Fonts)
- Global metadata object (site-wide SEO defaults):
  title template: "%s | StockScanner AI"
  default description: "AI-powered stock scanner..."
  openGraph site-wide config
  twitter site config
- JSON-LD structured data untuk WebSite + WebApplication schema
- Google Analytics placeholder (via next/third-parties)
- Viewport meta config

SEO note: metadataBase harus di-set ke production URL
```

```
TASK 1.3.4 — Environment Variables
Buat file:
- .env.local (template dengan semua keys yang dibutuhkan)
- .env.example (versi tanpa values, untuk commit ke git)

Keys yang perlu:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POLYGON_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```
TASK 1.3.5 — TypeScript Types (src/types/index.ts)
Define semua core types:

interface OHLCV {
  time: string  // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockIndicators {
  sma20: number; sma50: number; sma200: number
  ema21: number; ema65: number
  rsi14: number
  macd: number; macdSignal: number; macdHist: number
  atrDaily: number
  volRatio: number  // volume / 50d avg volume
  pctFrom52wHigh: number
  pctFrom52wLow: number
}

interface ScannerResult {
  ticker: string
  companyName: string
  price: number
  change: number
  changePct: number
  volume: number
  marketCap: number
  sector: string
  patternData: Record<string, unknown>
  taScore: number
  faScore: number
  arsRating: number
  alsScore: number
  setupQuality: number
}

interface EntryStrategy {
  setupQuality: number
  setupQualityReason: string
  tradeType: 'swing' | 'day'
  holdDuration: string
  entry: {
    trigger: string
    zoneLow: number
    zoneHigh: number
    confirmation: string
  }
  stopLoss: {
    price: number
    logic: string
    riskPct: number
  }
  targets: Array<{
    price: number
    pctGain: number
    sizePct: number
    logic: string
  }>
  riskReward: number
  positionSizeNote: string
  technicalConfluence: Array<{
    indicator: string
    value: string
    signal: 'bullish' | 'neutral' | 'bearish'
    note: string
  }>
  risks: string[]
  invalidation: string
  aiSummary: string
}

type MarketRegime = 'confirmed-uptrend' | 'uptrend-pressure' | 'rally-attempt' | 'downtrend'
type SignalType = 'bullish' | 'bearish' | 'neutral'
type TimeFrame = 'day' | 'swing' | 'long-term'
```

```
TASK 1.3.6 — Supabase Schema (SQL)
Buat file supabase/schema.sql dengan tables:

-- scanner_results: cache hasil scanner per ticker per hari
CREATE TABLE scanner_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker text NOT NULL,
  pattern text NOT NULL,
  company_name text,
  price numeric,
  change_pct numeric,
  volume bigint,
  market_cap bigint,
  sector text,
  pattern_data jsonb,
  ta_score numeric,
  fa_score numeric,
  ars_rating integer,
  als_score integer,
  scanned_at timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE
);

-- entry_strategies: cache AI-generated strategies
CREATE TABLE entry_strategies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker text NOT NULL,
  pattern text NOT NULL,
  trade_type text NOT NULL,
  strategy jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- daily_briefs: AI market brief harian
CREATE TABLE daily_briefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date UNIQUE DEFAULT CURRENT_DATE,
  regime text,
  confidence numeric,
  brief_content jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes untuk performance
CREATE INDEX idx_scanner_results_pattern_date ON scanner_results(pattern, date);
CREATE INDEX idx_scanner_results_ticker ON scanner_results(ticker);
CREATE INDEX idx_entry_strategies_ticker_pattern ON entry_strategies(ticker, pattern);
```

### 1.4 — Verify Checklist Phase 1
```
[ ] npm run dev berjalan tanpa error
[ ] TypeScript strict mode tidak ada error
[ ] Tailwind config extended dengan semua design tokens
[ ] CSS variables terdefinisi di globals.css
[ ] Root layout ada metadata + structured data
[ ] .env.example ter-commit (bukan .env.local)
[ ] Supabase schema ready
[ ] Semua types terdefinisi
```

---

---

# PHASE 2 — Layout Shell & Navigation
## Estimasi: 1 sesi Claude Code

**Objective**: Buat dashboard shell yang responsive dengan navigation.

```
TASK 2.1 — Sidebar Navigation (src/components/layout/Sidebar.tsx)
Buat sidebar dengan:
- Logo "StockScanner AI" di atas (dengan icon chart)
- Nav items:
  • Today's Brief (icon: newspaper)
  • Stock Scanner (icon: search)
    - Sub-items: semua scanner names (collapsible)
  • Top 100 (icon: trophy)
  • Theme Tracker (icon: layers)
  • Learn (icon: book-open)
- User profile section di bawah (Clerk UserButton)
- Collapsed state untuk mobile (icon-only mode)
- Active state: cyan left border + cyan text + subtle bg
- Hover state: slight bg highlight
- Responsive: drawer on mobile, fixed sidebar on desktop (lg+)

SEO note:
- Gunakan <nav> semantic element dengan aria-label="Main navigation"
- Active link harus aria-current="page"
```

```
TASK 2.2 — Top Header Bar (src/components/layout/Header.tsx)
Buat header dengan:
- Breadcrumb navigation (dynamic per route)
- Market status indicator (OPEN/CLOSED badge)
- Search bar (global stock search — placeholder dulu)
- Notification bell icon
- User account menu
- Mobile: hamburger untuk toggle sidebar

SEO note:
- Breadcrumb harus generate BreadcrumbList JSON-LD structured data
- Buat helper: generateBreadcrumbJsonLd(items) → returns JSON-LD object
```

```
TASK 2.3 — Dashboard Layout (src/app/(dashboard)/layout.tsx)
Buat authenticated layout:
- Clerk auth protection (redirect ke /sign-in kalau belum login)
- Sidebar + Header composition
- Main content area dengan proper overflow
- Background pattern: subtle dot/grid overlay (ServiceNow style)
- Smooth page transition

SEO note:
- Layout ini adalah parent untuk semua dashboard pages
- Canonical URL harus di-set per page (bukan di layout)
- Robots: noindex untuk semua /dashboard/* pages (behind auth)
```

```
TASK 2.4 — Marketing Layout (src/app/(marketing)/layout.tsx)
Buat public layout untuk landing page:
- Minimal navbar: Logo + nav links + Login/Signup CTA
- Sticky header dengan backdrop blur
- Footer dengan links, disclaimer, social links
- Layout ini harus index-able oleh search engine

SEO note:
- Footer harus ada: sitemap link, disclaimer text, copyright
- NavBar gunakan <header> semantic dengan proper landmarks
```

```
TASK 2.5 — Common UI Components (src/components/ui/)
Buat/customize komponen berikut (extend dari shadcn):

a) StockBadge — badge untuk bullish/bearish/neutral
   Props: signal: SignalType, label: string
   
b) ChangeDisplay — tampilkan % change dengan warna
   Props: value: number, showArrow?: boolean
   
c) PriceDisplay — format harga dengan mono font
   Props: price: number, decimals?: number
   
d) SectorBadge — badge untuk GICS sector
   Props: sector: string
   
e) SkeletonCard — skeleton untuk scanner results
   Matches dimensi actual ScannerCard
   
f) EmptyState — empty state component
   Props: icon, title, description, action?

SEO note:
- Semua komponen dengan teks harus support proper lang attribute
- Icon-only elements harus ada aria-label
```

### 2.4 — Verify Checklist Phase 2
```
[ ] Sidebar responsive (mobile drawer + desktop fixed)
[ ] Active nav state benar per route
[ ] Header breadcrumb dynamic
[ ] Auth protection di dashboard layout
[ ] Marketing layout public (indexable)
[ ] Semua UI komponen baru berfungsi
[ ] Tidak ada hardcoded colors (semua pakai tokens)
[ ] Mobile tampilan baik di 375px
```

---

---

# PHASE 3 — Market Data & TA Engine
## Estimasi: 1 sesi Claude Code

**Objective**: Buat data layer — Polygon.io client + TA calculator.

```
TASK 3.1 — Polygon.io Client (src/lib/polygon/client.ts)
Buat wrapper untuk Polygon.io API:

Functions:
- getGroupedDaily(date: string): Promise<PolygonDailyResult[]>
  → Fetch semua saham: OHLCV untuk 1 hari
  
- getStockBars(ticker: string, days: number): Promise<OHLCV[]>
  → Fetch historical bars untuk 1 ticker
  
- getTickerDetails(ticker: string): Promise<TickerDetails>
  → Company name, sector, market cap, shares outstanding
  
- getStockFinancials(ticker: string): Promise<Fundamentals>
  → EPS, revenue, margins, ratios

Error handling:
- Retry logic (3x dengan exponential backoff)
- Rate limit handling (Polygon free: 5 req/menit)
- Cache responses di Supabase untuk reduce API calls

Types yang diperlukan:
interface PolygonDailyResult { T, o, h, l, c, v, vw }
interface TickerDetails { name, sic_description, market_cap, ... }
interface Fundamentals { eps, revenue, roe, pe_ratio, peg_ratio, ... }
```

```
TASK 3.2 — TA Indicator Calculator (src/lib/indicators/calculator.ts)
Buat fungsi kalkulasi indikator menggunakan `technicalindicators` npm:

/**
 * Calculate all technical indicators for a given OHLCV series
 * @param ohlcv - Array of OHLCV data, oldest first
 * @returns StockIndicators object with all calculated values
 */
export function calculateIndicators(ohlcv: OHLCV[]): StockIndicators

Indikator yang dihitung:
- SMA: 10, 20, 50, 150, 200 hari
- EMA: 21, 65 hari
- RSI: 14 periode
- MACD: (12, 26, 9) — line, signal, histogram
- Bollinger Bands: (20, 2)
- ATR: 14 periode
- Stochastic: (14, 3, 3)
- Volume ratio: volume hari ini / SMA50 volume

Derived metrics (pure math, no library):
- pctFrom52wHigh: (close - rolling_max_252) / rolling_max_252
- pctFrom52wLow: (close - rolling_min_252) / rolling_min_252
- priceVsSMA50: (close - sma50) / sma50
- priceVsSMA200: (close - sma200) / sma200
- sma50VsSMA200: (sma50 - sma200) / sma200

Return semua nilai sebagai flat StockIndicators object.
Jika data tidak cukup untuk calculate, return null untuk field tersebut.
```

```
TASK 3.3 — Relative Strength Calculator (src/lib/scoring/rs-rating.ts)
/**
 * Calculate IBD-style Relative Strength rating for entire universe
 * Weights: 40% last 3mo, 20% each for 1mo, 6mo, 12mo performance
 * @param universe - Map of ticker → OHLCV array
 * @returns Map of ticker → RS percentile (0-99)
 */
export function calculateRelativeStrength(
  universe: Map<string, OHLCV[]>
): Map<string, number>

Logic:
1. Hitung raw RS score per ticker:
   rs = (perf_3m * 0.4) + (perf_1m * 0.2) + (perf_6m * 0.2) + (perf_12m * 0.2)
2. Sort semua tickers by raw score
3. Convert ke percentile 0-99
4. Return sebagai Map
```

```
TASK 3.4 — ALS Scoring System (src/lib/scoring/als-score.ts)
Buat 3 fungsi scoring:

/**
 * Technical Analysis Score (0-10)
 * Based on trend, momentum, relative position, volume
 */
export function calculateTAScore(
  indicators: StockIndicators,
  ohlcv: OHLCV[]
): number

Kriteria TA Score:
  Trend (4 pts):
    +1 close > SMA50
    +1 close > SMA200
    +1 SMA50 > SMA200
    +1 SMA200 trending up (vs 20 hari lalu)
  Momentum (3 pts):
    +1.5 jika RSI 50-70 (sweet spot)
    +0.75 jika RSI 70-80 (overbought tapi bullish)
    +1 jika MACD > Signal
    +0.5 jika MACD > 0
  Position (2 pts):
    +2 jika dalam 10% dari 52wk high
    +1 jika dalam 25% dari 52wk high
  Volume (1 pt):
    +1 jika volume ratio > 1.2

/**
 * Fundamental Analysis Score (0-10)
 */
export function calculateFAScore(fundamentals: Fundamentals): number

Kriteria FA Score:
  Profitability (3 pts): ROE, net margin, operating margin
  Growth (3 pts): EPS growth YoY, revenue growth YoY
  Health (2 pts): debt/equity, current ratio
  Valuation (2 pts): PEG ratio range

/**
 * Composite ALS Score (0-99)
 * Weights: TA 35%, FA 25%, RS 30%, Momentum 10%
 */
export function calculateALSScore(
  taScore: number,
  faScore: number,
  arsRating: number,
  indicators: StockIndicators
): number
```

```
TASK 3.5 — Data Cache Layer (src/lib/supabase/cache.ts)
Buat caching functions untuk reduce Polygon.io API calls:

- getCachedOHLCV(ticker, days) → check Supabase dulu sebelum hit Polygon
- setCachedOHLCV(ticker, data) → simpan ke Supabase
- getCachedScannerResults(pattern, date) → return cached results
- setCachedScannerResults(pattern, date, results) → cache scanner output
- isCacheValid(timestamp, ttlMinutes) → check apakah cache masih valid

TTL strategy:
  Scanner results: 4 jam (refresh multiple times during market hours)
  OHLCV daily: 24 jam (daily bars tidak berubah)
  Fundamentals: 7 hari (update quarterly)
```

### 3.4 — Verify Checklist Phase 3
```
[ ] Polygon client bisa fetch grouped daily data
[ ] Historical bars fetch berfungsi
[ ] calculateIndicators() return values yang benar (test dengan data dummy)
[ ] RS rating menghasilkan distribusi 0-99 yang benar
[ ] ALS score composite berjalan (test beberapa skenario)
[ ] Cache layer read/write ke Supabase berfungsi
[ ] Semua functions ada JSDoc comment
[ ] TypeScript tidak ada errors
```

---

---

# PHASE 4 — Scanner Engine
## Estimasi: 1 sesi Claude Code

**Objective**: Implement pattern detection untuk semua scanner.

```
TASK 4.1 — Base Scanner Interface (src/lib/scanners/base.ts)
Definisikan interface dan base class:

interface ScannerConfig {
  name: string
  slug: string           // URL slug, e.g. "bull-flag"
  description: string
  tradeType: TimeFrame[]
  signal: SignalType
  category: string[]     // ['breakout', 'pattern', dll]
}

interface PatternResult {
  ticker: string
  patternData: Record<string, unknown>  // pattern-specific data
  setupQuality: number                   // 1-10
  breakoutLevel?: number
  stopLevel?: number
  notes: string[]
}

abstract class BaseScanner {
  abstract config: ScannerConfig
  abstract detect(ohlcv: OHLCV[], indicators: StockIndicators): PatternResult | null
}
```

```
TASK 4.2 — Bull Flag Scanner (src/lib/scanners/bull-flag.ts)
Implement BullFlagScanner extends BaseScanner

Logic (sudah dijelaskan di dokumen utama):
1. Find pole: rally 20%+ dalam max 15 hari
2. Find flag: konsolidasi 4-20 hari, pullback max 50% dari pole
3. Channel: kedua slope negatif (downward channel)
4. Volume: declining selama flag, spike saat pole
5. Trend filter: di atas SMA50 dan SMA200

PatternData yang dikembalikan:
{
  poleGain: number          // % gain pole
  poleBars: number          // durasi pole
  pullbackPct: number       // % pullback dari pole high
  flagBars: number          // durasi flag
  breakoutLevel: number     // resistance = pole high
  flagLow: number           // stop area
  channelUpperSlope: number // untuk chart overlay
  channelLowerSlope: number
  poleStartIdx: number      // index untuk charting
  poleEndIdx: number
  flagStartIdx: number
  flagEndIdx: number
}
```

```
TASK 4.3 — VCP Scanner (src/lib/scanners/vcp.ts)
Implement VCPScanner (Volatility Contraction Pattern — Minervini)

Logic:
1. Stage 2 check: close > SMA150 > SMA200, SMA200 trending up
2. Within 25% of 52-week high
3. Find swing pivots (highs dan lows dalam window 10 hari)
4. Measure pullback depths: harus contracting (makin kecil)
5. Minimum 2 contractions, idealnya 3+
6. Volume contraction seiring price contraction
7. Current price near latest pivot high (setup breakout)

PatternData:
{
  stage2: boolean
  numContractions: number
  pullbackDepths: number[]    // e.g. [0.25, 0.15, 0.08]
  isContracting: boolean
  latestPivotHigh: number     // breakout level
  contractionPivots: Array<{highPrice, lowPrice, pullbackPct, startIdx, endIdx}>
}
```

```
TASK 4.4 — Trend Template Scanner (src/lib/scanners/trend-template.ts)
Implement TrendTemplateScanner (Minervini 8 criteria)

Semua 8 kriteria HARUS pass:
1. close > SMA200
2. SMA200 trending up (vs 1 bulan lalu)
3. close > SMA150
4. close > SMA50
5. SMA50 > SMA150
6. SMA150 > SMA200
7. close >= 130% dari 52wk low
8. close >= 75% dari 52wk high

PatternData:
{
  criteriaResults: boolean[]   // [true/false per kriteria]
  criteriaCount: number        // berapa yang pass
  allPass: boolean
  sma50VsSMA150: number        // % difference
  sma150VsSMA200: number
  pctFrom52wLow: number
  pctFrom52wHigh: number
}
```

```
TASK 4.5 — MACD Bullish Cross Scanner (src/lib/scanners/macd-cross.ts)
Implement MACDCrossScanner

Logic:
1. MACD line cross above signal line dalam 3 hari terakhir
2. Saham di atas SMA50 dan SMA200 (uptrend filter)
3. Cross terjadi di atas zero line = lebih bullish (bonus score)
4. Volume normal atau di atas rata-rata

PatternData:
{
  crossDaysAgo: number       // 0=today, 1=yesterday, dll
  aboveZeroLine: boolean     // MACD > 0 saat cross
  macdValue: number
  signalValue: number
  histogram: number
}
```

```
TASK 4.6 — Golden Cross Scanner (src/lib/scanners/golden-cross.ts)
Implement GoldenCrossScanner

Logic:
1. SMA50 cross above SMA200 dalam 10 hari terakhir
2. Kedua MAs harus trending up
3. Price di atas kedua MAs (confirmation)
4. Volume expansion saat cross terjadi

PatternData:
{
  crossDaysAgo: number
  sma50Value: number
  sma200Value: number
  sma50Slope: number         // positif = trending up
  sma200Slope: number
  priceAboveBothMAs: boolean
}
```

```
TASK 4.7 — Scanner Registry (src/lib/scanners/registry.ts)
Buat registry semua scanner yang tersedia:

export const SCANNER_REGISTRY: Record<string, BaseScanner> = {
  'bull-flag': new BullFlagScanner(),
  'vcp': new VCPScanner(),
  'trend-template': new TrendTemplateScanner(),
  'macd-cross': new MACDCrossScanner(),
  'golden-cross': new GoldenCrossScanner(),
  // ... tambah scanner lain
}

export const SCANNER_METADATA = [
  {
    slug: 'bull-flag',
    name: 'Bull Flag',
    description: 'Continuation pattern after strong move...',
    signal: 'bullish',
    timeframe: ['swing'],
    category: ['breakout', 'pattern'],
    traderRef: null,
    likes: 247,
    seoDescription: '...', // untuk meta description halaman scanner
    seoKeywords: [...],
  },
  // ... semua scanner
]
```

```
TASK 4.8 — Scanner API Route (src/app/api/scanner/[name]/route.ts)
Buat API endpoint:

GET /api/scanner/[name]?exchange=all&minPrice=0&maxPrice=999999&minVol=0&sector=all

Logic:
1. Validasi scanner name ada di registry
2. Check cache Supabase (TTL 4 jam)
3. Jika cache miss: fetch universe dari Polygon, run scanner, simpan cache
4. Apply filters dari query params
5. Sort by setupQuality DESC, marketCap DESC
6. Return: { results: ScannerResult[], total, scanner: ScannerMetadata, cachedAt }

SEO note:
- Set proper Cache-Control headers
- Response harus include scanner metadata untuk page rendering
```

### 4.4 — Verify Checklist Phase 4
```
[ ] Bull Flag scanner detect pattern dengan benar (test manual)
[ ] VCP scanner mendeteksi contracting pivots
[ ] Trend Template: semua 8 kriteria berjalan
[ ] MACD Cross: crossover terdeteksi dengan benar
[ ] Golden Cross: SMA cross terdeteksi
[ ] Registry teregister semua scanner
[ ] API route return data yang benar
[ ] Cache hit/miss logic berfungsi
[ ] Filters (price, volume, sector) berfungsi
```

---

---

# PHASE 5 — Scanner UI Pages
## Estimasi: 1 sesi Claude Code

**Objective**: Buat halaman scanner yang full-featured dengan filtering.

```
TASK 5.1 — Scanner Index Page (src/app/(dashboard)/scanner/page.tsx)
Halaman daftar semua scanner:

Layout:
- Header: "Stock Scanner" + subtitle
- Filter bar: TimeFrame tabs, Strategy multi-select, Signal filter
- Grid cards: ScannerCard per scanner (2 kolom desktop, 1 mobile)

ScannerCard shows:
- Scanner name + signal badge (bullish/bearish)
- Tags: timeframe, category
- Description (1 line)
- Like count
- "Run Scanner" button → navigate ke /scanner/[slug]
- Trader reference jika ada (e.g. "Mark Minervini")

SEO:
  title: "Stock Scanner — 30+ Pattern-Based Scanners | StockScanner AI"
  description: "Scan US stocks with Bull Flag, VCP, Cup & Handle, CANSLIM..."
  keywords: ['stock scanner', 'bull flag scanner', 'VCP scanner', ...]
  Structured data: SoftwareApplication schema
```

```
TASK 5.2 — Individual Scanner Page (src/app/(dashboard)/scanner/[name]/page.tsx)
Dynamic page per scanner:

generateMetadata({ params }):
  title: `${scannerName} Scanner — ${description} | StockScanner AI`
  description: scanner.seoDescription (unique per scanner)
  keywords: scanner.seoKeywords
  canonical: /scanner/[name]

generateStaticParams():
  Return semua scanner slugs untuk static generation

Layout:
- Breadcrumb: Home > Scanner > Bull Flag
- Scanner header: name + description + signal + tags + likes
- Filter bar: Exchange, Price range, Volume, Market Cap, Sector
- View toggle: Table view / Chart view
- Sort selector: Market Cap, Setup Quality, RS Rating, % Change
- Results count + "Updated X min ago"
- Results grid/table (ScannerResultCard atau ScannerResultRow)
- Load more / pagination

Suspense + loading skeleton saat fetch
```

```
TASK 5.3 — Scanner Result Card (src/components/scanner/ScannerResultCard.tsx)
Card untuk setiap saham hasil scanner (chart view):

Shows:
- Ticker symbol (mono font, large, prominent)
- Company name + sector badge
- Price + % change (color coded)
- Setup quality score (1-10 dengan progress bar)
- Key stats: Volume, Market Cap
- Mini inline chart (TradingView Lightweight Charts)
  → Candlestick 60 hari + SMA50 + pattern overlay
- Tags: scanner tags
- "View Strategy" button → open EntryStrategyModal

onClick ticker → open EntryStrategyModal
Hover: subtle glow border (cyan)

SEO note: aria-label pada card = "{ticker} {patternName} setup"
```

```
TASK 5.4 — Scanner Result Row (src/components/scanner/ScannerResultRow.tsx)
Row untuk table view:

Columns:
- # (rank)
- Ticker + Company name
- Price
- % Chg (colored)
- Volume
- Market Cap
- TA Score
- FA Score
- ARS Rating
- Setup Quality
- Actions: [Chart icon] [Strategy icon]

Sortable columns
Sticky header
Row click → open EntryStrategyModal
```

```
TASK 5.5 — Inline Mini Chart (src/components/charts/MiniChart.tsx)
Reusable mini candlestick chart untuk scanner cards:

Props:
  ticker: string
  ohlcv: OHLCV[]
  pattern: string
  patternData: Record<string, unknown>
  height?: number (default: 160)

Features:
- Candlestick series (green/red)
- SMA50 line (amber)
- Pattern overlay berdasarkan pattern type:
  'bull-flag' → channel lines (dashed cyan)
  'golden-cross' → mark cross point dengan marker
  'macd-cross' → marker pada cross point
  'vcp' → pivot markers dengan percentage labels
- Volume histogram (bawah, subtle)
- Tidak ada axis labels (mini chart, clean)
- Dark theme matching design system
- Loading skeleton saat data belum ready
```

### 5.4 — Verify Checklist Phase 5
```
[ ] Scanner index page tampil semua scanner dengan filter
[ ] Individual scanner page load dan tampil results
[ ] generateMetadata() unique per scanner page
[ ] generateStaticParams() return semua slugs
[ ] ScannerResultCard: chart render dengan pattern overlay
[ ] ScannerResultRow: table sortable
[ ] Mobile: card view responsive
[ ] Loading skeleton muncul saat fetch
[ ] Empty state muncul kalau tidak ada results
[ ] SEO metadata unique per scanner
```

---

---

# PHASE 6 — Entry Strategy Feature
## Estimasi: 1 sesi Claude Code

**Objective**: Buat fitur AI entry strategy yang muncul saat user klik ticker.

```
TASK 6.1 — Entry Strategy Calculator (src/lib/strategy/calculator.ts)
Pure math entry strategy — TANPA LLM:

/**
 * Calculate entry strategy levels based on pattern data and indicators
 * This is pure math — no LLM needed for price levels
 */
export function calculateEntryLevels(
  pattern: string,
  patternData: Record<string, unknown>,
  indicators: StockIndicators,
  ohlcv: OHLCV[]
): {
  entryZoneLow: number
  entryZoneHigh: number
  stopLoss: number
  targets: Array<{ price: number; pctGain: number; sizePct: number }>
  riskReward: number
  riskPct: number
}

Bull Flag logic:
  entry = breakoutLevel (flag resistance) to breakoutLevel * 1.005
  stopLoss = flagLow - (ATR * 0.5)
  target1 = entry + (poleHeight * 0.5)   → 50% position
  target2 = entry + (poleHeight * 1.0)   → 30% position
  target3 = entry + (poleHeight * 1.5)   → 20% position
  riskReward = (target1 - entry) / (entry - stopLoss)

VCP logic:
  entry = latestPivotHigh * 1.01 (1% above pivot)
  stopLoss = latestPivotLow - (ATR * 0.5)
  targets: measured move based on prior base depth

MACD Cross logic:
  entry = current close + (ATR * 0.1)  (slight buffer)
  stopLoss = recent swing low atau close - (ATR * 1.5)
  targets: 2x dan 3x dari risk
```

```
TASK 6.2 — Technical Confluence Analyzer (src/lib/strategy/confluence.ts)
Rule-based confluence analysis (tidak perlu LLM):

/**
 * Analyze technical indicators and return confluence signals
 * All logic is rule-based, no AI needed
 */
export function analyzeTechnicalConfluence(
  indicators: StockIndicators,
  patternData: Record<string, unknown>
): Array<{
  indicator: string
  value: string
  signal: 'bullish' | 'neutral' | 'bearish'
  note: string
}>

Rules:
  RSI: < 30 = oversold neutral, 30-50 = building momentum, 50-70 = bullish sweet spot, > 70 = overbought caution
  MACD: line > signal = bullish, line > 0 = above zero bullish
  Volume: ratio > 1.5 = above avg bullish, < 0.7 = low volume caution
  SMA: above 50 = bullish, above 200 = strongly bullish
  Position: within 10% of 52wk high = near highs bullish
```

```
TASK 6.3 — Groq AI Summary (src/lib/groq/entry-summary.ts)
LLM hanya untuk AI summary 2-3 kalimat:

/**
 * Generate plain-English trade thesis using Groq LLM
 * Called ONLY for the AI summary — everything else is math
 * @returns 2-3 sentence trade summary
 */
export async function generateTradeSummary(
  ticker: string,
  pattern: string,
  tradeType: 'swing' | 'day',
  keyData: {
    setupQuality: number
    entryLevel: number
    stopLoss: number
    target1: number
    riskReward: number
    rsiValue: number
    volumeRatio: number
    daysToEarnings: number | null
    marketRegime: string
  }
): Promise<string>

Prompt: minimal, focused. Instruksikan output HANYA 2-3 kalimat.
Model: llama3-8b-8192 (cepat dan murah untuk summary pendek)
Cache hasil di Supabase (expire 4 jam)
Fallback: jika Groq error, return template string berbasis data
```

```
TASK 6.4 — Entry Strategy API (src/app/api/entry-strategy/route.ts)
POST /api/entry-strategy
Body: { ticker, pattern, tradeType, patternData }

Flow:
1. Check cache Supabase (key: ticker+pattern+tradeType+date)
2. Cache hit → return immediately
3. Cache miss:
   a. Fetch OHLCV + indicators
   b. calculateEntryLevels() → pure math
   c. analyzeTechnicalConfluence() → rule based
   d. generateTradeSummary() → Groq (hanya ini yang hit LLM)
   e. Compose full EntryStrategy object
   f. Cache di Supabase (TTL 4 jam)
   g. Return response

Error handling:
  Jika Groq gagal → pakai fallback summary, tetap return strategy
  Jika OHLCV tidak cukup → return error 400 dengan message jelas
```

```
TASK 6.5 — Entry Strategy Modal (src/components/strategy/EntryStrategyModal.tsx)
Modal/drawer yang muncul saat user klik ticker:

Props:
  ticker: string
  pattern: string
  tradeType: 'swing' | 'day'
  patternData: Record<string, unknown>
  onClose: () => void

Layout (2 kolom desktop, 1 kolom mobile):
LEFT COLUMN:
  - Header: Ticker besar + Company + Pattern badge
  - Trade type tabs: [Swing] [Day] (switch tanpa re-open modal)
  - Setup Quality meter (large, prominent)
  - AI Summary box (highlighted)
  - Entry card: trigger + zone + confirmation
  - Stop Loss card: price + logic + risk %
  - R:R ratio card (large number, green kalau > 2)
  - Targets section: T1/T2/T3 dengan progress bar ke target
  - Technical Confluence table
  - Risks & Invalidation section

RIGHT COLUMN:
  - Full chart dengan overlay:
    - Candlestick
    - Pattern-specific overlay (channel lines, pivot markers)
    - Entry zone: green shaded area / dashed line
    - Stop loss: red dashed line dengan label
    - T1/T2/T3: green lines dengan labels
    - Volume histogram

Loading state: skeleton untuk semua sections
Mobile: full-screen drawer (sheet dari shadcn)
```

```
TASK 6.6 — Strategy Chart (src/components/charts/StrategyChart.tsx)
Full chart dengan entry/SL/target overlays:

Props:
  ticker: string
  ohlcv: OHLCV[]
  pattern: string
  patternData: Record<string, unknown>
  entryZone: [number, number]
  stopLoss: number
  targets: number[]

Fitur chart:
- Candlestick series (90 hari data)
- SMA50 (amber line)
- SMA200 (purple line)
- Volume histogram (bawah, 20% height)
- Pattern overlay (sesuai pattern — reuse dari MiniChart tapi lebih detail)
- Entry zone: semi-transparent green band antara zone_low dan zone_high
- Stop loss: red dashed horizontal line + label "SL $xxx"
- Target lines:
  T1: light green solid + label "T1 $xxx (+x%)"
  T2: medium green solid + label "T2 $xxx (+x%)"
  T3: bright green solid + label "T3 $xxx (+x%)"
- Legend: compact di pojok kiri atas
- Crosshair: aktif dengan tooltip OHLCV
```

### 6.4 — Verify Checklist Phase 6
```
[ ] calculateEntryLevels() return logis (entry < target, entry > SL)
[ ] analyzeTechnicalConfluence() return array yang benar
[ ] Groq integration berfungsi (test dengan API key)
[ ] Fallback berjalan saat Groq error
[ ] Cache hit/miss berfungsi
[ ] Modal open saat klik ticker
[ ] Trade type tabs switch strategy tanpa re-fetch
[ ] Chart render dengan semua overlay lines
[ ] Mobile drawer berfungsi
[ ] Loading skeleton muncul
```

---

---

# PHASE 7 — Top 100 & Scoring Dashboard
## Estimasi: 1 sesi Claude Code

**Objective**: Livermore Top 100 page dengan ranking dan performance tracking.

```
TASK 7.1 — Top 100 API (src/app/api/top100/route.ts)
GET /api/top100?sector=all&minMarketCap=0&exchange=all

Logic:
1. Ambil universe saham (S&P 500 + NASDAQ 100 + top 500 by market cap)
2. Untuk setiap saham: calculate TA + FA + RS + ALS score
3. Sort by ALS score DESC
4. Return top 100
5. Cache 4 jam di Supabase

Response tambahan:
  portfolioPerformance: {
    sinceInception: number  // % return since Jan 2025
    ytd: number
    today: number
    vsSP500SinceInception: number
    vsSP500Ytd: number
    vsSP500Today: number
  }
```

```
TASK 7.2 — Top 100 Page (src/app/(dashboard)/top100/page.tsx)
SEO:
  title: "Livermore Top 100™ — AI-Ranked Stock Portfolio | StockScanner AI"
  description: "Daily-updated equal-weighted portfolio of 100 highest-rated stocks..."
  Robots: noindex (behind auth, tapi kalau ada preview page → index)

Layout:
- Performance header:
  3 metric cards: Since Inception / YTD / Today
  Masing-masing: portfolio return vs S&P 500 comparison
- Filter bar: Sector, Market Cap, Volume, Exchange
- Results count + last updated timestamp
- Sortable table dengan columns:
  Rank | Ticker | Company | Sector | Market Cap | TA | FA | ARS | ALS | Price | % Chg | Volume

Table features:
- Sticky header
- Row click → open EntryStrategyModal
- ALS score: color-coded (green 80+, amber 60-80, gray <60)
- TA/FA: displayed as x.x/10
- ARS: displayed as percentile badge
- Top 10 rows: subtle gold/highlight treatment
```

```
TASK 7.3 — Stock Ratings Display (src/components/scanner/StockRatings.tsx)
Reusable component untuk tampilkan TA/FA/ARS/ALS ratings:

Props:
  taScore: number
  faScore: number
  arsRating: number
  alsScore: number
  size?: 'sm' | 'md' | 'lg'

sm: compact numbers inline
md: small bars dengan numbers
lg: full display dengan labels dan breakdown

Gunakan di: Top 100 table, Scanner cards, Strategy modal
```

### 7.4 — Verify Checklist Phase 7
```
[ ] Top 100 API return 100 saham dengan scores
[ ] Performance metrics kalkulasi benar
[ ] Page load tanpa error
[ ] Table sortable per column
[ ] Filter sector/marketcap berfungsi
[ ] Row klik buka EntryStrategyModal
[ ] Mobile: table scroll horizontal
[ ] StockRatings component tampil di semua size variants
```

---

---

# PHASE 8 — Theme Tracker
## Estimasi: 1 sesi Claude Code

**Objective**: Theme tracking dengan performance per timeframe.

```
TASK 8.1 — Theme Data Structure (src/types/themes.ts)
interface InvestmentTheme {
  id: string
  slug: string
  name: string
  description: string
  category: 'AI' | 'Energy' | 'Healthcare' | 'Tech' | 'Industrial' | 'Finance' | string
  crowding: 'crowded' | 'moderate' | 'uncrowded' | 'very-uncrowded'
  themeType: 'evolution' | 'disruption' | 'emerging' | 'bottleneck'
  tickers: string[]          // constituent stocks
  etfProxies: string[]       // related ETFs
  performance: {
    '1d': number; '1w': number; '1m': number
    '3m': number; '6m': number; '1y': number
  }
  status: 'accelerating' | 'setting-up' | 'steady' | 'cooling'
  aiSummary: string          // 1-2 line AI summary
}
```

```
TASK 8.2 — Theme Data (src/lib/themes/data.ts)
Hardcode initial theme definitions (20 themes untuk MVP):

Themes list:
  AI & ML Infrastructure, Cybersecurity, Semiconductor Equipment,
  Nuclear Energy, Clean Energy, EV & Autonomous, Space Technology,
  Cloud Computing, Digital Payments, Biotech Genomics,
  Defense & Aerospace, Water Technology, Copper & Critical Minerals,
  Photonics & Optical, HBM Memory, Data Centers, Robotics & Automation,
  GLP-1 Weight Loss, Quantum Computing, Battery Technology

Per theme: definisikan tickers (5-15 saham) dan ETF proxies
```

```
TASK 8.3 — Theme Performance Calculator (src/lib/themes/performance.ts)
Calculate performance metrics untuk setiap theme:

/**
 * Calculate average performance of theme constituents
 * Weighted equally across all tickers in theme
 */
export async function calculateThemePerformance(
  theme: InvestmentTheme,
  timeframes: string[]
): Promise<Record<string, number>>

Logic per timeframe:
  Fetch price data untuk semua tickers
  Hitung % return per ticker per timeframe
  Average return = mean dari semua tickers
  Status = derive dari 1w dan 1m performance:
    +3% 1w → accelerating
    +1-3% 1w → setting-up
    -1 to +1% 1w → steady
    <-1% 1w → cooling
```

```
TASK 8.4 — Theme Tracker Page (src/app/(dashboard)/themes/page.tsx)
SEO:
  title: "Investment Theme Tracker — AI & Sector Performance | StockScanner AI"
  description: "Track 20+ investment themes from AI Infrastructure to Nuclear Energy..."

Layout:
- Header + filter bar: Category, Crowding, Theme Type
- Timeframe selector: 1D / 1W / 1M / 3M / 6M / 1Y
- Sort: Performance DESC / ASC / Alphabetical
- Theme cards grid (3 cols desktop, 2 tablet, 1 mobile):

ThemeCard shows:
  - Theme name + type badge (Emerging/Bottleneck/etc)
  - Crowding indicator (Very Uncrowded → Crowded pill)
  - Status badge (Accelerating / Cooling / etc) dengan color
  - Performance number (selected timeframe, large + colored)
  - Mini sparkline chart (7-day price of equal-weight basket)
  - Top 3 constituent tickers (small chips)
  - "View Stocks" button → expand atau navigate ke detail
```

```
TASK 8.5 — Theme Detail Drawer (src/components/themes/ThemeDetailDrawer.tsx)
Drawer yang muncul saat klik theme card:

Shows:
- Theme name + description
- Performance across all timeframes (bar chart atau table)
- Status + crowding info
- All constituent tickers dengan % performance
- AI summary (1-2 kalimat tentang mengapa theme ini bergerak)
- Link ke scanner yang relevan
```

### 8.4 — Verify Checklist Phase 8
```
[ ] 20 themes defined dengan tickers yang benar
[ ] Performance calculation berjalan
[ ] Status derivation logic benar
[ ] Theme cards tampil dengan performance
[ ] Timeframe selector switch performance number
[ ] Filter category/crowding/type berfungsi
[ ] ThemeDetailDrawer open dan tampil data
[ ] Mobile: 1 kolom, card readable
```

---

---

# PHASE 9 — Daily Market Brief
## Estimasi: 1 sesi Claude Code

**Objective**: AI-powered daily market briefing dashboard.

```
TASK 9.1 — Market Data Aggregator (src/lib/brief/market-data.ts)
Aggregate semua data yang diperlukan untuk brief:

export async function getMarketBriefData(): Promise<{
  breadth: {
    pctAbove50dma: number       // % saham di atas SMA50
    pctAbove200dma: number      // % saham di atas SMA200
    advanceDeclineRatio: number
    newHighsNewLows: number
  }
  spxIndicators: {
    price: number; change: number; changePct: number
    vs50dma: number; vs200dma: number; vs62wEma: number
  }
  leadingIndicators: Array<{
    name: string
    value: string
    trend: 'up' | 'down' | 'flat'
    signal: 'bullish' | 'neutral' | 'bearish'
    description: string
  }>
  regime: MarketRegime
  regimeConfidence: number
}>

Leading indicators yang di-track:
  Copper/Gold ratio, VIX, HYG (high yield bonds),
  A/D Line, New Highs vs New Lows, Put/Call ratio,
  Yield Curve (2-10), DXY (Dollar Index)
```

```
TASK 9.2 — Brief Generator (src/lib/brief/generator.ts)
Generate AI market brief menggunakan Groq:

export async function generateMarketBrief(
  marketData: MarketBriefData
): Promise<{
  whatYouNeedToKnow: string     // 1 paragraph executive summary
  whereAreWe: string            // market position analysis
  tooLateToBuy: string          // is it too late?
  buyTheDip: string             // dip buying analysis
  whenDoesItEnd: string         // correction risk assessment
  hiddenRisk: string            // non-obvious risk
}>

Prompt: berikan context lengkap dari marketData
Model: llama-3.3-70b-versatile (lebih pintar untuk analisis complex)
Cache: 24 jam (1x generate per hari, pagi sebelum market open)

Fallback: jika Groq down, return template berbasis regime data
```

```
TASK 9.3 — Market Brief Page (src/app/(dashboard)/brief/page.tsx)
SEO: noindex (behind auth, daily content)

Layout:
- "Today's Market Brief" header + tanggal
- Market Regime card (prominent, large):
  Regime name + confidence % + description
  Color-coded: Uptrend=green, Downtrend=red, dll
- AI Brief sections (5 pertanyaan kunci):
  Tiap section: question + AI answer (expandable)
- Market Health grid (6 metrics):
  % Above 50/200 DMA, S&P vs MAs, vs 62wk EMA, Top100 YTD
- Leading Indicators table:
  Indicator | Value | Trend arrow | Signal badge | What it means
- Macro Indicators table
- Last updated timestamp + "Refreshed daily at 6 AM ET"

Suspense + skeleton untuk semua sections
```

### 9.4 — Verify Checklist Phase 9
```
[ ] Market data aggregator fetch real data
[ ] Regime detection logic berjalan
[ ] Groq generate brief dengan context yang benar
[ ] Cache 24 jam berfungsi
[ ] Fallback template bekerja saat Groq down
[ ] Brief page render semua sections
[ ] Leading indicators table display benar
[ ] Mobile: sections stack vertically, readable
```

---

---

# PHASE 10 — Homepage & SEO Pages
## Estimasi: 1 sesi Claude Code

**Objective**: Public landing page + SEO-optimized content pages.

```
TASK 10.1 — Homepage (src/app/(marketing)/page.tsx)
SEO:
  title: "StockScanner AI — AI-Powered Stock Scanner & Market Intelligence"
  description: "Scan 5000+ US stocks with 30+ pattern scanners. Bull Flag, VCP, Cup & Handle. AI entry strategies with entry, stop loss, and targets. Free to start."
  keywords: ['stock scanner', 'bull flag scanner', 'swing trading tools', ...]
  Structured data: WebSite + WebApplication + FAQPage schema

Sections:
  1. Hero: Headline + subheadline + CTA "Start Scanning Free" + demo video/screenshot
  2. Social proof: "40,000+ traders" + key stats
  3. Feature showcase: 4 cards (Scanner, Top 100, Theme Tracker, AI Brief)
  4. Scanner preview: live-looking scanner result cards (static/SSG)
  5. How it works: 3 steps (Scan → Analyze → Trade)
  6. Testimonials section
  7. FAQ section (structured data → rich snippets)
  8. Final CTA

Performance:
  Above-fold content: zero JS (static)
  Images: next/image dengan priority={true} untuk hero
  LCP target: < 2.5 detik
```

```
TASK 10.2 — Scanner Landing Pages (src/app/(marketing)/scanner/[name]/page.tsx)
SEO-optimized public preview pages untuk setiap scanner.
Ini SANGAT PENTING untuk organic SEO.

generateStaticParams(): semua scanner slugs
generateMetadata(): unique per scanner

Each page:
  - Full SEO meta + JSON-LD (SoftwareApplication schema)
  - H1: "{Scanner Name} Scanner — Find {Description} Setups"
  - Intro paragraph: what this pattern is, who uses it
  - Key criteria section (bulleted, educational)
  - Screenshot/demo of scanner results (static image atau SSG data)
  - How to trade it section
  - Link ke dashboard: "Run This Scanner →"
  - Related scanners section
  - FAQ: 3-5 pertanyaan tentang pattern ini

Target keywords per page:
  bull-flag: "bull flag scanner", "bull flag stocks today", "bull flag trading"
  vcp: "VCP scanner", "volatility contraction pattern stocks", "Minervini VCP"
  dll.
```

```
TASK 10.3 — Learn Section (src/app/(marketing)/learn/page.tsx)
Blog-style educational content untuk SEO:

Index page:
  title: "Learn Technical Analysis — Pattern Guides & Trading Strategies"
  List semua guides dalam grid cards
  Filter by category

Individual guide: src/app/(marketing)/learn/[slug]/page.tsx
  - MDX-based content
  - Full Article JSON-LD structured data
  - Reading time estimate
  - Author: "StockScanner AI Team"
  - Related patterns section

Buat 3 guide pertama (MDX):
  - learn/bull-flag-pattern → "Bull Flag Pattern: Complete Trading Guide"
  - learn/vcp-pattern → "VCP Pattern: Minervini's Volatility Contraction"
  - learn/trend-template → "Minervini Trend Template: All 8 Criteria"
```

```
TASK 10.4 — SEO Infrastructure
Buat file-file SEO wajib:

a) src/app/sitemap.ts
   Dynamic sitemap yang include:
   - Static pages (/, /scanner, /learn, dll)
   - Scanner pages (/scanner/[slug] per scanner)
   - Learn pages (/learn/[slug] per guide)
   Priority dan changeFrequency yang benar per page type

b) src/app/robots.ts
   Allow: / (semua public pages)
   Disallow: /api/, /(dashboard)/
   Sitemap: URL absolut ke sitemap

c) src/components/seo/JsonLd.tsx
   Reusable component untuk inject JSON-LD structured data
   Support: WebSite, WebApplication, Article, BreadcrumbList, FAQPage

d) src/components/seo/Breadcrumb.tsx
   Visual breadcrumb + generate JSON-LD secara otomatis
```

### 10.4 — Verify Checklist Phase 10
```
[ ] Homepage load cepat (< 2.5s LCP)
[ ] Hero CTA mengarah ke /sign-up
[ ] Scanner landing pages ada untuk semua scanner
[ ] generateStaticParams() berfungsi
[ ] Learn guides MDX render dengan benar
[ ] Sitemap.xml accessible di /sitemap.xml
[ ] Robots.txt benar (/robots.txt)
[ ] JSON-LD structured data valid (test di Google Rich Results)
[ ] Open Graph images tampil saat share di social media
[ ] Mobile: homepage fully responsive
```

---

---

# PHASE 11 — Auth, Polish & Performance
## Estimasi: 1 sesi Claude Code

**Objective**: Finalize auth flow, UI polish, dan performance optimization.

```
TASK 11.1 — Clerk Auth Pages
Customize Clerk sign-in/sign-up pages:
  src/app/sign-in/[[...sign-in]]/page.tsx
  src/app/sign-up/[[...sign-up]]/page.tsx

Styling: match design system (dark navy, cyan accents)
Appearance: custom Clerk appearance object
Redirect setelah login → /brief (Dashboard)

SEO: noindex untuk auth pages
```

```
TASK 11.2 — Global Search (src/components/layout/GlobalSearch.tsx)
Search bar di header untuk cari ticker:

Features:
  - Keyboard shortcut: Cmd+K
  - Debounced search input
  - Results: Ticker + Company Name + Price + % Chg
  - Klik result → buka EntryStrategyModal langsung
  - Recent searches (localStorage)
  - Fuzzy search client-side

API: GET /api/search?q={query} → match dari universe tickers
```

```
TASK 11.3 — Performance Optimization
Audit dan fix performance issues:

Images:
  - Semua <img> → <Image> dari next/image
  - Add sizes prop yang tepat
  - WebP format

Code splitting:
  - Dynamic import untuk heavy components (Chart, Modal)
  - Lazy load below-fold sections

Caching:
  - Static pages: revalidate = 3600 (1 jam)
  - Scanner API: Cache-Control headers benar
  - Supabase queries: connection pooling

Bundle analysis:
  - npm run build → analyze bundle size
  - Remove unused dependencies

Core Web Vitals:
  - LCP < 2.5s ✓
  - CLS < 0.1 ✓ (add explicit dimensions ke semua images/charts)
  - FID < 100ms ✓
```

```
TASK 11.4 — Error Handling & Edge Cases
Buat komprehensif error handling:

a) Global error boundary: src/app/error.tsx
   Design sesuai theme, tombol "Try Again"

b) Not found page: src/app/not-found.tsx
   Custom 404 dengan suggestions

c) API error responses: consistent format
   { error: string, code: string, details?: unknown }

d) Suspense boundaries:
   Pastikan semua async components wrapped dengan Suspense

e) Rate limiting:
   Protect API routes dengan basic rate limiting (upstash/redis atau simple in-memory)

f) Empty states:
   Setiap list/table ada empty state yang informatif
```

```
TASK 11.5 — Final SEO Audit
Audit semua halaman:

Per page checklist:
  [ ] Unique title < 60 chars
  [ ] Unique description < 160 chars
  [ ] H1 ada (satu per page)
  [ ] H2/H3 hierarchy benar
  [ ] Images semua ada alt text
  [ ] Internal links antar halaman
  [ ] Canonical URL benar
  [ ] JSON-LD valid

Tools untuk test:
  Google Rich Results Test → https://search.google.com/test/rich-results
  Meta tags → browser inspector
  Lighthouse → performance + SEO score
  Ahrefs/Screaming Frog → crawl issues
```

### 11.4 — Final Verify Checklist
```
[ ] Auth flow: sign-up → dashboard berfungsi
[ ] Auth flow: sign-in → dashboard berfungsi
[ ] Clerk redirect benar
[ ] Global search berfungsi
[ ] Bundle size reasonable (< 300kb first load JS)
[ ] Lighthouse SEO score: 90+
[ ] Lighthouse Performance: 80+
[ ] Semua API routes ada error handling
[ ] 404 page sesuai design
[ ] Mobile: semua fitur accessible
[ ] Console: zero errors di production build
[ ] TypeScript: zero errors (strict mode)
```

---

---

## 📋 Ringkasan Semua Phase

| Phase | Fokus | Estimasi |
|-------|-------|----------|
| 1 | Foundation, Design System, Config | 1 sesi |
| 2 | Layout Shell, Navigation | 1 sesi |
| 3 | Market Data, TA Engine, Scoring | 1 sesi |
| 4 | Scanner Engine (Pattern Detection) | 1 sesi |
| 5 | Scanner UI Pages + Charts | 1 sesi |
| 6 | Entry Strategy Feature (AI) | 1 sesi |
| 7 | Top 100 Dashboard | 1 sesi |
| 8 | Theme Tracker | 1 sesi |
| 9 | Daily Market Brief | 1 sesi |
| 10 | Homepage + SEO Pages | 1 sesi |
| 11 | Auth, Polish, Performance | 1 sesi |

**Total: ~11 sesi Claude Code**

---

## 🚀 Quick Start Command

```bash
# Phase 1 dimulai dengan:
npx create-next-app@latest stockscanner-ai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

---

## 📌 Catatan Penting

1. **Jangan skip phase** — setiap phase adalah dependency untuk phase berikutnya
2. **SEO di setiap komponen** — bukan afterthought, built-in dari awal
3. **LLM hanya untuk narasi** — scanner, scoring, charting = pure math
4. **Cache agresif** — Polygon.io API punya rate limit, cache semua
5. **Test di mobile** — 60%+ user akan akses dari HP
6. **Pricing feature** — skip untuk sekarang, slot tersedia di Phase 12 nanti
