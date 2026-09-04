-- ─── Chat Infrastructure ──────────────────────────────────────────────────────
-- Generic chat_rooms + chat_participants + chat_messages.
-- A room belongs to one parent context identified by (context_type, context_id).
-- context_type: 'ad' | 'carpool' | 'board' | 'direct'
-- context_id:   stable string id of the parent (ad slug, carpool slug, board slug, or user id)
-- This single schema serves Ad Board, Carpooling, Campus/Course boards, and Direct Messages.

-- ── chat_rooms ────────────────────────────────────────────────────────────────

create table public.chat_rooms (
  id            uuid primary key default gen_random_uuid(),
  context_type  text not null check (context_type in ('ad', 'carpool', 'board', 'direct')),
  context_id    text not null,
  name          text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  constraint chat_rooms_context_unique unique (context_type, context_id)
);

alter table public.chat_rooms enable row level security;

-- Any authenticated user can read rooms (needed to find/join an existing room by context)
create policy "Authenticated can read chat rooms" on public.chat_rooms
  for select to authenticated using (true);

-- User must set themselves as the creator when inserting a new room
create policy "Authenticated can create chat rooms" on public.chat_rooms
  for insert to authenticated with check (auth.uid() = created_by);

-- ── chat_participants ─────────────────────────────────────────────────────────

create table public.chat_participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references public.chat_rooms(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  display_name  text not null,
  joined_at     timestamptz default now(),
  last_read_at  timestamptz default now(),
  constraint chat_participants_unique unique (room_id, user_id)
);

alter table public.chat_participants enable row level security;

-- Users can read their own participation rows (enough to check membership for message policies)
create policy "Users can read own participation" on public.chat_participants
  for select to authenticated using (user_id = auth.uid());

-- Users can join rooms (insert themselves as a participant)
create policy "Users can join rooms" on public.chat_participants
  for insert to authenticated with check (auth.uid() = user_id);

-- Users can update their own last_read_at
create policy "Users can update own last read" on public.chat_participants
  for update to authenticated using (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────

create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.chat_rooms(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  content     text not null check (length(trim(content)) > 0),
  created_at  timestamptz default now()
);

alter table public.chat_messages enable row level security;

-- Only room participants can read messages
create policy "Participants can read messages" on public.chat_messages
  for select to authenticated using (
    exists (
      select 1 from public.chat_participants
      where room_id = chat_messages.room_id
        and user_id = auth.uid()
    )
  );

-- Participants can send messages (must be a member and must set own user_id)
create policy "Participants can send messages" on public.chat_messages
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_participants
      where room_id = chat_messages.room_id
        and user_id = auth.uid()
    )
  );

-- ── Replica identity (for reliable Realtime filtering on non-PK columns) ──────

alter table public.chat_messages    replica identity full;
alter table public.chat_participants replica identity full;

-- ── Enable Realtime ───────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_participants;
