-- Phase 4, Campus Connect: Campus Events + Lost and Found boards

create table if not exists public.campus_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  event_name     text not null,
  description    text not null,
  event_at       timestamptz not null,
  location       text not null,
  organiser      text not null,
  is_ticketed    boolean not null default false,
  ticket_link    text,
  created_at     timestamptz not null default now()
);
alter table public.campus_events enable row level security;

create policy "read_campus_events" on public.campus_events
  for select to authenticated using (true);
create policy "insert_own_campus_event" on public.campus_events
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_campus_event" on public.campus_events
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_campus_event" on public.campus_events
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_events') then
    alter publication supabase_realtime add table public.campus_events;
  end if;
end $$;

-- status: 'Found' or 'Lost'
create table if not exists public.lost_found_posts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  poster_name        text,
  status             text not null check (status in ('Found', 'Lost')),
  item_description   text not null,
  location           text not null,
  date_occurred      date,
  contact_method     text not null,
  photo_url          text,
  created_at         timestamptz not null default now()
);
alter table public.lost_found_posts enable row level security;

create policy "read_lost_found_posts" on public.lost_found_posts
  for select to authenticated using (true);
create policy "insert_own_lost_found_post" on public.lost_found_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_lost_found_post" on public.lost_found_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_lost_found_post" on public.lost_found_posts
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lost_found_posts') then
    alter publication supabase_realtime add table public.lost_found_posts;
  end if;
end $$;
