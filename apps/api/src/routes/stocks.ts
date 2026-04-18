import { z } from "zod";

import type { FastifyPluginAsync } from "fastify";

import { getAiSnapshot, getChartSnapshot, getDashboard, getFundamentalsSnapshot, getNewsSnapshot, searchStocks } from "../services/stock-service.js";

const intervalSchema = z.enum(["1m", "5m", "1h", "1D", "1W"]).default("1D");

const querySchema = z.object({
  interval: intervalSchema.optional(),
  compare: z.string().optional()
});

const compareSymbolsFrom = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);

export const stockRoutes: FastifyPluginAsync = async (app) => {
  app.get("/search", async (request, reply) => {
    const searchQuery = z
      .object({
        q: z.string().trim().min(1).max(40)
      })
      .parse(request.query);

    const { results, usedFallback } = await searchStocks(searchQuery.q);
    return reply.send({
      results,
      meta: {
        usedFallback
      }
    });
  });

  app.get("/:symbol/dashboard", async (request, reply) => {
    const params = z.object({ symbol: z.string().trim().min(1).max(16) }).parse(request.params);
    const query = querySchema.parse(request.query);

    const payload = await getDashboard(
      params.symbol.toUpperCase(),
      query.interval ?? "1D",
      compareSymbolsFrom(query.compare).filter((item) => item !== params.symbol.toUpperCase())
    );

    return reply.send(payload);
  });

  app.get("/:symbol/chart", async (request, reply) => {
    const params = z.object({ symbol: z.string().trim().min(1).max(16) }).parse(request.params);
    const query = querySchema.parse(request.query);

    const payload = await getChartSnapshot(
      params.symbol.toUpperCase(),
      query.interval ?? "1D",
      compareSymbolsFrom(query.compare).filter((item) => item !== params.symbol.toUpperCase())
    );

    return reply.send(payload);
  });

  app.get("/:symbol/fundamentals", async (request, reply) => {
    const params = z.object({ symbol: z.string().trim().min(1).max(16) }).parse(request.params);
    const query = querySchema.parse(request.query);

    const payload = await getFundamentalsSnapshot(params.symbol.toUpperCase(), query.interval ?? "1D");
    return reply.send(payload);
  });

  app.get("/:symbol/news", async (request, reply) => {
    const params = z.object({ symbol: z.string().trim().min(1).max(16) }).parse(request.params);
    const query = querySchema.parse(request.query);

    const payload = await getNewsSnapshot(params.symbol.toUpperCase(), query.interval ?? "1D");
    return reply.send(payload);
  });

  app.get("/:symbol/insight", async (request, reply) => {
    const params = z.object({ symbol: z.string().trim().min(1).max(16) }).parse(request.params);
    const query = querySchema.parse(request.query);

    const payload = await getAiSnapshot(params.symbol.toUpperCase(), query.interval ?? "1D");
    return reply.send(payload);
  });
};
