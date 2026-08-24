-- Second pass of pre-launch fixes, found by a full-schema RLS/FK audit.

-- ── 1. gdpr_requests.user_id was ON DELETE CASCADE ──────────────────────────
-- Completing a "deletion" GDPR request (deleting the user) would cascade-
-- delete the very row documenting that the request was received, actioned,
-- and by whom — destroying the Article 12 compliance record at the exact
-- moment it matters most. The table already supports a null user_id (added
-- in 20260824130000 specifically so an anonymous requester's row doesn't
-- need one) — switching to SET NULL means the historical record survives.
alter table public.gdpr_requests
  drop constraint if exists gdpr_requests_user_id_fkey,
  add constraint gdpr_requests_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- ── 2. Every other FK to auth.users with no ON DELETE action ────────────────
-- Postgres's default is NO ACTION: deleting a user errors out and aborts if
-- ANY of these rows reference them, meaning a GDPR deletion request cannot
-- be completed at all for anyone who has ever acted as a handler/ops/coach.
-- Three columns are NOT NULL and need that dropped first so SET NULL is
-- actually satisfiable.
alter table public.ticket_revisions alter column revised_by drop not null;
alter table public.commission_declarations alter column handler_id drop not null;
alter table public.spot_checks alter column checked_by drop not null;

alter table public.submissions
  drop constraint if exists submissions_handler_id_fkey,
  add constraint submissions_handler_id_fkey foreign key (handler_id) references auth.users(id) on delete set null;
alter table public.handler_queue
  drop constraint if exists handler_queue_handler_id_fkey,
  add constraint handler_queue_handler_id_fkey foreign key (handler_id) references auth.users(id) on delete set null;
alter table public.ticket_revisions
  drop constraint if exists ticket_revisions_revised_by_fkey,
  add constraint ticket_revisions_revised_by_fkey foreign key (revised_by) references auth.users(id) on delete set null;
alter table public.commission_declarations
  drop constraint if exists commission_declarations_handler_id_fkey,
  add constraint commission_declarations_handler_id_fkey foreign key (handler_id) references auth.users(id) on delete set null;
alter table public.operations_flags
  drop constraint if exists operations_flags_flagged_by_fkey,
  add constraint operations_flags_flagged_by_fkey foreign key (flagged_by) references auth.users(id) on delete set null;
alter table public.spot_checks
  drop constraint if exists spot_checks_checked_by_fkey,
  add constraint spot_checks_checked_by_fkey foreign key (checked_by) references auth.users(id) on delete set null;
alter table public.refunds
  drop constraint if exists refunds_processed_by_fkey,
  add constraint refunds_processed_by_fkey foreign key (processed_by) references auth.users(id) on delete set null;
alter table public.boards
  drop constraint if exists boards_created_by_fkey,
  add constraint boards_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.handler_specialisms
  drop constraint if exists handler_specialisms_approved_by_fkey,
  add constraint handler_specialisms_approved_by_fkey foreign key (approved_by) references auth.users(id) on delete set null;
alter table public.prompt_library
  drop constraint if exists prompt_library_created_by_fkey,
  add constraint prompt_library_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.gdpr_requests
  drop constraint if exists gdpr_requests_processed_by_fkey,
  add constraint gdpr_requests_processed_by_fkey foreign key (processed_by) references auth.users(id) on delete set null;

