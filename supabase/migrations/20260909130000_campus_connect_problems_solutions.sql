-- Phase 4, Campus Connect: Problems and Solutions board, with a reply +
-- upvote system on solutions.

create table if not exists public.problems_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  description    text not null,
  category       text not null check (category in ('Campus facilities', 'Academic', 'Housing', 'Transport', 'Other')),
  anonymous      boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.problems_posts enable row level security;

create policy "read_problems_posts" on public.problems_posts
  for select to authenticated using (true);
create policy "insert_own_problems_post" on public.problems_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_problems_post" on public.problems_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_problems_post" on public.problems_posts
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.problem_solutions (
  id             uuid primary key default gen_random_uuid(),
  problem_id     uuid not null references public.problems_posts(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  body           text not null,
  created_at     timestamptz not null default now()
);
alter table public.problem_solutions enable row level security;

create policy "read_problem_solutions" on public.problem_solutions
  for select to authenticated using (true);
create policy "insert_own_problem_solution" on public.problem_solutions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_problem_solution" on public.problem_solutions
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.solution_votes (
  id            uuid primary key default gen_random_uuid(),
  solution_id   uuid not null references public.problem_solutions(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (solution_id, user_id)
);
alter table public.solution_votes enable row level security;

create policy "read_solution_votes" on public.solution_votes
  for select to authenticated using (true);
create policy "insert_own_solution_vote" on public.solution_votes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_solution_vote" on public.solution_votes
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'problems_posts') then
    alter publication supabase_realtime add table public.problems_posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'problem_solutions') then
    alter publication supabase_realtime add table public.problem_solutions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'solution_votes') then
    alter publication supabase_realtime add table public.solution_votes;
  end if;
end $$;
