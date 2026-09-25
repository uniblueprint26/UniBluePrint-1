-- Course Connect: lock down download-count increments to a narrow RPC.
--
-- past_papers.download_count and shared_notes.download_count need to go up
-- when ANY authenticated user downloads someone else's resource, but the
-- existing update_own_past_paper / update_own_shared_note RLS policies only
-- let the row's owner run UPDATE. A client-side increment therefore only
-- worked for your own uploads and silently failed (RLS-blocked) for
-- everyone else's, undercounting downloads across the board. These two
-- SECURITY DEFINER functions are the fix: each does exactly one bounded
-- write (+1 to download_count on the row by id) and nothing else, so any
-- authenticated user can call them without needing a broader UPDATE grant.
--
-- Backfilled from the live schema — this migration was applied directly
-- against the project (no git history at the time) during Phase 6/7
-- (Course Connect / Directory work). Recreating it here with
-- `or replace`/idempotent grants keeps `supabase db push` a no-op against
-- the already-live objects while giving them a permanent home in git.

create or replace function public.increment_past_paper_downloads(paper_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.past_papers set download_count = download_count + 1 where id = paper_id;
$$;

create or replace function public.increment_shared_note_downloads(note_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shared_notes set download_count = download_count + 1 where id = note_id;
$$;

revoke all on function public.increment_past_paper_downloads(uuid) from public;
grant execute on function public.increment_past_paper_downloads(uuid) to anon, authenticated;

revoke all on function public.increment_shared_note_downloads(uuid) from public;
grant execute on function public.increment_shared_note_downloads(uuid) to anon, authenticated;
