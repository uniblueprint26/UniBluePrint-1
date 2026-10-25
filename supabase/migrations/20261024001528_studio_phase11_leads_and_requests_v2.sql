-- ═══════════════════════════════════════════════════════════════════════════
-- Studio Phase 11 -- cross-hub access/request system + lead-tier access
-- (task #28). Two independent pieces:
--
--   1. A real "leads" concept, resolving every TODO(phase-2-access-system)
--      marker left across Finance/Tech/Outreach/Marketing (grepped live
--      before writing this -- `grep -rn "phase-2-access-system" src/
--      supabase/migrations/`). Minimal schema: one new `is_lead` boolean on
--      the EXISTING user_roles table (a (user_id, role) row already is "this
--      person, on this team" -- is_lead flags that specific grant as a lead
--      grant, no parallel table needed) + one new generic helper,
--      _is_team_lead_or_admin(_team), matching the exact shape of the
--      existing _is_team_member_or_admin(_team)/_is_X_admin() helpers.
--
--      Checked live before seeding anything (Supabase MCP execute_sql):
--      EVERY finance/legal/tech/outreach/marketing/co_director role grant
--      in user_roles today belongs to a banned QA/test account -- Rachel,
--      Basmail, Eman, Tayyab, Sienna, Ethan, Fabz, James, Alex, Daniel and
--      Elizabeth (the real named team members these hubs were built for,
--      per the founder's briefs and prior commit messages) have NO real
--      account holding their hub's role in this system yet (a handful --
--      e.g. Elizabeth -- have an account, but it holds no hub role at all).
--      So no is_lead=true row is seeded here for any of them -- doing so
--      would mean fabricating a role grant for a person who has never
--      actually been granted it, which breaks the same "never fabricate"
--      discipline every prior Studio phase applied to its data (outreach
--      log seeded empty, team_tasks seeded with 0 rows, etc). Every row
--      today is seeded is_lead=false (the column default) -- genuinely 0
--      real leads flagged today, not a placeholder. The moment a real
--      person is actually granted their hub role, flip is_lead on with one
--      UPDATE and every check below picks it up immediately.
--
--   2. studio_requests -- the genuinely new table: cross-hub task handoff
--      (hand a team_tasks row to a DIFFERENT hub) and access requests (ask
--      to see another hub's data, or ask your own hub's leads for the
--      lead-only view). Same "RLS enabled, zero direct policies, SECURITY
--      DEFINER RPCs are the only access path" convention as team_tasks/
--      legal_contracts/tech_ideas -- reused deliberately, not a new
--      pattern. Plain text + CHECK for request_type/status (same choice
--      every other Studio table made for its own status column -- app_role
--      is the only real Postgres enum anywhere in this schema, and it is
--      not touched here, so no standalone-transaction enum migration is
--      needed this phase).
--
--      A task handoff is *directed at a team*, not a named person on that
--      team (the requester generally cannot see the target team's own
--      roster -- get_team_roster()/_is_team_member_or_admin() are, by
--      design, only callable by members of that specific team, and this
--      phase does not loosen that). Approving a handoff lets the APPROVER
--      (a member of their own target team) optionally re-assign it to a
--      specific teammate at that moment, via their own, already-authorized
--      roster -- real re-assignment, not just a log entry. An access
--      request has no further automatic effect beyond the approve/deny
--      record itself (it is a real decision log, the same relationship
--      money_requests already has to actually moving money) -- actually
--      granting live, request-scoped read access into another hub's RLS
--      would be a materially bigger system (per-request dynamic policies)
--      and is flagged here, not built, same as Finance Hub's own "A real
--      per-person staff-roles system is bigger than this pass" judgment
--      call pattern.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1a. is_lead column ──────────────────────────────────────────────────
alter table public.user_roles add column if not exists is_lead boolean not null default false;

comment on column public.user_roles.is_lead is
  'Whether this (user_id, role) grant is a TEAM LEAD, not just a team member -- e.g. Legal''s Rachel/Basmail vs a team member below them. Studio Phase 11, resolving each hub''s TODO(phase-2-access-system). Default/seeded false for every row today: checked live, every real finance/legal/tech/outreach/marketing/co_director grant currently belongs to a banned QA/test account, never a real named team member (see this migration''s header) -- no lead flag is fabricated here. Flip it with one UPDATE the moment a real person actually holds the role; every _is_team_lead_or_admin()/am_i_team_lead() check picks it up immediately, no further migration needed.';

-- ── 1b. Generic lead-or-admin helper, same shape as _is_team_member_or_admin ──
create or replace function public._is_team_lead_or_admin(_team text)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role::text = _team and ur.is_lead
    )
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'co_director')
$$;

