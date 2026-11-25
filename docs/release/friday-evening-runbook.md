# Friday evening runbook: from paying Apple to pressing Submit for Review

For a first time publisher. Do the steps in order. Do not skip ahead. Nothing here is submitted until you press the last button in part 9, and you can stop at any step.

Dates: you pay Apple and Google at 00:00 on Friday 27 November 2026. Aim to submit as soon as the first TestFlight build has been tested, and no later than 8 to 12 December. Launch is 26 December. You choose when to release, so approval never publishes by itself.

Read `store-readiness.md` first. It lists what is ready and what is not.

Words you will see:

* **App Store Connect** (ASC): Apple's website where the app and its listing live. appstoreconnect.apple.com
* **EAS**: Expo's build service. It builds the app in the cloud so you do not need a Mac.
* **TestFlight**: Apple's app for testing a build on a real iPhone before review.
* **Build**: the app file EAS makes. **Submit** (the command) uploads it to Apple. **Submit for Review** (the button) sends it to an Apple reviewer.

Work from the `app/` folder for every `eas` and `npm` command. Replace nothing in the commands except where it says YOUR.

---

## Time plan

| Part | What | Time |
| --- | --- | --- |
| 0 | Before you pay: fix the package file, install tools, sign in to Expo | 20 minutes |
| 1 | Pay Apple and wait for activation | 2 minutes to pay, then hours to 2 days of waiting |
| 2 | Set the EAS variables | 15 minutes |
| 3 | Start the iOS build (it queues) | 10 minutes of your time, 20 to 90 minutes of waiting |
| 4 | While it builds: create the app record and fill the boring forms | 60 minutes |
| 5 | Upload the build to TestFlight and install it | 10 minutes plus 10 to 30 minutes Apple processing |
| 6 | Test on your iPhone and take the screenshots | 60 to 90 minutes |
| 7 | Fill in the App Store listing, App Privacy and age rating | 60 minutes |
| 8 | Reviewer notes and the release setting | 20 minutes |
| 9 | Submit for Review | 5 minutes, then Apple takes about 1 to 3 days |
| 10 | Android, the same journey | about half a day of your time, spread over a few days |

Realistic plan: Friday pay and start the build. Saturday and Sunday test on TestFlight and take screenshots. Monday and Tuesday fix anything, finish content, fill in the listing. Submit Tuesday 1 December if you can, and keep 8 December as your hard limit.

---

## Part 0. Before you pay (do this on Wednesday or Thursday)

1. Fix the package file. In `app/package.json`, in the `overrides` block, change
   `"@xmldom/xmldom": "0.9.12"` to `"@xmldom/xmldom": "0.8.15"`.
   Why: with the old value the iPhone build fails at its first step with an error that mentions `DOMParser.parseFromString` and `mimeType`. This was tested. Ask whoever is editing that file to include the change.
2. Open a terminal in the project, then:
   ```
   cd app
   npm install --legacy-peer-deps
   npx expo-doctor
   ```
   Plain `npm install` fails, so keep `--legacy-peer-deps`. Expo Doctor should say "20/20 checks passed".
3. Sign in to Expo:
   ```
   npx eas-cli login
   npx eas-cli whoami
   ```
   Use the Expo account that owns the project (`uniblueprint`). The project ID is `69a062e2-f045-44c6-aeed-81e557ab3575`. If `whoami` shows your name, you are in.
4. On your iPhone, install the **TestFlight** app from the App Store now. Sign in with the Apple ID you will use for the developer account.
5. Apply the database changes that the app needs (see `store-readiness.md` section 5). At least `20261121500100`, `20261124100000` and `20261124000000`.

---

## Part 1. Pay Apple (00:00 Friday)

1. Go to developer.apple.com/account and sign in as the Account Holder (the person Apple approved for UniBlueprint Limited).
2. If it shows "Complete your purchase", follow it. The fee is 99 US dollars a year (Apple may show the price in euro). Pay with the company card.
3. Wait for the email "Welcome to the Apple Developer Program". It can take a few hours and sometimes up to two days. While you wait, do part 2 and the Google steps in part 10.
4. When it is active, sign in at appstoreconnect.apple.com. You should see Apps, TestFlight and Users and Access. If you only see a message about the program, it is not active yet. Wait.

---

## Part 2. Set the EAS variables (15 minutes)

The build stops on purpose if these are missing. Set them for the `production` environment.

1. Get your Supabase project URL and the public (anon) key from the Supabase dashboard, Project Settings, API. Never use the service role key anywhere in EAS.
2. Run these four commands one by one, with your real values:
   ```
   cd app
   npx eas-cli env:create --environment production --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR-PROJECT.supabase.co" --visibility plaintext
   npx eas-cli env:create --environment production --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --visibility plaintext
   npx eas-cli env:create --environment production --scope project --name SENTRY_DISABLE_AUTO_UPLOAD --value "true" --visibility plaintext
   npx eas-cli env:list --environment production
   ```
   The last command should list the variables. If the command asks a question, read it and press Enter for the default.
