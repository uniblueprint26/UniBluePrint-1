# Seed content and the reviewer account

Written 26 November 2026 for the Apple and Google review. Nothing here has been applied. Everything below was read from the live Supabase project `ozpeofkvnpikhopkgcxc` with read only queries, and the three migrations were run against a throwaway local Postgres with stub tables (twice each, to prove they are safe to repeat).

Founder rule used throughout: seed content comes from the official UBP account, labelled "From UBP" or "Posted by UBP" (the in app stamp reads From UBP), and never from invented people or real team members' names. Examples are stamped Example. Real team members post real content themselves.

---

## 1. What exists today (production, 26 November 2026)

| Thing | State |
| --- | --- |
| `feed_posts` | 8 rows. All written by staff accounts with their real names (Home shows them as member posts). `user_id` is the author, so they are not labelled |
| `explore_content` | 0 rows |
| `marketplace_listings`, `marketplace_skills` | 0 rows |
| `ads` | 0 rows. `promoted_placements` has 2 rows |
| `weekly_issues` and `weekly_issue_content` | 0 rows |
| `deals` 8 rows, `partners` 28, `coach_profiles` 14, `shared_notes` 34, `campus_pulse_prompts` 20, `clubs_societies` 4 | Present already |
| `time_capsule_notes` | Table exists now (0 rows). `award_votes` does not exist yet (its migration is still unapplied) |
| `app_flags` | `foundation_visible` true, `coming_soon_tiles` false, `pro_free_until` 2027-01-31, `require_dob_on_signup` false |

### How UBP authorship is stored

* **Feed posts.** `feed_posts.user_id` is allowed to be null and the read policy lets every signed in member read a null `user_id` row. The app treats null as UBP (`isFromUBP` in `app/src/components/feed/FeedKit.jsx`): UBP avatar, the name UniBlueprint, the From UBP stamp, and no Report button. No notification is sent for these rows (`notify_followed_post` returns early). `feed_posts_check` means a seeded row can only be a Take (a mood and text). A Post needs a photo, a Clip a video and Live a camera path, and UBP has none of those.
* **Explore.** `explore_content.source = 'ubp'` and `status = 'published'` shows the From UBP tag on every row. Members' suggestions are `source = 'student'`, `status = 'pending'`.
* **Ad Board.** Fixed UBP cards, the five UBP internships and the Example tutors and Example buy and sell cards are written in `app/src/constants/adBoardContent.js` and drawn on the phone. They are never stored, so they show on day one with no database rows. Real rows from the database are shown above them. A stored row counts as UBP when `poster_name` starts with UBP or UniBlueprint.
* **Campus Connect boards and Explore societies** also carry Example cards drawn on the phone (`campusExamples.js`, `exampleSocieties.js`).

### The reviewer account `appreview@uniblueprint.ie`

| Check | Result today |
| --- | --- |
| Exists | Yes. Created 19 November 2026 |
| Email confirmed | Yes |
| Date of birth | 14 May 1998 (28), over 18. The age 18 trigger passes |
| Profile | Name "App Review", `situation` in_college, discoverable. Everything else empty: no institution, course, year, bio, interests, statuses. `onboarding_completed` false |
| Plan | No `subscriptions` row. Fine while Pro is free (to 31 January 2027). A later re-review would hit Pro gates |
| Notifications | One (the welcome notification from the profile trigger) |
| Own posts, follows, listings | None |

`pro_access_gating` (migration `20261012170000`) reads `subscriptions` through `user_has_active_pro()`: status active and no period end or a future one. A complimentary row (`is_complimentary = true`) passes it.

---

## 2. What the seed adds

Three migrations, timestamps 20261125200000 to 20261125200200. All are idempotent.

