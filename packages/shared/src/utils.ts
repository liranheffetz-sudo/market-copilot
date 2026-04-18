import type { Candle, LineSeriesPoint, NewsArticle, SentimentSummary } from "./types.js";

export const safeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "" || value === "None") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const latestValue = (series: LineSeriesPoint[]) =>
  series.length ? series[series.length - 1]?.value ?? null : null;

export const summarizeSentiment = (articles: NewsArticle[]): SentimentSummary => {
  if (!articles.length) {
    return {
      averageScore: 0,
      label: "neutral",
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0
    };
  }

  let score = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  for (const article of articles) {
    if (article.sentiment === "positive") {
      score += 1;
      positiveCount += 1;
    } else if (article.sentiment === "negative") {
      score -= 1;
      negativeCount += 1;
    } else {
      neutralCount += 1;
    }
  }

  const averageScore = score / articles.length;
  const label =
    averageScore > 0.15 ? "positive" : averageScore < -0.15 ? "negative" : "neutral";

  return {
    averageScore: round(averageScore, 2),
    label,
    positiveCount,
    neutralCount,
    negativeCount
  };
};

export const normalizePerformanceSeries = (candles: Candle[]) => {
  if (!candles.length) {
    return [];
  }

  const baseline = candles[0]?.close ?? 1;

  return candles.map((candle) => ({
    time: candle.time,
    value: round(((candle.close - baseline) / baseline) * 100, 2)
  }));
};

export const formatCompactNumber = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
};
