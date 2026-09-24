# UniBlueprint mobile app: core and shell audit

Scope: `app/App.jsx`, `app/src/navigation/*`, `app/src/components/**`, `app/src/constants/*`, `app/src/context/AuthContext.jsx`, `app/src/lib/*`, `app/src/screens/auth/*` and the top-level screens listed in the brief. Foundation builders, `studio/*` and `portals/*` are out of scope.
Method: I read every file in scope and checked live Supabase (project ozpeofkvnpikhopkgcxc) read-only for tables, columns, RPCs, RLS policies, triggers, buckets, realtime publication and Edge Functions.
All paths are relative to `app/src/` unless they start with `app/` or `supabase/`.

Not re-reported here, because they are already tracked or were already found by another auditor: #28, #29, #31, #40, #41 (placeholders are listed once, grouped, at the end), #45, #46, #47, #48, #49, #50, #51, #52, #53; the Profile "Free Member" card being hard-coded (ProfileScreen.jsx:670); linking.js missing the Drawer `MainTabs` level; dm-sans 0.2.3 having no 600 weight (`fonts.sansSemiBold`); the tab bar's hard-coded heights; truncated Budgeting row labels; and `uniblueprintoperations@gmail.com` being used 19 times.

Live facts I relied on (from the coordinator plus my own checks): the builder tables and `submit_document_for_review` are missing live; only the `create-checkout-session` and `delete-account` Edge Functions are deployed; there are 11 users and 0 subscriptions. Every other table and RPC these screens query exists live, as do the storage buckets. **One exception:** `project_collaborations.project_type` is missing live. The local migration `supabase/migrations/20260914090000_project_collaborations_project_type.sql` exists in git but has not been applied.

---

## Cross-screen patterns

1. **The status bar is invisible on light headers.** `App.jsx:130` sets `<StatusBar style="light">` for the whole app, and no screen overrides it. On 9 screens the root `View` is cream with `paddingTop: insets.top`, so the status bar sits on a cream strip with white icons: AdBoard, Blog, Marketplace, Article, Messages, Pricing, WeeklyBlueprint, BoardDetail's "not found" state and the ModuleQA thread. Welcome (cream), BlueprintTour (white), VerifyEmail (a cream strip) and the yellow UnverifiedEmailBanner have the same problem. Fix: either paint the inset area navy on navy-header screens, or set the status bar per screen with `useFocusEffect(() => setStatusBarStyle('dark'))` on light screens.
2. **The iOS purchase flow violates App Store guideline 3.1.1.** Four places send users to the website to buy a Pro subscription, with no `Platform.OS` check: Pricing, the Profile "Upgrade" button, the Weekly Blueprint Deal Room, and copy that says payment happens "on the website, never in the app". Details are under Pricing below.
3. **Supabase `{ error }` is silently ignored almost everywhere.** supabase-js v2 resolves with `{ error }` rather than throwing, so `try/catch` and `.catch()` never fire. Examples: AuthContext role and subscription loads, SignUp's consent write, CondensedDashboard, HomeScreen `persistShortcuts`, AdBoard, every BoardDetail action (join, vote, remove, solution, mark sold), ModuleQA answer and vote, CampusGateModal, EditProfile `updateUser`, PrivacyData's request log, Notifications' mark-read and useChat's participant join. The pattern everywhere is to check `error`, show an inline error, and roll back optimistic state.
4. **No pull-to-refresh on list screens.** Only MyOutputs and Notifications have a `RefreshControl`. AdBoard, BoardDetail, ModuleQA, ResourceFinder, Messages, CampusConnect and CourseConnect load once, or only on focus.
5. **Unbounded client-side queries.** BoardDetail, ModuleQA and ResourceFinder `select('*')` whole tables. Worse, they load every vote and every membership row platform-wide just to count them (`suggestion_votes`, `solution_votes`, `qa_answer_votes`, `society_members`, `module_answers`). Paginate, and count with views or RPCs.
6. **Off-palette colours bypass the theme.** There is a parallel Tailwind-style palette hard-coded in about 40 files: `#F0FDF4` (32 uses), `#EFF6FF` (27), `#15803D` (21), `#B45309` (17), `#FDF4FF` (15), `#7C3AED` (12), `#F59E0B` (11), `#1D4ED8`, `#0369A1`, `#6D28D9` and others. `#DC2626` is written out 23 times instead of `colors.destructive`. The theme's gold tokens (`theme.js:10-12`) are not in DESIGN_REFERENCE at all. Either add named tint tokens to `constants/theme.js` and ban raw hex, or collapse to navy, cream and white. Worst offenders: NotificationsScreen (31), AboutScreen (21), CourseConnect (19), ProfileScreen (18) and CoachProfile (17).
7. **Headers and back buttons are inconsistent.** At least six back-button styles are in use:
   - "‹ Home", "‹ Back", "‹ Profile", "‹ Coaches" and "‹ Ad Board" text links;
   - circular chevrons on the auth screens;
   - a bare chevron in TopBar (Budgeting);
   - "< Back" with no accessibility label (About, FAQs, Help, CoachBooking, PrivacyData, ChatRoom).
   Some navy heroes scroll with the page while others are fixed. The back labels are hard-coded (for example "Coaches" or "Home") even when the user arrived from somewhere else. Build one `ScreenHeader` component with a 44pt back target and use it everywhere.
8. **Many tap targets are under 44pt.** Back links (`paddingVertical: 6` around a 20px icon, about 32pt), TopBar back 28×28 and avatar 36, Home menu and bell 34 and avatar 30, AdBoard menu 30, close buttons 28 (ComingSoonSheet, PartnerContactModal), carousel and Welcome dots, QuickAccess remove badge 22, StudioTabBar pills about 30pt, and PartnerMap zoom buttons 30.
9. **No modal or bottom sheet respects safe areas.** They all use a fixed `paddingBottom: 34` or `paddingTop: 28` (BoardPicker, CourseBoardPicker, CampusGate, PostForm, Interests, PostAd, EditProfile), so content can clash with the home indicator or status bar on Android edge-to-edge and on iPhones without a notch. Screens inside the tab navigator also add `insets.bottom` on top of the tab bar's own inset, which leaves a double gap at the bottom.
10. **Italic DM Sans that isn't loaded.** 27 styles use `fontStyle: 'italic'` with a DM Sans family, but only the DM Serif italic face is loaded. The result is a synthesised slant on Android and no slant on iOS. Use `fonts.serifItalic` or drop the italic. Examples: InterestsModal.jsx:221, CampusGateModal.jsx:112, AdBoardScreen.jsx:259/274, PrivacyDataScreen.jsx:219, ResourceFinderScreen.jsx:157.
11. **Emoji used as icons.** Campus Connect tiles, board heroes and pickers use emoji (campusBoards.js `icon`, CourseBoardPickerModal.jsx:79) against the "Lucide throughout" rule in the spec. They also render differently on each OS.
12. **Remote images have no fallback.** `Image` with a remote `uri` has no `onError` or placeholder in: Profile avatar (ProfileScreen.jsx:627), CoachProfile (483), board photos (BoardDetailScreen.jsx:506/694/731), and PartnerHeroImage (lifestyle/PartnerCards.jsx:93-99), which is also used by the Home carousel. A broken URL leaves an empty frame.
13. **`Linking.openURL` is never guarded.** About 40 calls have no `.catch()` and no `canOpenURL` check. `mailto:` or `tel:` rejects on devices without a mail or phone app, which gives an unhandled promise rejection with no user feedback. Add a `safeOpenURL` helper that shows an Alert with the address on failure.
14. **Non-serialisable navigation params.** Whole `coach` objects, including `require()`'d images, are passed as route params (CoachProfile, CoachBooking, Home spotlight, Budgeting, PartnerCards, WeeklyBlueprint). React Navigation warns about this, and it blocks deep linking and state persistence. Pass `coachId` and look the coach up instead.
15. **Content is bundled into the app binary.** Coaches (ElevationScreen COACHES), partners (data/lifestylePartners.js), the blog (data/blogPosts.js), Foundation prices, and Compass prices ("confirm before each release") all ship inside the JS bundle. Any change needs an app release or an OTA update, and prices can go stale.

