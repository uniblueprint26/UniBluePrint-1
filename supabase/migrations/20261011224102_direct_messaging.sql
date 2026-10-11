-- Wires up direct (1:1) messaging on top of infrastructure that already
-- existed but was never exposed to any screen:
--   - chat_rooms/chat_participants/chat_messages already support
--     context_type = 'direct' (20260805000000_chat_rooms.sql).
--   - start_direct_chat(other_user_id, room_name) already finds-or-creates
--     a direct room idempotently with a deterministic, order-independent
--     context_id for the pair, and joins both users as participants
--     (20260824140000_security_hardening.sql, race-fixed in
--     20260824150000_fk_and_rls_fixes.sql). Its own comments note
--     "'direct' isn't wired up in the app yet" — this migration, plus
--     MessagesScreen.jsx, is that wiring.
--   - blocked_users and the chat_messages read/insert restrictions already
--     stop a blocked pair from seeing/sending messages
--     (20261009140000_chat_blocking.sql), but nothing stopped the room
--     itself from being (re)created via start_direct_chat() after a block.

-- ── 1. start_direct_chat(): refuse to create/open a room between a blocked pair ──
-- Additive change to the existing function body only (same pattern this
-- function has already been through twice). Checked in both directions —
-- either side blocking the other stops a NEW direct room from being
-- started via this entry point, consistent with how the restrictive insert
-- policy already stops either side sending into an existing one.
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

  if exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = auth.uid() and b.blocked_id = other_user_id)
       or (b.blocker_id = other_user_id and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked';
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

grant execute on function public.start_direct_chat(uuid, text) to authenticated;


-- ── 2. get_chat_room_peer_names(): resolve a room's OTHER participant(s) ────────
-- chat_participants' own RLS ("Users can read own participation") only
-- lets a user read rows where user_id = auth.uid() — never a
-- co-participant's row — so a plain client-side select can never answer
-- "who else is in this room with me", the same own-row-only limitation
-- homeActivityFeed.js already documents for `profiles`. This is the
-- security-definer escape hatch MessagesScreen.jsx needs to show the
-- correct name for a 'direct' room from EACH side's point of view (the
-- room's own `name` column is a single shared value set by whoever created
-- it, so it is only ever correct for one of the two people in a direct
-- chat). Scoped to rooms the caller is themselves already a participant
-- in, so it can never be used to look up an arbitrary room.
create or replace function public.get_chat_room_peer_names(p_room_ids uuid[])
returns table (room_id uuid, peer_user_id uuid, peer_display_name text)
language sql stable security definer set search_path = public as $$
  select cp.room_id, cp.user_id, cp.display_name
  from public.chat_participants cp
  where cp.user_id <> auth.uid()
    and p_room_ids is not null
    and cp.room_id = any(p_room_ids)
    and exists (
      select 1 from public.chat_participants me
      where me.room_id = cp.room_id and me.user_id = auth.uid()
    )
$$;

grant execute on function public.get_chat_room_peer_names(uuid[]) to authenticated;


-- ── 3. get_direct_message_contacts(): who the caller can start a DM with ────────
-- There is no general user directory to pick a recipient from yet —
-- DirectoryScreen.jsx still renders a static mock roster with no real user
-- ids (see 20260811090000_gdpr_coach_enquiries_connections.sql's own note
-- on `connection_requests`), and `profiles` stays locked to own-row-only
-- read access, so this deliberately does NOT open up a general "search any
-- user" picker (that's a bigger product/privacy decision — see the
-- MessagesScreen.jsx header comment). Instead it surfaces real people the
-- caller can already see evidence of interacting with: anyone who shares
-- an existing chat room with them (an ad/carpool/board group chat, or an
-- existing direct chat), minus anyone either side has blocked — matching
-- what start_direct_chat() itself would refuse to (re)open.
create or replace function public.get_direct_message_contacts()
returns table (peer_user_id uuid, peer_display_name text)
language sql stable security definer set search_path = public as $$
  select distinct on (cp.user_id) cp.user_id, cp.display_name
  from public.chat_participants cp
  where cp.user_id <> auth.uid()
    and exists (
      select 1 from public.chat_participants me
      where me.room_id = cp.room_id and me.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = auth.uid() and b.blocked_id = cp.user_id)
         or (b.blocker_id = cp.user_id and b.blocked_id = auth.uid())
    )
  order by cp.user_id, cp.joined_at desc
$$;

grant execute on function public.get_direct_message_contacts() to authenticated;
