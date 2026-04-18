# Market Copilot

Market Copilot is a production-minded stock analysis dashboard built as a standalone monorepo so it stays isolated from your other work. It combines charting, technical indicators, fundamental analysis, financial statements, news sentiment, and an AI decision-support panel in a single responsive workflow.

The app is designed as a hybrid of:

- TradingView-style chart exploration
- Bloomberg-like information density
- A modern AI copilot that explains the current setup in plain language

## What’s included

### Frontend
- Next.js App Router
- TypeScript
- TailwindCSS
- Plotly chart lab with candlesticks, overlays, and drawing tools
- Responsive dashboard layout with:
  - ticker search
  - chart workspace
  - compare mode
  - AI insights panel
  - news panel
  - fundamentals section
  - local watchlist

### Backend
- Fastify REST API
- Rate limiting and input validation
- Cached upstream provider calls
- Alpha Vantage integration for:
  - ticker search
  - quotes
  - historical candles
  - overview/fundamentals
  - financial statements
  - news sentiment
- Optional OpenAI-powered narrative insights
- Deterministic fallback/demo data flow when keys are missing or throttled

### Shared analytics layer
- Technical indicator calculations:
  - SMA
  - EMA
  - MACD
  - RSI
  - Stochastic Oscillator
  - Bollinger Bands
  - VWAP
- Sector benchmark comparison helpers
- Simple intrinsic value estimator
- Shared domain types for the full stack

## Project structure

```text
market-copilot/
├── apps/
│   ├── api/              # Fastify backend
│   └── web/              # Next.js dashboard
├── packages/
│   └── shared/           # indicators, types, valuation helpers
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Why the architecture looks like this

- `apps/web` and `apps/api` are split so the frontend can go to Vercel while the backend can go to Railway or Render.
- `packages/shared` keeps indicator logic, valuation helpers, and API contracts consistent across both apps.
- Plotly was chosen for the chart workspace because it gives us candlesticks, responsive rendering, and built-in drawing tools for trend lines and support/resistance rectangles without custom canvas code.
- The backend owns all secrets and upstream calls, so the browser never sees provider API keys.
- A fallback data layer keeps the whole product explorable before live keys are configured.

## Features

### Market data
- Search global tickers
- Live quote polling
- Candlestick charts for `1m`, `5m`, `1h`, `1D`, and `1W`
- Volume overlay
- Compare multiple stocks with normalized relative performance

### Technical analysis
- SMA 20 / SMA 50
- EMA 20
- MACD
- RSI
- Stochastic Oscillator
- Bollinger Bands
- VWAP
- Drawing tools via Plotly modebar:
  - trend lines
  - support/resistance zones

### Fundamental analysis
- Income statement
- Balance sheet
- Cash flow statement
- Key metrics:
  - P/E
  - EPS
  - revenue growth
  - ROE
  - debt-to-equity
  - free cash flow
- Sector comparison table
- Simple intrinsic value estimate

### News and sentiment
- Relevant ticker news
- Recency and relevance display
- Positive / neutral / negative sentiment labels
- Aggregate sentiment summary

### AI decision assistant
- Bullish / Bearish / Neutral bias
- Risks
- Catalysts
- Reasoning summary
- Clear disclaimer that this is not financial advice

## Environment variables

Copy the sample file:

```bash
cp .env.example .env
```

Important values:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`
- `ALPHA_VANTAGE_API_KEY=...`
- `OPENAI_API_KEY=...` (optional)
- `OPENAI_MODEL=...`
- `ALLOWED_ORIGIN=http://localhost:3000`

If `ALPHA_VANTAGE_API_KEY` is missing, the API automatically serves deterministic fallback data so the frontend still works.

## Local development

Install dependencies:

```bash
npm install
```

Run both apps:

```bash
npm run dev
```

Or run each app independently:

```bash
npm run dev:api
npm run dev:web
```

Useful scripts:

```bash
npm run typecheck
npm run build
npm run test
```

## REST API

Base path: `/api/stocks`

Endpoints:

- `GET /search?q=AAPL`
- `GET /:symbol/dashboard?interval=1D&compare=MSFT,NVDA`
- `GET /:symbol/chart?interval=1D&compare=MSFT,NVDA`
- `GET /:symbol/fundamentals?interval=1D`
- `GET /:symbol/news?interval=1D`
- `GET /:symbol/insight?interval=1D`

Health check:

- `GET /health`

## Deployment

### Vercel
- Import the repo
- Set the root directory to `apps/web`
- Keep the install command at the repo root: `npm install`
- Build command: `npm run build -w @market-copilot/web`
- Add `NEXT_PUBLIC_API_BASE_URL` pointing at your deployed API

### Railway or Render
- Deploy the repo root
- Build command:

```bash
npm install && npm run build -w @market-copilot/shared && npm run build -w @market-copilot/api
```

- Start command:

```bash
npm run start -w @market-copilot/api
```

`render.yaml` is included as a starting point for Render.

### Docker

Run with Docker Compose:

```bash
docker compose up --build
```

This builds:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`

## Notes on data providers

- Alpha Vantage is wired as the primary provider because it covers search, time series, overview data, statements, and news sentiment in one integration.
- The backend already has a clean service boundary if you want to add Finnhub, Polygon, EODHD, or a GraphQL layer later.
- The valuation model is intentionally simple and should be treated as a directional estimator, not a full DCF replacement.

## Verification status

Verified in this workspace:

- `npm run typecheck`

You should also run the live app locally with your own API keys to validate the exact provider responses you plan to use in production.

## Disclaimer

This platform provides research and educational tooling only. It does not provide investment advice, portfolio management, or recommendations to buy or sell securities.
