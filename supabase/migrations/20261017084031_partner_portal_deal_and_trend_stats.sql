-- Expands the Partner Portal (app/src/screens/portals/PartnerPortalScreen.jsx)
-- beyond the existing "This Period" totals (get_my_partner_stats) with two
-- new, real-data stats surfaces a partner actually asked for:
--
-- 1. Per-deal redemption breakdown — codes generated vs. redeemed per deal,
--    from deal_redemption_codes (deal_id, generated_at, used_at). This is
--    genuinely deal-attributed, unlike views/claims: activity_events only
--    stores `detail = partner_id`, with no deal_id, so a true per-deal
--    views/claims split isn't derivable from existing data without changing
--    what the app logs on every view/claim — out of scope here. Redemption
--    codes are already deal_id-scoped today, so this is the one metric that
--    can honestly be broken down deal-by-deal right now.
--
-- 2. Engagement trend — daily views/claims for the last N days, same
--    activity_events source as get_my_partner_stats' totals, just bucketed
--    by day instead of summed over all time.
--
-- Both follow get_my_partner_stats' exact security shape: STABLE SECURITY
-- DEFINER, explicit auth.uid() scoping via partner_users inside the
-- function body (never trusting an RLS policy on the underlying tables),
-- search_path pinned, EXECUTE granted broadly since the auth.uid() check
-- inside is what actually gates the data — an unauthenticated caller just
-- gets an empty result.

create or replace function public.get_my_partner_redemption_breakdown()
returns table (
  deal_id uuid,
  deal_title text,
  deal_active boolean,
  codes_generated bigint,
  codes_redeemed bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id as deal_id,
    d.title as deal_title,
    d.active as deal_active,
    count(drc.id) as codes_generated,
    count(drc.id) filter (where drc.used_at is not null) as codes_redeemed
  from public.deals d
  join public.partner_users pu on pu.partner_id = d.partner_id
  left join public.deal_redemption_codes drc on drc.deal_id = d.id
  where pu.user_id = auth.uid()
  group by d.id, d.title, d.active
  order by d.active desc, codes_generated desc, d.created_at desc
$$;

create or replace function public.get_my_partner_engagement_trend(days_back integer default 30)
returns table (
  day date,
  views bigint,
  claims bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with my_partner as (
    select pu.partner_id from public.partner_users pu
    where pu.user_id = auth.uid()
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
    coalesce(count(ae.id) filter (where ae.type = 'partner_deal_viewed'), 0) as views,
    coalesce(count(ae.id) filter (where ae.type = 'partner_deal_claimed'), 0) as claims
  from days d
  left join public.activity_events ae
    on ae.detail = (select partner_id::text from my_partner)
    and ae.created_at::date = d.day
  group by d.day
  order by d.day
$$;

grant execute on function public.get_my_partner_redemption_breakdown() to anon, authenticated, service_role;
grant execute on function public.get_my_partner_engagement_trend(integer) to anon, authenticated, service_role;
