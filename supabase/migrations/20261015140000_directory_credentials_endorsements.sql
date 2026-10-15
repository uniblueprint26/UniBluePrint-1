-- Directory enhancements (confirmed by the founder):
--   1. Surface the existing profiles.user_type on the Directory card (no new
--      account types — that's a separate, bigger, deferred decision).
--   2. A short, user-editable "credentials" free-text list shown on the card
--      (e.g. "BA Business, DCU", "Qualified Electrician", "2nd Year Law").
--   3. Location (profiles.institution, the closest real "location/campus"
--      signal — see 20261012110000_directory_discovery.sql) becomes
--      removable/toggleable per-profile, not mandatory.
--   4. Peer skill-endorsements, visible only on a student's full profile
--      view (never the compact Directory card/list) — same
--      unique-constraint-table + aggregate-view + self-endorsement-blocked
--      pattern already established by coach_ratings
--      (20260828170001_dashboard_ratings_and_finance_role.sql) and
--      blocked_users (20261009140000_chat_blocking.sql).

-- ── 1 & 2. New self-service profile columns ─────────────────────────────────
-- Mirrors the existing profiles.interests convention (flat text[], own-row
-- RLS already covers writes — "Users can update own profile",
-- 20260410140346) rather than a junction table, since this is a short,
-- free-typed list with no relational meaning. Capped at 3 entries at the
-- database level (not just in the app), matching the "1-3 short strings"
-- shape decided for this feature; per-entry length is capped in the app
-- write boundary (AuthContext.updateDirectoryCredentials), same split as
-- MAX_CUSTOM_INTEREST_LENGTH/updateInterests.
alter table public.profiles
  add column if not exists directory_credentials text[] not null default '{}',
  add column if not exists directory_hide_location boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_directory_credentials_max3;
alter table public.profiles
  add constraint profiles_directory_credentials_max3
  check (array_length(directory_credentials, 1) is null or array_length(directory_credentials, 1) <= 3);

comment on column public.profiles.directory_credentials is
  'Short, self-written free-text credentials shown on the Directory card (e.g. "BA Business, DCU", "Qualified Electrician", "2nd Year Law") — up to 3 entries, enforced by profiles_directory_credentials_max3. Empty array, not null, means none set. Edited from the same place as profiles.interests (Profile > Directory Profile) via useDirectoryProfile()/AuthContext.updateDirectoryProfile().';
comment on column public.profiles.directory_hide_location is
  'Per-profile opt-out of showing institution (the Directory "location" signal) on this person''s own Directory card. Default false (shown), matching discoverable''s own default-public convention. Enforced inside get_directory_profiles() below, not just hidden client-side — a true value here means the function never hands institution back to other callers at all.';

-- ── 3. get_directory_profiles(): add user_type + directory_credentials,     ──
-- ── and enforce the location toggle at the function level                  ──
--
-- Return shape changes (adds user_type, directory_credentials). Postgres
-- refuses to change a set-returning function's output columns via CREATE OR
-- REPLACE ("cannot change return type of existing function"; its own HINT
-- says to DROP FUNCTION first) — but DROP FUNCTION on this project hangs
-- (reproduced repeatedly live against ozpeofkvnpikhopkgcxc: the statement
-- never returns, though pg_stat_activity shows nothing blocking it — almost
-- certainly the sql_drop event triggers Supabase installs for PostgREST's
-- schema-cache reload, e.g. pgrst_drop_watch/issue_graphql_placeholder;
-- CREATE and ALTER ... RENAME, which don't fire sql_drop, both return
-- instantly). Renaming the old function out of the way sidesteps DROP
-- entirely: ALTER FUNCTION RENAME only touches pg_proc.proname, needs no
-- sql_drop event, and is simultaneously how the old definition's grants
-- (including the anon revoke from
-- 20261012110100_directory_discovery_revoke_anon.sql) get revoked before it
-- goes inert, immediately below. A later cleanup migration, once DROP is
-- confirmed working again here, can drop get_directory_profiles_old_v1
-- properly; leaving it renamed-and-grant-less is harmless meanwhile — no
-- role can execute it.
alter function public.get_directory_profiles() rename to get_directory_profiles_old_v1;
revoke all on function public.get_directory_profiles_old_v1() from public, authenticated, anon;

create function public.get_directory_profiles()
returns table (
  id                    uuid,
  full_name             text,
  avatar_url            text,
  course                text,
  year_of_study         text,
  institution           text,
  interests             text[],
  statuses              text[],
  bio                   text,
  social_links          jsonb,
  user_type             text,
  directory_credentials text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.full_name, p.avatar_url, p.course, p.year_of_study,
    case when p.directory_hide_location then null else p.institution end as institution,
    p.interests, p.statuses, p.bio, p.social_links,
    p.user_type, p.directory_credentials
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
  'Real Directory candidate feed. Returns only a fixed, display-safe column subset for OTHER discoverable (discoverable = true) profiles, excluding the caller themselves and anyone in a mutual block relationship with them (either direction) — enforced inside this security-definer function, not by the caller or by RLS on profiles. institution is nulled out here (not just hidden client-side) whenever that profile has directory_hide_location = true. The app ranks the returned rows client-side (see app/src/lib/directoryRanking.js) against the caller''s own profile fields (already readable via the normal own-row profiles policy); ranking is a display concern, the privacy boundary is this function.';

revoke all on function public.get_directory_profiles() from public;
grant execute on function public.get_directory_profiles() to authenticated;
revoke execute on function public.get_directory_profiles() from anon;

-- ── 4. peer_endorsements ─────────────────────────────────────────────────────
-- Same shape as blocked_users (20261009140000_chat_blocking.sql): a plain
-- unique-constraint table, not a role/weighting system. `tag` is one of a
-- small fixed set (cosmetic, no reputation score/leaderboard/weighting) —
-- kept in sync with app/src/constants/endorsements.js's ENDORSEMENT_TAGS.
create table public.peer_endorsements (
  id           uuid primary key default gen_random_uuid(),
  endorser_id  uuid references auth.users(id) on delete cascade not null,
  endorsed_id  uuid references auth.users(id) on delete cascade not null,
  tag          text not null check (tag = any (array[
    'Reliable',
    'Great collaborator',
    'Strong communicator',
    'Shows up prepared',
    'Generous with knowledge',
    'Easy to work with'
  ])),
  created_at   timestamptz not null default now(),
  constraint peer_endorsements_unique unique (endorser_id, endorsed_id, tag),
  constraint peer_endorsements_no_self check (endorser_id <> endorsed_id)
);

alter table public.peer_endorsements enable row level security;

create policy "anyone_read_peer_endorsements" on public.peer_endorsements
  for select to authenticated using (true);

create policy "users_insert_own_peer_endorsements" on public.peer_endorsements
  for insert to authenticated with check (auth.uid() = endorser_id);

create policy "users_delete_own_peer_endorsements" on public.peer_endorsements
  for delete to authenticated using (auth.uid() = endorser_id);

comment on table public.peer_endorsements is
  'Peer skill-endorsements shown only on a student''s full Directory profile view, never the compact card/list. One row per (endorser, endorsed, tag) — a user cannot endorse themselves (peer_endorsements_no_self) and cannot give the same tag twice (peer_endorsements_unique). No reputation score, leaderboard, or weighting — this is the raw per-tag record; app/src/screens/StudentProfileScreen.jsx reads aggregate counts via peer_endorsement_counts below.';

-- Aggregate view — same pattern as coach_rating_summary
-- (20260828170001_dashboard_ratings_and_finance_role.sql). Runs with the
-- caller's own privileges (no security definer), which is fine: it only
-- ever surfaces what "anyone_read_peer_endorsements" already allows any
-- authenticated user to read directly.
create or replace view public.peer_endorsement_counts as
  select endorsed_id, tag, count(*)::integer as endorsement_count
  from public.peer_endorsements
  group by endorsed_id, tag;

comment on view public.peer_endorsement_counts is
  'Per-(endorsed user, tag) endorsement counts for the full profile view. Cosmetic counts only — no aggregate score, ranking, or weighting across tags.';
