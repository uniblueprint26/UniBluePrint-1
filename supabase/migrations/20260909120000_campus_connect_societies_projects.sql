-- Phase 4, Campus Connect: Join Clubs and Societies + Project Collaboration

-- status: 'active' (browsable club) or 'requested' (student asked for a new
-- society to be added — surfaced to Operations the same way other
-- student-submitted content is, via a simple status flag rather than a
-- separate moderation table).
create table if not exists public.clubs_societies (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid references auth.users(id) on delete set null,
  name           text not null,
  category       text not null,
  description    text not null,
  contact        text,
  status         text not null default 'active' check (status in ('active', 'requested')),
  created_at     timestamptz not null default now()
);
alter table public.clubs_societies enable row level security;

create policy "read_clubs_societies" on public.clubs_societies
  for select to authenticated using (true);
create policy "insert_own_clubs_societies" on public.clubs_societies
  for insert to authenticated with check (auth.uid() = created_by);
create policy "update_own_clubs_societies" on public.clubs_societies
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "delete_own_clubs_societies" on public.clubs_societies
  for delete to authenticated using (auth.uid() = created_by);

-- One row per student expressing interest / joining a society. Read is open
-- (member counts are shown publicly on the board) rather than owner-only.
create table if not exists public.society_members (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references public.clubs_societies(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (society_id, user_id)
);
alter table public.society_members enable row level security;

create policy "read_society_members" on public.society_members
  for select to authenticated using (true);
create policy "insert_own_society_membership" on public.society_members
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_society_membership" on public.society_members
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clubs_societies') then
    alter publication supabase_realtime add table public.clubs_societies;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'society_members') then
    alter publication supabase_realtime add table public.society_members;
  end if;
end $$;

-- Project Collaboration. is_example flags the small set of seed rows shown
-- before any student has posted a real project — the client shows a
-- "this is an example" confirmation sheet when Join is tapped on one of
-- these rather than treating it as a live project.
create table if not exists public.project_collaborations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade,
  poster_name           text,
  title                 text not null,
  description           text not null,
  skills_needed         text[] not null default '{}',
  timeline              text not null,
  collaborators_needed  smallint not null default 1 check (collaborators_needed between 1 and 50),
  contact_method        text not null,
  is_example            boolean not null default false,
  created_at            timestamptz not null default now()
);
alter table public.project_collaborations enable row level security;

create policy "read_project_collaborations" on public.project_collaborations
  for select to authenticated using (true);
create policy "insert_own_project_collaboration" on public.project_collaborations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_project_collaboration" on public.project_collaborations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_project_collaboration" on public.project_collaborations
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_collaborations') then
    alter publication supabase_realtime add table public.project_collaborations;
  end if;
end $$;

-- Seed a handful of real-feeling societies so the board isn't empty before
-- any campus has real clubs registered — status = 'active', not 'requested',
-- so these behave exactly like any other society (joinable, counted).
insert into public.clubs_societies (name, category, description, contact, status)
select * from (values
  ('Chess Society', 'Games & Hobbies', 'Weekly meetups for players of all levels, from complete beginners to tournament regulars.', 'chess.society@campus.ie', 'active'),
  ('St. Vincent de Paul', 'Volunteering', 'Campus branch running weekly volunteering shifts supporting families in the local community.', 'svp@campus.ie', 'active'),
  ('Drama Society', 'Arts & Culture', 'Auditions, workshops, and two full productions a year. No experience necessary.', 'drama.soc@campus.ie', 'active'),
  ('Entrepreneurship Society', 'Careers & Business', 'Pitch nights, founder talks, and a student accelerator programme each spring.', 'entsoc@campus.ie', 'active')
) as seed(name, category, description, contact, status)
where not exists (select 1 from public.clubs_societies where status = 'active');

-- Seed example projects (is_example = true, user_id null — no real poster).
-- Mirrors the three PROJECTS entries previously hardcoded in
-- CampusConnectScreen.jsx, now served from the real table.
insert into public.project_collaborations (title, description, skills_needed, timeline, collaborators_needed, contact_method, is_example)
select * from (values
  ('Campus Sustainability App', 'Building a mobile app to help students track and reduce their campus carbon footprint. Final year project, open to students from any college.', array['Mobile Dev','UI/UX','Sustainability'], 'One semester', 2, 'uniblueprintoperations@gmail.com', true),
  ('AI Study Planner', 'Final year project building an AI-assisted study planner that adapts to exam timetables. Looking for teammates comfortable with Python and React.', array['AI/ML','Python','React'], 'Final year, 2 semesters', 3, 'uniblueprintoperations@gmail.com', true),
  ('Student Budget Tracker', 'Simple budgeting app aimed at first-year students. Team of three already, looking for one more designer or developer.', array['Finance','App Dev','Open to All'], 'Ongoing', 1, 'uniblueprintoperations@gmail.com', true)
) as seed(title, description, skills_needed, timeline, collaborators_needed, contact_method, is_example)
where not exists (select 1 from public.project_collaborations where is_example = true);
