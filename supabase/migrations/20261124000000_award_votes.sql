-- UBP Awards voting for issue 1 (Ireland 2026, Wrapped).
-- Safe to run more than once. Not applied by the build: the founder applies it.
--
-- Nominees are NOT stored here. They live in the issue's weekly_issue_content
-- row (page_key 'wrapped'), on pages of kind 'awards':
--   { kind: 'awards', categories: [ { key, title, nominees: [ { key | name, why, source } ] } ] }
-- The wrapped content may be stored as { pages: [...] } or as a bare array of pages.
--
-- Members can only vote through cast_award_vote, which checks the voting
-- window (app_flags awards_voting_opens / awards_voting_closes, ISO timestamps)
-- and that the category and nominee really are in the published issue.
-- Members can see only their own votes. Counts come from award_results, which
-- is for founder and operations (and for everyone only when the flag
-- awards_results_visible is true, default false).

-- 1. Table
create table if not exists public.award_votes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  issue_number integer not null,
  category_key text not null,
  nominee_key  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, issue_number, category_key)
);

create index if not exists award_votes_issue_category_idx
  on public.award_votes (issue_number, category_key, nominee_key);

alter table public.award_votes enable row level security;

drop policy if exists "members read own award votes" on public.award_votes;
create policy "members read own award votes"
  on public.award_votes for select to authenticated
  using (user_id = auth.uid());

-- No insert, update or delete policies: clients cannot write directly.
revoke all on public.award_votes from anon, authenticated;
grant select on public.award_votes to authenticated;

-- 2. Flags. Voting is closed unless the founder sets both dates.
insert into public.app_flags (key, value) values
  ('awards_results_visible', 'false'::jsonb)
on conflict (key) do nothing;

-- Reads an ISO timestamp flag. Missing, null or badly formed gives null (closed).
create or replace function public.award_flag_ts(p_key text)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v text;
begin
  select f.value #>> '{}' into v from public.app_flags f where f.key = p_key;
  if v is null then return null; end if;
  begin
    return v::timestamptz;
  exception when others then
    return null;
  end;
end;
$$;

-- Is voting open right now? Needs both dates, so the default is closed.
create or replace function public.award_voting_is_open()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    now() >= public.award_flag_ts('awards_voting_opens')
    and now() <= public.award_flag_ts('awards_voting_closes'),
    false
  )
$$;

-- Returns the stored nominee key for a nominee that exists in that issue's
-- published wrapped awards pages, matched by key or exact name. Null if none.
create or replace function public.award_nominee_key(p_issue integer, p_category text, p_nominee text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nom ->> 'key', nom ->> 'name')
  from public.weekly_issues wi
  join public.weekly_issue_content wic on wic.issue_id = wi.id and wic.page_key = 'wrapped'
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(wic.content) = 'array' then wic.content
      when jsonb_typeof(wic.content -> 'pages') = 'array' then wic.content -> 'pages'
      else '[]'::jsonb
    end
  ) pg
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(pg -> 'categories') = 'array' then pg -> 'categories' else '[]'::jsonb end
  ) cat
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(cat -> 'nominees') = 'array' then cat -> 'nominees' else '[]'::jsonb end
  ) nom
  where wi.issue_number = p_issue
    and wi.published = true
    and pg ->> 'kind' = 'awards'
    and cat ->> 'key' = p_category
    and (nom ->> 'key' = p_nominee or nom ->> 'name' = p_nominee)
  limit 1
$$;

revoke all on function public.award_flag_ts(text) from public, anon, authenticated;
revoke all on function public.award_voting_is_open() from public, anon, authenticated;
revoke all on function public.award_nominee_key(integer, text, text) from public, anon, authenticated;

-- 3. Cast or change a vote
create or replace function public.cast_award_vote(p_issue integer, p_category text, p_nominee text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_key text;
begin
  if v_uid is null then
    raise exception 'Sign in to vote' using errcode = '28000';
  end if;
  if not public.award_voting_is_open() then
    raise exception 'Voting is closed' using errcode = 'P0001';
  end if;
  v_key := public.award_nominee_key(p_issue, p_category, p_nominee);
  if v_key is null then
    raise exception 'That nominee is not on the ballot' using errcode = 'P0001';
  end if;

  insert into public.award_votes (user_id, issue_number, category_key, nominee_key)
  values (v_uid, p_issue, p_category, v_key)
  on conflict (user_id, issue_number, category_key)
  do update set nominee_key = excluded.nominee_key, updated_at = now();
end;
$$;

revoke all on function public.cast_award_vote(integer, text, text) from public, anon;
grant execute on function public.cast_award_vote(integer, text, text) to authenticated;

-- 4. The member's own votes
create or replace function public.my_award_votes(p_issue integer)
returns table (category_key text, nominee_key text, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select v.category_key, v.nominee_key, v.updated_at
  from public.award_votes v
  where v.user_id = auth.uid() and v.issue_number = p_issue
$$;

revoke all on function public.my_award_votes(integer) from public, anon;
grant execute on function public.my_award_votes(integer) to authenticated;

-- 5. Results. Founder and operations always. Everyone else only once the flag
-- awards_results_visible is true. The app never calls this for members.
create or replace function public.award_results(p_issue integer)
returns table (category_key text, nominee_key text, votes bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_staff boolean;
  v_public boolean;
begin
  if v_uid is null then
    return;
  end if;
  v_staff := public.has_role(v_uid, 'founder') or public.has_role(v_uid, 'operations');
  select coalesce((f.value = 'true'::jsonb), false) into v_public
    from public.app_flags f where f.key = 'awards_results_visible';
  if not v_staff and not coalesce(v_public, false) then
    return;
  end if;
  return query
    select v.category_key, v.nominee_key, count(*)::bigint
    from public.award_votes v
    where v.issue_number = p_issue
    group by v.category_key, v.nominee_key
    order by v.category_key, count(*) desc, v.nominee_key;
end;
$$;

revoke all on function public.award_results(integer) from public, anon;
grant execute on function public.award_results(integer) to authenticated;
