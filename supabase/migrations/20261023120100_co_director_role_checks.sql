-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Director Hub (Studio Phase 6), part 2 of 3 -- wire the new 'co_director'
-- role into every internal role-check that gates the FIVE existing Studio
-- hubs (Finance/Legal/Tech/Outreach/Marketing) + the generic team_tasks
-- table they all share, so a co_director's route access (src/App.jsx) and
-- the underlying data actually agree. Per the founder's own brief
-- ("Co-Director (Daniel), full founder-equivalent access"), co_director is
-- added everywhere 'founder' already appears below -- never granted a
-- wider check than founder already has.
--
-- Found via `grep -rn "_is_.*_admin\|has_role(auth.uid()" supabase/migrations`:
--   - _is_legal_admin() / _is_tech_admin() / _is_outreach_admin() /
--     _is_marketing_admin() -- the named "is_X_admin()" helper every Legal/
--     Tech/Outreach/Marketing RPC calls (exactly the pattern the brief asked
--     to grep for).
--   - _is_team_member_or_admin(_team) -- the generic helper behind
--     get_team_roster/list_team_tasks/create_team_task/update_team_task/
--     set_team_task_status (TaskBoard, reused by all four of those hubs).
--     Adding co_director here as a standing OR (not tied to a specific
--     _team value) gives Daniel real read/write on every team's task board,
--     the same "team-wide, not per-team" access founder/admin already have.
--   - is_partner_tier_admin() / is_finance_or_founder() -- the Finance Hub's
--     own named helpers (20261012100000_partner_tiering_framework.sql),
--     behind set_partner_tier/set_payment_option/set_founding_badge/
--     record_negotiated_rate/get_partner_tier_admin_list -- the Client
--     Register / Tier Scorecard / A/B Revenue Model section of
--     FinanceDashboardPage. Updating these two helpers alone fixes that
--     whole section for co_director, nothing else to touch there.
--   - Finance Hub's OWN revenue/margin/payout RPCs
--     (20261022120000_studio_finance_hub_banned_exclusion_and_money_
--     requests.sql, 20260829140000_finance_dashboard_views.sql) do NOT go
--     through a named helper -- each one inlines
--     `has_role(auth.uid(),'finance') or has_role(auth.uid(),'founder')`
--     directly. Re-defined below one by one (same signature, no caller
--     changes) to add co_director alongside founder. Pre-existing gap,
--     left as found and NOT fixed here: most of these don't check 'admin'
--     either (only money_requests' RLS policy and decide_money_request do)
--     -- that inconsistency predates this phase and is a Finance-hub
--     decision, not a co_director one; co_director is added strictly
--     alongside founder, matching what "founder-equivalent" actually means
--     for each function as it stands today.
--
-- Deliberately NOT touched here (judgment call, flagged in the handback
-- report): Founder Dashboard / Operations Dashboard / Handler Queue /
-- Partner Portal's own legacy RPCs and RLS policies. Those predate the
-- Studio rebuild, check 'founder'/'operations'/'handler'/'business' inline
-- across dozens of functions/policies scattered through ~15 older
-- migrations, and rewriting all of that is the "cross-cutting access/
-- request system" + "Founder Dashboard heavy redesign" work the brief
-- explicitly marks out of scope for this pass. Part A's route gates
-- (src/App.jsx) still get 'co_director' added for those four routes too --
-- Daniel can open them -- but their data layer is unchanged, same as the
-- day before this migration. This is the literal reading of the brief's own
-- caution: "Do not grant co_director silently elevated DB privileges beyond
-- what route-gating does."
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Legal / Tech / Outreach / Marketing named "is_X_admin()" helpers ──────
create or replace function public._is_legal_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'legal')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

create or replace function public._is_tech_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'tech')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

create or replace function public._is_outreach_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'outreach')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

create or replace function public._is_marketing_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'marketing')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

-- ── Generic team_tasks helper (TaskBoard, reused by all four hubs above) ──
create or replace function public._is_team_member_or_admin(_team text)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role::text = _team)
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

-- ── Finance Hub's Client Register / Tier Scorecard / A/B Revenue Model ────
create or replace function public.is_finance_or_founder(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'finance')
      or public.has_role(_user_id, 'founder')
      or public.has_role(_user_id, 'co_director')
