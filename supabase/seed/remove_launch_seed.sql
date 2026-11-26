-- Removes the launch seed and the review account's test content.
-- NOT a migration: it lives in supabase/seed on purpose so the migration tools never run it.
-- Run it by hand in the Supabase SQL editor, one section at a time, when you want the seed gone.
-- Each section only touches rows the seed migrations wrote. See docs/release/seed-and-reviewer.md.
--
-- Written from 20261125200000_seed_ubp_welcome_posts.sql,
-- 20261125200100_seed_explore_content.sql and 20261125200200_reviewer_account_setup.sql.

-- 1. The welcome and how to Takes written by UBP (user_id is null, ids start a5eed000).
delete from public.feed_posts
where user_id is null
  and id::text like 'a5eed000-0000-4000-8000-00000000%';

-- 2. The Explore lists. Every row UBP wrote has source 'ubp'.
--    Rows members suggested have source 'student' and are not touched.
--    Skip this section if UBP has since added its own real rows that you want to keep.
delete from public.explore_content
where source = 'ubp';

-- 3. The review account's own test content (two Takes and two Example listings).
delete from public.feed_posts
where id in ('a5eed000-0000-4000-8000-0000000000b1', 'a5eed000-0000-4000-8000-0000000000b2');

delete from public.marketplace_listings
where id in ('a5eed000-0000-4000-8000-0000000000c1', 'a5eed000-0000-4000-8000-0000000000c2');

-- 4. The review account's follows. Only run this if you want them gone.
delete from public.student_follows
where follower_id = (select id from auth.users where lower(email) = 'appreview@uniblueprint.ie');

delete from public.partner_follows
where user_id = (select id from auth.users where lower(email) = 'appreview@uniblueprint.ie');

delete from public.coach_follows
where user_id = (select id from auth.users where lower(email) = 'appreview@uniblueprint.ie');

-- 5. The review account's complimentary plan. Leave this until Apple and Google have finished
--    reviewing, because a later re-review needs it. It only removes a complimentary row, never a paid one.
delete from public.subscriptions
where is_complimentary
  and complimentary_reason = 'App store review account'
  and user_id = (select id from auth.users where lower(email) = 'appreview@uniblueprint.ie');

-- 6. To remove the review account entirely, delete it in the Supabase dashboard
--    (Authentication, Users). Everything it owns is removed with it because the foreign keys cascade.
