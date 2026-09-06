-- Phase 5, Course Connect: Course Boards, Shared Notes, Past Papers.
-- All three are cross-Ireland (no campus/institution scoping on read) —
-- Course Connect boards are scoped by course, not by campus.

-- ── Course Boards ────────────────────────────────────────────────────────────
-- Discussion posts scoped to a course rather than a campus. `course` is
-- free text (e.g. "Computer Science, UCD") — there's no canonical CAO course
-- table wired up yet (that's Course Compass / Phase 6 territory), so this
-- matches the pattern the rest of Course Connect uses for course/module.
create table if not exists public.course_boards_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  poster_name    text,
  course         text not null,
  title          text,
  body           text not null,
  created_at     timestamptz not null default now()
);
alter table public.course_boards_posts enable row level security;

create policy "read_course_boards_posts" on public.course_boards_posts
  for select to authenticated using (true);
create policy "insert_own_course_boards_post" on public.course_boards_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_course_boards_post" on public.course_boards_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_course_boards_post" on public.course_boards_posts
  for delete to authenticated using (auth.uid() = user_id);

-- ── Shared storage bucket for notes / past paper uploads (PDF or image) ─────
-- Path convention: {user_id}/{timestamp}.{ext} — same ownership-by-leading-
-- path-segment pattern as campus-board-photos, just not image-only.
insert into storage.buckets (id, name, public)
values ('course-connect-files', 'course-connect-files', true)
on conflict (id) do nothing;

create policy "course_connect_files_public_read"
  on storage.objects for select
  using (bucket_id = 'course-connect-files');

create policy "course_connect_files_own_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-connect-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "course_connect_files_own_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-connect-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "course_connect_files_own_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-connect-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Shared Notes ─────────────────────────────────────────────────────────────
-- `institution` is captured automatically from the uploader's profile
-- (user_metadata.institution_short) at insert time, not asked on the form —
-- it powers "uploader's university" on Resource Finder results.
create table if not exists public.shared_notes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  poster_name      text,
  institution      text,
  title            text not null,
  subject          text not null,
  course           text not null,
  year             text not null check (year in ('1st year', '2nd year', '3rd year', '4th year', 'Postgrad')),
  file_url         text not null,
  file_mime        text,
  file_name        text,
  download_count   integer not null default 0,
  created_at       timestamptz not null default now()
);
alter table public.shared_notes enable row level security;

create policy "read_shared_notes" on public.shared_notes
  for select to authenticated using (true);
create policy "insert_own_shared_note" on public.shared_notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_shared_note" on public.shared_notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_shared_note" on public.shared_notes
  for delete to authenticated using (auth.uid() = user_id);

-- ── Past Papers ──────────────────────────────────────────────────────────────
create table if not exists public.past_papers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  poster_name      text,
  institution      text,
  subject          text not null,
  course           text not null,
  year             text not null,
  exam_session     text not null check (exam_session in ('Semester 1', 'Semester 2', 'Summer', 'Autumn/Repeat')),
  file_url         text not null,
  file_mime        text,
  file_name        text,
  download_count   integer not null default 0,
  created_at       timestamptz not null default now()
);
alter table public.past_papers enable row level security;

create policy "read_past_papers" on public.past_papers
  for select to authenticated using (true);
create policy "insert_own_past_paper" on public.past_papers
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_past_paper" on public.past_papers
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_past_paper" on public.past_papers
  for delete to authenticated using (auth.uid() = user_id);

-- ── Download counters ────────────────────────────────────────────────────────
-- Any authenticated student can download a note/paper they don't own, so the
-- counter can't be bumped through the owner-only update policies above.
-- Rather than a blanket "update using (true)" policy (which would let any
-- authenticated user rewrite someone else's row, not just the counter), the
-- increment goes through a security-definer RPC scoped to exactly that one
-- column — same "narrow function beats broad policy" pattern used elsewhere
-- in this schema (e.g. 20260725091000_transactional_writes.sql).
create or replace function public.increment_shared_note_downloads(note_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shared_notes set download_count = download_count + 1 where id = note_id;
$$;
grant execute on function public.increment_shared_note_downloads(uuid) to authenticated;

create or replace function public.increment_past_paper_downloads(paper_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.past_papers set download_count = download_count + 1 where id = paper_id;
$$;
grant execute on function public.increment_past_paper_downloads(uuid) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'course_boards_posts') then
    alter publication supabase_realtime add table public.course_boards_posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shared_notes') then
    alter publication supabase_realtime add table public.shared_notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'past_papers') then
    alter publication supabase_realtime add table public.past_papers;
  end if;
end $$;
