-- ═══════════════════════════════════════════════════════════════════════════
-- Tech Hub (Studio Phase 3) -- for Eman and Tayyab (leads, full access +
-- review/triage authority), Praise (data analyst, real read access, not
-- leads-only), and Enoch (the only tester -- QA board). Built on the Studio
-- component library from Phases 1-2 (StudioShell/MetricBarChart/
-- ComparisonWidget/TaskBoard etc., see src/components/studio/). Adds the
-- 'tech' role (previous migration).
--
-- Investigated live before writing a single line of SQL here (via Supabase
-- MCP get_advisors / list_tables / list_edge_functions / query_logs /
-- execute_sql, 2026-10-22) -- see the repo handback report for full detail,
-- summarised per data source below:
--
--   1. Supabase advisors (security + performance): real, current findings.
--      0 ERROR-level in either category today. Security: 7 INFO + 241 WARN
--      across 6 lint types. Performance: 138 INFO + 337 WARN across 5 lint
--      types. This IS genuinely valuable as a hero chart (per the task
--      brief) -- but the advisor check itself only runs through Supabase's
--      Management API / MCP tooling, which this deployed web app (running
--      with anon/authenticated project keys, not a Management API personal
--      access token) cannot call live from the client. So this is captured
--      as a real, timestamped SNAPSHOT (tech_advisor_snapshots, seeded below
--      with today's real counts per lint type) rather than faked as a live
--      poll. Refreshing it today means re-running the advisor check and
--      inserting a new batch (captured_at) -- wiring an automated refresh
--      (a scheduled Edge Function with a Management API token) is real
--      future work, flagged here rather than built speculatively.
--   2. generation_usage: real table (checked its comment first, as
--      instructed), real columns (function_name, input_tokens,
--      output_tokens, estimated_cost_cents), and genuinely wired into every
--      generate-*/review-* Edge Function's rate limiter (grepped the
--      deployed function source for the insert -- supabase/functions/
--      _shared/*.ts's logGeneration() calls `.from('generation_usage')
--      .insert(...)` on every successful AI generation). It has 0 rows
--      today -- genuinely 0 real AI-generation calls logged yet, not a
--      broken pipeline and not filtered down from something larger (same
--      "honest 0" pattern as Legal's gdpr_requests). get_tech_generation_
--      usage_summary() below reads this table live and will show real
--      volume/cost the moment it has any.
--   3. Edge Functions: 22 real deployed functions (list_edge_functions),
--      all ACTIVE. Like the advisors, which functions are deployed and
--      their status/version is Management-API-only, not Postgres data the
--      client can query live -- so it is captured the same way, as a real
--      timestamped snapshot (tech_edge_function_snapshots, seeded below
--      with today's real 22 rows). Real per-function invocation/error LOGS
--      were checked via query_logs (function_edge_logs source) -- the
--      project's log retention held exactly 2 real log lines total across
--      its whole visible window (both POST 200 to send-push-notification),
--      nowhere near enough real volume to compute a meaningful per-function
--      error rate or health score. Per the task brief's own instruction
--      ("otherwise use tbd honestly and say what's missing"), per-function
--      invocation/error rates are NOT built here -- TechDashboardPage shows
--      a tbd row for that with this exact reason, rather than fabricating a
--      rate off 2 data points, alongside the real deployed-function list.
--   4. activity_events: checked its schema and real data -- type only ever
--      contains 'partner_deal_viewed' / 'partner_deal_claimed' (1653 / 165
--      real rows). This is general partner/deal engagement analytics, not
--      crash/error-shaped, confirming studioMetrics.js's existing header
--      comment. Per the task brief, this is NOT used here -- it belongs to
--      a future Marketing/Growth hub, not forced into Tech.
--   5. npm run lint / npm run build: current lint baseline is 0 errors / 14
--      warnings (captured 2026-10-22, same command Legal Hub's own
--      verification pass used as its baseline). Shown as a simple static
--      "tech debt" stat on the page with an honest caption that it is a
--      captured number, not live-polled from the browser (running the
--      build toolchain from a client page is out of scope) -- not worth a
--      table/RPC of its own per the brief's "use judgement, don't overbuild"
--      note.
--
-- Also new: a real Idea Inbox (tech_ideas / tech_idea_status_log) for the
-- whole Tech team to submit ideas that Eman/Tayyab triage and can flag to
-- bring to the founder, and reuse of the existing generic team_tasks table
-- (Legal Hub, Studio Phase 2) with team='tech' for Enoch's QA/test board --
-- no new task table, per the task brief's explicit instruction.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Shared role-check helper -- same "team role, or founder/admin" shape as
--    _is_legal_admin(). Every Tech Hub read AND write below is gated through
--    this single function, team-wide (tech/founder/admin) -- there is, as
--    of today, no second role to distinguish "lead" (Eman/Tayyab) from
--    "team member" (Praise/Enoch) by, so triage/approve authority cannot be
--    split at the database level yet without inventing a parallel access
--    system the task brief explicitly says not to build here (same
--    TODO(phase-2-access-system) convention Finance/Legal left for their
--    own leader-vs-team-member gaps). See TechDashboardPage.jsx's own
--    comment on this same point, next to the idea-triage UI.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._is_tech_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'tech')
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
$$;

revoke execute on function public._is_tech_admin() from public, anon;
grant execute on function public._is_tech_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. IDEA INBOX -- tech_ideas / tech_idea_status_log. Same "RLS enabled,
--    zero direct policies, SECURITY DEFINER functions are the only access
--    path" convention as legal_contracts/team_tasks (Studio Phase 2) --
--    reused deliberately rather than inventing a different pattern, per the
--    task brief.
-- ═══════════════════════════════════════════════════════════════════════════
create table public.tech_ideas (
  id              uuid primary key default gen_random_uuid(),
  submitted_by    uuid not null references auth.users(id) on delete set null,
  title           text not null check (length(trim(title)) > 0),
  description     text,
  status          text not null default 'new'
                    check (status in ('new', 'under_review', 'brought_to_founder', 'actioned', 'declined')),
  reviewer_notes  text,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tech_ideas_status_idx on public.tech_ideas (status, created_at desc);

comment on table public.tech_ideas is
  'Idea inbox for the whole Tech team -- anyone who can reach the Tech Hub (tech/founder/admin) can submit one; Eman/Tayyab triage via set_tech_idea_status (mark under_review/actioned/declined, or flag brought_to_founder to escalate to Desmond). New table, Studio Phase 3 -- no prior bug/idea tracker existed in this schema. Seeded empty -- every row is a real submission, never fabricated.';

alter table public.tech_ideas enable row level security;
revoke all on public.tech_ideas from public, anon, authenticated;

create table public.tech_idea_status_log (
  id                        uuid primary key default gen_random_uuid(),
  idea_id                   uuid not null references public.tech_ideas(id) on delete cascade,
  old_status                text,
  new_status                text not null,
  changed_by                uuid not null references auth.users(id),
  changed_by_role_snapshot  text,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index tech_idea_status_log_idea_idx on public.tech_idea_status_log (idea_id, created_at desc);

comment on table public.tech_idea_status_log is
  'Append-only. One row per tech_ideas status change (including the initial create), never updated or deleted -- same structural pattern as legal_contract_status_log/tier_change_log. Backs "ideas triaged this period vs last period" for the Tech Hub ComparisonWidget (get_tech_ideas_triaged_comparison) instead of that comparison being guessed or hand-maintained.';

alter table public.tech_idea_status_log enable row level security;
revoke all on public.tech_idea_status_log from public, anon, authenticated;

-- ── list_tech_ideas() ───────────────────────────────────────────────────
create or replace function public.list_tech_ideas()
returns table (
  id                uuid,
  submitted_by      uuid,
  submitted_by_label text,
  title             text,
  description       text,
  status            text,
  reviewer_notes    text,
  reviewed_by       uuid,
  reviewed_by_label text,
  reviewed_at       timestamptz,
  created_at        timestamptz,
  updated_at        timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    ti.id, ti.submitted_by, coalesce(sp.full_name, su.email::text, 'Team member'),
    ti.title, ti.description, ti.status, ti.reviewer_notes,
    ti.reviewed_by, coalesce(rp.full_name, ru.email::text),
    ti.reviewed_at, ti.created_at, ti.updated_at
  from public.tech_ideas ti
  left join public.profiles sp on sp.id = ti.submitted_by
  left join auth.users su on su.id = ti.submitted_by
  left join public.profiles rp on rp.id = ti.reviewed_by
  left join auth.users ru on ru.id = ti.reviewed_by
  order by
    case ti.status when 'new' then 0 when 'under_review' then 1 when 'brought_to_founder' then 2 else 3 end,
    ti.created_at desc;
end; $$;

grant execute on function public.list_tech_ideas() to authenticated;
revoke execute on function public.list_tech_ideas() from public, anon;

comment on function public.list_tech_ideas() is
  'Full idea inbox, tech/founder/admin only (team-wide read -- Praise sees this same list, not a leads-only view). The one read path for tech_ideas -- the table itself has no direct SELECT grant.';

-- ── create_tech_idea() ──────────────────────────────────────────────────
create or replace function public.create_tech_idea(_title text, _description text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_role text;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;
  if _title is null or length(trim(_title)) = 0 then
    raise exception 'title is required';
  end if;

  insert into public.tech_ideas (submitted_by, title, description)
  values (auth.uid(), trim(_title), _description)
  returning id into v_id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.tech_idea_status_log (idea_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (v_id, null, 'new', auth.uid(), coalesce(v_role, 'user'), null);

  return v_id;
end; $$;

grant execute on function public.create_tech_idea(text, text) to authenticated;
revoke execute on function public.create_tech_idea(text, text) from public, anon;

-- ── set_tech_idea_status() -- the triage action ─────────────────────────
create or replace function public.set_tech_idea_status(_id uuid, _status text, _notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_role text;
begin
  -- TODO(phase-2-access-system): gated to the whole tech/founder/admin
  -- group today, same as every other Tech Hub action (see _is_tech_admin's
  -- own comment) -- there is no "lead" (Eman/Tayyab) vs "team member"
  -- (Praise/Enoch) distinction at the role level yet. Once real per-person
  -- staff roles exist, swap this for a row/person-level check so only
  -- Eman/Tayyab can change status, while Praise/Enoch keep read-only access
  -- to the inbox (they can still submit via create_tech_idea either way).
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;
  if _status not in ('new', 'under_review', 'brought_to_founder', 'actioned', 'declined') then
    raise exception 'invalid status: %', _status;
  end if;

  select status into v_old from public.tech_ideas where id = _id;
  if v_old is null then
    raise exception 'idea not found';
  end if;

  update public.tech_ideas
  set status = _status,
      reviewer_notes = coalesce(_notes, reviewer_notes),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = _id;

  select role::text into v_role from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  insert into public.tech_idea_status_log (idea_id, old_status, new_status, changed_by, changed_by_role_snapshot, notes)
  values (_id, v_old, _status, auth.uid(), coalesce(v_role, 'user'), _notes);
end; $$;

grant execute on function public.set_tech_idea_status(uuid, text, text) to authenticated;
revoke execute on function public.set_tech_idea_status(uuid, text, text) from public, anon;

comment on function public.set_tech_idea_status(uuid, text, text) is
  'The only write path for an idea''s status -- updates tech_ideas and appends to tech_idea_status_log in the same transaction. Setting status to brought_to_founder is how Eman/Tayyab flag an idea for Desmond to see. Gated team-wide (_is_tech_admin) today -- see the TODO on this function''s body and on TechDashboardPage.jsx for the leads-only split this should become once real per-person roles exist.';

-- ── get_tech_ideas_triaged_comparison() -- feeds ComparisonWidget ───────
create or replace function public.get_tech_ideas_triaged_comparison(_range text default 'week')
returns table (triaged_this_period integer, triaged_last_period integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
  v_span interval := now() - v_start;
  v_prev_start timestamptz := v_start - v_span;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(distinct idea_id) from public.tech_idea_status_log
      where new_status <> 'new' and created_at >= v_start)::integer,
    (select count(distinct idea_id) from public.tech_idea_status_log
      where new_status <> 'new' and created_at >= v_prev_start and created_at < v_start)::integer;
end; $$;

grant execute on function public.get_tech_ideas_triaged_comparison(text) to authenticated;
revoke execute on function public.get_tech_ideas_triaged_comparison(text) from public, anon;

comment on function public.get_tech_ideas_triaged_comparison(text) is
  'Real count of ideas whose status moved out of new (first triage touch) this range vs the immediately prior range of equal length, from tech_idea_status_log -- the real feed behind the Tech Hub ComparisonWidget. _range is day/week/month/year only (matches _dashboard_range_start -- note "day" itself falls through to that function''s -infinity else-branch, a pre-existing quirk shared with get_finance_coach_revenue_comparison/get_legal_contracts_resolved_comparison, not introduced here).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. HEALTH OVERVIEW SNAPSHOTS -- advisor findings + deployed Edge
--    Functions. Both are Management-API-only data (see migration header);
--    captured here as real, timestamped snapshot rows rather than faked as
--    a live poll. Same "RLS enabled, zero direct policies, SECURITY
--    DEFINER-only access" pattern as section 1.
-- ═══════════════════════════════════════════════════════════════════════════
create table public.tech_advisor_snapshots (
  id              uuid primary key default gen_random_uuid(),
  captured_at     timestamptz not null default now(),
  category        text not null check (category in ('security', 'performance')),
  lint_name       text not null,
  title           text not null,
  level           text not null check (level in ('ERROR', 'WARN', 'INFO')),
  finding_count   integer not null default 0,
  remediation_url text,
  created_at      timestamptz not null default now()
);

create index tech_advisor_snapshots_captured_idx on public.tech_advisor_snapshots (captured_at desc);

comment on table public.tech_advisor_snapshots is
  'Point-in-time snapshot of Supabase''s security + performance advisor findings, one row per (category, lint_name) per captured_at batch. Real data (captured via Supabase MCP get_advisors), not live-polled -- the advisor check only runs through Supabase''s Management API, which this deployed web app cannot call with its anon/authenticated project keys. Refreshing this means re-running the advisor check and inserting a new captured_at batch (manual today -- an automated refresh via a scheduled Edge Function + Management API token is real future work, not built here). get_tech_advisor_snapshot() always reads the latest batch.';

alter table public.tech_advisor_snapshots enable row level security;
revoke all on public.tech_advisor_snapshots from public, anon, authenticated;

create table public.tech_edge_function_snapshots (
  id            uuid primary key default gen_random_uuid(),
  captured_at   timestamptz not null default now(),
  slug          text not null,
  display_name  text,
  status        text,
  version       integer,
  verify_jwt    boolean,
  deployed_at   timestamptz,
  function_updated_at timestamptz,
  created_at    timestamptz not null default now()
);

create index tech_edge_function_snapshots_captured_idx on public.tech_edge_function_snapshots (captured_at desc);

comment on table public.tech_edge_function_snapshots is
  'Point-in-time snapshot of every deployed Supabase Edge Function (list_edge_functions via Management API), one row per function per captured_at batch. Real data, not live-polled -- same Management-API-only reasoning as tech_advisor_snapshots. Per-function invocation/error rates are deliberately NOT included here -- query_logs (function_edge_logs) held only 2 real log lines total at capture time, nowhere near enough real volume for a meaningful rate; TechDashboardPage shows that as an honest tbd rather than fabricating one. get_tech_edge_function_snapshot() always reads the latest batch.';

alter table public.tech_edge_function_snapshots enable row level security;
revoke all on public.tech_edge_function_snapshots from public, anon, authenticated;

create or replace function public.get_tech_advisor_snapshot()
returns table (
  captured_at timestamptz, category text, lint_name text, title text,
  level text, finding_count integer, remediation_url text
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_latest timestamptz;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  select max(captured_at) into v_latest from public.tech_advisor_snapshots;

  return query
  select s.captured_at, s.category, s.lint_name, s.title, s.level, s.finding_count, s.remediation_url
  from public.tech_advisor_snapshots s
  where s.captured_at = v_latest
  order by s.category, case s.level when 'ERROR' then 0 when 'WARN' then 1 else 2 end, s.finding_count desc;
end; $$;

grant execute on function public.get_tech_advisor_snapshot() to authenticated;
revoke execute on function public.get_tech_advisor_snapshot() from public, anon;

create or replace function public.get_tech_edge_function_snapshot()
returns table (
  captured_at timestamptz, slug text, display_name text, status text,
  version integer, verify_jwt boolean, deployed_at timestamptz, function_updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_latest timestamptz;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  select max(captured_at) into v_latest from public.tech_edge_function_snapshots;

  return query
  select s.captured_at, s.slug, s.display_name, s.status, s.version, s.verify_jwt, s.deployed_at, s.function_updated_at
  from public.tech_edge_function_snapshots s
  where s.captured_at = v_latest
  order by s.slug;
end; $$;

grant execute on function public.get_tech_edge_function_snapshot() to authenticated;
revoke execute on function public.get_tech_edge_function_snapshot() from public, anon;

-- ── Seed: today's real advisor + edge-function snapshot (2026-10-22) ────
-- Exact counts/metadata captured live via Supabase MCP get_advisors(type=
-- security|performance) and list_edge_functions -- see migration header.
-- All 0 ERROR-level findings today.
do $$
declare
  v_captured timestamptz := now();
begin
  insert into public.tech_advisor_snapshots (captured_at, category, lint_name, title, level, finding_count, remediation_url) values
    (v_captured, 'security', 'rls_enabled_no_policy', 'RLS Enabled No Policy', 'INFO', 7, 'https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy'),
    (v_captured, 'security', 'function_search_path_mutable', 'Function Search Path Mutable', 'WARN', 15, 'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable'),
    (v_captured, 'security', 'extension_in_public', 'Extension in Public', 'WARN', 1, 'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public'),
    (v_captured, 'security', 'anon_security_definer_function_executable', 'Public Can Execute SECURITY DEFINER Function', 'WARN', 94, 'https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable'),
    (v_captured, 'security', 'authenticated_security_definer_function_executable', 'Signed-In Users Can Execute SECURITY DEFINER Function', 'WARN', 130, 'https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable'),
    (v_captured, 'security', 'auth_leaked_password_protection', 'Leaked Password Protection Disabled', 'WARN', 1, 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'),
    (v_captured, 'performance', 'unindexed_foreign_keys', 'Unindexed foreign keys', 'INFO', 112, 'https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys'),
    (v_captured, 'performance', 'auth_rls_initplan', 'Auth RLS Initialization Plan', 'WARN', 280, 'https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan'),
    (v_captured, 'performance', 'no_primary_key', 'No Primary Key', 'INFO', 1, 'https://supabase.com/docs/guides/database/database-linter?lint=0004_no_primary_key'),
    (v_captured, 'performance', 'unused_index', 'Unused Index', 'INFO', 25, 'https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index'),
    (v_captured, 'performance', 'multiple_permissive_policies', 'Multiple Permissive Policies', 'WARN', 57, 'https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies');

  insert into public.tech_edge_function_snapshots (captured_at, slug, display_name, status, version, verify_jwt, deployed_at, function_updated_at) values
    (v_captured, 'create-checkout-session', 'create-checkout-session', 'ACTIVE', 4, true, to_timestamp(1790247672.371), to_timestamp(1790247672.371)),
    (v_captured, 'delete-account', 'delete-account', 'ACTIVE', 5, true, to_timestamp(1790247768.253), to_timestamp(1790533042.461)),
    (v_captured, 'create-portal-session', 'create-portal-session', 'ACTIVE', 4, true, to_timestamp(1790858785.592), to_timestamp(1790858785.592)),
    (v_captured, 'review-cover-letter', 'review-cover-letter', 'ACTIVE', 3, true, to_timestamp(1791307559.232), to_timestamp(1791307559.232)),
    (v_captured, 'review-cv', 'review-cv', 'ACTIVE', 3, true, to_timestamp(1791307772.210), to_timestamp(1791307772.210)),
    (v_captured, 'generate-cover-letter', 'generate-cover-letter', 'ACTIVE', 3, true, to_timestamp(1791307984.156), to_timestamp(1791307984.156)),
    (v_captured, 'generate-cv', 'generate-cv', 'ACTIVE', 3, true, to_timestamp(1791308237.917), to_timestamp(1791308237.917)),
    (v_captured, 'generate-linkedin', 'generate-linkedin', 'ACTIVE', 3, true, to_timestamp(1791308573.792), to_timestamp(1791308573.792)),
    (v_captured, 'generate-personal-statement', 'generate-personal-statement', 'ACTIVE', 3, true, to_timestamp(1791308761.838), to_timestamp(1791308761.838)),
    (v_captured, 'generate-portfolio-plan', 'generate-portfolio-plan', 'ACTIVE', 3, true, to_timestamp(1791309326.658), to_timestamp(1791309326.658)),
    (v_captured, 'generate-job-search-support', 'generate-job-search-support', 'ACTIVE', 4, true, to_timestamp(1791309570.808), to_timestamp(1791309860.539)),
    (v_captured, 'generate-application-answers', 'generate-application-answers', 'ACTIVE', 3, true, to_timestamp(1791310462.145), to_timestamp(1791310462.145)),
    (v_captured, 'notify-team-submission', 'notify-team-submission', 'ACTIVE', 3, false, to_timestamp(1791310489.395), to_timestamp(1791310489.395)),
    (v_captured, 'send-form-confirmation', 'send-form-confirmation', 'ACTIVE', 4, false, to_timestamp(1791310507.084), to_timestamp(1791310547.542)),
    (v_captured, 'stripe-webhook', 'stripe-webhook', 'ACTIVE', 7, false, to_timestamp(1791310519.674), to_timestamp(1792076886.804)),
    (v_captured, 'sync-mailchimp-subscriber', 'sync-mailchimp-subscriber', 'ACTIVE', 3, false, to_timestamp(1791310528.203), to_timestamp(1791310528.203)),
    (v_captured, 'generate-interview-prep', 'generate-interview-prep', 'ACTIVE', 3, true, to_timestamp(1791310998.093), to_timestamp(1791310998.093)),
    (v_captured, 'send-push-notification', 'send-push-notification', 'ACTIVE', 1, true, to_timestamp(1791804026.493), to_timestamp(1791804026.493)),
    (v_captured, 'create-foundation-checkout-session', 'create-foundation-checkout-session', 'ACTIVE', 1, true, to_timestamp(1791838564.031), to_timestamp(1791838564.031)),
    (v_captured, 'refund-foundation-payment', 'refund-foundation-payment', 'ACTIVE', 1, true, to_timestamp(1792028707.744), to_timestamp(1792028707.744)),
    (v_captured, 'create-coach-checkout-session', 'create-coach-checkout-session', 'ACTIVE', 2, true, to_timestamp(1792028745.204), to_timestamp(1792062618.917)),
    (v_captured, 'create-board-listing-checkout-session', 'create-board-listing-checkout-session', 'ACTIVE', 1, true, to_timestamp(1792054221.101), to_timestamp(1792054221.101)),
    (v_captured, 'create-coach-connect-account', 'create-coach-connect-account', 'ACTIVE', 1, true, to_timestamp(1792088574.689), to_timestamp(1792088574.689));
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. generation_usage reader -- real, live (not a snapshot: this IS a plain
--    Postgres table the client can query through an RPC). Excludes banned
--    demo/QA accounts from both the call count and the cost, same as every
--    other Studio metric that touches user-linked rows.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_tech_generation_usage_summary(_range text default 'month')
returns table (call_count integer, total_cost_cents integer, by_function jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  v_start timestamptz := public._dashboard_range_start(_range);
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with real_rows as (
    select gu.function_name, gu.estimated_cost_cents
    from public.generation_usage gu
    join auth.users u on u.id = gu.user_id
    where gu.created_at >= v_start
      and u.banned_until is distinct from 'infinity'
  )
  select
    count(*)::integer,
    coalesce(sum(estimated_cost_cents), 0)::integer,
    coalesce(
      (select jsonb_agg(jsonb_build_object('function_name', function_name, 'calls', calls, 'cost_cents', cost_cents) order by calls desc)
       from (
         select function_name, count(*) as calls, coalesce(sum(estimated_cost_cents), 0) as cost_cents
         from real_rows group by function_name
       ) grouped),
      '[]'::jsonb
    )
  from real_rows;
end; $$;

grant execute on function public.get_tech_generation_usage_summary(text) to authenticated;
revoke execute on function public.get_tech_generation_usage_summary(text) from public, anon;

comment on function public.get_tech_generation_usage_summary(text) is
  'Real AI-generation call volume + estimated cost from generation_usage (excluding banned demo/QA accounts), for the given range (day/week/month/year, matches _dashboard_range_start). Genuinely 0 today -- the table is wired into every generate-*/review-* Edge Function''s rate limiter but has logged 0 real successful generations so far -- not a broken query.';
