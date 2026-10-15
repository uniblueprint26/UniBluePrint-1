-- Finance "Revenue & Payouts" currently only ever counts public.subscriptions
-- (get_finance_revenue_snapshot(), 20260829140000_finance_dashboard_views.sql
-- -- a modelled MRR/ARR estimate off Pro list price). It predates and never
-- includes three real, live, one-time revenue streams that now exist:
--   * foundation_payments      (20261012204811 + refund flow 20261015014313)
--   * coach_payments           (20261015014215)
--   * board_listing_payments   (20261015082741)
--
-- Schemas confirmed live via Supabase MCP (not assumed): all three share the
-- same shape -- amount_cents integer, currency text, status text,
-- paid_at/created_at/updated_at timestamptz -- and all three use the
-- identical check constraint status in ('pending','paid','failed',
-- 'canceled') (seen directly in the foundation_payments and
-- board_listing_payments migrations; coach_payments mirrors it). All three
-- tables' webhook handler (supabase/functions/stripe-webhook/index.ts) only
-- ever writes status: 'paid' -- never 'completed'/'succeeded' -- always
-- together with paid_at in the same update. All three tables are currently
-- empty in production (0 rows each, checked live): the new figures
-- correctly come back as 0/null, not an error, until real Stripe payments
-- land.
--
-- This is a NEW, separate function rather than an extra OUT column bolted
-- onto get_finance_revenue_snapshot(): these are one-time Stripe charges,
-- not subscriptions -- a different kind of metric from the modelled
-- MRR/ARR run-rate -- and get_finance_revenue_snapshot() is also called
-- elsewhere (src/pages/admin/FinanceDashboardPage.jsx), so leaving its
-- existing 6-column signature untouched avoids a breaking change for that
-- caller. (Postgres also cannot ALTER a "returns table" function's column
-- list in place -- only DROP + CREATE -- which here would mean a short
-- window with no get_finance_revenue_snapshot() at all for every caller
-- while the migration runs; a new function sidesteps that entirely.)
--
-- "Collected in range" uses paid_at (when the money actually landed), not
-- created_at (when the checkout/payment row was first created), scoped to
-- the same v_start window public._dashboard_range_start(_range) already
-- gives get_finance_revenue_snapshot() -- so passing the same _range to both
-- RPCs covers the same period. status = 'paid' is kept as a second filter
-- alongside paid_at as a belt-and-suspenders check, since paid_at is only
-- ever set by the webhook in the same update as status='paid'.

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
  where status = 'paid' and paid_at >= v_start;

  select count(*)::integer, coalesce(sum(amount_cents), 0)::bigint
  into v_coach_count, v_coach_cents
  from public.coach_payments
  where status = 'paid' and paid_at >= v_start;

  select count(*)::integer, coalesce(sum(amount_cents), 0)::bigint
  into v_board_count, v_board_cents
  from public.board_listing_payments
  where status = 'paid' and paid_at >= v_start;

  return query
  select
    v_foundation_count,
    v_foundation_cents,
    v_coach_count,
    v_coach_cents,
    v_board_count,
    v_board_cents,
    (v_foundation_cents + v_coach_cents + v_board_cents);
end; $$;

grant execute on function public.get_finance_one_time_payments_summary(text) to authenticated;

comment on function public.get_finance_one_time_payments_summary(text) is
  'Real, actually-collected one-time Stripe revenue (status=''paid'', summed by paid_at) over the same _range window get_finance_revenue_snapshot() uses, broken out per stream: foundation_payments, coach_payments, board_listing_payments. Deliberately a separate RPC from get_finance_revenue_snapshot() (not blended into its subscription-based estimated_mrr_cents/estimated_arr_cents, and does not change that function''s signature for its other caller, src/pages/admin/FinanceDashboardPage.jsx).';
