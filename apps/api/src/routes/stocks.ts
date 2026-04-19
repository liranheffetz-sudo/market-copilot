const BASE_URL = "https://finnhub.io/api/v1"

function getApiKey() {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error("FINNHUB_API_KEY missing")
  return key
}

async function fetchFinnhub(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  const API_KEY = getApiKey()

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.append(k, v)
  })

  url.searchParams.append("token", API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Finnhub error ${res.status}: ${text}`)
  }

  return res.json()
}

//
// 🔍 SEARCH
//
export async function searchStocks(query) {
  const data = await fetchFinnhub("/search", { q: query })

  return {
    results: (data.result || []).map((item) => ({
      symbol: item.symbol,
      name: item.description
    })),
    usedFallback: false
  }
}

//
// 📊 DASHBOARD (price snapshot)
//
export async function getDashboard(symbol) {
  const quote = await fetchFinnhub("/quote", { symbol })

  return {
    symbol,
    price: quote.c,
    change: quote.d,
    percentChange: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    prevClose: quote.pc
  }
}

//
// 📈 CHART (candles)
//
export async function getChartSnapshot(symbol, interval) {
  const now = Math.floor(Date.now() / 1000)
  const from = now - 60 * 60 * 24 * 30 // last 30 days

  const resolutionMap = {
    "1m": "1",
    "5m": "5",
    "1h": "60",
    "1D": "D",
    "1W": "W"
  }

  const data = await fetchFinnhub("/stock/candle", {
    symbol,
    resolution: resolutionMap[interval] || "D",
    from,
    to: now
  })

  return {
    symbol,
    candles: data
  }
}

//
// 📉 FUNDAMENTALS
//
export async function getFundamentalsSnapshot(symbol) {
  const profile = await fetchFinnhub("/stock/profile2", { symbol })
  const metrics = await fetchFinnhub("/stock/metric", {
    symbol,
    metric: "all"
  })

  return {
    symbol,
    name: profile.name,
    industry: profile.finnhubIndustry,
    marketCap: profile.marketCapitalization,
    metrics: metrics.metric
  }
}

//
// 📰 NEWS
//
export async function getNewsSnapshot(symbol) {
  const to = new Date().toISOString().split("T")[0]
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]

  const news = await fetchFinnhub("/company-news", {
    symbol,
    from,
    to
  })

  return {
    symbol,
    news: news.slice(0, 10).map((n) => ({
      headline: n.headline,
      summary: n.summary,
      url: n.url,
      source: n.source,
      datetime: n.datetime
    }))
  }
}

//
// 🤖 AI INSIGHT (simple placeholder)
//
export async function getAiSnapshot(symbol) {
  const quote = await fetchFinnhub("/quote", { symbol })

  let bias = "neutral"
  if (quote.dp > 2) bias = "bullish"
  if (quote.dp < -2) bias = "bearish"

  return {
    symbol,
    bias,
    change: quote.dp,
    summary: `Stock is currently ${bias} with ${quote.dp}% movement today`
  }
import type { FastifyPluginAsync } from "fastify";

export const stockRoutes: FastifyPluginAsync = async (app) => {

  app.get("/search", async (req, reply) => {

    const { q } = req.query as any;

    return reply.send(await searchStocks(q));

  });

  app.get("/:symbol/dashboard", async (req, reply) => {

    const { symbol } = req.params as any;

    return reply.send(await getDashboard(symbol));

  });

  app.get("/:symbol/chart", async (req, reply) => {

    const { symbol } = req.params as any;

    return reply.send(await getChartSnapshot(symbol, "1D"));

  });

  app.get("/:symbol/fundamentals", async (req, reply) => {

    const { symbol } = req.params as any;

    return reply.send(await getFundamentalsSnapshot(symbol));

  });

  app.get("/:symbol/news", async (req, reply) => {

    const { symbol } = req.params as any;

    return reply.send(await getNewsSnapshot(symbol));

  });

  app.get("/:symbol/insight", async (req, reply) => {

    const { symbol } = req.params as any;

    return reply.send(await getAiSnapshot(symbol));

  });

}
}
