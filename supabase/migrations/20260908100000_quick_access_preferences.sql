-- Home dashboard "Quick Access" customisation (Phase 2).
--
-- Students can pick up to 4 Quick Access shortcuts on the Home dashboard and
-- reorder them. We persist that choice server-side (rather than only on
-- device) so it follows the student across devices/reinstalls, the same way
-- every other piece of profile state does.
--
-- Shape: a simple JSON array of destination keys, in display order, e.g.
--   ["foundation", "my_outputs", "find_coach", "campus"]
-- Null/empty means "no customisation yet" — the client falls back to the
-- built-in default set. Kept deliberately simple (no object-per-item, no
-- extra metadata) since the destination keys are already defined client-side
-- and that's all the UI needs to reconstruct the grid.
alter table public.profiles
  add column if not exists quick_access_preferences jsonb;

comment on column public.profiles.quick_access_preferences is
  'Student''s chosen Home dashboard Quick Access shortcuts, as an ordered JSON array of destination keys (e.g. ["foundation","my_outputs","find_coach","campus"]). Null/empty falls back to the app''s default set.';

-- Keep the column honest: either unset, or a JSON array (of at most 4 keys —
-- enforced client-side same as the rest of the picker's selection limit; the
-- DB constraint only guards the basic shape).
alter table public.profiles
  drop constraint if exists quick_access_preferences_is_array;

alter table public.profiles
  add constraint quick_access_preferences_is_array
  check (quick_access_preferences is null or jsonb_typeof(quick_access_preferences) = 'array');
