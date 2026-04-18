import {
  calculateTechnicalIndicatorSet,
  type DashboardPayload,
  type FinancialStatements,
  type KeyMetrics,
  type NewsArticle,
  type SearchResult,
  type SupportedInterval,
  buildMetricComparisons,
  estimateIntrinsicValue,
  getSectorBenchmark,
  normalizePerformanceSeries,
  safeNumber,
  summarizeSentiment
} from "@market-copilot/shared";

import { env } from "../config/env.js";
import { TTLCache } from "../lib/cache.js";
import { buildDemoCandles, buildDemoNews, buildDemoProfile, buildDemoQuote, buildDemoStatements, searchDemoUniverse } from "./demo-data.js";
import { generateAIInsight } from "./ai-insights.js";
import { AlphaVantageProvider } from "./providers/alpha-vantage.js";

const provider = new AlphaVantageProvider(env.ALPHA_VANTAGE_API_KEY);
const cache = new TTLCache<unknown>(env.CACHE_TTL_SECONDS * 1000);

const toPercent = (value: number | null) => {
  if (value === null) return null;
  return Math.abs(value) <= 1.5 ? value * 100 : value;
};

const deriveKeyMetrics = (
  overview: Record<string, string>,
  statements: FinancialStatements
): KeyMetrics => {
  const latestIncome = statements.incomeStatementAnnual[0];
  const latestBalance = statements.balanceSheetAnnual[0];
  const latestCashFlow = statements.cashFlowAnnual[0];

  const revenueGrowthRaw = safeNumber(overview.QuarterlyRevenueGrowthYOY);
  const roeRaw = safeNumber(overview.ReturnOnEquityTTM);
  const grossMarginRaw = safeNumber(overview.GrossProfitTTM);

  return {
    peRatio: safeNumber(overview.PERatio),
    eps: safeNumber(overview.EPS),
    revenueGrowth: toPercent(revenueGrowthRaw),
    roe: toPercent(roeRaw),
    debtToEquity: safeNumber(overview.DebtToEquityRatio ?? overview.DebtToEquity),
    freeCashFlow: latestCashFlow?.freeCashFlow ?? null,
    grossMargin:
      latestIncome?.revenue && latestIncome.grossProfit
        ? (latestIncome.grossProfit / latestIncome.revenue) * 100
        : grossMarginRaw,
    operatingMargin:
      latestIncome?.revenue && latestIncome.operatingIncome
        ? (latestIncome.operatingIncome / latestIncome.revenue) * 100
        : null,
    profitMargin:
      latestIncome?.revenue && latestIncome.netIncome ? (latestIncome.netIncome / latestIncome.revenue) * 100 : null
  };
};

const buildFallbackDashboard = async (
  symbol: string,
  interval: SupportedInterval,
  compareSymbols: string[]
): Promise<DashboardPayload> => {
  const candles = buildDemoCandles(symbol, interval);
  const profile = buildDemoProfile(symbol);
  const quote = buildDemoQuote(symbol, candles[candles.length - 1].close, candles[candles.length - 2].close);
  const statements = buildDemoStatements(symbol);
  const keyMetrics = deriveKeyMetrics(
    {
      EPS: String((candles[candles.length - 1].close / 18).toFixed(2)),
      PERatio: "18.4",
      QuarterlyRevenueGrowthYOY: "0.12",
      ReturnOnEquityTTM: "0.18",
      DebtToEquity: "0.72"
    },
    statements
  );
  const sectorBenchmark = getSectorBenchmark(profile.sector);
  const valuation = estimateIntrinsicValue(keyMetrics, quote.price, sectorBenchmark);
  const comparison = buildMetricComparisons(keyMetrics, sectorBenchmark);
  const indicators = calculateTechnicalIndicatorSet(candles);
  const news = buildDemoNews(symbol);
  const sentiment = summarizeSentiment(news);
  const aiInsight = await generateAIInsight({
    profile,
    quote,
    indicators,
    fundamentals: { statements, keyMetrics, valuation, sectorBenchmark, comparison },
    news,
    sentiment
  });

  const compareSeries = compareSymbols.map((compareSymbol) => {
    const compareCandles = buildDemoCandles(compareSymbol, interval);
    const last = compareCandles[compareCandles.length - 1];
    const previous = compareCandles[compareCandles.length - 2];

    return {
      symbol: compareSymbol,
      name: buildDemoProfile(compareSymbol).name,
      lastPrice: last.close,
      changePercent: Number((((last.close - previous.close) / previous.close) * 100).toFixed(2)),
      normalized: normalizePerformanceSeries(compareCandles)
    };
  });

  return {
    symbol,
    interval,
    profile,
    quote,
    candles,
    indicators,
    comparison: compareSeries,
    fundamentals: {
      statements,
      keyMetrics,
      valuation,
      sectorBenchmark,
      comparison
    },
    news,
    sentiment,
    aiInsight,
    meta: {
      source: "demo-fallback",
      fetchedAt: new Date().toISOString(),
      usedFallbackData: true
    }
  };
};