$$;

create or replace function public.is_partner_tier_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'finance')
      or public.has_role(_user_id, 'founder')
      or public.has_role(_user_id, 'operations')
      or public.has_role(_user_id, 'co_director')
$$;

-- record_negotiated_rate's recorded_by_role_snapshot case statement -- a
-- cosmetic audit-trail label, not an access check (is_finance_or_founder()
-- above is the actual gate) -- updated so a co_director's own negotiated-
-- rate entries log 'co_director', not a blank snapshot.
create or replace function public.record_negotiated_rate(
  _entity_type text,
  _entity_id uuid,
  _negotiated_commission_pct numeric,
  _rationale text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_log_id uuid;
begin
  if not public.is_finance_or_founder(auth.uid()) then
    raise exception 'Only finance or founder can record a negotiated rate.';
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;
  if _negotiated_commission_pct is null or _negotiated_commission_pct < 0 or _negotiated_commission_pct > 100 then
    raise exception 'negotiated_commission_pct must be between 0 and 100.';
  end if;
  if _rationale is null or length(trim(_rationale)) = 0 then
    raise exception 'A rationale is required to record a negotiated rate.';
  end if;

  v_role := case
    when public.has_role(auth.uid(), 'founder') then 'founder'
    when public.has_role(auth.uid(), 'co_director') then 'co_director'
    when public.has_role(auth.uid(), 'finance') then 'finance'
    else null
  end;

  insert into public.partner_negotiation_log (
    entity_type, partner_id, coach_profile_id,
    negotiated_commission_pct, rationale, recorded_by, recorded_by_role_snapshot
  ) values (
    _entity_type,
    case when _entity_type = 'partner' then _entity_id end,
    case when _entity_type = 'coach' then _entity_id end,
    _negotiated_commission_pct, trim(_rationale), auth.uid(), v_role
  )
  returning id into v_log_id;

  perform public.set_payment_option(_entity_type, _entity_id, 'negotiated');

  return v_log_id;
end; $$;

-- ── Finance Hub's own revenue/margin/payout RPCs -- inline role checks,
--    no named helper, so each is re-defined individually (same signature). ──
create or replace function public.get_finance_revenue_snapshot(_range text default 'month')
returns table (
  active_pro_monthly           integer,
  active_pro_annual            integer,
  new_subscriptions_in_range   integer,
  canceled_in_range            integer,
  estimated_mrr_cents          integer,
  estimated_arr_cents          integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_monthly integer;
  v_annual integer;
  v_monthly_price constant integer := 699;
  v_annual_price  constant integer := 4999;
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  select count(*) filter (where tier = 'pro_monthly') into v_monthly
    from public.subscriptions
    where status = 'active' and user_id not in (select id from auth.users where banned_until = 'infinity');
  select count(*) filter (where tier = 'pro_annual') into v_annual
    from public.subscriptions
    where status = 'active' and user_id not in (select id from auth.users where banned_until = 'infinity');

  return query
  select
    v_monthly,
    v_annual,
    (select count(*)::integer from public.subscriptions
      where created_at >= v_start and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (select count(*)::integer from public.subscriptions
      where status = 'canceled' and updated_at >= v_start and user_id not in (select id from auth.users where banned_until = 'infinity')),
    (v_monthly * v_monthly_price) + round(v_annual * v_annual_price / 12.0)::integer,
    (v_monthly * v_monthly_price * 12) + (v_annual * v_annual_price);
end; $$;

create or replace function public.get_finance_one_time_payments_summary(_range text default 'month')
returns table (
  foundation_payments_count      integer,
  foundation_revenue_cents       bigint,
  coach_payments_count           integer,
  coach_revenue_cents            bigint,
  board_listing_payments_count   integer,
  board_listing_revenue_cents    bigint,
  total_one_time_revenue_cents   bigint
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_foundation_count integer;
  v_foundation_cents bigint;
  v_coach_count integer;
  v_coach_cents bigint;
  v_board_count integer;
  v_board_cents bigint;
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  select count(*)::integer, coalesce(sum(amount_cents), 0)::bigint
  into v_foundation_count, v_foundation_cents
  from public.foundation_payments
  where status = 'paid' and paid_at >= v_start
    and user_id not in (select id from auth.users where banned_until = 'infinity');

  select count(*)::integer, coalesce(sum(amount_cents), 0)::bigint
  into v_coach_count, v_coach_cents
  from public.coach_payments
  where status = 'paid' and paid_at >= v_start
    and user_id not in (select id from auth.users where banned_until = 'infinity');

  select count(*)::integer, coalesce(sum(amount_cents), 0)::bigint
  into v_board_count, v_board_cents
  from public.board_listing_payments
  where status = 'paid' and paid_at >= v_start
    and user_id not in (select id from auth.users where banned_until = 'infinity');

  return query
  select
    v_foundation_count, v_foundation_cents,
    v_coach_count, v_coach_cents,
    v_board_count, v_board_cents,
    (v_foundation_cents + v_coach_cents + v_board_cents);
end; $$;

create or replace function public.get_finance_coach_payout_summary()
returns table (
  pending_count            integer,
  pending_amount_cents     bigint,
  transferred_count        integer,
  transferred_amount_cents bigint,
  failed_count             integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    count(*) filter (where t.status = 'pending')::integer,
    coalesce(sum(t.gross_amount_cents) filter (where t.status = 'pending'), 0)::bigint,
    count(*) filter (where t.status = 'transferred')::integer,
    coalesce(sum(t.coach_share_cents) filter (where t.status = 'transferred'), 0)::bigint,
    count(*) filter (where t.status = 'failed')::integer
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where p.user_id not in (select id from auth.users where banned_until = 'infinity');
end; $$;

create or replace function public.get_finance_pending_coach_payouts()
returns table (
  id                 uuid,
  coach_slug         text,
  gross_amount_cents integer,
  pending_reason     text,
  commission_pct     numeric,
  coach_share_cents  integer,
  attempted_at       timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select t.id, t.coach_slug, t.gross_amount_cents, t.pending_reason, t.commission_pct, t.coach_share_cents, t.attempted_at
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where t.status = 'pending'
    and p.user_id not in (select u.id from auth.users u where u.banned_until = 'infinity')
  order by t.attempted_at desc
  limit 100;
end; $$;

create or replace function public.get_finance_revenue_by_tier(_range text default 'month')
returns table (
  tier                text,
  payments_count      integer,
  revenue_cents       bigint
)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    coalesce(pta.tier, 'unassigned')::text,
    count(*)::integer,
    coalesce(sum(p.amount_cents), 0)::bigint
  from public.coach_payments p
  join public.coach_profiles cp on cp.coach_slug = p.coach_slug
  left join public.partner_tier_assignments pta on pta.coach_profile_id = cp.id
  where p.status = 'paid' and p.paid_at >= v_start
    and p.user_id not in (select id from auth.users where banned_until = 'infinity')
  group by coalesce(pta.tier, 'unassigned')
  order by revenue_cents desc;
end; $$;

create or replace function public.get_finance_margin_summary(_range text default 'month')
returns table (
  gross_collected_cents     bigint,
  paid_to_coaches_cents     bigint,
  ubp_margin_cents          bigint,
  margin_pct                numeric,
  transfers_counted         integer
)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    coalesce(sum(t.gross_amount_cents), 0)::bigint,
    coalesce(sum(t.coach_share_cents), 0)::bigint,
    coalesce(sum(t.gross_amount_cents - t.coach_share_cents), 0)::bigint,
    case when coalesce(sum(t.gross_amount_cents), 0) = 0 then null
      else round(100.0 * sum(t.gross_amount_cents - t.coach_share_cents) / sum(t.gross_amount_cents), 1)
    end,
    count(*)::integer
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where t.status in ('transferred', 'pending')
    and t.attempted_at >= v_start
    and p.user_id not in (select id from auth.users where banned_until = 'infinity');
end; $$;

create or replace function public.get_finance_payout_failure_queue()
returns table (
  id              uuid,
  coach_slug      text,
  gross_amount_cents integer,
  error_message   text,
  attempted_at    timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select t.id, t.coach_slug, t.gross_amount_cents, t.error_message, t.attempted_at
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where t.status = 'failed'
    and p.user_id not in (select u.id from auth.users u where u.banned_until = 'infinity')
  order by t.attempted_at desc
  limit 100;
end; $$;

create or replace function public.get_finance_revenue_by_cohort()
returns table (
  signup_month    date,
  payments_count  integer,
  revenue_cents   bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    date_trunc('month', pr.created_at)::date,
    count(*)::integer,
    coalesce(sum(p.amount_cents), 0)::bigint
  from public.coach_payments p
  join public.profiles pr on pr.id = p.user_id
  where p.status = 'paid'
    and p.user_id not in (select id from auth.users where banned_until = 'infinity')
  group by date_trunc('month', pr.created_at)
  order by 1;
end; $$;

create or replace function public.get_finance_coach_revenue_comparison(_range text default 'week')
returns table (
  coach_profile_id        uuid,
  coach_slug               text,
  revenue_cents_this_period bigint,
  revenue_cents_last_period bigint,
  rank_this_period          integer,
  coaches_with_revenue      integer
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  with this_period as (
    select cp.id as coach_profile_id, cp.coach_slug, coalesce(sum(p.amount_cents), 0)::bigint as revenue_cents
    from public.coach_profiles cp
    left join public.coach_payments p on p.coach_slug = cp.coach_slug
      and p.status = 'paid' and p.paid_at >= v_start
      and p.user_id not in (select id from auth.users where banned_until = 'infinity')
    group by cp.id, cp.coach_slug
  ),
  last_period as (
    select cp.id as coach_profile_id, coalesce(sum(p.amount_cents), 0)::bigint as revenue_cents
    from public.coach_profiles cp
    left join public.coach_payments p on p.coach_slug = cp.coach_slug
      and p.status = 'paid' and p.paid_at >= v_prev_start and p.paid_at < v_start
      and p.user_id not in (select id from auth.users where banned_until = 'infinity')
    group by cp.id
  ),
  ranked as (
    select t.coach_profile_id, t.coach_slug, t.revenue_cents,
      rank() over (order by t.revenue_cents desc) as rnk,
      count(*) filter (where t.revenue_cents > 0) over () as with_revenue
    from this_period t
  )
  select r.coach_profile_id, r.coach_slug, r.revenue_cents, coalesce(l.revenue_cents, 0), r.rnk::integer, r.with_revenue::integer
  from ranked r
  left join last_period l on l.coach_profile_id = r.coach_profile_id
  order by r.revenue_cents desc;
end; $$;

create or replace function public.get_finance_commission_summary(_range text default 'month')
returns table (
  pending_count               integer,
  pending_amount_cents        integer,
  paid_count                  integer,
  paid_amount_cents           integer,
  declared_in_range_count     integer,
  declared_in_range_amount_cents integer
)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    count(*) filter (where status <> 'paid')::integer,
    coalesce(sum(amount_cents) filter (where status <> 'paid'), 0)::integer,
    count(*) filter (where status = 'paid')::integer,
    coalesce(sum(amount_cents) filter (where status = 'paid'), 0)::integer,
    count(*) filter (where declared_at >= v_start)::integer,
    coalesce(sum(amount_cents) filter (where declared_at >= v_start), 0)::integer
  from public.commission_declarations;
end; $$;

create or replace function public.get_finance_partner_payout_summary()
returns table (
  pending_count         integer,
  pending_amount_cents  integer,
  paid_count            integer,
  paid_amount_cents     integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    count(*) filter (where status <> 'paid')::integer,
    coalesce(sum(amount_cents) filter (where status <> 'paid'), 0)::integer,
    count(*) filter (where status = 'paid')::integer,
    coalesce(sum(amount_cents) filter (where status = 'paid'), 0)::integer
  from public.partner_payouts;
end; $$;

create or replace function public.decide_money_request(_id uuid, _status text, _note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;
  if _status not in ('approved', 'denied') then
    raise exception 'status must be approved or denied';
  end if;

  update public.money_requests
  set status = _status, decided_by = auth.uid(), decided_at = now(), decision_note = _note, updated_at = now()
  where id = _id;
end; $$;

-- money_requests RLS policy -- the whole-queue read/manage policy.
alter policy finance_admin_manage_money_requests on public.money_requests
  using (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'co_director'))
  with check (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'co_director'));
