# Workspace

## Overview

pnpm workspace monorepo for **GetIllustra Admin** — a React + Vite admin UI
deployed to Vercel and backed entirely by **Supabase** (Postgres + Auth +
Storage). There is no custom backend server; the admin talks to Supabase
directly via `@supabase/supabase-js`.

## Artifacts

- `artifacts/getillustra-admin` — React + Vite admin UI (Vercel)
- `artifacts/mockup-sandbox` — local component preview sandbox (dev only)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript**: 5.9
- **Frontend**: React 19, Vite 7, TanStack Query, wouter, Tailwind v4, shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage) — accessed from the browser
  with the anon key. Row Level Security gates all access to authenticated
  users.

## Key Commands

- `pnpm install`
- `pnpm --filter @workspace/getillustra-admin dev` — run admin locally
- `pnpm --filter @workspace/getillustra-admin typecheck`
- `pnpm --filter @workspace/getillustra-admin build` — Vite production build

## Environment Variables

Set in Vercel and locally (in Replit Secrets):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase Setup

To bootstrap a fresh Supabase project, paste the contents of
`artifacts/getillustra-admin/SUPABASE_SCHEMA.sql` into the Supabase SQL Editor
and run it once. It creates:

- All 12 tables (`profiles`, `categories`, `styles`, `tags`, `projects`,
  `project_styles`, `project_tags`, `assets`, `downloads`, `view_history`,
  `saved_items`, `settings`).
- `updated_at` triggers and an `auth.users → public.profiles` trigger.
- RLS policies giving authenticated users full access to admin tables.
- Analytics RPCs (`dashboard_stats`, `recent_activity`, `upload_trend`,
  `top_categories`, `most_downloaded_assets`, `user_growth`, `saves_trend`).
- A public `assets` storage bucket with read/write policies.

## Data Layer

`artifacts/getillustra-admin/src/lib/api/index.ts` is the only data layer.
It exports React Query hooks (`useListX`, `useCreateX`, `useUpdateX`,
`useDeleteX`) and matching `getListXQueryKey()` helpers, plus
`uploadAssetFile()` for Supabase Storage uploads. All admin pages import from
`@/lib/api`.

## Deployment

- **Frontend**: Vercel via `artifacts/getillustra-admin/vercel.json`
  (SPA rewrite to `/index.html`).
- **Backend**: managed Supabase project — no server to deploy.
