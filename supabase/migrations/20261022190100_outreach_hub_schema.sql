-- ═══════════════════════════════════════════════════════════════════════════
-- Outreach Hub (Studio Phase 4) -- for Sienna, Ethan, Fabz and James, the
-- team that grows and maintains UBP's real-world partner/coach/community
-- relationships (recruiting Lifestyle Blueprint partners and Elevation
-- coaches, inbound application/enquiry handling, outreach campaigns). Built
-- on the Studio component library from Phases 1-3 (StudioShell/
-- MetricBarChart/ComparisonWidget/TaskBoard etc., see src/components/studio/).
--
-- Checked live before writing a single line of SQL here (via Supabase MCP
-- list_tables / execute_sql, 2026-10-22):
--   - partnership_enquiries, business_enquiries, coach_applications,
--     ambassador_applications, team_applications, handler_applications,
--     general_enquiries, university_enquiries: all 8 real, working tables,
--     ALL 0 rows today. A genuine, honest "0 inbound right now" for a
--     pre-launch/early product -- shown below as real zeros via a real
--     live query (get_outreach_inbound_pipeline), never padded or hidden
--     as tbd (the tables and the query are both real; the pipeline is
--     just empty).
--   - partners: 34 rows, 7 obviously synthetic by name ('%example%' /
--     '%placeholder%' / '%sample%'), same contamination Legal Hub found
--     and excluded -- 27 real partners remain. active/verified breakdown
--     and month-over-month growth (by created_at) are both real,
--     legitimate charts off that real-27 cohort.
--   - partner_follows: 20 rows, but 19 of the 20 belong to the banned
--     demo/QA accounts -- only 1 real follow exists today (October 2026).
--     Excluded the same way as every other hub's banned-account handling;
--     the resulting "real engagement" trend is honestly almost all zero,
--     not a broken chart.
--   - coach_profiles: 16 rows -- 13 are seed listings (user_id is null,
--     no real signed-up person behind them at all) and the remaining 3
--     (coach-901, coach-999, ubp-screenshot-tester) all belong to banned
--     demo/QA accounts. Confirmed, same as Legal Hub's finding: ZERO real
--     live coaches exist today. This is a genuinely important
--     Outreach-relevant fact (real coach recruitment is at 0, not a
--     vanity-metric gap to hide) and is surfaced prominently below, not
--     papered over.
--   - early_access_signups: 4 real rows, a genuine top-of-funnel signal.
--   - referrals: 0 rows (attribution-only per its own table comment, no
--     reward attached to a row existing there) -- a real, honest 0.
--   - Gmail drafts were checked for a possible real "contacted" count
--     from an earlier round of outreach emails this session, per the
--     brief. The draft list spans many unrelated months/recipients with
--     no safe, unambiguous way to isolate "the 17 personalised outreach
--     emails" from other draft activity -- so, per the brief's own
--     instruction, that count is NOT guessed at. There is currently no
--     structured log of outreach contact attempts at all; that gap is
--     exactly what outreach_contacts (below) now gives Sienna/Ethan/Fabz/
--     James to track going forward, seeded empty -- not back-filled with
--     anything unverifiable.
--
-- Role/access judgment call (flagged again in the handback report): the
-- brief names no lead among Sienna/Ethan/Fabz/James, so every function
-- below gates on the whole outreach/founder/admin group, same "everyone
-- sees the data" principle Legal/Tech used for their own teams --
-- TODO(phase-2-access-system) markers are left wherever a future
-- leader/member split would narrow this further.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Shared role-check helper -- same is_X_admin() convention as
--    _is_legal_admin() / is_partner_tier_admin().
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._is_outreach_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'outreach')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
$$;

