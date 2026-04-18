"use client";

import dynamic from "next/dynamic";

import type { DashboardPayload } from "@market-copilot/shared";

import type { IndicatorVisibility } from "./indicator-panel";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-[620px] animate-pulse rounded-3xl bg-white/5" />
});

type StockChartProps = {
  dashboard: DashboardPayload;
  selectedIndicators: IndicatorVisibility;
};

const toDateSeries = (times: number[]) => times.map((time) => new Date(time * 1000).toISOString());

export function StockChart({ dashboard, selectedIndicators }: StockChartProps) {
  const x = toDateSeries(dashboard.candles.map((candle) => candle.time));
  const candleTrace = {
    type: "candlestick",
    x,
    open: dashboard.candles.map((candle) => candle.open),
    high: dashboard.candles.map((candle) => candle.high),
    low: dashboard.candles.map((candle) => candle.low),
    close: dashboard.candles.map((candle) => candle.close),
    name: dashboard.symbol,
    increasing: {
      line: {
        color: "#2dd4bf"
      }
    },
    decreasing: {
      line: {
        color: "#fb7185"
      }
    },
    xaxis: "x",
    yaxis: "y",
    hoverlabel: {
      bgcolor: "#06111f"
    }
  };

  const overlayTraces = [];

  if (selectedIndicators.volume) {
    overlayTraces.push({
      type: "bar",
      x,
      y: dashboard.candles.map((candle) => candle.volume),
      name: "Volume",
      marker: {
        color: "rgba(56, 189, 248, 0.18)"
      },
      xaxis: "x",
      yaxis: "y2",
      hoverinfo: "skip"
    });
  }

  if (selectedIndicators.sma20) {
    overlayTraces.push({
      type: "scatter",
      mode: "lines",
      x: toDateSeries(dashboard.indicators.sma20.map((point) => point.time)),
      y: dashboard.indicators.sma20.map((point) => point.value),
      name: "SMA 20",
      line: { color: "#38bdf8", width: 1.8 },
      xaxis: "x",
      yaxis: "y"
    });
  }

  if (selectedIndicators.sma50) {
    overlayTraces.push({
      type: "scatter",
      mode: "lines",
      x: toDateSeries(dashboard.indicators.sma50.map((point) => point.time)),
      y: dashboard.indicators.sma50.map((point) => point.value),
      name: "SMA 50",
      line: { color: "#f59e0b", width: 1.8 },
      xaxis: "x",
      yaxis: "y"
    });
  }

  if (selectedIndicators.ema20) {
    overlayTraces.push({
      type: "scatter",
      mode: "lines",
      x: toDateSeries(dashboard.indicators.ema20.map((point) => point.time)),
      y: dashboard.indicators.ema20.map((point) => point.value),
      name: "EMA 20",
      line: { color: "#c084fc", width: 1.6, dash: "dot" },
      xaxis: "x",
      yaxis: "y"
    });
  }

  if (selectedIndicators.bollinger) {
    overlayTraces.push(
      {
        type: "scatter",
        mode: "lines",
        x: toDateSeries(dashboard.indicators.bollinger.map((point) => point.time)),
        y: dashboard.indicators.bollinger.map((point) => point.upper),
        name: "Bollinger Upper",
        line: { color: "rgba(147, 197, 253, 0.7)", width: 1 },
        xaxis: "x",
        yaxis: "y"
      },
      {
        type: "scatter",
        mode: "lines",
        x: toDateSeries(dashboard.indicators.bollinger.map((point) => point.time)),
        y: dashboard.indicators.bollinger.map((point) => point.middle),
        name: "Bollinger Mid",
        line: { color: "rgba(148, 163, 184, 0.6)", width: 1, dash: "dot" },
        xaxis: "x",
        yaxis: "y"
      },
      {
        type: "scatter",
        mode: "lines",
        x: toDateSeries(dashboard.indicators.bollinger.map((point) => point.time)),
        y: dashboard.indicators.bollinger.map((point) => point.lower),
        name: "Bollinger Lower",
        line: { color: "rgba(147, 197, 253, 0.7)", width: 1 },
        xaxis: "x",
        yaxis: "y"
      }
    );
  }

  if (selectedIndicators.vwap) {
    overlayTraces.push({
      type: "scatter",
      mode: "lines",
      x: toDateSeries(dashboard.indicators.vwap.map((point) => point.time)),
      y: dashboard.indicators.vwap.map((point) => point.value),
      name: "VWAP",
      line: { color: "#f97316", width: 1.6 },
      xaxis: "x",
      yaxis: "y"
    });
  }

  const oscillatorTraces = [];

  if (selectedIndicators.rsi) {
    oscillatorTraces.push({
      type: "scatter",
      mode: "lines",
      x: toDateSeries(dashboard.indicators.rsi14.map((point) => point.time)),
      y: dashboard.indicators.rsi14.map((point) => point.value),
      name: "RSI 14",
      line: { color: "#2dd4bf", width: 2 },
      xaxis: "x2",
      yaxis: "y3"
    });
  }

  if (selectedIndicators.stochastic) {
    oscillatorTraces.push(
      {
        type: "scatter",
        mode: "lines",
        x: toDateSeries(dashboard.indicators.stochastic.map((point) => point.time)),
        y: dashboard.indicators.stochastic.map((point) => point.k),
        name: "Stoch %K",
        line: { color: "#38bdf8", width: 1.8 },
        xaxis: "x2",
        yaxis: "y3"
      },
      {
        type: "scatter",
        mode: "lines",
        x: toDateSeries(dashboard.indicators.stochastic.map((point) => point.time)),
        y: dashboard.indicators.stochastic.map((point) => point.d),
        name: "Stoch %D",
        line: { color: "#fbbf24", width: 1.4, dash: "dot" },
        xaxis: "x2",
        yaxis: "y3"
      }
    );
  }

  const macdTraces = selectedIndicators.macd
    ? [
        {
          type: "bar",
          x: toDateSeries(dashboard.indicators.macd.map((point) => point.time)),
          y: dashboard.indicators.macd.map((point) => point.histogram),
          name: "Histogram",
          marker: {
            color: dashboard.indicators.macd.map((point) =>
              point.histogram >= 0 ? "rgba(45, 212, 191, 0.55)" : "rgba(251, 113, 133, 0.55)"
            )
          },
          xaxis: "x3",
          yaxis: "y4"
        },
        {
          type: "scatter",
          mode: "lines",
          x: toDateSeries(dashboard.indicators.macd.map((point) => point.time)),
          y: dashboard.indicators.macd.map((point) => point.macd),
          name: "MACD",
          line: { color: "#38bdf8", width: 1.8 },
          xaxis: "x3",
          yaxis: "y4"
        },
        {
          type: "scatter",
          mode: "lines",
          x: toDateSeries(dashboard.indicators.macd.map((point) => point.time)),
          y: dashboard.indicators.macd.map((point) => point.signal),
          name: "Signal",
          line: { color: "#fbbf24", width: 1.6, dash: "dot" },
          xaxis: "x3",
          yaxis: "y4"
        }
      ]
    : [];

  return (
    <section className="panel animate-rise p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-title">Chart lab</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Price action + technical overlays</h2>
        </div>
        <div className="max-w-md text-xs leading-5 text-slate-400">
          Plotly is used here intentionally because its modebar includes line and rectangle drawing tools, which gives
          us trend-line and support/resistance annotations without shipping a fragile custom drawing layer.
        </div>
      </div>

      <Plot
        data={[candleTrace, ...overlayTraces, ...oscillatorTraces, ...macdTraces]}
        layout={{
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          dragmode: "zoom",
          margin: { t: 10, r: 40, b: 24, l: 50 },
          legend: {
            orientation: "h",
            yanchor: "bottom",
            y: 1.03,
            x: 0,
            font: {
              color: "#cbd5e1"
            }
          },
          xaxis: {
            domain: [0, 1],
            anchor: "y",
            rangeslider: { visible: false },
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            zeroline: false,
            tickfont: { color: "#94a3b8" }
          },
          yaxis: {
            domain: [0.45, 1],
            title: "Price",
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            zeroline: false,
            tickfont: { color: "#cbd5e1" },
            titlefont: { color: "#94a3b8" }
          },
          yaxis2: {
            overlaying: "y",
            side: "right",
            showgrid: false,
            showticklabels: false,
            rangemode: "tozero"
          },
          xaxis2: {
            domain: [0, 1],
            anchor: "y3",
            matches: "x",
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.06)",
            tickfont: { color: "#94a3b8" }
          },
          yaxis3: {
            domain: [0.2, 0.38],
            title: "RSI / Stoch",
            range: [0, 100],
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            zeroline: false,
            tickfont: { color: "#cbd5e1" },
            titlefont: { color: "#94a3b8" }
          },
          xaxis3: {
            domain: [0, 1],
            anchor: "y4",
            matches: "x",
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.06)",
            tickfont: { color: "#94a3b8" }
          },
          yaxis4: {
            domain: [0, 0.14],
            title: "MACD",
            showgrid: true,
            gridcolor: "rgba(148, 163, 184, 0.08)",
            zeroline: true,
            zerolinecolor: "rgba(148, 163, 184, 0.18)",
            tickfont: { color: "#cbd5e1" },
            titlefont: { color: "#94a3b8" }
          },
          shapes: [
            {
              type: "line",
              xref: "paper",
              x0: 0,
              x1: 1,
              yref: "y3",
              y0: 70,
              y1: 70,
              line: { color: "rgba(251, 113, 133, 0.25)", dash: "dash" }
            },
            {
              type: "line",
              xref: "paper",
              x0: 0,
              x1: 1,
              yref: "y3",
              y0: 30,
              y1: 30,
              line: { color: "rgba(45, 212, 191, 0.25)", dash: "dash" }
            }
          ],
          font: {
            family: "IBM Plex Sans, sans-serif",
            color: "#cbd5e1"
          }
        }}
        config={{
          responsive: true,
          displaylogo: false,
          modeBarButtonsToAdd: ["drawline", "drawrect", "eraseshape"],
          modeBarButtonsToRemove: ["lasso2d", "select2d", "autoscale"],
          scrollZoom: true
        }}
        useResizeHandler
        style={{ width: "100%", height: "620px" }}
      />
    </section>
  );
}
