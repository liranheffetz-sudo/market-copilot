import type {
  AIInsight,
  DashboardPayload,
  KeyMetrics,
  SentimentSummary,
  TechnicalIndicatorSet,
  ValuationSummary
} from "@market-copilot/shared";
import { latestValue } from "@market-copilot/shared";

import { env } from "../config/env.js";

const DISCLAIMER =
  "AI-generated analysis is for research and education only and should not be treated as financial advice.";

const buildHeuristicInsight = (
  payload: Pick<DashboardPayload, "profile" | "quote" | "indicators" | "fundamentals" | "news" | "sentiment">
): AIInsight => {
  const latestPrice = payload.quote.price;
  const { keyMetrics, valuation } = payload.fundamentals;
  const score = scoreBias(latestPrice, payload.indicators, keyMetrics, valuation, payload.sentiment);

  const bias: AIInsight["bias"] = score >= 2 ? "Bullish" : score <= -2 ? "Bearish" : "Neutral";

  const reasoning = [
    describeTrend(latestPrice, payload.indicators),
    describeFundamentals(keyMetrics, payload.fundamentals.valuation),
    describeSentiment(payload.sentiment)
  ];

  const risks = [
    keyMetrics.debtToEquity !== null && keyMetrics.debtToEquity > payload.fundamentals.sectorBenchmark.debtToEquity
      ? "Leverage is elevated versus the sector benchmark."
      : "Macro or sector-wide repricing could invalidate the current setup.",
    payload.sentiment.label === "negative"
      ? "Recent news flow is leaning negative and could pressure sentiment."
      : "The narrative is constructive, but headline volatility remains a near-term risk.",
    valuation.upsidePercent !== null && valuation.upsidePercent < 0
      ? "The intrinsic value model suggests limited margin of safety."
      : "Valuation confidence is still low because the model is intentionally simple."
  ];

  const catalysts = [
    payload.news[0]?.headline ? `Watch: ${payload.news[0].headline}` : "Watch the next earnings catalyst.",
    latestValue(payload.indicators.macd.map((point) => ({ time: point.time, value: point.histogram }))) &&
    (latestValue(payload.indicators.macd.map((point) => ({ time: point.time, value: point.histogram }))) ?? 0) > 0
      ? "Momentum remains supportive while the MACD histogram stays above zero."
      : "A momentum reversal would be more convincing if MACD turns positive.",
    keyMetrics.revenueGrowth !== null
      ? `Revenue growth is tracking at ${keyMetrics.revenueGrowth.toFixed(1)}% and will matter in the next report.`
      : "Monitor the next fundamentals update for clearer growth direction."
  ];

  return {
    bias,
    summary: `${payload.profile.name} currently screens ${bias.toLowerCase()} on a blended view of trend, fundamentals, valuation, and news sentiment.`,
    reasoning,
    risks,
    catalysts,
    disclaimer: DISCLAIMER,
    generatedBy: "rules-engine"
  };
};

const scoreBias = (
  latestPrice: number,
  indicators: TechnicalIndicatorSet,
  keyMetrics: KeyMetrics,
  valuation: ValuationSummary,
  sentiment: SentimentSummary
) => {
  let score = 0;

  const sma20 = latestValue(indicators.sma20);
  const sma50 = latestValue(indicators.sma50);
  const rsi = latestValue(indicators.rsi14);
  const macdHistogram = latestValue(indicators.macd.map((point) => ({ time: point.time, value: point.histogram })));

  if (sma20 !== null && latestPrice > sma20) score += 1;
  if (sma20 !== null && sma50 !== null && sma20 > sma50) score += 1;
  if (macdHistogram !== null && macdHistogram > 0) score += 1;
  if (rsi !== null && rsi > 45 && rsi < 70) score += 1;
  if (rsi !== null && rsi < 35) score -= 1;
  if ((keyMetrics.revenueGrowth ?? 0) > 8) score += 1;
  if ((keyMetrics.roe ?? 0) > 15) score += 1;
  if ((keyMetrics.debtToEquity ?? 0) > 1.5) score -= 1;
  if ((valuation.upsidePercent ?? 0) > 10) score += 1;
  if ((valuation.upsidePercent ?? 0) < -10) score -= 1;
  if (sentiment.label === "positive") score += 1;
  if (sentiment.label === "negative") score -= 1;

  return score;
};

