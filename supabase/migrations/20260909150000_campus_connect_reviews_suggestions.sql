-- Phase 4, Campus Connect: College Reviews + Campus Suggestions

-- Ratings 1-5. anonymous is a per-review toggle (confirmed decision) —
-- poster_name is only populated when anonymous = false.
create table if not exists public.college_reviews (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  poster_name           text,
  institution           text,
  overall_rating        smallint not null check (overall_rating between 1 and 5),
  teaching_quality      smallint not null check (teaching_quality between 1 and 5),
  campus_facilities     smallint not null check (campus_facilities between 1 and 5),
  student_support       smallint not null check (student_support between 1 and 5),
  social_life           smallint not null check (social_life between 1 and 5),
  value_for_money       smallint not null check (value_for_money between 1 and 5),
  review_text           text not null,
  anonymous             boolean not null default false,
  created_at            timestamptz not null default now()
);
alter table public.college_reviews enable row level security;

create policy "read_college_reviews" on public.college_reviews
  for select to authenticated using (true);
create policy "insert_own_college_review" on public.college_reviews
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_college_review" on public.college_reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_college_review" on public.college_reviews
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'college_reviews') then
    alter publication supabase_realtime add table public.college_reviews;
  end if;
end $$;

create table if not exists public.campus_suggestions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  title          text not null,
  description    text not null,
  category       text not null check (category in ('Facilities', 'Events', 'Services', 'Academic', 'Other')),
  anonymous      boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.campus_suggestions enable row level security;

create policy "read_campus_suggestions" on public.campus_suggestions
  for select to authenticated using (true);
create policy "insert_own_campus_suggestion" on public.campus_suggestions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_campus_suggestion" on public.campus_suggestions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_campus_suggestion" on public.campus_suggestions
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.suggestion_votes (
  id             uuid primary key default gen_random_uuid(),
  suggestion_id  uuid not null references public.campus_suggestions(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (suggestion_id, user_id)
);
alter table public.suggestion_votes enable row level security;

create policy "read_suggestion_votes" on public.suggestion_votes
  for select to authenticated using (true);
create policy "insert_own_suggestion_vote" on public.suggestion_votes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_suggestion_vote" on public.suggestion_votes
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_suggestions') then
    alter publication supabase_realtime add table public.campus_suggestions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'suggestion_votes') then
    alter publication supabase_realtime add table public.suggestion_votes;
  end if;
end $$;