3. You do not need the Google Maps key for the iPhone build. It is only needed for Android (part 10).
4. Skip Sentry for the first build unless you have already made a Sentry project. If you have, also set `EXPO_PUBLIC_SENTRY_DSN` and then answer the crash data lines in the privacy forms as "collected".

---

## Part 3. Start the iPhone build (10 minutes, then wait)

1. Run:
   ```
   cd app
   npx eas-cli build --profile production --platform ios
   ```
2. EAS asks questions the first time. Answer like this:
   * "Do you want to log in to your Apple account?" Yes.
   * Apple ID and password: the developer account. Then the 6 digit code Apple sends to your phone.
   * "Select a team": choose UniBlueprint Limited.
   * "Generate a new Apple Distribution Certificate?" Yes.
   * "Generate a new Apple Provisioning Profile?" Yes.
   * "Set up Push Notifications for your project?" Yes. (This makes the push key. Notifications will not work without it.)
   * If it asks to register the bundle identifier `com.uniblueprint.app`, say yes.
3. It uploads the project and gives you a link to a build page on expo.dev. Open it. You will see it waiting in a queue and then building. On the free Expo plan the wait is often 10 to 60 minutes and can be longer. The build itself is about 15 to 30 minutes.
4. Do not close the terminal window if you can avoid it. If you do, the build carries on and you can watch it on the expo.dev link.

If it fails, read the last red lines:

| You see | Do this |
| --- | --- |
| `Production build stopped. These environment variables are missing` | Part 2 was not finished. Set the one it names and build again |
| `DOMParser.parseFromString` or `mimeType` | Part 0 step 1 was not done |
| A Sentry or `sentry-cli` upload error | Set `SENTRY_DISABLE_AUTO_UPLOAD` to `true` (part 2) |
| Apple login or team errors | Wait for Apple to finish activating the membership, then run the same command again |
| Anything else | Copy the "Run fastlane" or the first red error and send it to the tech team |

---

## Part 4. While the build queues: create the app record and the boring forms (60 minutes)

Use the waiting time. None of this needs the build.

1. **Agreements.** In App Store Connect open Business (or "Agreements, Tax, and Banking"). The Free Apps agreement should say Active. If it says "Review", open it and accept as the Account Holder. You do not need bank details for a free app.
2. **Create the app.** Apps, the plus button, New App.
   * Platforms: iOS.
   * Name: UniBlueprint.
   * Primary language: English (Ireland). If it is not listed, choose English (U.K.).
   * Bundle ID: choose `com.uniblueprint.app` from the list. If it is not in the list, the first build has not registered it yet. Wait for the build to start, then refresh.
   * SKU: `uniblueprint` (any word you like, never shown to users).
   * User access: Full Access.
   * Press Create.
3. **Add your testers.** Users and Access, the plus button. Add yourself and anyone who will test. Give them the App Manager or Developer role. They get an email to accept.
4. **App Information** (left menu).
   * Subtitle: `Your course of life, together`.
   * Category: Primary Education, Secondary Social Networking.
   * Content Rights: when it asks if the app has third party content, answer Yes and confirm you have the rights. (Partners and member posts appear in the app. Keep the written permissions on file, see `brand-permissions.md`.)
   * Age rating: press Edit and use the answers in `store-listing.md` section 6. Result must be 18+.
5. **Pricing and Availability.** Price: Free. Availability: Ireland first (add other countries later).
6. **Digital Services Act.** In ASC open Business, Compliance (or the banner that says Digital Services Act). Declare UniBlueprint Limited as a trader. Enter the company address, a phone number and an email. These show publicly on the EU App Store page, so use details you are happy to publish.
7. **Privacy policy URL:** `https://uniblueprint.ie/privacy`. Open the page first and check it loads.
8. **Check the website pages** in a browser: `https://uniblueprint.ie/terms`, `/privacy`, `/contact` and `/delete-account`. All four must load.

---

## Part 5. Upload to TestFlight and install (10 minutes plus waiting)

1. When the EAS build page says "Finished", go back to the terminal and run:
   ```
   cd app
   npx eas-cli submit --platform ios --profile production --latest
   ```
2. Questions it asks the first time:
   * Apple login again (Apple ID, password, code).
   * "Select an app": choose UniBlueprint (this is why you made the record first).
   * "Generate a new App Store Connect API Key?" Yes. EAS keeps it for later submits.
