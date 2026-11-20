# UniBlueprint release checklist

Things the founder does by hand, in order. Target: live on 26 December 2026.

Work backwards. The slow steps are the Apple organisation enrolment (D-U-N-S) and the Google organisation verification. Start both this week.

Work from the `app/` folder for every `eas` and `expo` command.

## A. Accounts (start now, they take days or weeks)

Company details to use on every form, exactly as written:

* Legal name: UniBlueprint Limited
* Company number (CRO): 826545
* Registered office: Ballyhaunis Road, Claremorris, Co. Mayo, F12 V0F9, Ireland
* D-U-N-S: 304929923
* Contact and moderation address: desmond@uniblueprint.ie

1. **D-U-N-S number.** Already issued: 304929923. If Apple or Google says it cannot find it, check that the legal name and address match the CRO record exactly, and use Apple's lookup at developer.apple.com/enroll/duns-lookup to confirm it.
2. **Apple Developer Program, as an organisation (UniBlueprint Limited).** Enrol at developer.apple.com/programs/enroll. Choose Organisation, not Individual. Use D-U-N-S 304929923. You need a work email on the company domain, and the authority to sign for the company. Apple phones to verify. The fee is 99 US dollars a year. The Account Holder must be an owner or senior person.
3. **Google Play Console, as an organisation (UniBlueprint Limited).** Register at play.google.com/console. Choose Organisation. It needs D-U-N-S 304929923, the company website and a one time 25 US dollar fee. Complete the identity and phone verification. Organisation accounts are not held to the personal account rule of 12 testers for 14 days. Check the console in case that has changed.
4. **App Store Connect:** create the app record. Name UniBlueprint, bundle ID `com.uniblueprint.app`, primary language English (Ireland). Fill the Agreements, Tax and Banking section even though the app is free.
5. **Google Play Console:** create the app. Name UniBlueprint, package `com.uniblueprint.app`, free.
6. **Expo account:** the project is owned by `uniblueprint` with ID `69a062e2-f045-44c6-aeed-81e557ab3575`. Run `npx eas-cli login` and check you can see it.

## B. Database (Supabase)

Earlier migrations (the new look backend, moods, text guard) are already applied in production. Only the three below are new and still unapplied. Each is additive and safe to run once: tables use `create table if not exists`, policies are dropped and recreated by name, the app_flags seed row uses `on conflict do nothing`, and the age migration only replaces one function. Apply them in this order through the Supabase dashboard or CLI. The build does not apply them.

1. `supabase/migrations/20261119090000_app_flags.sql` creates `app_flags` with `foundation_enabled = false`. The app hides Foundation on iOS and Android until this is `true`.
2. `supabase/migrations/20261119100000_content_reports.sql` creates `content_reports`. Every Report in the app writes here. The app needs it.
3. `supabase/migrations/20261119110000_min_age_18.sql` raises the database age check (`validate_date_of_birth`, from 20261012120000_profiles_date_of_birth_age_gate.sql) from 16 to 18 for new or changed dates of birth. A null date of birth stays allowed, and existing profiles are not touched.

After applying, check:

* `select * from app_flags;` shows `foundation_enabled` false.
* A signed in test user can insert into `content_reports` as themselves and cannot read another person's report.
* Decide who handles reports. Operations and founder users get a notification for each one. Reports are read in the `content_reports` table until you build a screen for them.

## C. Keys and services

