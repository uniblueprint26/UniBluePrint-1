-- ═══════════════════════════════════════════════════════════════════════════
-- Legal Hub (Studio Phase 2) -- for Rachel and Basmail. Built on the Studio
-- component library from Phase 1 (StudioShell/MetricBarChart/ComparisonWidget
-- etc., see src/components/studio/). Adds the 'legal' role (previous
-- migration), a real contracts register, GDPR/acknowledgement compliance
-- reads, and a generic cross-hub team_tasks table + roster RPC the founder
-- asked for (any future hub -- Tech, Outreach, Marketing -- reuses the same
-- table/pattern instead of inventing its own).
--
-- Checked live before writing a single line of SQL here (via Supabase MCP
-- list_tables / execute_sql, 2026-10-22):
--   - gdpr_requests: 0 rows. legal_acknowledgements: 0 rows. Neither is
--     contaminated by the 25 banned demo/QA accounts the way Finance's data
--     was -- there is simply nothing in either table yet, real or fake.
--     Nothing to exclude; the honest 0 is shown as a real 0, not padded.
--   - profiles: 35 rows, 25 of which belong to banned (banned_until =
--     'infinity') accounts -- only 10 real/active users exist today. The
--     acknowledgement-coverage query below divides by that real 10, not 35.
--   - coach_profiles: 16 rows. 13 have user_id = null (seed/demo listing
--     rows with no real signed-up person behind them at all -- 'coach-12'
--     .. 'coach-18' etc.), and the remaining 3 (coach-901, coach-999,
--     ubp-screenshot-tester) all belong to banned demo/QA accounts. There
--     is, today, no real non-demo coach to track a contract against -- so
--     NO entity_type='coach' rows are seeded below. Seeding fake ones would
--     be exactly the kind of invented data this pass is explicitly
--     forbidden from creating. See the LegalDashboardPage.jsx empty-state
--     copy for how this is surfaced honestly in the UI instead of hidden.
--   - partners: 34 rows. 7 are obviously synthetic/demo rows by name
--     ('%example%' / '%placeholder%' / '%sample%' -- "Example Business #1",
--     "Placeholder Partner — Food & Drink", "Sample Fitness Co.", etc.),
--     leaving 27 real partners (active or not) seeded below.
--
-- Contracts register judgment call (flagged again in the handback report):
-- this repo has no personalized-contracts/ directory and no per-partner
-- signed contract documents of any kind -- only the generic contracts/
-- template suite (02-Lifestyle-Blueprint-Business-Partner-Agreement.docx).
-- The task brief's specific claim -- that "Made By Kelan" has an unfilled
-- [BRACKETED]-placeholder contract (the same bug "Poiema Dexigns" had
-- before it was fixed and sent) -- could not be independently verified
-- against any file in this repo; it is taken on the brief's own stated
-- authority (the same way Phase 1 took "exclude banned accounts" as a
-- direct instruction) and seeded as the one known, explained exception.
-- Every other partner is seeded 'not_sent' -- the honest "unknown" default
-- -- never invented as signed/sent without real evidence.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Shared role-check helper -- DRYs out "legal, founder, or admin" across
--    every function below, same is_X_admin() helper convention as
--    is_partner_tier_admin() (20261012100000_partner_tiering_framework.sql).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._is_legal_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'legal')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
$$;

revoke execute on function public._is_legal_admin() from public, anon;
grant execute on function public._is_legal_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CONTRACTS REGISTER
-- ═══════════════════════════════════════════════════════════════════════════

