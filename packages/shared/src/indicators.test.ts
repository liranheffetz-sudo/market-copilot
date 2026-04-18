import { describe, expect, it } from "vitest";

import { calculateEMA, calculateRSI, calculateSMA } from "./indicators.js";
import type { Candle } from "./types.js";

const candles: Candle[] = Array.from({ length: 30 }, (_, index) => ({
  time: 1_700_000_000 + index * 86_400,
  open: 100 + index,
  high: 102 + index,
  low: 98 + index,
  close: 101 + index,
  volume: 1_000_000 + index * 1_000
}));

describe("indicator calculations", () => {
  it("computes a simple moving average series", () => {
    const series = calculateSMA(candles, 5);
    expect(series).toHaveLength(26);
    expect(series[0]?.value).toBe(103);
  });

  it("computes an exponential moving average series", () => {
    const series = calculateEMA(candles, 10);
    expect(series.length).toBeGreaterThan(0);
    expect(series[0]?.time).toBe(candles[9]?.time);
  });

  it("keeps RSI within 0-100", () => {
    const series = calculateRSI(candles, 14);
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);
  });
});
