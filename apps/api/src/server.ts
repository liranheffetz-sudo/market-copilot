import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { stockRoutes } from "./routes/stocks.js";

export const buildServer = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: env.ALLOWED_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true
  });

  app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW
  });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  app.register(
    async (instance) => {
      instance.register(stockRoutes);
    },
    {
      prefix: "/api/stocks"
    }
  );

  return app;
};
