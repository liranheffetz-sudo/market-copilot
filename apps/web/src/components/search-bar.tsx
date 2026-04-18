"use client";

import { Search, Sparkles } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import type { SearchResult } from "@market-copilot/shared";

import { searchTickers } from "@/lib/api";

type SearchBarProps = {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
};

export function SearchBar({ activeSymbol, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState(activeSymbol);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(activeSymbol);
  }, [activeSymbol]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (deferredQuery.trim().length < 1) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await searchTickers(deferredQuery.trim());
        if (!isMounted) return;
        setResults(response.results.slice(0, 8));
      } catch {
        if (!isMounted) return;
        setResults([]);
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void run();
    }, 220);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery]);

  return (
    <div className="relative w-full">
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 transition focus-within:border-accent/70 focus-within:bg-white/10">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          aria-label="Search ticker"
          className="h-full w-full bg-transparent text-base font-medium text-slate-50 outline-none placeholder:text-slate-500"
          placeholder="Search any global ticker..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.trim()) {
              onSelect(query.trim().toUpperCase());
              setIsOpen(false);
            }
          }}
        />
        <div className="hidden items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent md:flex">
          <Sparkles className="h-3.5 w-3.5" />
          AI context-aware
        </div>
      </div>

      {isOpen ? (
        <div className="panel absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 max-h-80 overflow-y-auto p-2 scroll-thin">
          {isSearching ? (
            <div className="rounded-2xl px-4 py-6 text-sm text-slate-400">Searching symbols...</div>
          ) : results.length ? (
            results.map((result) => (
              <button
                key={`${result.symbol}-${result.exchange}`}
                className="flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-white/5"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(result.symbol);
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-semibold text-slate-100">{result.symbol}</div>
                  <div className="mt-1 text-sm text-slate-400">{result.name}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{result.exchange}</div>
                  <div>{result.currency}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl px-4 py-6 text-sm text-slate-400">
              No matches yet. Try a ticker like `AAPL`, `SAP.DE`, or `7203.T`.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
