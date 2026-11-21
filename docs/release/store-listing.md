# UniBlueprint store listing pack

For the Apple App Store and Google Play. Target launch: 26 December 2026.

Read this first:

* Store text below follows the product vocabulary. Plain, short sentences. No dashes. No prices.
* **No prices in any iOS or Android text.** Pro is 6.99 euro a month or 49.99 euro a year, and it is sold only on the website. Do not mention that in the store descriptions, screenshots or app preview.
* **Foundation is hidden in the app at launch** (switch: `app_flags.foundation_enabled`, see the release checklist). A listing must match what the app really does, so the launch description below does not mention Foundation. When you switch it on in January, change the store text to the "From January" version.
* The reviewer email is appreview@uniblueprint.ie. `REVIEWER_PASSWORD` is a placeholder. Fill it in yourself when you paste the notes into the consoles. Never commit real credentials.

---

## 1. Names and basics

| Field | Value |
| --- | --- |
| App name (iOS and Android) | UniBlueprint |
| iOS subtitle (30 characters max) | Your course of life, together |
| Subtitle length check | 29 characters |
| Google Play short description (80 characters max) | Share, learn and save with students, apprentices and workers across Ireland. |
| Primary category (iOS) | Education |
| Secondary category (iOS) | Social Networking |
| Google Play category | Education |
| Google Play tags | Education, Social, Careers |
| Bundle ID and package | com.uniblueprint.app |
| Copyright | UniBlueprint Limited |
| Support URL | https://uniblueprint.ie/contact |
| Privacy policy URL | https://uniblueprint.ie/privacy |
| Terms URL (EULA link) | https://uniblueprint.ie/terms |
| Marketing URL (optional) | https://uniblueprint.ie |
| Contact email for review and moderation | desmond@uniblueprint.ie |
| Price | Free |
| Countries | Ireland first. Add others later. |

The short description is 76 characters.

---

## 2. Promotional text (iOS, 170 characters max)

```
Your own community across Ireland. Share what is on your mind, find your people, learn from coaches, save on deals and keep your money in check.
```

144 characters. You can change this text any time without a new build.

---

## 3. Keywords (iOS, 100 characters max, comma separated, no spaces)

```
student,apprentice,college,Ireland,campus,community,coaching,deals,budget,career,CAO,jobs,tutors
```

96 characters.

---

## 4. Full description (launch version, Foundation hidden)

Use this for iOS and for the Google Play full description on 26 December. About 1,600 characters, well under the 4,000 limit.

```
UniBlueprint is for students, apprentices and young workers across Ireland.

Everyone here is on the same course. Not a degree. A course of life. We are all working toward getting better, together.

COURSE CONNECT
Your nationwide network. Share a Take, a Post or a Clip with people across Ireland. It is the default place for everything you post.

CAMPUS CONNECT
Your own community, in the same situation as you. If you are in college, it is your campus. Apprentices and workers get their own groups, by trade or by industry. Find notes, study groups, rides, societies and more.

FRIENDS ONLY
Keep a post between you and the people who follow you back.

ELEVATION
Find coaches in fitness, academic grinds and marketing. Read their profiles and send a message.

LIFESTYLE
Student deals from Irish partners, mental health and wellbeing support, and a budgeting tool built around what life really costs.

AD BOARD
Read this week's Weekly Blueprint magazine and the latest blogs. Browse jobs, tutors and things for sale from people like you. Post your own listing.

MESSAGES
Chat with people you connect with. You decide who can message you.

EXPLORE
Scholarships, student discounts, support services, societies and a freshers guide, all in one place.

SAFE BY DESIGN
UniBlueprint is for people aged 18 and over. You can report any post, comment, message, listing or profile, and block anyone, in two taps. Our team reviews reports. Posts are checked for abusive language before they go live.

Light and dark mode both work.

Questions? Visit uniblueprint.ie/contact.
```

### 4b. Full description, From January (when Foundation is switched on)

Replace the opening paragraphs of section 4 with these and keep the rest. Add the FOUNDATION block after FRIENDS ONLY.

```
FOUNDATION
Career documents and applications, built with you and checked by a real person before they reach you. CV, cover letter, LinkedIn, personal statement, application forms, interview prep, portfolio and job search support.
```

Apple note: if Foundation can only be ordered on the website, do not tell people in the app or the listing to go to the website to buy it. Describe it, nothing more.

---

## 5. What's new (version 1.0.0)

```
Welcome to UniBlueprint. Share with Course Connect and Campus Connect, find coaches, save on deals and keep your budget in check.
```

---

## 6. Age rating questionnaires

Minimum age is 18. The app asks for date of birth at sign up and blocks anyone under 18.

### Apple (age rating questions)

| Question | Answer |
| --- | --- |
| Age rating you want | 18+ |
| User generated content | Yes |
| Messaging and chat between users | Yes |
| Unrestricted web access | No (links open the browser outside the app) |
| Gambling or contests | No gambling. No contests. |
| Alcohol, tobacco or drug references | No |
| Profanity or crude humour | None in our content. Member posts are filtered for abusive words. |
| Sexual content or nudity | None |
| Violence | None |
| Horror or fear themes | None |
| Medical or wellbeing information | Mental health support directory only (links to Irish support services) |
| Made for Kids | No |

