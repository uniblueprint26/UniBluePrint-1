-- ═══════════════════════════════════════════════════════════════════════════
-- Studio Phase 16 -- monthly goals per hub (task #41's "Leaders: monthly
-- goals" half, and the "goals" item from the Extras backlog -- #29 -- the
-- same feature covers both asks, not two separate systems).
--
-- Checked live before writing a single query (Supabase MCP execute_sql,
-- 2026-11-09): real is_lead=true rows already exist for finance, legal,
-- tech, outreach, marketing and founder (Phase 11 seeded every row false;
-- real leads have since been flagged by the founder) -- this table is
-- immediately usable, not waiting on future role grants. handler/
-- operations/co_director currently have no flagged lead; same honest-zero
-- pattern as studio_requests/tech_ideas/outreach_contacts -- nothing
-- fabricated here, list_studio_goals simply returns 0 rows for a team with
-- no goals set yet.
--
-- Same "RLS enabled, zero direct policies, SECURITY DEFINER RPCs are the
-- only access path" convention as team_tasks/studio_requests/
-- legal_contracts -- reused deliberately, not a new pattern. Only a real
-- team LEAD (_is_team_lead_or_admin, Phase 11) can create or update a
-- goal for their own team; any team member can read it
-- (_is_team_member_or_admin), same split Finance's negotiated-rate
-- visibility and Tech's idea-triage already use. No delete RPC, on
-- purpose -- same choice team_tasks made (a wrong goal gets corrected via
-- update_studio_goal, not removed), so the goal log stays a real record
-- rather than silently losing history.
--
-- Built with real avatar_url columns from the start (not a follow-up
-- "_with_avatar" RPC the way list_team_tasks/list_studio_requests needed
-- -- see Phase 14's header for why those needed a second function; this
-- table is new today so there is no pre-existing signature to preserve).
-- ═══════════════════════════════════════════════════════════════════════════

