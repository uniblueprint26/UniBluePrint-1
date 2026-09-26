-- P0-3 fix: "Anonymous" posts on Campus Connect boards aren't actually
-- anonymous.
--
-- Verified against the live schema (campus_conversations, problems_posts,
-- college_reviews, campus_suggestions — see
-- 20260909110000/20260909130000/20260909150000_*.sql): every row stores
-- poster_name and user_id regardless of the `anonymous` flag, and each
-- table's own "read_*" policy is `for select to authenticated using
-- (true)` — any signed-in user can read every row of every table directly
-- (e.g. `GET /rest/v1/campus_conversations?select=user_id,poster_name`),
-- so an "anonymous" post's real author was trivially recoverable via a
-- direct API call. The client already hides poster_name/user_id when
-- `anonymous = true` (BoardDetailScreen), but that's UI-only and doesn't
-- stop anyone from bypassing the app and querying PostgREST directly.
--
-- Fix, in two parts, following the same "revoke the view/table, gate with
-- a SECURITY DEFINER function" pattern already used in this schema for
-- partner_performance_stats (20260810120100) and the founder/ops dashboard
-- views (20260829120000/20260829130000/20260829140000):
--
--   1. Replace each table's permissive "any signed-in user, every row"
--      SELECT policy with an owner-only one. Direct REST/select access to
--      the base table now only ever returns rows you posted yourself —
--      INSERT/UPDATE/DELETE are untouched, since those already run
--      through their own "insert/update/delete own row" policies keyed on
--      auth.uid() = user_id, not this SELECT policy.
--   2. Add a masking view per table (owned by the migration role, so it
--      bypasses the tables' RLS the same way the dashboard views do) that
--      nulls user_id and poster_name for any row that is anonymous AND
--      isn't the caller's own — real name/id are still returned for
--      non-anonymous rows, and for the poster's own row regardless of the
--      anonymous flag. The view itself is revoked from every role; the
--      only way to read it is through a SECURITY DEFINER function granted
--      to `authenticated`, matching the house style (no has_role() gate is
--      needed here — unlike the founder/ops/partner dashboards, every
--      signed-in student is meant to browse every board, so the function
--      does not additionally check `has_role()`; it only applies the
--      per-row anonymity mask).
--
-- Companion app-code fix (same change set): PostFormModal.jsx no longer
-- writes poster_name into the row at all when the post is anonymous, and
-- BoardDetailScreen.jsx/campusBoards.js read these 4 tables through the
-- new get_*_feed() RPCs below instead of a plain `select('*')` on the
-- table. `college_reviews` is read the same way by both Campus Connect's
-- own "reviews" board and Course Connect's "course-reviews" board, which
-- reuses the same table.
--
-- NOT applied by this session — author-only migration, left for a human
-- to review and run.

-- ── campus_conversations ─────────────────────────────────────────────────
drop policy if exists "read_campus_conversations" on public.campus_conversations;
create policy "read_own_campus_conversation" on public.campus_conversations
  for select to authenticated using (auth.uid() = user_id);

create or replace view public.campus_conversations_feed as
select
  id,
  case when anonymous and user_id is distinct from auth.uid() then null else user_id end as user_id,
  case when anonymous and user_id is distinct from auth.uid() then null else poster_name end as poster_name,
  title,
  body,
  anonymous,
  created_at
from public.campus_conversations;

revoke all on public.campus_conversations_feed from public, anon, authenticated;

create or replace function public.get_campus_conversations_feed()
returns setof public.campus_conversations_feed
language sql stable security definer set search_path = public as $$
  select * from public.campus_conversations_feed order by created_at desc
$$;

grant execute on function public.get_campus_conversations_feed() to authenticated;

-- ── problems_posts ───────────────────────────────────────────────────────
drop policy if exists "read_problems_posts" on public.problems_posts;
create policy "read_own_problems_post" on public.problems_posts
  for select to authenticated using (auth.uid() = user_id);

create or replace view public.problems_posts_feed as
select
  id,
  case when anonymous and user_id is distinct from auth.uid() then null else user_id end as user_id,
  case when anonymous and user_id is distinct from auth.uid() then null else poster_name end as poster_name,
  description,
  category,
  anonymous,
  created_at
from public.problems_posts;

revoke all on public.problems_posts_feed from public, anon, authenticated;

create or replace function public.get_problems_posts_feed()
returns setof public.problems_posts_feed
language sql stable security definer set search_path = public as $$
  select * from public.problems_posts_feed order by created_at desc
$$;

grant execute on function public.get_problems_posts_feed() to authenticated;

-- ── college_reviews ──────────────────────────────────────────────────────
drop policy if exists "read_college_reviews" on public.college_reviews;
create policy "read_own_college_review" on public.college_reviews
  for select to authenticated using (auth.uid() = user_id);

create or replace view public.college_reviews_feed as
select
  id,
  case when anonymous and user_id is distinct from auth.uid() then null else user_id end as user_id,
  case when anonymous and user_id is distinct from auth.uid() then null else poster_name end as poster_name,
  institution,
  overall_rating,
  teaching_quality,
  campus_facilities,
  student_support,
  social_life,
  value_for_money,
  review_text,
  anonymous,
  created_at
from public.college_reviews;

revoke all on public.college_reviews_feed from public, anon, authenticated;

create or replace function public.get_college_reviews_feed()
returns setof public.college_reviews_feed
language sql stable security definer set search_path = public as $$
  select * from public.college_reviews_feed order by created_at desc
$$;

grant execute on function public.get_college_reviews_feed() to authenticated;

-- ── campus_suggestions ───────────────────────────────────────────────────
drop policy if exists "read_campus_suggestions" on public.campus_suggestions;
create policy "read_own_campus_suggestion" on public.campus_suggestions
  for select to authenticated using (auth.uid() = user_id);

create or replace view public.campus_suggestions_feed as
select
  id,
  case when anonymous and user_id is distinct from auth.uid() then null else user_id end as user_id,
  case when anonymous and user_id is distinct from auth.uid() then null else poster_name end as poster_name,
  title,
  description,
  category,
  anonymous,
  created_at
from public.campus_suggestions;

revoke all on public.campus_suggestions_feed from public, anon, authenticated;

create or replace function public.get_campus_suggestions_feed()
returns setof public.campus_suggestions_feed
language sql stable security definer set search_path = public as $$
  select * from public.campus_suggestions_feed order by created_at desc
$$;

grant execute on function public.get_campus_suggestions_feed() to authenticated;
