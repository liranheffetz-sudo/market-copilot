"use client";

import { Activity, Bookmark, CandlestickChart, ChevronRight, RadioTower } from "lucide-react";

import type { SupportedInterval } from "@market-copilot/shared";

type IndicatorVisibility = {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  bollinger: boolean;
  vwap: boolean;
  rsi: boolean;
  stochastic: boolean;
  macd: boolean;
  volume: boolean;
};

type IndicatorPanelProps = {
  symbol: string;
  interval: SupportedInterval;
  compareInput: string;
  setCompareInput: (value: string) => void;
  onApplyCompare: () => void;
  onSelectInterval: (interval: SupportedInterval) => void;
  selectedIndicators: IndicatorVisibility;
  onToggleIndicator: (indicator: keyof IndicatorVisibility) => void;
  watchlist: string[];
  onSelectWatchlist: (symbol: string) => void;
  onAddToWatchlist: () => void;
  sourceLabel: string;
  usingFallback: boolean;
};

const intervals: SupportedInterval[] = ["1m", "5m", "1h", "1D", "1W"];

const indicatorItems: Array<{
  key: keyof IndicatorVisibility;
  label: string;
  description: string;
}> = [
  { key: "sma20", label: "SMA 20", description: "Short trend" },
  { key: "sma50", label: "SMA 50", description: "Intermediate trend" },
  { key: "ema20", label: "EMA 20", description: "Faster moving average" },
  { key: "bollinger", label: "Bollinger Bands", description: "Volatility envelope" },
  { key: "vwap", label: "VWAP", description: "Volume-weighted price" },
  { key: "volume", label: "Volume", description: "Overlay bars on price chart" },
  { key: "rsi", label: "RSI", description: "Momentum oscillator" },
  { key: "stochastic", label: "Stochastic", description: "Overbought/oversold" },
  { key: "macd", label: "MACD", description: "Trend momentum" }
];

export function IndicatorPanel({
  symbol,
  interval,
  compareInput,
  setCompareInput,
  onApplyCompare,
  onSelectInterval,
  selectedIndicators,
  onToggleIndicator,
  watchlist,
  onSelectWatchlist,
  onAddToWatchlist,
  sourceLabel,
  usingFallback
}: IndicatorPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Session</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Trading workspace</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-xs text-slate-400">
            <div className="font-medium text-slate-200">{sourceLabel}</div>
            <div>{usingFallback ? "Fallback mode" : "Live provider"}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {intervals.map((item) => (
            <button
              key={item}
              className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                interval === item
                  ? "bg-accent text-slate-950 shadow-lg shadow-accent/25"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              onClick={() => onSelectInterval(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <CandlestickChart className="h-4 w-4 text-accent" />
            Compare symbols
          </div>
          <p className="mt-2 text-sm text-slate-400">Comma-separate up to 4 peers for relative performance.</p>
          <div className="mt-3 flex gap-2">
            <input
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="MSFT,NVDA,AMZN"
              value={compareInput}
              onChange={(event) => setCompareInput(event.target.value.toUpperCase())}
            />
            <button
              className="rounded-2xl bg-white/10 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/15"
              onClick={onApplyCompare}
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Indicators</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Technical stack</h3>
          </div>
          <Activity className="h-5 w-5 text-sky-300" />
        </div>

        <div className="mt-4 space-y-2">
          {indicatorItems.map((item) => (
            <button
              key={item.key}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                selectedIndicators[item.key]
                  ? "border-accent/30 bg-accent/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => onToggleIndicator(item.key)}
            >
              <div>
                <div className="font-medium text-slate-100">{item.label}</div>
                <div className="mt-1 text-xs text-slate-400">{item.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title">Watchlist</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Pinned tickers</h3>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
            onClick={onAddToWatchlist}
            title={`Add ${symbol} to watchlist`}
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {watchlist.map((item) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                item === symbol
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              onClick={() => onSelectWatchlist(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <RadioTower className="h-4 w-4 text-sky-300" />
          Deployment notes
        </div>
        <ul className="mt-3 space-y-3 text-sm text-slate-400">
          <li>Backend keeps provider keys server-side and exposes a rate-limited REST surface.</li>
          <li>Charts refresh automatically every 60 seconds while keeping the current symbol and timeframe.</li>
          <li>When no market data key is configured, the dashboard switches to deterministic demo data.</li>
        </ul>
      </section>
    </div>
  );
}

export type { IndicatorVisibility };
