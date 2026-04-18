import type {
  BollingerPoint,
  Candle,
  LineSeriesPoint,
  MacdPoint,
  StochasticPoint,
  TechnicalIndicatorSet
} from "./types.js";
import { average, round } from "./utils.js";

const toLinePoint = (time: number, value: number): LineSeriesPoint => ({
  time,
  value: round(value, 4)
});

export const calculateSMA = (candles: Candle[], period: number): LineSeriesPoint[] => {
  if (candles.length < period) return [];

  const series: LineSeriesPoint[] = [];

  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1).map((candle) => candle.close);
    series.push(toLinePoint(candles[index].time, average(slice)));
  }

  return series;
};

export const calculateEMA = (candles: Candle[], period: number): LineSeriesPoint[] => {
  if (candles.length < period) return [];

  const multiplier = 2 / (period + 1);
  const seed = average(candles.slice(0, period).map((candle) => candle.close));
  const series: LineSeriesPoint[] = [toLinePoint(candles[period - 1].time, seed)];

  let previous = seed;
  for (let index = period; index < candles.length; index += 1) {
    const value = candles[index].close * multiplier + previous * (1 - multiplier);
    series.push(toLinePoint(candles[index].time, value));
    previous = value;
  }

  return series;
};

export const calculateMACD = (
  candles: Candle[],
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9
): MacdPoint[] => {
  if (candles.length < longPeriod + signalPeriod) return [];

  const shortEma = calculateEMA(candles, shortPeriod);
  const longEma = calculateEMA(candles, longPeriod);
  const longMap = new Map(longEma.map((point) => [point.time, point.value]));

  const macdLine = shortEma
    .filter((point) => longMap.has(point.time))
    .map((point) => ({
      time: point.time,
      value: point.value - (longMap.get(point.time) ?? 0)
    }));

  if (macdLine.length < signalPeriod) return [];

  const multiplier = 2 / (signalPeriod + 1);
  let signal = average(macdLine.slice(0, signalPeriod).map((point) => point.value));

  const series: MacdPoint[] = [];
  for (let index = signalPeriod - 1; index < macdLine.length; index += 1) {
    if (index === signalPeriod - 1) {
      series.push({
        time: macdLine[index].time,
        macd: round(macdLine[index].value, 4),
        signal: round(signal, 4),
        histogram: round(macdLine[index].value - signal, 4)
      });
      continue;
    }

    signal = macdLine[index].value * multiplier + signal * (1 - multiplier);
    series.push({
      time: macdLine[index].time,
      macd: round(macdLine[index].value, 4),
      signal: round(signal, 4),
      histogram: round(macdLine[index].value - signal, 4)
    });
  }

  return series;
};

export const calculateRSI = (candles: Candle[], period = 14): LineSeriesPoint[] => {
  if (candles.length <= period) return [];

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    gains += Math.max(change, 0);
    losses += Math.abs(Math.min(change, 0));
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  const series: LineSeriesPoint[] = [];

  for (let index = period; index < candles.length; index += 1) {
    if (index > period) {
      const change = candles[index].close - candles[index - 1].close;
      averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
      averageLoss = (averageLoss * (period - 1) + Math.abs(Math.min(change, 0))) / period;
    }

    const relativeStrength = averageLoss === 0 ? 100 : averageGain / averageLoss;
    const rsi = 100 - 100 / (1 + relativeStrength);
    series.push(toLinePoint(candles[index].time, rsi));
  }

  return series;
};

export const calculateStochastic = (
  candles: Candle[],
  lookback = 14,
  smooth = 3
): StochasticPoint[] => {
  if (candles.length < lookback + smooth) return [];

  const kValues: LineSeriesPoint[] = [];
  for (let index = lookback - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - lookback + 1, index + 1);
    const lowestLow = Math.min(...slice.map((candle) => candle.low));
    const highestHigh = Math.max(...slice.map((candle) => candle.high));
    const currentClose = candles[index].close;
    const range = highestHigh - lowestLow || 1;
    const k = ((currentClose - lowestLow) / range) * 100;

    kValues.push(toLinePoint(candles[index].time, k));
  }

  const series: StochasticPoint[] = [];
  for (let index = smooth - 1; index < kValues.length; index += 1) {
    const slice = kValues.slice(index - smooth + 1, index + 1);
    const d = average(slice.map((point) => point.value));
    series.push({
      time: kValues[index].time,
      k: kValues[index].value,
      d: round(d, 4)
    });
  }

  return series;
};

export const calculateBollingerBands = (
  candles: Candle[],
  period = 20,
  multiplier = 2
): BollingerPoint[] => {
  if (candles.length < period) return [];

  const series: BollingerPoint[] = [];
  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1).map((candle) => candle.close);
    const middle = average(slice);
    const variance = average(slice.map((value) => (value - middle) ** 2));
    const deviation = Math.sqrt(variance);
    series.push({
      time: candles[index].time,
      upper: round(middle + deviation * multiplier, 4),
      middle: round(middle, 4),
      lower: round(middle - deviation * multiplier, 4)
    });
  }

  return series;
};

export const calculateVWAP = (candles: Candle[]): LineSeriesPoint[] => {
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;

  return candles.map((candle) => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativePriceVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    return toLinePoint(candle.time, cumulativePriceVolume / (cumulativeVolume || 1));
  });
};

export const calculateTechnicalIndicatorSet = (candles: Candle[]): TechnicalIndicatorSet => ({
  sma20: calculateSMA(candles, 20),
  sma50: calculateSMA(candles, 50),
  ema20: calculateEMA(candles, 20),
  macd: calculateMACD(candles),
  rsi14: calculateRSI(candles, 14),
  stochastic: calculateStochastic(candles, 14, 3),
  bollinger: calculateBollingerBands(candles, 20, 2),
  vwap: calculateVWAP(candles)
});
