-- Real backing for the dedicated Finance Officer Dashboard. Scoped strictly
-- to money -- revenue, commissions, partner payouts -- not the broader
-- platform metrics the Founder/Operations dashboards show. Gated to
-- 'finance' or 'founder' (not 'operations': operations is ticket/queue
-- ownership, not financial oversight, and the Founder role keeps oversight
-- of everything below it).
--
-- Prices are estimated from the same figures src/lib/stripe-products.js uses
-- for checkout (pro_monthly €6.99/mo, pro_annual €49.99/yr, in cents) --
-- there is no per-subscription amount stored from Stripe today (the webhook
-- only records tier/status/current_period_end), so this is a modelled
-- estimate off list price, not a reconciled Stripe revenue figure. Keep the
-- two constants below in sync with stripe-products.js if pricing changes.

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

  select count(*) filter (where tier = 'pro_monthly') into v_monthly from public.subscriptions where status = 'active';
  select count(*) filter (where tier = 'pro_annual') into v_annual from public.subscriptions where status = 'active';

  return query
  select
    v_monthly,
    v_annual,
    (select count(*)::integer from public.subscriptions where created_at >= v_start),
    (select count(*)::integer from public.subscriptions where status = 'canceled' and updated_at >= v_start),
    (v_monthly * v_monthly_price) + round(v_annual * v_annual_price / 12.0)::integer,
    (v_monthly * v_monthly_price * 12) + (v_annual * v_annual_price);
end; $$;

grant execute on function public.get_finance_revenue_snapshot(text) to authenticated;

-- Handler commission declarations -- pending vs paid, plus what was newly
-- declared in the chosen range. status is free text on the underlying table
-- (no check constraint); 'paid' vs anything-not-paid covers what exists today.
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
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_commission_summary(text) to authenticated;

-- Lifestyle partner payouts -- the underlying table's own RLS only lets
-- 'operations' read it directly; this function is Finance's equivalent
-- access, scoped to the same pending/paid summary rather than raw rows.
create or replace function public.get_finance_partner_payout_summary()
returns table (
  pending_count         integer,
  pending_amount_cents  integer,
  paid_count            integer,
  paid_amount_cents     integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
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

grant execute on function public.get_finance_partner_payout_summary() to authenticated;
