-- Backing schema for The Weekly Blueprint (see the 27-page spec Desmond sent
-- — cover, contents, deals, coach spotlights, Foundation Focus, Campus
-- Connect events, Student Spotlight, Campus Guide, Lifestyle Edit,
-- Marketplace, Team, Money Moves, Coach Board, UBP Board, Week Ahead, Ad
-- Board, Blueprint Feature, Founders' Note, closing — in that fixed order
-- every week).
--
-- Most of those 27 slots already have a real data source elsewhere (deals,
-- coach_profiles, Foundation services, Lifestyle partners, the ads table for
-- the Ad Board/Marketplace pages). The pages that don't — Campus Connect
-- events, Student Spotlight, Campus Guide, Meet the Team, the Coach Board
-- quotes, UBP Board announcements, Week Ahead, Blueprint Feature, and the
-- Founders' Note — are genuinely one-off editorial content nobody should
-- fabricate on their behalf. weekly_issue_content is a flexible per-page
-- store for exactly those slots, written by Operations/Founder through a
-- real editor screen (WeeklyIssueEditorScreen.jsx), not raw SQL.

create table if not exists public.weekly_issues (
  id            uuid primary key default gen_random_uuid(),
  issue_number  integer not null unique,
  week_of       date not null,
  theme         text,
  published     boolean not null default false,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.weekly_issues enable row level security;

create policy "operations_founder_manage_weekly_issues" on public.weekly_issues
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));
create policy "authenticated_read_published_issues" on public.weekly_issues
  for select to authenticated using (published = true);

-- page_key values used by AdBoardScreen.jsx: campus_events, student_spotlight,
-- campus_guide, team, coach_board, ubp_board, week_ahead, blueprint_feature,
-- founders_note. content is freeform jsonb since each page's shape differs
-- (e.g. campus_events is a list of {institution, event, date, location},
-- founders_note is a single {body} object) — one flexible table beats nine
-- rigid ones for content this editorial and this likely to change shape.
create table if not exists public.weekly_issue_content (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null references public.weekly_issues(id) on delete cascade,
  page_key     text not null,
  content      jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  unique (issue_id, page_key)
);
alter table public.weekly_issue_content enable row level security;

create policy "operations_founder_manage_weekly_content" on public.weekly_issue_content
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));
create policy "authenticated_read_published_content" on public.weekly_issue_content
  for select to authenticated using (
    exists (select 1 from public.weekly_issues wi where wi.id = weekly_issue_content.issue_id and wi.published = true)
  );

create or replace function public.touch_weekly_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_touch_weekly_issues on public.weekly_issues;
create trigger trg_touch_weekly_issues before update on public.weekly_issues
  for each row execute function public.touch_weekly_updated_at();
drop trigger if exists trg_touch_weekly_content on public.weekly_issue_content;
create trigger trg_touch_weekly_content before update on public.weekly_issue_content
  for each row execute function public.touch_weekly_updated_at();

-- Single round trip for the app: the most recent published issue plus all of
-- its editorial content, content rows folded into one jsonb object keyed by
-- page_key. Returns zero rows if nothing has been published yet — the app
-- treats that as "no issue live", not an error.
create or replace function public.get_current_weekly_issue()
returns table (
  id            uuid,
  issue_number  integer,
  week_of       date,
  theme         text,
  content       jsonb
)
language sql stable security definer set search_path = public as $$
  select wi.id, wi.issue_number, wi.week_of, wi.theme,
    coalesce(
      jsonb_object_agg(wic.page_key, wic.content) filter (where wic.page_key is not null),
      '{}'::jsonb
    )
  from public.weekly_issues wi
  left join public.weekly_issue_content wic on wic.issue_id = wi.id
  where wi.published = true
  group by wi.id, wi.issue_number, wi.week_of, wi.theme
  order by wi.week_of desc
  limit 1
$$;

grant execute on function public.get_current_weekly_issue() to authenticated;
