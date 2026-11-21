-- Calendar: a member's own events and their own calendars.
--
-- Everything here is private to the member. Row level security lets a signed in
-- person read and change only rows where user_id is their own id. Nobody else,
-- including other members, can read them.
--
-- calendars:       only the member's CUSTOM calendars (a name and a colour).
--                  College, Work, Personal and Clubs are built into the app and
--                  have no rows.
-- calendar_events: events the member adds, and events they bring in from a
--                  pasted .ics link (source = 'ics'). Events read from the
--                  phone's own calendar are never saved here.
--                  calendar_key is one of 'college', 'work', 'personal',
--                  'clubs', or the id (as text) of one of the member's rows in
--                  public.calendars.
--
-- The app works without this migration (it keeps events on the phone until the
-- tables exist) and moves them here the next time it can reach the tables.
--
-- Event titles are private to the member, so they are not shown to anyone
-- else and need no profanity guard or Report action.
--
-- Not applied by the build. The founder applies it.

create table if not exists public.calendars (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 24),
  color      text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

create index if not exists calendars_user_idx on public.calendars (user_id, created_at);

create table if not exists public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  calendar_key text not null default 'personal' check (char_length(calendar_key) between 1 and 40),
  title        text not null check (char_length(title) between 1 and 120),
  location     text check (char_length(location) <= 120),
  event_type   text not null default 'other' check (event_type in ('class', 'personal', 'work', 'other')),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  all_day      boolean not null default false,
  source       text not null default 'member' check (source in ('member', 'ics')),
  external_uid text check (char_length(external_uid) <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint calendar_events_end_after_start check (ends_at >= starts_at)
);

-- The calendar reads a member's events by date range.
create index if not exists calendar_events_user_start_idx on public.calendar_events (user_id, starts_at);

-- Bringing the same calendar link in twice updates the same rows. NULLs are
-- distinct, so ordinary events (no external_uid) are never affected.
-- A plain (not partial) unique index so upsert ... on conflict (user_id, external_uid) works.
create unique index if not exists calendar_events_user_external_uid_key
  on public.calendar_events (user_id, external_uid);

create or replace function public.calendar_events_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists calendar_events_touch on public.calendar_events;
create trigger calendar_events_touch
  before update on public.calendar_events
  for each row execute function public.calendar_events_touch();

alter table public.calendars enable row level security;
alter table public.calendar_events enable row level security;

drop policy if exists "calendars: own select" on public.calendars;
create policy "calendars: own select" on public.calendars for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "calendars: own insert" on public.calendars;
create policy "calendars: own insert" on public.calendars for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "calendars: own update" on public.calendars;
create policy "calendars: own update" on public.calendars for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "calendars: own delete" on public.calendars;
create policy "calendars: own delete" on public.calendars for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "calendar_events: own select" on public.calendar_events;
create policy "calendar_events: own select" on public.calendar_events for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "calendar_events: own insert" on public.calendar_events;
create policy "calendar_events: own insert" on public.calendar_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "calendar_events: own update" on public.calendar_events;
create policy "calendar_events: own update" on public.calendar_events for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "calendar_events: own delete" on public.calendar_events;
create policy "calendar_events: own delete" on public.calendar_events for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Nothing for signed out visitors.
revoke all on public.calendars from anon;
revoke all on public.calendar_events from anon;
grant select, insert, update, delete on public.calendars to authenticated;
grant select, insert, update, delete on public.calendar_events to authenticated;
