# AGENTS.md - AI Coding Agent Reference

This file provides essential information for AI coding agents working on this project. It contains project-specific details, conventions, and guidelines that complement the README and CLAUDE.md.

---

## Project Overview

> **Purpose**: This is a personal-use tool (not a commercial product) built to help **Gaya Liz** study for the **TCDF** exam. It started from the **Shadcn Dashboard Free** template and was repurposed as a study companion. Keep that context in mind when making product decisions — prioritize practical study features and simplicity over template/boilerplate parity.

**Estudos Gaya** is a study dashboard built with:

- **Framework**: Vite 8 + React 19 (client-side SPA) plus a Vercel Edge Function in `api/`
- **Language**: TypeScript, compiled with `tsc` before every build
- **Routing**: `react-router` (client-side, `createBrowserRouter`)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn-style primitives on Base UI (`@base-ui/react`)
- **Forms**: no form library is wired up — add one only if a feature actually needs it
- **Data fetching / state**: `src/lib/api.ts` (fetch client) and `src/context/study-context/StudyContext.tsx` (state + `localStorage` cache)
- **Backend**: `api/state.ts` — Vercel Edge Function persisting to **Turso** (libSQL) via `@libsql/client`
- **Charts**: `recharts` (the only charting library in the project)
- **Icons**: `lucide-react` and `@iconify/react` are the two icon packages in use
- **Deployment**: static `dist/` build on Vercel (`vercel.json`), Netlify (`netlify.toml`) or Docker + nginx (`Dockerfile`, `nginx.conf`)
- **Package Manager**: npm (`package-lock.json` is the lockfile of record)

Progress is persisted in **Turso** through the Edge Function in `api/state.ts`. The app still works fully offline: `localStorage` acts as a cache, and on the first load against an empty database the local progress is migrated automatically. The header badge (`src/components/shared/sync-badge.tsx`) reports the sync state.

---

## Project Structure

```
/src
├── App.tsx                  # Root app component (wraps RouterProvider in StudyProvider)
├── main.tsx                  # Vite entry point (ThemeProvider + Suspense + Spinner)
├── routes/
│   └── Router.tsx            # All route definitions (react-router, createBrowserRouter), lazy-loaded via Loadable
├── layouts/
│   ├── full/                 # Main dashboard shell (sidebar + header + footer)
│   └── blank/                # Bare layout (error page)
├── views/                    # Page-level screens, one folder per route
│   ├── auth/error/           # 404 page
│   ├── dashboards/modern/    # Study dashboard (home)
│   ├── pages/                # edital, revisao, sessoes, estatisticas
│   └── spinner/              # Suspense fallback
├── components/               # Reusable UI building blocks
│   ├── ui/                   # shadcn-style primitives (button, card, select, table, sidebar, chart, ...)
│   ├── dashboards/modern/    # Study widgets (study-activity, study-focus, study-stats, ...)
│   └── shared/               # Cross-cutting shared components (ScrollToTop, StyleDivider, dashboard-card, sync-badge)
├── context/                  # React context providers
│   ├── study-context/        # Study progress state + sync
│   └── shadcntheme/          # Theme (dark/light) context
├── lib/
│   ├── api.ts                # Client for the /api endpoints
│   ├── edital.ts             # Flattens edital.json into study topics + helpers
│   └── utils.ts              # cn() and shared helpers
├── types/
│   └── estudos.ts            # Edital + progress types
└── css/                      # Global styles

/api
├── state.ts                  # Edge Function: state/topic/session routes
├── _db.ts                    # Shared Turso client (schema applied idempotently)
└── _schema.ts                # Schema as the single source of truth

/scripts
├── migrate.ts                # Applies the schema to Turso (npm run db:migrate)
└── smoke-db.ts               # Tests schema + queries against in-memory libSQL (npm run db:smoke)

/data
└── edital.json               # Source study plan (TCDF edital)

vercel.json                   # SPA rewrite (non-/api → /index.html)
netlify.toml                  # SPA redirect (all paths → /)
Dockerfile                    # Multi-stage build: npm ci → vite build → nginx
nginx.conf                    # SPA fallback for the Docker image
```

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Type-check + production build
npm run build

# Preview the production build
npm run preview

# Lint (ESLint, must pass with zero warnings)
npm run lint

# Apply the schema to the Turso database
npm run db:migrate

# Smoke-test the schema and queries against an in-memory libSQL database
npm run db:smoke
```

`npm run build` runs `tsc` before `vite build` — TypeScript errors fail the build, not just lint. Always run `npm run lint` before considering frontend changes done.

The API in `api/` only runs on Vercel. With plain `npm run dev` the app operates in local mode (`localStorage`); use `vercel dev` to exercise the full API locally.

---

## Routing Pattern

All routes are declared in `src/routes/Router.tsx` using `react-router`'s `createBrowserRouter`. Every page component is:

1. Lazily imported with `lazy(() => import('../views/...'))`
2. Wrapped in `Loadable` (`src/layouts/full/shared/loadable/Loadable.tsx`) to provide a suspense fallback

Current routes: `/` and `/dashboards/modern` (study dashboard), `/edital`, `/revisao`, `/sessoes`, `/estatisticas`, and the 404 page at `/auth/404` (plus `/404`).

When adding a new page:

1. Create the view under `src/views/<area>/<page>/index.tsx` (or similar), following sibling folders.
2. Add a `Loadable(lazy(() => import(...)))` declaration near related routes in `Router.tsx`.
3. Add the route entry under the appropriate layout (`FullLayout` for dashboard pages, `BlankLayout` for standalone pages).
4. If the page needs a sidebar entry, wire it into `src/layouts/full/vertical/sidebar/sidebaritems.ts`.

---

## Data & Persistence Pattern

The backend is the Vercel Edge Function in `api/state.ts`, persisting to Turso (libSQL):

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/state` | Full state (topics + sessions) |
| `POST` | `/api/state` | Bulk import (localStorage migration) |
| `DELETE` | `/api/state` | Clears all progress |
| `PATCH` | `/api/topic` | Upserts a single topic |
| `POST` | `/api/session` | Records a study session |

