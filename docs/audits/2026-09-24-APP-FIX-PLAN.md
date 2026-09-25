# UniBlueprint App — Audit & Fix Plan (2026-09-24)

Scope: the **mobile app only** (`app/`). Website not audited.
Method: every screen was rendered at iPhone size (390×844) and screenshotted (45+ screens, signed-out, student, and founder/ops/coach/partner role views). Every screen file was then code-read by two auditors. Every table, RPC and Edge Function the app calls was checked against the live Supabase project (`ozpeofkvnpikhopkgcxc`) with read-only queries.

Totals: **~270 findings**. 7 are P0, ~80 are P1, and the rest are P2/P3 polish.
The full per-screen detail, with file:line and a suggested fix for each finding, is in:
- `2026-09-24-app-core-findings.md` covers the shell, navigation, auth and all top-level screens.
- `2026-09-24-app-builders-findings.md` covers the Foundation builders, Evidence Bank, Studio and Portals.

This file is the **ordered fix plan**. Work top to bottom.

---

## 0. The headline: the backend the app needs isn't live

Live state as of today:

| What | Live? |
|---|---|
| 9 Foundation tables (`cv_documents`, `cover_letters`, `application_forms`, `interview_prep_packs`, `job_search_sessions`, `linkedin_documents`, `personal_statements`, `portfolio_plans`, `evidence_bank_stories`) | **Missing.** They exist only as local migration files. |
| `submit_document_for_review` RPC, plus the `submissions.document_table/document_id/turnaround_deadline` columns | **Missing** |
| `project_collaborations.project_type` column (Campus Connect "Project Collaboration" posts) | **Missing**, so posting fails |
| Edge Functions | Only `create-checkout-session` and `delete-account` are deployed. **16 are not deployed:** 8× `generate-*`, `review-cv`, `review-cover-letter`, `stripe-webhook`, `create-portal-session`, `notify-team-submission`, `send-form-confirmation`, `sync-mailchimp-subscriber`, and `_shared` deps |
| Live data | 11 users, 0 subscriptions, 0 submissions, 1 role row |

What this means for users:
- **Every Foundation builder fails at submit.** The student gets through up to 15 steps, taps Submit, sees a raw DB error, and loses their answers.
- **Evidence Bank** silently shows as empty.
- **Anyone who pays on the website never becomes Pro**, because `stripe-webhook` isn't deployed.
- Nobody has been harmed yet (0 subscriptions and 0 submissions), but none of this can go live as-is.

This is the practical face of **#53 (migration drift)**. The fix has two steps:
1. Finish #53: reconcile the 27 live-only and 76 local-only migrations.
2. Apply the Foundation migrations (`20260723233000` → `20260730090000`, plus `20260914090000`, `20260915130000`) and deploy all 16 functions, with their secrets set (Stripe webhook secret, AI provider key, Resend key).

**Do not run a blind `supabase db push`.** Until then, hide the builder entry points behind a flag.

---

## 1. P0 — must fix before any store submission

| # | Issue | Where | Fix |
|---|---|---|---|
| P0-1 | Backend missing (section 0) | all builders, Evidence Bank, Pricing | #53, then apply migrations and deploy functions |
| P0-2 | **iOS App Store 3.1.1.** Buying Pro/Premium opens the website. Also: "payment is handled on the website, never in the app" copy, the Deal Room "Upgrade to Pro", and Course Compass €49.99/€90 "Get the Bundle" links | `PricingScreen.jsx:79-81,157,182,198`, `ProfileScreen.jsx:672-683`, `WeeklyBlueprintScreen.jsx:165-168`, `CompassScreen.jsx:339-361` | Short term: on `Platform.OS === 'ios'`, hide all purchase CTAs, prices and steering copy, and show plan status only. Long term: IAP (RevenueCat), or Apple's EU External Purchase Link entitlement. **Decision needed (D1).** |
| P0-3 | **"Anonymous" posts aren't anonymous.** `poster_name` and `user_id` are stored, and all 4 board tables have `SELECT true` for every signed-in user, so the author can be read via the API. Verified live. | `PostFormModal.jsx:205-210`, `BoardDetailScreen.jsx:171`; tables `campus_conversations`, `problems_posts`, `college_reviews`, `campus_suggestions` | Don't store `poster_name` when anonymous. Serve these tables through a view/RPC that nulls `user_id`/`poster_name` for anonymous rows, and revoke direct SELECT. |
| P0-4 | **Foundation has no payment step.** Standard and Premium can be submitted free; `submissions.paid` is never set. | every builder's `handleComplete`; `submit_document_for_review` | Take payment before queueing, and have the RPC refuse unpaid rows. **Decision needed (D1).** |
| P0-5 | **Profile says "Free Member" + "Upgrade" to everyone**, including paying Pro users. Home Overview also shows paid users as "Standard". | `ProfileScreen.jsx:670`, `CondensedDashboard.jsx:160` | Read `isPro`/`subscription.tier` from AuthContext. |

