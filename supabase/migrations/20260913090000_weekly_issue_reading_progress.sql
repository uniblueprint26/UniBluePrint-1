-- The Weekly Blueprint: continue-where-you-left-off. One row per user
-- tracking the page they last had open, synced to their account (not just
-- local storage — a student switching devices should land back where they
-- left off). Only the current position is kept, not history, so a single
-- row per user (unique on user_id) upserted on every page turn is enough.
--
-- issue_id is stored alongside last_page so the app can detect a stale
-- position (the saved issue is no longer this week's published issue) and
-- fall back to page 1 instead of resuming mid-issue on the wrong content.

create table if not exists public.weekly_issue_reading_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  issue_id    uuid not null references public.weekly_issues(id) on delete cascade,
  last_page   integer not null default 0 check (last_page >= 0),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

alter table public.weekly_issue_reading_progress enable row level security;

create policy "read_own_weekly_reading_progress" on public.weekly_issue_reading_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "insert_own_weekly_reading_progress" on public.weekly_issue_reading_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_weekly_reading_progress" on public.weekly_issue_reading_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_weekly_reading_progress" on public.weekly_issue_reading_progress
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists trg_touch_weekly_reading_progress on public.weekly_issue_reading_progress;
create trigger trg_touch_weekly_reading_progress before update on public.weekly_issue_reading_progress
  for each row execute function public.touch_weekly_updated_at();

-- One round trip, server-side upsert: called on every page turn (debounced
-- client-side) so a rapid swipe through pages never races two client writes
-- against each other.
create or replace function public.save_weekly_reading_progress(p_issue_id uuid, p_last_page integer)
returns public.weekly_issue_reading_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.weekly_issue_reading_progress;
begin
  if p_last_page is null or p_last_page < 0 then
    raise exception 'last_page must be zero or greater';
  end if;

  insert into public.weekly_issue_reading_progress (user_id, issue_id, last_page)
  values (auth.uid(), p_issue_id, p_last_page)
  on conflict (user_id)
  do update set issue_id = excluded.issue_id, last_page = excluded.last_page, updated_at = now()
  returning * into saved;

  return saved;
end;
$$;

grant execute on function public.save_weekly_reading_progress(uuid, integer) to authenticated;