revoke execute on function public._is_outreach_admin() from public, anon;
grant execute on function public._is_outreach_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. INBOUND PIPELINE -- real live counts across the 8 real-but-empty
--    enquiry/application tables. Deliberately a live query, not a cached
--    snapshot (unlike Tech Hub's Management-API-only data, these are
--    ordinary tables this app can query live) -- so this fills in itself
--    the moment real inbound activity exists, no manual refresh needed.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_outreach_inbound_pipeline()
returns table (entity_type text, display_label text, pipeline_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select 'partnership_enquiries'::text, 'Partnership enquiries'::text, (select count(*) from public.partnership_enquiries)::integer
  union all
  select 'business_enquiries'::text, 'Business enquiries'::text, (select count(*) from public.business_enquiries)::integer
  union all
  select 'coach_applications'::text, 'Coach applications'::text, (select count(*) from public.coach_applications)::integer
  union all
  select 'ambassador_applications'::text, 'Ambassador applications'::text, (select count(*) from public.ambassador_applications)::integer
  union all
  select 'team_applications'::text, 'Team applications'::text, (select count(*) from public.team_applications)::integer
  union all
  select 'handler_applications'::text, 'Handler applications'::text, (select count(*) from public.handler_applications)::integer
  union all
  select 'general_enquiries'::text, 'General enquiries'::text, (select count(*) from public.general_enquiries)::integer
  union all
  select 'university_enquiries'::text, 'University enquiries'::text, (select count(*) from public.university_enquiries)::integer;
end; $$;

grant execute on function public.get_outreach_inbound_pipeline() to authenticated;
revoke execute on function public.get_outreach_inbound_pipeline() from public, anon;

comment on function public.get_outreach_inbound_pipeline() is
  'Real, live per-table counts across all 8 enquiry/application tables Outreach is the natural owner of. Genuinely 0 across the board as of 2026-10-22 -- a pre-launch/early-product fact, not a broken query -- fills in on its own as real inbound activity happens.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. COACH RECRUITMENT -- surfaces the real 0-live-coaches fact prominently
--    rather than hiding it. Same underlying facts Legal Hub found on
--    coach_profiles, re-queried live here (not copied from that migration).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_outreach_coach_recruitment_snapshot()
returns table (
  total_coach_profiles  integer,
  seed_listings         integer,
  banned_demo_accounts  integer,
  real_live_coaches     integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.coach_profiles)::integer,
    (select count(*) from public.coach_profiles where user_id is null)::integer,
    (select count(*) from public.coach_profiles cp join auth.users u on u.id = cp.user_id where u.banned_until = 'infinity')::integer,
    (select count(*) from public.coach_profiles cp join auth.users u on u.id = cp.user_id where u.banned_until is distinct from 'infinity')::integer;
end; $$;

grant execute on function public.get_outreach_coach_recruitment_snapshot() to authenticated;
revoke execute on function public.get_outreach_coach_recruitment_snapshot() from public, anon;

comment on function public.get_outreach_coach_recruitment_snapshot() is
  'Real coach_profiles breakdown: seed listings (user_id is null, no real person behind them), banned demo/QA accounts, and real_live_coaches -- genuinely 0 today. This is the important fact, surfaced directly rather than buried in a bigger number: real Elevation coach recruitment has not landed a single live coach yet.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. PARTNER GROWTH & ENGAGEMENT -- real partners/partner_follows data,
--    excluding the same synthetic partner rows (name ilike '%example%' /
--    '%placeholder%' / '%sample%') Legal Hub excluded, and the same banned
--    demo/QA accounts every other hub excludes.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_outreach_partner_snapshot()
returns table (
  total_partners        integer,
  synthetic_excluded    integer,
  real_partners         integer,
  active_partners       integer,
  verified_partners     integer,
  early_access_signups  integer,
  referrals_count       integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.partners)::integer,
    (select count(*) from public.partners where name ilike '%example%' or name ilike '%placeholder%' or name ilike '%sample%')::integer,
    (select count(*) from public.partners where name not ilike '%example%' and name not ilike '%placeholder%' and name not ilike '%sample%')::integer,
    (select count(*) from public.partners where active and name not ilike '%example%' and name not ilike '%placeholder%' and name not ilike '%sample%')::integer,
    (select count(*) from public.partners where verified and name not ilike '%example%' and name not ilike '%placeholder%' and name not ilike '%sample%')::integer,
    (select count(*) from public.early_access_signups)::integer,
    (select count(*) from public.referrals)::integer;
end; $$;

grant execute on function public.get_outreach_partner_snapshot() to authenticated;
revoke execute on function public.get_outreach_partner_snapshot() from public, anon;

comment on function public.get_outreach_partner_snapshot() is
  'Real partner/top-of-funnel counts. real_partners/active_partners/verified_partners exclude the 7 synthetic "Example/Placeholder/Sample" rows the same way Legal Hub''s contracts seed did. early_access_signups (4) and referrals_count (0, attribution-only per that table''s own comment) are genuine, not padded.';

create or replace function public.get_outreach_partner_growth_by_month()
returns table (month_label text, month_start date, new_partners integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
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
    count(p.id)::integer
  from months m
  left join public.partners p
    on date_trunc('month', p.created_at)::date = m.month_start
    and p.name not ilike '%example%' and p.name not ilike '%placeholder%' and p.name not ilike '%sample%'
  group by m.month_start
  order by m.month_start;
end; $$;

grant execute on function public.get_outreach_partner_growth_by_month() to authenticated;
revoke execute on function public.get_outreach_partner_growth_by_month() from public, anon;

comment on function public.get_outreach_partner_growth_by_month() is
  'Real month-by-month count of new (non-synthetic) partners.created_at over the last 6 calendar months, including real zero months (not skipped) -- a legitimate growth-over-time chart, excludes the 7 synthetic "Example/Placeholder/Sample" rows.';

create or replace function public.get_outreach_partner_follow_trend_by_month()
returns table (month_label text, month_start date, new_follows integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with months as (
    select date_trunc('month', now() - (n || ' months')::interval)::date as month_start
    from generate_series(5, 0, -1) n
  ),
  real_follows as (
    select pf.id, pf.created_at
    from public.partner_follows pf
    join auth.users u on u.id = pf.user_id
    where u.banned_until is distinct from 'infinity'
  )
  select
    to_char(m.month_start, 'Mon YYYY'),
    m.month_start,
    count(rf.id)::integer
  from months m
  left join real_follows rf on date_trunc('month', rf.created_at)::date = m.month_start
  group by m.month_start
  order by m.month_start;
end; $$;

grant execute on function public.get_outreach_partner_follow_trend_by_month() to authenticated;
revoke execute on function public.get_outreach_partner_follow_trend_by_month() from public, anon;

comment on function public.get_outreach_partner_follow_trend_by_month() is
  'Real month-by-month partner_follows trend, excluding the 19 of 20 rows that belong to banned demo/QA accounts -- only 1 real follow exists today (October 2026). Honestly near-all-zero, not a broken chart; this is the real engagement signal once banned noise is stripped out.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. OUTREACH CONTACTS LOG -- new real tool for Sienna/Ethan/Fabz/James:
--    who's been contacted, when, on what channel, and what happened.
--    Nothing existed for this before (checked live: no contact-log-shaped
--    table anywhere in the schema). Seeded EMPTY by design -- the brief
--    is explicit that a real round of outreach happened this session
--    (Gmail drafts), but with no safe, unambiguous way to attribute a
--    specific count to it (see migration header), inventing rows here
--    would be exactly the kind of fabricated historical record this pass
--    is forbidden from creating. Every row from here on is a real one,
--    logged through the Outreach Log UI.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.outreach_contacts (
  id                uuid primary key default gen_random_uuid(),
  entity_type       text not null check (entity_type in ('partner', 'coach', 'ambassador', 'handler', 'other')),
  entity_name       text not null check (length(trim(entity_name)) > 0),
  contact_channel   text,
  contacted_at      timestamptz not null default now(),
  status            text not null default 'contacted'
                      check (status in ('contacted', 'responded', 'declined', 'signed')),
  notes             text,
  logged_by         uuid not null references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index outreach_contacts_status_idx on public.outreach_contacts (status, contacted_at desc);
create index outreach_contacts_entity_idx on public.outreach_contacts (entity_type, contacted_at desc);

comment on table public.outreach_contacts is
  'Real outreach-attempt log for partner/coach/ambassador/handler recruitment -- who was contacted, when, on what channel, and the outcome. New table, Studio Phase 4 -- no structured record of this existed before (checked live). Seeded EMPTY on purpose: a real round of outreach emails is known to have happened this session (Gmail drafts) but could not be safely/unambiguously attributed a specific count from this migration, so nothing is back-filled -- see this migration''s header. Every row from here on is logged through real use of the Outreach Log UI by Sienna/Ethan/Fabz/James, never fabricated.';

-- Same "RLS enabled, zero direct policies, SECURITY DEFINER-only access"
-- pattern as legal_contracts/tech_ideas/team_tasks -- every read and write
-- goes through a function that checks _is_outreach_admin() itself.
alter table public.outreach_contacts enable row level security;
revoke all on public.outreach_contacts from public, anon, authenticated;

create table public.outreach_contact_status_log (
  id                        uuid primary key default gen_random_uuid(),
  contact_id                uuid not null references public.outreach_contacts(id) on delete cascade,
  old_status                text,
  new_status                text not null,
  changed_by                uuid not null references auth.users(id),
  changed_by_role_snapshot  text,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index outreach_contact_status_log_contact_idx
  on public.outreach_contact_status_log (contact_id, created_at desc);

comment on table public.outreach_contact_status_log is
  'Append-only. One row per outreach_contacts status change (including the initial create), never updated or deleted -- same structural pattern as legal_contract_status_log/tech_idea_status_log. Backs "contacts signed this period vs last period" for the Outreach Hub ComparisonWidget (get_outreach_contacts_signed_comparison) instead of that comparison being guessed or hand-maintained.';

alter table public.outreach_contact_status_log enable row level security;
revoke all on public.outreach_contact_status_log from public, anon, authenticated;

-- ── list_outreach_contacts() ────────────────────────────────────────────
create or replace function public.list_outreach_contacts()
returns table (
  id                uuid,
  entity_type       text,
  entity_name       text,
  contact_channel   text,
  contacted_at      timestamptz,
  status            text,
  notes             text,
  logged_by         uuid,
  logged_by_label   text,
  created_at        timestamptz,
  updated_at        timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    oc.id, oc.entity_type, oc.entity_name, oc.contact_channel, oc.contacted_at, oc.status, oc.notes,
    oc.logged_by, coalesce(p.full_name, u.email::text, 'Unknown'),
    oc.created_at, oc.updated_at
  from public.outreach_contacts oc
  left join public.profiles p on p.id = oc.logged_by
  left join auth.users u on u.id = oc.logged_by
  order by oc.contacted_at desc;
end; $$;

grant execute on function public.list_outreach_contacts() to authenticated;
revoke execute on function public.list_outreach_contacts() from public, anon;

comment on function public.list_outreach_contacts() is
  'Full outreach contacts log with resolved logger name, outreach/founder/admin only. The one read path for outreach_contacts -- the table itself has no direct SELECT grant.';

-- ── create_outreach_contact() ───────────────────────────────────────────
create or replace function public.create_outreach_contact(
  _entity_type text, _entity_name text, _contact_channel text default null,
  _contacted_at timestamptz default now(), _status text default 'contacted', _notes text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_role text;
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;
  if _entity_type not in ('partner', 'coach', 'ambassador', 'handler', 'other') then
    raise exception 'invalid entity_type: %', _entity_type;
  end if;
  if _status not in ('contacted', 'responded', 'declined', 'signed') then
    raise exception 'invalid status: %', _status;
  end if;
  if _entity_name is null or length(trim(_entity_name)) = 0 then
    raise exception 'entity_name is required';
  end if;

  insert into public.outreach_contacts (entity_type, entity_name, contact_channel, contacted_at, status, notes, logged_by)
  values (_entity_type, trim(_entity_name), _contact_channel, coalesce(_contacted_at, now()), _status, _notes, auth.uid())
  returning id into v_id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.outreach_contact_status_log (contact_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (v_id, null, _status, auth.uid(), coalesce(v_role, 'user'), _notes);

  return v_id;
end; $$;

grant execute on function public.create_outreach_contact(text, text, text, timestamptz, text, text) to authenticated;
revoke execute on function public.create_outreach_contact(text, text, text, timestamptz, text, text) from public, anon;

-- ── update_outreach_contact() -- edit fields, no status log entry ───────
create or replace function public.update_outreach_contact(
  _id uuid, _entity_name text default null, _contact_channel text default null,
  _contacted_at timestamptz default null, _notes text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;
  if not exists (select 1 from public.outreach_contacts where id = _id) then
    raise exception 'contact not found';
  end if;

  update public.outreach_contacts
  set entity_name = coalesce(trim(_entity_name), entity_name),
      contact_channel = coalesce(_contact_channel, contact_channel),
      contacted_at = coalesce(_contacted_at, contacted_at),
      notes = coalesce(_notes, notes),
      updated_at = now()
  where id = _id;
end; $$;

grant execute on function public.update_outreach_contact(uuid, text, text, timestamptz, text) to authenticated;
revoke execute on function public.update_outreach_contact(uuid, text, text, timestamptz, text) from public, anon;

-- ── set_outreach_contact_status() -- the one write path that logs ───────
create or replace function public.set_outreach_contact_status(_id uuid, _status text, _notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_role text;
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;
  if _status not in ('contacted', 'responded', 'declined', 'signed') then
    raise exception 'invalid status: %', _status;
  end if;

  select status into v_old from public.outreach_contacts where id = _id;
  if v_old is null then
    raise exception 'contact not found';
  end if;

  update public.outreach_contacts
  set status = _status,
      notes = coalesce(_notes, notes),
      updated_at = now()
  where id = _id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.outreach_contact_status_log (contact_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (_id, v_old, _status, auth.uid(), coalesce(v_role, 'user'), _notes);
end; $$;

grant execute on function public.set_outreach_contact_status(uuid, text, text) to authenticated;
revoke execute on function public.set_outreach_contact_status(uuid, text, text) from public, anon;

comment on function public.set_outreach_contact_status(uuid, text, text) is
  'The only status-changing write path for an outreach contact -- updates outreach_contacts and appends to outreach_contact_status_log in the same transaction, so "signed this period vs last" is always derivable.';

-- ── get_outreach_contacts_signed_comparison() -- feeds ComparisonWidget ──
create or replace function public.get_outreach_contacts_signed_comparison(_range text default 'week')
returns table (signed_this_period integer, signed_last_period integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not public._is_outreach_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(distinct contact_id) from public.outreach_contact_status_log
      where new_status = 'signed' and created_at >= v_start)::integer,
    (select count(distinct contact_id) from public.outreach_contact_status_log
      where new_status = 'signed' and created_at >= v_prev_start and created_at < v_start)::integer;
end; $$;

grant execute on function public.get_outreach_contacts_signed_comparison(text) to authenticated;
revoke execute on function public.get_outreach_contacts_signed_comparison(text) from public, anon;

comment on function public.get_outreach_contacts_signed_comparison(text) is
  'Real count of outreach_contacts whose status changed to signed this range vs the immediately prior range of equal length, from outreach_contact_status_log -- the real feed behind the Outreach Hub ComparisonWidget. Genuinely 0/0 today since the log is seeded empty -- fills in as Sienna/Ethan/Fabz/James log real outreach. _range is day/week/month/year only (matches _dashboard_range_start).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. team_tasks ("targets, batches, delegated tasks") -- NO new code needed
--    here. The generic table/RPCs from Studio Phase 2 (list_team_tasks /
--    get_team_roster / create_team_task / update_team_task /
--    set_team_task_status, see 20261022174125_legal_hub_schema.sql) already
--    work the moment the 'outreach' role exists (previous migration) and
--    someone holds it in user_roles -- `team` is matched as free text
--    against user_roles.role::text, by design, exactly so a future team
--    like this one needs zero schema changes. The Outreach Hub page below
--    calls getTeamTasks('outreach') / getTeamRoster('outreach') /
--    createTeamTask('outreach', ...) directly.
-- ═══════════════════════════════════════════════════════════════════════════
