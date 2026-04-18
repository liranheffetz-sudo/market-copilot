import type { KeyMetrics, MetricComparison, SectorBenchmark, ValuationSummary } from "./types.js";
import { round } from "./utils.js";

export const SECTOR_BENCHMARKS: Record<string, SectorBenchmark> = {
  Technology: {
    sector: "Technology",
    peRatio: 29,
    revenueGrowth: 12,
    roe: 18,
    debtToEquity: 0.62
  },
  Healthcare: {
    sector: "Healthcare",
    peRatio: 24,
    revenueGrowth: 8,
    roe: 14,
    debtToEquity: 0.55
  },
  "Financial Services": {
    sector: "Financial Services",
    peRatio: 15,
    revenueGrowth: 6,
    roe: 12,
    debtToEquity: 1.6
  },
  "Consumer Cyclical": {
    sector: "Consumer Cyclical",
    peRatio: 21,
    revenueGrowth: 7,
    roe: 16,
    debtToEquity: 1.1
  },
  Industrials: {
    sector: "Industrials",
    peRatio: 20,
    revenueGrowth: 7,
    roe: 13,
    debtToEquity: 0.94
  },
  Energy: {
    sector: "Energy",
    peRatio: 13,
    revenueGrowth: 4,
    roe: 11,
    debtToEquity: 0.78
  },
  Default: {
    sector: "Market Average",
    peRatio: 20,
    revenueGrowth: 7,
    roe: 12,
    debtToEquity: 0.95
  }
};

export const getSectorBenchmark = (sector: string | null | undefined): SectorBenchmark =>
  (sector && SECTOR_BENCHMARKS[sector]) || SECTOR_BENCHMARKS.Default;

export const buildMetricComparisons = (
  metrics: KeyMetrics,
  sectorBenchmark: SectorBenchmark
): MetricComparison[] => {
  const comparisons: Array<MetricComparison> = [
    {
      metric: "peRatio",
      companyValue: metrics.peRatio,
      sectorValue: sectorBenchmark.peRatio,
      deltaPercent:
        metrics.peRatio === null
          ? null
          : round(((metrics.peRatio - sectorBenchmark.peRatio) / sectorBenchmark.peRatio) * 100, 2),
      interpretation:
        metrics.peRatio === null
          ? "Unavailable"
          : metrics.peRatio < sectorBenchmark.peRatio
            ? "Trading below the sector P/E average"
            : "Trading above the sector P/E average"
    },
    {
      metric: "revenueGrowth",
      companyValue: metrics.revenueGrowth,
      sectorValue: sectorBenchmark.revenueGrowth,
      deltaPercent:
        metrics.revenueGrowth === null
          ? null
          : round(
              ((metrics.revenueGrowth - sectorBenchmark.revenueGrowth) / sectorBenchmark.revenueGrowth) *
                100,
              2
            ),
      interpretation:
        metrics.revenueGrowth === null
          ? "Unavailable"
          : metrics.revenueGrowth > sectorBenchmark.revenueGrowth
            ? "Growing faster than the sector"
            : "Growing slower than the sector"
    },
    {
      metric: "roe",
      companyValue: metrics.roe,
      sectorValue: sectorBenchmark.roe,
      deltaPercent:
        metrics.roe === null
          ? null
          : round(((metrics.roe - sectorBenchmark.roe) / sectorBenchmark.roe) * 100, 2),
      interpretation:
        metrics.roe === null
          ? "Unavailable"
          : metrics.roe > sectorBenchmark.roe
            ? "Generating stronger returns on equity than peers"
            : "Generating weaker returns on equity than peers"
    },
    {
      metric: "debtToEquity",
      companyValue: metrics.debtToEquity,
      sectorValue: sectorBenchmark.debtToEquity,
      deltaPercent:
        metrics.debtToEquity === null
          ? null
          : round(
              ((metrics.debtToEquity - sectorBenchmark.debtToEquity) / sectorBenchmark.debtToEquity) *
                100,
              2
            ),
      interpretation:
        metrics.debtToEquity === null
          ? "Unavailable"
          : metrics.debtToEquity < sectorBenchmark.debtToEquity
            ? "Using less leverage than the sector"
            : "Using more leverage than the sector"
    }
  ];

  return comparisons;
};

export const estimateIntrinsicValue = (
  metrics: KeyMetrics,
  currentPrice: number,
  sectorBenchmark: SectorBenchmark
): ValuationSummary => {
  const growthRate = Math.min(Math.max(metrics.revenueGrowth ?? sectorBenchmark.revenueGrowth, 2), 18) / 100;
  const discountRate = 0.1;
  const terminalMultiple = Math.max(Math.min(sectorBenchmark.peRatio * 0.85, 24), 10);
  const baseEarnings = metrics.eps ?? null;
  const baseCashFlow = metrics.freeCashFlow ? metrics.freeCashFlow / 1_000_000_000 : null;

  if (baseEarnings === null) {
    return {
      intrinsicValue: null,
      upsidePercent: null,
      method: "Unable to estimate intrinsic value because EPS is unavailable.",
      confidence: "low",
      notes: [
        "Configure a fundamentals provider with richer per-share metrics to improve valuation fidelity."
      ]
    };
  }

  const forwardEarnings = baseEarnings * (1 + growthRate) ** 5;
  const terminalValue = forwardEarnings * terminalMultiple;
  const presentValue = terminalValue / (1 + discountRate) ** 5;
  const cashFlowModifier = baseCashFlow && baseCashFlow > 0 ? 1.05 : 0.95;
  const intrinsicValue = round(presentValue * cashFlowModifier, 2);
  const upsidePercent = round(((intrinsicValue - currentPrice) / currentPrice) * 100, 2);

  return {
    intrinsicValue,
    upsidePercent,
    method: "5-year earnings growth model anchored to sector-adjusted terminal multiple",
    confidence: Math.abs(upsidePercent) < 10 ? "medium" : "low",
    notes: [
      "Uses EPS as the primary driver and nudges the output with free cash flow health.",
      "Intended as a directional estimator, not a standalone valuation model."
    ]
  };
};
