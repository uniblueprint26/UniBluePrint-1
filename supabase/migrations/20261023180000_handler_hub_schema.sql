-- ═══════════════════════════════════════════════════════════════════════════
-- Campus Handler Hub (Studio Phase 7) -- the Campus/Job-Search Handler team
-- is the one team that already had a live, working Supabase-backed review
-- pipeline (handler_queue / handler_assignments / handler_escalations /
-- submissions, built across 20260726110000_handler_pipeline.sql and
-- 20260727090000_escalation_performance_ops.sql) before any Studio hub ever
-- existed. This migration does NOT touch any of that -- claim_submission,
-- start_review, deliver_submission, flag_submission,
-- mark_submission_incomplete, submit_handler_decision,
-- fetch_operations_queue, list_active_handlers, reassign_submission,
-- cancel_submission, contact_student, record_claim_attempt and the
-- handler_notifications read/update paths all stay exactly as they are.
--
-- This adds three new, read-only SECURITY DEFINER RPCs so HandlerQueuePage's
-- new Studio Overview/Performance sections have something real to read:
--   1. get_handler_queue_snapshot()           -- StatStrip headline counts
--   2. get_handler_tickets_by_week()           -- opened-vs-resolved trend
--   3. get_handler_tickets_resolved_comparison -- ComparisonWidget feed
-- Same "additive, read-only reporting layer on top of an existing pipeline"
-- shape every prior Studio phase has used (Legal's contracts-resolved
-- comparison, Tech's ideas-triaged comparison, Outreach's contacts-signed
-- comparison, Marketing's deal-claims comparison).
--
-- Checked live before writing a single query (via Supabase MCP list_tables /
-- execute_sql, 2026-10-23): submissions, handler_queue, handler_assignments,
-- handler_escalations, handler_notifications, handler_ticket_reviews and
-- handler_performance_snapshots are ALL genuinely 0 rows today. This is a
-- real, working pipeline that is simply pre-launch -- exactly the same
-- honest state Outreach Hub's inbound pipeline found. Every metric below is
-- a real live query, excluding the 24 banned demo/QA accounts
-- (auth.users.banned_until = 'infinity') via submissions.user_id (the
-- student side -- a Handler's own account is never the thing being
-- filtered), the same exclusion every other Studio hub applies. An honest 0
-- today, not padded -- it fills in the moment a real student submission
-- moves through the real pipeline.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Shared role-check helper -- same is_X_admin() convention as
--    _is_legal_admin()/_is_tech_admin()/_is_outreach_admin()/
--    _is_marketing_admin(), already updated for co_director. Built with
--    co_director included from the start (unlike those four, which needed a
--    follow-up migration) since the handler route (src/App.jsx) already
--    gates on handler/operations/co_director. ──
create or replace function public._is_handler_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'handler')
    or public.has_role(auth.uid(), 'operations')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

revoke execute on function public._is_handler_admin() from public, anon;
grant execute on function public._is_handler_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. QUEUE SNAPSHOT -- the Overview section's StatStrip. "Open" = stage in
--    (in_queue, assigned, in_review), i.e. not yet delivered. Escalated and
--    overdue are always "right now" (same convention as get_ops_queue_times'
--    own unclaimed_overdue_count), the delivered/avg-resolution pair is
--    scoped to the current calendar week.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_handler_queue_snapshot()
returns table (
  open_tickets                    integer,
  unclaimed_tickets                integer,
  premium_open                    integer,
  standard_open                   integer,
  escalated_open                  integer,
  overdue_open                    integer,
  delivered_this_week             integer,
  avg_resolution_hours_this_week  numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_week_start timestamptz := date_trunc('week', now());
begin
  if not public._is_handler_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)::integer from public.submissions
      where stage in ('in_queue', 'assigned', 'in_review')
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.handler_queue hq
      join public.submissions s on s.id = hq.submission_id
      where hq.picked_at is null
        and s.user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions
      where stage in ('in_queue', 'assigned', 'in_review') and tier = 'premium'
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions
      where stage in ('in_queue', 'assigned', 'in_review') and tier = 'standard'
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.handler_escalations he
      join public.submissions s on s.id = he.submission_id
      where he.resolved = false
        and s.user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions
      where stage in ('in_queue', 'assigned', 'in_review')
        and turnaround_deadline is not null and turnaround_deadline < now()
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions
      where stage = 'delivered' and delivered_at >= v_week_start
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select round(avg(extract(epoch from (delivered_at - assigned_at)) / 3600.0), 1) from public.submissions
      where stage = 'delivered' and delivered_at >= v_week_start
        and assigned_at is not null
        and user_id not in (select id from auth.users where banned_until = 'infinity'));
