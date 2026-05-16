-- ═══════════════════════════════════════════════════════════
-- StockScanner AI — Supabase Schema
-- Run this in Supabase SQL editor to initialize the database
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- scanner_results: cached scanner output per ticker per day
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scanner_results (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker       text        NOT NULL,
  pattern      text        NOT NULL,
  company_name text,
  price        numeric,
  change_pct   numeric,
  volume       bigint,
  market_cap   bigint,
  sector       text,
  pattern_data jsonb,
  ta_score     numeric,
  fa_score     numeric,
  ars_rating   integer,
  als_score    integer,
  setup_quality numeric,
  scanned_at   timestamptz DEFAULT now(),
  date         date        DEFAULT CURRENT_DATE
);

-- ───────────────────────────────────────────────────────────
-- entry_strategies: AI-generated trade strategies (cached)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entry_strategies (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker       text        NOT NULL,
  pattern      text        NOT NULL,
  trade_type   text        NOT NULL,  -- 'swing' | 'day'
  strategy     jsonb       NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at   timestamptz
);

-- ───────────────────────────────────────────────────────────
-- daily_briefs: AI market briefing cached per day
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_briefs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date          date        UNIQUE DEFAULT CURRENT_DATE,
  regime        text,
  confidence    numeric,
  brief_content jsonb,
  created_at    timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────
-- ohlcv_cache: cached historical price data from Polygon
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ohlcv_cache (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker     text        NOT NULL,
  date       date        NOT NULL,
  open       numeric     NOT NULL,
  high       numeric     NOT NULL,
  low        numeric     NOT NULL,
  close      numeric     NOT NULL,
  volume     bigint      NOT NULL,
  cached_at  timestamptz DEFAULT now(),
  UNIQUE (ticker, date)
);

-- ───────────────────────────────────────────────────────────
-- fundamentals_cache: cached fundamental data (7-day TTL)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fundamentals_cache (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker       text        UNIQUE NOT NULL,
  data         jsonb       NOT NULL,
  cached_at    timestamptz DEFAULT now(),
  expires_at   timestamptz DEFAULT (now() + interval '7 days')
);

-- ───────────────────────────────────────────────────────────
-- Indexes for query performance
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scanner_results_pattern_date
  ON scanner_results(pattern, date);

CREATE INDEX IF NOT EXISTS idx_scanner_results_ticker
  ON scanner_results(ticker);

CREATE INDEX IF NOT EXISTS idx_scanner_results_date
  ON scanner_results(date DESC);

CREATE INDEX IF NOT EXISTS idx_entry_strategies_ticker_pattern
  ON entry_strategies(ticker, pattern);

CREATE INDEX IF NOT EXISTS idx_entry_strategies_expires
  ON entry_strategies(expires_at);

CREATE INDEX IF NOT EXISTS idx_ohlcv_cache_ticker_date
  ON ohlcv_cache(ticker, date DESC);

CREATE INDEX IF NOT EXISTS idx_fundamentals_expires
  ON fundamentals_cache(expires_at);

-- ───────────────────────────────────────────────────────────
-- Row Level Security (enable but allow service role full access)
-- ───────────────────────────────────────────────────────────
ALTER TABLE scanner_results     ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_strategies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ohlcv_cache         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundamentals_cache  ENABLE ROW LEVEL SECURITY;

-- Anon users can read cached data (public scanner results)
CREATE POLICY "Public read scanner_results"
  ON scanner_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read entry_strategies"
  ON entry_strategies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read daily_briefs"
  ON daily_briefs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role has full access (used by API routes)
-- No policy needed — service_role bypasses RLS by default
