-- Portals, Operations, and Dual-Portal schema.
--
-- Extends the existing schema (app_role, user_roles, has_role(), subscriptions,
-- notifications, handler_queue, coach_profiles) rather than duplicating it.
-- Every new table gets RLS from the outset. No table here is optional --
-- if a feature reads or writes data, its table and policy are both here.
--
-- Requires 20260810120000_portal_roles.sql to have run first (adds the
-- 'business' and 'founder' app_role values this file uses).
--
-- Euro figures are intentionally absent from this migration. Pricing has
-- changed since the source spec was written and is being finalised
-- separately; nothing here should be treated as a live price.

-- ── 1. Role model ────────────────────────────────────────────────────────────

-- Handlers and Coaches are mutually exclusive roles (per the Handler & Coach
-- system spec: "not permitted to hold both roles simultaneously"). Enforced
-- here, not just in the app.
create or replace function public.enforce_handler_coach_exclusivity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'handler' and public.has_role(new.user_id, 'coach') then
    raise exception 'A user cannot hold both the handler and coach roles at once.';
  end if;
  if new.role = 'coach' and public.has_role(new.user_id, 'handler') then
    raise exception 'A user cannot hold both the coach and handler roles at once.';
  end if;
  return new;
end; $$;

drop trigger if exists trg_handler_coach_exclusivity on public.user_roles;
create trigger trg_handler_coach_exclusivity
  before insert on public.user_roles
  for each row execute function public.enforce_handler_coach_exclusivity();

-- Link a 'business' role to the partner row it manages. A business user with
-- no row here can log in but the Partner Portal has nothing to scope to --
-- treat that as a setup error, not a silent empty state.
create table if not exists public.partner_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, partner_id)
);
alter table public.partner_users enable row level security;
create policy "partner_users_read_own" on public.partner_users
  for select to authenticated using (auth.uid() = user_id);
create policy "operations_manage_partner_users" on public.partner_users
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- ── 2. Active Member Pro Access ──────────────────────────────────────────────
-- Free Pro for active Handlers/Coaches. Kept distinct from a paid subscription
-- so Finance can tell the two apart (relevant to the benefit-in-kind tax
-- question flagged for legal review) and so it reverts/pauses on its own rules.
alter table public.subscriptions
  add column if not exists is_complimentary boolean not null default false,
  add column if not exists complimentary_reason text,
  add column if not exists complimentary_paused_at timestamptz,
  add column if not exists stripe_payment_method_fingerprint text;

comment on column public.subscriptions.is_complimentary is
  'True for Active Member Pro Access (comped to active Handlers/Coaches), false for a paid subscription.';
comment on column public.subscriptions.complimentary_paused_at is
  'Set when an Active Member goes inactive. Access is retained for 60 days from this timestamp, then reverts to free tier. Null while active or while paid.';

-- Same card cannot back two active Pro subscriptions at once (multiple-account
-- prevention layer 3: payment card linkage). Enforced as a real constraint,
-- not an app-side check, so it holds even if a client is compromised or buggy.
create unique index if not exists subscriptions_one_active_per_card
  on public.subscriptions (stripe_payment_method_fingerprint)
  where status = 'active' and stripe_payment_method_fingerprint is not null;

-- One phone number, one account (multiple-account prevention layer 5).
alter table public.profiles
  add column if not exists verified_phone text,
  add column if not exists device_fingerprint text,
  add column if not exists device_fingerprint_first_seen timestamptz;

create unique index if not exists profiles_one_account_per_phone
  on public.profiles (verified_phone) where verified_phone is not null;

-- ── 3. Handler availability, clock in/out, Ghost Handler protocol ──────────
create table if not exists public.handler_availability (
  id           uuid primary key default gen_random_uuid(),
  handler_id   uuid not null references auth.users(id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 6), -- 1=Mon .. 6=Sat, platform closed Sunday
  start_time   time not null,
  finish_time  time not null,
  max_tickets  smallint not null default 4,
  rota_opt_in  boolean not null default false, -- Monday morning rota
  updated_at   timestamptz default now(),
  unique (handler_id, weekday),
  check (finish_time > start_time)
);
alter table public.handler_availability enable row level security;
create policy "handlers_manage_own_availability" on public.handler_availability
  for all to authenticated using (auth.uid() = handler_id) with check (auth.uid() = handler_id);
create policy "operations_read_availability" on public.handler_availability
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

create table if not exists public.handler_shifts (
  id                 uuid primary key default gen_random_uuid(),
  handler_id         uuid not null references auth.users(id) on delete cascade,
  scheduled_start    timestamptz not null,
  checked_in_at      timestamptz,
  clocked_out_at     timestamptz,
  was_rota_shift     boolean not null default false,
  missed_checkin     boolean not null default false, -- true if the 30-min check-in window elapsed with no check-in
  tickets_returned   integer not null default 0,      -- count returned to queue on clock-out or missed check-in
  created_at         timestamptz default now()
);
alter table public.handler_shifts enable row level security;
create policy "handlers_manage_own_shifts" on public.handler_shifts
  for all to authenticated using (auth.uid() = handler_id) with check (auth.uid() = handler_id);