-- ── 3. partner_category_benchmark() was missing the ops/founder gate its ────
-- sibling functions have — any authenticated user (a regular student
-- account) could call it directly for aggregate partner performance data.
create or replace function public.partner_category_benchmark(_category text)
returns table(avg_views numeric, avg_claims numeric, median_views numeric)
language sql stable security definer set search_path = public as $$
  select avg(views), avg(claims), percentile_cont(0.5) within group (order by views)
  from public.partner_performance_stats
  where category = _category
    and (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
$$;

-- ── 4. Four handler-performance helper functions had no authorization check ─
-- at all, letting any authenticated user query another handler's internal
-- performance flags or infer another user's ticket priority — bypassing the
-- RLS boundary the underlying tables were explicitly given. Not called from
-- any shipped screen today, but closing before the Handler Portal UI (which
-- will call these) is built on top of them.
create or replace function public.handler_missed_checkins_last_7_days(_handler_id uuid)
returns integer
language plpgsql stable security definer set search_path = public as $$
declare v_count integer;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder') or auth.uid() = _handler_id) then
    raise exception 'not authorized';
  end if;
  select count(*)::integer into v_count from public.handler_shifts
    where handler_id = _handler_id
      and missed_checkin = true
      and scheduled_start > now() - interval '7 days';
  return v_count;
end; $$;

create or replace function public.is_ghost_handler(_handler_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder') or auth.uid() = _handler_id) then
    raise exception 'not authorized';
  end if;
  return public.handler_missed_checkins_last_7_days(_handler_id) >= 3;
end; $$;

-- compute_queue_priority(_submission_id) — same gap: any authenticated user
-- could pass any submission id and infer another user's ticket tier/urgency.
-- Converted from a bare SQL function to plpgsql purely to add the auth
-- guard up front; the scoring logic itself is unchanged from the original.
create or replace function public.compute_queue_priority(_submission_id uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_tier text;
  v_urgency text;
  v_deadline timestamptz;
  v_base integer;
  v_standard_position integer;
  v_handler_id uuid;
begin
  select tier, deadline, handler_id into v_tier, v_deadline, v_handler_id
    from public.submissions where id = _submission_id;

  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder') or auth.uid() = v_handler_id) then
    raise exception 'not authorized';
  end if;

  v_urgency := public.ticket_urgency(v_deadline, v_tier);

  v_base := case
    when v_tier = 'premium' then 300
    when v_tier = 'standard' and v_urgency = 'red' then 250 -- elevated to Premium-equal urgency
    else 100
  end;

  if v_tier = 'standard' then
    select count(*) into v_standard_position
    from public.handler_queue hq
    join public.submissions s on s.id = hq.submission_id
    where s.tier = 'standard'
      and hq.queued_at < (select queued_at from public.handler_queue where submission_id = _submission_id);
    v_base := greatest(v_base, 100 - least(coalesce(v_standard_position, 0), 10));
  end if;

  return v_base;
end; $$;

comment on function public.compute_queue_priority(uuid) is
  'Call on insert into handler_queue and periodically to refresh urgency-driven elevation. Deploy as a scheduled Edge Function job (see docs/PORTALS_AND_OPERATIONS_SPEC.md) -- this function computes the score, it does not run itself. SECURITY: caller must be operations/founder or the assigned handler, enforced in body as of 20260824150000.';

-- flag_capacity_gaming(_handler_id) — same gap. Converted from a bare SQL
-- function to plpgsql to add the guard; scoring logic unchanged.
create or replace function public.flag_capacity_gaming(_handler_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_result boolean;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder') or auth.uid() = _handler_id) then
    raise exception 'not authorized';
  end if;

  select coalesce(avg(
    case when extract(epoch from (delivered_at - assigned_at)) <
      0.5 * extract(epoch from (
        (select (finish_time - start_time) from public.handler_availability
         where handler_id = _handler_id limit 1)
      ))
    then 1 else 0 end
  ), 0) > 0.5
  into v_result
  from public.submissions
  where handler_id = _handler_id
    and delivered_at > now() - interval '21 days'
    and assigned_at is not null and delivered_at is not null;

  return v_result;
end; $$;

-- ── 5. refunds "Operations can manage" policy was SELECT-only despite the ───
-- name — Operations could see refund requests but never actually process
-- one (no UPDATE policy existed for anyone). Same bug class as the `ads`
-- and website-forms tables already fixed elsewhere this session.
create policy "Operations can process refunds" on public.refunds
  for update to authenticated
  using (public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'operations'));

-- ── 6. start_direct_chat() race condition ────────────────────────────────────
-- Two users starting a direct chat with each other at the same moment could
-- both try to insert the room row; the loser hit the unique constraint with
-- no handling. Not reachable today (direct chat isn't wired into any screen
-- yet) but fixing before it is.
create or replace function public.start_direct_chat(other_user_id uuid, room_name text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_context_id text;
  v_room_id uuid;
begin
  if other_user_id = auth.uid() then
    raise exception 'cannot start a direct chat with yourself';
  end if;
  v_context_id := (select string_agg(id::text, '_' order by id) from unnest(array[auth.uid(), other_user_id]) as id);

  insert into public.chat_rooms (context_type, context_id, name, created_by)
  values ('direct', v_context_id, room_name, auth.uid())
  on conflict (context_type, context_id) do nothing;

  select id into v_room_id from public.chat_rooms
    where context_type = 'direct' and context_id = v_context_id;

  insert into public.chat_participants (room_id, user_id, display_name)
  values
    (v_room_id, auth.uid(), coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'Member')),
    (v_room_id, other_user_id, coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = other_user_id), 'Member'))
  on conflict (room_id, user_id) do nothing;

  return v_room_id;
end; $$;
