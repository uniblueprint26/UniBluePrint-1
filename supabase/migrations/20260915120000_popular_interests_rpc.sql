-- get_popular_interests — the real, PII-free data source behind Directory's
-- dynamic tag filter pills (Task #12).
--
-- profiles.interests (see 20260915100000_profiles_interests.sql) is
-- protected by "Users can read own profile" (select ... using auth.uid() =
-- id) — a person can read only their own row, not the whole user base.
-- Directory's filter pills need the opposite: an aggregate count of every
-- label in use across ALL real profiles, with no per-user detail attached
-- (no id, no name, nothing else from the row). That is exactly the shape a
-- security-definer function is for: it can read every row internally, but
-- the only thing it hands back out is (label, usage_count) — safe to expose
-- broadly without loosening the profiles table's own row-level privacy at
-- all. This intentionally stops well short of exposing the profiles table
-- itself to other users — that is a separate, bigger product decision
-- (a real public/browsable directory of real people), not something this
-- migration makes on its own.
create or replace function public.get_popular_interests(limit_count integer default 12)
returns table(label text, usage_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select t.label, count(*)::bigint as usage_count
  from public.profiles p
  cross join lateral unnest(p.interests) as t(label)
  where p.interests is not null and array_length(p.interests, 1) > 0
  group by t.label
  order by usage_count desc, t.label asc
  limit greatest(coalesce(limit_count, 12), 0)
$$;

comment on function public.get_popular_interests(integer) is
  'Aggregate, PII-free interest-tag popularity across every real profile — (label, usage_count) only, no user identity. Backs Directory''s dynamic filter pills (Task #12): the pill SET is whatever this returns, so it grows/changes as real users add interests via useInterests(), rather than being a hardcoded list.';

revoke all on function public.get_popular_interests(integer) from public;
grant execute on function public.get_popular_interests(integer) to authenticated;
