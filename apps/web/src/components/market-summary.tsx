import type { DashboardPayload } from "@market-copilot/shared";

import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";

type MarketSummaryProps = {
  dashboard: DashboardPayload;
};

const cardClass = "panel-muted p-4";

export function MarketSummary({ dashboard }: MarketSummaryProps) {
  const changeClass =
    dashboard.quote.change >= 0 ? "text-accent" : dashboard.quote.change < 0 ? "text-rose" : "text-slate-200";

  return (
    <section className="panel animate-rise p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Market snapshot</p>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{dashboard.profile.symbol}</h1>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {dashboard.profile.exchange}
            </span>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {dashboard.aiInsight.bias}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">{dashboard.profile.name}</p>
        </div>

        <div className="text-left lg:text-right">
          <div className="text-3xl font-semibold text-white">
            {formatCurrency(dashboard.quote.price, dashboard.profile.currency)}
          </div>
          <div className={`mt-1 text-sm font-medium ${changeClass}`}>
            {dashboard.quote.change >= 0 ? "+" : ""}
            {dashboard.quote.change.toFixed(2)} ({formatPercent(dashboard.quote.changePercent)})
          </div>
          <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            {dashboard.meta.usedFallbackData ? "demo/fallback feed" : "live provider"} • {dashboard.interval}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Market Cap</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCompactNumber(dashboard.profile.marketCap)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">P/E</p>
          <p className="mt-2 text-lg font-semibold text-white">{dashboard.fundamentals.keyMetrics.peRatio?.toFixed(2) ?? "--"}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">EPS</p>
          <p className="mt-2 text-lg font-semibold text-white">{dashboard.fundamentals.keyMetrics.eps?.toFixed(2) ?? "--"}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revenue Growth</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatPercent(dashboard.fundamentals.keyMetrics.revenueGrowth)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ROE</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatPercent(dashboard.fundamentals.keyMetrics.roe)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sentiment</p>
          <p className="mt-2 text-lg font-semibold capitalize text-white">{dashboard.sentiment.label}</p>
        </div>
      </div>
    </section>
  );
}