| File | Adds |
| --- | --- |
| `20261125200000_seed_ubp_welcome_posts.sql` | 8 UBP Takes: 6 for Course Connect (welcome, how to post, what is a Take, Explore, keep it kind, Calendar tip) and 2 for Campus Connect (welcome, what the boards are). No people, prices, events or venues. Text passes the live `feed_text_is_clean` check |
| `20261125200100_seed_explore_content.sql` | 98 Explore rows: 32 societies, 13 student discounts, 18 support services, 8 volunteering roles, 27 freshers checklist items. From `supabase/seed/explore_content_seed.sql`, researched November 2026, sources in `supabase/seed/README.md`. Left out on purpose: 28 scholarships rows (no screen reads them, the Scholarships screen is a written guide) and 6 "Example:" societies (the app draws its own) |
| `20261125200200_reviewer_account_setup.sql` | The reviewer account only: complimentary Pro, a filled in profile, follows (up to 3 team accounts, 2 verified partners, 1 verified coach), 2 own Takes starting "Test member post", 2 own listings titled "Example". Needs the account to exist. If it does not, it prints a notice and does nothing |

The Explore migration and the older seed file overlap. Run the migration, not the old file.

### Decisions you may want to change

* **No rows for `ads` or the Marketplace tables.** The Ad Board already shows UBP cards and Example tutors and listings from the phone, so the baskets are not empty. A stored `ads` row is drawn as a real partner advert in the Weekly Blueprint with no Example stamp, so a fake one would mislead. Marketplace rows need a real owner (`user_id` is required), and UBP has no account row, so the only stored examples are the two that belong to the reviewer account, titled Example.
* **No Weekly Blueprint issue.** Issue 1 is editorial (the Wrapped pages are still being assembled in `docs/release/weekly-issue-1`). The screen already builds itself from fixed content and leaves out empty slots. Publish issue 1 when it is ready.
* **The 8 existing staff posts are untouched.** They show real team members' names and read like member chatter (one says "50th partner deal"). Home mixes UBP posts and member posts one for one, so reviewers will see both. If you do not want them, delete them from `feed_posts` where `user_id` is one of the staff ids, or ask each person to delete their own.
* **Explore facts change.** Fees, dates and phone numbers were checked in November. Open the source pages in `supabase/seed/README.md` again on the day you submit. Every row already says to confirm on the official page.
* **Compound hyphens** such as full-time and third-level are left in the Explore text. There are no em dashes, en dashes or spaced dashes.

---

## 3. What stays empty on purpose

Each of these gets an honest empty state or an on phone Example card. Do not fill them with invented data.

| Screen | Why |
| --- | --- |
| Busy spots, Study room sharer, Commute buddy | Members report what is really busy or free. Fake reports would be false information |
| Campus Connect boards (events, ride shares, lost and found, study groups, accommodation, conversations) | Member posts only. Example cards are drawn on the phone and stamped Example |
| Calendar events, Split the bill, Time capsule, Budget entries | Personal to the member. The reviewer adds their own while testing |
| Live rail and Live archive | Live is a photo from the member's own camera |
| Messages and message requests | Needs a second real person. Reviewers can use Discover to see real, discoverable members |
| Awards voting | Closed until the two date flags are set after 26 December |
| Weekly Blueprint issue and Ireland Wrapped | Editorial, see above |
| Ad Board paid ads, Marketplace baskets beyond the Examples | Real listings come from real members and partners |
| Priority tickets | Hidden by `priority_enabled` |

---

## 4. Reviewer account: steps for the founder

The password is never written in this repository. Choose it yourself and keep it only in the password manager and in App Store Connect and Play Console.

