-- Supports the real (non-demo) Operations and Founder dashboards, plus lays
-- the groundwork for a dedicated Finance Officer dashboard (follow-up task,
-- not built in this migration — this just adds the role so it exists).

-- ── 1. Finance role ──────────────────────────────────────────────────────────
alter type public.app_role add value if not exists 'finance';

-- ── 2. Handler ratings ───────────────────────────────────────────────────────
-- One rating per delivered submission — the natural, honest moment to ask
-- ("your CV is ready — how did we do?"), rather than an open-ended rating
-- anyone could spam. Real UI touchpoint (a prompt on the submission status
-- screen) is a separate follow-up task; this is the schema it writes to.
create table if not exists public.handler_ratings (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  handler_id    uuid references auth.users(id) on delete set null,
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  unique (submission_id)
);
alter table public.handler_ratings enable row level security;

create policy "students_rate_own_delivered_submission" on public.handler_ratings
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid() and s.delivered_at is not null
    )
  );
create policy "students_read_own_ratings" on public.handler_ratings
  for select to authenticated using (auth.uid() = user_id);
create policy "operations_founder_finance_read_handler_ratings" on public.handler_ratings
  for select to authenticated using (
    public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'finance')
  );

-- Aggregate view — what the dashboards and (later) the Handler roster
-- actually query, rather than every consumer re-averaging raw rows.
create or replace view public.handler_rating_summary as
  select handler_id, count(*)::integer as rating_count, round(avg(rating)::numeric, 2) as avg_rating
  from public.handler_ratings
  where handler_id is not null
  group by handler_id;

-- ── 3. Coach ratings ─────────────────────────────────────────────────────────
-- Coaches in the app today (ElevationScreen.jsx's hardcoded list) are not yet
-- real platform accounts — coach_profiles.user_id can't be the FK target for
-- most of them. coach_slug stores the same stable identifier already used
-- for this purpose elsewhere (coach_profiles.coach_slug, coach_enquiries.
-- coach_slug — see 20260811090000) instead of a hard FK, until coaches are
-- real accounts. Self-initiated (no booking system to gate it on, matches
-- the enquire-not-book model) — one rating per user per coach, not per
-- engagement, since there's nothing to tie a rating to otherwise.
create table if not exists public.coach_ratings (
  id          uuid primary key default gen_random_uuid(),
  coach_slug  text not null,
  user_id     uuid references auth.users(id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (coach_slug, user_id)
);
alter table public.coach_ratings enable row level security;

create policy "authenticated_rate_coaches" on public.coach_ratings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "anyone_read_coach_ratings" on public.coach_ratings
  for select to authenticated using (true);

create or replace view public.coach_rating_summary as
  select coach_slug, count(*)::integer as rating_count, round(avg(rating)::numeric, 2) as avg_rating
  from public.coach_ratings
  group by coach_slug;

-- ── 4. Coach enquiry counts ──────────────────────────────────────────────────
-- Real, available substitute for "bookings" on the Founder Dashboard — honest
-- about what UniBlueprint can actually see given coaches handle their own
-- bookings outside the platform.
create or replace view public.coach_enquiry_counts as
  select coach_slug, coach_name, count(*)::integer as enquiry_count
  from public.coach_enquiries
  group by coach_slug, coach_name;

comment on view public.coach_enquiry_counts is
  'Per-coach enquiry counts for the Founder Dashboard — substitutes for real booking data, which does not exist under the enquire-not-book model.';
