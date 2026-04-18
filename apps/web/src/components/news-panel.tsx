import type { DashboardPayload } from "@market-copilot/shared";

import { formatDateTime } from "@/lib/format";

type NewsPanelProps = {
  dashboard: DashboardPayload;
};

const sentimentStyles = {
  positive: "border-accent/20 bg-accent/10 text-accent",
  neutral: "border-white/10 bg-white/5 text-slate-300",
  negative: "border-rose/20 bg-rose/10 text-rose"
} as const;

export function NewsPanel({ dashboard }: NewsPanelProps) {
  return (
    <section className="panel animate-rise p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-title">News & sentiment</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Headline flow</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-xs text-slate-400">
          <div className="font-medium capitalize text-slate-200">{dashboard.sentiment.label}</div>
          <div>{dashboard.news.length} articles</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {dashboard.news.map((article) => (
          <a
            key={article.id}
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-accent/20 hover:bg-white/10"
            href={article.url}
            rel="noreferrer"
            target="_blank"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${sentimentStyles[article.sentiment]}`}>
                {article.sentiment}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{article.source}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-100">{article.headline}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{article.summary}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{formatDateTime(article.publishedAt)}</span>
              <span>Relevance {article.relevanceScore.toFixed(2)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
