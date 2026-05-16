/** OHLCV bar — single trading day candle */
export interface OHLCV {
  time: string   // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** All calculated technical indicators for a stock */
export interface StockIndicators {
  // Simple Moving Averages
  sma10:  number | null
  sma20:  number | null
  sma50:  number | null
  sma150: number | null
  sma200: number | null

  // Exponential Moving Averages
  ema21: number | null
  ema65: number | null

  // Momentum
  rsi14:      number | null
  macd:       number | null
  macdSignal: number | null
  macdHist:   number | null

  // Bollinger Bands
  bbUpper: number | null
  bbMiddle: number | null
  bbLower: number | null

  // Volatility
  atrDaily: number | null

  // Stochastic
  stochK: number | null
  stochD: number | null

  // Volume
  volRatio: number | null   // current volume / 50-day avg volume

  // Relative position
  pctFrom52wHigh:  number | null
  pctFrom52wLow:   number | null
  priceVsSMA50:    number | null
  priceVsSMA200:   number | null
  sma50VsSMA200:   number | null
}

/** Fundamental data from Polygon.io financials */
export interface Fundamentals {
  eps:             number | null
  epsGrowthYoY:    number | null
  revenue:         number | null
  revenueGrowthYoY: number | null
  netMargin:       number | null
  operatingMargin: number | null
  roe:             number | null
  debtToEquity:    number | null
  currentRatio:    number | null
  peRatio:         number | null
  pegRatio:        number | null
}

/** Ticker details from Polygon.io */
export interface TickerDetails {
  ticker:           string
  name:             string
  sector:           string
  industry:         string
  marketCap:        number
  sharesOutstanding: number
  exchange:         string
  country:          string
}

/** Single scanner result row */
export interface ScannerResult {
  ticker:      string
  companyName: string
  price:       number
  change:      number
  changePct:   number
  volume:      number
  marketCap:   number
  sector:      string
  patternData: Record<string, unknown>
  taScore:     number
  faScore:     number
  arsRating:   number
  alsScore:    number
  setupQuality: number
}

/** AI-generated entry strategy */
export interface EntryStrategy {
  setupQuality:       number
  setupQualityReason: string
  tradeType:          'swing' | 'day'
  holdDuration:       string
  entry: {
    trigger:      string
    zoneLow:      number
    zoneHigh:     number
    confirmation: string
  }
  stopLoss: {
    price:    number
    logic:    string
    riskPct:  number
  }
  targets: Array<{
    price:   number
    pctGain: number
    sizePct: number
    logic:   string
  }>
  riskReward:       number
  positionSizeNote: string
  technicalConfluence: Array<{
    indicator: string
    value:     string
    signal:    'bullish' | 'neutral' | 'bearish'
    note:      string
  }>
  risks:        string[]
  invalidation: string
  aiSummary:    string
}

/** Market regime classification */
export type MarketRegime =
  | 'confirmed-uptrend'
  | 'uptrend-pressure'
  | 'rally-attempt'
  | 'downtrend'

/** Signal direction */
export type SignalType = 'bullish' | 'bearish' | 'neutral'

/** Trade timeframe */
export type TimeFrame = 'day' | 'swing' | 'long-term'

/** Scanner config metadata */
export interface ScannerMeta {
  slug:           string
  name:           string
  description:    string
  signal:         SignalType
  timeframe:      TimeFrame[]
  category:       string[]
  traderRef:      string | null
  likes:          number
  seoDescription: string
  seoKeywords:    string[]
}

/** Pattern detection result from a scanner */
export interface PatternResult {
  ticker:         string
  patternData:    Record<string, unknown>
  setupQuality:   number   // 1-10
  breakoutLevel?: number
  stopLevel?:     number
  notes:          string[]
}

/** Polygon grouped daily bar */
export interface PolygonDailyBar {
  T:  string   // ticker
  o:  number   // open
  h:  number   // high
  l:  number   // low
  c:  number   // close
  v:  number   // volume
  vw: number   // volume-weighted avg price
  n:  number   // number of transactions
}

/** Breadcrumb item for JSON-LD + UI */
export interface BreadcrumbItem {
  label: string
  href:  string
}
