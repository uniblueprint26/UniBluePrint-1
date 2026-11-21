-- Campus ranked: a college competition by collective resource use.
--
-- Real data only. A college shows only when at least 25 members have it as their
-- institution (the floor is enforced here, the app cannot lower it). Only totals
-- per college are returned, never anything about a person.
--
-- Resource use per college, counted from rows that members created:
--   notes and past papers shared, downloads of those, busy spot reports,
--   study room slots handed over.
-- Score = resource use per member, so a big college has no head start.
-- Not applied by the build.

create or replace function public.campus_ranking(p_min_members int default 25)
returns table (
  rank int,
  institution text,
  members bigint,
  resources_shared bigint,
  downloads bigint,
  spot_reports bigint,
  rooms_handed_over bigint,
  score numeric
)
language sql stable security definer set search_path = public as $$
  with mem as (
    select p.institution, count(*) as n
    from public.profiles p
    where p.institution is not null and btrim(p.institution) <> ''
    group by p.institution
    having count(*) >= greatest(coalesce(p_min_members, 25), 25)
  ),
  res as (
    select lower(institution) as k, count(*) as shared, coalesce(sum(download_count), 0) as dl
    from (
      select institution, download_count from public.shared_notes
      union all
      select institution, download_count from public.past_papers
    ) r
    where institution is not null
    group by lower(institution)
  ),
  spots as (
    select lower(s.institution) as k, count(r.id) as n
    from public.busy_spots s join public.busy_spot_reports r on r.spot_id = s.id
    group by lower(s.institution)
  ),
  rooms as (
    select lower(institution) as k, count(*) as n
    from public.study_room_shares where status = 'handed_over'
    group by lower(institution)
  ),
  scored as (
    select
      mem.institution, mem.n as members,
      coalesce(res.shared, 0) as resources_shared,
      coalesce(res.dl, 0) as downloads,
      coalesce(spots.n, 0) as spot_reports,
      coalesce(rooms.n, 0) as rooms_handed_over,
      round(
        (coalesce(res.shared, 0) + coalesce(res.dl, 0) + coalesce(spots.n, 0) + coalesce(rooms.n, 0))::numeric
        / mem.n, 2
      ) as score
    from mem
    left join res on res.k = lower(mem.institution)
    left join spots on spots.k = lower(mem.institution)
    left join rooms on rooms.k = lower(mem.institution)
  )
  select (row_number() over (order by score desc, institution))::int, institution, members,
         resources_shared, downloads, spot_reports, rooms_handed_over, score
  from scored
  order by 1;
$$;
revoke all on function public.campus_ranking(int) from public, anon;
grant execute on function public.campus_ranking(int) to authenticated;
