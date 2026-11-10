-- ═══════════════════════════════════════════════════════════════════════════
-- Finance Hub (Studio Phase 1 pilot) -- two things:
--
--   1. BANNED-ACCOUNT EXCLUSION. 24 demo/QA/test accounts were banned today
--      (auth.users.banned_until = 'infinity'). Checked live: every single
--      coach_payments row (38/38), every coach_bookings row bar one
--      (38/39), every coach_payment_transfers row (38/38), and 4 of 5
--      subscriptions rows belong to those banned accounts. The existing
--      Finance RPCs (20260829140000_finance_dashboard_views.sql,
--      20261015150614_finance_revenue_one_time_payments.sql,
--      20261015150039_coach_stripe_connect.sql) predate the ban and count
--      all of that as real revenue/activity. Per the founder's explicit
--      instruction today ("the actual app obviously runs off the actual
--      data, no elevated/demo numbers allowed here"), this migration
--      re-defines each one (same signature, so no call-site changes needed)
--      to exclude banned accounts. The honest result is near-zero across
--      the board right now -- that is correct, not a bug.
--
--   2. New Finance Hub RPCs for the Studio rebuild (revenue by tier/source,
--      margin, cohort, payout failure queue, a comparison feed for
--      ComparisonWidget) and a new, simple money_requests table ("money
--      requests from other teams" queue).
--
-- Every new/changed function excludes banned accounts the same way:
-- `user_id not in (select id from auth.users where banned_until = 'infinity')`
-- (or the equivalent join when the row's own user_id is a step away).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1a. get_finance_revenue_snapshot -- subscriptions.user_id direct.
-- ─────────────────────────────────────────────────────────────────────────
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
  v_monthly_price constant integer := 699;   -- pro_monthly, cents
  v_annual_price  constant integer := 4999;  -- pro_annual, cents
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

comment on function public.get_finance_revenue_snapshot(text) is
  'Subscription MRR/ARR estimate, real active Pro subscribers excluding banned demo/QA accounts (auth.users.banned_until = ''infinity''). Re-defined 2026-10-22 to add that exclusion -- same signature, no caller changes.';

-- ─────────────────────────────────────────────────────────────────────────
-- 1b. get_finance_one_time_payments_summary -- all three tables have a
--     direct user_id column.
-- ─────────────────────────────────────────────────────────────────────────
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

comment on function public.get_finance_one_time_payments_summary(text) is
  'Real, actually-collected one-time Stripe revenue, excluding banned demo/QA accounts. Re-defined 2026-10-22 to add that exclusion -- same signature, no caller changes. Checked live the day the ban landed: 0 real paid coach_payments (all 38 belonged to banned accounts) -- genuinely 0 coaching revenue today, not a bug.';

-- ─────────────────────────────────────────────────────────────────────────
-- 1c. get_finance_coach_payout_summary / get_finance_pending_coach_payouts
--     -- coach_payment_transfers has no user_id of its own; join to
--     coach_payments via coach_payment_id for the owning user.
-- ─────────────────────────────────────────────────────────────────────────
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

revoke execute on function public.get_finance_coach_payout_summary() from public, anon;

comment on function public.get_finance_coach_payout_summary() is
  'Coach Stripe Connect transfer totals, excluding transfers for banned demo/QA accounts'' payments (joined via coach_payments.user_id). Re-defined 2026-10-22 to add that exclusion -- same signature, no caller changes.';

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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select t.id, t.coach_slug, t.gross_amount_cents, t.pending_reason, t.commission_pct, t.coach_share_cents, t.attempted_at
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where t.status = 'pending'
    -- Qualified as auth.users.id (not bare `id`) -- this function's own
    -- RETURNS TABLE declares an `id` column, which PL/pgSQL auto-declares
    -- as an in-scope variable for the whole function body, so a bare `id`
    -- here is genuinely ambiguous between that variable and auth.users.id.
    -- Caught live via QA sign-in testing after first writing this as
    -- `select id from auth.users ...` -- see git history for the exact fix.
    and p.user_id not in (select u.id from auth.users u where u.banned_until = 'infinity')
  order by t.attempted_at desc
  limit 100;
end; $$;

revoke execute on function public.get_finance_pending_coach_payouts() from public, anon;

comment on function public.get_finance_pending_coach_payouts() is
  'Pending coach payout detail queue, excluding banned demo/QA accounts (joined via coach_payments.user_id). Re-defined 2026-10-22 to add that exclusion, then again same day to fix an ambiguous "id" reference (the function''s own RETURNS TABLE id column shadowed the banned-account subquery''s auth.users.id) caught via live QA.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2a. Revenue by tier and by source -- the Finance Hub's main chart.
--     "By tier" groups real coach revenue by the coach's current Partner
--     Tier (Access/Plus/Signature); a coach with no tier assigned yet is
--     grouped under 'unassigned' rather than silently dropped.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_finance_revenue_by_tier(_range text default 'month')
returns table (
  tier                text,
  payments_count      integer,
  revenue_cents       bigint
)
language plpgsql stable security definer set search_path = public as $$
declare v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_revenue_by_tier(text) to authenticated;
revoke execute on function public.get_finance_revenue_by_tier(text) from public, anon;

comment on function public.get_finance_revenue_by_tier(text) is
  'Real, collected coaching revenue this range, grouped by the coach''s current Partner Tier. Excludes banned demo/QA accounts. A coach with no tier assigned yet groups under ''unassigned''.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2b. UBP take-home margin -- commission actually retained vs paid out to
--     coaches, derived from coach_payment_transfers (the only table that
--     records the gross/coach-share split today; Lifestyle partner payouts
--     via partner_payouts are a flat referral/placement fee, not a revenue
--     split, so they're not part of a "margin" figure).
-- ─────────────────────────────────────────────────────────────────────────
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_margin_summary(text) to authenticated;
revoke execute on function public.get_finance_margin_summary(text) from public, anon;

comment on function public.get_finance_margin_summary(text) is
  'UBP''s take-home commission margin (gross coach payment minus the coach''s share) this range, from coach_payment_transfers. Includes pending transfers (commission already committed, not yet paid) alongside transferred ones, excludes failed attempts and banned demo/QA accounts. margin_pct is null (not 0) when there is no real gross to divide by.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2c. Payout failure/error queue -- real Stripe-rejected transfer attempts.
-- ─────────────────────────────────────────────────────────────────────────
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select t.id, t.coach_slug, t.gross_amount_cents, t.error_message, t.attempted_at
  from public.coach_payment_transfers t
  join public.coach_payments p on p.id = t.coach_payment_id
  where t.status = 'failed'
    -- Qualified as auth.users.id for the same reason as
    -- get_finance_pending_coach_payouts above -- this function's own
    -- RETURNS TABLE id column shadows a bare `id` here.
    and p.user_id not in (select u.id from auth.users u where u.banned_until = 'infinity')
  order by t.attempted_at desc
  limit 100;
end; $$;

grant execute on function public.get_finance_payout_failure_queue() to authenticated;
revoke execute on function public.get_finance_payout_failure_queue() from public, anon;

comment on function public.get_finance_payout_failure_queue() is
  'Real Stripe-rejected coach transfer attempts (status=''failed'' on coach_payment_transfers), excluding banned demo/QA accounts. Nothing here is retried automatically -- see that table''s own comment. Re-defined same day to fix an ambiguous "id" reference caught via live QA (see get_finance_pending_coach_payouts''s comment for the root cause).';

-- ─────────────────────────────────────────────────────────────────────────
-- 2d. Revenue by cohort (signup month). Campus/institution is NOT included
--     here -- checked live, profiles.institution is null for every row
--     today, so a campus breakdown would be 100% "unknown", which is worse
--     than just not showing one. The Finance Hub UI flags this explicitly
--     rather than rendering an all-"unknown" chart.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_finance_revenue_by_cohort()
returns table (
  signup_month    date,
  payments_count  integer,
  revenue_cents   bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_revenue_by_cohort() to authenticated;
revoke execute on function public.get_finance_revenue_by_cohort() from public, anon;

comment on function public.get_finance_revenue_by_cohort() is
  'Real collected coaching revenue grouped by the paying student''s signup month (profiles.created_at), excluding banned demo/QA accounts. Campus/institution cohorting is deliberately NOT included -- profiles.institution is null for every row as of 2026-10-22, so it would only ever render "unknown".';

-- ─────────────────────────────────────────────────────────────────────────
-- 2e. Coach revenue comparison feed, for the Studio ComparisonWidget.
--     Per-coach total real coach-payment revenue this range vs the prior
--     range of equal length, plus that coach's rank among coaches with any
--     real revenue this range. The anonymized top/bottom framing and the
--     "self vs last period" framing are both computed client-side off this
--     one real feed (see src/lib/studioMetrics.js), nothing here reveals
--     one coach's figures to another.
-- ─────────────────────────────────────────────────────────────────────────
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_coach_revenue_comparison(text) to authenticated;
revoke execute on function public.get_finance_coach_revenue_comparison(text) from public, anon;

comment on function public.get_finance_coach_revenue_comparison(text) is
  'Per-coach real coach_payments revenue this range vs the immediately prior range of equal length, plus rank among coaches with any real revenue this range -- the real feed behind the Studio ComparisonWidget on the Finance Hub. Excludes banned demo/QA accounts. Reveals one coach''s own figures only to finance/founder, never to another coach, and the widget itself only ever shows an anonymized "top performer" / "lowest performer", never a name.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. money_requests -- "money requests from other teams" queue (new,
--    per today's decision). Deliberately simple: who's asking, how much,
--    why, and its approval status. Any portal role can submit one (a
--    Campus Handler or Operations lead asking Finance for budget is the
--    expected case); only finance/founder/admin can see the full queue or
--    change its status -- the requester can see their own requests' status
--    update, but not the whole queue.
-- ═══════════════════════════════════════════════════════════════════════════
create table public.money_requests (
  id                  uuid primary key default gen_random_uuid(),
  requested_by        uuid not null references auth.users(id) on delete set null,
  requesting_role      text not null,
  amount_cents        integer not null check (amount_cents > 0),
  reason              text not null check (length(trim(reason)) > 0),
  status              text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  decided_by          uuid references auth.users(id) on delete set null,
  decided_at          timestamptz,
  decision_note       text,
  requested_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.money_requests is
  'Simple internal "ask Finance for money" queue -- any portal-role team member can submit one (amount + reason), Finance/Founder/Admin approve or deny it. New table, Studio Phase 1 Finance Hub. requesting_role is a snapshot of the requester''s role at submission time (a free-text label, not re-derived later), so the queue still reads correctly if someone''s roles change afterward.';

alter table public.money_requests enable row level security;

-- Finance/Founder/Admin see and act on the whole queue.
create policy "finance_admin_manage_money_requests"
  on public.money_requests for all to authenticated
  using (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin'));

-- Anyone with a portal role can submit their own request and see its status
-- later, but not anyone else's.
create policy "requester_insert_own_money_request"
  on public.money_requests for insert to authenticated
  with check (requested_by = auth.uid());

create policy "requester_view_own_money_request"
  on public.money_requests for select to authenticated
  using (requested_by = auth.uid());

create index money_requests_status_idx on public.money_requests (status, requested_at desc);

-- RPC wrapper (keeps requested_by/requesting_role honest -- always the
-- caller's own id and real current role, never client-supplied) rather than
-- a raw insert from the client.
create or replace function public.create_money_request(_amount_cents integer, _reason text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if _amount_cents is null or _amount_cents <= 0 then raise exception 'amount_cents must be positive'; end if;
  if _reason is null or length(trim(_reason)) = 0 then raise exception 'a reason is required'; end if;

  select role::text into v_role from public.user_roles where user_id = auth.uid()
    and role <> 'user' order by role limit 1;
  if v_role is null then v_role := 'user'; end if;

  insert into public.money_requests (requested_by, requesting_role, amount_cents, reason)
  values (auth.uid(), v_role, _amount_cents, trim(_reason))
  returning id into v_id;

  return v_id;
end; $$;

grant execute on function public.create_money_request(integer, text) to authenticated;
revoke execute on function public.create_money_request(integer, text) from public, anon;

create or replace function public.decide_money_request(_id uuid, _status text, _note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin')) then
    raise exception 'not authorized';
  end if;
  if _status not in ('approved', 'denied') then
    raise exception 'status must be approved or denied';
  end if;

  update public.money_requests
  set status = _status, decided_by = auth.uid(), decided_at = now(), decision_note = _note, updated_at = now()
  where id = _id;
end; $$;

grant execute on function public.decide_money_request(uuid, text, text) to authenticated;
revoke execute on function public.decide_money_request(uuid, text, text) from public, anon;