1. Confirm the account exists. In the Supabase dashboard go to Authentication, Users and search `appreview@uniblueprint.ie`. It should show a confirmed email. If it is missing, choose Add user, enter the email and a strong password, and tick Auto Confirm User.
2. Set or reset the password in the same place (the user's menu, Send password recovery, or Update password). Put the same password in App Store Connect (App Review Information, Sign in required) and in Play Console (App access). The notes in `store-listing.md` use the placeholder `REVIEWER_PASSWORD`.
3. Apply `20261125200200_reviewer_account_setup.sql` (see the order below).
4. Check it worked with these read only queries:

```sql
select s.tier, s.status, s.is_complimentary, s.current_period_end
from public.subscriptions s join auth.users u on u.id = s.user_id
where lower(u.email) = 'appreview@uniblueprint.ie';
-- expect pro_annual, active, true, null

select full_name, date_of_birth, institution, campus_community, course, interests, statuses, discoverable
from public.profiles where id = (select id from auth.users where lower(email) = 'appreview@uniblueprint.ie');
-- expect App Review, 1998-05-14, University of Limerick, University of Limerick, Computing, three interests, two statuses, true

select
  (select count(*) from public.student_follows where follower_id = u.id) as people_followed,
  (select count(*) from public.partner_follows where user_id = u.id) as partners_followed,
  (select count(*) from public.coach_follows where user_id = u.id) as coaches_followed,
  (select count(*) from public.feed_posts where user_id = u.id) as own_takes,
  (select count(*) from public.marketplace_listings where user_id = u.id) as own_listings
from auth.users u where lower(u.email) = 'appreview@uniblueprint.ie';
-- expect up to 3, 2, 1, 2, 2
```

5. Sign in as the account on a TestFlight build and open every tab. Check Home (UBP Takes and the two test member Takes), Explore (all five lists), Ad Board, Profile (plan line, interests, bio), Calendar, Notifications, and a Pro gated screen such as Elevation.
6. Optional but recommended: set `foundation_visible` to false before submission (see `store-readiness.md`, item 35).
7. After both stores approve, keep the account and its complimentary plan until the next review window has passed.

The account is labelled as a test member through its bio ("Test account for app store review. Not a real member."), its two Takes ("Test member post.") and its two listings (titled "Example", poster name "Test member"). Its posts use Course Connect only, and its campus is one nobody else is on, so it never reads or writes into a real campus.

The follows are real team accounts chosen by role (founder, outreach, marketing, finance, tech or legal), oldest first. They get no notification. If you would rather not follow anyone, delete those rows with section 4 of `supabase/seed/remove_launch_seed.sql`.

---

## 5. Order to apply

One file at a time in the Supabase SQL editor, or with the CLI. Each has its own header with Changes, Destructive and Undo.

1. Confirm the reviewer account exists and its email is confirmed (section 4, steps 1 and 2).
2. `20261125200000_seed_ubp_welcome_posts.sql`
3. `20261125200100_seed_explore_content.sql`
4. `20261125200200_reviewer_account_setup.sql`
5. Run the check queries in section 4, and the counts: `select count(*) from public.explore_content;` should be 98, and `select count(*) from public.feed_posts;` should be 18 (8 staff, 8 UBP, 2 reviewer).

The other unapplied release migrations (`20261121500100`, `20261124000000`, and Priority if you want it) are independent. Order and notes are in `store-readiness.md`, section 5. `time_capsule_notes` already exists in production.

---

## 6. Removing it later

Use `supabase/seed/remove_launch_seed.sql`. It is a plain script kept outside the migrations folder so no tool runs it by accident. It has one section for each part:

1. The UBP welcome Takes: `feed_posts` where `user_id` is null and the id starts `a5eed000-0000-4000-8000-00000000`.
2. The Explore rows: `explore_content` where `source = 'ubp'`. Members' suggestions are not touched.
3. The reviewer's two Takes and two Example listings, by their fixed ids.
4. The reviewer's follows.
5. The reviewer's complimentary plan (only that exact complimentary row, never a paid one).
6. Deleting the account itself (dashboard only).

Real team members' own posts are never touched by any of this.

---

## 7. Not checked

* I did not re-open the Explore source pages. They were checked in November by the earlier seed work.
* I could not sign in as the reviewer or open any screen. The app side was read from code. Do step 5 of section 4 on a real build.
* The Weekly Blueprint screen with no issue was read from code only.
