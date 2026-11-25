# UniBlueprint store listing pack

For the Apple App Store and Google Play. Target launch: 26 December 2026. Last checked against the app on 25 November 2026.

Read this first:

* Store text below follows the product vocabulary. Plain, short sentences. No dashes. No prices.
* **No prices and no Pro in any iOS or Android text.** Pro is sold only on the website. Do not mention plans, trials or prices in the store descriptions, screenshots or app preview. The app itself shows no UniBlueprint prices and no euro amounts for coaches on iOS and Android (founder decision, built in).
* **Only describe what the app does on the day you submit.** A listing must match the app. These are left out on purpose:
  * Priority events and tickets. Hidden until the remote flag `priority_enabled` is on, and its database tables are not applied yet.
  * Foundation (career documents). Do not describe it in the store text. See the founder decision in `store-readiness.md` about hiding it for review (`foundation_visible`).
  * Kobo, ScoutByRohi style "beta" partner tiles and every "coming soon" tile. They are hidden by the remote flag `coming_soon_tiles` (off).
* Awards voting and the Note to your 2027 self need migrations `20261124000000` and `20261124100000` applied first. Their lines are marked below. Remove a line if its migration is not applied on the day you submit.
* The reviewer email is appreview@uniblueprint.ie. `REVIEWER_PASSWORD` is a placeholder. Fill it in yourself when you paste the notes into the consoles. Never commit real credentials.

---

## 1. Names and basics

| Field | Value |
| --- | --- |
| App name (iOS and Android) | UniBlueprint |
| iOS subtitle (30 characters max) | Your course of life, together |
| Subtitle length check | 29 characters |
| Google Play short description (80 characters max) | Share, learn and plan with students, apprentices and workers across Ireland. |
| Primary category (iOS) | Education |
| Secondary category (iOS) | Social Networking |
| Google Play category | Education |
| Google Play tags | Education, Social, Careers |
| Bundle ID and package | com.uniblueprint.app |
| Copyright | UniBlueprint Limited |
| Support URL | https://uniblueprint.ie/contact |
| Privacy policy URL | https://uniblueprint.ie/privacy |
| Terms URL (EULA link) | https://uniblueprint.ie/terms |
| Account deletion URL (Google) | https://uniblueprint.ie/delete-account |
| Marketing URL (optional) | https://uniblueprint.ie |
| Contact email for review and moderation | desmond@uniblueprint.ie |
| Price | Free |
| Countries | Ireland first. Add others later. |
| Digital Services Act (EU) | Declare UniBlueprint Limited as a trader. Apple shows the address, phone and email on the EU page, so use company details you are happy to make public. |

The short description is 76 characters.

---

## 2. Promotional text (iOS, 170 characters max)

```
Your own community across Ireland. Share what is on your mind, plan your week, split a bill, find your people and read the Weekly Blueprint.
```

141 characters. You can change this text any time without a new build.

---

## 3. Keywords (iOS, 100 characters max, comma separated, no spaces)

```
student,apprentice,college,Ireland,campus,community,coaching,deals,budget,calendar,CAO,jobs,tutors
```

99 characters.

---

## 4. Full description (launch version)

Use this for iOS and for the Google Play full description. About 2,300 characters (2,325 with spaces), well under the 4,000 limit. Foundation, Priority, plans and prices are left out on purpose.

