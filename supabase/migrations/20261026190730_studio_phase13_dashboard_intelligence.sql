-- ═══════════════════════════════════════════════════════════════════════════
-- Studio Phase 13 -- dashboard intelligence layer (trend lines, donuts,
-- sparklines, health indicators, calendar, activity heatmap) on top of
-- Phase 12's shared shell. No new tables -- every chart this phase adds
-- visualizes data that already existed; the only genuinely new thing a
-- client-side getter cannot already answer is TIME-BUCKETED aggregation,
-- so this migration adds exactly four new SECURITY DEFINER RPCs:
--
--   1. get_legal_contracts_resolved_trend(_weeks)  -- weekly trend behind
--      Legal's existing single-number ComparisonWidget feed, same source
--      table (legal_contract_status_log), just bucketed over time instead
--      of collapsed to this-period/last-period.
--   2. get_tech_ideas_triaged_trend(_weeks)        -- same shape, off
--      tech_idea_status_log.
--   3. get_task_due_date_density(_team, _scope)    -- real team_tasks.
--      target_date counts per day, for the new Studio mini calendar.
--      _scope: 'team' (every task for _team), 'mine' (also restricted to
--      assigned_to = caller), 'all' (every team -- founder/co_director/
--      admin only, via the existing _is_greeting_admin() gate).
--   4. get_team_activity_heatmap(_team, _days)     -- real per-day event
--      density for the new GitHub-style activity heatmap. Always includes
--      that team's own team_tasks created_at/updated_at(when done) rows;
--      additionally unions in legal_contract_status_log / tech_idea_status_
--      log / outreach_contact_status_log for the three teams that already
--      have one (the same append-only status-log tables Phase 2/3/4 built
--      for their ComparisonWidget feeds) -- real richer signal, not a new
--      table.
--
-- Checked live before writing these (Supabase MCP list_tables/execute_sql,
-- 2026-10-26): team_tasks.target_date already exists (10 real rows across
-- teams today), the three status-log tables are append-only with a plain
-- `created_at`, and _is_greeting_admin()/_is_team_member_or_admin() already
-- give exactly the role gate each of these needs -- reused, not duplicated.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Legal contracts resolved, weekly trend (last _weeks calendar weeks,
--    including real zero weeks -- same "generate_series so nothing genuine
--    gets skipped" convention as get_handler_tickets_by_week).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_legal_contracts_resolved_trend(_weeks integer default 8)
returns table (week_label text, week_start date, resolved_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_legal_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with weeks as (
    select (date_trunc('week', now())::date - (n * 7)) as week_start
    from generate_series(0, greatest(_weeks, 1) - 1) as n
  )
  select
    to_char(w.week_start, 'DD Mon'),
    w.week_start,
    (select count(distinct l.contract_id)::integer from public.legal_contract_status_log l
      where l.new_status = 'signed' and l.created_at >= w.week_start and l.created_at < w.week_start + 7)
  from weeks w
  order by w.week_start;
end; $$;

revoke execute on function public.get_legal_contracts_resolved_trend(integer) from public, anon;
grant execute on function public.get_legal_contracts_resolved_trend(integer) to authenticated;

comment on function public.get_legal_contracts_resolved_trend(integer) is
  'Real count of legal_contracts moved to signed, by calendar week, for the last _weeks weeks (default 8, including this week) -- the Studio Phase 13 trend-line behind the same legal_contract_status_log feed get_legal_contracts_resolved_comparison already collapses to one this-period/last-period pair. Includes genuine zero weeks rather than skipping them.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Tech ideas triaged (moved out of `new`), weekly trend -- same shape,
--    off tech_idea_status_log.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_tech_ideas_triaged_trend(_weeks integer default 8)
returns table (week_label text, week_start date, triaged_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with weeks as (
    select (date_trunc('week', now())::date - (n * 7)) as week_start
    from generate_series(0, greatest(_weeks, 1) - 1) as n
  )
  select
    to_char(w.week_start, 'DD Mon'),
    w.week_start,
    (select count(distinct t.idea_id)::integer from public.tech_idea_status_log t
      where t.new_status <> 'new' and t.created_at >= w.week_start and t.created_at < w.week_start + 7)
  from weeks w
  order by w.week_start;
end; $$;

revoke execute on function public.get_tech_ideas_triaged_trend(integer) from public, anon;
grant execute on function public.get_tech_ideas_triaged_trend(integer) to authenticated;

comment on function public.get_tech_ideas_triaged_trend(integer) is
  'Real count of tech_ideas moved out of new, by calendar week, for the last _weeks weeks (default 8) -- the Studio Phase 13 trend-line behind the same tech_idea_status_log feed get_tech_ideas_triaged_comparison already collapses to one this-period/last-period pair. Includes genuine zero weeks rather than skipping them.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Due-date density for the new Studio mini calendar -- real
--    team_tasks.target_date rows, one row per day that has at least one
--    real task due. _scope:
--      'team' -- every _team task (caller must be a member of _team, or
--               founder/admin/co_director -- _is_team_member_or_admin).
--      'mine' -- same _team, further restricted to assigned_to = caller.
--      'all'  -- every team's tasks, ignoring _team -- founder/co_director/
--               admin only (_is_greeting_admin, the same company-wide gate
--               Phase 12's greeting management panel already uses).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_task_due_date_density(_team text, _scope text default 'team')
returns table (due_date date, task_count integer, team text)
language plpgsql stable security definer set search_path = public as $$
begin
  if _scope = 'all' then
    if not public._is_greeting_admin() then
      raise exception 'not authorized';
    end if;
    return query
    select t.target_date, count(*)::integer, null::text
    from public.team_tasks t
    where t.target_date is not null
    group by t.target_date
    order by t.target_date;
    return;
  end if;

  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  if _scope = 'mine' then
    return query
    select t.target_date, count(*)::integer, t.team
    from public.team_tasks t
    where t.target_date is not null and t.team = _team and t.assigned_to = auth.uid()
    group by t.target_date, t.team
    order by t.target_date;
    return;
  end if;

  -- default: 'team'
  return query
  select t.target_date, count(*)::integer, t.team
  from public.team_tasks t
  where t.target_date is not null and t.team = _team
  group by t.target_date, t.team
  order by t.target_date;
end; $$;

revoke execute on function public.get_task_due_date_density(text, text) from public, anon;
grant execute on function public.get_task_due_date_density(text, text) to authenticated;

comment on function public.get_task_due_date_density(text, text) is
  'Real team_tasks.target_date counts per day, for the Studio Phase 13 mini calendar''s due-date density view. _scope ''team'' (default) is every real task for _team; ''mine'' further restricts to the caller''s own assigned_to; ''all'' ignores _team and covers every team (founder/co_director/admin only, via _is_greeting_admin -- the same company-wide gate the greeting management panel uses). Built to pick up a future reports table''s own due dates automatically the day one exists -- a second UNION ALL branch, not a rewrite -- without fabricating report data today.';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Per-team activity density for the new GitHub-style contribution
--    heatmap. Always includes that team's own team_tasks activity
--    (created + done-at-update as a proxy "closed" event, since team_tasks
--    has no append-only status log of its own); for the three teams that
--    already have a real append-only status-log table (legal/tech/
--    outreach), that real richer signal is unioned in too.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_team_activity_heatmap(_team text, _days integer default 182)
returns table (activity_date date, activity_count integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_since timestamptz := now() - (greatest(_days, 1) || ' days')::interval;
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  with events as (
    select t.created_at as at from public.team_tasks t where t.team = _team and t.created_at >= v_since
    union all
    select t.updated_at from public.team_tasks t where t.team = _team and t.status = 'done' and t.updated_at >= v_since
    union all
    select l.created_at from public.legal_contract_status_log l
      join public.legal_contracts c on c.id = l.contract_id
      where _team = 'legal' and l.created_at >= v_since
    union all
    select ti.created_at from public.tech_idea_status_log ti
      where _team = 'tech' and ti.created_at >= v_since
    union all
    select oc.created_at from public.outreach_contact_status_log oc
      where _team = 'outreach' and oc.created_at >= v_since
  )
  select e.at::date, count(*)::integer
  from events e
  group by e.at::date
  order by e.at::date;
end; $$;

revoke execute on function public.get_team_activity_heatmap(text, integer) from public, anon;
grant execute on function public.get_team_activity_heatmap(text, integer) to authenticated;

comment on function public.get_team_activity_heatmap(text, integer) is
  'Real per-day event-count density for the Studio Phase 13 contribution-style activity heatmap, for the last _days days (default 182, ~26 weeks). Always includes that team''s own real team_tasks created/closed activity; legal/tech/outreach additionally get their real append-only status-log tables (legal_contract_status_log/tech_idea_status_log/outreach_contact_status_log) unioned in for richer signal -- no new table, no fabricated days. Days with zero real events are simply absent (the client renders those cells at zero intensity), not fabricated as present.';
