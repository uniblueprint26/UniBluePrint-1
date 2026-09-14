-- profiles.interests — the shared, expandable interest-tag system.
--
-- Replaces the journey_stage experiment (see the migration that drops it,
-- 20260915110000_drop_profiles_journey_stage.sql) as the real connecting
-- mechanism the founder actually asked for: "not stages... maybe giving
-- them an expanded version of interests to pick and even add their own."
--
-- Holds a mix of predefined interest labels (see app/src/data/interests.js)
-- and freely-typed custom ones — both are stored the same way, as plain
-- label strings, matching the shape already used by the sign-up flow's
-- user_metadata.interests (see 20260410140346's handle_new_user and
-- SignUpScreen.jsx) so this column becomes the single durable home for the
-- same concept rather than a second, divergent one.
--
-- Deliberately a flat text[] rather than a junction table: interests here
-- are free-text labels (predefined AND user-typed), not foreign keys into a
-- fixed catalogue, so a junction table would need its own text-vs-id
-- indirection for zero relational benefit. A GIN index keeps
-- containment/overlap queries (`interests @> array['...']`, `&&`) fast for
-- both this feature's own matching and Directory's upcoming tag filters
-- (Task #12), which read this exact column via the shared useInterests()
-- hook (app/src/hooks/useInterests.js) rather than duplicating it.
alter table public.profiles
  add column if not exists interests text[] not null default '{}';

create index if not exists profiles_interests_gin_idx
  on public.profiles using gin (interests);

comment on column public.profiles.interests is
  'Shared interest-tag system: a mix of predefined labels (app/src/data/interests.js) and free-typed custom ones, stored identically as plain strings. Primary consumer today is Course Connect (useInterests hook); Directory''s tag filters (Task #12) read the same column. Empty array, not null, means none set yet.';