```
UniBlueprint is for students, apprentices and young workers across Ireland.

Everyone here is on the same course. Not a degree. A course of life. We are all working toward getting better, together.

COURSE CONNECT
Your nationwide network. Share a Take, a Post, a Clip or a Live moment with people across Ireland. It is the default place for everything you post.

CAMPUS CONNECT
Your own community, in the same situation as you. If you are in college, it is your campus. Apprentices and workers get their own groups, by trade or by industry. Find notes, study groups, rides and events. Check busy spots, share a study room and find a commute buddy.

FRIENDS ONLY
Keep a post between you and the people who follow you back.

LIVE
Share a moment from your day with one tap of the camera. You pick who sees it: Course Connect, Campus Connect or Friends only.

CALENDAR
One calendar for your week. Add your own events and goal dates, bring in a calendar link, and show the calendars on your phone that you choose. The app only reads them, and they stay on your phone.

SPLIT THE BILL
Keep track of shared bills and subscriptions with your friends. Who paid, who is in and who has settled. UniBlueprint never moves money.

AD BOARD
Read the Weekly Blueprint magazine and this week's blogs. Browse jobs, tutors and things for sale from people like you. Post your own listing.

ELEVATION
Find coaches in fitness, academic grinds, finance and marketing. Read their profiles and send a message.

LIFESTYLE
Offers from Irish partners, mental health and wellbeing support, and a budgeting tool built around what life really costs.

EXPLORE
Scholarships, support services, societies and a freshers guide in one place. Write a note to your 2027 self and open it on 1 January.

AWARDS
Read the nominees and vote in the UBP Awards when voting is open.

MESSAGES
Chat with people you connect with. You decide who can message you.

FOR PARENTS
A plain page for a parent or guardian who wants to see what UniBlueprint is.

SAFE BY DESIGN
UniBlueprint is for people aged 18 and over. You can report any post, comment, message, listing or profile, and block anyone, in two taps. Our team reviews reports. Posts are checked for abusive language before they go live.

Light and dark mode both work.

Questions? Visit uniblueprint.ie/contact.
```

Lines to drop if the matching migration is not applied on submission day: `AWARDS` block (migration `20261124000000`) and the sentence about the note to your 2027 self (migration `20261124100000`).

Apple note on Foundation in January: Foundation orders are website only on iOS and Android. If you switch Foundation on in the apps, describe it in one line, with no price and no link to the website.

---

## 5. What's new (version 1.0.0)

```
Welcome to UniBlueprint. Share with Course Connect and Campus Connect, plan your week in the calendar, split a bill with friends and read the Weekly Blueprint.
```

---

## 6. Age rating questionnaires

Minimum age is 18. The app asks for date of birth at sign up and blocks anyone under 18. Terms and Privacy both say 18 and over.

### Apple (age rating questions)

Apple changed this questionnaire in 2025 and may reword it again. Pick the closest answer if a label differs. Then choose 18+ as the final rating.

| Question | Answer |
| --- | --- |
| Final rating | 18+ |
| Parental controls | No |
| Age assurance | Yes. Date of birth at sign up, under 18 is blocked |
| Unrestricted web access | No (links open the phone browser outside the app) |
| User generated content | Yes |
| Messaging and chat between users | Yes |
| Advertising | Yes (UniBlueprint and partner placements on the Ad Board) |
| Medical or treatment information | No |
| Health or wellness topics | Yes (a directory of Irish support services and wellbeing tips, "Not medical advice") |
| Sexual content or nudity | None |
| Violence, realistic or cartoon | None |
| Horror or fear themes | None |
| Profanity or crude humour | None in our content. Member posts are filtered for abusive words |
| Mature or suggestive themes | None |
| Alcohol, tobacco or drug references | None in our content |
| Gambling, simulated gambling, contests | None. The UBP Awards are a free public vote with no prize, so answer No to contests. If the form disagrees, answer Yes and say "free vote, no prize". |
| Made for Kids | No |

### Google Play (IARC content rating and target audience)

| Question | Answer |
| --- | --- |
| Target audience | 18 and over only |
| Contains ads | Yes (UniBlueprint placements and partner ads on the Ad Board and in the feed) |
| Uses the advertising ID | No. The app has no ad network and the permission is blocked in the build |
| User generated content | Yes. Users can post, comment and message. Reporting and blocking are in the app. |
| Users can interact or exchange content | Yes |
| Shares user location with others | No |
| Gambling | No |
| Alcohol, tobacco, drugs | No |
| Violence or sexual content | No |
| Financial features | No payments, loans, trading or crypto in the app. There is a budgeting tool, a split the bill tracker (tracking only, no money moves) and a grants and schemes guide. Pick "None" or the closest "Other" option. No investing product and no financial promotions. The Budgeting investment tab is education with a risk warning and a link to a finance coach. |
| Government app | No |
| Health app | Not a medical app. The Lifestyle section lists helplines and wellbeing tips and says "Not medical advice". Fill the Health apps declaration for the wellbeing content if the form asks. |
| News app | No |

---

## 7. Apple privacy nutrition label

Answer these in App Store Connect under App Privacy. Everything is linked to the person's account. Nothing is used for tracking. Nothing is shared with data brokers or advertisers. This matches `privacyManifests` in `app/app.config.js`. Keep the two in step.