## 2. P1 — broken or wrong, fix in the same release

### 2a. Navigation & shell
- **Every deep link lands on Home.** `linking.js` is missing the Drawer's `MainTabs` level. The fix is verified in a scratch build: wrap the tab config in `MainTabs: { screens: {...} }`. This also fixes the website's "Open the App" post-checkout handoff.
- **"My Blueprint" exits push a new Home instead of going back** (React Navigation v7). Change to `popTo('HomeMain')` in StudioTabBar, CoachStudio, Founder, Ops, Partner and `HomeScreen.jsx:148`.
- **Blueprint Tour replay can't be exited on iOS** (13 forced steps, gesture disabled). Add Close, and add Skip on first launch.
- **No error boundary.** Any render crash white-screens the app. Add a branded "Something went wrong / Reload" screen.
- **Password reset from the app lands on the site root**, not `/reset-password`. Add `redirectTo` (`AuthContext.jsx:151`).
- **Dead taps:** the Profile → Notifications row (`screen: null`), the Budgeting top-bar bell and avatar, and Messages "Explore Campus Connect", which goes to Home.

### 2b. Sign-up & accounts
- **Sign-up consent (GDPR record) and account type silently fail to save** when email confirmation is on (no session means RLS blocks them). Move them into the `handle_new_user` trigger.
- **No DOB/age gate**, although 5th and 6th years (15–18) are the market and Ireland's digital age of consent is 16. The Investment tab also promotes copy-trading to under-18s. **Decision needed (D5).**
- **User types don't match the spec:** 4 in the app vs 6 in DESIGN_REFERENCE, with no 5th/6th year option.
- **Budget data is stored on the device under a shared key**, so the next person to sign in on that phone sees the previous user's finances. Key it by user id and clear it on sign-out.
- **Account deletion leaves public Storage files and doesn't cancel Stripe.** Extend the `delete-account` function.

### 2c. Foundation builders (once the backend exists)
- Show friendly error copy instead of raw PostgREST text. Drop "you won't be charged twice".
- **No draft autosave and no discard confirm.** Swipe-down or Android back wipes up to 15 steps. Android keyboard avoidance is a no-op (`QuestionFlow.jsx:66-69`).
- Submit is **non-idempotent**: each retry creates an orphan row and re-runs the AI. Move it to a single server-side submit.
- **CV:** "target industry" is optional in the app but required by `generate-cv`. **Skip** on the experience step bypasses validation.
- **Interview Prep:** the service name sent doesn't match the seed, so `service_id` is null.
- **Application Form:** needs at least 1 Evidence Bank story, but only tells the student after submit. Gate it up front.
- "Same-day" Premium vs a **24h** DB deadline, and the weekend window is ignored.
- GenerationSubmitted's "Back to Foundation" goes to Home. Add "Track in My Outputs".
- **My Outputs:** there's no way to open, download or share a delivered document. Add an output detail screen with a PDF or share option.
- Evidence Bank: delete has no confirm, and the edit view has no keyboard avoidance.

### 2d. Community features
- **Board "Message"/"Join" opens a chat the poster is never added to**, so they never see or get notified of the message.
- **Chat loads the OLDEST 100 messages**, not the newest (`useChat.js:82-88`).
- **Campus Connect isn't scoped to a campus.** Every college sees every post, but the copy says "14 boards per college". **Decision needed (D3).**
- **Report is missing** on Module Q&A, ads, and several board card types, and there's no block (#29). This is App Store 1.2 for user-generated content.
- "Project Collaboration" posting fails live (migration missing, section 0).

