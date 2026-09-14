-- Home dashboard "Spotlight" carousel — manually curated, not algorithmic.
--
-- Founder feedback: Home's old "Live Activity" section leaned on whichever
-- rows happened to be freshest in the `deals`/`partners` tables — generic
-- seed-style demo rows nobody hand-picked, not the app's real, editorial
-- content. featured_content lets an admin/founder pin specific REAL items —
-- a Foundation Blueprint service, a real coach, a real Lifestyle partner, a
-- real Campus/Course Connect board — to a rotating home-screen carousel,
-- with an explicit order and an optional rotation window.
--
-- Deliberately NOT a copy of each referenced item's fields: `content_type` +
-- `ref_id` point at the single real source of truth for that kind of
-- content (see lib/featuredContent.js), which is resolved live at render
-- time — so a coach's price, a partner's deal text, or a board's live post
-- count is always current, never a snapshot frozen at curation time.
-- `ref_id` is text because the real id shapes differ by type: a uuid for a
-- DB-backed row (Lifestyle partner slug), a small integer-as-text for the
-- static COACHES id (ElevationScreen.jsx — coach_profiles has no name/price
-- columns and is usually empty pre-signup), a board `key` string for the
-- CAMPUS_BOARDS/COURSE_BOARDS registries, or a Foundation service title.
create table if not exists public.featured_content (
  id            uuid primary key default gen_random_uuid(),
  content_type  text not null check (content_type in (
                  'foundation_service', 'coach', 'lifestyle_partner',
                  'campus_board', 'course_board'
                )),
  ref_id        text not null,
  caption       text,        -- optional editorial line shown on the slide, e.g. "Founder's pick"
  cta_label     text,        -- optional CTA override, e.g. "Book Eman"
  priority      integer not null default 0,  -- lower shows first
  starts_at     timestamptz,  -- null = no start restriction
  ends_at       timestamptz,  -- null = no end restriction
  active        boolean not null default true,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.featured_content enable row level security;

-- Every signed-in user can see what's currently in rotation — the same
-- window check the carousel itself applies client-side, mirrored here so a
-- disabled/expired pin is never readable, not just hidden by the UI.
create policy "authenticated_read_active_featured_content" on public.featured_content
  for select to authenticated
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Only Founder/Operations curate the carousel — same role pattern as
-- weekly_issues (20260829160000_weekly_blueprint.sql).
create policy "operations_founder_manage_featured_content" on public.featured_content
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

create or replace function public.touch_featured_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists featured_content_touch_updated_at on public.featured_content;
create trigger featured_content_touch_updated_at
  before update on public.featured_content
  for each row execute function public.touch_featured_content_updated_at();

create index if not exists featured_content_active_priority_idx
  on public.featured_content (active, priority, created_at);
