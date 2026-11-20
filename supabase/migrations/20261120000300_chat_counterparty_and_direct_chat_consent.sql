-- Changes: adds RPC join_chat_counterparty (lets a chat opened from an Ad Board listing, board post or carpool route add the poster) and makes start_direct_chat require an accepted connection request, an existing room, or a pending request addressed to the caller. Destructive: no (new function, one function body replaced). Undo: drop function public.join_chat_counterparty(uuid, uuid); re-create start_direct_chat from the original body at the bottom of this file.
--
-- F01 / G2: useChat upserts a chat_participants row for the OTHER person.
-- The only insert policy ("Users can join group rooms") requires
-- user_id = auth.uid(), so the whole upsert is denied, the poster never joins
-- and never gets a notification. RLS stays strict. This SECURITY DEFINER RPC
-- is the only way to add someone else, and it checks the caller first.
--
-- What join_chat_counterparty checks
--   * caller is signed in and is already a participant of the room
--   * the room is an ad, board or carpool room (never a direct room)
--   * neither side has blocked the other
--   * the other person has a profile
--   * the room has fewer than 50 participants
-- Known limit: the context id of these rooms is free text (for example
-- "carpool-limerick-city-to-ul-campus"), so the database cannot prove the
-- other person really is the poster. A participant could add any member to a
-- listing room. The block check, the participant cap and the caller-is-a-
-- participant rule keep this small. If it becomes a problem, store the poster
-- id on chat_rooms and compare it here.
--
-- App change needed (useChat.js): upsert only the person's own participant
-- row, then call
--   supabase.rpc('join_chat_counterparty', { p_room_id: id, p_other_user_id: otherParticipantId })
-- and surface the error.
--
-- G4 / F06: start_direct_chat added both people to a direct room with no
-- consent. Now one of these must be true, else it raises 'not connected':
--   a) an accepted connection_requests row in either direction
--   b) the direct room already exists (people who already chat keep chatting)
--   c) a PENDING request from the other person to the caller. This is the
--      Accept button: RequestsTab calls start_direct_chat before it saves
--      'accepted', so (c) keeps that order working with no app change.
-- Declined requests do not qualify. The block check still comes first.
-- The message 'not connected' does not contain the word 'blocked', so the app's
-- blocked handling is unchanged. The Home "Suggested for you, Connect" button
-- calls this directly: until the app sends a connection request instead, it will
-- now fail with 'not connected' (the app shows "Something went wrong").

create or replace function public.join_chat_counterparty(p_room_id uuid, p_other_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me   uuid := auth.uid();
  v_type text;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_user_id is null or p_other_user_id = v_me then
    return;
  end if;

  select r.context_type into v_type from public.chat_rooms r where r.id = p_room_id;
  if v_type is null or v_type not in ('ad', 'carpool', 'board') then
    raise exception 'not allowed';
  end if;

  if not exists (
    select 1 from public.chat_participants cp
    where cp.room_id = p_room_id and cp.user_id = v_me
  ) then
    raise exception 'not allowed';
  end if;

  if exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = v_me and b.blocked_id = p_other_user_id)
       or (b.blocker_id = p_other_user_id and b.blocked_id = v_me)
  ) then
    raise exception 'blocked';
  end if;

  if not exists (select 1 from public.profiles pr where pr.id = p_other_user_id) then
    raise exception 'not found';
  end if;

  if (select count(*) from public.chat_participants cp where cp.room_id = p_room_id) >= 50 then
    raise exception 'room full';
  end if;

  insert into public.chat_participants (room_id, user_id, display_name)
  values (
    p_room_id,
    p_other_user_id,
    coalesce(
      (select u.raw_user_meta_data ->> 'full_name' from auth.users u where u.id = p_other_user_id),
      'Member')
  )
  on conflict (room_id, user_id) do nothing;
end;
$$;

revoke all on function public.join_chat_counterparty(uuid, uuid) from public, anon;
grant execute on function public.join_chat_counterparty(uuid, uuid) to authenticated, service_role;

create or replace function public.start_direct_chat(other_user_id uuid, room_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_context_id text;
  v_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id = auth.uid() then
    raise exception 'cannot start a direct chat with yourself';
  end if;

  if exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = auth.uid() and b.blocked_id = other_user_id)
       or (b.blocker_id = other_user_id and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked';
  end if;

  v_context_id := (select string_agg(id::text, '_' order by id) from unnest(array[auth.uid(), other_user_id]) as id);

  -- Consent: an accepted request, an existing room, or an incoming pending
  -- request (the Accept button).
  if not exists (
       select 1 from public.chat_rooms r
       where r.context_type = 'direct' and r.context_id = v_context_id
     )
     and not exists (
       select 1 from public.connection_requests c
       where (c.status = 'accepted'
              and ((c.requester_id = auth.uid() and c.recipient_id = other_user_id)
                or (c.requester_id = other_user_id and c.recipient_id = auth.uid())))
          or (c.status = 'pending'
              and c.requester_id = other_user_id and c.recipient_id = auth.uid())
     )
  then
    raise exception 'not connected';
  end if;

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
end;
$$;

-- Original start_direct_chat body (production on 20 Nov 2026) is the same as above
-- without the "Consent" block, i.e. delete the `if not exists ( ... ) then raise exception 'not connected'; end if;`
-- statement to undo.
