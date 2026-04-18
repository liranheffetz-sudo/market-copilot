export type SupportedInterval = "1m" | "5m" | "1h" | "1D" | "1W";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LineSeriesPoint = {
  time: number;
  value: number;
};

export type BollingerPoint = {
  time: number;
  upper: number;
  middle: number;
  lower: number;
};

export type MacdPoint = {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
};

export type StochasticPoint = {
  time: number;
  k: number;
  d: number;
};

export type TechnicalIndicatorSet = {
  sma20: LineSeriesPoint[];
  sma50: LineSeriesPoint[];
  ema20: LineSeriesPoint[];
  macd: MacdPoint[];
  rsi14: LineSeriesPoint[];
  stochastic: StochasticPoint[];
  bollinger: BollingerPoint[];
  vwap: LineSeriesPoint[];
};

export type QuoteSnapshot = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  updatedAt: string;
};

export type CompanyProfile = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: number | null;
  beta: number | null;
  website: string | null;
};

export type FinancialStatementRow = {
  fiscalDate: string;
  revenue?: number | null;
  grossProfit?: number | null;
  operatingIncome?: number | null;
  netIncome?: number | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  totalEquity?: number | null;
  cashAndEquivalents?: number | null;
  operatingCashFlow?: number | null;
  capitalExpenditure?: number | null;
  freeCashFlow?: number | null;
};

export type FinancialStatements = {
  incomeStatementAnnual: FinancialStatementRow[];
  balanceSheetAnnual: FinancialStatementRow[];
  cashFlowAnnual: FinancialStatementRow[];
};

export type KeyMetrics = {
  peRatio: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  roe: number | null;
  debtToEquity: number | null;
  freeCashFlow: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
};

export type SectorBenchmark = {
  sector: string;
  peRatio: number;
  revenueGrowth: number;
  roe: number;
  debtToEquity: number;
};

export type MetricComparison = {
  metric: keyof Omit<KeyMetrics, "freeCashFlow" | "grossMargin" | "operatingMargin" | "profitMargin" | "eps">;
  companyValue: number | null;
  sectorValue: number;
  deltaPercent: number | null;
  interpretation: string;
};

export type ValuationSummary = {
  intrinsicValue: number | null;
  upsidePercent: number | null;
  method: string;
  confidence: "low" | "medium" | "high";
  notes: string[];
};

export type NewsArticle = {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  relevanceScore: number;
};

export type SentimentSummary = {
  averageScore: number;
  label: "positive" | "neutral" | "negative";
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
};

export type AIInsight = {
  bias: "Bullish" | "Bearish" | "Neutral";
  summary: string;
  reasoning: string[];
  risks: string[];
  catalysts: string[];
  disclaimer: string;
  generatedBy: "openai" | "rules-engine";
};

export type SearchResult = {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  exchange: string;
};

export type ComparisonSeries = {
  symbol: string;
  name: string;
  lastPrice: number;
  changePercent: number;
  normalized: LineSeriesPoint[];
};

export type DashboardPayload = {
  symbol: string;
  interval: SupportedInterval;
  profile: CompanyProfile;
  quote: QuoteSnapshot;
  candles: Candle[];
  indicators: TechnicalIndicatorSet;
  comparison: ComparisonSeries[];
  fundamentals: {
    statements: FinancialStatements;
    keyMetrics: KeyMetrics;
    valuation: ValuationSummary;
    sectorBenchmark: SectorBenchmark;
    comparison: MetricComparison[];
  };
  news: NewsArticle[];
  sentiment: SentimentSummary;
  aiInsight: AIInsight;
  meta: {
    source: string;
    fetchedAt: string;
    usedFallbackData: boolean;
  };
};
