-- Pre-launch security hardening. Three issues found by review, all confirmed
-- exploitable via the anon/authenticated Supabase client (not just theoretical):

-- ── 1. dev_activate_subscription() was still callable by every authenticated user ──
-- Explicitly commented "DEV ONLY... REMOVE before launch" at creation
-- (20260606160000_subscriptions.sql) but the GRANT EXECUTE was never revoked.
-- Any logged-in user could call it directly via the client SDK to self-grant a
-- free Pro subscription (bypassing Stripe entirely) and unlock every
-- Pro-gated feature. Removing it now, before real payments exist to abuse.
revoke execute on function public.dev_activate_subscription(text) from authenticated;
drop function if exists public.dev_activate_subscription(text);

-- ── 2. gdpr_requests: anon insert had no constraint on user_id at all ───────────
-- The "submit_gdpr_request" policy's `or auth.role() = 'anon'` branch let a
-- fully unauthenticated caller (anon key only) set user_id to ANY value,
-- including a real registered user's id — forging a GDPR deletion/export
-- request that looks like it came from that person's own account. An
-- anonymous submission must only ever be able to identify itself by
-- name+email, never attach to someone else's account.
drop policy if exists "submit_gdpr_request" on public.gdpr_requests;
create policy "submit_gdpr_request" on public.gdpr_requests
  for insert to anon, authenticated
  with check (
    (auth.role() = 'authenticated' and (user_id is null or auth.uid() = user_id))
    or (auth.role() = 'anon' and user_id is null)
  );

-- ── 3. chat_participants: unrestricted self-join let any user read any other ───
-- pair's room. chat_rooms is readable by every authenticated user (by design,
-- needed to find/join the shared group room under an ad/carpool/board
-- listing), but the old "Users can join rooms" policy let anyone self-insert
-- into ANY room_id with no relation to that room's context — including a
-- future 'direct' (1:1 DM) room between two other people, since chat_messages
-- access is gated purely on chat_participants membership. 'direct' isn't
-- wired up in the app yet (no screen creates one), so nothing has been
-- exposed in practice, but the open door needs closing before it is built.
--
-- Fix: self-join stays open for the group-style contexts (ad/carpool/board —
-- anyone finding the room is meant to be able to join the conversation under
-- that listing), but 'direct' rooms can no longer be self-joined at all.
-- Direct messaging, when built, should go through a security-definer RPC
-- that creates the room and inserts both participants atomically instead of
-- relying on open self-insert RLS — the correct pattern for any two-party
-- room, not a workaround for this bug specifically.
drop policy if exists "Users can join rooms" on public.chat_participants;
create policy "Users can join group rooms" on public.chat_participants
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_rooms
      where id = chat_participants.room_id
        and context_type in ('ad', 'carpool', 'board')
    )
  );

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
  -- Deterministic, order-independent context_id so the same pair always maps
  -- to the same room regardless of who starts it first.
  v_context_id := (select string_agg(id::text, '_' order by id) from unnest(array[auth.uid(), other_user_id]) as id);

  select id into v_room_id from public.chat_rooms
    where context_type = 'direct' and context_id = v_context_id;

  if v_room_id is null then
    insert into public.chat_rooms (context_type, context_id, name, created_by)
    values ('direct', v_context_id, room_name, auth.uid())
    returning id into v_room_id;
  end if;

  insert into public.chat_participants (room_id, user_id, display_name)
  values
    (v_room_id, auth.uid(), coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'Member')),
    (v_room_id, other_user_id, coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = other_user_id), 'Member'))
  on conflict (room_id, user_id) do nothing;

  return v_room_id;
end; $$;

grant execute on function public.start_direct_chat(uuid, text) to authenticated;
