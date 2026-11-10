-- Adds a free-typed "custom" endorsement alongside the 6 fixed
-- ENDORSEMENT_TAGS presets on peer_endorsements (20261015140000_directory_
-- credentials_endorsements) — approved scope: ADDITIVE, the 6 presets are
-- untouched and still work exactly as before.
--
-- Shape decision: a special `tag` value ('Custom') + a new nullable
-- `custom_text` column, rather than a second table. This is the
-- minimal-disruption option — peer_endorsement_counts (the aggregate view),
-- the existing RLS policies (anyone_read_peer_endorsements /
-- users_insert_own_peer_endorsements / users_delete_own_peer_endorsements —
-- all keyed off endorser_id/endorsed_id only, never off `tag`) and
-- peer_endorsements_no_self all keep working unchanged for Custom rows with
-- zero duplicated policy logic. app/src/constants/endorsements.js exports
-- CUSTOM_ENDORSEMENT_TAG = 'Custom' to keep the JS and this check constraint
-- in sync, same convention the original migration's own comment asked for.
--
-- The preset "one of each tag per endorser per person" uniqueness
-- (peer_endorsements_unique) deliberately does NOT extend to Custom rows —
-- confirmed against the approved scope ("a custom endorsement probably
-- should NOT be limited to one per endorser... since free text naturally
-- varies"): a viewer writing two different custom notes for the same person
-- is normal, not a duplicate-tag violation. The blanket unique constraint is
-- replaced with a partial unique index that only covers non-Custom tags, so
-- Custom rows are exempt while presets keep the exact same guarantee as
-- before (still enforced at the database level, not just in the app).
--
-- All ALTER-in-place, no DROP TABLE/FUNCTION/VIEW — matching this project's
-- established pattern (see 20261015142944_peer_endorsements_hardening's own
-- comment) that DROP hangs here via the MCP execute_sql/apply_migration
-- tools for objects PostgREST's schema-cache reload watches. Dropping a
-- CHECK/UNIQUE *constraint* (not the table) is unaffected by that and is
-- already used safely by the original migration
-- (profiles_directory_credentials_max3) and is used again below.

alter table public.peer_endorsements
  add column if not exists custom_text text;

-- 1. Widen the fixed tag vocabulary with one special sentinel value meaning
--    "this is a custom endorsement, read custom_text instead of treating
--    `tag` as a display label."
alter table public.peer_endorsements
  drop constraint if exists peer_endorsements_tag_check;
alter table public.peer_endorsements
  add constraint peer_endorsements_tag_check
  check (tag = any (array[
    'Reliable',
    'Great collaborator',
    'Strong communicator',
    'Shows up prepared',
    'Generous with knowledge',
    'Easy to work with',
    'Custom'
  ]));

-- 2. custom_text must be set (non-blank after trimming, length-capped) iff
--    tag = 'Custom', and must be null for every preset row — so a preset row
--    can never carry stray text and a Custom row can never be blank
--    whitespace. 140 chars: longer than MAX_CREDENTIAL_LENGTH (60 — a short
--    label like "BA Business, DCU") since this is a one-line sentence, but
--    well short of MAX_BIO_LENGTH (280 — a paragraph), since an endorsement
--    note is meant to stay a single short line in the UI, not become a mini
--    bio. Enforced here at the database level, not just in the app (same
--    split as every other free-text field in this project).
alter table public.peer_endorsements
  add constraint peer_endorsements_custom_text_shape
  check (
    (tag = 'Custom' and custom_text is not null and length(btrim(custom_text)) > 0 and length(custom_text) <= 140)
    or
    (tag <> 'Custom' and custom_text is null)
  );

-- 3. Preset tags keep the original "one of each per endorser per person"
--    guarantee; Custom rows are exempt (see header). Partial unique index
--    replaces the old blanket unique constraint — same (endorser_id,
--    endorsed_id, tag) shape, just scoped to non-Custom rows.
alter table public.peer_endorsements
  drop constraint if exists peer_endorsements_unique;
create unique index if not exists peer_endorsements_unique_preset_idx
  on public.peer_endorsements (endorser_id, endorsed_id, tag)
  where tag <> 'Custom';

comment on column public.peer_endorsements.custom_text is
  'Free-typed endorsement sentence, set iff tag = ''Custom'' (peer_endorsements_custom_text_shape enforces this, trims, and caps at 140 chars — see this migration''s own comment for why 140). Null for every preset-tag row. Multiple Custom rows from the same endorser to the same person are allowed (peer_endorsements_unique_preset_idx only covers non-Custom tags) since free text naturally varies between endorsements.';

comment on constraint peer_endorsements_tag_check on public.peer_endorsements is
  'tag is one of the 6 fixed preset labels in ENDORSEMENT_TAGS, or the literal sentinel ''Custom'' (app/src/constants/endorsements.js'' CUSTOM_ENDORSEMENT_TAG) marking a free-typed endorsement whose text lives in custom_text. Keep this list in sync with that file.';

comment on table public.peer_endorsements is
  'Peer skill-endorsements shown only on a student''s full Directory profile view, never the compact card/list. One row per (endorser, endorsed, tag) for the 6 preset tags (peer_endorsements_unique_preset_idx) — a user cannot endorse themselves (peer_endorsements_no_self) and cannot give the same preset tag twice. A row with tag = ''Custom'' instead carries a free-typed sentence in custom_text and is exempt from the per-tag uniqueness (see that index''s definition). No reputation score, leaderboard, or weighting — this is the raw per-tag/per-note record; app/src/screens/StudentProfileScreen.jsx reads aggregate preset counts via peer_endorsement_counts and the raw Custom rows directly.';
