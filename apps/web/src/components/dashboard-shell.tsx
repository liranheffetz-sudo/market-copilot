"use client";

import type { DashboardPayload, SupportedInterval } from "@market-copilot/shared";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { fetchDashboard } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

import { AIInsightsPanel } from "./ai-insights-panel";
import { FundamentalsPanel } from "./fundamentals-panel";
import { type IndicatorVisibility, IndicatorPanel } from "./indicator-panel";
import { MarketSummary } from "./market-summary";
import { NewsPanel } from "./news-panel";
import { RelativePerformanceChart } from "./relative-performance-chart";
import { SearchBar } from "./search-bar";
import { StockChart } from "./stock-chart";

const defaultIndicators: IndicatorVisibility = {
  sma20: true,
  sma50: true,
  ema20: false,
  bollinger: true,
  vwap: false,
  rsi: true,
  stochastic: true,
  macd: true,
  volume: true
};

const parseCompareSymbols = (value: string, symbol: string) =>
  value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item !== symbol)
    .slice(0, 4);

export function DashboardShell() {
  const [symbol, setSymbol] = useState("AAPL");
  const [interval, setInterval] = useState<SupportedInterval>("1D");
  const [compareInput, setCompareInput] = useState("MSFT,NVDA");
  const [compareSymbols, setCompareSymbols] = useState<string[]>(["MSFT", "NVDA"]);
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorVisibility>(defaultIndicators);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(["AAPL", "MSFT", "NVDA", "TSLA"]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const requestRef = useRef(0);
  const compareKey = compareSymbols.join(",");

  const loadDashboard = async (
    nextSymbol: string,
    nextInterval: SupportedInterval,
    nextCompare: string[]
  ) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setError(null);
    setIsLoading(true);

    try {
      const payload = await fetchDashboard(nextSymbol, nextInterval, nextCompare);
      if (requestId !== requestRef.current) return;
      setDashboard(payload);
    } catch (loadError) {
      if (requestId !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const storedWatchlist = window.localStorage.getItem("market-copilot.watchlist");
    if (storedWatchlist) {
      try {
        const parsed = JSON.parse(storedWatchlist) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setWatchlist(parsed);
        }
      } catch {
        window.localStorage.removeItem("market-copilot.watchlist");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("market-copilot.watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    void loadDashboard(symbol, interval, compareSymbols);

    const intervalId = window.setInterval(() => {
      void loadDashboard(symbol, interval, compareSymbols);
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [symbol, interval, compareKey, compareSymbols]);

  const handleSelectSymbol = (nextSymbol: string) => {
    startTransition(() => {
      const normalized = nextSymbol.toUpperCase();
      setSymbol(normalized);
      setCompareSymbols((current) => current.filter((item) => item !== normalized));
    });
  };

  const handleApplyCompare = () => {
    startTransition(() => {
      setCompareSymbols(parseCompareSymbols(compareInput, symbol));
    });
  };

  const handleAddToWatchlist = () => {
    setWatchlist((current) => (current.includes(symbol) ? current : [symbol, ...current].slice(0, 10)));
  };

  const sourceLabel =
    dashboard?.meta.source === "demo-fallback" ? "Demo fallback" : dashboard?.meta.source === "alpha-vantage" ? "Alpha Vantage" : "Loading";

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1700px]">
        <section className="panel relative overflow-hidden p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_28%)]" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-title">Market Copilot</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Global equity research with live charts, fundamentals, news, and AI context in one flow.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                  Hybrid experience inspired by charting terminals and AI copilots, built as a standalone full-stack
                  project so it stays isolated from your existing repos.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Auto refresh</div>
                <div className="mt-2 flex items-center gap-2">
                  <RefreshCcw className={`h-4 w-4 ${isLoading || isPending ? "animate-spin text-accent" : "text-slate-500"}`} />
                  {dashboard ? `Last update ${formatDateTime(dashboard.meta.fetchedAt)}` : "Loading first snapshot"}
                </div>
              </div>
            </div>

            <SearchBar activeSymbol={symbol} onSelect={handleSelectSymbol} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <IndicatorPanel
            symbol={symbol}
            interval={interval}
            compareInput={compareInput}
            setCompareInput={setCompareInput}
            onApplyCompare={handleApplyCompare}
            onSelectInterval={(nextInterval) => {
              startTransition(() => {
                setInterval(nextInterval);
              });
            }}
            selectedIndicators={selectedIndicators}
            onToggleIndicator={(indicator) => {
              setSelectedIndicators((current) => ({
                ...current,
                [indicator]: !current[indicator]
              }));
            }}
            watchlist={watchlist}
            onSelectWatchlist={handleSelectSymbol}
            onAddToWatchlist={handleAddToWatchlist}
            sourceLabel={sourceLabel}
            usingFallback={dashboard?.meta.usedFallbackData ?? false}
          />

          <div className="flex min-w-0 flex-col gap-6">
            {error ? (
              <section className="panel p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-rose" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Unable to load market data</h2>
                    <p className="mt-2 text-sm text-slate-400">{error}</p>
                    <button
                      className="mt-4 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                      onClick={() => void loadDashboard(symbol, interval, compareSymbols)}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {dashboard ? (
              <>
                <MarketSummary dashboard={dashboard} />
                <StockChart dashboard={dashboard} selectedIndicators={selectedIndicators} />
                <RelativePerformanceChart comparison={dashboard.comparison} />
              </>
            ) : (
              <div className="panel h-[980px] animate-pulse bg-white/5" />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {dashboard ? (
              <>
                <AIInsightsPanel dashboard={dashboard} />
                <NewsPanel dashboard={dashboard} />
              </>
            ) : (
              <>
                <div className="panel h-[460px] animate-pulse bg-white/5" />
                <div className="panel h-[560px] animate-pulse bg-white/5" />
              </>
            )}
          </div>

          <div className="xl:col-span-3">
            {dashboard ? <FundamentalsPanel dashboard={dashboard} /> : <div className="panel h-[760px] animate-pulse bg-white/5" />}
          </div>
        </div>
      </div>
    </main>
  );
}
