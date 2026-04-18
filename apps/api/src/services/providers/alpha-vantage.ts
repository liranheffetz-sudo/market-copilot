import type {
  Candle,
  CompanyProfile,
  FinancialStatementRow,
  NewsArticle,
  QuoteSnapshot,
  SearchResult,
  SupportedInterval
} from "@market-copilot/shared";
import { round, safeNumber } from "@market-copilot/shared";

import { HttpError, fetchJson } from "../../lib/http.js";

const BASE_URL = "https://www.alphavantage.co/query";

type AlphaTimeSeriesResponse = Record<string, Record<string, Record<string, string>>> & {
  Note?: string;
  Information?: string;
  ErrorMessage?: string;
};

const intervalFunctionMap: Record<SupportedInterval, { fn: string; interval?: string }> = {
  "1m": { fn: "TIME_SERIES_INTRADAY", interval: "1min" },
  "5m": { fn: "TIME_SERIES_INTRADAY", interval: "5min" },
  "1h": { fn: "TIME_SERIES_INTRADAY", interval: "60min" },
  "1D": { fn: "TIME_SERIES_DAILY_ADJUSTED" },
  "1W": { fn: "TIME_SERIES_WEEKLY" }
};

const intervalPointLimit: Record<SupportedInterval, number> = {
  "1m": 240,
  "5m": 300,
  "1h": 180,
  "1D": 365,
  "1W": 260
};

const ensureUsableResponse = (payload: { Note?: string; Information?: string; ErrorMessage?: string }) => {
  if (payload.ErrorMessage) {
    throw new HttpError(payload.ErrorMessage, 502);
  }

  if (payload.Note || payload.Information) {
    throw new HttpError(payload.Note ?? payload.Information ?? "Provider throttled the request", 429);
  }
};

