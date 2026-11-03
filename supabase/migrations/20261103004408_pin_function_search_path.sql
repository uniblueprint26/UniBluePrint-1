-- Security advisor fix: function_search_path_mutable.
-- These 15 utility/trigger functions had no pinned search_path, which is a
-- classic (if low-severity here, since none are SECURITY DEFINER-sensitive
-- cross-schema movers) injection vector if a role can create objects that
-- shadow an unqualified name. Pin to 'public, pg_catalog' -- same effective
-- resolution order these functions already relied on, just explicit now.

do $$
declare
  r record;
  fnames text[] := ARRAY['ticket_urgency','_dashboard_range_start','set_gdpr_due_at',
    'touch_weekly_updated_at','touch_budget_goal_updated_at','touch_featured_content_updated_at',
    'is_valid_document_table','has_two_sentences','touch_partner_tier_assignments_updated_at',
    'validate_date_of_birth','touch_coach_contact_details_updated_at','touch_push_tokens_updated_at',
    'touch_lifestyle_partner_contact_details_updated_at','touch_coach_intro_call_offers_updated_at',
    '_noop_test_fn'];
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(fnames)
  loop
    execute format('alter function %s set search_path = ''public, pg_catalog''', r.sig);
  end loop;
end $$;
