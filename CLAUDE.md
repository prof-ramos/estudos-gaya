# CLAUDE.md

This is a Vite + React 19 + TypeScript study dashboard ("estudos-gaya"), styled with Tailwind CSS v4 and Base UI primitives. It started from the open source "shadcn-dashboard-free" template and was repurposed as a personal study companion for the TCDF exam. The SPA uses `react-router` for client-side routing and talks to a small serverless API (Vercel Edge Function + Turso/libSQL) for progress persistence.

## Stack

- **Build tool**: Vite (`vite.config.ts`), TypeScript project compiled with `tsc` before build
- **Routing**: `react-router` (client-side, SPA) — routes under `src/routes`
- **UI**: Base UI primitives (`@base-ui/react`), Tailwind CSS v4, `class-variance-authority`, `tailwind-merge`
- **Data fetching / state**: `src/lib/api.ts` (fetch client) + `src/context/study-context/StudyContext.tsx` (state, `localStorage` cache, sync status)
- **Backend**: `api/state.ts` — Vercel Edge Function persisting to Turso (libSQL) via `@libsql/client`, schema in `api/_schema.ts`, shared client in `api/_db.ts`
- **Charts**: `recharts`
- **Icons**: `lucide-react`, `@iconify/react`

## Project structure

- `src/components` — reusable UI components (`dashboards/modern` study widgets, `shared`, and `ui` primitives)
- `src/views` — page-level view components (`dashboards/modern`, `pages/*`, `auth/error`, `spinner`)
- `src/routes` — route definitions (`Router.tsx`)
- `src/layouts` — layout shells (`full` sidebar + header, `blank`)
- `src/context` — React context providers (`study-context`, `shadcntheme`)
- `src/lib` — helpers (`api.ts` API client, `edital.ts` edital flattening, `utils.ts`)
- `src/types` — shared TypeScript types (`estudos.ts`)
- `src/css` — global styles
- `api` — serverless functions + Turso client/schema
- `scripts` — Node scripts (`migrate.ts`, `smoke-db.ts`)
- `data` — `edital.json` (source of the study plan)

## Conventions

- Path alias/component imports follow the existing folder structure under `src/` — check sibling files in `views`/`components` before adding new patterns.
- Icons: prefer whichever icon set is already used in the file you're editing.
- Data flows through `src/lib/api.ts` + `StudyContext`; the app degrades to local-only mode when the API is unavailable.
- All user-facing UI copy is in pt-BR — keep it that way.
- Run `npm run lint` (ESLint flat config in `eslint.config.js`, using `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`) before considering frontend changes done.
- `npm run build` runs `tsc` first — type errors block the build, not just lint.

## Deployment

- **Vercel**: `vercel.json` rewrites non-`/api` paths to `/index.html` (SPA fallback); `api/state.ts` is deployed as an Edge Function.
- **Netlify**: `netlify.toml` redirects all paths to `/` (SPA fallback).
- **Docker**: multi-stage build serving `dist/` with nginx (`Dockerfile`, `nginx.conf`).

## Agent skills

### Issue tracker

Issues live as GitHub issues on `prof-ramos/estudos-gaya`, driven with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