const buildUrl = (params: Record<string, string | undefined>) => {
  const url = new URL(BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const parseTimestamp = (raw: string) => {
  const normalized = raw.includes(" ") ? raw.replace(" ", "T") : `${raw}T00:00:00`;
  return Math.floor(new Date(`${normalized}Z`).getTime() / 1000);
};

const toSentiment = (score: number | null): "positive" | "neutral" | "negative" => {
  if (score === null) return "neutral";
  if (score > 0.15) return "positive";
  if (score < -0.15) return "negative";
  return "neutral";
};

export class AlphaVantageProvider {
  constructor(private readonly apiKey?: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  private ensureKey() {
    if (!this.apiKey) {
      throw new HttpError("ALPHA_VANTAGE_API_KEY is not configured", 503);
    }
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    this.ensureKey();

    const payload = await fetchJson<{
      bestMatches?: Array<Record<string, string>>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "SYMBOL_SEARCH",
        keywords: query,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    return (payload.bestMatches ?? []).map((match) => ({
      symbol: match["1. symbol"] ?? "",
      name: match["2. name"] ?? "",
      exchange: match["4. region"] ?? match["3. type"] ?? "",
      region: match["4. region"] ?? "",
      currency: match["8. currency"] ?? "USD"
    }));
  }

  async getCandles(symbol: string, interval: SupportedInterval): Promise<Candle[]> {
    this.ensureKey();

    const config = intervalFunctionMap[interval];
    const payload = await fetchJson<AlphaTimeSeriesResponse>(
      buildUrl({
        function: config.fn,
        symbol,
        interval: config.interval,
        outputsize: "full",
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    const seriesKey = Object.keys(payload).find((key) => key.includes("Time Series"));
    if (!seriesKey) {
      throw new HttpError(`No time series returned for ${symbol}`, 502);
    }

    const series = payload[seriesKey] ?? {};
    const candles = Object.entries(series)
      .map(([time, values]) => ({
        time: parseTimestamp(time),
        open: Number(values["1. open"] ?? 0),
        high: Number(values["2. high"] ?? 0),
        low: Number(values["3. low"] ?? 0),
        close: Number(values["4. close"] ?? 0),
        volume: Number(values["5. volume"] ?? values["6. volume"] ?? 0)
      }))
      .filter((candle) => candle.close > 0)
      .sort((left, right) => left.time - right.time)
      .slice(-intervalPointLimit[interval]);

    return candles;
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    this.ensureKey();

    const payload = await fetchJson<{
      "Global Quote"?: Record<string, string>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    const quote = payload["Global Quote"];
    if (!quote) {
      throw new HttpError(`No quote returned for ${symbol}`, 502);
    }

    return {
      symbol,
      price: Number(quote["05. price"] ?? 0),
      change: Number(quote["09. change"] ?? 0),
      changePercent: Number((quote["10. change percent"] ?? "0").replace("%", "")),
      open: safeNumber(quote["02. open"]),
      previousClose: safeNumber(quote["08. previous close"]),
      dayHigh: safeNumber(quote["03. high"]),
      dayLow: safeNumber(quote["04. low"]),
      volume: safeNumber(quote["06. volume"]),
      updatedAt: new Date().toISOString()
    };
  }

  async getOverview(symbol: string): Promise<Record<string, string>> {
    this.ensureKey();

    const payload = await fetchJson<Record<string, string> & { Note?: string; Information?: string; ErrorMessage?: string }>(
      buildUrl({
        function: "OVERVIEW",
        symbol,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);
    return payload;
  }

  async getIncomeStatement(symbol: string): Promise<FinancialStatementRow[]> {
    this.ensureKey();

    const payload = await fetchJson<{
      annualReports?: Array<Record<string, string>>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "INCOME_STATEMENT",
        symbol,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    return (payload.annualReports ?? []).slice(0, 5).map((row) => ({
      fiscalDate: row.fiscalDateEnding,
      revenue: safeNumber(row.totalRevenue),
      grossProfit: safeNumber(row.grossProfit),
      operatingIncome: safeNumber(row.operatingIncome),
      netIncome: safeNumber(row.netIncome)
    }));
  }

  async getBalanceSheet(symbol: string): Promise<FinancialStatementRow[]> {
    this.ensureKey();

    const payload = await fetchJson<{
      annualReports?: Array<Record<string, string>>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "BALANCE_SHEET",
        symbol,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    return (payload.annualReports ?? []).slice(0, 5).map((row) => ({
      fiscalDate: row.fiscalDateEnding,
      totalAssets: safeNumber(row.totalAssets),
      totalLiabilities: safeNumber(row.totalLiabilities),
      totalEquity: safeNumber(row.totalShareholderEquity),
      cashAndEquivalents: safeNumber(row.cashAndCashEquivalentsAtCarryingValue)
    }));
  }

  async getCashFlow(symbol: string): Promise<FinancialStatementRow[]> {
    this.ensureKey();

    const payload = await fetchJson<{
      annualReports?: Array<Record<string, string>>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "CASH_FLOW",
        symbol,
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    return (payload.annualReports ?? []).slice(0, 5).map((row) => {
      const operatingCashFlow = safeNumber(row.operatingCashflow);
      const capitalExpenditure = safeNumber(row.capitalExpenditures);

      return {
        fiscalDate: row.fiscalDateEnding,
        operatingCashFlow,
        capitalExpenditure,
        freeCashFlow:
          operatingCashFlow !== null && capitalExpenditure !== null
            ? operatingCashFlow - capitalExpenditure
            : null
      };
    });
  }

  async getNews(symbol: string): Promise<NewsArticle[]> {
    this.ensureKey();

    const payload = await fetchJson<{
      feed?: Array<Record<string, unknown>>;
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    }>(
      buildUrl({
        function: "NEWS_SENTIMENT",
        tickers: symbol,
        sort: "RELEVANCE",
        limit: "12",
        apikey: this.apiKey
      })
    );

    ensureUsableResponse(payload);

    return (payload.feed ?? []).map((item, index) => {
      const sentimentScore = safeNumber(item.overall_sentiment_score);

      return {
        id: `${symbol}-${index}-${String(item.url ?? "")}`,
        headline: String(item.title ?? `${symbol} market update`),
        summary: String(item.summary ?? ""),
        url: String(item.url ?? ""),
        source: String(item.source ?? "Alpha Vantage"),
        publishedAt: String(item.time_published ?? new Date().toISOString()),
        sentiment: toSentiment(sentimentScore),
        relevanceScore: round(safeNumber(item.relevance_score) ?? 0.6, 2)
      };
    });
  }

  mapOverviewToProfile(symbol: string, overview: Record<string, string>): CompanyProfile {
    return {
      symbol,
      name: overview.Name ?? symbol,
      exchange: overview.Exchange ?? "--",
      currency: overview.Currency ?? "USD",
      country: overview.Country ?? "--",
      sector: overview.Sector ?? "Default",
      industry: overview.Industry ?? "--",
      description: overview.Description ?? "No business description returned by the provider.",
      marketCap: safeNumber(overview.MarketCapitalization),
      beta: safeNumber(overview.Beta),
      website: overview.OfficialSite || null
    };
  }
}
