-- profiles.journey_stage — the "same situation, same age, same journey"
-- concept Course Connect actually needs to match people on, per the
-- founder's correction: Course Connect was grouping people by what they're
-- doing (course/industry/user_type path), when the real connecting
-- mechanism should be shared life stage, merging across student, apprentice,
-- gap year, and worker rather than siloing by that dimension.
--
-- Deliberately separate from profiles.user_type (which stays as-is, saying
-- *what* someone is doing) and deliberately nullable with NO default —
-- unlike user_type's safe 'student' default, silently guessing someone's
-- life stage would misrepresent them in a matching feature. null means
-- "hasn't said yet"; Course Connect prompts for it rather than assuming.
alter table public.profiles
  add column journey_stage text;

alter table public.profiles
  add constraint profiles_journey_stage_check
  check (journey_stage is null or journey_stage in (
    'finding_feet', 'building_momentum', 'at_a_crossroads', 'wrapping_up'
  ));

comment on column public.profiles.journey_stage is
  'Shared life-stage concept used to match/group people across paths (Course Connect and future features) regardless of user_type. One of: finding_feet, building_momentum, at_a_crossroads, wrapping_up. Nullable — no default, since guessing this would misrepresent the person; null means not yet set.';
