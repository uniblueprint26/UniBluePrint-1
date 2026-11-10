-- ── Baseline reconciliation (2026-11-10) ────────────────────────────────────
--
-- Context: a migration-drift review found ~130 live migration versions with
-- no exact-matching local file. On investigation, the overwhelming majority
-- were NOT missing content — they were the same "local file timestamped at
-- write-time, applied live under a different (batch-push) timestamp" pattern
-- an earlier pass had already partially fixed for 48 files. This pass
-- extended that same reconciliation to 41 more files (pure `git mv` renames,
-- see that commit — no SQL content changed, verified by exact stem/content
-- match against each live migration name before moving), plus one
-- content-verified rename where the local filename itself didn't match the
-- live name (`feed_comments_and_saves.sql` -> `social_feed_schema`, matched
-- by content: it's the only local file defining feed_comments/
-- feed_saved_posts, and no other candidate exists for that live version).
--
-- After all of that, exactly two live migrations had genuinely new content
-- with no local representation anywhere (verified via introspection against
-- the live project, not guessed): a column on `services` and a view option
-- on `coach_rating_summary`. This file captures those two, idempotently, so
-- a fresh environment replaying all migration files in order ends up with
-- real production's actual schema. Every statement below is idempotent
-- (IF NOT EXISTS / CREATE OR REPLACE) and matches what's already live today
-- — so it is also safe to run again against the current live project with
-- no effect, unlike a non-idempotent migration would be.
--
-- One live migration this pass could NOT positively attribute to any local
-- file or introspectable live object: `noop_test_migration`
-- (20261012110921) — its name states it's a no-op, and no corresponding
-- schema change was found live, so nothing to capture here.
--
-- Two local files' true live-applied version could not be confirmed in this
-- pass and are flagged for a dedicated follow-up rather than guessed at:
-- `supabase/migrations/20261012110000_push_notifications.sql` and
-- `supabase/migrations/20261015140000_directory_credentials_endorsements.sql`
-- (both already exist locally with real content; only their live version
-- number is unconfirmed, so nothing about them needed to change here).

-- `foundation_services_pro_pricing` (live version 20261012204821) — adds a
-- Pro-tier price alongside the existing standard price_cents on `services`.
alter table public.services
  add column if not exists price_cents_pro integer;

-- `coach_rating_summary_security_invoker` (live version 20261022103917) —
-- the view itself already exists (see 20260828170001_dashboard_ratings_
-- and_finance_role.sql); this just adds the security_invoker option so RLS
-- on the underlying coach_ratings table is evaluated as the querying user,
-- not the view owner.
alter view if exists public.coach_rating_summary
  set (security_invoker = true);