Client-side flow:

1. `src/lib/api.ts` exposes `fetchRemoteState`, `pushState`, `pushTopic`, `pushSession` and `clearRemoteState`, all tolerant of failure (they return `null`/no-op when the API is unreachable).
2. `src/context/study-context/StudyContext.tsx` holds the in-memory state, mirrors it to `localStorage` (`gaya:study-state:v1`) and hydrates from Turso on mount, migrating local progress when the database is empty.
3. Views/components consume the context via `useStudy()`.

The study plan itself comes from `data/edital.json`, imported statically and flattened once by `src/lib/edital.ts` (`allTopics`, `topicById`, `groupByDisciplina`, `summarize`). There is no runtime request for the edital.

When adding a feature that needs persistence, extend the Edge Function routes and the `src/lib/api.ts` client rather than reaching for a different data layer.

---

## Component & Styling Conventions

- **Icons**: check which icon package the file you're editing already imports before adding icons — `lucide-react` and `@iconify/react` (`import { Icon } from '@iconify/react'`) are the two in use.
- **UI primitives**: `src/components/ui/` holds the shadcn-style primitives (Base UI wrapped with `cva` + `cn()`). Extend these via composition in feature components rather than editing the primitives directly, unless the change is meant to apply globally.
- **Styling**: Tailwind v4 utility classes; use `cn()` from `src/lib/utils.ts` for conditional/merged class names — never string-concatenate classes.
- **Forms**: no form library is currently installed; if a feature needs one, discuss with the user before adding a dependency.
- **Tables**: use the primitives in `src/components/ui/table.tsx` rather than building a table from scratch.
- **Charts**: use `recharts` via `src/components/ui/chart.tsx`.
- **Language**: all visible UI copy is pt-BR; technical documentation is written in English.

---

## TypeScript & Path Aliases

- Both `src/*` and `@/*` alias to `./src/*` (see `vite.config.ts` and `tsconfig.json`). Existing files use a mix of `src/...` and `@/...` imports — match whichever convention the file you're editing already uses.
- `npm run build` type-checks the whole project with `tsc` first; don't rely on Vite dev-server transpilation alone to catch type errors.

---

## Linting

ESLint config is `eslint.config.js` (flat config, ESLint 10):

- Composes `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended and `eslint-plugin-react-refresh`
- `react-refresh/only-export-components` is a warning, with `allowConstantExport` and `allowExportNames` for the shadcn `cva` variants (`badgeVariants`, `buttonVariants`) and context hooks (`useSidebar`, `useTheme`, `useStudy`)
- Build artifacts are ignored via `ignores: ['dist', 'node_modules', '.vercel']`
- `npm run lint` runs with `--max-warnings 0` — treat warnings as build-breaking

---

## Deployment

- **Vercel**: `vercel.json` rewrites non-`/api` paths to `/index.html` for SPA routing; the Edge Function in `api/` is deployed alongside.
- **Netlify**: `netlify.toml` redirects all paths to `/` for SPA routing — already configured, no changes usually needed.
- **Docker**: `Dockerfile` builds `dist/` and serves it with nginx (`nginx.conf` SPA fallback).

---

## Notes for AI Agents

1. **Personal study tool, not a product** — this repo exists to help Gaya Liz study the TCDF edital in `data/edital.json`. Favor features that serve that goal over generic template parity.
2. **Verify feature claims against code, not the dependency list.** Grep `src/` before telling the user a feature exists.
3. **There is a backend** — the Vercel Edge Function in `api/state.ts` persists to Turso (libSQL). Don't reintroduce mock layers or assume the app is purely client-side; when the API is unavailable the app degrades to local-only mode via `localStorage`.
4. **Match existing import conventions** — check sibling files in `views`/`components` for path alias style (`src/...` vs `@/...`) and icon package before adding new code.
5. **Icons**: prefer `lucide-react` or `@iconify/react`, matching whichever the file already uses.
6. **UI copy is pt-BR** — keep user-facing strings in Portuguese.
7. **Package manager is npm** — use `npm install`/`npm run <script>`; don't reintroduce pnpm/yarn/bun lockfiles or commands.
8. **Type errors block the build** — `npm run build` runs `tsc` before `vite build`, so don't leave `any`-typed shortcuts assuming the dev server alone will catch problems.
9. **Lint must be clean** — `npm run lint` uses `--max-warnings 0`; fix warnings, don't suppress them with disable comments unless justified.

---

## External Documentation

- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Base UI](https://base-ui.com/)
- [Recharts](https://recharts.org/)
- [Turso](https://turso.tech/)
- [libSQL client](https://github.com/tursodatabase/libsql-client-ts)
- [Vercel Functions](https://vercel.com/docs/functions)
