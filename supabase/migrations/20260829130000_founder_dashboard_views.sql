-- Real (non-demo) backing for the Founder Dashboard. Same pattern as
-- 20260829120000 (Operations): every function is security definer, checks
-- operations/founder itself, and is the only way in.
--
-- Also closes an access-control gap from 20260828170000: the two aggregate
-- views added there (handler_rating_summary, coach_enquiry_counts) were
-- created without revoking Supabase's default authenticated-role grant, so
-- any signed-in user could currently select them directly and see
-- platform-wide handler ratings / coach enquiry volume. Revoked below and
-- re-exposed only through gated functions, matching partner_performance_stats.
-- coach_rating_summary is left readable -- coach_ratings' own RLS already
-- treats individual ratings as visible to any authenticated user (this is
-- the same data, aggregated), so there is nothing to additionally protect.

-- ── Close the gap ─────────────────────────────────────────────────────────────
revoke all on public.handler_rating_summary from public, anon, authenticated;
revoke all on public.coach_enquiry_counts from public, anon, authenticated;
grant select on public.coach_rating_summary to authenticated;

create or replace function public.get_coach_enquiry_counts()
returns setof public.coach_enquiry_counts language sql stable security definer set search_path = public as $$
  select * from public.coach_enquiry_counts
  where public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')
$$;
grant execute on function public.get_coach_enquiry_counts() to authenticated;

-- ── Top-line stats ────────────────────────────────────────────────────────────
-- No delta/trend columns -- there is no historical snapshot table yet to
-- compare against, so the dashboard shows current totals only rather than a
-- fabricated or misleading period-over-period change.
create or replace function public.get_founder_topline(_range text default 'month')
returns table (
  total_members           integer,
  pro_subscribers         integer,
  free_members            integer,
  active_handlers         integer,
  coach_profiles_listed   integer,
  active_partners         integer,
  foundation_submissions  integer,
  coach_enquiries         integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_total integer;
  v_pro integer;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  select count(*) into v_total from public.profiles;
  select count(*) into v_pro from public.subscriptions where status = 'active';

  return query
  select
    v_total,
    v_pro,
    greatest(v_total - v_pro, 0),
    (select count(*)::integer from public.user_roles where role = 'handler'),
    (select count(*)::integer from public.coach_profiles),
    (select count(*)::integer from public.partners where active = true),
    (select count(*)::integer from public.submissions s
       join public.services sv on sv.id = s.service_id
       where sv.category = 'Foundation Blueprint' and s.submitted_at >= v_start),
    (select count(*)::integer from public.coach_enquiries where created_at >= v_start);
end; $$;

grant execute on function public.get_founder_topline(text) to authenticated;

-- ── Feature engagement ───────────────────────────────────────────────────────
-- Grouped straight off activity_events.type. Several pillars (Campus Connect,
-- Course Compass, Budgeting, Ad Board) have no logging wired up yet, so they
-- will not appear here at all rather than show a fabricated zero row -- the
-- dashboard caption should say so, this function just reports what's real.
create or replace function public.get_feature_engagement(_range text default 'month')
returns table (event_type text, event_count integer)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select ae.type, count(*)::integer
  from public.activity_events ae
  where ae.created_at >= v_start
  group by ae.type
  order by 2 desc;
end; $$;

grant execute on function public.get_feature_engagement(text) to authenticated;

-- ── Weekly sign-ups, last 12 weeks ──────────────────────────────────────────
create or replace function public.get_weekly_signups()
returns table (week_start date, signups integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select gs.week_start::date, count(p.id)::integer
  from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') as gs(week_start)
  left join public.profiles p
    on p.created_at >= gs.week_start and p.created_at < gs.week_start + interval '1 week'
  group by gs.week_start
  order by gs.week_start;
end; $$;

grant execute on function public.get_weekly_signups() to authenticated;

-- ── Campus breakdown ─────────────────────────────────────────────────────────
-- Member count is all-time (a member doesn't stop belonging to their
-- institution when the reporting period rolls over); submission count is
-- range-scoped.
create or replace function public.get_campus_breakdown(_range text default 'month')
returns table (institution text, member_count integer, submission_count integer)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    coalesce(nullif(trim(p.university_or_field), ''), 'Not specified'),
    count(distinct p.id)::integer,
    count(s.id) filter (where s.submitted_at >= v_start)::integer
  from public.profiles p
  left join public.submissions s on s.user_id = p.id
  group by 1
  order by 2 desc
  limit 15;
end; $$;

grant execute on function public.get_campus_breakdown(text) to authenticated;

-- ── Retention snapshot ───────────────────────────────────────────────────────
-- cancellation_rate is scoped to the chosen range: cancellations recorded in
-- that period against the pool of everyone currently active or who canceled
-- in it. avg_active_sub_months is tenure-so-far for currently active
-- subscriptions, not a completed-lifecycle average (there isn't enough
-- history yet to compute that honestly).
create or replace function public.get_retention_snapshot(_range text default 'month')
returns table (
  active_pro_count       integer,
  canceled_in_range      integer,
  cancellation_rate      numeric,
  avg_active_sub_months  numeric,
  conversion_rate        numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_active integer;
  v_canceled integer;
  v_total_members integer;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  select count(*) into v_active from public.subscriptions where status = 'active';
  select count(*) into v_canceled from public.subscriptions where status = 'canceled' and updated_at >= v_start;
  select count(*) into v_total_members from public.profiles;

  return query
  select
    v_active,
    v_canceled,
    round((v_canceled::numeric / nullif(v_active + v_canceled, 0)) * 100, 1),
    (select round((avg(extract(epoch from (now() - created_at))) / 2629800)::numeric, 1)
       from public.subscriptions where status = 'active'),
    round((v_active::numeric / nullif(v_total_members, 0)) * 100, 1);
end; $$;

grant execute on function public.get_retention_snapshot(text) to authenticated;