create table public.studio_goals (
  id             uuid primary key default gen_random_uuid(),
  team           text not null check (team in ('finance', 'legal', 'tech', 'outreach', 'marketing', 'handler', 'operations', 'co_director', 'founder')),
  title          text not null check (length(trim(title)) > 0),
  description    text,
  month          date not null check (date_trunc('month', month)::date = month),
  target_value   numeric,
  target_unit    text,
  current_value  numeric,
  status         text not null default 'in_progress' check (status in ('in_progress', 'on_track', 'at_risk', 'achieved', 'missed')),
  created_by     uuid not null references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index studio_goals_team_month_idx on public.studio_goals (team, month desc, created_at desc);

comment on table public.studio_goals is
  'Studio Phase 16. One row per monthly goal a hub LEAD sets for their team -- title + optional numeric target (target_value/target_unit are both free-form, e.g. 150/"IG followers" or 10/"contracts signed") + a tracked status, updated by the lead as the month progresses. month is always the 1st of its month (CHECK), so "this month''s goals" is a simple equality filter. Seeded empty -- every row from here on is a real goal set through real use of the Goals panel on each hub page, never fabricated.';

alter table public.studio_goals enable row level security;
revoke all on public.studio_goals from public, anon, authenticated;

-- ── create_studio_goal() -- lead (or founder/admin/co_director) only ─────
create or replace function public.create_studio_goal(
  _team text,
  _title text,
  _month date,
  _description text default null,
  _target_value numeric default null,
  _target_unit text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_month date := date_trunc('month', _month)::date;
begin
  if not public._is_team_lead_or_admin(_team) then
    raise exception 'not authorized -- only a team lead can set a goal';
  end if;
  if _title is null or length(trim(_title)) = 0 then
    raise exception 'a title is required';
  end if;

  insert into public.studio_goals (team, title, description, month, target_value, target_unit, created_by)
  values (_team, trim(_title), _description, v_month, _target_value, _target_unit, auth.uid())
  returning id into v_id;

  return v_id;
end; $$;

grant execute on function public.create_studio_goal(text, text, date, text, numeric, text) to authenticated;
revoke execute on function public.create_studio_goal(text, text, date, text, numeric, text) from public, anon;

comment on function public.create_studio_goal(text, text, date, text, numeric, text) is
  'Create a monthly goal for _team. Lead-gated (_is_team_lead_or_admin), same tier as Finance''s negotiated-rate visibility and Tech''s idea-triage gate. _month is normalized to the 1st of its month.';

-- ── update_studio_goal() -- lead (or founder/admin/co_director) of the
--    goal''s OWN team only. Single combined update RPC (progress + any
--    field), same "one write path, NULL means leave unchanged" shape as
--    update_team_task. ──
create or replace function public.update_studio_goal(
  _id uuid,
  _current_value numeric default null,
  _status text default null,
  _title text default null,
  _description text default null,
  _target_value numeric default null,
  _target_unit text default null,
  _clear_current_value boolean default false
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_team text;
begin
  select team into v_team from public.studio_goals where id = _id;
  if v_team is null then
    raise exception 'goal not found';
  end if;
  if not public._is_team_lead_or_admin(v_team) then
    raise exception 'not authorized -- only a team lead can update this goal';
  end if;
  if _status is not null and _status not in ('in_progress', 'on_track', 'at_risk', 'achieved', 'missed') then
    raise exception 'invalid status: %', _status;
  end if;

  update public.studio_goals
  set current_value = case when _clear_current_value then null else coalesce(_current_value, current_value) end,
      status         = coalesce(_status, status),
      title          = coalesce(nullif(trim(_title), ''), title),
      description    = coalesce(_description, description),
      target_value   = coalesce(_target_value, target_value),
      target_unit    = coalesce(_target_unit, target_unit),
      updated_at     = now()
  where id = _id;
end; $$;

grant execute on function public.update_studio_goal(uuid, numeric, text, text, text, numeric, text, boolean) to authenticated;
revoke execute on function public.update_studio_goal(uuid, numeric, text, text, text, numeric, text, boolean) from public, anon;

comment on function public.update_studio_goal(uuid, numeric, text, text, text, numeric, text, boolean) is
  'Update progress/status/fields on an existing goal -- lead-of-that-goal''s-team-gated. NULL leaves a field unchanged (same convention as update_team_task); pass _clear_current_value=true to explicitly null out current_value rather than leaving it.';

-- ── list_studio_goals(_team) -- any team member can read ─────────────────
create or replace function public.list_studio_goals(_team text)
returns table (
  id uuid, team text, title text, description text, month date,
  target_value numeric, target_unit text, current_value numeric, status text,
  created_by uuid, created_by_name text, created_by_avatar_url text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  select
    g.id, g.team, g.title, g.description, g.month,
    g.target_value, g.target_unit, g.current_value, g.status,
    g.created_by, coalesce(p.full_name, u.email::text, 'Unknown'), p.avatar_url,
    g.created_at, g.updated_at
  from public.studio_goals g
  left join public.profiles p on p.id = g.created_by
  left join auth.users u on u.id = g.created_by
  where g.team = _team
  order by g.month desc, (g.status in ('achieved', 'missed')), g.created_at desc;
end; $$;

grant execute on function public.list_studio_goals(text) to authenticated;
revoke execute on function public.list_studio_goals(text) from public, anon;

comment on function public.list_studio_goals(text) is
  'Every goal for _team, newest month first, open goals (in_progress/on_track/at_risk) ahead of resolved ones (achieved/missed) within a month. Readable by any team member (_is_team_member_or_admin) -- only creating/updating is lead-gated.';

-- ── get_all_studio_goals() -- founder/admin/co_director company-wide rollup ──
create or replace function public.get_all_studio_goals()
returns table (
  id uuid, team text, title text, month date,
  target_value numeric, target_unit text, current_value numeric, status text,
  created_by_name text, created_by_avatar_url text, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    g.id, g.team, g.title, g.month,
    g.target_value, g.target_unit, g.current_value, g.status,
    coalesce(p.full_name, u.email::text, 'Unknown'), p.avatar_url, g.updated_at
  from public.studio_goals g
  left join public.profiles p on p.id = g.created_by
  left join auth.users u on u.id = g.created_by
  order by g.month desc, g.team, (g.status in ('achieved', 'missed')), g.updated_at desc;
end; $$;

grant execute on function public.get_all_studio_goals() to authenticated;
revoke execute on function public.get_all_studio_goals() from public, anon;

comment on function public.get_all_studio_goals() is
  'Company-wide rollup of every hub''s goals, any team, any month -- founder/admin/co_director only. The studio_goals counterpart to get_all_pending_studio_requests()/get_co_director_pending_decisions(), reused by both the Co-Director Hub and Founder Dashboard the same way those rollups already are.';
