# UBP Awards voting (Ireland 2026, issue 1)

Voting opens 26 December 2026 and closes 3 January 2027. Winners are announced in issue 2.

## Data flow

1. Nominees are not in their own table. They live in the issue's `weekly_issue_content` row with `page_key = 'wrapped'`, on pages of kind `awards`:
   `{ kind: 'awards', categories: [ { key, title, nominees: [ { key or name, why, source } ] } ] }`.
   The wrapped content can be `{ pages: [...] }` or a bare array of pages. A nominee is identified by `key`, or by `name` when there is no key.
2. The app screen `AwardsVoting` (route `awards-voting`, in the Ad Board stack) calls `get_current_weekly_issue`, collects the awards categories, and calls `my_award_votes(p_issue)` for the member's own picks.
3. Nominees are shown in an order that is random between members but fixed for each member (seeded by member id and category). Nothing is ranked.
4. A tap calls `cast_award_vote(p_issue, p_category, p_nominee)`. The function checks the member is signed in, that voting is open, and that the category and nominee exist in that issue's published wrapped content. It then saves one vote per member per category, and a changed vote replaces the old one until voting closes.
5. Members never see counts. `award_results(p_issue)` returns rows for founder and operations only (everyone else gets no rows unless `awards_results_visible` is set to true). The app never calls it.
6. The table `award_votes` has RLS on. Members can read only their own rows. There are no insert, update or delete policies and the grants are removed, so clients can only write through the function.

Migration: `supabase/migrations/20261124000000_award_votes.sql`. Safe to run more than once. It also adds the flag `awards_results_visible = false` if it is missing. It was tested against a throwaway local Postgres with stub tables (closed by default, open, change vote, wrong nominee, direct insert blocked, anon blocked, window closed, bad flag value, results visibility).

## Flags to set (public.app_flags, values are JSON)

Voting stays closed until both dates are set. A missing or badly formed date means closed, in the app and on the server.

```sql
insert into public.app_flags (key, value) values
  ('awards_voting_opens',   '"2026-12-26T00:00:00Z"'::jsonb),
  ('awards_voting_closes',  '"2027-01-03T23:59:59Z"'::jsonb),
  ('awards_results_visible', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
```

The app caches flags for 10 minutes, so a change shows within that time.

## What members see

- Before opening: "Voting opens 26 December" and the nominees to read (no voting).
- Open: pick one nominee per category, "Your vote is in", and "Change vote" until closing.
- After closing: "Voting closed, winners in the next issue". Their own picks are listed.
- "Winners announced in issue 2" shows before and during voting.

## Test queries (read only, run as the founder)

```sql
-- Are the flags set?
select key, value from public.app_flags where key like 'awards_%';

-- Does the wrapped issue have awards categories?
select pg->>'kind' as kind, cat->>'key' as category, jsonb_array_length(cat->'nominees') as nominees
from public.weekly_issues wi
join public.weekly_issue_content wic on wic.issue_id = wi.id and wic.page_key = 'wrapped'
cross join lateral jsonb_array_elements(case when jsonb_typeof(wic.content->'pages')='array' then wic.content->'pages' else wic.content end) pg
cross join lateral jsonb_array_elements(coalesce(pg->'categories','[]'::jsonb)) cat
where wi.issue_number = 1 and pg->>'kind' = 'awards';

-- Counts per nominee (the function only answers founder and operations)
select * from public.award_results(1);

-- Raw counts (SQL editor only)
select category_key, nominee_key, count(*) from public.award_votes where issue_number = 1 group by 1, 2 order by 1, 3 desc;
```

## Store review notes

Members vote on real people and groups. Keep every nominee line (`why`) factual and positive, sourced from published 2026 coverage, with no ranking and nothing about private individuals. Voting is 18 plus like the rest of the app. There is no money, prize or purchase involved.