const buildLiveDashboard = async (
  symbol: string,
  interval: SupportedInterval,
  compareSymbols: string[]
): Promise<DashboardPayload> => {
  const [overview, quote, candles, income, balance, cashFlow, news] = await Promise.all([
    cache.getOrSet(`overview:${symbol}`, () => provider.getOverview(symbol)),
    cache.getOrSet(`quote:${symbol}`, () => provider.getQuote(symbol), 30_000),
    cache.getOrSet(`candles:${symbol}:${interval}`, () => provider.getCandles(symbol, interval), 120_000),
    cache.getOrSet(`income:${symbol}`, () => provider.getIncomeStatement(symbol)),
    cache.getOrSet(`balance:${symbol}`, () => provider.getBalanceSheet(symbol)),
    cache.getOrSet(`cashflow:${symbol}`, () => provider.getCashFlow(symbol)),
    cache.getOrSet(`news:${symbol}`, () => provider.getNews(symbol), 90_000)
  ]) as [Record<string, string>, DashboardPayload["quote"], DashboardPayload["candles"], FinancialStatements["incomeStatementAnnual"], FinancialStatements["balanceSheetAnnual"], FinancialStatements["cashFlowAnnual"], NewsArticle[]];

  const profile = provider.mapOverviewToProfile(symbol, overview);
  const statements: FinancialStatements = {
    incomeStatementAnnual: income,
    balanceSheetAnnual: balance,
    cashFlowAnnual: cashFlow
  };
  const keyMetrics = deriveKeyMetrics(overview, statements);
  const sectorBenchmark = getSectorBenchmark(profile.sector);
  const valuation = estimateIntrinsicValue(keyMetrics, quote.price, sectorBenchmark);
  const comparison = buildMetricComparisons(keyMetrics, sectorBenchmark);
  const indicators = calculateTechnicalIndicatorSet(candles);
  const sentiment = summarizeSentiment(news);
  const aiInsight = await generateAIInsight({
    profile,
    quote,
    indicators,
    fundamentals: { statements, keyMetrics, valuation, sectorBenchmark, comparison },
    news,
    sentiment
  });

  const compareSeries = await Promise.all(
    compareSymbols.map(async (compareSymbol) => {
      const [compareOverview, compareQuote, compareCandles] = await Promise.all([
        cache.getOrSet(`overview:${compareSymbol}`, () => provider.getOverview(compareSymbol)),
        cache.getOrSet(`quote:${compareSymbol}`, () => provider.getQuote(compareSymbol), 30_000),
        cache.getOrSet(`candles:${compareSymbol}:${interval}`, () => provider.getCandles(compareSymbol, interval), 120_000)
      ]);

      return {
        symbol: compareSymbol,
        name: provider.mapOverviewToProfile(compareSymbol, compareOverview as Record<string, string>).name,
        lastPrice: (compareQuote as DashboardPayload["quote"]).price,
        changePercent: (compareQuote as DashboardPayload["quote"]).changePercent,
        normalized: normalizePerformanceSeries(compareCandles as DashboardPayload["candles"])
      };
    })
  );

  return {
    symbol,
    interval,
    profile,
    quote,
    candles,
    indicators,
    comparison: compareSeries,
    fundamentals: {
      statements,
      keyMetrics,
      valuation,
      sectorBenchmark,
      comparison
    },
    news,
    sentiment,
    aiInsight,
    meta: {
      source: "alpha-vantage",
      fetchedAt: new Date().toISOString(),
      usedFallbackData: false
    }
  };
};

export const searchStocks = async (query: string): Promise<{ results: SearchResult[]; usedFallback: boolean }> => {
  if (!provider.isConfigured()) {
    return {
      results: searchDemoUniverse(query),
      usedFallback: true
    };
  }

  try {
    const results = await cache.getOrSet(`search:${query}`, () => provider.searchSymbols(query), 300_000);
    return {
      results: results as SearchResult[],
      usedFallback: false
    };
  } catch {
    return {
      results: searchDemoUniverse(query),
      usedFallback: true
    };
  }
};

export const getDashboard = async (symbol: string, interval: SupportedInterval, compareSymbols: string[]) => {
  if (!provider.isConfigured()) {
    return buildFallbackDashboard(symbol, interval, compareSymbols);
  }

  try {
    return await buildLiveDashboard(symbol, interval, compareSymbols);
  } catch {
    return buildFallbackDashboard(symbol, interval, compareSymbols);
  }
};

export const getChartSnapshot = async (symbol: string, interval: SupportedInterval, compareSymbols: string[]) => {
  const dashboard = await getDashboard(symbol, interval, compareSymbols);
  return {
    symbol: dashboard.symbol,
    interval: dashboard.interval,
    candles: dashboard.candles,
    indicators: dashboard.indicators,
    comparison: dashboard.comparison,
    meta: dashboard.meta
  };
};

export const getFundamentalsSnapshot = async (symbol: string, interval: SupportedInterval) => {
  const dashboard = await getDashboard(symbol, interval, []);
  return {
    symbol: dashboard.symbol,
    profile: dashboard.profile,
    fundamentals: dashboard.fundamentals,
    meta: dashboard.meta
  };
};

export const getNewsSnapshot = async (symbol: string, interval: SupportedInterval) => {
  const dashboard = await getDashboard(symbol, interval, []);
  return {
    symbol: dashboard.symbol,
    news: dashboard.news,
    sentiment: dashboard.sentiment,
    meta: dashboard.meta
  };
};

export const getAiSnapshot = async (symbol: string, interval: SupportedInterval) => {
  const dashboard = await getDashboard(symbol, interval, []);
  return {
    symbol: dashboard.symbol,
    aiInsight: dashboard.aiInsight,
    meta: dashboard.meta
  };
};