end; $$;

revoke execute on function public.get_handler_queue_snapshot() from public, anon;
grant execute on function public.get_handler_queue_snapshot() to authenticated;

comment on function public.get_handler_queue_snapshot() is
  'Real, live Handler queue headline counts for the Studio Overview StatStrip -- open/unclaimed/premium/standard/escalated/overdue right now, plus delivered-this-week and its avg resolution time. Excludes banned demo/QA accounts via submissions.user_id. Genuinely all-zero today -- submissions/handler_queue/handler_escalations hold 0 rows (checked live), a real pre-launch pipeline, not a broken query.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. OPENED VS RESOLVED, BY WEEK -- a real 6-week trend (this week plus the
--    5 before it), including real-zero weeks rather than skipping them, the
--    same convention as get_marketing_early_access_signups_by_month /
--    get_outreach_partner_growth_by_month.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_handler_tickets_by_week()
returns table (week_label text, week_start date, opened_count integer, resolved_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_handler_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with weeks as (
    select (date_trunc('week', now())::date - (n * 7)) as week_start
    from generate_series(0, 5) as n
  )
  select
    to_char(w.week_start, 'DD Mon'),
    w.week_start,
    (select count(*)::integer from public.submissions s
      where s.submitted_at >= w.week_start and s.submitted_at < w.week_start + 7
        and s.user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions s
      where s.stage = 'delivered' and s.delivered_at >= w.week_start and s.delivered_at < w.week_start + 7
        and s.user_id not in (select id from auth.users where banned_until = 'infinity'))
  from weeks w
  order by w.week_start;
end; $$;

revoke execute on function public.get_handler_tickets_by_week() from public, anon;
grant execute on function public.get_handler_tickets_by_week() to authenticated;

comment on function public.get_handler_tickets_by_week() is
  'Real submissions.submitted_at / delivered_at counts, by calendar week, for the last 6 weeks (including this week) -- the Studio hero-chart trend of tickets opened vs resolved. Excludes banned demo/QA accounts. Includes genuine zero weeks rather than skipping them.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. COMPARISONWIDGET FEED -- tickets resolved this range vs the immediately
--    prior range of equal length. Same shape/signature convention as
--    get_legal_contracts_resolved_comparison / get_tech_ideas_triaged_
--    comparison / get_outreach_contacts_signed_comparison /
--    get_marketing_deal_claims_comparison. _range is day/week/month/year
--    only (matches _dashboard_range_start) -- never pass 'all' here.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_handler_tickets_resolved_comparison(_range text default 'week')
returns table (resolved_this_period integer, resolved_last_period integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not public._is_handler_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)::integer from public.submissions
      where stage = 'delivered' and delivered_at >= v_start
        and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.submissions
      where stage = 'delivered' and delivered_at >= v_prev_start and delivered_at < v_start
        and user_id not in (select id from auth.users where banned_until = 'infinity'));
end; $$;

revoke execute on function public.get_handler_tickets_resolved_comparison(text) from public, anon;
grant execute on function public.get_handler_tickets_resolved_comparison(text) to authenticated;

comment on function public.get_handler_tickets_resolved_comparison(text) is
  'Real count of submissions whose stage changed to delivered this range vs the immediately prior range of equal length -- the real feed behind the Handler Hub ComparisonWidget. Excludes banned demo/QA accounts. _range is day/week/month/year only.';
