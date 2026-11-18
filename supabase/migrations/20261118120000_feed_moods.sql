-- More mood words for the Mood Board picker (founder-approved, 2026-11-18).
--
-- public.feed_mood is a Postgres enum, shared by a Mood Board post's mood and a
-- reaction's mood. New words are added with ADD VALUE. Ids are snake_case,
-- matching the existing ones (flying_it, locked_in, ...). The app list lives in
-- app/src/constants/moods.js and must stay in step with this file.
--
-- Every id the app offers is listed below, grouped as in the Composer, so this
-- file is the complete record of the wanted vocabulary. Values that already
-- exist are no-ops because of "if not exists".
--
-- Not applied by the build. Confirm live, then flip nothing: the app flag
-- NEW_MOODS_ENABLED in constants/moods.js is ON by default and can be set to
-- false to keep the picker to the original words until this has run.
--
-- 'delira' is retired from the pickers but must stay in the enum (Postgres
-- cannot drop an enum value), so existing posts and reactions keep working.
-- The original words (flying_it, locked_in, banjaxed, sound, buzzing) are
-- listed too and are no-ops.
--
-- Note: a value added here cannot be used in the same transaction that adds it.
-- Nothing in this file uses the new values.

-- Feeling great
alter type public.feed_mood add value if not exists 'flying_it';
alter type public.feed_mood add value if not exists 'buzzing';
alter type public.feed_mood add value if not exists 'made_up';
alter type public.feed_mood add value if not exists 'chuffed';
alter type public.feed_mood add value if not exists 'mighty';
alter type public.feed_mood add value if not exists 'over_the_moon';
alter type public.feed_mood add value if not exists 'class';

-- Feeling good
alter type public.feed_mood add value if not exists 'sound';
alter type public.feed_mood add value if not exists 'good_form';
alter type public.feed_mood add value if not exists 'sorted';
alter type public.feed_mood add value if not exists 'delighted';
alter type public.feed_mood add value if not exists 'chilled';
alter type public.feed_mood add value if not exists 'cosy';

-- In between
alter type public.feed_mood add value if not exists 'grand';
alter type public.feed_mood add value if not exists 'not_too_bad';
alter type public.feed_mood add value if not exists 'so_so';
alter type public.feed_mood add value if not exists 'middling';
alter type public.feed_mood add value if not exists 'meh';
alter type public.feed_mood add value if not exists 'fair_enough';
alter type public.feed_mood add value if not exists 'busy';
alter type public.feed_mood add value if not exists 'locked_in';

-- Not great
alter type public.feed_mood add value if not exists 'fed_up';
alter type public.feed_mood add value if not exists 'arsed';
alter type public.feed_mood add value if not exists 'spoofed';
alter type public.feed_mood add value if not exists 'flat';
alter type public.feed_mood add value if not exists 'low';
alter type public.feed_mood add value if not exists 'off_form';
alter type public.feed_mood add value if not exists 'homesick';

-- Worn out
alter type public.feed_mood add value if not exists 'banjaxed';
alter type public.feed_mood add value if not exists 'wrecked';
alter type public.feed_mood add value if not exists 'knackered';
alter type public.feed_mood add value if not exists 'shattered';
alter type public.feed_mood add value if not exists 'drained';
alter type public.feed_mood add value if not exists 'wiped';

-- Rough
alter type public.feed_mood add value if not exists 'stressed';
alter type public.feed_mood add value if not exists 'overwhelmed';
alter type public.feed_mood add value if not exists 'raging';
alter type public.feed_mood add value if not exists 'fuming';
alter type public.feed_mood add value if not exists 'gutted';
alter type public.feed_mood add value if not exists 'mortified';
alter type public.feed_mood add value if not exists 'scundered';

-- Retired from the pickers, kept so old posts and reactions still work.
alter type public.feed_mood add value if not exists 'delira';
