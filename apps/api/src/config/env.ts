import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGIN: z.string().default("http://localhost:3000"),
  MARKET_DATA_PROVIDER: z.string().default("alpha_vantage"),
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60_000)
});

export const env = envSchema.parse(process.env);
