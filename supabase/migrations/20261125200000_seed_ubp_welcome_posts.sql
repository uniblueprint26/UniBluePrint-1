-- Changes: adds eight welcome and how to Takes written by UBP itself (feed_posts rows with user_id null, which the app shows as UniBlueprint with the From UBP stamp): six for Course Connect and two for Campus Connect. Destructive: no (insert only; a post with the same id is left as it is). Undo: delete from public.feed_posts where user_id is null and id::text like 'a5eed000-0000-4000-8000-00000000%';
--
-- Why: before store review the Home feed held only staff posts that read like
-- member chatter. Founder decision of 25 Nov 2026: seed content comes from the
-- official UBP account, labelled, and never from invented people or real team
-- members' names. Real team members will post real content themselves.
--
-- How UBP authorship works in this database (read from the live schema):
--   * feed_posts.user_id is nullable and the read policy "feed_posts: read by
--     audience" lets everyone read a row whose user_id is null, whatever its
--     audience. The app treats user_id null as written by UBP (isFromUBP in
--     app/src/components/feed/FeedKit.jsx): it draws the UBP avatar, the name
--     UniBlueprint and the From UBP stamp, and it hides Report on that card.
--   * author_name is left null on purpose. The trigger set_feed_post_author_name
--     only fills it from a profile when user_id is set.
--   * notify_followed_post returns early when user_id is null, so nothing is
--     sent to anyone when these rows go in.
--
-- Only Takes (post_type 'thread') are seeded. The table check feed_posts_check
-- needs a photo for a Post, a video for a Clip and a camera path for Live, and
-- UBP has no real picture or video to attach. Each Take carries a mood from the
-- existing feed_mood enum. Each body passes public.feed_text_is_clean (the
-- trg_feed_posts_text_guard trigger runs on these inserts too).
--
-- Course Connect posts use audience 'course', Campus Connect posts use
-- 'campus'. No dashes, no prices, no events, no people.
--
-- Idempotent: fixed ids and ON CONFLICT (id) DO NOTHING, so running it again
-- adds nothing. A row someone has edited is not overwritten.
-- Not applied by the build. The founder applies it.

insert into public.feed_posts (id, user_id, post_type, mood, body, audience, author_name, created_at, updated_at)
values
  ('a5eed000-0000-4000-8000-000000000001', null, 'thread', 'chuffed',
   'Welcome to UniBlueprint. This is Course Connect, the national network for everyone on the same journey. You might be a student, an apprentice or at work. Say hello, share what you are working on and be kind to each other.',
   'course', null, now() - interval '1 hour', now() - interval '1 hour'),

  ('a5eed000-0000-4000-8000-000000000002', null, 'thread', 'grand',
   'How to post. Tap the plus on the bottom bar and pick a Take, a Post, a Clip or Live. Course Connect is the default audience, so people across Ireland can see it. You can choose Campus Connect or Friends only before you share.',
   'course', null, now() - interval '2 hours', now() - interval '2 hours'),

  ('a5eed000-0000-4000-8000-000000000003', null, 'thread', 'sorted',
   'What is a Take? It is a short thought with a mood from the mood picker, so people can see how you are really getting on. A Post shares photos, a Clip shares a short video and Live shares a moment from your camera. Pick whichever fits.',
   'course', null, now() - interval '3 hours', now() - interval '3 hours'),

  ('a5eed000-0000-4000-8000-000000000004', null, 'thread', 'good_form',
   'Find something useful in Explore. Tap the search icon on Home to open it. You will find student discounts, support services, societies, volunteering and a freshers checklist. Everything we add is marked From UBP. Know one we missed? You can suggest it.',
   'course', null, now() - interval '4 hours', now() - interval '4 hours'),

  ('a5eed000-0000-4000-8000-000000000005', null, 'thread', 'grand',
   'Keep it kind. Every post, comment, profile and message has a flag so you can report it, and you can block anyone. Everyone here is 18 or over. Our team looks at every report.',
   'course', null, now() - interval '5 hours', now() - interval '5 hours'),

  ('a5eed000-0000-4000-8000-000000000006', null, 'thread', 'chuffed',
   'Calendar tip. Open the calendar icon at the top of Home to keep classes, work and plans in one place. It can show your phone calendar too, but only if you allow it, and it only reads it.',
   'course', null, now() - interval '6 hours', now() - interval '6 hours'),

  ('a5eed000-0000-4000-8000-000000000007', null, 'thread', 'delighted',
   'Welcome to Campus Connect. It is your own community in the same situation. For college students that is your campus. Apprentices and workers get their own version, by trade or industry. Use it to find people near you and see what is happening.',
   'campus', null, now() - interval '7 hours', now() - interval '7 hours'),

  ('a5eed000-0000-4000-8000-000000000008', null, 'thread', 'mighty',
   'On Campus Connect you will find boards for events, study groups, ride shares, lost and found and more. They fill up as members post, so be the first to add something useful.',
   'campus', null, now() - interval '8 hours', now() - interval '8 hours')
on conflict (id) do nothing;
