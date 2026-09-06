-- Phase 5, Course Connect: cross-Ireland Study Groups, Project Collaboration,
-- and Industry Discussions.

-- Study Groups — same shape as Campus Connect's study_groups, plus
-- `university` since this board is cross-Ireland rather than one campus.
create table if not exists public.course_connect_study_groups (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  poster_name      text,
  subject          text not null,
  university       text not null,
  year_of_study    text not null,
  format           text not null check (format in ('In person', 'Online', 'Hybrid')),
  frequency        text not null,
  max_group_size   smallint not null default 6 check (max_group_size between 2 and 50),
  contact_method   text not null,
  created_at       timestamptz not null default now()
);
alter table public.course_connect_study_groups enable row level security;

create policy "read_course_connect_study_groups" on public.course_connect_study_groups
  for select to authenticated using (true);
create policy "insert_own_course_connect_study_group" on public.course_connect_study_groups
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_course_connect_study_group" on public.course_connect_study_groups
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_course_connect_study_group" on public.course_connect_study_groups
  for delete to authenticated using (auth.uid() = user_id);

-- Cross-Ireland Project Collaboration — same shape as Campus Connect's
-- project_collaborations, plus `university`.
create table if not exists public.cross_ireland_projects (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  poster_name           text,
  title                 text not null,
  description           text not null,
  university            text not null,
  skills_needed         text[] not null default '{}',
  timeline              text not null,
  collaborators_needed  smallint not null default 1 check (collaborators_needed between 1 and 50),
  contact_method        text not null,
  created_at            timestamptz not null default now()
);
alter table public.cross_ireland_projects enable row level security;

create policy "read_cross_ireland_projects" on public.cross_ireland_projects
  for select to authenticated using (true);
create policy "insert_own_cross_ireland_project" on public.cross_ireland_projects
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_cross_ireland_project" on public.cross_ireland_projects
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_cross_ireland_project" on public.cross_ireland_projects
  for delete to authenticated using (auth.uid() = user_id);

-- Industry Discussions — one board, filtered by industry category client-side.
create table if not exists public.industry_discussions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  industry       text not null check (industry in (
    'Technology', 'Healthcare', 'Finance', 'Law', 'Engineering', 'Education',
    'Business', 'Creative', 'Science', 'Construction', 'Hospitality',
    'Public Sector', 'Social Work', 'Sports', 'Marketing'
  )),
  title          text not null,
  body           text not null,
  created_at     timestamptz not null default now()
);
alter table public.industry_discussions enable row level security;

create policy "read_industry_discussions" on public.industry_discussions
  for select to authenticated using (true);
create policy "insert_own_industry_discussion" on public.industry_discussions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_industry_discussion" on public.industry_discussions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_industry_discussion" on public.industry_discussions
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'course_connect_study_groups') then
    alter publication supabase_realtime add table public.course_connect_study_groups;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cross_ireland_projects') then
    alter publication supabase_realtime add table public.cross_ireland_projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'industry_discussions') then
    alter publication supabase_realtime add table public.industry_discussions;
  end if;
end $$;