3. It says the upload succeeded. In ASC open the app, then TestFlight. The build shows "Processing". This takes 10 to 30 minutes. You get an email when it is ready.
4. Test group. TestFlight, Internal Testing, the plus button, create a group named Team, tick "Enable automatic distribution", add yourself and your testers. Internal testers see new builds as soon as they finish processing and need no review.
5. On your iPhone open the TestFlight app. UniBlueprint appears. Press Install, then Open.
6. If ASC shows a yellow "Missing Compliance" warning on the build, choose that you use only standard HTTPS encryption (exempt). It should not appear because the app already says so.

---

## Part 6. Test on the phone and take the screenshots (60 to 90 minutes)

### Test pass (30 minutes)

Use the list in `release-checklist.md` section G. In addition check these new things:

* Sign up with a date of birth under 18. It must be blocked. Then sign in as the demo account `appreview@uniblueprint.ie`.
* Calendar from the header: add an event, edit it, delete it. Tap Bring in a calendar, then Allow and choose calendars. You should see a plain explainer first, then the iPhone prompt.
* Live: the camera explainer shows first. Take a shot.
* Explore, Split the bill: make one bill, mark someone settled.
* Explore, Note to your 2027 self: write one and save. (Needs the time capsule migration.)
* Report a post, a comment, a profile and a chat message. Block someone.
* Elevation and the coach profiles: there must be no euro amounts anywhere.
* Look for any price, Pro button, Foundation or "coming soon" text. There should be none.
* Allow notifications and send yourself a test push from expo.dev (Project, Push notifications) if you want to check.
* Delete a throwaway test account from Profile, Privacy and Data.

Write down anything wrong. Fix it, rebuild (part 3), and upload again (part 5). Each new build gets its build number automatically.

### Screenshots (30 to 60 minutes)

Content first. The screens must not be empty. See `store-readiness.md` section 3. The exact 8 screens are in `store-listing.md` section 11.

1. On the iPhone, set it to light mode, turn on Do Not Disturb, and sign in as the demo account.
2. Open each screen from the list. Press the side button and the volume up button together to take the screenshot.
3. Size check. Apple's 6.9 inch slot takes 1320 x 2868 (iPhone 16 Pro Max, 17 Pro Max) or 1290 x 2796 (iPhone 14 Pro Max, 15 Plus and Pro Max, 16 Plus). If your phone is smaller, the screenshots are the wrong size. Borrow a Pro Max, or use the iOS Simulator on a Mac.
4. Send the pictures to your computer with AirDrop or Photos on iCloud.
5. Look at each one. No prices, no empty lists, no staff chatter posts, no notification banners.

---

## Part 7. Fill in the App Store listing (60 minutes)

In ASC open the app, then the version "1.0 Prepare for Submission" in the left menu.

1. **Screenshots:** drag the 6.9 inch images in, in the order from the shot list.
2. **Promotional text, Description, Keywords, Support URL, Marketing URL:** copy from `store-listing.md` sections 1 to 4. Support URL `https://uniblueprint.ie/contact`. Marketing URL `https://uniblueprint.ie`.
3. **What's New:** copy from section 5.
4. **Copyright:** `UniBlueprint Limited`.
5. **App Privacy** (left menu, App Privacy, Get Started).
   * Privacy policy URL: `https://uniblueprint.ie/privacy`.
   * Do you collect data: Yes.
   * Go through the table in `store-listing.md` section 7 one row at a time. For every type choose: linked to the user, not used for tracking, purpose App Functionality.
   * Tracking: No.
   * Press Publish when done. If you ship without Sentry, still tick crash data. It is the safer answer.
6. **Age rating:** it should already read 18+ from part 4.
7. **Build:** scroll to Build, press the plus, and choose the build you tested on TestFlight.
8. **App Review Information.** Sign in required: Yes. Username `appreview@uniblueprint.ie` and the real reviewer password (type it here, never save it in a file). Contact: your name, your phone number and `desmond@uniblueprint.ie`. Notes: paste the Apple block from `store-listing.md` section 10 (this is where you replace `REVIEWER_PASSWORD` if the notes mention it).
9. **Version Release:** choose **Manually release this version**. This is the most important setting. It means Apple's approval never publishes the app by itself. You press the release button on 26 December.
10. **Advertising Identifier (IDFA):** if it asks, answer No.

---

## Part 8. Last checks before you press submit (15 minutes)

* Every box with a red dot or a warning in ASC is filled.
* The build number on the version page is the one you tested.
* The reviewer account still signs in. Try it in the app one more time.
* `https://uniblueprint.ie/delete-account` loads.
* Foundation, Priority, prices: not visible in the app. Check the Foundation decision in `store-readiness.md` item 35.
* Pending: someone is named to read reports every day (Apple expects a 24 hour response).

---

