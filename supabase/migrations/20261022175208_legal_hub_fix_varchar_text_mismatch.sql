-- Fix: auth.users.email is `character varying(255)`, not `text` -- every
-- RPC above that returned it (or coalesced it) straight into a `text`
-- RETURNS TABLE column failed at call time with 42804 "structure of query
-- does not match function result type", caught live during QA sign-in
-- testing. Re-defined with explicit ::text casts, same signatures, no
-- caller changes.

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
