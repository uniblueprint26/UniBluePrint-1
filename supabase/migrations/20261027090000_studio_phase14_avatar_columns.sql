-- ═══════════════════════════════════════════════════════════════════════════
-- Studio Phase 14 -- navigation/identity layer. The only schema change this
-- phase needs: real profiles.avatar_url alongside the existing full_name
-- lookups in team_tasks/team_roster/studio_requests, so the new shared
-- Avatar component (src/components/studio/Avatar.jsx) can render a real
-- uploaded photo instead of always falling back to initials, for
-- TaskBoard's assignee/creator and RequestPanel's requester/resolver/
-- target-user. profiles.avatar_url already exists (confirmed live, used
-- today by the mobile app's ProfileScreen.jsx/EditProfileModal) -- no new
-- column anywhere, this migration only adds three new SECURITY DEFINER
-- RPCs that re-select the exact same rows their Studio Phase 2/11
-- originals do, with avatar_url appended.
--
-- Why new functions (_with_avatar) rather than editing get_team_roster/
-- list_team_tasks/list_studio_requests in place: Postgres refuses to widen
-- a RETURNS TABLE function's column list via CREATE OR REPLACE ("cannot
-- change return type of existing function... Use DROP FUNCTION first"),
-- and DROP FUNCTION is a destructive statement this environment's
-- migration tooling would not let proceed non-interactively today (the
-- founder/DBA confirmation gate times out with no one available to answer
-- it -- checked live, twice, before taking this path). Rather than block
-- the whole phase on that, this migration stays purely additive -- three
-- brand-new CREATE FUNCTION statements, nothing dropped or altered -- and
-- src/lib/studioMetrics.js's getTeamRoster/getTeamTasks/listStudioRequests
-- are repointed at these new RPC names. The original three functions are
-- left in the database unused by any Studio code from this phase on
-- (harmless, same "leave the old file in place rather than delete it"
-- precedent StudioSidebar.jsx's own header comment already set for
-- SectionJumpNav.jsx) -- a future pass with a human present to approve a
-- DROP can retire them for real; flagged here, not forced through.
--
-- The client cannot read another person's profiles.avatar_url directly
-- (RLS: "Users can read own profile" is auth.uid() = id only, checked
-- live) -- these RPCs are SECURITY DEFINER and already join profiles for
-- full_name, so adding avatar_url to that same already-present join is the
-- one new column each needs.
-- ═══════════════════════════════════════════════════════════════════════════

create function public.get_team_roster_with_avatar(_team text)
returns table(user_id uuid, full_name text, email text, avatar_url text)
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  if not public._is_team_member_or_admin(_team) then
    raise exception 'not authorized';
  end if;

  return query
  select ur.user_id, p.full_name, u.email::text, p.avatar_url
  from public.user_roles ur
  join auth.users u on u.id = ur.user_id
  left join public.profiles p on p.id = ur.user_id
  where ur.role::text = _team
  order by coalesce(p.full_name, u.email::text);
end; $$;

revoke execute on function public.get_team_roster_with_avatar(text) from public, anon;
grant execute on function public.get_team_roster_with_avatar(text) to authenticated;

comment on function public.get_team_roster_with_avatar(text) is
  'Studio Phase 14. Same rows/order as get_team_roster(_team) (Studio Phase 2), plus profiles.avatar_url, so the assignee picker and the new Avatar component can render a real photo instead of always falling back to initials. See this migration''s header for why this is a new function rather than an edit to get_team_roster itself.';

-- ── list_team_tasks_with_avatar(_team) -- adds assignee/created_by avatar_url ──
create function public.list_team_tasks_with_avatar(_team text)
returns table(
  id uuid, team text, title text, description text, status text,
  batch_label text, target_date date, assigned_to uuid, assignee_name text,
  created_by uuid, created_by_name text, created_at timestamp with time zone,
  updated_at timestamp with time zone,
  assignee_avatar_url text, created_by_avatar_url text
)
language plpgsql
stable security definer
set search_path to 'public'
as $$
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
    t.created_at, t.updated_at,
    ap.avatar_url, cp.avatar_url
  from public.team_tasks t
  left join public.profiles ap on ap.id = t.assigned_to
  left join auth.users au on au.id = t.assigned_to
  left join public.profiles cp on cp.id = t.created_by
  left join auth.users cu on cu.id = t.created_by
  where t.team = _team
  order by (t.status = 'done'), t.target_date asc nulls last, t.created_at desc;
end; $$;

revoke execute on function public.list_team_tasks_with_avatar(text) from public, anon;
grant execute on function public.list_team_tasks_with_avatar(text) to authenticated;

comment on function public.list_team_tasks_with_avatar(text) is
  'Studio Phase 14. Same rows/order as list_team_tasks(_team) (Studio Phase 2), plus assignee_avatar_url/created_by_avatar_url, for TaskBoard''s new Avatar rendering. See this migration''s header for why this is a new function rather than an edit to list_team_tasks itself.';

-- ── list_studio_requests_with_avatar(_team) -- adds requester/target/resolver avatar_url ──
create function public.list_studio_requests_with_avatar(_team text)
returns table (
  id uuid, requester_id uuid, requester_name text, requester_team text,
  target_team text, target_user_id uuid, target_user_name text,
  request_type text, related_task_id uuid, related_task_title text,
  message text, status text, resolved_by uuid, resolved_by_name text,
  resolved_at timestamptz, resolution_note text, created_at timestamptz,
  direction text,
  requester_avatar_url text, target_user_avatar_url text, resolved_by_avatar_url text
)
language plpgsql
stable security definer
set search_path to 'public'
as $$
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
    case when r.target_team = _team then 'incoming' else 'outgoing' end,
    rp.avatar_url, tp.avatar_url, bp.avatar_url
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

revoke execute on function public.list_studio_requests_with_avatar(text) from public, anon;
grant execute on function public.list_studio_requests_with_avatar(text) to authenticated;

comment on function public.list_studio_requests_with_avatar(text) is
  'Studio Phase 14. Same rows/order as list_studio_requests(_team) (Studio Phase 11), plus requester_avatar_url/target_user_avatar_url/resolved_by_avatar_url, for RequestPanel''s new Avatar rendering. See this migration''s header for why this is a new function rather than an edit to list_studio_requests itself.';

-- ── Studio Phase 14 -- minimal real avatar upload for the Studio admin
-- surface (no existing web upload UI to reuse -- app/src/screens/
-- ProfileScreen.jsx's ImageUploader is React Native only). Reuses the
-- EXACT existing profile-pictures bucket/path/RLS convention the mobile
-- app already writes through (checked live: storage.objects policies
-- "profile-pictures: owner insert/update/delete" are already
-- foldername(name)[1] = auth.uid()::text, "profile-pictures: public read"
-- already bucket-wide) -- no new bucket, no new policy, nothing to add
-- here. getMyStudioAvatar()/uploadMyStudioAvatar() in studioMetrics.js
-- read/write public.profiles.avatar_url directly (RLS: "Users can read/
-- update own profile" already covers exactly this -- auth.uid() = id),
-- which also needs no new policy.