revoke execute on function public._is_team_lead_or_admin(text) from public, anon;
grant execute on function public._is_team_lead_or_admin(text) to authenticated;

comment on function public._is_team_lead_or_admin(text) is
  'Generic "is this caller a LEAD of _team (or founder/admin/co_director)" check -- the lead-tier counterpart to _is_team_member_or_admin(_team). Backs the row-level splits Finance (negotiated-rate visibility) and Tech (idea-triage) TODO(phase-2-access-system) comments asked for.';

-- Public RPC so hub pages can ask "am I a lead here" to decide what to
-- render (e.g. show/hide the Negotiated rate column, make the idea-triage
-- dropdown editable) -- same "UI asks a real RPC, never guesses from the
-- route-level role alone" principle every hub already follows.
create or replace function public.am_i_team_lead(_team text)
returns boolean
language sql stable security definer set search_path = public as $$
  select public._is_team_lead_or_admin(_team)
$$;

revoke execute on function public.am_i_team_lead(text) from public, anon;
grant execute on function public.am_i_team_lead(text) to authenticated;

comment on function public.am_i_team_lead(text) is
  'UI-facing: can the calling user see/do the lead-only things on _team''s hub (a real lead, or founder/admin/co_director). Studio Phase 11.';

-- ── 1c. RESOLVE: Finance -- negotiated rate visibility, leads only ───────
-- Was: v_can_see_rate := public.is_finance_or_founder(auth.uid()) -- true
-- for ANY finance team member. Now: founder/co_director (already granted
-- via is_finance_or_founder's own definition) and a real finance LEAD only
-- -- a team-member finance viewer gets null for these two columns, same as
-- Operations already did. Signature/every other column unchanged.
create or replace function public.get_partner_tier_admin_list()
returns table (
  entity_type               text,
  entity_id                 uuid,
  display_name              text,
  category                  text,
  is_active                 boolean,
  tier                      text,
  tier_set_at               timestamptz,
  payment_option            text,
  negotiated_commission_pct numeric,
  negotiated_rationale      text,
  negotiated_effective_from timestamptz,
  founding_badge            boolean,
  founding_badge_set_at     timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_can_see_rate boolean;
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    return;
  end if;
  -- RESOLVED (Studio Phase 11, was TODO(phase-2-access-system)): row-level
  -- "can this specific person see negotiated rates" check, not the whole
  -- finance/founder/admin route-level group -- a finance team member who
  -- isn't a lead now gets null here too, same as Operations always did.
  v_can_see_rate := public._is_team_lead_or_admin('finance') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'co_director');

  return query
  select
    'partner'::text, p.id, p.name, p.type, p.active,
    pta.tier, pta.tier_set_at,
    pta.payment_option,
    case when v_can_see_rate then nl.negotiated_commission_pct else null end,
    case when v_can_see_rate then nl.rationale else null end,
    case when v_can_see_rate then nl.effective_from else null end,
    coalesce(pta.founding_badge, false), pta.founding_badge_set_at
  from public.partners p
  left join public.partner_tier_assignments pta on pta.partner_id = p.id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.partner_id = p.id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true

  union all

  select
    'coach'::text, cp.id, coalesce(prof.full_name, cp.coach_slug, 'Coach'), cp.specialisation, cp.available,
    pta.tier, pta.tier_set_at,
    pta.payment_option,
    case when v_can_see_rate then nl.negotiated_commission_pct else null end,
    case when v_can_see_rate then nl.rationale else null end,
    case when v_can_see_rate then nl.effective_from else null end,
    coalesce(pta.founding_badge, false), pta.founding_badge_set_at
  from public.coach_profiles cp
  left join public.profiles prof on prof.id = cp.user_id
  left join public.partner_tier_assignments pta on pta.coach_profile_id = cp.id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.coach_profile_id = cp.id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true

  order by 1, 3;
end; $$;

comment on function public.get_partner_tier_admin_list() is
  'Founder/Finance/Operations admin listing of every partner and coach with their current tier/payment_option/founding_badge. negotiated_commission_pct/negotiated_rationale/negotiated_effective_from come back NULL for an Operations caller, AND (Studio Phase 11) for a finance team member who is not flagged is_lead -- only founder/co_director and a real finance lead see the actual rate.';

-- ── 1d. RESOLVE: Tech -- idea triage, leads only ─────────────────────────
-- Was: gated to _is_tech_admin() (whole tech/founder/admin/co_director
-- group). Now: triage (status changes) is lead-only (Eman/Tayyab, once
-- real) + founder/admin/co_director; create_tech_idea/list_tech_ideas stay
-- team-wide on purpose (Praise/Enoch keep submitting + reading, per the
-- original TODO's own wording) -- only this one function's gate changes.
create or replace function public.set_tech_idea_status(_id uuid, _status text, _notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_role text;
begin
  -- RESOLVED (Studio Phase 11, was TODO(phase-2-access-system)): triage is
  -- now gated to a real tech LEAD (or founder/admin/co_director), not the
  -- whole tech/founder/admin group -- Praise/Enoch (non-leads) can still
  -- submit via create_tech_idea and read via list_tech_ideas, just not
  -- change status, per the original TODO's own ask.
  if not public._is_team_lead_or_admin('tech') then
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
  'The only write path for an idea''s status -- updates tech_ideas and appends to tech_idea_status_log in the same transaction. RESOLVED (Studio Phase 11): gated to a real tech lead (is_lead on user_roles) or founder/admin/co_director -- was team-wide (_is_tech_admin) before, see the TODO this replaced on this function and on TechDashboardPage.jsx.';

-- ── 1e. CONFIRMED, not changed: Outreach / Marketing have no named lead ──
-- Per the founder's brief, no lead is named among Sienna/Ethan/Fabz/James
-- (Outreach) or Alex/Elizabeth/Ethan/Fabz (Marketing) -- re-confirmed this
-- phase, not fabricated. _is_outreach_admin()/_is_marketing_admin() are
-- left exactly as they are (team-wide); their own TODO(phase-2-access-
-- system) comments in supabase/migrations/20261022190100_outreach_hub_
-- schema.sql and 20261022200100_marketing_hub_schema.sql, and in
-- OutreachDashboardPage.jsx/MarketingDashboardPage.jsx, are left in place
-- as an honest record of this judgment call, not deleted -- is_lead exists
-- on user_roles for these teams too (schema is generic), ready the day the
-- founder actually names a lead for either team.

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. studio_requests -- cross-hub task handoff + access requests
-- ═══════════════════════════════════════════════════════════════════════════

create table public.studio_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references auth.users(id) on delete set null,
  requester_team  text not null,
  target_team     text not null,
  target_user_id  uuid references auth.users(id) on delete set null,
  request_type    text not null check (request_type in ('task_handoff', 'access_request')),
  related_task_id uuid references public.team_tasks(id) on delete set null,
  message         text not null check (length(trim(message)) > 0),
  status          text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index studio_requests_target_idx on public.studio_requests (target_team, status, created_at desc);
create index studio_requests_requester_idx on public.studio_requests (requester_team, created_at desc);

comment on table public.studio_requests is
  'Studio Phase 11. Two real cross-hub request types: task_handoff (delegate an existing team_tasks row -- related_task_id -- to a DIFFERENT hub/team), and access_request (ask to see another hub''s data, or ask your own hub''s leads for the lead-only view -- no related_task_id). requester_team/target_team are free-text team labels (same deliberate choice as team_tasks.team, not a foreign key to app_role, so any future team works with zero schema change). target_user_id is optional and only ever set by the APPROVER at resolution time for a task_handoff (re-assigning within their own, already-authorized roster) -- a requester cannot name a specific person on a hub they are not a member of. Approving an access_request is a real decision record (status/resolved_by/resolved_at), the same relationship money_requests already has to actually moving money -- it does not itself open live RLS-level access into another hub; that would be a materially bigger per-request-dynamic-policy system, flagged as future work, not built here. Seeded empty on purpose -- every row from here on is a real request, created through real use of the Requests panel on each hub page, never fabricated.';

alter table public.studio_requests enable row level security;
revoke all on public.studio_requests from public, anon, authenticated;

-- ── create_studio_request() ──────────────────────────────────────────────
create or replace function public.create_studio_request(
  _target_team text,
  _request_type text,
  _message text,
  _target_user_id uuid default null,
  _related_task_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_requester_team text;
begin
  if _request_type not in ('task_handoff', 'access_request') then
    raise exception 'invalid request_type: %', _request_type;
  end if;
  if _target_team not in ('finance', 'legal', 'tech', 'outreach', 'marketing', 'handler', 'operations', 'co_director', 'founder') then
    raise exception 'invalid target_team: %', _target_team;
  end if;
  if _message is null or length(trim(_message)) = 0 then
    raise exception 'a message is required';
  end if;
  if _request_type = 'task_handoff' and _related_task_id is null then
    raise exception 'task_handoff requires related_task_id';
  end if;

  select role::text into v_requester_team from public.user_roles
    where user_id = auth.uid() and role <> 'user' order by role limit 1;

  if v_requester_team is null then
    raise exception 'not authorized -- no team role held';
  end if;
  if v_requester_team = _target_team then
    raise exception 'target_team must be a different team';
  end if;

  -- A task handoff can only be raised by someone who could already see
  -- that task on its own hub today (reuses the exact same membership check
  -- list_team_tasks/create_team_task already gate on -- no new privilege).
  if _related_task_id is not null then
    if not exists (
      select 1 from public.team_tasks t
      where t.id = _related_task_id and public._is_team_member_or_admin(t.team)
    ) then
      raise exception 'task not found or not authorized';
    end if;
  end if;

  insert into public.studio_requests (requester_id, requester_team, target_team, target_user_id, request_type, related_task_id, message)
  values (auth.uid(), v_requester_team, _target_team, _target_user_id, _request_type, _related_task_id, trim(_message))
  returning id into v_id;

  return v_id;
end; $$;

grant execute on function public.create_studio_request(text, text, text, uuid, uuid) to authenticated;
revoke execute on function public.create_studio_request(text, text, text, uuid, uuid) from public, anon;

comment on function public.create_studio_request(text, text, text, uuid, uuid) is
  'Create a cross-hub task_handoff (needs related_task_id, a team_tasks row the caller can already see on their own hub) or access_request (no related_task_id). requester_team is a snapshot of the caller''s own team at creation time, same pattern as changed_by_role_snapshot elsewhere.';

-- ── approve_studio_request() / deny_studio_request() ─────────────────────
create or replace function public.approve_studio_request(
  _id uuid,
  _resolution_note text default null,
  _assign_to uuid default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_team text;
  v_request_type text;
  v_related_task uuid;
  v_status text;
begin
  select target_team, request_type, related_task_id, status
    into v_target_team, v_request_type, v_related_task, v_status
    from public.studio_requests where id = _id;

  if v_target_team is null then
    raise exception 'request not found';
  end if;
  if not public._is_team_member_or_admin(v_target_team) then
    raise exception 'not authorized';
  end if;
  if v_status <> 'pending' then
    raise exception 'request is already %', v_status;
  end if;

  if v_request_type = 'task_handoff' then
    if v_related_task is null or not exists (select 1 from public.team_tasks where id = v_related_task) then
      raise exception 'related task no longer exists';
    end if;
    if _assign_to is not null and not exists (
      select 1 from public.user_roles where user_id = _assign_to and role::text = v_target_team
    ) then
      raise exception 'cannot assign to a user who is not on %', v_target_team;
    end if;
    -- Real handoff: the task actually moves to the target team, optionally
    -- straight to a named person on it (chosen by the approver, from their
    -- own, already-authorized roster) -- not just a status label on the log.
    update public.team_tasks
      set team = v_target_team, assigned_to = _assign_to, updated_at = now()
      where id = v_related_task;
  end if;

  update public.studio_requests
    set status = 'approved', resolved_by = auth.uid(), resolved_at = now(),
        resolution_note = _resolution_note, updated_at = now()
    where id = _id;
end; $$;

grant execute on function public.approve_studio_request(uuid, text, uuid) to authenticated;
revoke execute on function public.approve_studio_request(uuid, text, uuid) from public, anon;

create or replace function public.deny_studio_request(_id uuid, _resolution_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_team text;
  v_status text;
begin
  select target_team, status into v_target_team, v_status from public.studio_requests where id = _id;
  if v_target_team is null then
    raise exception 'request not found';
  end if;
  if not public._is_team_member_or_admin(v_target_team) then
    raise exception 'not authorized';
  end if;
  if v_status <> 'pending' then
    raise exception 'request is already %', v_status;
  end if;

  update public.studio_requests
    set status = 'denied', resolved_by = auth.uid(), resolved_at = now(),
        resolution_note = _resolution_note, updated_at = now()
    where id = _id;
end; $$;

grant execute on function public.deny_studio_request(uuid, text) to authenticated;
revoke execute on function public.deny_studio_request(uuid, text) from public, anon;

comment on function public.approve_studio_request(uuid, text, uuid) is
  'Only a member/lead/admin of the TARGET team can approve. For a task_handoff, actually moves the team_tasks row to target_team and (optionally) assigns it to _assign_to, a member of target_team the approver picks from their own roster.';
comment on function public.deny_studio_request(uuid, text) is
  'Only a member/lead/admin of the TARGET team can deny. No side effect beyond the status/resolution record.';

-- ── list_studio_requests(_team) -- incoming + outgoing for one hub ───────
create or replace function public.list_studio_requests(_team text)
returns table (
  id uuid, requester_id uuid, requester_name text, requester_team text,
  target_team text, target_user_id uuid, target_user_name text,
  request_type text, related_task_id uuid, related_task_title text,
  message text, status text, resolved_by uuid, resolved_by_name text,
  resolved_at timestamptz, resolution_note text, created_at timestamptz,
  direction text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id, r.requester_id, coalesce(rp.full_name, ru.email::text, 'Unknown'), r.requester_team,
    r.target_team, r.target_user_id, coalesce(tp.full_name, tu.email::text),
    r.request_type, r.related_task_id, tt.title,
    r.message, r.status, r.resolved_by, coalesce(bp.full_name, bu.email::text),
    r.resolved_at, r.resolution_note, r.created_at,
    case when r.target_team = _team then 'incoming' else 'outgoing' end
  from public.studio_requests r
  left join public.profiles rp on rp.id = r.requester_id
  left join auth.users ru on ru.id = r.requester_id
  left join public.profiles tp on tp.id = r.target_user_id
  left join auth.users tu on tu.id = r.target_user_id
  left join public.profiles bp on bp.id = r.resolved_by
  left join auth.users bu on bu.id = r.resolved_by
  left join public.team_tasks tt on tt.id = r.related_task_id
  where r.target_team = _team or r.requester_team = _team
  order by (r.status = 'pending') desc, r.created_at desc;
end; $$;

grant execute on function public.list_studio_requests(text) to authenticated;
revoke execute on function public.list_studio_requests(text) from public, anon;

comment on function public.list_studio_requests(text) is
  'Every studio_requests row touching _team, either direction -- incoming (target_team = _team, approve/deny lives here) or outgoing (requester_team = _team, status-only). The one read path for the Requests panel on each hub page.';

-- ── get_all_pending_studio_requests() -- Co-Director/Founder rollup ──────
create or replace function public.get_all_pending_studio_requests()
returns table (
  id uuid, requester_team text, requester_name text,
  target_team text, target_user_name text,
  request_type text, related_task_title text,
  message text, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'co_director')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id, r.requester_team, coalesce(rp.full_name, ru.email::text, 'Unknown'),
    r.target_team, coalesce(tp.full_name, tu.email::text),
    r.request_type, tt.title,
    r.message, r.created_at
  from public.studio_requests r
  left join public.profiles rp on rp.id = r.requester_id
  left join auth.users ru on ru.id = r.requester_id
  left join public.profiles tp on tp.id = r.target_user_id
  left join auth.users tu on tu.id = r.target_user_id
  left join public.team_tasks tt on tt.id = r.related_task_id
  where r.status = 'pending'
  order by r.created_at asc;
end; $$;

grant execute on function public.get_all_pending_studio_requests() to authenticated;
revoke execute on function public.get_all_pending_studio_requests() from public, anon;

comment on function public.get_all_pending_studio_requests() is
  'Company-wide rollup of every pending cross-hub request, any team -- founder/admin/co_director only. The studio_requests counterpart to get_co_director_pending_decisions(), reused by both the Co-Director Hub and Founder Dashboard the same way that rollup getter already is.';
