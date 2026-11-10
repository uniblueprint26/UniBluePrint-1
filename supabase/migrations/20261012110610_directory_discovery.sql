-- Directory discovery: real profiles, a public/private toggle, and a
-- relevance-ranked candidate feed to replace DirectoryScreen.jsx's fully
-- fabricated STUDENTS array.
--
-- Product decisions this migration encodes (confirmed by the founder):
--   1. Discoverability is one account-wide public/private toggle, decided at
--      sign-up and changeable later from Profile settings — same pattern as
--      mainstream social apps, not a separate per-field consent flow.
--   2. The fields shown in real Directory discovery are: name (full_name,
--      already existed), course, year, interests/tags (already existed —
--      profiles.interests, see 20260915100000_profiles_interests.sql),
--      "what they're looking for" (reusing the existing open/study/mentor
--      concept SignUpScreen already collects as `statuses` but never
--      persisted anywhere — see that screen's STATUS_OPTIONS), social/
--      contact links, and one free-text bio.
--   3. course/year_of_study/institution were, until now, collected at
--      sign-up into auth.users.raw_user_meta_data only (SignUpScreen.jsx's
--      `metadata` object) and never written to `profiles` — so there was no
--      queryable, RLS-governed column to match or score on. This migration
--      adds real columns for them; the app writes to them exactly where it
--      already writes user_type/interests post-signup (SignUpScreen.jsx's
--      doSignUp()).
--
-- `institution` doubles as the "location/campus" signal the founder asked
-- for scoring (no separate location/campus column exists on `profiles`
-- today — this is the closest real one).

alter table public.profiles
  add column if not exists discoverable  boolean not null default true,
  add column if not exists course        text,
  add column if not exists year_of_study text,
  add column if not exists institution   text,
  add column if not exists statuses      text[] not null default '{}',
  add column if not exists bio           text,
  add column if not exists social_links  jsonb not null default '{}'::jsonb;

comment on column public.profiles.discoverable is
  'Public/private Directory toggle, decided at sign-up (SignUpScreen.jsx) and changeable later from Profile > Directory Profile. Default true (public) — matches the mainstream-social-app default the founder asked for ("like other social media"); flagged explicitly in the P.R. for this feature given the student audience, since this is a real safety tradeoff, not a cosmetic one. A false value here is enforced at the database level by get_directory_profiles() below, not just hidden client-side.';
comment on column public.profiles.course is
  'Course/programme name, collected at sign-up (SignUpScreen.jsx step 3). Used for Directory relevance scoring (exact match) and display. Not editable post-signup yet — same limitation EditProfileModal already states for institution/course.';
comment on column public.profiles.year_of_study is
  'Year of study, collected at sign-up. Used for Directory relevance scoring (exact match) and display.';
comment on column public.profiles.institution is
  'Institution/college name, collected at sign-up. Doubles as the Directory relevance-scoring "location/campus" signal — profiles has no separate location column.';
comment on column public.profiles.statuses is
  'What this person is open to / looking for: a subset of open (Open to Connect) / study (Looking for a Study Group) / mentor (Happy to Mentor). Same concept SignUpScreen.jsx has collected into user_metadata.statuses since before this migration (see its STATUS_OPTIONS) but never persisted to a queryable column until now — Directory''s "what they''re looking for" field reuses this exact concept rather than duplicating it.';
comment on column public.profiles.bio is
  'Free-text, self-written blurb shown on the Directory card. Plain text, no markdown. Null/empty means not set.';
comment on column public.profiles.social_links is
  'Self-reported social/contact links, keyed by platform (e.g. {"instagram": "...", "linkedin": "...", "other": "..."}). Shown on the Directory card as-is; never used to initiate contact server-side — "Connect" uses start_direct_chat() instead (see 20261011224102_direct_messaging.sql).';

-- Query-plan help for get_directory_profiles() below: most profiles are
-- expected to stay at the default (discoverable = true), so a plain partial
-- index on the "true" rows keeps the common-case scan cheap as the table
-- grows, mirroring the targeted-index style already used for
-- profiles.interests (profiles_interests_gin_idx).
create index if not exists profiles_discoverable_idx
  on public.profiles (discoverable)
  where discoverable = true;


-- ── get_directory_profiles(): the ONLY path to another user's Directory data ──
--
-- `profiles` itself keeps its original, unchanged "Users can read own
-- profile" policy (select ... using auth.uid() = id) — this migration does
-- NOT loosen that. A direct `select * from profiles` for someone else's row
-- still returns nothing, regardless of their discoverable flag. Instead,
-- this is a security-definer function in the same pattern already
-- established by get_popular_interests() (20260915120000_popular_interests_rpc.sql):
-- it can read every row internally, but only ever hands back a fixed, safe
-- column subset — never personal_email, university_email, date_of_birth,
-- device_fingerprint, handler_status, or anything else sensitive sitting on
-- the same row.
--
-- Enforcement happens HERE, at the database level, not in the app:
--   - discoverable = true is a WHERE clause inside this function — a
--     private profile is never a row this function can return, no matter
--     what the calling client does or omits.
--   - the caller's own row is excluded (id <> auth.uid()) — Directory never
--     lists you to yourself.
--   - blocked_users is checked BOTH directions (blocker_id/blocked_id either
--     way), same safety boundary already built for chat tonight
--     (20261009140000_chat_blocking.sql) and for starting a direct chat
--     (start_direct_chat() in 20261011224102_direct_messaging.sql) — two
--     people who've blocked each other must not see each other here either,
--     not just be unable to message each other.
create or replace function public.get_directory_profiles()
returns table (
  id            uuid,
  full_name     text,
  avatar_url    text,
  course        text,
  year_of_study text,
  institution   text,
  interests     text[],
  statuses      text[],
  bio           text,
  social_links  jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.full_name, p.avatar_url, p.course, p.year_of_study,
    p.institution, p.interests, p.statuses, p.bio, p.social_links
  from public.profiles p
  where p.discoverable = true
    and p.id <> auth.uid()
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
$$;

comment on function public.get_directory_profiles() is
  'Real Directory candidate feed. Returns only a fixed, display-safe column subset for OTHER discoverable (discoverable = true) profiles, excluding the caller themselves and anyone in a mutual block relationship with them (either direction) — enforced inside this security-definer function, not by the caller or by RLS on profiles. The app ranks the returned rows client-side (see app/src/lib/directoryRanking.js) against the caller''s own profile fields (already readable via the normal own-row profiles policy); ranking is a display concern, the privacy boundary is this function.';

revoke all on function public.get_directory_profiles() from public;
grant execute on function public.get_directory_profiles() to authenticated;
