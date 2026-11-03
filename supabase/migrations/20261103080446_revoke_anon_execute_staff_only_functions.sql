-- First attempt at today's hardening pass: revoking EXECUTE from `anon`
-- specifically turned out to be a no-op for these functions (see the
-- follow-up migration) -- their grant actually came from PUBLIC, not an
-- anon-specific entry. Kept for history; superseded immediately by
-- revoke_public_execute_staff_only_functions.

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
    execute format('revoke execute on function %s from anon', r.sig);
  end loop;
end $$;
