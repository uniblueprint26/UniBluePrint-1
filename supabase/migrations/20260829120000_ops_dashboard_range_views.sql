-- Real (non-demo) backing for the Operations Dashboard. Follows the existing
-- pattern from 20260810120100 (ops_queue_snapshot / get_ops_queue_snapshot):
-- every function here is security definer, checks operations/founder role
-- itself, and is the only way in -- nothing here exposes a raw grant on
-- public.submissions to those roles, since submissions stays user-owned RLS
-- otherwise.
--
-- get_ops_queue_snapshot() (right-now queue/urgency counts) and
-- sunday_queue_cap() already exist and are reused as-is below.

-- ── Shared range helper ──────────────────────────────────────────────────────
-- 'today' | 'week' | 'month' | 'year' | anything else = all time.
create or replace function public._dashboard_range_start(_range text)
returns timestamptz language sql immutable as $$
  select case lower(coalesce(_range, 'today'))
    when 'today' then date_trunc('day', now())
    when 'week'  then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    when 'year'  then date_trunc('year', now())
    else '-infinity'::timestamptz
  end
$$;

-- ── Queue timing + overdue ───────────────────────────────────────────────────
-- Averages are scoped to the chosen range (by when the ticket was
-- assigned/delivered); overdue is always "right now", same as the queue
-- snapshot tiles it sits alongside.
create or replace function public.get_ops_queue_times(_range text default 'today')
returns table (
  avg_assignment_minutes numeric,
  avg_delivery_hours numeric,
  overdue_count integer
)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    round(avg(extract(epoch from (s.assigned_at - s.in_queue_at)) / 60)
      filter (where s.assigned_at is not null and s.in_queue_at is not null and s.assigned_at >= v_start))::numeric,
    round(avg(extract(epoch from (s.delivered_at - s.assigned_at)) / 3600)
      filter (where s.delivered_at is not null and s.assigned_at is not null and s.delivered_at >= v_start))::numeric,
    (select count(*)::integer from public.submissions
       where deadline is not null and deadline < now() and stage <> 'delivered')
  from public.submissions s;
end; $$;

grant execute on function public.get_ops_queue_times(text) to authenticated;

-- ── Handler roster ───────────────────────────────────────────────────────────
-- Status is derived, not stored: Online = checked into a shift today and not
-- yet clocked out; On rota = has a declared availability window for today's
-- weekday but hasn't checked in; Offline otherwise. Rating comes from the
-- real handler_ratings table added in 20260828170000 -- null, not 0, when a
-- handler has no ratings yet, so the UI can show "not yet rated" honestly.
create or replace function public.get_handler_roster()
returns table (
  handler_id       uuid,
  name             text,
  status           text,
  active_tickets   integer,
  completed_today  integer,
  avg_rating       numeric,
  rating_count     integer,
  specialisms      text[],
  is_ghost         boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    ur.user_id,
    coalesce(p.full_name, 'Handler'),
    case
      when exists (
        select 1 from public.handler_shifts hs
        where hs.handler_id = ur.user_id
          and hs.scheduled_start::date = current_date
          and hs.checked_in_at is not null
          and hs.clocked_out_at is null
      ) then 'Online'
      when exists (
        select 1 from public.handler_availability ha
        where ha.handler_id = ur.user_id
          and ha.weekday = extract(isodow from now())::smallint
      ) then 'On rota'
      else 'Offline'
    end,
    (select count(*)::integer from public.submissions s where s.handler_id = ur.user_id and s.stage in ('assigned', 'in_review')),
    (select count(*)::integer from public.submissions s where s.handler_id = ur.user_id and s.stage = 'delivered' and s.delivered_at::date = current_date),
    hrs.avg_rating,
    coalesce(hrs.rating_count, 0),
    (select array_remove(array_agg(sv.name), null) from public.handler_specialisms hsp
       join public.services sv on sv.id = hsp.service_id where hsp.handler_id = ur.user_id),
    public.is_ghost_handler(ur.user_id)
  from public.user_roles ur
  left join public.profiles p on p.id = ur.user_id
  left join public.handler_rating_summary hrs on hrs.handler_id = ur.user_id
  where ur.role = 'handler';
end; $$;

grant execute on function public.get_handler_roster() to authenticated;

-- ── Sunday Queue ─────────────────────────────────────────────────────────────
-- cap reuses the existing sunday_queue_cap(). "Checked in" counts Handlers who
-- opted into this week's Monday rota and actually checked into that shift.
create or replace function public.get_sunday_queue_status()
returns table (
  depth                   integer,
  monday_rota_handlers    integer,
  declared_capacity_avg   numeric,
  checked_in              integer,
  cap                     integer
)
language plpgsql stable security definer set search_path = public as $$
declare v_monday date := date_trunc('week', now())::date;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)::integer from public.submissions where stage = 'in_queue'),
    (select count(*)::integer from public.handler_availability where weekday = 1 and rota_opt_in = true),
    (select round(avg(max_tickets)::numeric, 1) from public.handler_availability where weekday = 1 and rota_opt_in = true),
    (select count(distinct handler_id)::integer from public.handler_shifts
       where was_rota_shift = true and checked_in_at is not null and scheduled_start::date = v_monday),
    public.sunday_queue_cap();
end; $$;

grant execute on function public.get_sunday_queue_status() to authenticated;

-- ── Demand: campus and service type ─────────────────────────────────────────
-- Institution comes from profiles.university_or_field (free text captured at
-- signup) -- there is no separate institutions table yet, so this groups on
-- that column as-is, bucketing anything blank under "Not specified" rather
-- than dropping those submissions from the count.
create or replace function public.get_campus_demand(_range text default 'month')
returns table (institution text, submission_count integer)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(nullif(trim(p.university_or_field), ''), 'Not specified'), count(*)::integer
  from public.submissions s
  join public.profiles p on p.id = s.user_id
  where s.submitted_at >= v_start
  group by 1
  order by 2 desc
  limit 15;
end; $$;

grant execute on function public.get_campus_demand(text) to authenticated;

-- Reused for both "Requests by service type" and "Hottest outputs" (the
-- client calls this once per period and takes the top few names) -- one
-- grouping query, no separate "hottest" table to keep in sync.
create or replace function public.get_service_demand(_range text default 'month')
returns table (service_name text, submission_count integer)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select sv.name, count(*)::integer
  from public.submissions s
  join public.services sv on sv.id = s.service_id
  where s.submitted_at >= v_start
  group by sv.name
  order by 2 desc;
end; $$;

grant execute on function public.get_service_demand(text) to authenticated;

-- ── Tier mix ──────────────────────────────────────────────────────────────────
-- submissions.tier is set to 'premium' or 'standard' by the request flow (see
-- compute_queue_priority) -- 'premium' is what the UI calls "Pro" elsewhere.
-- protected_standard_count = undelivered Standard tickets, since every one of
-- those is actively covered by the 10-position protection rule right now.
create or replace function public.get_tier_mix(_range text default 'today')
returns table (premium_count integer, standard_count integer, protected_standard_count integer)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    count(*) filter (where s.tier = 'premium')::integer,
    count(*) filter (where s.tier = 'standard')::integer,
    count(*) filter (where s.tier = 'standard' and s.stage <> 'delivered')::integer
  from public.submissions s
  where s.submitted_at >= v_start;
end; $$;

grant execute on function public.get_tier_mix(text) to authenticated;
