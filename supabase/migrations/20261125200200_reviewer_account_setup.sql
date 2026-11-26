-- Changes: fills in the app review test account appreview@uniblueprint.ie so every screen has data: a complimentary Pro subscription, a filled in profile (campus, course, interests, bio), a few follows, two own Takes and two own Example listings, all labelled as a test member. It does NOT create the account, set or touch any password, or change auth.users. Destructive: no for other members (it only writes rows for this one account; its profile columns are overwritten with the values below; a subscription that Stripe manages is left alone). Undo: see docs/release/seed-and-reviewer.md, section "Removing it later" (delete the account's rows listed there).
--
-- The account itself must already exist. It does (checked 25 Nov 2026): created
-- 19 Nov 2026, email confirmed, date of birth 14 May 1998 (over 18), profile
-- created by the signup trigger. If the account is missing this file does
-- nothing except print a notice. Create the account first in the Supabase
-- dashboard (Authentication, Users, Add user, tick Auto Confirm User) and set
-- the password there. The password is never written in this repository.
--
-- What it sets, and why:
--   * subscriptions: tier pro_annual, status active, is_complimentary true,
--     no period end. public.has_active_pro() and user_has_active_pro() read
--     status = 'active' and an empty or future current_period_end, so this
--     passes every Pro gate (Elevation booking and others) even after the free
--     Pro window ends on 31 Jan 2027. Pro gating is described in
--     20261012170000_pro_access_gating.sql. If the row is already a real Stripe
--     subscription (stripe_subscription_id is set) it is left alone.
--   * profiles: situation in_college, user_type student, institution University
--     of Limerick (a name from app/src/data/institutions.js; no other member is
--     on that campus today, so the reviewer does not read anyone's campus
--     content), course, year, bio, interests, statuses, discoverable true, and
--     onboarding_completed true. campus_community is filled by the existing
--     trigger profiles_set_campus_community. date_of_birth is not changed.
--     The name stays "App Review". The bio says it is a test account.
--   * student_follows: the account follows up to three team accounts that hold
--     a team role (founder, outreach, marketing, finance, tech or legal) and
--     are discoverable, oldest first. Following sends nobody a notification.
--     partner_follows: two verified active partners. coach_follows: one
--     verified coach. All three are real, existing rows.
--   * feed_posts: two Takes by the account, audience course (so nobody on a
--     campus sees them), each starting "Test member post."
--   * marketplace_listings: two listings by the account, each titled Example,
--     with no price, so Buy and sell has rows that belong to the account and
--     the manage and delete screens can be tried. The Ad Board also shows its
--     own Example cards that are drawn on the phone and never stored.
--
-- Idempotent: fixed ids with ON CONFLICT DO NOTHING for posts and listings,
-- follows skip existing pairs, the profile and subscription are set to the same
-- values every time. Safe to run more than once. Not applied by the build. The
-- founder applies it.

do $$
declare
  uid uuid;
  confirmed timestamptz;
begin
  select id, email_confirmed_at into uid, confirmed
    from auth.users where lower(email) = 'appreview@uniblueprint.ie';

  if uid is null then
    raise notice 'appreview@uniblueprint.ie does not exist. Create it in the Supabase dashboard first, then run this file again. Nothing was changed.';
    return;
  end if;

  if confirmed is null then
    raise notice 'appreview@uniblueprint.ie exists but its email is not confirmed. Confirm it in the Supabase dashboard (Authentication, Users). Carrying on with the rest.';
  end if;

  -- Complimentary Pro, unless a real Stripe subscription is already there.
  insert into public.subscriptions (user_id, tier, status, is_complimentary, complimentary_reason, current_period_end)
  values (uid, 'pro_annual', 'active', true, 'App store review account', null)
  on conflict (user_id) do update
    set tier = excluded.tier,
        status = 'active',
        is_complimentary = true,
        complimentary_reason = excluded.complimentary_reason,
        current_period_end = null,
        complimentary_paused_at = null,
        updated_at = now()
    where public.subscriptions.stripe_subscription_id is null;

  -- Profile with something on every screen. Date of birth is left as it is.
  update public.profiles set
    user_type = 'student',
    situation = 'in_college',
    institution = 'University of Limerick',
    university_or_field = 'University of Limerick',
    course = 'Computing',
    year_of_study = '2nd year',
    bio = 'Test account for app store review. Not a real member.',
    interests = array['Software Dev', 'Finance', 'Marketing']::text[],
    statuses = array['open', 'study']::text[],
    discoverable = true,
    onboarding_completed = true,
    onboarding_step = 5,
    updated_at = now()
  where id = uid;

  -- Follows: up to three team accounts, two partners, one coach.
  insert into public.student_follows (follower_id, followed_id)
  select uid, t.id
  from (
    select p.id
    from public.profiles p
    where p.id <> uid
      and p.discoverable
      and exists (
        select 1 from public.user_roles r
        where r.user_id = p.id
          and r.role::text in ('founder', 'outreach', 'marketing', 'finance', 'tech', 'legal'))
    order by p.created_at, p.id
    limit 3
  ) t
  on conflict do nothing;

  insert into public.partner_follows (user_id, partner_id)
  select uid, pt.id
  from (
    select id from public.partners
    where verified is true and active is not false
    order by created_at, id
    limit 2
  ) pt
  on conflict do nothing;

  insert into public.coach_follows (user_id, coach_profile_id)
  select uid, c.id
  from (
    select id from public.coach_profiles
    where verified is true
    order by created_at, id
    limit 1
  ) c
  on conflict do nothing;

  -- Two own Takes, labelled as a test member. Audience course only.
  insert into public.feed_posts (id, user_id, post_type, mood, body, audience, created_at, updated_at)
  values
    ('a5eed000-0000-4000-8000-0000000000b1', uid, 'thread', 'grand',
     'Test member post. This account is used by app store reviewers to look around UniBlueprint. It is not a real person.',
     'course', now() - interval '30 minutes', now() - interval '30 minutes'),
    ('a5eed000-0000-4000-8000-0000000000b2', uid, 'thread', 'sorted',
     'Test member post. This is a second Take so the feed, reactions and comments can be tried.',
     'course', now() - interval '90 minutes', now() - interval '90 minutes')
  on conflict (id) do nothing;

  -- Two own Example listings. No price. The text says plainly they are examples.
  insert into public.marketplace_listings
    (id, user_id, poster_name, listing_type, title, category, description, condition, price, contact_method, status, created_at)
  values
    ('a5eed000-0000-4000-8000-0000000000c1', uid, 'Test member', 'For sale',
     'Example: first year textbooks', 'Textbooks & Notes',
     'Example listing from the test account. It is not a real item and nothing is for sale.',
     'Good', null, 'In app chat', 'active', now() - interval '1 hour'),
    ('a5eed000-0000-4000-8000-0000000000c2', uid, 'Test member', 'Wanted',
     'Example: looking for a desk lamp', 'Furniture',
     'Example listing from the test account. It is not a real request.',
     null, null, 'In app chat', 'active', now() - interval '2 hours')
  on conflict (id) do nothing;
end
$$;
