-- Campus Pulse — Desmond's "designated" ephemeral-content feature for
-- Campus Connect. Explicitly NOT a generic Stories/Snapchat clone: one
-- recurring low-pressure weekly prompt lives on the Campus Events board
-- area ("What's campus actually like this week?"), students post a short
-- reply, and each week the prompt rotates — the previous week's responses
-- are ARCHIVED (never deleted) behind a real, on-brand "Past Weeks" browse
-- view, not just a status flag. No streaks, no leaderboard, no ranking —
-- a plain chronological list, matching this app's "practical, not hype"
-- tone. Purpose: bootstrap content on Campus Connect, especially useful for
-- cold-starting a brand-new campus where every other board starts empty.
--
-- ═══ Design notes ════════════════════════════════════════════════════════
--
-- 1. Anonymous posting — NOT supported here, by deliberate choice. This
--    codebase already draws a real line between two kinds of Campus
--    Connect board: the four "sensitive disclosure" boards (Campus
--    Conversation Boards, Problems & Solutions, College Reviews, Campus
--    Suggestions — see campusBoards.js's ANONYMIZED_BOARD_FEED_RPC and
--    20260926090000_anonymous_board_posts_lockdown.sql) where anonymity is
--    core to getting people to post honestly, versus every other board
--    (Campus Events, Study Groups, Carpooling, Accommodation, ...) which
--    just shows the poster's name, same as any ordinary campus post.
--    Campus Pulse is explicitly the latter: a light, positive, low-stakes
--    "what's this week like" check-in posted on the Events board area, not
--    a disclosure outlet. Attaching names also keeps it simple — no
--    SECURITY DEFINER masking RPC, no anonymous-flag column — which matches
--    the "small-medium" sizing for this feature.
--
-- 2. Rotation sequence — campus_pulse_prompts.sort_order is a fixed,
--    hand-written rotation through the seeded list below (wraps back to
--    the first prompt once the last one is used), not a random pick. This
--    keeps a brand-new campus's first eight weeks fully predictable and
--    reviewable up front rather than left to chance.
--
-- 3. One response per student per prompt — campus_pulse_responses has a
--    unique (prompt_id, user_id). A student "manages their own response"
--    (per the brief) by editing that one row (upsert on conflict) rather
--    than posting unlimited replies to the same week's prompt — this is
--    the mechanism that keeps the feature "low-pressure": no urge to post
--    more than once, nothing to rack up.
--
-- 4. Scheduling follows the one pattern already used in this codebase for
--    a weekly job — generate_handler_snapshots() /
--    generate_weekly_blueprint_reports(), both plain Postgres functions
--    registered directly with pg_cron (no external call, so no Edge
--    Function needed). Same security-definer + "pg_cron carries no JWT,
--    only block an authenticated non-Operations caller" guard as both.
--
-- 5. No admin UI for writing prompts, and no moderation dashboard — the
--    seeded rotation + the weekly cron is the entire authoring surface, as
--    scoped.

-- ── 1. Prompts ───────────────────────────────────────────────────────────

