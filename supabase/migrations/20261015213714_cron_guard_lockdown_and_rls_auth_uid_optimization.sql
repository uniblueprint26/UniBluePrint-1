-- Security fix 1: cron-guarded functions were reachable by unauthenticated
-- (anon) and authenticated callers via PostgREST RPC, because the
-- "three-way guard" pattern (auth.uid() is null for both pg_cron and an
-- anon REST caller) only blocks authenticated non-Operations callers, not
-- anonymous ones.
--
-- Confirmed via cron.job that pg_cron invokes these as
-- `select public.<fn>();` directly in-database (owner-role execution, not
-- through PostgREST), so revoking anon/authenticated EXECUTE does not
-- affect the real cron schedule. No app code calls these functions via
-- supabase.rpc(), so no admin-triggerable wrapper is needed.
--
-- A prior lockdown on this project found that `REVOKE ... FROM PUBLIC`
-- alone was insufficient, because anon/authenticated also hold separate,
-- explicit EXECUTE grants in pg_proc.proacl. Revoke all three explicitly.
revoke execute on function public.rotate_campus_pulse_prompt() from public, anon, authenticated;
revoke execute on function public.handle_deadline_escalation() from public, anon, authenticated;
revoke execute on function public.generate_handler_snapshots() from public, anon, authenticated;
revoke execute on function public.generate_weekly_blueprint_reports() from public, anon, authenticated;

-- Security fix 2: RLS policies added today on 4 tables used the bare
-- auth.uid() form, which Postgres re-evaluates per row, instead of the
-- optimized (select auth.uid()) form used by the other tables added
-- today. Rewritten in place via ALTER POLICY (DROP POLICY has repeatedly
-- hung via MCP tools on this project) with identical semantics.

-- campus_pulse_responses
alter policy "delete_own_campus_pulse_response" on public.campus_pulse_responses
  using ((select auth.uid()) = user_id);

alter policy "insert_own_campus_pulse_response" on public.campus_pulse_responses
  with check ((select auth.uid()) = user_id);

alter policy "update_own_campus_pulse_response" on public.campus_pulse_responses
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- coach_intro_call_offers
alter policy "coach_manage_own_intro_call_offer" on public.coach_intro_call_offers
  using (exists (
    select 1
    from coach_profiles cp
    where cp.coach_slug = coach_intro_call_offers.coach_slug
      and cp.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from coach_profiles cp
    where cp.coach_slug = coach_intro_call_offers.coach_slug
      and cp.user_id = (select auth.uid())
  ));

alter policy "founder_operations_manage_coach_intro_call_offers" on public.coach_intro_call_offers
  using (
    has_role((select auth.uid()), 'founder'::app_role)
    or has_role((select auth.uid()), 'operations'::app_role)
  )
  with check (
    has_role((select auth.uid()), 'founder'::app_role)
    or has_role((select auth.uid()), 'operations'::app_role)
  );

-- deal_redemption_codes
alter policy "users_read_own_redemption_codes" on public.deal_redemption_codes
  using ((select auth.uid()) = user_id);

-- partner_follows
alter policy "users_manage_own_partner_follows" on public.partner_follows
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
