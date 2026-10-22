-- ═══════════════════════════════════════════════════════════════════════════
-- Marketing Hub (Studio Phase 5) -- for Alex, Elizabeth, Ethan and Fabz, the
-- team that grows top-of-funnel awareness and curates what gets promoted
-- (deal/partner engagement, early-access leads, the home-screen featured
-- carousel, campaign tasks). Built on the Studio component library from
-- Phases 1-4 (StudioShell/MetricBarChart/ComparisonWidget/TaskBoard etc.,
-- see src/components/studio/), gated by the new 'marketing' app_role the
-- same way finance/legal/tech/outreach already are.
--
-- Checked live before writing a single line of SQL here (via Supabase MCP
-- list_tables / execute_sql, 2026-10-22) -- the brief already flagged the
-- headline finding (activity_events contamination), re-verified here, plus
-- several more facts the brief didn't hand over:
--
--   - activity_events: 1818 rows, exactly two types. partner_deal_viewed =
--     1653 rows (1652 belong to banned demo/QA accounts, 1 is real).
--     partner_deal_claimed = 165 rows (ALL 165 belong to banned demo/QA
--     accounts, 0 real). Excluded here the same way every prior hub
--     excludes banned accounts -- the real organic funnel today is 1 view,
--     0 claims, shown honestly near-zero, not the inflated 1818-row total.
--   - activity_events.detail turns out to hold the PARTNER id, not a deal
--     id (confirmed live: 'detail' values match partners.id exactly, e.g.
--     8b2d696b-... = MPFitness, 620b7ab2-... = "UniBlueprint Example
--     Business") -- despite the column's generic name, this is how the
--     per-partner breakdown below is actually joined; there is no separate
--     deal-level granularity to engagement today.
--   - Per-partner breakdown surfaces something the brief's own numbers
--     didn't spell out: ALL of the contamination belongs to synthetic
--     partner rows ("UniBlueprint Example Business", "Example Business #1",
--     "Sample Fitness Co.") -- the same '%example%'/'%placeholder%'/
--     '%sample%' pattern Legal/Outreach Hub already found and excluded on
--     the `partners` table itself. Even MPFitness's 3 raw views belong to a
--     banned account. The single real view in the whole table belongs to
--     "Saiemsent" (a real Lifestyle partner) -- excluding both banned
--     accounts AND synthetic partners is required to get an honest
--     per-partner breakdown, not just banned-exclusion alone.
--   - early_access_signups: 4 real rows, columns id/email/source/
--     marketing_consent/created_at. `source` is genuinely segmentable:
--     3 'download_page', 1 'coming_soon', spanning Sep-Oct 2026. A real,
--     small top-of-funnel signal -- shown as a real trend + a real list,
--     not padded into something bigger than 4 rows.
--   - featured_content: 13 real rows (checked live), a genuinely curated
--     table (see 20260914150000_featured_content.sql) -- content_type/
--     ref_id/caption/cta_label/priority/active/starts_at/ends_at, all 13
--     currently active, spanning lifestyle_partner (7)/coach (3)/
--     campus_board (1)/course_board (1)/foundation_service (1). This is
--     exactly the "what's currently featured" content Marketing would
--     manage day to day -- real read + a real toggle/edit capability is
--     added below, not just a count. Existing RLS already lets
--     operations/founder manage it and any authenticated user read active
--     rows (20260914150000_featured_content.sql) -- rather than touch
--     those policies (the home-screen carousel depends on them), new
--     SECURITY DEFINER RPCs below add marketing/founder/admin as an
--     additional management path, same "RPC layered on top, existing RLS
--     untouched" approach as reading coach_rating_summary elsewhere.
--   - referrals: 0 rows, attribution-only per its own comment (no reward
--     attached to a row existing) -- an honest 0, left out of this hub's
--     own metrics (Outreach Hub already surfaces it; duplicating it here
--     would double-count the same fact under a different hub).
--   - ads / student_ads: both 0 real rows -- the Ad Board feature
--     (AdBoardPage.jsx) exists but has zero real listings yet. Judgment
--     call: left OUT of this hub. Ad Board inventory is a real-world
--     business-development/outreach fact (who's bought a listing), not
--     something Marketing's own campaign work drives or would check day to
--     day -- same reasoning Tech Hub used to leave activity_events engagement
--     analytics to a "future Marketing/Growth hub" rather than claim it
--     itself. Revisit if a future pass gives Marketing explicit Ad Board
--     ownership.
--   - weekly_issues / weekly_issue_content / weekly_issue_reading_progress:
--     all 0 rows -- a newsletter/content feature that is built but has
--     never been used. Judgment call: left OUT of this hub too. It is
--     real, unused infrastructure, but surfacing a permanently-empty
--     "newsletter" section with no corresponding workflow (no
--     draft/publish UI exists for it anywhere in this codebase, Marketing
--     or otherwise) would be noise, not a genuinely useful honest-zero the
--     way e.g. Outreach's empty inbound pipeline was (that one has a real,
--     working write path -- applications/enquiries -- feeding it). If a
--     future pass builds the newsletter authoring flow, that is when this
--     table earns a place on this hub.
--   - Blog posts (src/data/blogPosts.js) are NOT in Supabase -- confirmed,
--     a static hardcoded JS file, not DB-backed. No "blog analytics"
--     section is built against live data that doesn't exist. The
--     content/campaign task board below (generic team_tasks, team=
--     'marketing') is the real tool for blog batches/targets, per the brief.
--
-- Role/access judgment call (flagged again in the handback report): the
-- brief names no lead among Alex/Elizabeth/Ethan/Fabz, so every function
-- below gates on the whole marketing/founder/admin group, same "everyone
-- sees the data" principle Legal/Tech/Outreach used for their own teams --
-- TODO(phase-2-access-system) markers are left wherever a future
-- leader/member split would narrow this further.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Shared role-check helper -- same is_X_admin() convention as
--    _is_legal_admin() / _is_outreach_admin().
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._is_marketing_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'marketing')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
$$;

