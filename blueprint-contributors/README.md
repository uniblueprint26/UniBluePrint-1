# Blueprint Contributors

A standalone recruitment site for the UniBlueprint **Blueprint Contributors Programme** — deployed as its own Netlify site, independent from the main uniblueprint.com deploy, but sharing the same Supabase backend (same auth, same `contributor_submissions` table added in `../supabase/migrations/20260720120000_contributor_submissions.sql`).

Same design system as the main site (`../DESIGN_REFERENCE.md`): DM Serif Display / DM Sans, navy `#1E3A5F` on cream `#F5F0E8`.

## Pages

- `/` — landing page: hero, mission, the €100 Challenge with countdown, content categories, how it works, FAQ
- `/sign-up`, `/sign-in`, `/verify-email` — auth (same Supabase project as the main site, so an existing UniBlueprint account works here too)
- `/dashboard` (auth required) — submission stats, history, upload tips
- `/upload` (auth required) — Upload Centre with 15 category-specific structured forms

Legal pages (Terms, Privacy) and password reset link out to the main site at uniblueprint.com since this microsite doesn't duplicate them.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Deploying to Netlify as a separate site

This folder is self-contained (its own `package.json`, `vite.config.js`, `netlify.toml`) so it can be deployed as its **own** Netlify site from the same GitHub repo:

1. In Netlify: **Add new site → Import an existing project** → select this repo.
2. **Base directory**: `blueprint-contributors`
3. **Build command**: `npm run build` (already set in `netlify.toml`)
4. **Publish directory**: `dist` (relative to the base directory)
5. Add environment variables (Site settings → Environment variables):
   - `VITE_SUPABASE_URL` — same value as the main site's Netlify env var
   - `VITE_SUPABASE_ANON_KEY` — same value as the main site's Netlify env var
6. Deploy. `netlify.toml` / `public/_redirects` already handle the SPA fallback so client-side routes (`/dashboard`, `/upload`, etc.) work on refresh.

Point a subdomain (e.g. `contributors.uniblueprint.com`) at this Netlify site once it's live.