---

## App shell: App.jsx, navigation, AuthContext, lib, constants

- [P1] [Missing] App shell — There is no error boundary. Any render exception white-screens the app with no recovery (`app/App.jsx:123-137`). → Wrap `<RootNavigator/>` in an ErrorBoundary with a branded "Something went wrong / Reload" screen (`expo-updates` `reloadAsync`), and report to Sentry once #31 lands.
- [P2] [Missing] App shell — There is no offline or network state handling. NetInfo is not installed, so every screen silently shows empty data ("No ads live", "Nothing here yet") when offline (`app/package.json`). → Add `@react-native-community/netinfo` and a global offline banner above the tabs (next to UnverifiedEmailBanner in `navigation/index.jsx:215-218`). Show "Couldn't load, tap to retry" states instead of empty states.
- [P1] [Looks] App shell — The global light status bar makes the clock and battery invisible on the cream, white and yellow surfaces listed in cross-screen pattern 1 (`app/App.jsx:130`). → Set the status bar style per screen, or give the inset area a navy background.
- [P1] [Function] App shell (password reset) — `resetPasswordForEmail(email)` is called with no `redirectTo`. The reset email therefore lands on the site root, but the website only handles recovery at `/reset-password` (`src/pages/auth/ForgotPasswordPage.jsx:27`). Users who reset from the app cannot finish the reset (`context/AuthContext.jsx:151`). → `resetPasswordForEmail(email, { redirectTo: 'https://uniblueprint.ie/reset-password' })`, or add an in-app `ResetPassword` screen with a deep-link path.
- [P2] [Function] App shell — `getSession()` has no `.catch`. If AsyncStorage or the refresh fails, `loading` stays `true` and the user is stuck on the splash forever (`context/AuthContext.jsx:78-88`). → Add `.catch(() => { setUser(null) }).finally(() => setLoading(false))`.
- [P2] [Function] App shell — Every foreground calls `refreshSession()`, which fires `onAuthStateChange`. That handler reloads roles, subscription and profile and tears down and re-subscribes the realtime channel. It also flips `profileLoading` to true on every resume, which re-runs every effect keyed on `user` and makes consumers flicker (`context/AuthContext.jsx:90-121`, `44`). → In `onAuthStateChange`, reload only on `SIGNED_IN` and `USER_UPDATED`. Keep the `setUser` identity stable when the id is unchanged, and use supabase `startAutoRefresh`/`stopAutoRefresh` on AppState, as the Supabase React Native guide recommends.
- [P2] [Function] App shell — Role and subscription loads ignore errors, so a transient failure silently drops Pro and roles until the next auth event (`context/AuthContext.jsx:27-32`). → Check `error` and retry, or keep the previous state.
- [P2] [Function] App shell — The Supabase client silently falls back to `https://placeholder.supabase.co` when env vars are missing. A misconfigured build ships and every call fails without a message (`lib/supabase.js:4-5`). → Throw at start-up in dev and show a fatal config screen in production.
- [P3] [Function] Navigation — The linking config has no paths for Notifications, ChatRoom, Article (`blog/:slug`), BoardDetail (`board/:key`), CoachProfile, Help, FAQs, MyOutputs or a password-reset path (`navigation/linking.js:33-71`). The separately-reported `MainTabs` bug is not repeated here. → Add these paths once push notifications (#45) and sharing need them.
- [P1] [Function] Navigation / BlueprintTour — The tour in replay mode has no close or back control, and the screen is registered with `gestureEnabled: false`. On iOS, a user who taps "How UniBlueprint Works" must step through all 13 steps to get out (`navigation/index.jsx:192-196`, `screens/BlueprintTourScreen.jsx:327-411`). → In `mode="replay"`, show an X or "Close" in the floating chrome, and drop `gestureEnabled: false`.
- [P2] [Function] Navigation — The first-launch tour has no Skip; all 13 steps are forced. It renders outside any navigator, so Android back exits the app, and the "seen" flag lives in per-device AsyncStorage, so the tour replays on every reinstall or new device (`navigation/index.jsx:343-345`, `BlueprintTourScreen.jsx:276-284`, `309-311`). → Add "Skip tour" from step 2. Store `tour_seen_at` on `profiles` (the `onboarding_completed` and `onboarding_step` columns already exist live) and add a BackHandler.
- [P2] [Looks] Navigation — The bottom tabs (Home, Ad Board, Messages, Directory, Profile) do not match the spec (Home, Blueprint, Connect, Lifestyle, More). The fake Directory (#47) takes a primary tab while Foundation, Elevation and Lifestyle are only reachable through the drawer or Home (`navigation/index.jsx:240-265`, DESIGN_REFERENCE "Bottom nav bar"). → A founder decision is needed. If the tabs stay as they are, move Directory into the drawer until it is real.
- [P3] [Looks] Navigation — The Messages tab has no unread badge. Unread counts are only visible inside the tab (`navigation/index.jsx:250-254`). → Add `tabBarBadge` from a lightweight unread query.
- [P3] [Looks] Drawer — The overlay colour `rgba(15,23,32,0.5)` is off-palette, and the drawer has no Profile, Settings, Help or Sign out entries (`navigation/index.jsx:281`, `navigation/SidebarDrawer.jsx:15-24`). → Use `rgba(30,58,95,0.5)` and add a footer with Profile, Help and Sign out.
- [P3] [Looks] Theme — The gold tokens (`colors.gold`, `goldDeep`, `goldLight`) are not in DESIGN_REFERENCE but drive many accents: carousel, PartnerContactModal rule, pricing badge, timeline dots (`constants/theme.js:10-12`). → Either add gold to DESIGN_REFERENCE as an approved accent, or remove it.

## Components

- [P1] [Function] TopBar (Budgeting) — The bell and avatar buttons render with `onPress` undefined, because Budgeting passes neither prop. They are dead taps, and `notificationCount` is always 0 (`components/layout/TopBar.jsx:32-52`, `screens/BudgetingScreen.jsx:1323`). → Default `onBellPress` to `navigate('Notifications')` and `onProfilePress` to `getParent().navigate('Profile')` inside TopBar, or hide the icons when no handler is given.
- [P2] [Looks] TopBar — The back button is 28×28 and the avatar 36×36. The badge uses off-palette amber `#F59E0B` (`components/layout/TopBar.jsx:68-71`, `79`, `86-91`). → Make hit areas at least 44 (hitSlop or size) and use `colors.destructive` or navy for the badge.
- [P1] [Function] CondensedDashboard — The "Membership" row only knows about complimentary Pro. A paying Pro or Premium subscriber sees "Standard" (`components/home/CondensedDashboard.jsx:160`, `screens/HomeScreen.jsx:487`). → Pass `isPro` and `subscription.tier` and show "Pro", "Premium", "Complimentary Pro" or "Free".
- [P2] [Function] CondensedDashboard — The three queries ignore `{ error }`; the `.catch` only handles rejections (`components/home/CondensedDashboard.jsx:97-106`). → Check each `error` and show "Couldn't load".
- [P2] [Looks] VerifiedBadge — Every coach and partner is "Verified" by default (`verified = true`), which claims vetting that isn't recorded anywhere. The blue `#3B82F6` and `#EFF6FF` are off-palette (`components/ui/VerifiedBadge.jsx:16`, `20`, `32`, `45`). → Default to `false` and set it only from real data. Restyle as the spec's "status badge": `rgba(30,58,95,0.08)` background with navy text.
- [P3] [Looks] ActiveMemberBadge / MockContentBanner / FeatureCard — Off-palette colours: `#F0FDF4`/`#15803D` (ActiveMemberBadge.jsx:23,32,37), `#EEF2FF` with radius 10 (MockContentBanner.jsx:19-20), and a purple "NEW" badge `#7C3AED`/`#A78BFA` (FeatureCard.jsx:31). → Use theme success and navy tokens, and radius.card.
- [P3] [Function] MockContentBanner — CourseConnect passes a `style` prop that the component ignores, so the intended spacing is lost (`components/ui/MockContentBanner.jsx:5`, `screens/CourseConnectScreen.jsx:706-710`). → Accept and apply `style`.
- [P2] [Looks] FeatureCard — The "Open" CTA is about 35pt tall (paddingVertical 9) and the icon box radius is 10 (`components/ui/FeatureCard.jsx:100-104`, `123-127`). → Make the CTA at least 44pt and use radius tokens.
- [P2] [Function] ImageUploader — The avatar is uploaded to a fixed path (`{uid}/avatar.jpg`) with upsert and the same public URL, so devices and CDN keep showing the old photo after a change (`components/ui/ImageUploader.jsx:168-181`, `screens/ProfileScreen.jsx:131`). → Append `?v=${Date.now()}` to the stored URL, or use a timestamped path and delete the old one after a successful upload.
- [P2] [Function] ImageUploader — The old file is deleted **before** the new upload succeeds. If the upload fails, the user loses their existing image (`components/ui/ImageUploader.jsx:158-165`). → Delete the old object only after `upload()` returns without error.
- [P3] [Function] ImageUploader — The deprecated `ImagePicker.MediaTypeOptions.Images` is used, and it always resizes to `maxDim` width, upscaling small images (`components/ui/ImageUploader.jsx:94`, `138-142`). → Use `mediaTypes: ['images']` and resize only when `asset.width > maxDim`.
- [P2] [Function] CampusGateModal — An `auth.updateUser` error is swallowed with no message, and the spinner just stops (`components/campusConnect/CampusGateModal.jsx:26-37`). The institution is also stored only in auth `user_metadata`, not `profiles.university_or_field`. → Show an error; write the institution to `profiles` too.
- [P2] [Function] PostFormModal — Dates are typed as free text in `YYYY-MM-DD` with a regex check. Inputs are 14px on radius 12, against the spec's 16px on radius 8 (iOS zoom rule) (`components/campusConnect/PostFormModal.jsx:260-269`, `353-358`). → Use a native date picker, and style inputs from a shared `FormTextInput`.
- [P2] [Looks] PostAdModal / EditProfile / AccountType modals — Page-sheet modals hard-code `paddingTop: 28`. On Android the Modal draws under the status bar, so the header collides with it. Board colours `#B45309`, `#0369A1` and `#6D28D9` are off-palette (`components/ads/PostAdModal.jsx:18-23`, `159`; `screens/ProfileScreen.jsx:223`). → Use `insets.top`, or `statusBarTranslucent={false}` on Android, and theme tokens.
- [P2] [Function] InterestsModal — A bottom sheet with a TextInput but no KeyboardAvoidingView: on iOS the keyboard covers "Add your own" and Save (`components/profile/InterestsModal.jsx:91-94`). → Wrap it in a KeyboardAvoidingView like CampusGateModal.
- [P2] [Looks] UnverifiedEmailBanner — The copy is hard-coded to a "free trial ends September 30th" that doesn't exist; Pricing shows Free forever plus paid Pro. The banner adds `insets.top` and every screen below adds it again, which gives a double top gap. The yellow/amber palette is off-spec and the Resend button is about 26pt (`components/ui/UnverifiedEmailBanner.jsx:11-24`, `62`, `75-80`). → Neutral copy ("Verify your email to secure your account"), navy or cream styling, and consume the inset once, for example through a context flag.
- [P3] [Looks] Button — The disabled state uses opacity 0.5; the spec says `rgba(30,58,95,0.7)` (`components/ui/Button.jsx:46-48`). Button, Card and SectionHeader exist but most screens hand-roll their own. → Adopt the shared components during the visual pass.
- [P3] [Looks] StudioTabBar / QuickAccessGrid / SpotlightCarousel / PartnerMap — Undersized targets: pills about 30pt (StudioTabBar.jsx:77-81), remove badge 22 (QuickAccessGrid.jsx:337-341), dots 6px (SpotlightCarousel.jsx:176-186), zoom buttons 30 (PartnerMap.jsx:769). → Make them at least 44 with hitSlop.

## Auth screens

- [P1] [Looks] SignIn / ForgotPassword — There are two `backBtn` keys in the same StyleSheet, and the second (`{ alignItems:'center', marginTop: 24 }`) overrides the first. The header's round back chevron loses its 32px circle and gets a 24px top margin, so it sits misaligned next to the logo (`screens/auth/SignInScreen.jsx:169` vs `221`, used at `49`; `screens/auth/ForgotPasswordScreen.jsx:136` vs `183`, used at `46`). → Rename the bottom link style to `textBackBtn`.
- [P1] [Function] SignUp — The consent records (`legal_acknowledgements`) and the `profiles` update for `user_type` and interests run right after `signUp()`, wrapped in `try/catch`, but supabase returns `{ error }` rather than throwing, so a failure is silent. When email confirmation is on (the VerifyEmail flow suggests it is), `signUp` returns no session, and RLS (`auth.uid() = user_id` and `auth.uid() = id`, confirmed live) rejects both writes. The GDPR consent audit trail and the chosen account type are then silently lost (`screens/auth/SignUpScreen.jsx:326-345`). → Move both writes into the `handle_new_user` trigger, reading from `raw_user_meta_data` (already sent as `metadata`), or an RPC called after the first sign-in. At minimum, check `error`.
- [P1] [Missing] SignUp — There is no age or date-of-birth gate, even though the market includes 5th and 6th year students (aged 15 to 18) and Ireland's digital age of consent is 16. `profiles.date_of_birth` exists live but is never collected (`screens/auth/SignUpScreen.jsx:209-217`). → Collect DOB. Under-16s need a parental consent path or should be blocked; keep an under-18 flag to hide trading and investment content.
- [P1] [Function] SignUp / user types — The spec has 6 user types (University student, 5th year, 6th year, Apprentice, Young worker, Other). The app has 4 (student, apprentice, gap_year, worker), and sign-up has no 5th or 6th year situation, so Leaving Cert students can't describe themselves (`constants/userTypes.js:24-46`, `screens/auth/SignUpScreen.jsx:26-75`). → Align with DESIGN_REFERENCE "User Types". A migration plus the constants is needed.
- [P3] [Function] SignUp — "Skip for now" calls the same `doSignUp` as "Create Account", so nothing is skipped. On step 2 the Continue button shows "Creating account…" (`screens/auth/SignUpScreen.jsx:1089-1092`, `573`). → Have Skip clear the step-3 selections before submitting, or relabel it.
- [P2] [Function] SignUp — `navigation.navigate('VerifyEmail')` runs after `signUp`. If a session is returned, RootNavigator has already swapped to the tour or app, so this navigate goes to an unmounted stack (`screens/auth/SignUpScreen.jsx:347`). → Only navigate when `signUpData.session` is null.
- [P2] [Looks] Welcome — The cream screen sits under a light status bar. Dots are 8px targets. There are no Terms or Privacy links pre-auth (`screens/auth/WelcomeScreen.jsx:67`, `96-102`). → Add a dark status bar, hitSlop on the dots, and a small legal footer.
- [P2] [Looks] VerifyEmail — `insets.top` is applied to the ScrollView content rather than the navy header, which leaves a cream strip above it. The header also has an extra `paddingTop: 20`. The copy "activate your account before signing in" contradicts the in-app unverified-banner flow (`screens/auth/VerifyEmailScreen.jsx:34-39`, `105-113`, `58-62`). → Move the inset into the header, as SignIn does, and align the copy.
- [P3] [Function] SignIn — Raw Supabase messages ("Invalid login credentials", "Email not confirmed") are shown verbatim, and there is no "resend verification" path for an unconfirmed email (`screens/auth/SignInScreen.jsx:31`). → Map error codes to branded copy and offer Resend on `email_not_confirmed`.

## HomeScreen

- [P2] [Looks] Home — Menu 34, bell 34 and avatar 30 are under 44. The unread badge is a hard-coded `#DC2626` at 8px text (`screens/HomeScreen.jsx:608-623`). → Make buttons 44 and badge text 10px or larger.
- [P2] [Looks] Home — The greeting doesn't follow the spec ("Welcome back, [First name]" in DM Serif, with university and field below). The app shows "{name}'s Dashboard" plus "Good night, X" from 23:00 to 05:00, and no institution line (`screens/HomeScreen.jsx:84-90`, `360-365`). → "Welcome back, {first}" with university and course, and drop "Good night".
- [P2] [Function] Home — Live Activity polls every 60s even when Home is not focused (another tab or a pushed screen), and there is no pull-to-refresh on the dashboard (`screens/HomeScreen.jsx:255-259`). → Poll inside `useFocusEffect`, and add a `RefreshControl` that also refetches the spotlight and unread count.
- [P2] [Function] Home — `persistShortcuts` swallows the Supabase `{ error }`, so a reorder looks saved but reverts next launch (`screens/HomeScreen.jsx:187-193`). → Check `error` and revert or toast.
- [P2] [Function] Home / Live Activity — Accepted `connection_requests` are shown as "{name} joined a study group", which is wrong (`lib/homeActivityFeed.js:151-157`). The feed also mixes in marketplace and ad items and calls this "Your Blueprint". → Relabel as "You connected with a student", or drop it.
- [P3] [Looks] Home — The "Trending Right Now" heading and pulse dot are a curated 3-hour rotation, not trending data. That is hype-adjacent against the tone spec (`screens/HomeScreen.jsx:512-521`, `lib/featuredContent.js:152-171`). → Rename to "Featured this week".
- [P3] [Function] Home — Activity feed rows aren't tappable, and the spotlight is fetched once per mount with no refresh (`screens/HomeScreen.jsx:157-161`, `542-549`). → Give rows a `nav` target, and refetch on focus.

## AboutScreen

- [P2] [Looks] About — "Launching September 2026." and "during freshers week" are future tense, but it is now late September 2026, so the copy is stale (`screens/AboutScreen.jsx:200-201`). → Change to "Launched September 2026", or remove.
- [P2] [Looks] About — The back button is a different style, with no accessibility label and about 22pt tall. Team avatar colours are an 8-colour off-palette list (`screens/AboutScreen.jsx:81-84`, `19`). → Use the shared header and navy avatars.
- [P2] [Missing] About — No legal entity, company number, registered office, app version, Terms or Privacy link (see the CRO section) (`screens/AboutScreen.jsx:198-203`). → Add a legal footer.

## AdBoardScreen

- [P1] [Looks] AdBoard — There is a cream strip under the status bar above the navy top bar, with the light status bar invisible (`screens/AdBoardScreen.jsx:78`, `223`). → Navy root background, or a `StatusBar` override.
- [P2] [Function] AdBoard — Ad query errors are ignored: `allSettled` treats a Supabase `{ error }` as fulfilled, so a failure shows "No ads live right now" (`screens/AdBoardScreen.jsx:62-69`). There is no pull-to-refresh. → Check `value.error` and add a `RefreshControl`.
- [P2] [Function] AdBoard — `ads.image_url`, uploaded through PostAdModal, is never rendered. For live ads the brand line and title show the same text twice (`screens/AdBoardScreen.jsx:196-202`). → Show a thumbnail, and hide the brand line when `!ad.brand`.
- [P2] [Missing] AdBoard — Ad rows have no "Report ad" action. This is user-generated content (App Store 1.2) (`screens/AdBoardScreen.jsx:182-204`). → Add a report action that writes `operations_flags` with `target_type: 'ads'`.
- [P3] [Function] AdBoard — The user-supplied `target_url` is opened with no scheme validation or catch (`screens/AdBoardScreen.jsx:191-192`). → Allow only `https:`, and catch failures.
- [P3] [Looks] AdBoard — The menu button is 30×30, "Post an Ad" is about 28pt tall, and the Marketplace icon is purple `#6D28D9` on `#F5F3FF` (`screens/AdBoardScreen.jsx:229-231`, `156-157`).

## ArticleScreen / BlogScreen / MarketplaceScreen

- [P1] [Looks] Blog / Marketplace / Article — A cream strip plus invisible status bar (Blog and Marketplace put a navy hero below a cream inset; Article is fully cream) (`screens/BlogScreen.jsx:19`, `screens/MarketplaceScreen.jsx:24`, `screens/ArticleScreen.jsx:39`, `50`). → Same fix as AdBoard.
- [P3] [Function] Blog / Article — Articles are bundled static data, so new posts need a release, and there is no share action (`screens/BlogScreen.jsx:44`, `data/blogPosts.js`). → Fetch from the website CMS or JSON, and add a Share button.

## BlueprintTourScreen

- The replay trap and forced first-launch tour are covered under App shell.
- [P2] [Function] BlueprintTour — The copy promises features that don't exist: "keep the conversation going in Messages" with coaches and handlers (1:1 messaging is not built, #48), and a "Directory" of people who share your interests (#47). Board and tool counts are hard-coded ("Fourteen real boards", "Nine live tools") (`screens/BlueprintTourScreen.jsx:104`, `116`, `150-159`). → Rewrite to match what ships.
- [P3] [Looks] BlueprintTour — Step accent colours (`#2563EB`, `#A21CAF`, `#C2660B`, `#7C3AED`, `#B45309`) are off-palette (`screens/BlueprintTourScreen.jsx:43-150`).

## BoardDetailScreen (Campus, Course and Marketplace boards)

- [P0] [Function] BoardDetail — **Anonymous posts are not anonymous.** "Post anonymously" still stores `poster_name` and `user_id`, the board loads rows with `select('*')`, and the live RLS on `campus_conversations`, `problems_posts`, `college_reviews` and `campus_suggestions` is `SELECT true` for authenticated users. Any signed-in user can read who wrote an "anonymous" post through the API; only the client hides it (`screens/BoardDetailScreen.jsx:171`, `414-418`; `components/campusConnect/PostFormModal.jsx:205-210`). → Don't store `poster_name` when anonymous. Expose these tables through a view or RPC that nulls `poster_name`/`user_id` when `anonymous`, and revoke direct `SELECT` on the base tables.
- [P1] [Function] BoardDetail (Campus Connect, Projects) — Posting to "Project Collaboration" fails live. The form inserts `project_type` (`constants/campusBoards.js:231`), but that column does not exist live. The migration exists only in git (`supabase/migrations/20260914090000_project_collaborations_project_type.sql`), so it is missing on the live side (#53). The type filter (`campusBoards.js:240`) is also dead. → Apply that migration live.
- [P1] [Function] BoardDetail / CampusConnect — Campus Connect is not scoped to a campus. `load()` selects the whole table, and most board tables have no institution column, so every college sees every other college's posts. Meanwhile CampusConnect claims "14 Campus Boards per College" and requires a campus before posting (`screens/BoardDetailScreen.jsx:171`, `screens/CampusConnectScreen.jsx:277-278`). → Add `institution` to the campus board tables, set it on insert from the user's campus, filter by it, and offer an "All Ireland" toggle. Otherwise, change the copy.
- [P1] [Function] BoardDetail — Contacting a poster doesn't work. "Message" and "Join" open a group room `board-<key>-<id>` that only the tapper joins. The poster is never made a participant, so they never see the message and are never notified (the `notify_on_chat_message` trigger only notifies participants) (`screens/BoardDetailScreen.jsx:289-296`, `472-477`, `556-561`). This is related to #48 but is a separate break. → On room creation, also insert the poster (`item.user_id`) as a participant through a SECURITY DEFINER RPC.
- [P1] [Missing] BoardDetail — Reporting is missing on several UGC surfaces: suggestion cards, review cards, problem cards, problem solutions, and club cards. There is no block-user action anywhere (App Store 1.2 requires report and block for UGC) (`screens/BoardDetailScreen.jsx:514-534`, `625-679`, `1018-1031`). → Add the existing `report()` Flag button to every card and to solutions. Block is #29's backend.
- [P2] [Function] BoardDetail — Errors are swallowed on join, leave, votes, remove, mark sold, post solution and the carpool-terms read. The optimistic UI updates even when the write failed, which is visible on votes (`screens/BoardDetailScreen.jsx:142-173`, `182-183`, `263-264`, `301`, `321-323`, `361`, `370-371`, `380-382`). → Check `error`, roll back, and show a toast.
- [P2] [Function] BoardDetail — There is no pagination, and it loads every vote and member row in the platform to count them. That also exposes which users joined which society (`screens/BoardDetailScreen.jsx:143-145`, `156-158`, `339-342`). → Paginate (`range`) and use count views or RPCs filtered to visible ids.
- [P2] [Missing] BoardDetail — There is no pull-to-refresh or realtime, even though the board tables are in the `supabase_realtime` publication live (`screens/BoardDetailScreen.jsx:869`). → Add a `RefreshControl`, optionally with realtime INSERT.
- [P2] [Looks] BoardDetail — The "Board not found" state has no back button and a cream status strip. The problem-thread back chevron is 20px with no hitSlop (`screens/BoardDetailScreen.jsx:196-201`, `1004-1006`). → Add a header and at least 44pt targets.
- [P3] [Function] BoardDetail — The Roomy.ie panel claims "Verified student rooms" and "browse their live listings", but it is two identical static cards linking to the same homepage (`screens/BoardDetailScreen.jsx:836-861`). → A single honest link card.

## BudgetingScreen

- The dead TopBar bell and avatar are covered under Components.
- [P1] [Function] Budgeting — Budget income and expenses are stored under the global AsyncStorage key `ub_budget_v1`, not per user, and are never cleared on sign-out or account deletion. The next person to sign in on the same device sees the previous user's finances (`screens/BudgetingScreen.jsx:35`, `691-721`; `screens/LifestyleBudgetingPreviewScreen.jsx:60`). → Key the storage by `user.id` (for example `ub_budget_v1_${uid}`) and clear user-scoped keys in `signOut` and after deletion.
- [P1] [Function] Budgeting (Investment tab) — The tab promotes trading and copy-trading coaches, including "Dinero's Low-Risk Copier target range", to an audience that includes under-18s (5th and 6th years). There is no age gate, and the disclaimers are long but don't prevent access (`screens/BudgetingScreen.jsx:1206`, `1277`; ElevationScreen trading coaches). → Hide the trading and investing content for under-18s once DOB exists (see SignUp). Get a legal review of the copy-trading promotion (Central Bank of Ireland rules on promoting investment services).
- [P3] [Function] Budgeting — There is a leftover, commented-out "Suzi Grant" attribution and a permissions TODO in the render tree (`screens/BudgetingScreen.jsx:1330-1348`). → Remove it before release.

## CampusConnectScreen

- Not scoping boards to a campus is covered under BoardDetail.
- [P3] [Function] CampusConnect — About 120 lines of fabricated sample posts (`BOARDS_DATA`) are still built into `preview` and then never rendered: dead code that holds fake content (`screens/CampusConnectScreen.jsx:50-66`, `108-225`, `219`). → Delete `BOARDS_DATA` and `preview`.
- [P2] [Missing] CampusConnect — There is no search across posts; the search box only filters board names (`screens/CampusConnectScreen.jsx:223-229`). This relates to #51, noted for context only.

## ChatRoomScreen / useChat

- [P1] [Function] ChatRoom — History loads the **oldest** 100 messages (`order asc` plus `limit(100)`), even though the comment says most recent. In any room with more than 100 messages, the newest messages never appear on open (`hooks/useChat.js:82-88`). → `order('created_at', { ascending:false }).limit(100)`, then reverse. Add "load earlier".
- [P2] [Function] ChatRoom — A participant-join failure is ignored (`hooks/useChat.js:75-80`). Send failures just restore the input, with no message to the user (`screens/ChatRoomScreen.jsx:84-90`). → Surface the errors.
- [P2] [Function] ChatRoom — ChatRoom is registered in three stacks. Opening the same room from two tabs creates `supabase.channel('chat_room_<id>')` twice. The second call returns the already-subscribed channel, and `.on()` then throws, the same crash HomeScreen documents at 280-296 (`hooks/useChat.js:109-110`). → Add a unique suffix to the topic, or remove the stale channel first, as HomeScreen does.
- [P2] [Looks] ChatRoom — The input bar adds `insets.bottom` while the tab bar is still visible, which leaves a double gap. The tab bar stays visible under the keyboard on Android (`screens/ChatRoomScreen.jsx:208`). → Hide the tab bar on ChatRoom (`tabBarStyle: { display:'none' }` via `getFocusedRouteNameFromRoute`).
- Report and block being stubs is tracked as #29.

## CoachBookingScreen

- [P1] [Function] CoachBooking — The "available times" are fabricated: five fixed slots on the next ten weekdays, generated client-side and presented as availability. No coach has a calendar, and most coaches aren't platform users (`screens/CoachBookingScreen.jsx:23-39`, `177-195`). → Label them "Preferred times (the coach will confirm)", or replace them with a free-text request.
- [P2] [Function] CoachBooking — The confirmation promises "you'll get a notification" when the coach confirms. The live `notify_on_coach_booking` trigger only notifies operations and founders, and nothing notifies the student (`screens/CoachBookingScreen.jsx:101-103`). → Change the copy, or add a status-change notification.
- [P3] [Looks] CoachBooking — The back label always reads "Profile" and the target is under 44pt (`screens/CoachBookingScreen.jsx:90-93`, `119-122`).

## CoachProfileScreen

- [P2] [Function] CoachProfile — Rating is gated on "has engaged", but an empty one-tap "Quick Message" enquiry counts as engagement, so anyone can rate any coach. Ratings are collected but never displayed (`screens/CoachProfileScreen.jsx:403-417`, `~762-786`). → Gate on a completed or confirmed booking. Show the average and count, or stop collecting.
- [P2] [Function] CoachProfile — "Or contact directly" opens coaches' personal email, phone or Instagram. That bypasses the platform-mediated payment model in the spec ("All payments flow through UniBlueprint"), and none of these handlers have a `.catch` (`screens/CoachProfileScreen.jsx:71-82`, `427-433`, `758-759`). → A founder decision is needed. At least add `.catch`.
- [P3] [Looks] CoachProfile — The back label is always "Coaches", even when the user came from Home, Budgeting or Lifestyle. The remote photo has no `onError` fallback (`screens/CoachProfileScreen.jsx:470`, `483-486`).

## CompassScreen

- [P1] [Function] Compass — Paid third-party digital products (the "Senior Cycle Bundle" at €49.99 and "Complete Platform Bundle" at €90) link out to purchase on coursecompass.ie from inside the iOS app. In the EU (Ireland), a link-out to purchase requires Apple's External Purchase Link entitlement, so this is an App Store 3.1.1/3.1.3 rejection risk. Prices are hard-coded with a "confirm before each release" comment (`screens/CompassScreen.jsx:31-45`, `339-361`). → On iOS, hide prices and "Get the Bundle" and show "Learn more on CourseCompass". Keep the free tools.
- [P3] [Looks] Compass — The "AI-powered" and "Ireland's leading CAO platform" (FoundationScreen) claims are hype against the tone spec.

## CourseConnectScreen

- [P1] [Function] CourseConnect — The "Graduate Mentors" are fabricated, named people tied to real employers ("Ciara Nolan, Graduate at KPMG Dublin", "James Healy, Software Engineer at Stripe"). They are presented with bios and a "Request Mentorship" button, under a banner saying only that the programme is "building now". There is trademark and misrepresentation risk; this is fake data shown as real and is not covered by #46, #47 or #50 (`screens/CourseConnectScreen.jsx:277-305`, `440-468`, `731-741`). → Remove them until real mentors with consent exist, or use clearly generic "Sample mentor" cards with no real employer names.
- [P2] [Function] CourseConnect — The "Recent Discussions" threads are fabricated (reply counts, "2h ago"). They sit under an "examples" banner but look fully real (`screens/CourseConnectScreen.jsx:367-371`, `773-800`). → Replace with the latest real `module_questions` rows, which already exist live.
- [P2] [Function] CourseConnect — The Interests banner says "Matched on X, Y, Z…", but no matching mechanism exists; the Directory is mock (#47) (`screens/CourseConnectScreen.jsx:659`). → Say "Your interests: …" until matching ships.
- [P2] [Looks] CourseConnect — Hero stats "1,300+ CAO courses" and "240k+ young people in Irish HE" are unverified and carry permanent TODOs in the code (`screens/CourseConnectScreen.jsx:606-640`). → Verify them with a source, or remove.

## DirectoryScreen

- The fake roster and connect dead end are tracked as #47. Two more items:
- [P3] [Looks] Directory — The menu button is 36×36 and there are off-palette avatar colours (`screens/DirectoryScreen.jsx:402`, `25-40`).

## ElevationScreen

- [P2] [Function] Elevation — The coach roster is hard-coded in the bundle, with personal phone numbers and gmail addresses. Coaches can't be added or removed without a release, and removing a coach's personal data (a GDPR request) needs an app update (`screens/ElevationScreen.jsx:53-370`). → Move the roster into `coach_profiles` (add the columns) and read it live, as the photo and bio overrides already do.
- [P3] [Function] Elevation — "Find me a coach" opens a gmail mailto (`screens/ElevationScreen.jsx:668`). → Use an in-app `coach_enquiries` insert, which is already used on CoachProfile.

## FAQsScreen / HelpScreen

- [P1] [Function] FAQs — "Every output is human-reviewed, not AI-generated" is false: the Foundation builders call `generate-*` Edge Functions (AI) and then a handler reviews. That is a misleading consumer claim (`screens/FAQsScreen.jsx:15`). About says the more accurate "no AI-only pipeline" (`AboutScreen.jsx:26`). → "AI-assisted drafting, always reviewed by a trained Campus Handler".
- [P2] [Function] FAQs / Help — Stale instructions: "Elevation tab" and "Blueprint tab" (neither exists), "tap View Profile", "contact your Campus Handler/coach through Messages" (no DMs, #48), "select Other when signing up", and "See our refund policy" with no link (`screens/FAQsScreen.jsx:11`, `23`, `35`; `screens/HelpScreen.jsx:16`, `23-25`). The FAQ also says CV submission is free, while Pricing lists Foundation as Pro. → Rewrite against the current navigation and pricing, and link the refund policy.
- [P3] [Looks] Help — Topics open as `Alert.alert` popups rather than an accordion like FAQs. The back link is under 44pt (`screens/HelpScreen.jsx:44-46`).

## FoundationScreen

- [P1] [Function] Foundation — "50% OFF LAUNCH PRICING", a struck-through "€20 → €10" and "Limited-time launch pricing" show a reference price that has never been charged. Under the EU Omnibus rules on price reductions (the prior price must be the lowest in the last 30 days), that is misleading, and the "September" promo is now expiring (`screens/FoundationScreen.jsx:203`, `267`, `285-305`, `28-...`). → Show the actual price only, or drive the promo from a dated server config with an end date.
- [P1] [Function] Foundation / Pricing — **Subscription gating hole:** Pricing lists "Foundation Blueprint (all services)" and "Elevation Blueprint (all services)" as Pro features, but no screen checks `isPro` except the WeeklyBlueprint Deal Room. Free users get everything, or the Pricing copy is wrong (`screens/PricingScreen.jsx:40-47`; grep `isPro` shows only `WeeklyBlueprintScreen.jsx:161`). → Decide on the model, then either gate it or fix the Pricing and FAQ copy.
- [P3] [Function] Foundation — "Something else in mind?" is a gmail mailto (`screens/FoundationScreen.jsx:379`). → Use an in-app form.

## Lifestyle screens (Lifestyle, Partners, FeaturedDeals, Wellbeing, BudgetingPreview)

- [P2] [Function] LifestyleWellbeing — All "Wellbeing Reads" tiles ("Mindfulness for Students" and others) open the spunout.ie homepage rather than the named article (`screens/LifestyleWellbeingScreen.jsx:203`). → Give each resource its own URL.
- [P3] [Function] Lifestyle — On the crisis strip, the "More support →" Text link sits inside a TouchableOpacity that dials 116 123. The small link is easy to miss, and a mis-tap starts a phone call (`screens/LifestyleScreen.jsx:116-131`). → Split it into two buttons.
- [P3] [Function] LifestyleBudgetingPreview — It reads the same global, not per-user, `ub_budget_v1` key (see Budgeting) (`screens/LifestyleBudgetingPreviewScreen.jsx:60`).

## MessagesScreen

- [P2] [Function] Messages — The empty-state button "Explore Campus Connect" goes to the Home dashboard, not Campus Connect (`screens/MessagesScreen.jsx:235`, `308`). → `getParent()?.navigate('Home', { screen: 'CampusConnect' })`.
- [P2] [Function] Messages — Last message and unread count come from a single query of `max(60, rooms×5)` recent messages across all rooms. Quieter rooms show "No messages yet" and wrong unread counts (`screens/MessagesScreen.jsx:172-194`). → Add an RPC or view that returns the last message and unread count per room.
- [P2] [Missing] Messages — There is no realtime or pull-to-refresh, and a full spinner shows on every tab focus (`screens/MessagesScreen.jsx:150-157`). → Subscribe to `chat_messages` INSERTs for the user's rooms (it is in the realtime publication live), and refresh quietly.
- [P1] [Looks] Messages — Cream strip plus invisible status bar (`screens/MessagesScreen.jsx:241`).

## ModuleQAScreen

- [P1] [Missing] ModuleQA — Questions and answers have no report control and no way to delete your own post (UGC, App Store 1.2) (`screens/ModuleQAScreen.jsx`, thread modal at `251-330`). → Add Flag (`operations_flags`) and "Remove" for own posts.
- [P2] [Function] ModuleQA — It loads every `module_answers` row and every `qa_answer_votes` row in the platform to count them. `postAnswer` and `toggleVote` ignore errors while updating optimistically (`screens/ModuleQAScreen.jsx:58-66`, `113-116`, `128-150`). → Use count RPCs, filter to the question's answers, and check errors.
- [P2] [Function] ModuleQA — Notifications for `module_answer` open the ModuleQA list rather than the thread (`screens/NotificationsScreen.jsx:61-63`). → Pass `questionId` and auto-open it.

## MyOutputsScreen

- [P1] [Missing] MyOutputs — "Your Completed Documents" lists submissions, but rows aren't tappable. There is no way to view or download a delivered document in the app (`screens/MyOutputsScreen.jsx:38-60`, `147`). → Add an output detail screen that opens the deliverable through a signed URL, as DESIGN_REFERENCE's "File Uploads" section requires.
- [P2] [Looks] MyOutputs — The spec asks for a 5-stage stepped tracker with timestamps. The app shows only a stage pill with off-palette colours (`screens/MyOutputsScreen.jsx:21-27`). → Build the stepper in the detail view, using `*_at` columns that already exist live.

## NotificationsScreen

- [P2] [Function] Notifications — Deep links are shallow: `problem_solution` opens the Campus problems board (not the thread, and the wrong registry for course boards), `coach_booking` opens the Elevation list, and `module_answer` opens the ModuleQA list (`screens/NotificationsScreen.jsx:55-63`). → Pass entity ids and open the exact item.
- [P3] [Function] Notifications — There is no "Mark all as read". The `coach_enquiry` category, which the live trigger emits, is missing from `TYPE_CONFIG`, and the mark-read error is ignored (`screens/NotificationsScreen.jsx:20-36`, `97`, `180`). → Add mark-all-read and the missing categories. Align the categories with the six in DESIGN_REFERENCE.

## PricingScreen (and all purchase entry points)

- [P0] [Function] Pricing — **App Store guideline 3.1.1.** On iOS, "Get Pro" and "Get Premium" open `uniblueprint.ie/pricing` in Safari to buy a digital subscription, and the footnote says "purchases are completed on uniblueprint.ie". There is no `Platform.OS` check and no StoreKit or IAP (`screens/PricingScreen.jsx:79-81`, `157`, `182`, `198`). The same applies to Profile's "Upgrade" button and its copy "Plans and payment are handled… on the UniBlueprint website, never in the app" (`screens/ProfileScreen.jsx:672-683`), and to the WeeklyBlueprint Deal Room's "Upgrade to Pro" (`screens/WeeklyBlueprintScreen.jsx:165-168`). Apple rejects this. → Short term: `if (Platform.OS === 'ios')`, hide every purchase CTA, price and external link, and show plan status only, with no steering copy. Long term: add IAP (RevenueCat or expo-iap) for Pro and Premium on iOS, or apply for Apple's EU External Purchase Link entitlement. Android is fine on Google Play under current EU rules, but review Play's payments policy too.
- [P1] [Function] Pricing — "Current Plan" can never change after a web purchase. `stripe-webhook` is not deployed live (fact 2), so the `subscriptions` table has 0 rows (fact 3). A paying user would still see "Free" (`screens/PricingScreen.jsx:74-77`). → Deploy `stripe-webhook` (this belongs with #40 and #53).
- [P2] [Missing] Pricing / Profile — There is no in-app "Manage or cancel subscription". `create-portal-session` exists in git but isn't deployed, and nothing links to it. Apple also requires Terms and Privacy links on subscription screens (`screens/PricingScreen.jsx:189-199`). → Add Manage (web portal on Android; on iOS, the App Store subscription settings once IAP exists) plus Terms and Privacy links.
- [P1] [Looks] Pricing — Cream strip plus invisible status bar (`screens/PricingScreen.jsx:88`).
- [P3] [Looks] Pricing — `CARD_W` comes from `Dimensions.get` at module load, so it doesn't react to split view or rotation. The "Most Popular" badge is absolutely positioned at `top:-12` inside a horizontal ScrollView and can clip on Android (`screens/PricingScreen.jsx:28-29`, `225-229`). → Use `useWindowDimensions` and add card top margin.

## PrivacyDataScreen

- [P1] [Function] PrivacyData (delete) — The live `delete-account` Edge Function deletes the auth user, and tables cascade, but it does **not** cancel an active Stripe subscription or delete the user's Storage objects. Those sit in **public** buckets (`profile-pictures`, `ad-images`, `campus-board-photos`, `course-connect-files`), so photos and uploaded notes stay publicly reachable after the app promises "every piece of personal data" is gone (`supabase/functions/delete-account/index.ts:67-79`; copy at `screens/PrivacyDataScreen.jsx:91`, `145`). → In the function: cancel the Stripe subscription by `stripe_subscription_id` and `storage.remove` all objects under `${uid}/` in each bucket before `deleteUser`. Clear user-scoped AsyncStorage on the client (budget, tour, goal-seeded keys).
- [P2] [Function] PrivacyData (export) — The export is `Share.share({ message: JSON.stringify(data) })`. A large JSON string can exceed Android's Binder limit (a TransactionTooLargeException crash) and pushes all personal data as plaintext into whatever app the user picks (`screens/PrivacyDataScreen.jsx:60-63`). → Write the JSON to a file with `expo-file-system` and share it through `expo-sharing`.
- [P3] [Function] PrivacyData — The request-log insert error is ignored, and `loading` never clears if `user` is null (`screens/PrivacyDataScreen.jsx:30-38`, `47-58`).
- [P3] [Looks] PrivacyData — The back link is under 44pt, and the danger button uses a hard-coded `#DC2626` (`screens/PrivacyDataScreen.jsx:102-105`, `141`, `213`).

## ProfileScreen

- (The "Free Member" card is already reported, so it is omitted.)
- [P1] [Function] Profile — Settings → "Notifications" ("Manage your alerts and reminders") has `screen: null`, so tapping it does nothing (`screens/ProfileScreen.jsx:76`, `724-728`). → Build a notification-preferences screen with the six categories in DESIGN_REFERENCE, or hide the row until push notifications (#45) exist.
- [P2] [Function] Profile — The stats "CVs Submitted", "Session Booked" and "Notes Saved" count `activity_events` types that nothing in the codebase ever writes, and the live table has 0 rows. They always show 0 (`screens/ProfileScreen.jsx:553-575`). → Compute from `submissions`, `coach_bookings` and `shared_notes`, or remove. "Session Booked" also needs to be plural.
- [P2] [Missing] Profile — There is no change password, change email, or edit institution/course. Help tells users to sign out and use "Forgot password" (`screens/ProfileScreen.jsx:205-207`, `screens/HelpScreen.jsx:34`). → Add a Security card (`updateUser({ password })` with re-auth, and email change) and an editable institution and course, working toward the spec's 12-card "Your Blueprint" settings.
- [P2] [Function] EditProfile — An `auth.updateUser` error is ignored. After a save, AuthContext's `profile` isn't refreshed, so Home keeps the old name until remount (`screens/ProfileScreen.jsx:118-123`, `771-775`). → Check the error and call `refreshProfile()`.
- [P3] [Function] Profile — The version string is hard-coded as "v1.0.0" (`screens/ProfileScreen.jsx:760`). → Use `Constants.expoConfig.version` plus `Application.nativeBuildVersion`.
- [P3] [Looks] Profile — Stat colours `#1d4ed8`, `#15803D`, `#7C3AED`, `#F59E0B` and the sign-out `#DC2626` are hard-coded (`screens/ProfileScreen.jsx:572-574`, `666`, `755`, `915`).

## ResourceFinderScreen

- [P2] [Missing] ResourceFinder — Uploaded notes and past papers (often university copyright) have no report, copyright or takedown action. Files sit in a public bucket (`screens/ResourceFinderScreen.jsx:92-126`). → Add Report (`operations_flags`) and a copyright notice. Consider signed URLs, per the spec's File Uploads rule.
- [P2] [Function] ResourceFinder — It loads both tables in full and filters client-side, and errors are ignored (`screens/ResourceFinderScreen.jsx:34-47`). → Use a server-side `ilike`/`or` search with a limit.

## WeeklyBlueprintScreen

- The Deal Room "Upgrade to Pro" link-out is covered under Pricing (P0).
- [P1] [Looks] WeeklyBlueprint — Cream strip plus invisible status bar (`screens/WeeklyBlueprintScreen.jsx:824`).
- [P3] [Looks] WeeklyBlueprint — The crown colour `#F5BA0B` and other accents are off-palette (`screens/WeeklyBlueprintScreen.jsx:157`).

---

## Placeholder content across core screens (grouped, for #41's decision)

"Coming Soon" or placeholder UI shipping today:
- **CourseConnect:**
  - 6 "Course Tools" tiles (Essay & Writing, Referencing, Timetable, Module Tracker, Research Skills, Academic Integrity), `CourseConnectScreen.jsx:227-263`;
  - 4 "Across Ireland" tiles (Graduate Network, CAO Course Guide, Apprenticeship Connect, Industry Pathways), `375-399`;
  - 2 shell mentors, `293-305`;
  - 3 MockContentBanners, `706`, `734`, `776`.
- **Elevation:** shell coach cards with a "Coming Soon" badge (`ElevationScreen.jsx:~388-410`), and "Direct booking coming soon" (`282`). **CoachProfile:** the shell price chip "Coming Soon" (`CoachProfileScreen.jsx:512`).
- **Lifestyle:**
  - Partners: a "Coming Soon · Locked Until Launch" grid plus ComingSoonSheet (`LifestylePartnersScreen.jsx:149-158`), and greyed map pins in PartnerMap;
  - FeaturedDeals: "Photo coming soon" placeholders (`LifestyleFeaturedDealsScreen.jsx:137`).
- **WeeklyBlueprint:** the fashion page heading "Coming soon" when empty (`WeeklyBlueprintScreen.jsx:383`).
- **AdBoard / PartnerContactModal:** "Contact details coming soon" (`components/ads/PartnerContactModal.jsx:142-150`).
- **Messages:** the compose button's "1:1 DMs are coming soon" Alert (`MessagesScreen.jsx:257-263`, #48).
- **Directory:** the "Full profiles… coming soon" Alert (`DirectoryScreen.jsx:217`, #47).
- **ChatRoom:** "Block a user: Coming soon" (`ChatRoomScreen.jsx:102-109`, `269`, #29).
- **Profile:** the dead "Notifications" settings row (reported above).

---

## Missing (app-wide)

- [P1] [Missing] App-wide — There is no user-level block anywhere, and report is absent on ads, Module Q&A, and several board card types. App Store 1.2 requires filter, report, block, and published contact info for UGC apps. See the per-screen findings above; block is #29.
- [P2] [Missing] App-wide — Terms of Service and the Refund Policy are not reachable anywhere in-app after sign-up; only Privacy is (`PrivacyDataScreen.jsx:115`). → Add a "Blueprint Terms" card (Terms, Privacy, Refunds, Cookies) to Profile, as in the spec's settings card #11.
- [P2] [Missing] App-wide — There is no re-consent flow. `TERMS_VERSION` and `PRIVACY_VERSION` are recorded only at sign-up (`constants/legal.js:9-10`), so bumping them (which the CRO change will need, see below) never prompts existing users. → On launch, compare the latest `legal_acknowledgements.version` with the constants, and show an accept sheet if it is older.
- [P2] [Missing] App-wide — There is no offline banner or error boundary (see App shell).
- [P2] [Missing] Store config — `app.json` declares Android `READ_EXTERNAL_STORAGE` and `READ_MEDIA_IMAGES`. The image picker uses the system photo picker, so these are unnecessary, and `READ_MEDIA_IMAGES` triggers Google Play's Photo and Video Permissions declaration, a rejection risk. iOS declares `NSCameraUsageDescription` but the camera is never used. The iOS `privacyManifests.NSPrivacyCollectedDataTypes` is empty although the app collects email, name, photos, user content and user id (`app/app.json:12-35`, `41-44`). → Remove both Android permissions and the camera string. Declare the collected data types (they must match the App Store nutrition label). Add `ios.config.usesNonExemptEncryption: false`.
- [P3] [Missing] App-wide — There is no in-app app version or build number beyond the hard-coded Profile string, and no "What's new".

---

## Company registration (CRO) items (app only)

| # | Where | Current state | Needs to be supplied |
|---|---|---|---|
| 1 | In-app legal and data-controller naming. PrivacyDataScreen (`screens/PrivacyDataScreen.jsx:106-107`, `115-119`), About (`screens/AboutScreen.jsx:198-203`), Help (`screens/HelpScreen.jsx:69-83`), Pricing footnote (`screens/PricingScreen.jsx:198`), Profile footer (`screens/ProfileScreen.jsx:760`) | **Missing entirely in the app.** No screen names the data controller, company name, CRO number or registered office. Privacy says "Your rights … under GDPR" and links out. The website legal pages already state "UniBlueprint Ltd … a company registered in Ireland" and "UniBlueprint Ltd is the data controller" (`src/pages/legal/TermsPage.jsx:46-47`, `PrivacyPage.jsx:308`) before the company exists. The app's sign-up consent (`TERMS_VERSION '2026-06'`) is recorded against those pages. | Registered company name (UniBlueprint Ltd, **TBC**), CRO number and registered office address. Add a legal footer on About, PrivacyData and Profile: "UniBlueprint Ltd (TBC), registered in Ireland, company no. ______, registered office ______". After registration, bump `TERMS_VERSION`/`PRIVACY_VERSION` (`constants/legal.js:9-10`) and ship a re-consent flow. |
| 2 | Entity naming in liability and merchant copy. Carpool safety terms "UniBlueprint is not responsible…" (`screens/BoardDetailScreen.jsx:955-964`); investment disclaimer "UniBlueprint doesn't give financial advice…" (`screens/BudgetingScreen.jsx:1206`, `1277`); PostAdModal "reviewed by the UniBlueprint team" (`components/ads/PostAdModal.jsx:149`); Pricing "purchases are completed on uniblueprint.ie" (`screens/PricingScreen.jsx:198`); Profile "handled securely on the UniBlueprint website" (`screens/ProfileScreen.jsx:680-683`) | The operator is named only by the brand "UniBlueprint". There are no "©" strings in the app (none found). | Legal disclaimers and merchant copy should name the legal entity: "UniBlueprint Ltd (TBC)". Needs the registered company name. |
| 3 | Personal names as operator. About hero and founder note (`screens/AboutScreen.jsx:34`, `88`, `114`: "DESMOND, FOUNDER"); team "Legal Lead" and "Finance Lead" first names (`35-48`) | The founder's personal story stands in for the operating entity; no officers or directors are listed. Fine as marketing copy, but it is not an entity identification. | Keep it as story. Add the entity footer (row 1). Confirm directors and secretary names match the CRO filing if any title such as "Legal Lead" implies an officer role. |
| 4 | Contact emails. `uniblueprintoperations@gmail.com` is used across Help, FAQs, ChatRoom, Foundation, Elevation, Profile "Become a Coach", CourseConnect mentorship, WeeklyBlueprint, PartnerContactModal and `data/adBoardAds.js` (19 uses, already counted) | A personal-style **gmail** address is the only support, data-rights and operations contact. | A company-domain mailbox (for example `support@uniblueprint.ie`, plus `privacy@` for GDPR requests). Centralise it in `constants/site.js` (for example `CONTACT_EMAIL`) and replace all 19 uses. Needs a registered domain email under the company. |
| 5 | Third-party personal contacts bundled in the app: coach and partner gmail and phone numbers (`screens/ElevationScreen.jsx:187`, `206`, `264`; `data/lifestylePartners.js:44-527`) | Individual partners' personal emails and phones ship in the binary. | Not a CRO item as such, but the Ltd, as controller, needs written partner consent or a data-processing basis for publishing these, and a removal path without an app release (see Elevation). |
| 6 | `app/app.json`: `ios.bundleIdentifier` / `android.package` `com.uniblueprint.app`, `owner: "uniblueprint"` (Expo), `extra.eas.projectId 69a062e2-…` | The identifiers are fine and portable. Whether the Expo owner `uniblueprint` is a personal or organisation account is unknown from code. No App Store or Play listing yet. | Create an **Apple Developer Program Organization** account in the company's legal name, which needs a **D-U-N-S number** for UniBlueprint Ltd. Register the bundle id under that Team. Make the Expo owner an Expo **organisation** with company billing. |
| 7 | `app/eas.json` (`submit.production: {}`) | No `appleTeamId`, `ascAppId` or Play service-account configured, so submission assumes whoever runs `eas submit` interactively. | The organisation Apple Team ID and App Store Connect app id, plus a Google Play **organisation** developer account (also needs D-U-N-S and company verification) and its service-account key. |
| 8 | Universal links (`navigation/linking.js:13-17`: "needs Desmond's Apple Team ID…") | Tied to a personal Apple Team ID. | The organisation Team ID for `apple-app-site-association` and the release-key SHA-256 for `assetlinks.json` on uniblueprint.ie. |
| 9 | Privacy policy URL | `constants/site.js:9-10` points to `https://uniblueprint.ie/privacy`; `app.json` has no field (it is set in App Store Connect and Play Console). | Both store listings need the privacy policy URL, and the page must name the registered controller (row 1). Play's Data safety form and Apple's nutrition label must be submitted by the organisation account. |
| 10 | Payment and Stripe merchant naming. Checkout product names "UniBlueprint Pro (Monthly/Annual)" (`supabase/functions/create-checkout-session/index.ts:41-42`); Pricing "All prices include VAT where applicable" (`screens/PricingScreen.jsx:198`) | The merchant name on card statements and receipts comes from the Stripe account's business profile, which is currently unknown or individual. The "VAT included" claim assumes VAT registration. | Switch Stripe to a **company** account (UniBlueprint Ltd, TBC) with the CRO number, registered address and director KYC (coordinate with #40), and set the statement descriptor. Get a **VAT number** before claiming "VAT included" (or remove the line). Add the VAT number to receipts. |
| 11 | Trading name | The app trades as "UniBlueprint". If the registered name differs (for example "UniBlueprint Limited" or another name), the business name needs registering. | If the company name isn't exactly "UniBlueprint Ltd", register "UniBlueprint" as a business name (RBN1A form with the CRO). |
| 12 | Anything else that can't ship without a company | Apple Organization account (D-U-N-S); Google Play organisation account (D-U-N-S); Stripe company account (and Stripe Connect, #40); the company-domain email for Apple's review contact and support URL; the App Store "Seller" name, which will show the legal entity. | All of the above need the registered name, CRO number, registered address, D-U-N-S and VAT (if registered). |

---

## Severity summary (this file)

- **P0: 2.** The iOS external purchase links, grouped across Pricing, Profile and WeeklyBlueprint; and anonymous board posts leaking the poster's identity.
- **P1: 34**
- **P2: 68**
- **P3: 37**
- Plus 12 CRO rows, a grouped placeholder list for #41, and 15 cross-screen patterns.
