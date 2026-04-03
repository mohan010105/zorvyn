# Coffer — AI-Powered Finance Dashboard

A modern, premium fintech SaaS dashboard built with React + Vite, Express, PostgreSQL, and a fully frontend AI insights engine.

## Features

- **Dashboard** — Summary cards, balance trend, spending breakdown, AI insights preview
- **Transactions** — CRUD with search, filter, CSV export
- **AI Insights** — 6 smart analytics: spending patterns, month-over-month comparison, savings, next-month prediction, financial health score
- **Authentication** — LocalStorage-based login, signup, and password reset
- **Role-based UI** — Admin (full CRUD) vs Viewer (read-only)
- **Dark mode** — Persisted preference, premium glassmorphism design

---

## Running on Replit (recommended)

Everything is pre-configured. Just open the project in Replit — both the API server and the Vite dev server start automatically.

---

## Running Locally

### Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **PostgreSQL** database

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/coffer
SESSION_SECRET=your-secret-key-here
PORT=8080
```

Create a `.env` file in `artifacts/finance-dashboard/`:

```env
PORT=5173
BASE_PATH=/
VITE_API_BASE_URL=http://localhost:8080
```

### 4. Set up the database

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run seed
```

### 5. Start both services

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/finance-dashboard run dev:standalone
```

The app opens at **http://localhost:5173**

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express REST API (port 8080)
│   │   └── src/routes/      # /api/transactions, /api/insights
│   └── finance-dashboard/   # React + Vite frontend (port 5173)
│       └── src/
│           ├── components/  # UI components, layout, auth
│           ├── context/     # AuthContext (localStorage auth)
│           ├── lib/         # ai-insights.ts, format.ts, utils.ts
│           └── pages/       # dashboard, transactions, insights, login, signup
├── lib/
│   ├── api-client-react/    # Generated React Query hooks
│   └── db/                  # Drizzle ORM schema + DB client
└── pnpm-workspace.yaml
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 7, TypeScript |
| Styling | Tailwind CSS v4, glassmorphism |
| Charts | Recharts |
| Animation | Framer Motion |
| Routing | Wouter |
| State | TanStack Query |
| Auth | Custom LocalStorage (frontend-only) |
| Backend | Express, Pino logger |
| Database | PostgreSQL + Drizzle ORM |
| API | OpenAPI spec + codegen |

---

## AI Insights Engine

All insights are computed on the frontend from transaction data — no external AI API needed.

| Insight | Description |
|---------|-------------|
| Highest Spending Category | Which category consumes the most |
| Monthly Expense Change | % change vs previous month |
| Spending Concentration | Top 2 categories as % of total |
| Savings This Period | Income minus expenses with savings rate |
| Next Month Forecast | Trend-adjusted 3-month moving average |
| Financial Health Score | 0–100 score across savings, diversity, consistency |
