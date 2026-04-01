# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Finance Dashboard (`artifacts/finance-dashboard`)
React + Vite finance dashboard application at path `/`.

Features:
- Dashboard overview with financial summary cards (Balance, Income, Expenses, Savings Rate)
- Balance trend area chart and spending breakdown pie chart
- Transactions page with search, filter, sort, CSV export
- Role-based access: Admin (CRUD) vs Viewer (read-only)
- Insights page with smart auto-generated insights and monthly comparison bar chart
- Dark mode toggle
- Fully responsive layout with sidebar navigation

### API Server (`artifacts/api-server`)
Express 5 backend at `/api`.

Routes:
- `GET /api/healthz` — health check
- `GET/POST /api/transactions` — list/create transactions
- `GET/PUT/DELETE /api/transactions/:id` — single transaction CRUD
- `GET /api/insights/summary` — financial summary totals
- `GET /api/insights/balance-trend` — monthly balance trend data
- `GET /api/insights/spending-breakdown` — spending by category
- `GET /api/insights/top-insights` — auto-generated insights
- `GET /api/insights/monthly-comparison` — monthly income vs expense

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── finance-dashboard/  # React + Vite finance dashboard (serves at /)
│   └── api-server/         # Express API server (serves at /api)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files; actual JS bundling by esbuild/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Database Schema

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| date | date | Transaction date |
| amount | numeric(12,2) | Transaction amount |
| category | text | e.g. Salary, Rent, Groceries |
| type | text | 'income' or 'expense' |
| description | text | Human-readable description |
| created_at | timestamp | Auto-set on insert |

## Packages

### `artifacts/finance-dashboard` (`@workspace/finance-dashboard`)
React + Vite frontend. Pages: Dashboard (/), Transactions (/transactions), Insights (/insights).
Role system (Viewer/Admin) managed via React Context. Dark mode toggle in header.

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/` use `@workspace/api-zod` for validation and `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL. Schema in `src/schema/transactions.ts`.
- `pnpm --filter @workspace/db run push` — sync schema

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec (`openapi.yaml`) and Orval codegen config.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks and schemas

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas used by `api-server` for request/response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks used by the `finance-dashboard` frontend.