### Google Play (IARC content rating and target audience)

| Question | Answer |
| --- | --- |
| Target audience | 18 and over only |
| Contains ads | Yes (UniBlueprint placements and partner ads on the Ad Board and in the feed) |
| User generated content | Yes. Users can post, comment and message. Reporting and blocking are in the app. |
| Users can interact or exchange content | Yes |
| Shares user location with others | No |
| Gambling | No |
| Alcohol, tobacco, drugs | No |
| Violence or sexual content | No |
| Financial features | No payments, loans, trading or crypto in the app. There is a budgeting tool and a grants and schemes guide, so answer the form honestly: pick the closest "Other" or "Budgeting" option if offered. No investing content and no financial promotions |
| Government app | No |
| Health app | Not a medical app. The Lifestyle section lists helplines and wellbeing tips and says "Not medical advice". Fill the Health apps declaration for the wellbeing content if the form asks |

---

## 7. Apple privacy nutrition label

Answer these in App Store Connect under App Privacy. Everything is linked to the person's account. Nothing is used for tracking. Nothing is shared with data brokers or advertisers.

Tracking: **No.** We do not track people across other companies' apps or websites.

| Data type | Collected | Linked to user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact info: Email address | Yes | Yes | No | App functionality |
| Contact info: Name | Yes | Yes | No | App functionality |
| Identifiers: User ID | Yes | Yes | No | App functionality |
| Identifiers: Device ID (push notification token) | Yes | Yes | No | App functionality |
| User content: Photos or videos | Yes | Yes | No | App functionality |
| User content: Other user content (posts, comments, listings, profile text, the member's own calendar events and calendar names) | Yes | Yes | No | App functionality |
| User content: Emails or text messages (chat messages between members) | Yes | Yes | No | App functionality |
| Other data types (date of birth, course, college, interests) | Yes | Yes | No | App functionality |
| Diagnostics: Crash data | Yes, only when crash reporting is switched on | Yes | No | App functionality |

Not collected:

* **Location.** The app asks for your location only when you tap Find Near Me on the partner map. It is read on the phone to sort pins by distance. It is not sent to our servers or stored, so it is not "collected" under Apple's definition. If you ever send it to a server, add Precise location here and in `app/app.config.js`.
* **Phone calendar.** The Calendar can read this phone's calendar after a plain explainer and only for the calendars the person picks (read only, iOS calendar permission and Android READ_CALENDAR). Events are read on the phone each time and are never sent to our servers, so they are not "collected". The events a member types in, or brings in from a pasted calendar link (.ics, fetched by the phone), are saved to their own account and are private to them. They fall under Other user content above. No reminders access is requested. If you ever upload phone calendar events, add them here and in `app/app.config.js`.
* Financial info, health and fitness, browsing history, search history, contacts, purchases, advertising data, sensitive info.

This matches the privacy manifest in `app/app.config.js`. Keep the two in step.

---

## 8. Google Play data safety

| Question | Answer |
| --- | --- |
| Does the app collect or share user data | Collects. Does not share with third parties for their own use. |
| Is all data encrypted in transit | Yes (HTTPS) |
| Can people ask for their data to be deleted | Yes. In the app: Profile, then Privacy and Data, then Delete account. Account deletion is immediate. |
| Account deletion web page | Add a page or use https://uniblueprint.ie/contact and say how to ask. Google asks for a URL. |
| Committed to the Play Families policy | Not applicable (18 and over) |

Data types collected. For each one: collected, not shared, required for app functionality, not optional unless noted.

| Google category | Data type | Notes |
| --- | --- | --- |
| Personal info | Name | Account and profile |
| Personal info | Email address | Account and sign in |
| Personal info | User IDs | Account id |
| Personal info | Other info | Date of birth (18+ check), course, college, interests |
| Photos and videos | Photos | Profile picture, post and listing photos |
| Photos and videos | Videos | Clips |
| Messages | Other in-app messages | Chat messages between members |
| App activity | Other user generated content | Posts, comments, listings |
| App info and performance | Crash logs | Only when crash reporting is switched on. |
| Device or other IDs | Device or other IDs | Push notification token |

Not collected: approximate or precise location (read on the device only when the person taps Find Near Me, never sent), financial info, health info, contacts, web browsing, audio, files and docs. Calendar: events read from the phone's own calendar are read on the device only and never sent. Events the member adds or brings in from a link are saved to their account and covered by Other user generated content.

Purposes for every item above: App functionality. Crash logs: App functionality and analytics.

---

## 9. Content moderation statement

Use this in the app review notes, in a moderation policy page on the website, and when a reviewer asks about user generated content.

```
UniBlueprint has no tolerance for objectionable content or abusive people.

Filtering. Takes, Posts and Clips are checked for slurs and strong profanity before they are published, in the app and again in the database.

Reporting. Every place one member's content is shown to others has a Report action: feed posts, clips and takes, comments, member profiles, Discover cards, message requests, chat messages and chats, Campus Connect and Course Connect board posts, Module Q and A, and Ad Board and Marketplace listings. A member picks a reason (Inappropriate content, Spam, Safety concern, Other), confirms, and the report goes to our team. We do not tell the person who reported.

Blocking. Wherever a member is shown, the Report sheet also offers Block. Blocked members cannot message the blocker, and their posts and comments are hidden from the blocker.

Review. Reports land in our moderation queue and notify our operations team. We aim to review every report within 24 hours and act within 24 hours of confirming a breach: remove the content, warn, or remove the account.

Contact. Members can contact moderation at desmond@uniblueprint.ie, shown in the app under Profile, Privacy and Data, Contact moderation.

Age. Members must be 18 or older. The sign up date of birth check blocks anyone under 18.
```

Founder to confirm before submission: the website Terms (https://uniblueprint.ie/terms) must say plainly that objectionable content and abusive behaviour are not tolerated. Apple checks for this under guideline 1.2.

---

## 10. Reviewer notes

### Apple (App Review Information, Notes)

```
Sign in with this demo account:
Email: appreview@uniblueprint.ie
Password: REVIEWER_PASSWORD
The account is over 18 and has full access, including Elevation.

What each tab does:
Home. Your feed of Takes, Posts and Clips, the story row (Live, Budget and the pillars), your goals and Today's Digest. The search icon opens Explore. The bell opens Notifications.
Ad Board. This week's Weekly Blueprint magazine, the latest blogs, Post a listing, and the Marketplace in baskets: Deals, Jobs, Tutors, Buy and sell, and From UBP.
Post (the plus). Opens the composer for a Take, a Post or a Clip. Course Connect is the default audience. You can also pick Campus Connect or Friends only.
Messages. Chats, message requests and Discover (find people).
Profile. Your profile, plan status, Privacy and Data, help and sign out.

Payments. UniBlueprint does not sell anything inside the app. Pro membership is managed on our website. The app shows no UniBlueprint prices and has no purchase buttons. Coaches and partners may show their own prices for real world services. Foundation orders are not open in this version and are not shown. Coaching sessions with a coach are arranged with the coach directly and are real world services, not digital goods.

User generated content. Members can post, comment and message. To test the safety tools:
1. On Home, tap the flag on any post. Choose a reason, then Send report. The sheet then offers Block.
2. Open any member profile (tap a name in Discover or Messages) and tap Report or block.
3. In a chat, tap the flag next to a message, or press and hold it.
4. Reports go to our moderation team. Contact: desmond@uniblueprint.ie.
Posts are filtered for abusive language. Members must be 18 or older (date of birth is checked at sign up).

Account deletion. Profile, then Privacy and Data, then Delete account. It deletes the account and personal data straight away.

Location. Asked only when you tap Find Near Me on the partner map (Lifestyle). It stays on the phone.
Calendar. Asked only after you tap Allow and choose calendars in Calendar, Bring in a calendar. It is read only and stays on the phone.
Notifications. Asked after sign in. They are optional.
```

### Google Play (App access, Data safety and Policy notes)

```
App access: all features need a sign in. Use this demo account.
Email: appreview@uniblueprint.ie
Password: REVIEWER_PASSWORD
The account is over 18 and has full access.

Navigation: five tabs. Home, Ad Board, Post (plus), Messages, Profile. See the Apple notes above for what each does.

Payments policy: the app does not sell digital goods or subscriptions and does not link to a purchase page. It shows no prices for UniBlueprint plans. Coaches and partners show their own prices for real world services. Pro is free for every account until 31 January 2027. Pro membership is managed on our website by people who already hold it. Foundation orders are not open in this version.

User generated content policy: filtering, report on every item, block, a moderation contact and 24 hour review are all in the app. See the content moderation statement. Report is the flag icon on posts, comments, messages and profiles. Block is offered in the same sheet. Contact: desmond@uniblueprint.ie.

Account deletion: in the app under Profile, then Privacy and Data, then Delete account. Account deletion web page: see the Data safety form.

Permissions: location (only when the person taps Find Near Me), read only calendar (only after the person taps Allow and chooses calendars in Calendar, Bring in a calendar), notifications, and the camera (only inside Live, a camera moment posted by members aged 18 or over; the app never records in the background). No microphone permission is requested. Photos use the system photo picker.
```

---

## 11. Screenshots

Take them on a real phone with the demo account and real looking seeded content (all seeded cards carry the "From UBP" tag). See the release checklist for sizes. Suggested order:

1. Home feed with the story row.
2. The composer with Course Connect as the audience.
3. Ad Board with the Weekly Blueprint and baskets.
4. Messages, Discover.
5. Explore with partners and pillars.
6. Report sheet open on a post (shows the safety tools).

Do not show prices, a Pro upgrade, Foundation, or any "coming soon" row in a screenshot.
