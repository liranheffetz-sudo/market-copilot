import type { DashboardPayload, SearchResult, SupportedInterval } from "@market-copilot/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type SearchResponse = {
  results: SearchResult[];
  meta: {
    usedFallback: boolean;
  };
};

export const fetchDashboard = async (
  symbol: string,
  interval: SupportedInterval,
  compareSymbols: string[]
) => {
  const query = new URLSearchParams({
    interval
  });

  if (compareSymbols.length) {
    query.set("compare", compareSymbols.join(","));
  }

  const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/dashboard?${query.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard for ${symbol}`);
  }

  return (await response.json()) as DashboardPayload;
};

export const searchTickers = async (query: string) => {
  const response = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Ticker search failed");
  }

  return (await response.json()) as SearchResponse;
};