const describeTrend = (price: number, indicators: TechnicalIndicatorSet) => {
  const sma20 = latestValue(indicators.sma20);
  const sma50 = latestValue(indicators.sma50);
  const rsi = latestValue(indicators.rsi14);
  const macdHistogram = latestValue(indicators.macd.map((point) => ({ time: point.time, value: point.histogram })));

  return `Technicals show price ${sma20 && price > sma20 ? "above" : "around or below"} the 20-period average, ${
    sma20 && sma50 && sma20 > sma50 ? "with short-term trend leading the medium-term average" : "without a clear short-over-medium trend advantage"
  }. RSI is ${rsi?.toFixed(1) ?? "n/a"} and MACD histogram is ${
    macdHistogram !== null ? macdHistogram.toFixed(2) : "n/a"
  }.`;
};

const describeFundamentals = (metrics: KeyMetrics, valuation: ValuationSummary) =>
  `Fundamentals show ${metrics.revenueGrowth !== null ? `${metrics.revenueGrowth.toFixed(1)}% revenue growth` : "unknown revenue growth"}, ${
    metrics.roe !== null ? `${metrics.roe.toFixed(1)}% ROE` : "no ROE data"
  }, and ${metrics.debtToEquity !== null ? metrics.debtToEquity.toFixed(2) : "n/a"} debt-to-equity. ${
    valuation.upsidePercent !== null
      ? `The intrinsic value estimator implies ${valuation.upsidePercent.toFixed(1)}% upside versus spot.`
      : "The intrinsic value estimator is inconclusive."
  }`;

const describeSentiment = (sentiment: SentimentSummary) =>
  `News sentiment is ${sentiment.label} with ${sentiment.positiveCount} positive, ${sentiment.neutralCount} neutral, and ${sentiment.negativeCount} negative headlines in the current feed.`;

const parseAiInsight = (raw: string): AIInsight | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<AIInsight>;
    if (!parsed.summary || !parsed.bias || !parsed.reasoning || !parsed.risks || !parsed.catalysts) {
      return null;
    }

    return {
      bias: parsed.bias,
      summary: parsed.summary,
      reasoning: parsed.reasoning,
      risks: parsed.risks,
      catalysts: parsed.catalysts,
      disclaimer: DISCLAIMER,
      generatedBy: "openai"
    };
  } catch {
    return null;
  }
};

export const generateAIInsight = async (
  payload: Pick<DashboardPayload, "profile" | "quote" | "indicators" | "fundamentals" | "news" | "sentiment">
) => {
  const fallback = buildHeuristicInsight(payload);

  if (!env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const prompt = {
      system:
        "You are an equity research copilot. Output strict JSON with keys bias, summary, reasoning, risks, catalysts. Keep bias as Bullish, Bearish, or Neutral. Do not give financial advice.",
      input: {
        company: payload.profile,
        quote: payload.quote,
        keyMetrics: payload.fundamentals.keyMetrics,
        valuation: payload.fundamentals.valuation,
        sectorComparison: payload.fundamentals.comparison,
        sentiment: payload.sentiment,
        news: payload.news.slice(0, 6),
        technicalSnapshot: {
          sma20: latestValue(payload.indicators.sma20),
          sma50: latestValue(payload.indicators.sma50),
          rsi14: latestValue(payload.indicators.rsi14),
          macdHistogram: latestValue(
            payload.indicators.macd.map((point) => ({ time: point.time, value: point.histogram }))
          )
        }
      }
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        response_format: {
          type: "json_object"
        },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: JSON.stringify(prompt.input) }
        ],
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallback;
    }

    return parseAiInsight(content) ?? fallback;
  } catch {
    return fallback;
  }
};
