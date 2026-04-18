import type {
  CompanyProfile,
  FinancialStatementRow,
  FinancialStatements,
  NewsArticle,
  QuoteSnapshot,
  SearchResult,
  SupportedInterval
} from "@market-copilot/shared";
import { round } from "@market-copilot/shared";

const intervalSeconds: Record<SupportedInterval, number> = {
  "1m": 60,
  "5m": 300,
  "1h": 3_600,
  "1D": 86_400,
  "1W": 604_800
};

const intervalPoints: Record<SupportedInterval, number> = {
  "1m": 240,
  "5m": 300,
  "1h": 180,
  "1D": 365,
  "1W": 260
};

const demoUniverse: SearchResult[] = [
  { symbol: "AAPL", name: "Apple Inc.", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms, Inc.", region: "United States", currency: "USD", exchange: "NASDAQ" },
  { symbol: "SAP.DE", name: "SAP SE", region: "Germany", currency: "EUR", exchange: "XETRA" },
  { symbol: "7203.T", name: "Toyota Motor Corporation", region: "Japan", currency: "JPY", exchange: "TYO" }
];

const sectorPool = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Industrials",
  "Energy"
] as const;

const headlineTemplates = [
  "management highlights margin resilience in the latest investor update",
  "analysts reassess growth expectations after recent product momentum",
  "institutional flows point to renewed attention around the stock",
  "company roadmap keeps focus on international expansion and AI initiatives",
  "operating discipline remains in focus ahead of the next earnings cycle",
  "supply chain commentary suggests a steadier demand backdrop"
];

const hashSymbol = (symbol: string) =>
  symbol.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);

const seededRandom = (seed: number) => {
  let value = seed % 2_147_483_647;
  return () => {
    value = (value * 16_807) % 2_147_483_647;
    return (value - 1) / 2_147_483_646;
  };
};

export const searchDemoUniverse = (query: string) => {
  const normalizedQuery = query.toLowerCase();
  return demoUniverse.filter(
    (item) =>
      item.symbol.toLowerCase().includes(normalizedQuery) ||
      item.name.toLowerCase().includes(normalizedQuery)
  );
};

export const buildDemoCandles = (symbol: string, interval: SupportedInterval) => {
  const seed = hashSymbol(symbol);
  const random = seededRandom(seed);
  const points = intervalPoints[interval];
  const seconds = intervalSeconds[interval];
  const candles = [];

  let close = 50 + (seed % 220);
  let time = Math.floor(Date.now() / 1000) - points * seconds;
  const trend = ((seed % 9) - 4) / 10_000;

  for (let index = 0; index < points; index += 1) {
    const seasonal = Math.sin(index / 18) * (close * 0.008);
    const shock = (random() - 0.5) * (close * 0.02);
    const nextClose = Math.max(close * (1 + trend) + seasonal + shock, 5);
    const open = close;
    const high = Math.max(open, nextClose) * (1 + random() * 0.01);
    const low = Math.min(open, nextClose) * (1 - random() * 0.01);
    const volume = Math.floor(800_000 + random() * 4_500_000);

    candles.push({
      time,
      open: round(open, 2),
      high: round(high, 2),
      low: round(low, 2),
      close: round(nextClose, 2),
      volume
    });

    close = nextClose;
    time += seconds;
  }

  return candles;
};

export const buildDemoQuote = (symbol: string, price: number, previousClose: number): QuoteSnapshot => ({
  symbol,
  price,
  change: round(price - previousClose, 2),
  changePercent: round(((price - previousClose) / previousClose) * 100, 2),
  open: previousClose,
  previousClose,
  dayHigh: round(Math.max(price, previousClose) * 1.015, 2),
  dayLow: round(Math.min(price, previousClose) * 0.985, 2),
  volume: Math.floor(1_200_000 + hashSymbol(symbol) * 1_500),
  updatedAt: new Date().toISOString()
});

