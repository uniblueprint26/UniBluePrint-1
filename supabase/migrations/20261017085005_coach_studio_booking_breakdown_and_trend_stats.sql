-- Coach-side counterpart to 20261017084003_partner_portal_deal_and_trend_stats:
-- the same two stats surfaces, built from this side's actual data shape.
--
-- 1. Per-session-type breakdown — coach_payments.item_label is already the
--    session/package label ("Intro Call", "1-1 Session", "4-Session
--    Package", etc.) on every real Stripe charge, so (unlike the partner
--    side's views/claims, which only ever logged at partner level) this one
--    genuinely breaks down booking count + revenue by type with existing
--    data, no schema change needed.
--
-- 2. Booking trend — daily paid-booking count and revenue for the last N
--    days, same coach_payments rows get_my_coach_earnings already sums,
--    just bucketed by paid_at day instead of summed over all time.
--
-- Same security shape as get_my_coach_earnings: STABLE SECURITY DEFINER,
-- resolves strictly to the caller's own linked coach_profiles row via
-- auth.uid() inside the function body, search_path pinned, EXECUTE granted
-- broadly since that auth.uid() check is what actually gates the data.

create or replace function public.get_my_coach_booking_breakdown()
returns table (
  item_label text,
  bookings_count bigint,
  total_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cpay.item_label,
    count(*) as bookings_count,
    coalesce(sum(cpay.amount_cents), 0)::bigint as total_cents
  from public.coach_payments cpay
  join public.coach_profiles cp on cp.coach_slug = cpay.coach_slug
  where cp.user_id = auth.uid()
    and cpay.status = 'paid'
  group by cpay.item_label
  order by total_cents desc
$$;

create or replace function public.get_my_coach_booking_trend(days_back integer default 14)
returns table (
  day date,
  bookings bigint,
  revenue_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with my_coach as (
    select cp.coach_slug from public.coach_profiles cp
    where cp.user_id = auth.uid()
    limit 1
  ),
  days as (
    select generate_series(
      current_date - (greatest(days_back, 1) - 1),
      current_date,
      interval '1 day'
    )::date as day
  )
  select
    d.day,
    coalesce(count(cpay.id), 0) as bookings,
    coalesce(sum(cpay.amount_cents), 0)::bigint as revenue_cents
  from days d
  left join public.coach_payments cpay
    on cpay.coach_slug = (select coach_slug from my_coach)
    and cpay.status = 'paid'
    and cpay.paid_at::date = d.day
  group by d.day
  order by d.day
$$;

grant execute on function public.get_my_coach_booking_breakdown() to anon, authenticated, service_role;
grant execute on function public.get_my_coach_booking_trend(integer) to anon, authenticated, service_role;
