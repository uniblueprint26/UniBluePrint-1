-- Follow-up to last night's authz audit (and to the previous, ineffective
-- anon-only revoke above): these 39 functions all internally check
-- has_role(auth.uid(), '<staff role>') and raise an exception for anyone
-- else, so there was no active vulnerability -- but they were also
-- EXECUTE-granted to PUBLIC (Postgres's default on function creation,
-- which applies to every role including anon), unnecessary attack surface
-- for functions only staff ever legitimately call. This revokes PUBLIC's
-- grant and `anon`'s directly, then re-grants EXECUTE to `authenticated`
-- explicitly so staff (who call these as `authenticated`) keep access --
-- the internal has_role() check still gates non-staff authenticated users
-- exactly as before. Confirmed via grep that none of these are called from
-- a public (unauthenticated) page in src/.
--
-- This is the same pattern this project has already used several times
-- (partner_tiering_revoke_public_execute, direct_messaging_revoke_anon,
-- directory_discovery_revoke_anon, lock_down_default_function_privileges)
-- -- just applied to the ops/finance/founder/handler RPC surface, which
-- hadn't had this pass done yet.

do $$
declare
  r record;
  fnames text[] := ARRAY['cancel_submission','claim_submission','compute_queue_priority','contact_student',
    'deliver_submission','expire_wallet_outputs','fetch_operations_queue','flag_capacity_gaming',
    'flag_submission','get_all_partner_stats','get_campus_breakdown','get_campus_demand',
    'get_coach_enquiry_counts','get_feature_engagement','get_finance_commission_summary',
    'get_finance_one_time_payments_summary','get_finance_partner_payout_summary','get_finance_revenue_snapshot',
    'get_founder_platform_stats','get_founder_topline','get_handler_roster','get_lifestyle_partner_contact',
    'get_ops_queue_snapshot','get_ops_queue_times','get_retention_snapshot','get_service_demand',
    'get_sunday_queue_status','get_tier_mix','get_weekly_signups','guard_coach_profile_verified',
    'guard_profiles_verified_student','handle_application_deadline_reminders','handler_missed_checkins_last_7_days',
    'is_ghost_handler','list_active_handlers','mark_submission_incomplete','partner_category_benchmark',
    'reassign_submission','record_claim_attempt','submit_handler_decision'];
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(fnames)
  loop
    execute format('revoke execute on function %s from public', r.sig);
    execute format('revoke execute on function %s from anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;
