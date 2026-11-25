# Store readiness: App Store first, then Google Play

Checked on 25 November 2026 against the branch `claude/website-build-ouh47r`, the live Supabase project `ozpeofkvnpikhopkgcxc` (read only queries) and a real `expo prebuild` and `expo export`. Launch is 26 December 2026. Nothing was submitted, built on EAS or written to the database.

How to read this: **GO** means checked and fine. **FIXED** means I changed it and it is committed. **FOUNDER** means only you can do it. **NO GO** means do not build or submit until it is done.

Companion files: `friday-evening-runbook.md` (the clicks, in order), `store-listing.md` (all the text to paste), `release-checklist.md` (accounts and keys).

---

## 1. The short version

| Question | Answer |
| --- | --- |
| Is the app ready to build on Friday evening? | **Not yet.** One build breaker (the `@xmldom/xmldom` override, item I1) must be fixed first. It is a one line change in `app/package.json`. I was told not to touch that file because another builder is editing it |
| After that, can iOS be built and put on TestFlight on Friday? | Yes, if Apple has finished activating the membership. Everything else on the iOS side is GO or FIXED, or is a founder task |
| Is the app ready for Apple review? | Not until the content (section 3) and the six unapplied migrations (section 5) are sorted. The code and config are in good shape |
| Earliest sensible submission | Tuesday 1 December, after a weekend of TestFlight testing and content. Latest: 8 to 12 December as you planned |

### The three things that can still stop you

1. **I1. The iOS build fails at the "prebuild" step.** `app/package.json` forces `@xmldom/xmldom` to `0.9.12` (the `overrides` block). Expo's plist tool calls the parser in the old way and 0.9.x rejects it with `DOMParser.parseFromString: the provided mimeType "undefined" is not valid`. I reproduced this with `npx expo prebuild --platform ios`, then fixed it by installing `0.8.15` in a throwaway copy, and prebuild passed. EAS runs the same prebuild, so the real build would fail. Fix: in `app/package.json` change `"@xmldom/xmldom": "0.9.12"` to `"@xmldom/xmldom": "0.8.15"`, then run `cd app && npm install --legacy-peer-deps` so the lockfile follows. Then run `npx expo-doctor`. Do this before Friday.
2. **Empty content.** Production has 0 Weekly Blueprint issues, 0 Explore items, 0 Marketplace listings, 0 ads. A reviewer and your screenshots would see empty screens. See section 3.
3. **Time capsule screen needs a migration.** The Explore list shows "Note to your 2027 self" but its table is not in production yet (`20261124100000`). Apply it, or the screen errors for a tester.

---

## 2. Go or no go table

### iOS (App Store)