create policy "operations_read_shifts" on public.handler_shifts
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- Ghost Handler protocol: 3 missed check-ins in 7 days auto-suspends
-- availability and removes rota opt-in. Read by Operations, not auto-actioned
-- here -- an Edge Function (see docs/PORTALS_AND_OPERATIONS_SPEC.md) should
-- call this on a schedule and act on the result.
create or replace function public.handler_missed_checkins_last_7_days(_handler_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.handler_shifts
  where handler_id = _handler_id
    and missed_checkin = true
    and scheduled_start > now() - interval '7 days'
$$;

create or replace function public.is_ghost_handler(_handler_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.handler_missed_checkins_last_7_days(_handler_id) >= 3
$$;

-- ── 4. Handler specialisation system ────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'specialism_confidence') then
    create type public.specialism_confidence as enum ('developing', 'comfortable', 'strong');
  end if;
end $$;

create table if not exists public.handler_specialisms (
  id                 uuid primary key default gen_random_uuid(),
  handler_id         uuid not null references auth.users(id) on delete cascade,
  service_id         uuid not null references public.services(id) on delete cascade,
  confidence         public.specialism_confidence not null default 'developing',
  declared_at        timestamptz default now(),
  tickets_completed  integer not null default 0,
  rating_sum         numeric not null default 0,   -- accumulate here, divide by tickets_completed for average
  approved_by        uuid references auth.users(id), -- Operations sign-off on a confidence upgrade
  approved_at        timestamptz,
  unique (handler_id, service_id)
);
alter table public.handler_specialisms enable row level security;
create policy "handlers_read_own_specialisms" on public.handler_specialisms
  for select to authenticated using (auth.uid() = handler_id);
create policy "handlers_declare_own_specialisms" on public.handler_specialisms
  for insert to authenticated with check (auth.uid() = handler_id);
create policy "operations_manage_specialisms" on public.handler_specialisms
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- First 10 tickets: declared confidence is the tiebreaker. After 10 tickets:
-- actual performance (rating average) replaces it as the primary signal.
-- False-declaration protection: if a Handler declares 'strong' but sits
-- consistently below the platform average after 10+ tickets, confidence steps
-- down one level automatically -- framed as developmental, never punitive,
-- so it's a quiet downgrade, not a flag.
create or replace function public.reassess_specialism_confidence()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_avg numeric;
  v_platform_avg numeric;
begin
  if new.tickets_completed < 10 then
    return new;
  end if;
  v_avg := new.rating_sum / greatest(new.tickets_completed, 1);
  select avg(rating_sum / greatest(tickets_completed, 1)) into v_platform_avg
  from public.handler_specialisms where service_id = new.service_id and tickets_completed >= 10;

  if new.confidence = 'strong' and v_avg < coalesce(v_platform_avg, v_avg) then
    new.confidence := 'comfortable';
  end if;
  return new;
end; $$;

drop trigger if exists trg_reassess_specialism on public.handler_specialisms;
create trigger trg_reassess_specialism
  before update on public.handler_specialisms
  for each row execute function public.reassess_specialism_confidence();

-- ── 5. Prompt library ────────────────────────────────────────────────────────
create table if not exists public.prompt_library (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid references public.services(id) on delete set null,
  title        text not null,
  prompt_text  text not null,
  created_by   uuid references auth.users(id),
  active       boolean not null default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.prompt_library enable row level security;
create policy "handlers_read_prompt_library" on public.prompt_library
  for select to authenticated
  using (active = true and (public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')));
create policy "operations_manage_prompt_library" on public.prompt_library
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- ── 6. Foundation Blueprint request validation ──────────────────────────────
-- Mandatory self-declaration before submission, and a place to record a
-- name-mismatch flag for Operations review, per the request validation spec.
alter table public.submissions
  add column if not exists self_declaration_confirmed boolean not null default false,
  add column if not exists submitted_name text,
  add column if not exists name_mismatch_flag boolean not null default false,
  add column if not exists deadline timestamptz;

create or replace function public.flag_submission_name_mismatch()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_full_name text;
begin
  select full_name into v_full_name from public.profiles where id = new.user_id;
  if v_full_name is not null and new.submitted_name is not null
     and lower(trim(v_full_name)) <> lower(trim(new.submitted_name)) then
    new.name_mismatch_flag := true;
  end if;
  return new;
end; $$;

drop trigger if exists trg_flag_name_mismatch on public.submissions;
create trigger trg_flag_name_mismatch
  before insert or update on public.submissions
  for each row execute function public.flag_submission_name_mismatch();

-- ── 7. Deadline urgency + handler assignment algorithm ──────────────────────
-- Colour coding: green (plenty of time), amber (approaching), red (imminent).
-- A Standard ticket that goes red is elevated to equal urgency as Premium
-- regardless of tier -- this function is that elevation, computed, not
-- stored, so it is always correct against the current time.
create or replace function public.ticket_urgency(_deadline timestamptz, _tier text)
returns text language sql stable as $$
  select case
    when _deadline is null then 'green'
    when _deadline < now() + interval '6 hours' then 'red'
    when _deadline < now() + interval '24 hours' then 'amber'
    else 'green'
  end
$$;

comment on function public.ticket_urgency(timestamptz, text) is
  'Standard tickets returning red are treated as equal-urgency to Premium in the queue UI -- apply that elevation in the client, this function only reports the colour.';

-- Assignment priority: Pro above free-tier Standard, but a free-tier Standard
-- ticket can never be pushed back more than 10 positions by Pro volume. This
-- computes a priority score for handler_queue.priority (higher = picked
-- first); the cap is enforced by bounding how low a Standard ticket's score
-- can fall relative to its natural queue position, not by uncapped subtraction.
create or replace function public.compute_queue_priority(_submission_id uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_tier text;
  v_urgency text;
  v_deadline timestamptz;
  v_base integer;
  v_standard_position integer;
begin
  select tier, deadline into v_tier, v_deadline from public.submissions where id = _submission_id;
  v_urgency := public.ticket_urgency(v_deadline, v_tier);

  v_base := case
    when v_tier = 'premium' then 300
    when v_tier = 'standard' and v_urgency = 'red' then 250 -- elevated to Premium-equal urgency
    else 100
  end;

  if v_tier = 'standard' then
    select count(*) into v_standard_position
    from public.handler_queue hq
    join public.submissions s on s.id = hq.submission_id
    where s.tier = 'standard'
      and hq.queued_at < (select queued_at from public.handler_queue where submission_id = _submission_id);
    v_base := greatest(v_base, 100 - least(coalesce(v_standard_position, 0), 10));
  end if;

  return v_base;
end; $$;

comment on function public.compute_queue_priority(uuid) is
  'Call on insert into handler_queue and periodically to refresh urgency-driven elevation. Deploy as a scheduled Edge Function job (see docs/PORTALS_AND_OPERATIONS_SPEC.md) -- this function computes the score, it does not run itself.';

-- Capacity gaming detection: flagged (not auto-actioned) if a Handler's
-- average completion time is under 50% of their declared session duration,
-- consistently, over 3+ weeks. Quality score must be cross-referenced before
-- any action, so this only flags -- a human decides what happens next.
-- v1 approximation: uses the Handler's first declared availability window as
-- a stand-in for session duration on any given day. Refine to match the
-- actual day-of-week window once volume makes that worth the extra join.
create or replace function public.flag_capacity_gaming(_handler_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(avg(
    case when extract(epoch from (delivered_at - assigned_at)) <
      0.5 * extract(epoch from (
        (select (finish_time - start_time) from public.handler_availability
         where handler_id = _handler_id limit 1)
      ))
    then 1 else 0 end
  ), 0) > 0.5
  from public.submissions
  where handler_id = _handler_id
    and delivered_at > now() - interval '21 days'
    and assigned_at is not null and delivered_at is not null
$$;

-- Ticket changing hands twice triggers an automatic Operations escalation.
alter table public.handler_assignments
  add column if not exists handoff_number smallint not null default 1;

create or replace function public.escalate_on_second_handoff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.handoff_number >= 2 then
    insert into public.operations_flags (target_type, target_id, reason)
    values ('submission', new.submission_id, 'Ticket reassigned twice, automatic escalation');
    insert into public.notifications (user_id, category, title, message)
    select user_id, 'ticket_reassigned', 'Your request has a new Handler',
           'Your request was reassigned to keep things moving. Updated delivery time coming shortly.'
    from public.submissions where id = new.submission_id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_escalate_second_handoff on public.handler_assignments;
create trigger trg_escalate_second_handoff
  after insert on public.handler_assignments
  for each row execute function public.escalate_on_second_handoff();

-- ── 8. Sunday Queue ──────────────────────────────────────────────────────────
-- Cap = number of confirmed Monday rota Handlers x 70% of their declared
-- capacity. Conservative by design, per the spec.
create or replace function public.sunday_queue_cap()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(floor(sum(ha.max_tickets) * 0.7), 0)::integer
  from public.handler_availability ha
  where ha.rota_opt_in = true and ha.weekday = 1 -- Monday
$$;

grant execute on function public.sunday_queue_cap() to authenticated;

-- ── 9. Lifestyle Blueprint access control, database level ──────────────────
-- Two-layer protection: Mental Health is technically separated from every
-- other category, and a free user's query for a non-Mental-Health deal
-- returns nothing at the database level regardless of what the UI shows.
-- Two permissive SELECT policies are OR'd by Postgres RLS: a free user's
-- session only satisfies the first, a Pro user's session satisfies both.
drop policy if exists "Authenticated can read active deals" on public.deals;

create or replace function public.user_has_active_pro(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = _user_id
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  )
$$;

create policy "deals_mental_health_always_free" on public.deals
  for select to authenticated
  using (
    active = true
    and exists (select 1 from public.partners p where p.id = deals.partner_id and p.type = 'mental-health')
  );

create policy "deals_pro_only_non_mental_health" on public.deals
  for select to authenticated
  using (
    active = true
    and not exists (select 1 from public.partners p where p.id = deals.partner_id and p.type = 'mental-health')
    and public.user_has_active_pro(auth.uid())
  );

-- ── 10. Partner performance stats (Lifestyle Partner Portal) ───────────────
-- Reuses activity_events rather than a new events table. 'partner_deal_viewed'
-- and 'partner_deal_claimed' join to this via detail = partner_id::text.
-- Aggregate view, not a stored table, so it is always current.
--
-- The view itself is revoked from every role. Access happens only through
-- the two functions below, so a business role structurally cannot read
-- another partner's row by querying the view directly -- there is nothing to
-- query. get_my_partner_stats() returns exactly one row: the caller's own.
create or replace view public.partner_performance_stats as
select
  p.id as partner_id,
  p.name as partner_name,
  p.type as category,
  count(*) filter (where ae.type = 'partner_deal_viewed')  as views,
  count(*) filter (where ae.type = 'partner_deal_claimed') as claims,
  count(distinct ae.user_id) as unique_engaged_users
from public.partners p
left join public.activity_events ae on ae.detail = p.id::text
group by p.id, p.name, p.type;

revoke all on public.partner_performance_stats from public, anon, authenticated;

create or replace function public.get_my_partner_stats()
returns setof public.partner_performance_stats language sql stable security definer set search_path = public as $$
  select pps.* from public.partner_performance_stats pps
  join public.partner_users pu on pu.partner_id = pps.partner_id
  where pu.user_id = auth.uid()
$$;

create or replace function public.get_all_partner_stats()
returns setof public.partner_performance_stats language sql stable security definer set search_path = public as $$
  select * from public.partner_performance_stats
  where public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')
$$;

create or replace function public.partner_category_benchmark(_category text)
returns table(avg_views numeric, avg_claims numeric, median_views numeric)
language sql stable security definer set search_path = public as $$
  select avg(views), avg(claims), percentile_cont(0.5) within group (order by views)
  from public.partner_performance_stats where category = _category
$$;

grant execute on function public.get_my_partner_stats() to authenticated;
grant execute on function public.get_all_partner_stats() to authenticated;
grant execute on function public.partner_category_benchmark(text) to authenticated;

-- ── 11. Founder / Operations dashboard views ────────────────────────────────
-- Founder and Operations only. Never exposed to a business, handler, or coach
-- role, since this aggregates across the whole platform. Same revoke-the-view,
-- gate-with-a-function pattern as partner stats above -- a view's own select
-- grant does not consult RLS on the tables it joins in every case, so the
-- function is the actual access boundary here, not the view.
create or replace view public.ops_queue_snapshot as
select
  count(*) filter (where s.stage = 'in_queue')  as queued,
  count(*) filter (where s.stage = 'assigned' or s.stage = 'in_review') as in_progress,
  count(*) filter (where s.stage = 'delivered' and s.delivered_at::date = current_date) as completed_today,
  count(*) filter (where public.ticket_urgency(s.deadline, s.tier) = 'red'   and s.stage <> 'delivered') as red_count,
  count(*) filter (where public.ticket_urgency(s.deadline, s.tier) = 'amber' and s.stage <> 'delivered') as amber_count,
  count(*) filter (where public.ticket_urgency(s.deadline, s.tier) = 'green' and s.stage <> 'delivered') as green_count
from public.submissions s;

revoke all on public.ops_queue_snapshot from public, anon, authenticated;

create or replace function public.get_ops_queue_snapshot()
returns setof public.ops_queue_snapshot language sql stable security definer set search_path = public as $$
  select * from public.ops_queue_snapshot
  where public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')
$$;

grant execute on function public.get_ops_queue_snapshot() to authenticated;

-- ── 12. Realtime ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'handler_shifts') then
    alter publication supabase_realtime add table public.handler_shifts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'handler_queue') then
    alter publication supabase_realtime add table public.handler_queue;
  end if;
end $$;
