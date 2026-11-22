-- Changes: revokes EXECUTE from public, anon and authenticated on 13 trigger functions created by the 20 Nov 2026 release migrations, and pins search_path on validate_date_of_birth. Destructive: no. Trigger functions do not need EXECUTE to fire. Undo: grant execute on function public.<name>() to public; and alter function public.validate_date_of_birth() reset search_path;
--
-- Found by the security advisors after the release apply. Same rule as 0900:
-- internal trigger functions must not be callable by clients.

do $$
declare
  fn text;
  r record;
begin
  foreach fn in array array[
    'campus_set_institution', 'busy_spots_before_insert', 'busy_spot_reports_check',
    'study_room_shares_before_insert', 'notify_on_study_room_change',
    'notify_interest_deal', 'notify_campus_event', 'notify_trending_post',
    'notify_followed_post', 'notify_weekly_issue_published', 'notify_coach_match',
    'notify_follower_update', 'notify_budget_goal_reached'
  ] loop
    for r in
      select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn
    loop
      execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    end loop;
  end loop;
end $$;

-- 0700 replaced this function without the search_path pin.
alter function public.validate_date_of_birth() set search_path = '';