## Part 9. Submit for Review

1. On the version page press **Add for Review**, then **Submit to App Review**.
2. Status changes to Waiting for Review, then In Review, then Pending Developer Release (approved) or Rejected.
3. Apple usually answers in 1 to 3 days. Check the email you used and the App Store Connect app on your phone. Reply to any question the same day.
4. If rejected: do not panic. Read the message, fix it, upload a new build if needed and press submit again. This is normal for a first app. Common first time rejections are a demo account that does not work, empty screens, and a privacy answer that does not match the app.
5. When it says **Pending Developer Release**, do nothing. Wait until 26 December, then press **Release This Version**.

---

## Part 10. Android, the same journey (after the iPhone is submitted, or in parallel while you wait)

The order is the same. The slow part is Google's verification of the organisation, so start it when you pay Apple.

1. **Pay and verify.** play.google.com/console, create a developer account as an Organisation. Pay the one time 25 US dollars. Enter D-U-N-S 304929923 and the company details. Verify your identity and phone. This can take several days.
2. **Maps key.** In Google Cloud (console.cloud.google.com) turn on Maps SDK for Android and create an API key. Restrict it to the package `com.uniblueprint.app` and later to the SHA-1 fingerprints from the Play Console (App integrity) and from `npx eas-cli credentials`.
3. **Push key.** In Firebase (console.firebase.google.com) make a project, add the Android app `com.uniblueprint.app`, and download `google-services.json`. Then in the Expo dashboard open Credentials, Android, and upload the FCM V1 service account key (Firebase, Project settings, Service accounts, Generate new private key).
4. **EAS variables for Android:**
   ```
   cd app
   npx eas-cli env:create --environment production --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value "YOUR_MAPS_KEY" --visibility sensitive
   npx eas-cli env:create --environment production --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive
   ```
   Do not commit `google-services.json`.
5. **Build:**
   ```
   cd app
   npx eas-cli build --profile production --platform android
   ```
   The first time, say yes to "Generate a new Android Keystore". Then back it up: run `npx eas-cli credentials`, Android, and download the keystore to a safe place. The build is about 15 to 25 minutes plus the queue. You get an `.aab` file.
6. **Create the app in Play Console.** Create app, name UniBlueprint, default language English (United Kingdom) or the Irish option if listed, App, Free. Accept the declarations.
7. **First upload by hand.** Google does not allow the first release to come from a script. Testing, Internal testing, Create new release. Accept Play App Signing when asked. Download the `.aab` from the EAS build page and upload it. Name the release `1.0.0`, save, review, start rollout to Internal testing.
8. **Testers.** Internal testing, Testers, create a list with your email addresses. Copy the opt in link, open it on an Android phone, and install from the Play Store link. Run the same test pass as part 6.
9. **Set up the app** (the Dashboard checklist). Copy from `store-listing.md`:
   * Privacy policy: `https://uniblueprint.ie/privacy`.
   * App access: login needed, enter the demo account and the notes (section 10, Google block).
   * Ads: Yes. Advertising ID: No.
   * Content rating questionnaire (section 6).
   * Target audience: 18 and over only.
   * Data safety (section 8) and the deletion URL `https://uniblueprint.ie/delete-account`.
   * Financial features: None. Health apps: wellbeing content only. Government: No. News: No.
   * Store listing: short description, full description (section 4), icon `docs/release/store-assets/play-icon-512.png`, feature graphic `docs/release/store-assets/feature-graphic-1024x500.png`, 2 to 8 phone screenshots (crop to 1080 x 1920).
10. **Managed publishing.** Publishing overview, Managed publishing, turn on. This is the Android version of "manually release". Approval then waits until you press Publish changes on 26 December.
11. **Production release.** Production, Create new release, choose the tested build from the library, Next, Save, Send changes for review. Google review takes from a few hours to a few days. The first review of a new account is often slower.
12. **Later releases.** Once the first one is in, `npx eas-cli submit --platform android --profile production` can upload new builds if you add a Google service account key in the Play Console under API access. You do not need it for version 1.0.0.

---

## Part 11. On 26 December

1. App Store Connect: the app, the version, **Release This Version**.
2. Play Console: Publishing overview, **Publish changes**.
3. Install both from the stores on a clean phone and run a short check: sign up, post, report.
4. Open the awards voting window flags if you have not already (`store-readiness.md` section 5).
5. Check reports in the moderation table that day and every day for the first weeks.

---

## If you get stuck

* Apple Developer Support: developer.apple.com/support (phone and chat for account problems).
* Google Play Console help: the question mark at the top of the console.
* Expo and EAS: docs.expo.dev and the build logs on expo.dev.
* Never paste passwords, the Supabase service role key or the Supabase access token into any chat or file.