Tracking: **No.** We do not track people across other companies' apps or websites.

| Data type | Collected | Linked to user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact info: Email address | Yes | Yes | No | App functionality |
| Contact info: Name | Yes | Yes | No | App functionality |
| Identifiers: User ID | Yes | Yes | No | App functionality |
| Identifiers: Device ID (push notification token) | Yes | Yes | No | App functionality |
| User content: Photos or videos (profile picture, post photos, clips, Live camera moments) | Yes | Yes | No | App functionality |
| User content: Other user content (posts, comments, listings, profile text, the member's own calendar events and calendar names, award votes, time capsule notes, Live captions) | Yes | Yes | No | App functionality |
| User content: Emails or text messages (chat messages between members) | Yes | Yes | No | App functionality |
| Usage data: Product interaction (which partner cards and offers a member opens) | Yes | Yes | No | App functionality |
| Financial info: Other financial info (budget goals and bill split entries the member types in. Tracking only, no payments) | Yes | Yes | No | App functionality |
| Other data types (date of birth, course, college, trade, industry, interests) | Yes | Yes | No | App functionality |
| Diagnostics: Crash data and other diagnostic data | Only when crash reporting (Sentry) is switched on | Yes | No | App functionality |

Not collected:

* **Location.** Asked only when you tap Find Near Me on the partner map, when the app is open. Read on the phone to sort pins by distance. It is not sent to our servers or stored, so it is not "collected" under Apple's definition. If you ever send it to a server, add Precise location here and in `app/app.config.js`.
* **Phone calendar.** The Calendar can read this phone's calendar after a plain explainer and only for the calendars the person picks (read only). Events are read on the phone each time and are never sent to our servers. Events a member types in, or brings in from a pasted calendar link (.ics, fetched by the phone), are saved to their own account, are private to them, and fall under Other user content above. No reminders access is requested.
* **Camera.** Used only inside Live. The photo the member takes is uploaded as a Live moment (Photos or videos above). No microphone is used.
* Contacts, health and fitness, browsing history, search history, purchases, advertising data, sensitive info.

---

## 8. Google Play data safety

| Question | Answer |
| --- | --- |
| Does the app collect or share user data | Collects. Does not share with third parties for their own use. |
| Is all data encrypted in transit | Yes (HTTPS) |
| Can people ask for their data to be deleted | Yes. In the app: Profile, then Privacy and Data, then Delete account. Account deletion is immediate. |
| Account deletion web page | https://uniblueprint.ie/delete-account |
| Committed to the Play Families policy | Not applicable (18 and over) |

Data types collected. For each one: collected, not shared, required for app functionality, not optional unless noted.

| Google category | Data type | Notes |
| --- | --- | --- |
| Personal info | Name | Account and profile |
| Personal info | Email address | Account and sign in |
| Personal info | User IDs | Account id |
| Personal info | Other info | Date of birth (18+ check), course, college, trade, industry, interests |
| Financial info | Other financial info | Budget goals and bill split entries the member types in. Tracking only |
| Photos and videos | Photos | Profile picture, post and listing photos, Live camera moments |
| Photos and videos | Videos | Clips |
| Messages | Other in-app messages | Chat messages between members |
| Calendar | Calendar events | Events the member types in or brings in from a link are saved to their account. Events read from the phone's own calendar are read on the device only and never sent. Optional |
| App activity | App interactions | Which partner cards and offers a member opens |
| App activity | Other user generated content | Posts, comments, listings, award votes, time capsule notes |
| App info and performance | Crash logs, Diagnostics | Only when crash reporting is switched on |
| Device or other IDs | Device or other IDs | Push notification token |

Not collected: approximate or precise location (read on the device only when the person taps Find Near Me, never sent), health info, contacts, web browsing, audio, files and docs, advertising ID.

Purposes for every item above: App functionality. Crash logs and diagnostics: App functionality and analytics.

---

## 9. Content moderation statement

Use this in the app review notes, in a moderation policy page on the website, and when a reviewer asks about user generated content.

```
UniBlueprint has no tolerance for objectionable content or abusive people.

Filtering. Takes, Posts, Clips, comments, chat messages, listings, board posts and profile text are checked for slurs and strong profanity before they are published, in the app and again in the database.

Reporting. Every place one member's content is shown to others has a Report action: feed posts, clips and takes, Live moments, comments, member profiles, Discover cards, message requests, chat messages and chats, Campus Connect and Course Connect board posts, busy spot, study room and commute buddy posts, Module Q and A, and Ad Board and Marketplace listings. A member picks a reason (Inappropriate content, Spam, Safety concern, Other), confirms, and the report goes to our team. We do not tell the person who reported.

Blocking. Wherever a member is shown, the Report sheet also offers Block. Blocked members cannot message the blocker, and their posts and comments are hidden from the blocker. Blocked members are listed under Profile, Settings, Blocked members, where they can be unblocked.

Review. Reports land in our moderation queue and notify our operations team. We aim to review every report within 24 hours and act within 24 hours of confirming a breach: remove the content, warn, or remove the account.

Contact. Members can contact moderation at desmond@uniblueprint.ie, shown in the app under Profile, Privacy and Data, Contact moderation.

Age. Members must be 18 or older. The sign up date of birth check blocks anyone under 18.

Terms. Section 8.1 of https://uniblueprint.ie/terms is our Community Standards.
```

---

## 10. Reviewer notes

### Apple (App Review Information, Notes)

```
Sign in with this demo account:
Email: appreview@uniblueprint.ie
Password: REVIEWER_PASSWORD
The account is over 18 and verified. Sign in is by email and password only. There is no third party login.

What each tab does:
Home. Your feed of Takes, Posts, Clips and Live moments, your goals and Today's Digest. The search icon opens Explore. The calendar icon opens the Calendar. The bell opens Notifications.
Ad Board. This week's Weekly Blueprint magazine, the latest blogs, Post a listing, and the Marketplace in baskets: Deals, Jobs, Tutors, Buy and sell, and From UBP.
Post (the plus). Opens the composer for a Take, a Post, a Clip or a Live moment. Course Connect is the default audience. You can also pick Campus Connect or Friends only.
Messages. Chats, message requests and Discover (find people).
Profile. Your profile, Privacy and Data, help and sign out.

Payments. UniBlueprint does not sell anything inside the app. Any membership is managed on our website. The app shows no UniBlueprint prices, no euro amounts for coaches and no purchase buttons. Members and partners may show their own prices for real world goods and services, for example a Marketplace listing or a partner deal. Coaching sessions are arranged with the coach directly and are real world services, not digital goods.

User generated content. Members can post, comment and message. To test the safety tools:
1. On Home, tap the flag on any post. Choose a reason, then Send report. The sheet then offers Block.
2. Open any member profile (tap a name in Discover or Messages) and tap Report or block.
3. In a chat, tap the flag next to a message, or press and hold it.
4. Blocked members are listed in Profile, Settings, Blocked members.
5. Reports go to our moderation team. Contact: desmond@uniblueprint.ie.
Posts, comments, messages and listings are filtered for abusive language. Members must be 18 or older (date of birth is checked at sign up). Our Terms (section 8.1) are the Community Standards.

Account deletion. Profile, then Privacy and Data, then Delete account. It deletes the account and personal data straight away. Web page: https://uniblueprint.ie/delete-account

Permissions, all asked only when used:
Location. Only when you tap Find Near Me on the partner map (Lifestyle), while the app is open. It stays on the phone.
Camera. Only inside Live, after a plain screen that says what the camera is for. It takes a photo. The app never records in the background and uses no microphone.
Calendar. Only after you tap Allow and choose calendars in Calendar, Bring in a calendar. It is read only and stays on the phone. You can use the Calendar without it.
Photo library. Through the system picker when you choose a picture or clip.
Notifications. A short question after sign in, with Not now. They are optional.

Split the bill (Explore) only tracks who paid and who has settled. UniBlueprint never holds or moves money.
```

### Google Play (App access, Data safety and Policy notes)

```
App access: all features need a sign in. Use this demo account.
Email: appreview@uniblueprint.ie
Password: REVIEWER_PASSWORD
The account is over 18 and verified. Sign in is by email and password only.

Navigation: five tabs. Home, Ad Board, Post (plus), Messages, Profile. See the Apple notes above for what each does.

Payments policy: the app does not sell digital goods or subscriptions and does not link to a purchase page. It shows no prices for UniBlueprint plans and no euro amounts for coaches. Members and partners show their own prices for real world goods and services. Membership is managed on our website by people who already hold it.

User generated content policy: filtering, report on every item, block, a moderation contact and 24 hour review are all in the app. See the content moderation statement. Report is the flag icon on posts, comments, messages and profiles. Block is offered in the same sheet. Contact: desmond@uniblueprint.ie.

Account deletion: in the app under Profile, then Privacy and Data, then Delete account. Account deletion web page: https://uniblueprint.ie/delete-account

Permissions: location (only when the person taps Find Near Me), read only calendar (only after the person taps Allow and chooses calendars in Calendar, Bring in a calendar), notifications, and the camera (only inside Live, a camera moment posted by members aged 18 or over; the app never records in the background). No microphone permission is requested and the advertising ID is not used. Photos use the system photo picker.
```

If you hide Foundation for review (recommended, see `store-readiness.md`), no Foundation line is needed. If Foundation stays visible, add this to both notes: "Foundation (career documents) shows in the app but cannot be ordered in this version. Orders are not open and there is no price."

---

## 11. Assets and screenshots

### Image assets

| Asset | Size and rules | Status in the repo |
| --- | --- | --- |
| iOS app icon | 1024 x 1024 PNG, no transparency, no rounded corners | Exists: `app/assets/icon.png` (1024 x 1024, RGB, no alpha). EAS puts it in the build. Nothing to upload by hand |
| Google Play icon | 512 x 512 PNG, 32 bit, under 1 MB | Made: `docs/release/store-assets/play-icon-512.png` (a straight downscale of the app icon) |
| Google Play feature graphic | 1024 x 500 PNG or JPG, no transparency | Made: `docs/release/store-assets/feature-graphic-1024x500.png`. It is plain on purpose (navy, UBP mark, name, tagline). Replace it if you commission something better |
| Android adaptive icon | 1024 x 1024 foreground, background `#F5F0E8` | Exists: `app/assets/adaptive-icon.png` (in the build) |
| Splash | `app/assets/splash.png` on navy `#1E3A5F` | Exists (in the build) |
| iPhone screenshots 6.9 inch | 1320 x 2868 (1290 x 2796 is also accepted for the 6.9 inch slot), PNG or JPG, 1 to 10, at least 3 advised | Missing. Take them from the phone. The five images in `public/app-screens` are 786 x 1704 website mockups of an older design. Do not use them |
| Android phone screenshots | PNG or JPG, 2 to 8, each side 320 to 3840 px, and the long side no more than twice the short side | Missing. A 20:9 phone screenshot (for example 1080 x 2400) is too tall, so crop to 1080 x 1920 first |
| Tablet screenshots | Optional. The app is iPhone only (`supportsTablet: false`) | Not needed |
| App preview video | Optional | Skip for version 1 |

### Shot list (same 8 screens for both stores, in this order)

Take them on a real phone with the demo account, in light mode, with real looking seeded content (seeded cards carry the "From UBP" tag). Turn on Do Not Disturb and set the phone clock to 9:41 if you can. Before you start, the screens below must have real content, see `store-readiness.md` section 3.

1. **Home feed.** The Home tab, scrolled to the top, with the header, a Take and a Post or Clip showing.
2. **Composer.** The Post (plus) sheet with Course Connect picked as the audience.
3. **Ad Board.** The Ad Board tab with the Weekly Blueprint magazine at the top and the baskets below.
4. **Campus Connect.** Profile or Home, then Campus Connect, showing the boards and the campus tools (busy spots, study rooms, commute buddy).
5. **Calendar.** The Calendar from the header, Month view, with two or three of your own events added.
6. **Split the bill.** Explore, then Split the bill, with one example bill split between friends.
7. **Messages and Discover.** The Messages tab on Discover.
8. **Safety tools.** The Report sheet open on a post. This one answers the user generated content question before a reviewer asks it.

Optional extras if the store allows more: Live (the viewer, not the camera), Explore, the Weekly Blueprint magazine open at a page.

Never show: prices, plans, Foundation, Priority, Kobo, any "coming soon" row, empty lists, or staff chatter posts. Take the screenshots after the content steps are done.
