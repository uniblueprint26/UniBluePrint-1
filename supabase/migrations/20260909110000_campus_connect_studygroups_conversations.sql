-- Phase 4, Campus Connect: Study Groups + Campus Conversation Boards

create table if not exists public.study_groups (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  poster_name      text,
  subject          text not null,
  year_of_study    text not null,
  format           text not null check (format in ('In person', 'Online', 'Hybrid')),
  frequency        text not null,
  max_group_size   smallint not null default 6 check (max_group_size between 2 and 50),
  contact_method   text not null,
  created_at       timestamptz not null default now()
);
alter table public.study_groups enable row level security;

create policy "read_study_groups" on public.study_groups
  for select to authenticated using (true);
create policy "insert_own_study_group" on public.study_groups
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_study_group" on public.study_groups
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_study_group" on public.study_groups
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_groups') then
    alter publication supabase_realtime add table public.study_groups;
  end if;
end $$;

-- General discussion. title is optional; anonymous hides poster_name in the client.
create table if not exists public.campus_conversations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  title          text,
  body           text not null,
  anonymous      boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.campus_conversations enable row level security;

create policy "read_campus_conversations" on public.campus_conversations
  for select to authenticated using (true);
create policy "insert_own_campus_conversation" on public.campus_conversations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_campus_conversation" on public.campus_conversations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_campus_conversation" on public.campus_conversations
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_conversations') then
    alter publication supabase_realtime add table public.campus_conversations;
  end if;
end $$;