| # | Item | Status | What I checked, and the evidence |
| --- | --- | --- | --- |
| 1 | Apple Developer Program fee, organisation account | FOUNDER | Approved, you pay at 00:00 Friday 27 November. Activation can take hours, sometimes up to 48 hours. You cannot build for the store or create the app record until it is active |
| 2 | Agreements, Tax and Banking (Free Apps agreement) | FOUNDER | Accept in App Store Connect. The app is free so no bank details are needed |
| 3 | App Store Connect app record | FOUNDER | Name UniBlueprint, bundle ID `com.uniblueprint.app`, language English (Ireland), SKU `uniblueprint`. Steps in the runbook |
| 4 | Bundle ID | GO | `app/app.config.js` has `ios.bundleIdentifier: com.uniblueprint.app`. Generated Info.plist shows `$(PRODUCT_BUNDLE_IDENTIFIER)` which resolves to it |
| 5 | Prebuild produces a valid iOS project | **NO GO until I1** | Fails with the xmldom 0.9.12 override. Passes with 0.8.15 |
| 6 | `npx expo-doctor` | GO | "20/20 checks passed. No issues detected!" |
| 7 | `npx expo export --platform all` | GO | Exported to `scratchpad/sr-export`: iOS Hermes bundle 11 MB, Android Hermes bundle 11 MB, web bundle 8 MB. No errors. One notice: Sentry has no organisation or project set, which is fine when `SENTRY_DISABLE_AUTO_UPLOAD=true` |
| 8 | EAS production profile | GO | `eas.json`: `appVersionSource: remote`, production has `autoIncrement: true`, `environment: production`, Android `app-bundle`. Version 1.0.0, build numbers come from EAS |
| 9 | Production environment variables | FOUNDER | Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. For Android also `GOOGLE_MAPS_ANDROID_API_KEY`. Plus `SENTRY_DISABLE_AUTO_UPLOAD=true` unless you use Sentry. The build stops with a clear message if one is missing |
| 10 | iOS build no longer needs the Android Maps key | FIXED | `app.config.js` demanded `GOOGLE_MAPS_ANDROID_API_KEY` for every production build, so an iOS only build on Friday would have stopped. It now checks it only when EAS says the platform is Android (verified with `EAS_BUILD_PLATFORM=ios` and `android`) |
| 11 | Permission texts (Info.plist) | FIXED | Generated and read from a real prebuild. Photo library, camera (Live only), calendar (read only, both iOS 16 and 17 keys), location when in use. All in plain friendly words and all match what the app does. The location plugin was also writing three generic "Allow UniBlueprint to access your location" texts for Always and motion access, which the app does not use. They are removed now, so only `NSLocationWhenInUseUsageDescription` remains |
| 12 | Microphone | GO | Not used. Plugin settings are `microphonePermission: false`, no microphone text in Info.plist |
| 13 | Export compliance | GO | `ITSAppUsesNonExemptEncryption` is `false` in the generated Info.plist (HTTPS only). Apple will not ask the export question on each build |
| 14 | Privacy manifest (`PrivacyInfo.xcprivacy`) | GO | 12 collected data types, all linked, none for tracking, `NSPrivacyTracking` false. Required reason APIs declared: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1. If Apple emails about another reason after the first upload, add it to `privacyManifests` and rebuild |
| 15 | App icon | GO | `app/assets/icon.png` is 1024 x 1024, RGB, no alpha channel |
| 16 | Splash | GO | `app/assets/splash.png` 722 x 449 on navy `#1E3A5F`, contain |
| 17 | Devices and orientation | GO | iPhone only (`supportsTablet: false`), portrait. No iPad screenshots needed |
| 18 | Scheme and deep links | GO | Scheme `uniblueprint` (and the bundle id as a second scheme). No universal links, so nothing to host on the website |
| 19 | Sign in with Apple | GO, not needed | Login methods in the code: email and password only (`signInWithPassword`, `signUp`). No Google, Facebook or other social login, so guideline 4.8 does not apply |
| 20 | User generated content: report | GO | Report sheet on feed posts, clips, takes, Live moments, comments, profiles, Discover cards, message requests, chat messages, board posts, busy spots, study rooms, commute buddy, Module Q and A, listings, resources (18 files use the shared report sheet). Reports land in `content_reports` |
| 21 | User generated content: block | GO | Block is offered in the same sheet. Blocked members list under Profile, Settings, Blocked members. Chat and Discover blocking is enforced in the database |
| 22 | Filtering | GO | `checkText` runs in the composer, comments, chat, Q and A, study rooms, busy spots, commute buddy, split the bill, time capsule, profile. The database guard `user_text_guard` is live in production (checked) |
| 23 | Terms accepted at sign up | GO | Sign up needs the Terms and Privacy box ticked, records `terms_version` and `privacy_version`. Terms section 8.1 is the Community Standards ("no tolerance for objectionable content or abusive users") |
| 24 | Moderation contact | GO | `desmond@uniblueprint.ie`, shown in Profile, Privacy and Data, Contact moderation |
| 25 | Who reads the reports | FOUNDER | There is no screen for reports. Users with the role founder, operations, legal or moderator can read them with the function `staff_list_content_reports` or in the `content_reports` table in the Supabase dashboard. Apple expects action within 24 hours, so decide who checks daily and put it in the calendar |
| 26 | Account deletion in the app | GO | Profile, Privacy and Data, Delete account. Calls the `delete-account` edge function (deployed in production, same version as the repo). All the new tables (calendar, bill splits, study rooms, resources and others) delete with the account (foreign keys cascade, checked) |
| 27 | Account deletion web page | GO in code, FOUNDER to confirm live | `/delete-account` exists in `src/App.jsx` and `src/pages/legal/DeleteAccountPage.jsx`. Open https://uniblueprint.ie/delete-account in a browser to confirm the site is deployed |
| 28 | Age gate 18 plus | GO | Sign up blocks under 18. The database check `validate_date_of_birth` uses 18 (live). A date of birth is required for new profiles (migration applied). `require_dob_on_signup` is still false in `app_flags`, see the founder list |
| 29 | Notification permission | GO | The app first shows "Stay in the loop?" with Not now or Turn on, then the system prompt. Asked once per account on a device. Never nags |
| 30 | Location | GO | Only when tapping Find Near Me, foreground only, read on the phone and never sent (searched the code: no upload of coordinates) |
| 31 | Camera and calendar | GO | Camera only in Live, after an explainer. Calendar read only, after an explainer, only the calendars the person picks |
| 32 | No purchases and no prices on iOS | FIXED | See section 4. Elevation coach cards, coach profiles, Home Spotlight and the plan line on Profile were leaking euro amounts or trial wording. All now use `NATIVE_NEUTRAL_BILLING` |
| 33 | "Coming soon" copy | GO and FIXED | Everything is behind the remote flag `coming_soon_tiles`, which is `false` in production (checked). Two leaks fixed: Priority example nights in the Campus events board, and the Kobo beta waitlist tile in the Explore strip |
| 34 | Priority | GO (hidden) | `priority_enabled` is off by default, no row in production. Its tables are not applied, which is fine while hidden |
| 35 | Foundation | FOUNDER decision | `foundation_visible` is `true` in production, `foundation_ordering_enabled` is `false`. So reviewers see Foundation with "Ordering opens in January". I recommend hiding it for review: `update public.app_flags set value = 'false'::jsonb, updated_at = now() where key = 'foundation_visible';`. Switch it back on in January. The store text does not mention Foundation either way |
| 36 | Pro and plans | GO | Pro is free for every account until 31 January 2027 (`pro_free_until` is live). Gated screens show a plain status line, no price, no button, no link. The text "Manage your plan on uniblueprint.ie" stays as plain text only |
| 37 | Reviewer account | FOUNDER | `appreview@uniblueprint.ie` exists, email confirmed, age 28, discoverable. It has no subscription row. That is fine until 31 January because Pro is free, but a later re-review would hit Pro gates. Give it a complimentary subscription (SQL in the founder list). Set the real password only in App Store Connect |
| 38 | Partner and brand permissions | FOUNDER | `brand-permissions.md` says "Written proof stored at: To add" for every partner. Apple 5.2 and Google can ask. Store each email or screenshot and fill the column in. Also confirm permission for the other partners and coaches shown in the app (Energie, JMC, Whip Wizardz, Nyz3ditz, The Nail Nurse, Elect, NJOY, Pouvoirs, Zvision, Jordan's Kitchen, Saiemsent, Second Nature, Roomy, every coach photo) |
| 39 | Privacy policy matches the app | FOUNDER and legal | The website Privacy page lists date of birth, location, Expo and Sentry, but I found no mention of calendar events, Live camera moments, award votes, time capsule notes or bill split entries. Add them before submitting, because Apple compares the policy with the privacy label |
| 40 | App Privacy answers | FOUNDER | Paste from `store-listing.md` section 7. Refreshed for calendar, camera, Live, award votes, time capsule, product interaction, financial tracking |
| 41 | Age rating | FOUNDER | Answers in `store-listing.md` section 6. Result: 18+ |
| 42 | DSA trader status | FOUNDER | Required for the EU storefront. Declare UniBlueprint Limited as a trader. Apple shows the address, phone and email publicly |
| 43 | Screenshots 6.9 inch | FOUNDER | None exist in the repo. The images in `public/app-screens` are 786 x 1704 website mockups of an old design. Shot list is in `store-listing.md` section 11 |
| 44 | Release setting | FOUNDER | Choose "Manually release this version" |
| 45 | TestFlight pass on a real iPhone | FOUNDER | Not possible from here. The test list is in `release-checklist.md` section G. Add Live, Calendar, Split the bill and Awards screens to it |

### Android (Google Play)

| # | Item | Status | What I checked, and the evidence |
| --- | --- | --- | --- |
| A1 | Google Play Console, organisation account | FOUNDER | 25 US dollars, D-U-N-S 304929923, identity and phone verification. Can take days. Start it as soon as Apple is paid |
| A2 | Package name | GO | `com.uniblueprint.app` in `app.config.js` |
| A3 | Prebuild and bundle | GO | Android prebuild passes and the Android Hermes bundle exports |
| A4 | Target SDK | GO | Expo SDK 58 with React Native 0.88: target 36, which meets Google's API 36 rule for new apps and updates from 31 August 2026 |
| A5 | Version code | GO | EAS remote versioning with `autoIncrement`. You do not set it by hand |
| A6 | Permissions are minimal | FIXED | Merged manifest now: location (coarse and fine), camera, read calendar, notifications (`POST_NOTIFICATIONS`, newly declared so Android 13 and above can ask), internet, vibrate, and photo read limited to Android 12 and below. Blocked: microphone, write storage, write calendar, `SYSTEM_ALERT_WINDOW` (added by default, not needed), and the advertising ID |
| A7 | Google Maps key | FOUNDER | `GOOGLE_MAPS_ANDROID_API_KEY` as a sensitive EAS variable, restricted to the package and the signing key fingerprints |
| A8 | Push on Android | FOUNDER | Firebase project, `google-services.json` as an EAS file variable `GOOGLE_SERVICES_JSON`, and the FCM V1 service account key uploaded in the Expo dashboard |
| A9 | First upload | FOUNDER | Google does not allow the API to make the very first release. Build with EAS, download the `.aab`, upload it by hand to Internal testing once. After that `eas submit` can work with a service account |
| A10 | Data safety | FOUNDER | Paste from `store-listing.md` section 8 (refreshed) |
| A11 | Content rating, target audience 18 and over | FOUNDER | Answers in `store-listing.md` section 6 |
| A12 | Declarations | FOUNDER | Ads: Yes. Advertising ID: No. Financial features: None (or the closest Other). Health apps: wellbeing content only. Government: No. News: No |
| A13 | Account deletion URL | FOUNDER | Enter https://uniblueprint.ie/delete-account (page exists, confirm it is live) |
| A14 | App access | FOUNDER | Provide the demo account in the notes |
| A15 | Icon 512, feature graphic 1024 x 500 | FIXED | Made and saved in `docs/release/store-assets/`: `play-icon-512.png` and `feature-graphic-1024x500.png`. The graphic is plain (navy, UBP mark, name and tagline). Replace it if you commission a better one |
| A16 | Phone screenshots | FOUNDER | 2 to 8, each side 320 to 3840 px and the long side no more than twice the short side. Crop 20:9 phone shots to 1080 x 1920 |
| A17 | Release setting | FOUNDER | Turn on Managed publishing |
| A18 | Steering wording | FOUNDER decision | "Manage your plan on uniblueprint.ie" plain text on gated screens. Apple has accepted this wording before. Google may read it as steering. If Google objects, remove the line from the Pricing, Profile, Pro gate and Weekly Blueprint screens |

---

## 3. Content that must exist before screenshots and review

Counts from production on 25 November:

| Table | Rows | What it means |
| --- | --- | --- |
| `weekly_issues` | 0 | The Weekly Blueprint magazine, the headline of the Ad Board, has no published issue in the database. Issue 1 is written in `docs/release/weekly-issue-1`. Check what the Weekly Blueprint screen shows on a real phone and load issue 1 |
| `explore_content` | 0 | Every Explore list is empty. The seed is ready in `supabase/seed/explore_content_seed.sql` (see `supabase/seed/README.md`) and has not been run |
| `marketplace_listings` | 0 | The Marketplace baskets are empty (the example tutors carry an "Example" label) |
| `ads` | 0 | No partner placements |
| `feed_posts` | 8 | Staff posts that read like member chatter. Replace or label "Posted by UBP" before screenshots |
| `coach_profiles` | 14 | Real coach rows. Only some are marked verified. The Elevation text no longer says "verified" |

Apple can reject for empty or placeholder features (guideline 2.1 and 4.2). Do the content steps before the screenshots, and re-run these counts on the day you submit.

---

## 4. What I fixed (all committed locally, not pushed)

| Commit | Change |
| --- | --- |
| `9e223a1` | The Campus events board showed Priority example nights with "Time ?" and "venue ?" even with Priority switched off. They now show only when `priority_enabled` is on |
| `6accb39` | **Euro amounts and trial wording on iOS and Android.** Elevation coach cards (they showed "from 50 euro an hour" style prices), coach profiles (price lists and the Prices tab, which on native is now a Rating tab), the Home Spotlight carousel (Foundation "From 10 euro" and coach prices), the Profile plan line ("Try Pro free. Services are half price during the trial") and Compass wording ("No purchase needed" and "Pricing and tool availability"). Web is unchanged. The Elevation "verified coach" claim is now "coach" because only some coaches are verified |
| `f6b6472` | The Kobo beta waitlist tile is now hidden unless `coming_soon_tiles` is on |
| `5d32e78` | Location when in use only, declared `POST_NOTIFICATIONS`, blocked `SYSTEM_ALERT_WINDOW` |
| `3779581` | Blocked the advertising ID permission |
| `3b5a4cd` | An iOS production build no longer needs the Android Maps key |
| (docs) | `store-listing.md` rewritten, `store-readiness.md`, `friday-evening-runbook.md`, `store-assets/` |

### Where euro amounts and purchase wording can still appear on iOS and Android (reviewed, left on purpose)

| Where | Why it stays |
| --- | --- |
| Marketplace, Campus boards and partner deals (member prices, Roomy listing fee, partner deal text) | Prices for real world goods and services set by members or partners, not UniBlueprint prices. Allowed. The reviewer notes say so |
| Budgeting, Home budget stat, Split the bill, SUSI rates | The member's own money tracking and public grant figures. No payment happens |
| Compass | Bundle prices and "Get the Bundle" are hidden on native. The tool cards still open coursecompass.ie in the phone browser. Some of those tools are paid on their site. This is a link out to a third party, usually tolerated. If you want it stricter, hide the "Open on CourseCompass" buttons for the paid tools on native |
| Foundation prices | Not shown on native. Foundation tiers only show where ordering is open and it is not iOS or Android |
| Pricing screen | On native it shows plan names and features with no prices and no buttons |
| Awards and Wrapped | No prices, Pro text or purchase wording found |
| Priority | Hidden. When switched on, tickets are for real world events bought on the website |
| Coach booking link | Kept only for clearly in person Fitness coaches (opens uniblueprint.ie). No amount is shown in the app |

---

## 5. Database and edge functions

Production migration history (from `list_migrations`) shows the release work applied as three batches: `release_batch_1_db_fixes_calendar_live_enum`, `release_batch_2_live_campus_split_core_notifications_resources` and `revoke_new_trigger_functions_pin_dob_fn`. The names do not match the file names, so I confirmed each file by checking its objects exist in production.

| Migration file | Applied in production? | Evidence |
| --- | --- | --- |
| `20261119090000_app_flags`, `new_look_backend` | Yes | tables `app_flags`, `explore_content` exist |
| `20261119100000_content_reports` | Yes | table and staff functions exist |
| `20261119110000_min_age_18` | Yes | in history |
| `20261119120000_priority_ticketing` | **No** | `priority_events`, `priority_orders` and `priority_reserve_tickets` do not exist |
| `20261120000100` to `20261120001100` (campus community, signup data, chat consent, staff reports, text guard, audience policies, DOB, bucket limits, revokes, probe cleanup, flag seeds) | Yes | `compute_campus_community`, `join_chat_counterparty`, `staff_list_content_reports`, `user_text_guard`, `profiles_require_date_of_birth` exist, all public buckets have limits, anon cannot execute `create_notification`, probe table gone |
| `20261120200000_calendar` | Yes | `calendar_events`, `calendars` exist |
| `20261120300000` to `20261120300200` (Live) | Yes | enum value `live`, `feed_posts_live_guard` exist |
| `20261120400000` to `20261120400200` (campus toolkit, ranking, carpool) | Yes | `busy_spot_status`, `study_room_shares`, `campus_ranking` exist |
| `20261120500000_split_the_bill` | Yes | `bill_splits`, `create_bill_split` exist |
| `20261120600000_release_flags` | Yes | `pro_free_until`, `coming_soon_tiles`, `foundation_visible` rows present |
| `20261120700000_pillar_notifications` | Yes | `broadcast_foundation_open`, `notify_followed_post` exist |
| `20261121000000_shared_resources` | Yes | `resource_saves`, `resource_visible` exist |
| `20261121200000_priority_stripe_connect` | **No** | `priority_events.stripe_account_id` does not exist |
| `20261121300000_revoke_new_trigger_functions` | Yes | in history |
| `20261121500000_priority_event_cancelled_status` | **No** | depends on the Priority tables |
| `20261121500100_campus_toolkit_community_and_study_room_notifications` | **No** | `my_institution` does not yet read `campus_community`, and the study room trigger does not yet use `notify_member` |
| `20261124000000_award_votes` | **No** | `award_votes`, `cast_award_vote`, `my_award_votes` do not exist |
| `20261124100000_time_capsule_notes` | **No** | `time_capsule_notes`, `save_time_capsule`, `my_time_capsule` do not exist |

Contract check: I listed every table, view and function name the app calls (`.from`, `.rpc`) and tested them in production. Everything exists except the Priority tables, `cast_award_vote`, `my_award_votes`, `save_time_capsule` and `my_time_capsule`. Those are exactly the unapplied files above.

### Order to apply (timestamp order, the SQL editor or the CLI, one file at a time)

Before the first TestFlight build is tested:

1. `20261121500100` campus toolkit for apprentices and workers (function bodies only, no data changes).
2. `20261124100000` time capsule notes (needed now, the Explore tile is live).
3. `20261124000000` award votes. Safe to apply now. Voting stays closed until you set the two date flags (below).

Only when you decide to switch Priority on (not needed for launch):

4. `20261119120000` Priority ticketing.
5. `20261121200000` Priority Stripe Connect.
6. `20261121500000` Priority cancelled status.
7. Then the steps in `docs/release/priority-ticketing.md`: deploy `create-priority-checkout-session`, redeploy `stripe-webhook` with `--no-verify-jwt`, add the Stripe `charge.refunded` event, set the Stripe Connect account on the event, test one purchase, then set `priority_enabled` to true.

Each file has a header that says what it changes and how to undo it. Re-run `get_advisors` (security) after applying.

### Flags to set

| Flag | Value | When |
| --- | --- | --- |
| `foundation_visible` | `false` | Before submission, if you take my advice (item 35). Back to `true` in January |
| `awards_voting_opens` | `"2026-12-26T00:00:00Z"` | After applying the award migration |
| `awards_voting_closes` | `"2027-01-03T23:59:59Z"` | Same |
| `require_dob_on_signup` | `true` | A day after the website sign up (which collects date of birth) has been live. Not before |
| `coming_soon_tiles` | leave `false` | Until after review |
| `priority_enabled` | leave off | Until Priority is live |

### Edge functions (production list, 23 functions)

| Function | Deployed? | Note |
| --- | --- | --- |
| `delete-account` | Yes, v5 | Matches the repo (last changed 27 September) |
| `generate-application-answers`, `generate-cover-letter`, `generate-cv`, `generate-interview-prep`, `generate-job-search-support`, `generate-linkedin`, `generate-personal-statement`, `generate-portfolio-plan` | Yes | Updated on 22 November |
| `create-foundation-checkout-session`, `refund-foundation-payment`, `create-checkout-session`, `create-portal-session`, `create-coach-checkout-session`, `create-coach-connect-account`, `create-board-listing-checkout-session` | Yes | Website only flows. The app does not open them on iOS and Android |
| `review-cv`, `review-cover-letter`, `send-form-confirmation`, `notify-team-submission`, `sync-mailchimp-subscriber` | Yes | Website and Foundation. Three of them run without JWT checks (known, post launch hardening) |
| `send-push-notification` | Yes | Push |
| `stripe-webhook` | Yes, but old | Deployed 15 October. The repo version (19 November) adds Priority handling. Redeploy only when Priority goes live |
| `create-priority-checkout-session` | **No** | Not needed while Priority is hidden |

---

## 6. Review risks, ranked

1. **Empty screens** (section 3). Highest chance of a 2.1 or 4.2 rejection.
2. **Foundation visible but not orderable** (item 35). Looks like an unfinished feature. One flag fixes it.
3. **Partner and coach permissions** (item 38). Apple 5.2 and Google IP policy can ask for proof.
4. **Privacy policy out of step with the label** (item 39).
5. **Elevation behind a Pro gate after 31 January.** During review Pro is free so reviewers see everything. After that a re-review on an account with no plan hits the gate. Give the reviewer account a complimentary plan.
6. **Investment content in Budgeting.** It is education with a risk warning, and it points to a finance coach. Answer the Google financial features form honestly. Legal should read it once.
7. **Report handling has no screen.** Decide who reads `content_reports` every day, and write the 24 hour rule down.
8. **Time sensitive:** Apple review is slower in the weeks before Christmas. That is why 8 December is the latest sensible date.

---

## 7. What only the founder can do, in order

1. Fix `app/package.json` (the xmldom override, item I1), or ask whoever is editing it to include that one line. Then `npm install --legacy-peer-deps` and `npx expo-doctor`.
2. Pay Apple at 00:00 on Friday 27 November. Follow `friday-evening-runbook.md`.
3. Pay Google at the same time and start the organisation verification (it is slow).
4. Set the EAS production variables (runbook step 6).
5. Apply the three migrations in section 5 and the flag changes.
6. Load content: run the Explore seed, load Weekly Blueprint issue 1, replace the staff feed posts, mark real partners verified.
7. Give the reviewer account a complimentary plan: `insert into public.subscriptions (user_id, tier, status, is_complimentary, complimentary_reason) select id, 'pro_annual', 'active', true, 'App store review account' from auth.users where email = 'appreview@uniblueprint.ie';`
8. Build iOS, test on TestFlight, take screenshots, fill App Store Connect, submit.
9. Fill in the proof column in `brand-permissions.md` and get legal to approve the Privacy and Terms text (including the missing data types).
10. Set up the Google Play side and submit.
11. Decide who reads reports, and book 15 minutes a day for it.

---

## 8. Things I could not verify from here

* Anything that needs a real phone: the Apple and Google pickers, push delivery, maps, the camera in Live, the location prompt, Dynamic Type, offline behaviour.
* Whether https://uniblueprint.ie and its `/delete-account`, `/terms` and `/privacy` pages are the deployed versions of the repo.
* Whether the Stripe, Sentry, Firebase and Maps accounts and keys exist.
* The legal wording of the Terms and Privacy pages.
