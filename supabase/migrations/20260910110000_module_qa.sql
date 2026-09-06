-- Phase 5, Course Connect: Module Q&A — threaded question -> answers with an
-- upvote system on answers. Bespoke tables (not a generic board) since the
-- shape is a thread, not a flat post list — mirrors the
-- problems_posts / problem_solutions / solution_votes pattern from Phase 4.

create table if not exists public.module_questions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  course         text not null,
  module         text not null,
  question_text  text not null,
  created_at     timestamptz not null default now()
);
alter table public.module_questions enable row level security;

create policy "read_module_questions" on public.module_questions
  for select to authenticated using (true);
create policy "insert_own_module_question" on public.module_questions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_module_question" on public.module_questions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_module_question" on public.module_questions
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.module_answers (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references public.module_questions(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  body           text not null,
  created_at     timestamptz not null default now()
);
alter table public.module_answers enable row level security;

create policy "read_module_answers" on public.module_answers
  for select to authenticated using (true);
create policy "insert_own_module_answer" on public.module_answers
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_module_answer" on public.module_answers
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.qa_answer_votes (
  id            uuid primary key default gen_random_uuid(),
  answer_id     uuid not null references public.module_answers(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (answer_id, user_id)
);
alter table public.qa_answer_votes enable row level security;

create policy "read_qa_answer_votes" on public.qa_answer_votes
  for select to authenticated using (true);
create policy "insert_own_qa_answer_vote" on public.qa_answer_votes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete_own_qa_answer_vote" on public.qa_answer_votes
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'module_questions') then
    alter publication supabase_realtime add table public.module_questions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'module_answers') then
    alter publication supabase_realtime add table public.module_answers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'qa_answer_votes') then
    alter publication supabase_realtime add table public.qa_answer_votes;
  end if;
end $$;
