"use client";

import dynamic from "next/dynamic";

import type { ComparisonSeries } from "@market-copilot/shared";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-3xl bg-white/5" />
});

type RelativePerformanceChartProps = {
  comparison: ComparisonSeries[];
};

const palette = ["#38bdf8", "#2dd4bf", "#fbbf24", "#fb7185", "#c084fc"];

export function RelativePerformanceChart({ comparison }: RelativePerformanceChartProps) {
  if (!comparison.length) {
    return (
      <section className="panel p-5">
        <p className="section-title">Relative performance</p>
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-sm text-slate-400">
          Add one or more comparison tickers to map relative performance against the primary symbol.
        </div>
      </section>
    );
  }

  return (
    <section className="panel animate-rise p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-title">Relative performance</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Peer comparison</h3>
        </div>
      </div>

      <Plot
        data={comparison.map((series, index) => ({
          type: "scatter",
          mode: "lines",
          name: `${series.symbol} (${series.changePercent >= 0 ? "+" : ""}${series.changePercent.toFixed(2)}%)`,
          x: series.normalized.map((point) => new Date(point.time * 1000).toISOString()),
          y: series.normalized.map((point) => point.value),
          line: {
            color: palette[index % palette.length],
            width: 2
          }
        }))}
        layout={{
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          margin: { t: 10, r: 20, b: 20, l: 50 },
          legend: {
            orientation: "h",
            yanchor: "bottom",
            y: 1.02,
            x: 0,
            font: {
              color: "#cbd5e1"
            }
          },
          xaxis: {
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            tickfont: { color: "#94a3b8" }
          },
          yaxis: {
            title: "% vs start",
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            zerolinecolor: "rgba(148, 163, 184, 0.2)",
            tickfont: { color: "#cbd5e1" }
          },
          font: {
            family: "IBM Plex Sans, sans-serif",
            color: "#cbd5e1"
          }
        }}
        config={{
          responsive: true,
          displaylogo: false
        }}
        useResizeHandler
        style={{ width: "100%", height: "280px" }}
      />
    </section>
  );
}