revoke execute on function public._is_marketing_admin() from public, anon;
grant execute on function public._is_marketing_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DEAL ENGAGEMENT -- real views/claims funnel, banned-excluded, plus the
--    per-partner breakdown. Both exclude banned demo/QA accounts; the
--    per-partner breakdown additionally excludes the synthetic partner
--    rows (same '%example%'/'%placeholder%'/'%sample%' pattern Legal/
--    Outreach already use) since every contaminated row in this table
--    turned out to belong to one of those synthetic partners anyway.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_marketing_engagement_funnel()
returns table (
  real_views     integer,
  real_claims    integer,
  banned_views   integer,
  banned_claims  integer,
  total_views    integer,
  total_claims   integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_viewed' and u.banned_until is distinct from 'infinity')::integer,
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_claimed' and u.banned_until is distinct from 'infinity')::integer,
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_viewed' and u.banned_until = 'infinity')::integer,
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_claimed' and u.banned_until = 'infinity')::integer,
    (select count(*) from public.activity_events where type = 'partner_deal_viewed')::integer,
    (select count(*) from public.activity_events where type = 'partner_deal_claimed')::integer;
end; $$;

grant execute on function public.get_marketing_engagement_funnel() to authenticated;
revoke execute on function public.get_marketing_engagement_funnel() from public, anon;

comment on function public.get_marketing_engagement_funnel() is
  'Real partner_deal_viewed/partner_deal_claimed funnel, excluding banned demo/QA accounts. As of 2026-10-22: real_views=1, real_claims=0 -- almost the entire 1818-row table (1652 of 1653 views, all 165 claims) belongs to banned accounts. total_views/total_claims are kept alongside for honest context (so the UI can show "1 real of 1653 total", not hide the raw total), never shown as the headline number on their own.';

create or replace function public.get_marketing_engagement_by_partner()
returns table (partner_name text, real_views integer, real_claims integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.name,
    count(*) filter (where ae.type = 'partner_deal_viewed')::integer,
    count(*) filter (where ae.type = 'partner_deal_claimed')::integer
  from public.activity_events ae
  join auth.users u on u.id = ae.user_id
  join public.partners p on p.id::text = ae.detail
  where u.banned_until is distinct from 'infinity'
    and p.name not ilike '%example%' and p.name not ilike '%placeholder%' and p.name not ilike '%sample%'
  group by p.name
  order by real_views desc, real_claims desc;
end; $$;

grant execute on function public.get_marketing_engagement_by_partner() to authenticated;
revoke execute on function public.get_marketing_engagement_by_partner() from public, anon;

comment on function public.get_marketing_engagement_by_partner() is
  'Real per-partner engagement -- activity_events.detail holds the partner id (confirmed live, despite the generic column name). Excludes banned demo/QA accounts AND the synthetic "Example/Placeholder/Sample" partner rows Legal/Outreach Hub also exclude -- every contaminated row in activity_events turned out to belong to one of those synthetic partners. Genuinely just one real row today (1 view, "Saiemsent") -- not a broken query, the real engagement signal once both kinds of noise are stripped out.';

create or replace function public.get_marketing_deal_claims_comparison(_range text default 'week')
returns table (claims_this_period integer, claims_last_period integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_claimed' and u.banned_until is distinct from 'infinity'
         and ae.created_at >= v_start)::integer,
    (select count(*) from public.activity_events ae join auth.users u on u.id = ae.user_id
       where ae.type = 'partner_deal_claimed' and u.banned_until is distinct from 'infinity'
         and ae.created_at >= v_prev_start and ae.created_at < v_start)::integer;
end; $$;

grant execute on function public.get_marketing_deal_claims_comparison(text) to authenticated;
revoke execute on function public.get_marketing_deal_claims_comparison(text) from public, anon;

comment on function public.get_marketing_deal_claims_comparison(text) is
  'Real count of banned-excluded partner_deal_claimed events this range vs the immediately prior range of equal length -- the feed behind the Marketing Hub ComparisonWidget. Genuinely 0/0 today (all 165 real-table claim rows belong to banned accounts) -- an honest zero, not a guess. _range is day/week/month/year only (matches _dashboard_range_start).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. EARLY ACCESS SIGNUPS -- real top-of-funnel leads (4 rows today).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_marketing_early_access_signups()
returns table (id uuid, email text, source text, marketing_consent boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select eas.id, eas.email, eas.source, eas.marketing_consent, eas.created_at
  from public.early_access_signups eas
  order by eas.created_at desc;
end; $$;

grant execute on function public.get_marketing_early_access_signups() to authenticated;
revoke execute on function public.get_marketing_early_access_signups() from public, anon;

comment on function public.get_marketing_early_access_signups() is
  'Real early_access_signups rows (4 today) -- a genuine top-of-funnel lead list for Marketing to follow up on, with the real source each one came through.';

create or replace function public.get_marketing_early_access_signups_by_month()
returns table (month_label text, month_start date, signup_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with months as (
    select date_trunc('month', now() - (n || ' months')::interval)::date as month_start
    from generate_series(5, 0, -1) n
  )
  select
    to_char(m.month_start, 'Mon YYYY'),
    m.month_start,
    count(eas.id)::integer
  from months m
  left join public.early_access_signups eas
    on date_trunc('month', eas.created_at)::date = m.month_start
  group by m.month_start
  order by m.month_start;
end; $$;

grant execute on function public.get_marketing_early_access_signups_by_month() to authenticated;
revoke execute on function public.get_marketing_early_access_signups_by_month() from public, anon;

comment on function public.get_marketing_early_access_signups_by_month() is
  'Real month-by-month early_access_signups count over the last 6 calendar months, including real zero months (not skipped). Only 2 of those 6 months have any real signups today (3 in one month, 1 in another) -- an honest, small top-of-funnel trend, not padded.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FEATURED CONTENT -- real "what's currently featured" management view.
--    featured_content already exists (20260914150000_featured_content.sql)
--    with its own RLS (authenticated can read ACTIVE rows; operations/
--    founder can manage) for the live home-screen carousel -- those
--    policies are left untouched (the carousel depends on them). These
--    SECURITY DEFINER RPCs add a marketing/founder/admin management path on
--    top: a full read (active AND inactive, which the carousel's own
--    policy deliberately hides) plus the two real edits Marketing actually
--    needs -- toggling a pin on/off and adjusting its editorial copy/order.
--    Creating a brand-new pin is deliberately NOT exposed here: content_type
--    + ref_id must point at a real existing coach/partner/board/service (see
--    that migration's own header), and there's no safe way to validate an
--    arbitrary ref_id against each of those five different real tables from
--    here without risking a pin that silently resolves to nothing on the
--    carousel -- picking what to feature next stays a deliberate, direct-
--    SQL/founder action for now, same scope boundary as every other hub
--    not inventing a parallel entity picker for something that already has
--    one elsewhere.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_marketing_featured_content()
returns table (
  id uuid, content_type text, ref_id text, caption text, cta_label text,
  priority integer, starts_at timestamptz, ends_at timestamptz, active boolean,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select fc.id, fc.content_type, fc.ref_id, fc.caption, fc.cta_label,
         fc.priority, fc.starts_at, fc.ends_at, fc.active, fc.created_at, fc.updated_at
  from public.featured_content fc
  order by fc.active desc, fc.priority asc, fc.created_at desc;
end; $$;

grant execute on function public.get_marketing_featured_content() to authenticated;
revoke execute on function public.get_marketing_featured_content() from public, anon;

comment on function public.get_marketing_featured_content() is
  'Full featured_content list (active AND inactive) for marketing/founder/admin -- the carousel''s own RLS policy only lets a plain authenticated user see active, in-window rows, so this management view needs its own SECURITY DEFINER read. 13 real rows today, all currently active.';

create or replace function public.set_marketing_featured_content_active(_id uuid, _active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;
  if not exists (select 1 from public.featured_content where id = _id) then
    raise exception 'featured content row not found';
  end if;

  update public.featured_content set active = _active, updated_at = now() where id = _id;
end; $$;

grant execute on function public.set_marketing_featured_content_active(uuid, boolean) to authenticated;
revoke execute on function public.set_marketing_featured_content_active(uuid, boolean) from public, anon;

comment on function public.set_marketing_featured_content_active(uuid, boolean) is
  'The real toggle Marketing needs day to day -- pull a pin out of rotation (active=false) or bring it back, without touching anything else on the row. Writes through to the real home-screen carousel immediately (same table, same row).';

create or replace function public.update_marketing_featured_content_details(
  _id uuid, _caption text default null, _cta_label text default null, _priority integer default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._is_marketing_admin() then
    raise exception 'not authorized';
  end if;
  if not exists (select 1 from public.featured_content where id = _id) then
    raise exception 'featured content row not found';
  end if;

  update public.featured_content
  set caption = coalesce(_caption, caption),
      cta_label = coalesce(_cta_label, cta_label),
      priority = coalesce(_priority, priority),
      updated_at = now()
  where id = _id;
end; $$;

grant execute on function public.update_marketing_featured_content_details(uuid, text, text, integer) to authenticated;
revoke execute on function public.update_marketing_featured_content_details(uuid, text, text, integer) from public, anon;

comment on function public.update_marketing_featured_content_details(uuid, text, text, integer) is
  'Edits a featured_content row''s editorial caption/CTA label/display priority (lower priority shows first) -- any null argument leaves that field unchanged, same "leave unchanged" convention as update_legal_contract/update_outreach_contact. Does not change content_type/ref_id (what is being featured) or active (see set_marketing_featured_content_active) -- those are deliberately separate, narrower write paths.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. team_tasks ("targets, batches, delegated tasks") -- NO new code needed
--    here. The generic table/RPCs from Studio Phase 2 (list_team_tasks /
--    get_team_roster / create_team_task / update_team_task /
--    set_team_task_status, see 20261022174125_legal_hub_schema.sql) already
--    work the moment the 'marketing' role exists (previous migration) and
--    someone holds it in user_roles -- `team` is matched as free text
--    against user_roles.role::text, by design, exactly so a future team
--    like this one needs zero schema changes. The Marketing Hub page below
--    calls getTeamTasks('marketing') / getTeamRoster('marketing') /
--    createTeamTask('marketing', ...) directly -- this is also the real
--    tool for blog/content-calendar batches and targets per the brief,
--    since blog posts themselves are static JS, not a DB table to track.
-- ═══════════════════════════════════════════════════════════════════════════
