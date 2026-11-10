-- Performance advisor fix: auth_rls_initplan, follow-up re-application.
-- The original rls_perf_wrap_auth_fn_calls migration (20261103004339) fixed
-- 295 policies. Hub-schema migrations built since then (Legal/Tech/
-- Marketing/Co-Director/Handler/social_feed) reintroduced the same
-- unwrapped auth.uid()/auth.jwt()/auth.role() pattern at scale -- 308
-- policies now flagged by the performance advisor as of 2026-11-10.
--
-- auth.uid()/auth.jwt()/auth.role() are STABLE functions, so wrapping them
-- as (select auth.uid()) does not change policy semantics -- it just lets
-- Postgres evaluate them once per query (initPlan) instead of once per row.
-- This is the exact same mechanical rewrite as the original migration,
-- re-run verbatim: idempotent by construction, since the WHERE clause only
-- matches policies that still have the unwrapped form, so anything already
-- fixed is left untouched.
--
-- NOTE, added after applying: the "already wrapped?" detection this script
-- uses (`qual !~ '\(select auth\.(uid|jwt|role)\(\)\)'`) does not recognize
-- Postgres's actual canonical deparse format for an already-wrapped
-- expression (`( SELECT auth.uid() AS uid)`, uppercase, aliased, not the
-- literal lowercase text written here). A controlled test confirmed this:
-- most or all of the "308 regressed" policies were very likely already
-- correctly wrapped before this ran (the same blind spot appears to have
-- affected the *original* Nov 3 migration too -- `profiles`' policies,
-- untouched since then, already show the same double-nested pattern this
-- run produced elsewhere). Re-running this added a harmless, redundant
-- extra wrap layer to policies that were probably already fine -- verified
-- via a throwaway test table to have ZERO correctness/security impact
-- either way (nested STABLE scalar subqueries still evaluate identically,
-- still only once per query). Left as-is rather than attempting a further
-- live rewrite to strip the redundant layer, since that's purely cosmetic
-- risk-for-no-benefit on 300+ production policies. A real fix for the
-- underlying detection-regex flaw is a separate, future task.

do $$
declare
  r record;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual ~ 'auth\.(uid|jwt|role)\(\)' and qual !~ '\(select auth\.(uid|jwt|role)\(\)\)')
        or
        (with_check is not null and with_check ~ 'auth\.(uid|jwt|role)\(\)' and with_check !~ '\(select auth\.(uid|jwt|role)\(\)\)')
      )
  loop
    stmt := format('ALTER POLICY %I ON public.%I ', r.policyname, r.tablename);
    if r.qual is not null then
      stmt := stmt || format('USING (%s) ', regexp_replace(r.qual, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g'));
    end if;
    if r.with_check is not null then
      stmt := stmt || format('WITH CHECK (%s)', regexp_replace(r.with_check, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g'));
    end if;
    execute stmt;
  end loop;
end $$;
