import type { DashboardPayload, FinancialStatementRow } from "@market-copilot/shared";

import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";

type FundamentalsPanelProps = {
  dashboard: DashboardPayload;
};

const metricCardClass = "panel-muted p-4";

const statementValue = (value: number | null | undefined) =>
  value === null || value === undefined ? "--" : formatCompactNumber(value);

function StatementTable({
  title,
  columns,
  rows
}: {
  title: string;
  columns: Array<{ key: keyof FinancialStatementRow; label: string }>;
  rows: FinancialStatementRow[];
}) {
  return (
    <div className="panel-muted overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Fiscal Date</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.fiscalDate}`} className="border-t border-white/5">
                <td className="whitespace-nowrap px-4 py-3 text-slate-200">{row.fiscalDate}</td>
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {statementValue(row[column.key] as number | null | undefined)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FundamentalsPanel({ dashboard }: FundamentalsPanelProps) {
  const { keyMetrics, valuation, comparison, statements } = dashboard.fundamentals;

  return (
    <section className="panel animate-rise p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Fundamental analysis</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Financial quality and valuation</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Intrinsic value</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatCurrency(valuation.intrinsicValue, dashboard.profile.currency)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{valuation.method}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">P/E Ratio</p>
          <p className="mt-2 text-lg font-semibold text-white">{keyMetrics.peRatio?.toFixed(2) ?? "--"}</p>
        </div>
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">EPS</p>
          <p className="mt-2 text-lg font-semibold text-white">{keyMetrics.eps?.toFixed(2) ?? "--"}</p>
        </div>
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revenue Growth</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatPercent(keyMetrics.revenueGrowth)}</p>
        </div>
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ROE</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatPercent(keyMetrics.roe)}</p>
        </div>
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debt / Equity</p>
          <p className="mt-2 text-lg font-semibold text-white">{keyMetrics.debtToEquity?.toFixed(2) ?? "--"}</p>
        </div>
        <div className={metricCardClass}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Free Cash Flow</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCompactNumber(keyMetrics.freeCashFlow)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="panel-muted overflow-x-auto">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
            Sector benchmark comparison
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Metric</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Sector</th>
                <th className="px-4 py-3 text-left font-medium">Delta</th>
                <th className="px-4 py-3 text-left font-medium">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((item) => (
                <tr key={item.metric} className="border-t border-white/5">
                  <td className="px-4 py-3 capitalize text-slate-200">{item.metric}</td>
                  <td className="px-4 py-3 text-slate-400">{item.companyValue?.toFixed(2) ?? "--"}</td>
                  <td className="px-4 py-3 text-slate-400">{item.sectorValue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatPercent(item.deltaPercent)}</td>
                  <td className="px-4 py-3 text-slate-400">{item.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-muted p-4">
          <h3 className="text-sm font-semibold text-slate-100">Valuation notes</h3>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated upside</div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatPercent(valuation.upsidePercent)}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              Confidence {valuation.confidence}
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">
            {valuation.notes.map((note) => (
              <li key={note} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <StatementTable
          title="Income Statement"
          rows={statements.incomeStatementAnnual}
          columns={[
            { key: "revenue", label: "Revenue" },
            { key: "grossProfit", label: "Gross Profit" },
            { key: "operatingIncome", label: "Operating Income" },
            { key: "netIncome", label: "Net Income" }
          ]}
        />
        <StatementTable
          title="Balance Sheet"
          rows={statements.balanceSheetAnnual}
          columns={[
            { key: "totalAssets", label: "Total Assets" },
            { key: "totalLiabilities", label: "Total Liabilities" },
            { key: "totalEquity", label: "Total Equity" },
            { key: "cashAndEquivalents", label: "Cash & Equivalents" }
          ]}
        />
        <StatementTable
          title="Cash Flow"
          rows={statements.cashFlowAnnual}
          columns={[
            { key: "operatingCashFlow", label: "Operating Cash Flow" },
            { key: "capitalExpenditure", label: "Capital Expenditure" },
            { key: "freeCashFlow", label: "Free Cash Flow" }
          ]}
        />
      </div>
    </section>
  );
}