1. **Google Maps key (Android).** In Google Cloud, enable Maps SDK for Android and create an API key. Restrict it to the package `com.uniblueprint.app` and to the SHA 1 fingerprints of your Play app signing key and the EAS upload key. This is `GOOGLE_MAPS_ANDROID_API_KEY`.
2. **Push notifications on Android.** Create a Firebase project, add the Android app `com.uniblueprint.app`, download `google-services.json`, and upload the FCM V1 service account key in the Expo dashboard under Credentials. iOS push is set up for you by EAS when it creates the Apple credentials.
3. **Crash reporting (optional).** Create a Sentry project and take its DSN. If you do not use Sentry, set `SENTRY_DISABLE_AUTO_UPLOAD=true` (below) so the build does not stop on a missing token.
4. **Demo account for the reviewers.** The email is `appreview@uniblueprint.ie`. Check it exists, its date of birth is over 18 and it is verified. Give it full access, including Elevation, the same way you give any complimentary account. The password is the placeholder `REVIEWER_PASSWORD` in `docs/release/store-listing.md`. Replace it only when you paste the notes into the consoles, never commit the real one.

## D. EAS environment variables

The production build stops with a clear error if one of the first three is missing. Set them for the `production` environment.

| Name | Value | Visibility |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | your Supabase project URL | Plain text |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon (public) key | Plain text |
| `GOOGLE_MAPS_ANDROID_API_KEY` | the Maps key from step C1 | Sensitive |
| `GOOGLE_SERVICES_JSON` | the `google-services.json` file | File |
| `EXPO_PUBLIC_SENTRY_DSN` | your Sentry DSN (optional) | Plain text |
| `SENTRY_DISABLE_AUTO_UPLOAD` | `true` (only if you are not using Sentry) | Plain text |

Variables that start with `EXPO_PUBLIC_` are built into the app, so they cannot be secret. Never put the Supabase service role key anywhere in EAS or the app.

Example commands:

```
cd app
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR.supabase.co" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --visibility plaintext
npx eas-cli env:create --environment production --name GOOGLE_MAPS_ANDROID_API_KEY --value "YOUR_MAPS_KEY" --visibility sensitive
npx eas-cli env:create --environment production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive
npx eas-cli env:list --environment production
```

Do not commit `google-services.json`.

## E. Check before you build

1. `cd app && npm install --legacy-peer-deps`
2. `npx expo-doctor` should say 20 of 20 checks passed.
3. Read the open questions in the founder notes at the end of this file and decide each one.
4. Walk the app once in Expo or a dev build with `foundation_enabled` false. Check: no Foundation tile, no Upgrade to Pro button, no prices, Report works on a post, a comment, a profile and a chat message.

## F. Build

1. `cd app && npx eas-cli build --profile production --platform ios`
   * First time: sign in with the Apple account and let EAS manage the certificates and profiles.
2. `npx eas-cli build --profile production --platform android`
   * First time: let EAS create the upload keystore. Back it up with `npx eas-cli credentials`.
   * In Play Console turn on Play App Signing when asked.
3. Or both together: `npx eas-cli build --profile production --platform all`.
4. Version numbers: `version` is 1.0.0 in `app/app.config.js`. EAS adds the build number and version code for you (`autoIncrement`).

## G. Test the real builds

1. **iOS, TestFlight.** `npx eas-cli submit --platform ios --profile production` (or upload with Transporter). Add yourself and your testers as internal testers. Install it on a real iPhone.
2. **Android, Play internal testing.** Upload the `.aab` in Play Console, Testing, Internal testing. Add tester emails. Install it from the Play link on a real phone.
3. Run this test pass on both:
   * Sign up as someone under 18. It must be blocked with a plain message.
   * Sign up as 18 or over. Verify email. Sign in.
   * Post a Mood Board, a Post (photo) and a Clip. Try a swear word. It must be refused.
   * Report a post, a comment, a profile and a chat message. Block a person. Their posts disappear.
   * Check there is no Foundation anywhere, no price and no Upgrade button.
   * Open Find Near Me on a partner map. The location prompt appears only then.
   * Open Calendar from the header. Add an event, edit it, delete it. In Bring in a calendar, paste a public .ics link and check the preview before saving. Choose Allow and choose calendars: the explainer shows first, then the phone prompt.
   * Allow notifications. Send a test push from the Expo push tool.
   * Delete the test account from Profile, Privacy and Data.
   * Turn off the phone's internet. The app should not crash.
