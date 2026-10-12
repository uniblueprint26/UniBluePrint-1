-- get_popular_notes — the real data source behind Course Connect's
-- "Popular Notes" widget (Task #50).
--
-- Before this, CourseConnectScreen.jsx rendered a hardcoded RECENT_NOTES
-- array (4 fake notes with made-up view/save counts) under a
-- MockContentBanner ("Example notes, shown until your course goes live").
-- shared_notes (20260910090000_course_connect_boards_notes_papers.sql)
-- already has everything needed to make this real: real uploads, and a
-- real `download_count` column that's genuinely incremented via
-- increment_shared_note_downloads() whenever anyone downloads a note
-- (wired in BoardDetailScreen.jsx and ResourceFinderScreen.jsx already).
-- Download count is a stronger "popular" signal than a raw view count
-- would be — it's an explicit "this was useful enough to keep" action,
-- not just an impression — so "popular" here means "most downloaded",
-- tie-broken by most recent upload so brand-new notes aren't buried
-- behind one old note that happened to get an early download.
--
-- shared_notes is already broadly readable (select ... using (true), to
-- authenticated — see course_connect_boards_notes_papers.sql), so this
-- doesn't loosen any access. It's a security-definer RPC anyway, in the
-- same pattern as get_directory_profiles()/get_popular_interests(), so the
-- widget has one stable, server-ranked call instead of pulling the whole
-- table client-side and re-sorting it.
create or replace function public.get_popular_notes(limit_count integer default 4)
returns table (
  id             uuid,
  title          text,
  subject        text,
  course         text,
  year           text,
  institution    text,
  poster_name    text,
  download_count integer,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    n.id, n.title, n.subject, n.course, n.year,
    n.institution, n.poster_name, n.download_count, n.created_at
  from public.shared_notes n
  order by n.download_count desc, n.created_at desc
  limit greatest(coalesce(limit_count, 4), 0)
$$;

comment on function public.get_popular_notes(integer) is
  'Real "Popular Notes" ranking for Course Connect (Task #50): top shared_notes rows ordered by genuine download_count (tie-broken by newest), nothing fabricated. Replaces the hardcoded RECENT_NOTES array in CourseConnectScreen.jsx. download_count is incremented by increment_shared_note_downloads(), already wired into BoardDetailScreen.jsx and ResourceFinderScreen.jsx.';

revoke all on function public.get_popular_notes(integer) from public;
grant execute on function public.get_popular_notes(integer) to authenticated;
