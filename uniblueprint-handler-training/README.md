# Blueprint Studio — Campus Handler Training Portal

A standalone React + Vite application for training UniBlueprint Campus Handlers. Completely
separate from the main UniBlueprint app — its own package.json, its own Supabase project, its
own deploy.

## Stack

React, Vite, Tailwind CSS v4, Supabase JS client, React Router, Lucide icons.

## One-time Supabase setup

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of `supabase/migrations/0001_init.sql` and run it. This creates
   `training_users`, `training_progress`, `quiz_attempts`, `handler_commitments`, and their RLS
   policies.
3. In Supabase → **Authentication → Providers**, no changes needed — this app does not use
   Supabase Auth, only the `anon` key against the tables above.
4. Create at least one Operations account by inserting a row into `training_users` with
   `role = 'operations'` (via the SQL editor or Table editor), so you can log in and use
   `/operations` to add Handlers from the UI afterwards.

### A note on security

This portal authenticates with a simple email + access code check against `training_users`,
not Supabase Auth. Because there's no `auth.uid()` to scope Row Level Security to, the RLS
policies are permissive for the `anon` role (the same key the browser uses) — row-level
isolation between handlers is enforced in the app, not the database. Treat the anon key as
semi-trusted, the same as any client-only Supabase app without Auth.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Build

```bash
npm run build
```

Outputs to `dist/`.

## Deploying to Netlify

1. Run `npm run build`.
2. Go to [netlify.com/drop](https://app.netlify.com/drop) and drag the `dist` folder onto the
   page.
3. The portal is live at a Netlify URL immediately — no configuration needed.

Note: a drag-and-drop deploy without a Netlify account is temporary (live for 1 hour, and
password-protected). To keep it live permanently with no password, sign up for a free Netlify
account and claim the deploy (a "Save to your team" prompt appears right after dropping the
folder), or redo the drag-and-drop while logged in via **Add new site → Deploy manually**.

**Current live deploy:** https://sweet-crumble-b6ae02.netlify.app/

Note: `dist/` is a static build with the Supabase URL and anon key baked in at build time (via
`.env`), so make sure `.env` is set correctly before running `npm run build`.

## Routes

| Route | Description |
| --- | --- |
| `/` | Login (email + access code) |
| `/dashboard` | Handler dashboard — 6 training modules |
| `/module/1` … `/module/6` | Module content |
| `/quiz/2`, `/quiz/3`, `/quiz/5` | Module quizzes |
| `/operations` | Operations dashboard (role = `operations` only) |

## Content

Module body content lives in `src/data/moduleContent.tsx` (one entry per module, 1–6), rendered
inside `ModulePage.tsx`. Quiz questions for modules 2, 3, and 5 are in `src/data/quizzes.ts`.
