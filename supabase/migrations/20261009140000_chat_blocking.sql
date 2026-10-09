-- Personal blocking: block a user in a direct chat so you stop seeing their
-- messages (any context) and, for direct 1:1 rooms specifically, they can no
-- longer send you new messages. See task #29 / ChatRoomScreen.jsx handleBlock().
--
-- Deliberately does NOT remove a blocked user from a shared group room (ad/
-- carpool/board chat) — silencing someone there is a moderation action via
-- Report, not a personal block. The insert restriction below is scoped to
-- context_type = 'direct' only for that reason.

create table public.blocked_users (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid references auth.users(id) on delete cascade not null,
  blocked_id  uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now(),
  constraint blocked_users_unique unique (blocker_id, blocked_id),
  constraint blocked_users_no_self check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "Users can read own blocks" on public.blocked_users
  for select to authenticated using (auth.uid() = blocker_id);

create policy "Users can create own blocks" on public.blocked_users
  for insert to authenticated with check (auth.uid() = blocker_id);

create policy "Users can delete own blocks" on public.blocked_users
  for delete to authenticated using (auth.uid() = blocker_id);

-- ── chat_messages: hide a blocked user's messages from the blocker's view ──────
-- Replaces the original read policy (see 20260805000000_chat_rooms.sql) to add
-- the blocked-user exclusion; everything else is unchanged.

drop policy if exists "Participants can read messages" on public.chat_messages;
create policy "Participants can read messages" on public.chat_messages
  for select to authenticated using (
    exists (
      select 1 from public.chat_participants
      where room_id = chat_messages.room_id
        and user_id = auth.uid()
    )
    and not exists (
      select 1 from public.blocked_users
      where blocker_id = auth.uid()
        and blocked_id = chat_messages.user_id
    )
  );

-- ── chat_messages: stop new direct messages once either side has blocked ───────
-- A restrictive policy — ANDed with the existing permissive "Participants can
-- send messages" policy, not OR'd with it, so this can only ever narrow who
-- can insert, never widen it. Scoped to context_type = 'direct' only: a block
-- never silences someone in a shared ad/carpool/board room, only a 1:1 chat.

create policy "Blocked users cannot message in direct rooms" on public.chat_messages
  as restrictive
  for insert to authenticated with check (
    not exists (
      select 1 from public.chat_rooms r
      join public.chat_participants cp
        on cp.room_id = r.id and cp.user_id <> auth.uid()
      where r.id = chat_messages.room_id
        and r.context_type = 'direct'
        and exists (
          select 1 from public.blocked_users b
          where (b.blocker_id = auth.uid() and b.blocked_id = cp.user_id)
             or (b.blocker_id = cp.user_id and b.blocked_id = auth.uid())
        )
    )
  );