create table public.legal_contracts (
  id                uuid primary key default gen_random_uuid(),
  entity_type       text not null check (entity_type in ('partner', 'coach')),
  entity_id         uuid not null,
  contract_name     text not null check (length(trim(contract_name)) > 0),
  status            text not null default 'not_sent'
                      check (status in ('not_sent', 'sent', 'signed', 'needs_fix', 'expired')),
  sent_at           timestamptz,
  signed_at         timestamptz,
  notes             text,
  last_checked_by   uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index legal_contracts_entity_contract_uniq
  on public.legal_contracts (entity_type, entity_id, contract_name);

comment on table public.legal_contracts is
  'Contract tracking per partner/coach -- sent/signed/pending/needs_fix status, for Rachel/Basmail to actually track real paperwork going forward. No table existed for this before Studio Phase 2 (checked live: partners/coach_profiles have no contract-status columns). Seeded only with what is genuinely known (see migration header) -- not_sent is the honest default for every entity whose real status is unknown, never invented as signed/sent.';

-- RLS enabled, deliberately zero direct policies -- same "access only
-- through SECURITY DEFINER functions" pattern already in production on
-- partner_tier_assignments / tier_change_log / partner_negotiation_log
-- (all three show up as intentional "RLS Enabled No Policy" INFO advisor
-- findings today, not oversights). Every read and write below goes through
-- a function that checks _is_legal_admin() itself, so there is no raw
-- grant on this table for anyone, legal/founder/admin included.
alter table public.legal_contracts enable row level security;
revoke all on public.legal_contracts from public, anon, authenticated;

create table public.legal_contract_status_log (
  id                        uuid primary key default gen_random_uuid(),
  contract_id               uuid not null references public.legal_contracts(id) on delete cascade,
  old_status                text,
  new_status                text not null,
  changed_by                uuid not null references auth.users(id),
  changed_by_role_snapshot  text,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index legal_contract_status_log_contract_idx
  on public.legal_contract_status_log (contract_id, created_at desc);

comment on table public.legal_contract_status_log is
  'Append-only. One row per legal_contracts status change (including the initial create), never updated or deleted -- same structural pattern as tier_change_log. Backs "contracts resolved this period vs last period" for the Legal Hub ComparisonWidget (get_legal_contracts_resolved_comparison) instead of that comparison being guessed or hand-maintained.';

alter table public.legal_contract_status_log enable row level security;
revoke all on public.legal_contract_status_log from public, anon, authenticated;

-- ── list_legal_contracts() ──────────────────────────────────────────────
create or replace function public.list_legal_contracts()
returns table (
  id                      uuid,
  entity_type             text,
  entity_id               uuid,
  display_name            text,
  category                text,
  contract_name           text,
  status                  text,
  sent_at                 timestamptz,
  signed_at               timestamptz,
  notes                   text,
  last_checked_by         uuid,
  last_checked_by_label   text,
  created_at              timestamptz,
  updated_at              timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    lc.id, lc.entity_type, lc.entity_id,
    case when lc.entity_type = 'partner' then p.name else coalesce(prof.full_name, cp.coach_slug, 'Coach') end,
    case when lc.entity_type = 'partner' then p.type else cp.specialisation end,
    lc.contract_name, lc.status, lc.sent_at, lc.signed_at, lc.notes,
    lc.last_checked_by, u.email::text,
    lc.created_at, lc.updated_at
  from public.legal_contracts lc
  left join public.partners p on lc.entity_type = 'partner' and p.id = lc.entity_id
  left join public.coach_profiles cp on lc.entity_type = 'coach' and cp.id = lc.entity_id
  left join public.profiles prof on prof.id = cp.user_id
  left join auth.users u on u.id = lc.last_checked_by
  order by
    case lc.status when 'needs_fix' then 0 when 'expired' then 1 when 'not_sent' then 2 when 'sent' then 3 when 'signed' then 4 else 5 end,
    4;
end; $$;

grant execute on function public.list_legal_contracts() to authenticated;
revoke execute on function public.list_legal_contracts() from public, anon;

comment on function public.list_legal_contracts() is
  'Full contracts register with resolved partner/coach display names, legal/founder/admin only. The one read path for legal_contracts -- the table itself has no direct SELECT grant.';

-- ── create_legal_contract() ─────────────────────────────────────────────
create or replace function public.create_legal_contract(
  _entity_type text, _entity_id uuid, _contract_name text,
  _status text default 'not_sent', _notes text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_role text;
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'invalid entity_type: %', _entity_type;
  end if;
  if _status not in ('not_sent', 'sent', 'signed', 'needs_fix', 'expired') then
    raise exception 'invalid status: %', _status;
  end if;
  if _contract_name is null or length(trim(_contract_name)) = 0 then
    raise exception 'contract_name is required';
  end if;
  if _entity_type = 'partner' and not exists (select 1 from public.partners where id = _entity_id) then
    raise exception 'unknown partner';
  end if;
  if _entity_type = 'coach' and not exists (select 1 from public.coach_profiles where id = _entity_id) then
    raise exception 'unknown coach';
  end if;

  insert into public.legal_contracts (entity_type, entity_id, contract_name, status, notes, last_checked_by)
  values (_entity_type, _entity_id, trim(_contract_name), _status, _notes, auth.uid())
  returning id into v_id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.legal_contract_status_log (contract_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (v_id, null, _status, auth.uid(), coalesce(v_role, 'user'), _notes);

  return v_id;
end; $$;

grant execute on function public.create_legal_contract(text, uuid, text, text, text) to authenticated;
revoke execute on function public.create_legal_contract(text, uuid, text, text, text) from public, anon;

-- ── set_legal_contract_status() ─────────────────────────────────────────
create or replace function public.set_legal_contract_status(_id uuid, _status text, _notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_role text;
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;
  if _status not in ('not_sent', 'sent', 'signed', 'needs_fix', 'expired') then
    raise exception 'invalid status: %', _status;
  end if;

  select status into v_old from public.legal_contracts where id = _id;
  if v_old is null then
    raise exception 'contract not found';
  end if;

  update public.legal_contracts
  set status = _status,
      sent_at = case when _status = 'sent' and sent_at is null then now() else sent_at end,
      signed_at = case when _status = 'signed' and signed_at is null then now() else signed_at end,
      notes = coalesce(_notes, notes),
      last_checked_by = auth.uid(),
      updated_at = now()
  where id = _id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.legal_contract_status_log (contract_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (_id, v_old, _status, auth.uid(), coalesce(v_role, 'user'), _notes);
end; $$;

grant execute on function public.set_legal_contract_status(uuid, text, text) to authenticated;
revoke execute on function public.set_legal_contract_status(uuid, text, text) from public, anon;

comment on function public.set_legal_contract_status(uuid, text, text) is
  'The only write path for a contract''s status -- updates legal_contracts and appends to legal_contract_status_log in the same transaction, so "resolved this period vs last" is always derivable. sent_at/signed_at are set once, on first transition into that status, never overwritten by a later re-save.';

-- ── get_legal_contracts_resolved_comparison() -- feeds ComparisonWidget ──
create or replace function public.get_legal_contracts_resolved_comparison(_range text default 'week')
returns table (resolved_this_period integer, resolved_last_period integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(distinct contract_id) from public.legal_contract_status_log
      where new_status = 'signed' and created_at >= v_start)::integer,
    (select count(distinct contract_id) from public.legal_contract_status_log
      where new_status = 'signed' and created_at >= v_prev_start and created_at < v_start)::integer;
end; $$;

grant execute on function public.get_legal_contracts_resolved_comparison(text) to authenticated;
revoke execute on function public.get_legal_contracts_resolved_comparison(text) from public, anon;

comment on function public.get_legal_contracts_resolved_comparison(text) is
  'Real count of contracts whose status changed to signed this range vs the immediately prior range of equal length, from legal_contract_status_log -- the real feed behind the Legal Hub ComparisonWidget. _range is day/week/month/year only (matches _dashboard_range_start); never pass "all" here, same caveat as get_finance_coach_revenue_comparison.';

-- ── Seed: real partners only, honest defaults (see migration header) ────
insert into public.legal_contracts (entity_type, entity_id, contract_name, status, notes)
select
  'partner', p.id, 'Lifestyle Blueprint Business Partner Agreement',
  case p.partner_slug
    when 'kelan' then 'needs_fix'
    when 'poiemadexigns' then 'sent'
    else 'not_sent'
  end,
  case p.partner_slug
    when 'kelan' then 'Flagged 2026-10-22, per direct instruction (not independently verifiable in this repo -- no personalized-contracts/ directory or per-partner signed copies exist here): contract still has unfilled [BRACKETED] template placeholders, the same issue Poiema Dexigns'' contract had before it was corrected and sent. Needs a corrected copy generated and re-sent before this can move past needs_fix.'
    when 'poiemadexigns' then 'Per the same instruction as the Made By Kelan note above: a corrected copy (placeholders filled) was generated and sent. Left at sent rather than signed -- no record here confirms a signature back yet.'
    else null
  end
from public.partners p
where p.name not ilike '%example%' and p.name not ilike '%placeholder%' and p.name not ilike '%sample%';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. GDPR / COMPLIANCE READS -- real counts against the existing
--    gdpr_requests / legal_acknowledgements tables (both genuinely empty
--    today, not padded -- see migration header).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_legal_gdpr_requests()
returns table (
  id uuid, request_type text, status text, requested_at timestamptz, due_at timestamptz,
  is_overdue boolean, requester_label text, notes text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    g.id, g.request_type, g.status, g.requested_at, g.due_at,
    (g.status in ('pending', 'in_progress') and g.due_at is not null and g.due_at < now()),
    coalesce(g.email, u.email::text, 'Registered user (no email on request)'),
    g.notes
  from public.gdpr_requests g
  left join auth.users u on u.id = g.user_id
  order by (g.status in ('pending', 'in_progress')) desc, g.due_at asc nulls last;
end; $$;

grant execute on function public.get_legal_gdpr_requests() to authenticated;
revoke execute on function public.get_legal_gdpr_requests() from public, anon;

comment on function public.get_legal_gdpr_requests() is
  'Every real gdpr_requests row (0 as of 2026-10-22, genuinely empty, not filtered down from something larger) with a computed is_overdue flag (open status + past due_at). legal/founder/admin only -- separate from the existing operations_founder_manage_gdpr_requests RLS policy, which this does not touch.';

create or replace function public.get_legal_acknowledgement_coverage()
returns table (
  document_type text, latest_version text, acknowledged_count integer,
  active_user_count integer, coverage_pct numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_active integer;
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_active
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.banned_until is distinct from 'infinity';

  return query
  with known_types(document_type) as (
    -- Hardcoded to the two document_type literals the app actually writes
    -- today (app/src/screens/auth/SignUpScreen.jsx, via
    -- app/src/constants/legal.js's TERMS_VERSION/PRIVACY_VERSION) rather
    -- than driving off distinct values already in the (empty) table -- so
    -- this still shows the real 0-of-10 coverage honestly instead of
    -- silently returning no rows at all while the table is empty.
    values ('terms_of_service'), ('privacy_policy')
  ),
  latest as (
    select kt.document_type, max(la.version) as latest_version
    from known_types kt
    left join public.legal_acknowledgements la on la.document_type = kt.document_type
    group by kt.document_type
  )
  select
    l.document_type,
    l.latest_version,
    ack.acknowledged_count,
    v_active,
    case when v_active = 0 then null else round(100.0 * ack.acknowledged_count / v_active, 1) end
  from latest l
  cross join lateral (
    select count(distinct la.user_id)::integer as acknowledged_count
    from public.legal_acknowledgements la
    join auth.users u on u.id = la.user_id
    where la.document_type = l.document_type
      and l.latest_version is not null
      and la.version = l.latest_version
      and u.banned_until is distinct from 'infinity'
  ) ack;
end; $$;

grant execute on function public.get_legal_acknowledgement_coverage() to authenticated;
revoke execute on function public.get_legal_acknowledgement_coverage() from public, anon;

comment on function public.get_legal_acknowledgement_coverage() is
  'Real % of active (non-banned) users who have acknowledged the latest version of each known document_type, from legal_acknowledgements. active_user_count excludes the 25 banned demo/QA accounts (10 real users as of 2026-10-22). Genuinely 0% today -- legal_acknowledgements has 0 rows -- not a bug.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. team_tasks -- generic cross-hub "targets, batches, delegated tasks"
--    table (founder's brief: Legal needs this, and so will Tech/Outreach/
--    Marketing etc. later) -- same table/RPC pattern reused by team, not a
--    Legal-only one-off. No fake rows seeded -- empty table, real UI below.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.team_tasks (
  id             uuid primary key default gen_random_uuid(),
  team           text not null,
  title          text not null check (length(trim(title)) > 0),
  description    text,
  status         text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  batch_label    text,
  target_date    date,
  assigned_to    uuid references public.profiles(id) on delete set null,
  created_by     uuid not null references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index team_tasks_team_idx on public.team_tasks (team, status, created_at desc);
create index team_tasks_assigned_to_idx on public.team_tasks (assigned_to);

comment on table public.team_tasks is
  'Generic per-team task/target tracker -- `team` is a free-text label matched against a caller''s user_roles.role::text (e.g. ''legal''), deliberately not a foreign key to app_role, so a future team (tech/outreach/marketing/...) can use this same table the day its own role enum value is added, with zero schema changes here. Seeded with 0 rows by design -- every row is created through real use of the Tasks & Batches UI, never fabricated. "Individual folders" per assignee (the founder''s brief) is a grouped VIEW of these rows by assigned_to, not a separate file-storage feature -- real document/file storage per person is explicitly out of scope for this pass; see LegalDashboardPage.jsx''s comment where that grouping is rendered.';

-- Same "RLS enabled, zero direct policies, SECURITY DEFINER-only access"
-- pattern as legal_contracts above -- the `team` role-match check has to
-- happen in code anyway (a bare RLS USING clause can''t safely cast an
-- arbitrary `team` text value to app_role for a role that may not exist
-- yet), so centralizing it in these functions is the actual access
-- control, not a UX nicety on top of real RLS.
alter table public.team_tasks enable row level security;
revoke all on public.team_tasks from public, anon, authenticated;

create or replace function public._is_team_member_or_admin(_team text)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role::text = _team)
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
$$;

revoke execute on function public._is_team_member_or_admin(text) from public, anon;
grant execute on function public._is_team_member_or_admin(text) to authenticated;

create or replace function public.get_team_roster(_team text)
returns table (user_id uuid, full_name text, email text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  select ur.user_id, p.full_name, u.email::text
  from public.user_roles ur
  join auth.users u on u.id = ur.user_id
  left join public.profiles p on p.id = ur.user_id
  where ur.role::text = _team
  order by coalesce(p.full_name, u.email::text);
end; $$;

grant execute on function public.get_team_roster(text) to authenticated;
revoke execute on function public.get_team_roster(text) from public, anon;

comment on function public.get_team_roster(text) is
  'Real team_tasks assignee picker source -- everyone currently holding the `_team` role (e.g. ''legal''), by user_roles, with their profile name. Generic, reusable by any future team_tasks-based hub the same way list_team_tasks below is.';

create or replace function public.list_team_tasks(_team text)
returns table (
  id uuid, team text, title text, description text, status text,
  batch_label text, target_date date, assigned_to uuid, assignee_name text,
  created_by uuid, created_by_name text, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  select
    t.id, t.team, t.title, t.description, t.status,
    t.batch_label, t.target_date, t.assigned_to,
    coalesce(ap.full_name, au.email::text, 'Unassigned'),
    t.created_by, coalesce(cp.full_name, cu.email::text, 'Unknown'),
    t.created_at, t.updated_at
  from public.team_tasks t
  left join public.profiles ap on ap.id = t.assigned_to
  left join auth.users au on au.id = t.assigned_to
  left join public.profiles cp on cp.id = t.created_by
  left join auth.users cu on cu.id = t.created_by
  where t.team = _team
  order by (t.status = 'done'), t.target_date asc nulls last, t.created_at desc;
end; $$;

grant execute on function public.list_team_tasks(text) to authenticated;
revoke execute on function public.list_team_tasks(text) from public, anon;

create or replace function public.create_team_task(
  _team text, _title text, _description text default null,
  _batch_label text default null, _target_date date default null, _assigned_to uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;
  if _title is null or length(trim(_title)) = 0 then
    raise exception 'title is required';
  end if;

  insert into public.team_tasks (team, title, description, batch_label, target_date, assigned_to, created_by)
  values (_team, trim(_title), _description, _batch_label, _target_date, _assigned_to, auth.uid())
  returning id into v_id;

  return v_id;
end; $$;

grant execute on function public.create_team_task(text, text, text, text, date, uuid) to authenticated;
revoke execute on function public.create_team_task(text, text, text, text, date, uuid) from public, anon;

create or replace function public.update_team_task(
  _id uuid, _title text default null, _description text default null,
  _batch_label text default null, _target_date date default null, _assigned_to uuid default null,
  _clear_assigned_to boolean default false
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_team text;
begin
  select team into v_team from public.team_tasks where id = _id;
  if v_team is null then raise exception 'task not found'; end if;
  if not public._is_team_member_or_admin(v_team) then
    raise exception 'not authorized';
  end if;

  update public.team_tasks
  set title = coalesce(_title, title),
      description = coalesce(_description, description),
      batch_label = coalesce(_batch_label, batch_label),
      target_date = coalesce(_target_date, target_date),
      assigned_to = case when _clear_assigned_to then null else coalesce(_assigned_to, assigned_to) end,
      updated_at = now()
  where id = _id;
end; $$;

grant execute on function public.update_team_task(uuid, text, text, text, date, uuid, boolean) to authenticated;
revoke execute on function public.update_team_task(uuid, text, text, text, date, uuid, boolean) from public, anon;

create or replace function public.set_team_task_status(_id uuid, _status text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_team text;
begin
  if _status not in ('todo', 'in_progress', 'done') then
    raise exception 'invalid status: %', _status;
  end if;

  select team into v_team from public.team_tasks where id = _id;
  if v_team is null then raise exception 'task not found'; end if;
  if not public._is_team_member_or_admin(v_team) then
    raise exception 'not authorized';
  end if;

  update public.team_tasks set status = _status, updated_at = now() where id = _id;
end; $$;

grant execute on function public.set_team_task_status(uuid, text) to authenticated;
revoke execute on function public.set_team_task_status(uuid, text) from public, anon;

comment on function public.list_team_tasks(text) is
  'Generic team_tasks reader -- any future hub built the same way Legal is calls this with its own team value once that role exists. create_team_task / update_team_task / set_team_task_status are the only write paths (table itself has no direct grant).';