export const buildDemoProfile = (symbol: string): CompanyProfile => {
  const seed = hashSymbol(symbol);
  const sector = sectorPool[seed % sectorPool.length];

  return {
    symbol,
    name: demoUniverse.find((item) => item.symbol === symbol)?.name ?? `${symbol} Holdings`,
    exchange: demoUniverse.find((item) => item.symbol === symbol)?.exchange ?? "NASDAQ",
    currency: demoUniverse.find((item) => item.symbol === symbol)?.currency ?? "USD",
    country: demoUniverse.find((item) => item.symbol === symbol)?.region ?? "United States",
    sector,
    industry: `${sector} Services`,
    description:
      "Fallback profile generated locally so the dashboard remains explorable before live API keys are configured.",
    marketCap: 20_000_000_000 + seed * 250_000_000,
    beta: round(0.8 + (seed % 70) / 100, 2),
    website: `https://www.${symbol.toLowerCase().replace(/[^a-z]/g, "") || "demo"}corp.com`
  };
};

const buildStatementHistory = (baseRevenue: number, seed: number): FinancialStatementRow[] => {
  const history: FinancialStatementRow[] = [];
  const random = seededRandom(seed * 3);
  let revenue = baseRevenue;

  for (let offset = 0; offset < 5; offset += 1) {
    const fiscalYear = new Date().getUTCFullYear() - offset;
    const growth = 1 + (0.05 + random() * 0.12);
    const grossProfit = revenue * (0.48 + random() * 0.18);
    const operatingIncome = grossProfit * (0.42 + random() * 0.15);
    const netIncome = operatingIncome * (0.75 + random() * 0.18);
    const operatingCashFlow = netIncome * (1.05 + random() * 0.2);
    const capitalExpenditure = operatingCashFlow * (0.14 + random() * 0.08);
    const totalAssets = revenue * (1.45 + random() * 0.5);
    const totalLiabilities = totalAssets * (0.38 + random() * 0.2);

    history.push({
      fiscalDate: `${fiscalYear}-12-31`,
      revenue: Math.round(revenue),
      grossProfit: Math.round(grossProfit),
      operatingIncome: Math.round(operatingIncome),
      netIncome: Math.round(netIncome),
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      totalEquity: Math.round(totalAssets - totalLiabilities),
      cashAndEquivalents: Math.round(revenue * (0.1 + random() * 0.08)),
      operatingCashFlow: Math.round(operatingCashFlow),
      capitalExpenditure: -Math.round(capitalExpenditure),
      freeCashFlow: Math.round(operatingCashFlow - capitalExpenditure)
    });

    revenue /= growth;
  }

  return history;
};

export const buildDemoStatements = (symbol: string): FinancialStatements => {
  const seed = hashSymbol(symbol);
  const revenueBase = 15_000_000_000 + seed * 110_000_000;
  const incomeHistory = buildStatementHistory(revenueBase, seed);

  return {
    incomeStatementAnnual: incomeHistory.map(({ fiscalDate, revenue, grossProfit, operatingIncome, netIncome }) => ({
      fiscalDate,
      revenue,
      grossProfit,
      operatingIncome,
      netIncome
    })),
    balanceSheetAnnual: incomeHistory.map(
      ({ fiscalDate, totalAssets, totalLiabilities, totalEquity, cashAndEquivalents }) => ({
        fiscalDate,
        totalAssets,
        totalLiabilities,
        totalEquity,
        cashAndEquivalents
      })
    ),
    cashFlowAnnual: incomeHistory.map(
      ({ fiscalDate, operatingCashFlow, capitalExpenditure, freeCashFlow }) => ({
        fiscalDate,
        operatingCashFlow,
        capitalExpenditure,
        freeCashFlow
      })
    )
  };
};

export const buildDemoNews = (symbol: string): NewsArticle[] => {
  const seed = hashSymbol(symbol);

  return headlineTemplates.map((suffix, index) => {
    const sentimentIndex = (seed + index) % 3;
    const sentiment = sentimentIndex === 0 ? "positive" : sentimentIndex === 1 ? "neutral" : "negative";

    return {
      id: `${symbol}-${index}`,
      headline: `${symbol} ${suffix}`,
      summary:
        "Demo news item used when live providers are not configured. Replace with Alpha Vantage/Finnhub keys for production market coverage.",
      url: `https://example.com/news/${symbol.toLowerCase()}-${index}`,
      source: "Market Copilot Demo Feed",
      publishedAt: new Date(Date.now() - index * 10_800_000).toISOString(),
      sentiment,
      relevanceScore: round(0.92 - index * 0.08, 2)
    };
  });
};