create table public.campus_pulse_prompts (
  id          uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  sort_order  integer not null unique,
  week_start  date,
  week_end    date,
  active      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- At most one active prompt at a time — a partial unique index on the
-- (always-true) `active` column, scoped to rows where it's true, is the
-- standard Postgres idiom for "unique among the true rows only".
create unique index campus_pulse_prompts_one_active
  on public.campus_pulse_prompts (active) where active;

alter table public.campus_pulse_prompts enable row level security;

-- Read-only from the client in both directions: every authenticated
-- student can see the current prompt and every past one (that's the whole
-- point of the "Past Weeks" browse view) — nothing here is sensitive.
-- There is deliberately no insert/update/delete policy for 'authenticated':
-- the seeded rotation + rotate_campus_pulse_prompt() (SECURITY DEFINER,
-- below) are the only writers, matching "no admin UI for writing prompts".
create policy "read_campus_pulse_prompts" on public.campus_pulse_prompts
  for select to authenticated using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_pulse_prompts') then
    alter publication supabase_realtime add table public.campus_pulse_prompts;
  end if;
end $$;

-- ── 2. Responses ─────────────────────────────────────────────────────────

create table public.campus_pulse_responses (
  id          uuid primary key default gen_random_uuid(),
  prompt_id   uuid not null references public.campus_pulse_prompts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  poster_name text,
  content     text not null check (char_length(btrim(content)) > 0 and char_length(content) <= 500),
  created_at  timestamptz not null default now(),
  archived_at timestamptz,
  unique (prompt_id, user_id)
);
alter table public.campus_pulse_responses enable row level security;

create policy "read_campus_pulse_responses" on public.campus_pulse_responses
  for select to authenticated using (true);
create policy "insert_own_campus_pulse_response" on public.campus_pulse_responses
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_campus_pulse_response" on public.campus_pulse_responses
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_campus_pulse_response" on public.campus_pulse_responses
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_pulse_responses') then
    alter publication supabase_realtime add table public.campus_pulse_responses;
  end if;
end $$;

-- ── 3. Seed rotation — 8 hand-written, on-brand prompts ──────────────────
-- The first (sort_order 1) goes live immediately, dated to the current
-- Mon–Sun week, so a brand-new campus has a real prompt on day one. The
-- rest sit inactive with no week_start/week_end until rotate_campus_pulse_
-- prompt() assigns them one in turn — which is also exactly how "Past
-- Weeks" tells a week that's actually happened (week_start is not null)
-- from one still waiting in the queue (week_start is null).
insert into public.campus_pulse_prompts (prompt_text, sort_order, week_start, week_end, active) values
  ('What''s campus actually like this week? The good, the bad, the painfully mid.', 1, date_trunc('week', now())::date, date_trunc('week', now())::date + 7, true),
  ('What''s one thing about this week you wish someone had warned you about?', 2, null, null, false),
  ('Best (or worst) thing you ate on or near campus this week — and where?', 3, null, null, false),
  ('What''s the one thing everyone on your course is talking about right now?', 4, null, null, false),
  ('Which spot on campus deserves way more credit than it gets?', 5, null, null, false),
  ('What''s one small win you had this week — academic or otherwise?', 6, null, null, false),
  ('If you could change one thing about this week, what would it be?', 7, null, null, false),
  ('How''s the deadline/exam stress sitting with you right now, honestly?', 8, null, null, false);

-- ── 4. Weekly rotation function ───────────────────────────────────────────
-- Deactivates the current prompt, archives its responses (sets
-- archived_at, never deletes), and activates the next prompt in the fixed
-- sort_order sequence, wrapping back to the first once the list is
-- exhausted. Idempotent and safe to run with zero prior state (first-ever
-- run on a fresh project with nothing active yet just activates sort_order
-- 1's row, which the seed above already does — this only matters if that
-- row is ever manually deactivated).
create or replace function public.rotate_campus_pulse_prompt()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current record;
  v_next record;
  v_week_start date := date_trunc('week', now())::date;
  v_week_end date := v_week_start + 7;
begin
  -- Same three-way guard as handle_deadline_escalation() / generate_
  -- handler_snapshots() / generate_weekly_blueprint_reports(): pg_cron
  -- carries no JWT at all (auth.uid() is null) and must always be able to
  -- run; an authenticated caller who isn't Operations is rejected;
  -- Operations can still trigger a manual run for testing.
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  select * into v_current from public.campus_pulse_prompts where active = true limit 1;

  if v_current.id is not null then
    update public.campus_pulse_prompts set active = false where id = v_current.id;
    update public.campus_pulse_responses
       set archived_at = now()
     where prompt_id = v_current.id and archived_at is null;
  end if;

  -- Next in sequence after the current one; wrap to the lowest sort_order
  -- if the current prompt was the last in the list (or there was none).
  select * into v_next from public.campus_pulse_prompts
   where sort_order > coalesce(v_current.sort_order, 0)
   order by sort_order asc limit 1;

  if v_next.id is null then
    select * into v_next from public.campus_pulse_prompts order by sort_order asc limit 1;
  end if;

  if v_next.id is not null then
    update public.campus_pulse_prompts
       set active = true, week_start = v_week_start, week_end = v_week_end
     where id = v_next.id;
  end if;
end;
$$;

grant execute on function public.rotate_campus_pulse_prompt() to authenticated;

-- ── pg_cron registration ──────────────────────────────────────────────────
-- Same guard pattern as 20260727090000_escalation_performance_ops.sql /
-- 20261015130000_weekly_blueprint_report.sql: if pg_cron isn't enabled on
-- this project this block fails and the function above still exists and is
-- callable manually / from an external scheduler. Scheduled a few minutes
-- after the other Monday-morning jobs already registered at '0 8 * * 1'
-- and '1 0 * * 1', to avoid them all landing in the exact same cron tick.
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'rotate-campus-pulse-prompt') then
    perform cron.schedule('rotate-campus-pulse-prompt', '5 0 * * 1', 'select public.rotate_campus_pulse_prompt();');
  end if;
end $$;
