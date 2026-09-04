-- Activity Events
-- Stores per-user account actions for the live activity feed on the Dashboard.
-- Types: document_submitted | handler_review | session_booked | note_saved | ad_posted

create table if not exists public.activity_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        not null,
  title       text        not null,
  detail      text,
  created_at  timestamptz not null default now()
);

-- Index for fast per-user, newest-first queries
create index if not exists activity_events_user_created
  on public.activity_events (user_id, created_at desc);

-- Row Level Security: users can only see and insert their own events
alter table public.activity_events enable row level security;

create policy "users_select_own_activity"
  on public.activity_events for select
  using (auth.uid() = user_id);

create policy "users_insert_own_activity"
  on public.activity_events for insert
  with check (auth.uid() = user_id);
