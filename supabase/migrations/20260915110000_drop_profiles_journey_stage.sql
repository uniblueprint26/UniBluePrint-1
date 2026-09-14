-- Remove profiles.journey_stage — the "Finding Your Feet / In the Thick of
-- It / At a Crossroads / Wrapping Up" system built in an earlier phase
-- (20260914100000_profiles_journey_stage.sql).
--
-- The founder has explicitly reversed that call: "its not about stages its
-- about maybe giving them an expanded version of interests to pick and even
-- add their own but course connect should just show popular content like
-- campus [Connect]." journey_stage was Course-Connect-only — the column,
-- the useJourneyStage() hook, JourneyStageModal, the "Your Stage" banner,
-- and the stage-grouped "Journey Match" section have all been removed from
-- the app in the same change that adds this migration — so the column is
-- dropped outright rather than left as dead, unread data. The real
-- connecting mechanism going forward is profiles.interests (see
-- 20260915100000_profiles_interests.sql) plus real popularity signal from
-- actual content, not a self-reported life-stage taxonomy.
alter table public.profiles
  drop constraint if exists profiles_journey_stage_check;

alter table public.profiles
  drop column if exists journey_stage;
