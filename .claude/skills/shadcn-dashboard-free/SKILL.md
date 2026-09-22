---
name: shadcn-dashboard-free
description: |
  Guide for building pages, features, persistence, and navigation in this Vite + React 19 study dashboard SPA. Use this skill whenever the user wants to add a new page/view, wire up data through the study context or the serverless API, add a route, configure the sidebar, add charts, or work with this dashboard's existing conventions. Also triggers when the user asks about icon usage or theming (dark/light). Even if the user doesn't say "dashboard" explicitly — if they're adding UI, pages, or features to this project, use this skill.
---

# Estudos Gaya Development Guide

This skill encodes the exact patterns and conventions used in this Vite + React 19 study dashboard SPA. Following these patterns keeps new code consistent with the existing codebase. See [AGENTS.md](../../../AGENTS.md) for the fuller reference this skill is derived from.

## Quick Reference: What Goes Where

| Task                    | Location                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| New page/view             | `src/views/<area>/<page>/index.tsx`                              |
| Route registration          | `src/routes/Router.tsx` (lazy + `Loadable`)                     |
| Sidebar nav entry             | `src/layouts/full/vertical/sidebar/sidebaritems.ts`            |
| Reusable UI component            | `src/components/<domain>/`                                  |
| shadcn-style primitive              | `src/components/ui/`                                      |
| Study state / persistence             | `src/context/study-context/StudyContext.tsx`            |
| API client                              | `src/lib/api.ts`                                      |
| Serverless endpoints                      | `api/state.ts` (+ `api/_db.ts`, `api/_schema.ts`)   |
| Edital flattening helpers                   | `src/lib/edital.ts`                               |
| Shared types                                  | `src/types/estudos.ts`                          |
| Custom hooks                                    | `src/hooks/`                                  |
| Tailwind/global styles                            | `src/css/`                                  |
| Theme (dark/light) context                          | `src/context/shadcntheme/`                |

## Adding a New Feature (5 Steps)

1. Add the view under `src/views/<area>/<name>/index.tsx`, composing components from `src/components/<name>/` (or `src/components/shared/`) and shadcn primitives from `src/components/ui/`.
2. If the feature needs shared state, consume `useStudy()` from `src/context/study-context/StudyContext.tsx`. Extend the context only when the state is genuinely cross-page.
3. If the feature needs persistence, add the endpoint to `api/state.ts` and the corresponding client function to `src/lib/api.ts` (see below).
4. Register the route: add a `Loadable(lazy(() => import('../views/...')))` declaration and a route entry in `src/routes/Router.tsx`, under `FullLayout` for dashboard pages or `BlankLayout` for standalone pages.
5. Add a sidebar nav item if the page should be reachable from the sidebar (`src/layouts/full/vertical/sidebar/sidebaritems.ts`).

## Data & Persistence Pattern

- There **is** a backend: the Vercel Edge Function in `api/state.ts`, persisting to **Turso** (libSQL) via `@libsql/client`. The schema lives in `api/_schema.ts` and the shared client in `api/_db.ts`.
- The client for those endpoints is `src/lib/api.ts` (`fetchRemoteState`, `pushState`, `pushTopic`, `pushSession`, `clearRemoteState`). All of them tolerate failure and no-op when the API is unreachable.
- `src/context/study-context/StudyContext.tsx` owns the in-memory state, mirrors it to `localStorage` (`gaya:study-state:v1`) and hydrates from Turso on mount, migrating local progress when the database is empty.
- The app must keep working offline: never make a network call a hard requirement for rendering. Fall back to `localStorage`.
- The study plan comes from `data/edital.json`, imported statically and flattened once by `src/lib/edital.ts`. It is not fetched at runtime.

## Tables

Use the primitives in `src/components/ui/table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, ...). See `src/views/pages/estatisticas/index.tsx` for a real usage.

## Forms

No form library is currently installed. Compose from the primitives in `src/components/ui/` (`Input`, `Select`, `Button`, ...); discuss with the user before adding a form library dependency.

## Charts

Use `recharts` (see `src/components/ui/chart.tsx` and the widgets in `src/components/dashboards/modern/`).

## Icons

- `lucide-react` — most common
- `@iconify/react` (`import { Icon } from '@iconify/react'`) — used in the profile sheet

Match whichever icon package the file you're editing already imports.

## Language

All user-facing UI copy is **pt-BR**. Technical documentation (this file, `AGENTS.md`, `CLAUDE.md`, code comments where English is already used) is in English. Don't revert the UI to English.

## Code Conventions

- Use `cn()` from `src/lib/utils.ts` for class merging — never concatenate className strings.
- Path aliases `src/*` and `@/*` both resolve to `./src/*` — match the convention already used in the file you're editing.
- `npm run build` runs `tsc` before `vite build`; type errors block the build.
- `npm run lint` runs with `--max-warnings 0` — fix warnings, don't suppress them.
- Package manager is **npm** (`package-lock.json`) — don't introduce pnpm/yarn/bun lockfiles or commands.