### 2e. Misleading content (consumer-protection risk)
- The FAQ says outputs are **"not AI-generated"**, but the builders use AI. Change to "AI-assisted, always reviewed by a Campus Handler".
- **Foundation's "50% OFF, €20 → €10"** uses a reference price that has never been charged (EU Omnibus rule). Show the real price only.
- **Course Connect "Graduate Mentors"** are made-up named people at real employers (KPMG, Stripe). Remove them.
- **Coach Booking "available times"** are made up. Relabel them "Preferred times, coach confirms".
- **Every coach and partner is "Verified" by default.** Only show it from real data.
- **Coach Studio** shows made-up sessions, clients and counts to real coaches, and hides load errors (#44 is only partly fixed). **Availability** saves nothing, though the tables exist live.
- **Pro gating doesn't exist.** Pricing lists Foundation and Elevation as Pro, but nothing checks `isPro`. **Decision needed (D2).**

### 2f. Staff portals
- **Founder metrics are wrong for the founder** (RLS makes Total Users = 1). Add a `get_founder_platform_stats()` SECURITY DEFINER RPC.
- **Ops shows "Nothing pending" for GDPR requests when the load fails**, which is a compliance risk. Add error and loading states.
- **Partner Portal metrics are always 0.** No deal-view or deal-claim events are ever logged.
- **Weekly Issue Editor:** no keyboard avoidance, unsaved cards are silently discarded, and Publish goes live with no confirm.
- Spotlight add/remove ignore errors, and remove has no confirm.

---

## 3. Global look fixes (one change each fixes many screens)

| # | Issue | Scale | Fix |
|---|---|---|---|
| L1 | ✅ **FIXED 2026-09-25 (dm-sans ^0.4.2 + per-weight imports).** **SemiBold text renders in the fallback system font.** `@expo-google-fonts/dm-sans@0.2.3` has no 600 weight, so the `DMSans_600SemiBold` import is `undefined`. Affects every button, card title, label and eyebrow. | 377 uses in 79 files | Bump to `@expo-google-fonts/dm-sans@^0.4` (it ships 600). One-line fix. |
| L2 | Italic DM Sans isn't loaded (fake slant on Android, none on iOS) | 27 styles | Load `DMSans_400Regular_Italic`, or switch to `fonts.serifItalic` |
| L3 | **Status bar invisible** (white icons on cream) | AdBoard, Blog, Marketplace, Article, Messages, Pricing, WeeklyBlueprint, Welcome, VerifyEmail, … | Set status bar style per screen, or navy inset |
| L4 | **Tab bar has hard-coded heights** (88/68) that ignore safe-area insets; labels clip on Android/web | every screen | Use `useSafeAreaInsets()`: `height: 56 + insets.bottom` |
| L5 | **6 different back-button/header styles** ("‹ Home", "‹ Back", circle chevron, bare chevron, centred title…); back labels are hard-coded and wrong when arriving from elsewhere | ~30 screens | One shared `ScreenHeader` with a 44pt back target |
| L6 | Tap targets under 44pt (back links about 32pt, menu/bell 30–34, steppers 20–24) | app-wide | `hitSlop` / sizes from the shared header |
| L7 | **Off-palette colours**: a parallel Tailwind palette (`#F0FDF4`, `#EFF6FF`, `#7C3AED`, `#F59E0B`…) plus a purple "NEW" badge | about 40 files | Add named tint tokens to `constants/theme.js`, then replace raw hex |
| L8 | Emoji used as icons on Campus Connect tiles (renders differently on each OS; against the "Lucide throughout" spec) | Campus boards, pickers | Lucide icons in cream circles |
| L9 | **Budgeting row labels truncated** ("Part-time …", "Rent / Acco…", "Subscriptio…") | Budgeting | Label column `flex: 1`, amount column fixed ~90px |
| L10 | Modals/sheets use fixed `paddingBottom: 34`/`paddingTop: 28` | 7 modals | Use insets |
| L11 | Builder inputs 15px (iOS zooms under 16), labels 13/600; no service name in the flow header; tier pills wrap badly | all 8 builders | 16px inputs, 14/500 labels, eyebrow "CV OPTIMISATION · STEP 3 OF 15", tier cards with price |
| L12 | SignIn/ForgotPassword define `backBtn` twice, so the header back chevron is misaligned | 2 screens | Rename the second style |
| L13 | Remote images have no fallback (blank frames); 4+ coaches show grey silhouettes | Elevation, CoachProfile, boards, partners | `onError` placeholder, plus real coach photos (**content needed from you**) |
| L14 | Home looks empty for a new user (Quick Access + an empty "Live Activity" box) | Home | Stronger new-user empty state: "Start here" checklist (profile, first board, first service) |
| L15 | Marketplace is two cards on an empty page; Founder/Partner portals look unfinished | 3 screens | Add content or merge |

## 4. Stale or wrong copy (quick wins)
- About: "Launching September 2026" is now in the past. Also "A note from founder" → "A note from the founder".
- Unverified-email banner mentions a "free trial ends September 30th" that doesn't exist.
- The Tour and FAQ promise Messages with coaches (#48), a Directory (#47), an "Elevation tab" and a "Blueprint tab" (neither exists), and a refund policy with no link.
- Profile stats "Session Booked" should be "Sessions Booked". The stats are always 0 because nothing writes those events.
- Lifestyle Explore "Coming soon · Locked until launch" with `????` names. We're at launch now: reveal or remove.
- "Trending Right Now" is a curated rotation, not a trend ranking. Rename to "Featured this week".
- Weekly Issue Editor hints mention `src/data/blogPosts.js`.
- Portfolio Plan says "your Coach" where every other builder says "Campus Handler".

## 5. Company registration (CRO) — now unblocked, needs your details

The app currently names **no legal entity anywhere**. The website's legal pages already say "UniBlueprint Ltd, registered in Ireland", and sign-up consent is recorded against them.

**What I need from you:** the exact registered name, the CRO number, the registered office address, whether you're VAT-registered (and the number), and the company email domain to use.

| Item | Action |
|---|---|
| Legal footer | Add "UniBlueprint Ltd, registered in Ireland, company no. ___, registered office ___" to About, Privacy & Data and Profile |
| Terms/Privacy | Name the company as data controller, bump `TERMS_VERSION`/`PRIVACY_VERSION`, and **build a re-consent prompt** (none exists) |
| Emails | Replace `uniblueprintoperations@gmail.com` (19 uses) and `uniblueprint26@gmail.com` (notify-team function) with company-domain addresses (`support@`, `privacy@`, `operations@`). Centralise them in `constants/site.js`. |
| Apple Developer | Enrol as an **Organisation**; this needs a **D-U-N-S number** for the company (free; takes days, so start now). This also unblocks EAS/TestFlight and universal links. |
| Google Play | Organisation developer account (also needs D-U-N-S) |
| Expo/EAS | Make `owner: uniblueprint` an Expo organisation; add `appleTeamId`/`ascAppId` to `eas.json` submit |
| Stripe | Switch to a company account (name, CRO number, directors' KYC) and set the statement descriptor. Remove "prices include VAT" unless VAT-registered. Prerequisite for #40. |
| Receipts | No receipt or invoice exists for any purchase. Needs company name, CRO number, address and VAT number. |
| Partner/coach/handler terms | Must name the company as the contracting party |
| Weekly Blueprint | Add a publisher imprint plus a "not financial advice" line |
| Business name | If the registered name isn't exactly "UniBlueprint Ltd", register "UniBlueprint" as a business name (RBN1A) |

## 6. Store-config fixes (`app/app.json`)
- Remove the Android `READ_EXTERNAL_STORAGE` and `READ_MEDIA_IMAGES` permissions. The system photo picker doesn't need them, and `READ_MEDIA_IMAGES` triggers a Play policy review.
- Remove `NSCameraUsageDescription`; the camera is never used.
- Fill `NSPrivacyCollectedDataTypes`: email, name, photos, user content and user id. It must match the App Store privacy label.
- Add `ios.config.usesNonExemptEncryption: false`.

## 7. Decisions needed from you before the fix run

| # | Decision | Options |
|---|---|---|
| D1 | How do people pay on iOS (Pro and Foundation)? | (a) Hide all purchasing on iOS for v1: website only, no mention in-app. Fastest. (b) Apple IAP via RevenueCat. Apple takes 15%. (c) EU External Purchase Link entitlement. |
| D2 | What does Pro actually unlock? | Gate Foundation/Elevation behind `isPro`, **or** fix the Pricing/FAQ copy to match "everything's open" |
| D3 | Campus Connect: per-campus or all-Ireland? | Scope boards by institution, or change the "per college" copy |
| D4 | Keep **Directory** as a main tab while its data is fake (#47)? | Move it to the drawer until it's real |
| D5 | Under-16s / under-18s | Collect DOB at sign-up; block or add parental consent for under-16s; hide trading content for under-18s |
| D6 | Coach "contact directly" (personal email/phone) bypasses platform payments | Keep, or route everything through enquiries |
| D7 | "Coming soon" placeholders (#41), listed in the core findings file | Keep as teasers, or remove at launch |
| D8 | Gold accent colour: it's used widely but isn't in DESIGN_REFERENCE | Adopt it officially, or remove it |

## 8. Suggested order for the fix run
1. **Quick global wins (no decisions needed):** L1 font bump, deep-link fix, P0-5 Profile plan card, L3 status bar, L4 tab bar, L9 Budgeting, L12, section 4 copy, section 6 app.json, the `popTo` fixes, error boundary, password-reset redirect, dead taps.
2. **Safety/legal:** P0-3 anonymous posts (migration), report buttons, false claims (FAQ AI, 50% off, fake mentors, fake booking times, Verified badge), budget key per user, deletion cleanup.
3. **After D1/D2:** P0-2 iOS purchasing, P0-4 Foundation payment, Pro gating.
4. **After #53:** apply the Foundation migrations and deploy the 16 functions, then the builder fixes (2c) and the My Outputs viewer.
5. **Visual system pass:** shared `ScreenHeader`, theme tokens, off-palette sweep, emoji → icons, tap targets, builder input sizing.
6. **Once CRO details arrive:** section 5.
7. P2/P3 backlog from the two findings files.