4. Fix anything, rebuild, test again.

## H. Store listing

1. Copy text from `docs/release/store-listing.md` into App Store Connect and Play Console.
2. **Screenshots from a real device.** Use the demo account with the seeded content. Do not show prices, Pro, Foundation or any "coming soon" row.
   * iPhone: 6.9 inch (1320 x 2868) is enough, Apple scales for smaller phones. Take 6 or more.
   * Android phone: at least 1080 x 1920, 2 to 8 images. Also a 1024 x 500 feature graphic and the 512 x 512 icon.
3. Fill App Privacy (Apple) and Data safety (Google) from the tables in the listing pack. Fill the age rating and content rating. Set the audience to 18 and over.
4. Paste the reviewer notes. Add the demo account. Add the support, privacy and terms URLs. Add an account deletion URL in Play Console.
5. Check that https://uniblueprint.ie/terms says objectionable content is not tolerated, and https://uniblueprint.ie/privacy lists the same data as the privacy label.
6. Release settings:
   * Apple: choose "Manually release this version".
   * Google: turn on Managed publishing so approval does not publish by itself.

## I. Submit

1. Submit both apps for review no later than about 14 December. Reviews can be slow around the holidays, and a rejection needs time to fix. Check Apple's holiday schedule.
2. Watch for review messages. Reply the same day. If they ask for anything about payments, say the app sells nothing and shows no prices.
3. When both are approved, leave them waiting.

## J. Release on 26 December

1. App Store Connect: press Release This Version.
2. Play Console: Publishing overview, Publish changes.
3. Install both from the stores and run the quick checks again.
4. Check the moderation queue (`content_reports`) that day and every day for the first weeks. Aim to act within 24 hours.
5. Watch Sentry if you turned it on.

## K. In January

1. Open Foundation in the apps: `update public.app_flags set value = 'true'::jsonb, updated_at = now() where key = 'foundation_enabled';` No new release is needed. People get it within about 10 minutes of opening the app.
2. Change the store text to the "From January" description.
3. Remember Foundation orders must stay website only on iOS and Android. The app shows no order button and no link for them.

## Founder notes: decisions before you submit

These are things I found while preparing the release. None of them stops the build.

1. **"Coming soon" rows.** Explore has about 20 rows tagged SOON (for example Grade calculator, Jobs board, Campus Radio), the Kobo partner card says Soon, and a few screens say "coming soon" (Ad Board Deals, My Blueprint Live archive, the Live popup). Apple can reject an app for placeholder features. Hide those rows on iOS and Android before you submit, or accept the risk.
2. **Priority events.** The Priority checkout screen shows a banner: "Demo checkout, this screen will not charge a card". A demo checkout is a placeholder. Hide Priority on iOS and Android, or finish it, before you submit.
3. **Leaving Cert and 5th or 6th year members.** The app has content for people still at school, but the minimum age is now 18. Check that this still makes sense.
4. **Coaching.** The Book a Coach link and prices stay on iOS and Android only for coaches that are clearly in person (Fitness coaches whose category does not say online). Online coaches, trading, marketing and grinds show no price and no booking link, and can be messaged. Confirm that is what you want.
5. **Plan status text.** For people who are not on Pro, iOS and Android show "Manage your plan on uniblueprint.ie" as plain text, with no link. Apple has accepted this wording before. Google may read it as steering. Remove the line from the Pricing, Profile and Pro gate screens if Google objects.
6. **Dark mode.** `userInterfaceStyle` was `light`, which locks iOS to light mode. It is now `automatic` so the Appearance setting works. Change it back in `app/app.config.js` if you want light only.
7. **Chat and feed blocking.** Blocking hides a person's feed posts and comments inside the app, and blocks direct messages in the database. Feed hiding is done in the app, not in the database. A signed in person can still read those posts through the API.
