# UniBlueprint mobile app audit: Foundation builders, Studio, Portals

Scope: `app/src/screens/foundation/*`, `app/src/screens/studio/*`, `app/src/screens/portals/*`, and the shared code they use (`components/forms/*`, `components/ui/StudioTabBar.jsx`, `components/ui/ImageUploader.jsx`, `context/AuthContext.jsx`, `lib/supabase.js`, `hooks/useWeekendDeliveryCopy.js`, `utils/formatNumber.js`).
Live checks were run read-only against Supabase project `ozpeofkvnpikhopkgcxc` (information_schema, pg_proc, pg_policies, storage.buckets, list_edge_functions). No writes were made.
All paths are relative to `/home/user/UniBluePrint/app/src/` unless they are given in full.

---

## Cross-screen patterns (read first)

1. **The Foundation generation pipeline does not exist in production (#53 drift, local-only side).** None of the 9 tables the builders and Evidence Bank write to exist live: `cv_documents`, `cover_letters`, `application_forms`, `interview_prep_packs`, `job_search_sessions`, `linkedin_documents`, `personal_statements`, `portfolio_plans` and `evidence_bank_stories`. The same goes for the `submit_document_for_review` RPC and the `submissions.document_table/document_id/turnaround_deadline` columns it inserts. None of the 8 `generate-*` Edge Functions are deployed; the only live functions are `create-checkout-session` and `delete-account`. All of these exist only as local files (`supabase/migrations/20260723233000…20260730090000`, `supabase/functions/generate-*`). As a result, every builder fails at step 1 ("Could not save your answers" or a PostgREST relation error) after the student has answered every question, and Evidence Bank shows "No evidence saved yet" permanently.
2. **Builders never take payment.** The spec says "Foundation Blueprint → one-off payment at submission", and `constants/site.js` says money is handled on the website. Every builder still inserts, generates and queues with no checkout, and `submissions.paid` is never set. Premium ("priority queue, same-day") is free to select, and the error copy "you won't be charged twice" refers to a charge that never happens.
3. **One shared form engine (`components/forms/QuestionFlow.jsx`) with the same gaps everywhere.** Good news: all 8 builders look identical, because they share one step indicator, header, input style and button style. There are no "one polished, one bare" siblings. Bad news: every gap below repeats ×8:
   - No draft persistence, so answers are lost on swipe-down, Android back, a crash or an OS kill.
   - No confirm-before-discard.
   - The KeyboardAvoidingView is a no-op on Android (`behavior: undefined`). This is the same bug that commit 36f13db5 fixed in Campus Connect with `'height'` + `keyboardVerticalOffset: 24`.
   - The error box sits at the bottom of the scroll view, so on long steps it can be off-screen.
   - Header touch targets are 36px (the spec minimum is 44px).
   - Input font is 15px (the spec minimum is 16px).
   - No `maxLength`, although the server enforces `LIMITS` (SHORT 200, LONG 5000, PASTE_DOC 20000) and only reports a breach at the very end.
4. **The insert → generate → RPC sequence is non-idempotent and runs on the device** (every builder's `handleComplete`). If step 2 or 3 fails, the user retries and a new document row is inserted each time. Each retry also re-runs the LLM (cost), and steps that succeeded earlier are orphaned. Generation is a synchronous 30–60s `functions.invoke`, and backgrounding the app on iOS kills it. Fix: move the whole sequence into one server call (an `create_and_submit_<service>` RPC, or one `submit-foundation-request` Edge Function that inserts, enqueues and generates asynchronously), and keep the created `doc.id` in a ref so a client retry resumes rather than duplicates.
5. **The student never gets the document back.** `MyOutputsScreen` (`screens/MyOutputsScreen.jsx:72-77`) lists `submissions` status only. Rows are not tappable, and there is no viewer, download, share or PDF export, no "request changes" and no regenerate. `GenerationSubmittedScreen` promises a notification (#45, push is not built) and doesn't link to My Outputs.
6. **Supabase `{ error }` is ignored in most portal and studio writes.** Founder featured-content insert and delete, the photo upserts, the weekly-issue publish toggle and the Coach bio save all report success, or fail silently, whatever the actual result. Most reads treat an error as "empty": Evidence Bank, Ops GDPR, Partner stats, Weekly issues and the Founder metrics.
7. **Demo data is still shipped to staff** in CoachStudio (sessions, client activity, specialisms, "12 active clients / 9 bookings") and Availability (`activeTicketCount = 2`). StudioQueue's fake tickets are already #46. The live tables needed to replace them exist: `coach_bookings`, `coach_enquiries`, `handler_availability`, `handler_shifts`, `handler_queue`.
8. **React Navigation v7 `navigate()` no longer pops back.** It pushes, unless `{ pop: true }` or `popTo` is used (verified in `node_modules/@react-navigation/routers/src/StackRouter.tsx:377-388`). Every "My Blueprint" exit calls `navigation.navigate('HomeMain')`, in StudioTabBar, CoachStudio, Founder, Ops and Partner. Each exit therefore pushes a new HomeMain on top of the portal, so the stack grows on every switch and Back from Home returns into the portal. The same applies to `HomeScreen.jsx:148` (the other auditor's file). Fix: `navigation.popTo('HomeMain')` (or `navigate('HomeMain', undefined, { pop: true })`).
9. **Role gating relies only on the Home switcher and RLS.** No portal or studio screen checks `hasRole`. Today a student can't reach them:
   - The drawer (`navigation/SidebarDrawer.jsx:16-23`) has no portal entries.
   - `navigation/linking.js` maps no portal paths.
   - RLS blocks the data, but a non-staff user who lands there sees a half-working UI.
   Several Founder metrics are also wrong **for the founder** because of RLS (see Founder).
10. **Off-palette colours are hard-coded** (Tailwind amber, blue and green: `#EFF6FF`, `#FEF9C3`, `#F0FDF4`, `#FFFBEB`, `#B45309`, `#1d4ed8`, `#15803D`, `#4ADE80`, `#92610A`, `#F59E0B`, and more) in EvidenceBank, Specialism, Availability, StudioQueue, PromptLibrary, WeeklyIssueEditor, CoachStudio, Founder and Ops. `constants/theme.js` has no warning, info or tint tokens, so every screen invents its own. Fix: add `colors.warning/#B45309`, `warningBg`, `successBg`, `infoBg` (navy-tinted, e.g. `rgba(30,58,95,0.06)`) and `urgency.{red,amber,green}` to theme, then replace the literals.

Navigation-target check: every `navigate`/`replace` target in scope is registered in `navigation/index.jsx` HomeStack: `GenerationSubmitted`, `HomeMain`, `WeeklyIssueEditor`, `StudioQueue`, `PromptLibrary`, `Availability` and `Specialism`. **No dangling routes.**

#44 (Studio load error handling) verification: **the fix is incomplete.** PromptLibrary and Specialism render `loadError` correctly. CoachStudio sets `loadError` but never reads it (see CoachStudio).

---

## Shared form engine (affects all 8 builders)

- [P1] [Function] QuestionFlow — KeyboardAvoidingView uses `behavior: undefined` on Android. With Expo SDK 57 / RN 0.86 edge-to-edge, `adjustResize` no longer lifts content, so the footer "Continue" button and the lower textareas sit behind the keyboard (`components/forms/QuestionFlow.jsx:66-69`) → use `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` with `keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}`, the pattern from commit 36f13db5. Better still, adopt `react-native-keyboard-controller` app-wide.
- [P1] [Function] QuestionFlow — no protection against leaving:
  - The iOS modal swipe-down (`presentation: 'modal'`, `navigation/index.jsx:125-133`, gesture enabled by default) and the Android hardware back both close the whole flow at any step, silently discarding up to 15 answered steps.
  - The X button at step 0 (the CV personal-details step has 6 fields) also exits without asking (`QuestionFlow.jsx:48-52`).
  → Add `usePreventRemove(isDirty, …)` with an Alert ("Discard your answers?" / "Keep editing"), and set `gestureEnabled: false` on the builder screens. Also add a `BackHandler` so Android back means "previous step" when `index > 0`.
- [P1] [Missing] QuestionFlow + all builders — no draft autosave or resume. The comment at `QuestionFlow.jsx:15-17` promises "a future resume-where-you-left-off draft-save", but the values live only in `useState` in each builder (e.g. `CvBuilderScreen.jsx:263`) → persist `{values, index}` to AsyncStorage under `draft:<service>:<userId>` (debounced 500 ms, cleared on successful submit). On open, offer "Resume your draft?".
- [P1] [Function] QuestionFlow — the submit error, and every validation error, renders inside the ScrollView under the step body (`QuestionFlow.jsx:104-108`). On long steps (CV education with 2+ entries, the textarea steps) the student taps Continue and nothing visibly happens → render the error directly above the footer (outside the ScrollView), or call `scrollRef.current.scrollToEnd()` when an error is set.
- [P1] [Function] QuestionFlow — Skip bypasses `validate` on steps marked both `optional: true` and with a `validate` (CV `experience` step, `CvBuilderScreen.jsx:145,169-174`). A student who said "Yes, I do" have experience can Skip, and then generate-cv rejects the request at the end with "…or check 'I have no formal work experience yet'", which is web wording the app doesn't have (`supabase/functions/generate-cv/index.ts:286`) → hide Skip when `step.validate(values[step.key], values)` returns an error, or remove `optional` from that step.
- [P2] [Function] QuestionFlow — no length limits on any input, while the server enforces `LIMITS` (`supabase/functions/_shared/fieldLimits.ts:9-14`) and only reports a breach after the whole flow is done (`components/forms/FormControls.jsx:26-54`) → pass `maxLength` (200 short, 5000 long, 20000 for pasted CV/JD) and show a character counter on textareas.
- [P2] [Function] TagInput — text typed but not committed with "+" or Return is silently dropped when the user taps Continue. The skills step then errors with "Add at least 3 skills", although the user can see 3 typed (`FormControls.jsx:94-100`) → commit the draft on blur (`onBlur={commit}`), or have QuestionFlow flush pending tags before validating.
- [P2] [Looks] QuestionFlow — the header shows only a progress bar and "3/15". The service name ("CV Optimisation") and its price appear nowhere in the flow (`QuestionFlow.jsx:70-90`) → add a small eyebrow (e.g. `CV OPTIMISATION · STEP 3 OF 15`, DM Sans 12/600 uppercase per the spec) via a `title` prop.
- [P2] [Looks] QuestionFlow / EvidenceBank — header icon buttons are 36×36 (`QuestionFlow.jsx:147`, `screens/foundation/EvidenceBankScreen.jsx:540`), below the 44px minimum → 44×44, or add `hitSlop`.
- [P2] [Looks] FormControls — input text is 15px and labels 13px/600, but the spec says input ≥16px (it prevents iOS zoom and matches "Input text 15–16") and form labels 14px/500 (`FormControls.jsx:170,174`) → set fontSize to 16 and the label to 14 with `fonts.sansMedium`.
- [P2] [Looks] QuestionFlow — `paddingTop: insets.top + 8` inside a native iOS `presentation: 'modal'` (pageSheet) adds the status-bar inset to a sheet that already starts below it. The likely result is a large blank band above the progress bar (`QuestionFlow.jsx:70`; the same at `EvidenceBankScreen.jsx:290,341,413` and `GenerationSubmittedScreen.jsx:17`) → verify on an iPhone. If confirmed, use `Platform.OS === 'ios' ? 12 : insets.top + 8` for modal screens, or switch these routes to `presentation: 'fullScreenModal'`.
- [P3] [Looks] ChoiceGrid — the tier labels ("Premium — priority queue, same-day delivery") wrap to two lines inside 20px-radius pills on 320–375pt phones and look like broken chips (`FormControls.jsx:180-186`; used by every `TIERS` step) → render tier choices as full-width radio cards (the `RadioOptions` style from EvidenceBank) showing the price, the turnaround and a one-line description.
- [P3] [Looks] TagInput/RepeatingList — the chip remove "×" is 13px with no hitSlop (`FormControls.jsx:128-134`), and the entry remove button is about 23px (`components/forms/RepeatingList.jsx:55`) → add `hitSlop={10}`.
- [P3] [Function] RepeatingList — removing a filled entry (education or experience) has no confirmation or undo (`RepeatingList.jsx:19-22`) → confirm when the entry has any non-blank field.

## All 8 builders (common `handleComplete` flow)

- [P0] [Function] All builders — the target tables don't exist live, so the insert fails and nothing can ever be submitted (e.g. `screens/foundation/CvBuilderScreen.jsx:302-315`, `CoverLetterBuilderScreen.jsx:150-161`, `ApplicationFormBuilderScreen.jsx:113-124`, `InterviewPrepBuilderScreen.jsx:102-113`, `JobSearchSupportBuilderScreen.jsx:197-206`, `LinkedinBuilderScreen.jsx:153-163`, `PersonalStatementBuilderScreen.jsx:128-139`, `PortfolioPlanBuilderScreen.jsx:98-107`) → apply the local migrations `20260723233000_foundation_cv_builder.sql` through `20260730090000_job_search_support_pipeline.sql`, which include the `submissions` column additions and `handler_queue` wiring (#53, local-only side). Until then, hide the builder entry in FoundationScreen behind a feature flag.
- [P0] [Function] All builders — none of the 8 `generate-*` Edge Functions are deployed (live has only `create-checkout-session` and `delete-account`), so `functions.invoke` would 404 even once the tables exist (e.g. `CvBuilderScreen.jsx:319-324`) → `supabase functions deploy generate-cv generate-cover-letter generate-application-answers generate-interview-prep generate-job-search-support generate-linkedin generate-personal-statement generate-portfolio-plan`, and set their secrets.
- [P0] [Function] All builders — `submit_document_for_review` doesn't exist live (`CvBuilderScreen.jsx:328-335`, and the same in every builder) → it ships in the same local migrations as the tables above (defined in `supabase/migrations/20260726110000_handler_pipeline.sql`).
- [P0] [Function] All builders — no payment step. A student can submit Standard or Premium for free, `submissions.paid` stays false, and nothing blocks the handler queue (e.g. `CvBuilderScreen.jsx:326-337`; the RPC in `20260726110000_handler_pipeline.sql` never checks payment) → take payment before queueing: a Stripe PaymentSheet or a website checkout hand-off, with the RPC refusing to enqueue unpaid submissions. **Also get an App Store ruling:** AI-generated documents can be treated as digital content that needs IAP (guideline 3.1.1). Human-reviewed delivery supports the 3.1.3(d) person-to-person exemption, but frame it clearly.
- [P1] [Function] All builders — **what the student sees while the backend is missing:** they complete every step (up to 15 on CV), tap "Submit for review", and get a raw PostgREST message in the red error box, e.g. *"Could not find the table 'public.cv_documents' in the schema cache"*. `insertErr.message`, `genErr.message` and `submitErr.message` are passed straight to the UI (`CvBuilderScreen.jsx:315,323,335`; the same lines in every builder, rendered by `QuestionFlow.jsx:58-61,104-108`). The error is at least not silent and not a stuck spinner (the button re-enables), but it is technical, and the answers are lost the moment they close. Evidence Bank is worse: the load failure is **silent** (empty state), and only save shows the raw message → map errors to friendly copy ("We couldn't submit this right now. Your answers are saved on this device; please try again later."), log the raw error (Sentry #31), and keep the draft (see the autosave finding).
- [P1] [Function] All builders — the insert → generate → RPC sequence runs client-side and isn't idempotent. Every retry after a failure inserts a new orphan document row and re-runs the LLM (`CvBuilderScreen.jsx:269-338`, and the same pattern in all 8) → keep the created id in a `useRef` and skip the insert when resuming, or better, move to a single server-side submit that enqueues and generates asynchronously, so the client returns immediately and backgrounding can't kill it.
- [P1] [Function] All builders — while the 30–60s synchronous generation runs, the only feedback is the button text "Submitting…". There is no "this can take up to a minute, keep the app open" message and no progress state (`components/forms/QuestionFlow.jsx:130-132`) → show a full-screen "Preparing your draft…" state with that copy, or submit asynchronously as above.
- [P1] [Function] All builders — the Premium copy "same-day delivery" is wrong twice over:
  - The RPC sets a **24-hour** deadline (`20260726110000_handler_pipeline.sql`, `interval '24 hours'`).
  - Builders ignore the weekend window (Sat 23:00 to Mon 08:00, delivery Monday) that `hooks/useWeekendDeliveryCopy.js` computes and FoundationScreen already shows.
  (`TIERS` in every builder, e.g. `CvBuilderScreen.jsx:49-52`; `GenerationSubmittedScreen.jsx:24`) → build TIERS from `useWeekendDeliveryCopy()` and make the promised SLA match the DB deadline (either the copy says "within 24 hours" or the RPC's premium interval changes).
- [P1] [Function] All builders — the misleading error copy "you won't be charged twice for this" (e.g. `CvBuilderScreen.jsx:323`) → replace with "Nothing was submitted. Please try again." until payment exists.
- [P2] [Looks] All builders — the tier step shows no price, although FoundationScreen advertises €10/€15 trial pricing (€20/€30 list). The DB seeds say 2000/4000 cents, and the live `services.price_cents` is NULL (e.g. `CvBuilderScreen.jsx:253-258`) → show the price on each tier card, from one source of truth (the `services` table).
- [P2] [Function] All builders — the copy-pasted `isBlank`, `TIERS` and `handleComplete` skeleton, with the same service-name string built in 8 places, is how the Interview Prep name drifted (below) → extract a `submitFoundationRequest({ table, fnName, idKey, serviceTitle, tier, row })` helper in `lib/`.

## CV Optimisation — `screens/foundation/CvBuilderScreen.jsx`

- [P1] [Function] CvBuilder — "Targeting a specific role?" (target industry) is optional and skippable (`:215-228`), but generate-cv returns 422 "Target industry/field is required." when it is blank. The career-target fallback it relies on can't help, because `career_profiles` doesn't exist live (`supabase/functions/generate-cv/index.ts:136-141`). The student hits the error only after 15 steps, with an orphan row created → make Target industry a required field on that step (like LinkedIn's `_targeting` step) and drop `optional: true`.
- [P2] [Function] CvBuilder — "Roughly how much experience?" is still asked after the student answers "Not yet" to having experience (`:107-112`) → skip the step, or auto-set it to `none`, when `has_no_experience` is true (add a `skipIf(values)` to the QuestionFlow step contract).
- [P3] [Function] CvBuilder — only education entry #1 is validated. Additional blank or half-filled entries are sent as-is (`:133-139`, `:281`) → filter out entries whose fields are all blank before insert, and require institution + degree + year on any partially filled entry.
- [P3] [Function] CvBuilder — no email or phone format validation on the personal step (`:92-98`) → basic regex checks (email, and an IE/UK phone pattern with a leading +).
- [P3] [Function] CvBuilder — the header comment claims the fields "match generate-cv exactly", which the target-industry mismatch disproves (`:10-16`) → update the comment when fixing.

## Cover Letter — `screens/foundation/CoverLetterBuilderScreen.jsx`

- [P2] [Function] CoverLetterBuilder — step 3 asks "Do you have any work experience yet?" and step 4 then asks for "strongest, most relevant point" either way, which doubles the questions for no-experience students (`:70-92`) → acceptable, but consider merging: show the no-experience hint inline on step 4 and drop the separate yes/no step.
- (All shared/common findings apply; no other screen-specific defects.)

## Application Form Assistance — `screens/foundation/ApplicationFormBuilderScreen.jsx`

- [P1] [Function] ApplicationFormBuilder — generation hard-fails with "Add at least one story to your evidence bank first" (`supabase/functions/generate-application-answers/index.ts:115`). The builder never checks the story count up front and never links to Evidence Bank, so the student learns this only at submit time, after the row is inserted (`:39-51`, `:102-134`) → on mount, run `select count(*)` on `evidence_bank_stories`. If it's 0, show a blocking intro card with "Add a story first" → `navigation.navigate('EvidenceBank')`, and re-check on focus.
- [P2] [Looks] ApplicationFormBuilder — the first step is optional targeting with a 3-sentence subtitle carrying a critical prerequisite. The copy is buried (`:43`) → move the evidence-bank requirement into the gate above and shorten the subtitle.

## Interview Preparation — `screens/foundation/InterviewPrepBuilderScreen.jsx`

- [P1] [Function] InterviewPrepBuilder — the service name sent to the RPC is `'Interview Preparation — Premium' / '— Standard'` (`:130`), but the seeds are `'Interview Preparation — Standard Pack'` / `'— Premium Pack'` (`supabase/migrations/20260724130000_interview_preparation.sql:5-8`). The RPC looks up by exact name, so `service_id` ends up NULL: MyOutputs shows "Service", and handler specialism routing and pricing break → send the seeded names, or better, pass a `service_id`/slug instead of a display name.
- [P2] [Missing] InterviewPrepBuilder — the seeded "+ Mock Session" variants (€35/€55) aren't offered anywhere in the flow (`:24-27`) → add a "Include a live mock interview?" step, or remove those services.

## Job Search Support — `screens/foundation/JobSearchSupportBuilderScreen.jsx`

- [P2] [Looks] JobSearchSupportBuilder — 14 steps, 11 of them optional one-liners (location, timeline, urgency, CV status, LinkedIn status…). It is the longest flow for the least required input, and the progress bar crawls (`:77-166`) → group the optional context questions into 2–3 multi-field steps (e.g. "Your situation": location + timeline + urgency; "Where you're at": CV + LinkedIn + search stage).

## LinkedIn — `screens/foundation/LinkedinBuilderScreen.jsx`

- [P2] [Function] LinkedinBuilder — the key-skills validation message says "or go back and we'll top up from your profile", but validation still blocks fewer than 3, so the top-up path is unreachable. The server also merges with career-profile skills, and that table doesn't exist live (`:77`) → change the message to "Add at least 3 skills."
- [P3] [Looks] LinkedinBuilder — imports are ordered differently from its siblings, with `useState` imported after the local modules (`:1-5`). Cosmetic.

## Personal Statement — `screens/foundation/PersonalStatementBuilderScreen.jsx`

- [P2] [Looks] PersonalStatementBuilder — the pathway step subtitle is 3 long sentences (≈60 words) above 3 pills, and it overflows on small phones before the choices are visible (`:47`) → move the per-pathway explanation into each option (a radio card with a one-line description).
- [P3] [Missing] PersonalStatementBuilder — no "CAO (school leaver)" pathway. Only UCAS, CAO mature and postgrad are offered (`:18-22`) → confirm this is intentional for 5th/6th-year users, who are a core segment in the spec.

## Portfolio Plan — `screens/foundation/PortfolioPlanBuilderScreen.jsx`

- [P3] [Function] PortfolioPlanBuilder — the copy says "your Coach will double-check" (`:67`), while every other builder, and GenerationSubmitted, say "Campus Handler" → align the wording.

## Generation lifecycle / GenerationSubmitted — `screens/foundation/GenerationSubmittedScreen.jsx`

- [P1] [Function] GenerationSubmitted — the button says "Back to Foundation Blueprint", but `navigation.popToTop()` goes to **HomeMain**, the root of the Home stack (`:33-35`) → `navigation.popTo('Foundation')`, or relabel it "Back to Home".
- [P1] [Missing] GenerationSubmitted — no link to track the order. The student is never told where the result will appear (`:26-36`) → add a primary "Track in My Outputs" (`navigation.popTo('HomeMain')` then `navigate('MyOutputs')`, or `replace('MyOutputs')`) and make "Back to Foundation" the secondary action.
- [P1] [Function] GenerationSubmitted — "You'll get a notification the moment it's ready" depends on push (#45). Nothing in scope inserts into `notifications` on delivery (`:26-28`) → soften to "It will appear in My Outputs, and we'll email you", or wire an in-app `notifications` insert in `deliver_submission`.
- [P1] [Missing] MyOutputs (lifecycle, owned by the other auditor) — status tracker only. There is no document viewer, no PDF download or share (`expo-print` + `expo-sharing`), no "request changes" or regenerate, and no edit after delivery. Rows aren't tappable (`screens/MyOutputsScreen.jsx:146-148`) → add an Output detail screen that reads the delivered document (via `submissions.document_table/document_id` once migrated), with Share/PDF and a "Request a revision" action (Premium promises revisions, per `screens/FoundationScreen.jsx:~300`).
- [P2] [Missing] GenerationSubmitted — no order reference or receipt (see the CRO section) (`:21-28`) → show the submission id (short form), the tier, the amount paid and the expected delivery timestamp.
- [P3] [Looks] GenerationSubmitted — the title is 26px, where the spec's success state says 24px (`:44`) → 24.

## Evidence Bank — `screens/foundation/EvidenceBankScreen.jsx`

- [P0] [Function] EvidenceBank — `evidence_bank_stories` doesn't exist live. Loading errors are swallowed and shown as "No evidence saved yet", and saving fails (`:162-168`, `:216-227`) → apply `20260724120000_application_form_assistance.sql` + `20260915130000_evidence_bank_story_category.sql` (#53, local-only side).
- [P1] [Function] EvidenceBank — the delete (trash icon) runs immediately with no confirmation. It is a destructive, irreversible loss of a written STAR story, and a failed delete silently reappears with no message (`:276-282`, `:346-348`) → `Alert.alert('Delete this story?', …, [{text:'Cancel'},{text:'Delete', style:'destructive', …}])`, and toast "Couldn't delete" on error.
- [P1] [Function] EvidenceBank — the detail/edit view has 5 multiline inputs in a plain `View`/`ScrollView` with no KeyboardAvoidingView, so "What happened as a result?" and "Save changes" end up behind the keyboard (`:338-405`) → wrap in a KeyboardAvoidingView (padding/height as above), and set `automaticallyAdjustKeyboardInsets` on the iOS ScrollView.
- [P1] [Function] EvidenceBank — the add flow's KeyboardAvoidingView is a no-op on Android (`:289`) → the same fix as QuestionFlow.
- [P1] [Function] EvidenceBank — the add flow and detail edits are local state inside a modal route. Swipe-down or Android back closes the screen and loses a half-written story. "Cancel" in the detail view discards edits without asking (`:199-203`, `:389`) → intercept back/swipe with `usePreventRemove` when in `add`/`detail` mode (return to list mode instead), and confirm discard when the draft is dirty.
- [P2] [Function] EvidenceBank — the stat counts turn errors into `0`, and they count every `application_forms`/`interview_prep_packs` row, including failed or orphaned drafts from retries (`:176-183`) → count via `submissions` (by service) or filter `status <> 'draft'`, and show "–" on error.
- [P2] [Function] EvidenceBank — a load error shows the empty state, with no error message or retry (`:167`) → add a `loadError` state with a "Try again" button (the pattern PromptLibrary uses).
- [P2] [Looks] EvidenceBank — off-palette stat icon backgrounds `#EFF6FF`, `#FEF9C3`, `#F0FDF4`, plus a gold banner border (`:439,446,453,549`) → use `colors.cream` circles (spec: "icon containers … background #F5F0E8 on white card"), 40px round, not 30px squares.
- [P2] [Looks] EvidenceBank — category tile labels are 10.5px ALL-CAPS ("ACHIEVEMENTS", "LEADERSHIP") at `width:'31%'`, and they clip or wrap on 320pt devices (`:568-572`) → 12px sentence case, or a 2-column grid under 360pt width.
- [P3] [Missing] EvidenceBank — `competency_tags` is always saved as `[]`, and no search or filter exists as the bank grows (`:224`) → add optional competency tags later; they improve application-answer matching.

---

## Studio: Handler (The Blueprint Studio)

### StudioQueue — `screens/studio/StudioQueueScreen.jsx`
- (Fake tickets are **#46**, so not re-reported. Items below are additional.)
- [P1] [Function] StudioQueue — the "Online / Clock Out" toggle is local `useState(true)`: never persisted, and inconsistent with AvailabilityScreen's own separate `clockedIn` (default **false**). A handler sees "Online" here and "Clocked Out" on the next tab (`:97`, `:109-116`) → a single source of truth: read and write the open `handler_shifts` row (exists live: `checked_in_at`, `clocked_out_at`) through a shared `useHandlerShift()` hook used by both screens.
- [P2] [Looks] StudioQueue — the tier badge says "Pro" (gold `#FEF9C3`/`#92610A`), while students buy "Premium", so the terminology differs across the pipeline (`:17-38`, `:201-203`) → use "Premium", with the navy status-badge style from the spec (rgba(30,58,95,0.08), 10px/700 uppercase).
- [P2] [Looks] StudioQueue — the header stacks paddingBottom 16 + StudioTabBar paddingBottom 14, which is visibly heavier than other headers (`:155`, `components/ui/StudioTabBar.jsx:73`) → drop one of them.

### Availability — `screens/studio/AvailabilityScreen.jsx`
- [P1] [Function] Availability — nothing is saved. The weekly template, the Monday-rota opt-in and clock-in are all local state and reset on every visit. `handler_availability` (weekday, start_time, finish_time, max_tickets, rota_opt_in) and `handler_shifts` exist live with handler-own RLS (`:141-168`) → load and upsert `handler_availability` per weekday (debounced autosave, or an explicit "Save template" button with a saved toast). Clock in and out by inserting/updating `handler_shifts`.
- [P1] [Function] Availability — `activeTicketCount = 2` is hard-coded demo data that drives the clock-out warning ("You have 2 active tickets…") (`:147-149`, `:156-165`) → count `handler_queue` rows where `handler_id = user.id and picked_at is not null` (or the equivalent submissions stage).
- [P2] [Looks] Availability — the custom toggles use `accessibilityRole="button"` + `selected` instead of a switch role. The time-stepper arrows are 24×24 and the ticket steppers 20×20, well below the 44px target (`:81-90`, `:252-261`, `:399`, `:412`) → use the RN `Switch` (as WeeklyIssueEditor does), or `accessibilityRole="switch"` + `accessibilityState={{checked}}`, and 44px hit areas (`hitSlop`).
- [P2] [Looks] Availability — Tailwind amber/green literals throughout (`:323-330`, `:346-350`, `:367`) → theme tokens.
- [P3] [Function] Availability — the ghost-warning mailto uses a personal Gmail (see the CRO section) (`:202-207`).

### Prompt Library — `screens/studio/PromptLibraryScreen.jsx`
- #44 verified fixed here: `loadError` is rendered (`:116-117`).
- [P2] [Function] PromptLibrary — tapping anywhere on a card copies it immediately, and the prompt is truncated to 2 lines with no way to read it in full before copying (`:27-31`) → tap opens a detail sheet with the full prompt and a "Copy" button. Keep the copy icon as a separate 44px target.
- [P2] [Function] PromptLibrary — `Clipboard.setStringAsync` has no try/catch, so a failure throws an unhandled promise rejection (`:20-24`) → try/catch with an Alert.
- [P3] [Function] PromptLibrary — the error state has no retry button, and there's no pull-to-refresh (`:116-117`) → add both.
- [P3] [Looks] PromptLibrary — the search input is 14px (the spec minimum is 16), and the copied-state tint is `#F0FDF4` (`:161`, `:179`).

### Specialism — `screens/studio/SpecialismScreen.jsx`
- #44 verified fixed here.
- [P2] [Function] Specialism — `if (!user?.id) return` leaves `loading` true forever, an infinite spinner if auth isn't ready (`:72-74`) → `setLoading(false)` in that branch, or wait on `useAuth().loading`.
- [P2] [Looks] Specialism — shows "★ 0.0 Average Rating" when `tickets_completed = 0`, which reads like a bad rating (`:50`, `:87`) → show "—" / "No ratings yet".
- [P2] [Looks] Specialism — the confidence chips and info card use Tailwind blue, green and amber (`#1d4ed8`, `#EFF6FF`, `#BFDBFE`…), and blue is off-brand (`:18-22`, `:164`) → navy status badges (the spec's "Status badge"), differentiated by label, or navy/success/warning tokens.
- [P3] [Function] Specialism — the average is `rating_sum / tickets_completed`, but not every ticket gets rated (`handler_ratings` exists), so the average is understated when ratings are missing (`:87`) → divide by a rating count (add `ratings_count`, or use the `handler_rating_summary` view).

### StudioTabBar — `components/ui/StudioTabBar.jsx`
- [P1] [Function] StudioTabBar — "My Blueprint" calls `navigation.navigate('HomeMain')`, which in React Navigation v7 **pushes** a new HomeMain on top of the Studio (`:34-37`) → `navigation.popTo('HomeMain')`.
- [P2] [Looks] StudioTabBar — the "My Blueprint" exit is 12px text with no padding or hitSlop, about 16px tall (`:86-91`) → `paddingVertical: 12` or `hitSlop={12}`.

## Studio: Coach (The Elevation Studio) — `screens/studio/CoachStudioScreen.jsx`

- [P1] [Function] CoachStudio — **#44 regression/incomplete.** `loadError` is set (`:42`, `:59`, `:65`) but never rendered. A network or RLS error falls through to `!profile` and tells a linked coach "Your coach profile hasn't been linked yet. Contact Operations" (`:96-102`) → add a `loadError ? <Text>Couldn't load your profile. Try again.</Text> + retry` branch before `!profile`.
- [P1] [Function] CoachStudio — the bio save swallows every error (`catch {}`). The spinner stops and nothing is shown, so the coach believes it saved (`:73-85`) → set a `saveError` and render it, e.g. "Couldn't save. Please try again."
- [P1] [Function] CoachStudio — demo data shown to real coaches as if it were theirs:
  - "Upcoming sessions" (Ruth, Cian, Molly, Tadhg with fixed August dates)
  - "Client activity"
  - "Your specialisms"
  - Header counts "12 Active Clients / 9 Bookings", plus "Sessions Delivered 9" in Earnings
  (`:17-31`, `:150-151`, `:194-208`, `:217-227`, `:243`, `:262-266`). This is separate from #46, which covers the handler queue only → read `coach_bookings` (exists live, with coach-own RLS via `coach_profiles.coach_slug`) for sessions and counts, `coach_enquiries` for activity, and `coach_profiles.specialisation` for specialisms. Show empty states when there's no data.
- [P1] [Function] CoachStudio — the bio TextInput sits at the bottom of a long ScrollView with no KeyboardAvoidingView, so the Save button and the text being typed are hidden by the keyboard (`:114-123`, `:182-186`) → KeyboardAvoidingView + `automaticallyAdjustKeyboardInsets`, or scroll into view on focus.
- [P1] [Function] CoachStudio — "My Blueprint" uses `navigate('HomeMain')`, which pushes in v7 (`:153-156`) → `popTo('HomeMain')`.
- [P2] [Missing] CoachStudio — no StudioTabBar and no navigation to anything. A coach has a single scrolling page and can't manage availability or bookings (Availability is handler-only). The "View Full Earnings Breakdown" CTA is an Alert placeholder (#41-style) (`:246-253`) → at minimum, hide the CTA until payouts exist (#40), and add a bookings list with accept/decline (`coach_bookings` has coach UPDATE RLS).
- [P2] [Function] CoachStudio — the bio has no `maxLength` and no character counter (`:114-123`) → `maxLength={1000}` with a counter.
- [P3] [Looks] CoachStudio — the saved text is `#15803D` (off-palette), where the spec success colour is `#16A34A` (`:367`) → `colors.success`.

---

## Portals

### Founder — `screens/portals/FounderPortalScreen.jsx`
- [P1] [Function] Founder — the Platform metrics are wrong because of RLS (live has 11 users, 0 subscriptions, 1 `user_roles` row; the founder would see **Total Users = 1**):
  - `profiles` count → RLS "Users can read own profile", so **Total Users always = 1**.
  - `user_roles` → "Users can read own roles", so the role pills show only the founder's own roles.
  - `subscriptions` count → "Users can read own subscription", so **Active Pro Members = 0 or 1**.
  (`:212-224`, `:262-274`) → add a SECURITY DEFINER RPC `get_founder_platform_stats()` gated on `has_role(auth.uid(),'founder')`, returning total users, counts by role and active Pro count (the same pattern as `get_ops_queue_snapshot`).
- [P1] [Function] Founder — `load()` has no try/catch and ignores every `{error}`. A network failure leaves the dashboard on "—" forever with no message, and RLS failures render as zeros (`:209-237`) → wrap it in try/catch, and track per-section errors with a "Couldn't load, retry" row.
- [P1] [Function] Founder — Spotlight "Add to carousel" ignores the insert error and closes the modal as if it succeeded (`:184-197`). "Remove" (trash) deletes with no confirmation and removes the row from the UI even if the delete failed (`:199-202`, `:339-347`) → check `error` and Alert on failure. Confirm before removing, and only remove from state after success.
- [P1] [Function] Founder — "My Blueprint" uses `navigate('HomeMain')`, which pushes in v7 (`:204-207`) → `popTo('HomeMain')`.
- [P2] [Function] Founder — the photo upserts ignore errors (`:80-89`). A partner upsert can also collide with `partners_name_key UNIQUE(name)` when a row with the same brand name but a different slug exists, and it creates partner rows with `type = NULL` (the Partner Portal then shows "Uncategorised") → check `error` and Alert. Look up the existing row by name or slug first, and pass `type`.
- [P2] [Function] Founder — photos are uploaded to a fixed path (`<slug>/photo.jpg`, upsert), so the public URL never changes. CDN and RN `Image` caches keep serving the old photo, which contradicts the copy "updates it live for every user" (`:113-120`; `components/ui/ImageUploader.jsx:168-181`) → store `publicUrl + '?v=' + Date.now()`, or upload to a versioned path.
- [P2] [Function] Founder — the Add-to-Spotlight modal (caption TextInput + confirm button) has no KeyboardAvoidingView, so the confirm button is hidden behind the keyboard on smaller phones (`:401-462`) → wrap the sheet in a KeyboardAvoidingView.
- [P2] [Looks] Founder — the dashboard looks unfinished:
  - The metrics row is a bare 2-up card.
  - The GDPR count is a single centred number.
  - There are no trends, date ranges or links from the metrics to anything actionable.
  - The primary button uses pill radius (`radius.pill`) instead of the spec's 8px (`:261-303`, `:540`).
  → Add tap-through from Request Queue and GDPR to the Ops screen. Use `radius.button` for primary buttons, and add a "last updated" stamp with pull-to-refresh.
- [P3] [Function] Founder — the Spotlight list shows inactive or expired rows with no status (the founder can read all rows via the ALL policy), so a pinned item that no longer appears on Home looks live (`:167-174`, `:332-349`) → show an "Active / Scheduled / Expired" badge from `active/starts_at/ends_at`.

### Operations — `screens/portals/OperationsPortalScreen.jsx`
- [P1] [Function] Ops — `loadGdpr` ignores `{error}`, and on failure the card says **"Nothing pending."** This is a compliance risk, because a statutory DSAR can be missed if RLS or the network fails (`:42-50`, `:137-138`) → track `gdprError` and render "Couldn't load GDPR requests, retry" in red.
- [P1] [Function] Ops — "Nothing pending." and "No enquiries yet." render during the initial load, before the fetch resolves. There's no loading state at all (`:30-32`, `:78-92`) → add a `loading` flag with ActivityIndicator, and add pull-to-refresh.
- [P1] [Function] Ops — "My Blueprint" uses `navigate('HomeMain')`, which pushes in v7 (`:37-40`) → `popTo('HomeMain')`.
- [P2] [Function] Ops — GDPR is limited to 10 rows with no "showing 10 of N" indicator (`:48`), while Founder shows the full count → show the total and a "View all".
- [P2] [Function] Ops — marking a **deletion** request done only flips `status`. There's no link to the `delete-account` Edge Function (deployed live) and no export action for **export** requests, so an operator can mark it complete without doing it (`:57-76`) → for `deletion`, show a "Run account deletion" action (with confirmation) before allowing Mark Done. For `export`, generate or attach the export.
- [P2] [Function] Ops — the KeyboardAvoidingView in the Mark-done sheet uses `undefined` on Android, and the sheet has a fixed `paddingBottom: 34` instead of `insets.bottom` (`:180`, `:270`) → `'height'` on Android, and `paddingBottom: insets.bottom + 16`.
- [P2] [Missing] Ops — the "Operations Queue" screen has no queue list, assignment or reassignment. It shows only counts (the handler-side queue is #46) (`:112-130`) → add a submissions list (stage, deadline, urgency, handler) with assign/reassign via the existing pipeline RPCs.
- [P2] [Missing] Ops — coach enquiries are read-only rows showing only coach name, status and date. The message, the student and any status action are missing, although RLS grants Ops UPDATE (`:84`, `:165-174`) → add a detail sheet with the message and "Mark contacted / Closed" actions.
- [P2] [Missing] Ops — no link to the Weekly Issue Editor, although Ops has full RLS on `weekly_issues`/`weekly_issue_content`. Only Founder links to it, and the editor's back label is hard-coded "Founder Dashboard" → add an entry card, and make the back label generic ("Back").

### Partner — `screens/portals/PartnerPortalScreen.jsx`
- [P1] [Function] Partner — the metrics are **always 0**. `partner_performance_stats` counts `activity_events` of type `partner_deal_viewed` / `partner_deal_claimed`, but nothing in the app, the website or the Edge Functions ever inserts those events (grep: only labels in `src/pages/admin/FounderDashboardPage.jsx`) (`:73-89`) → log `activity_events { type:'partner_deal_viewed'|'partner_deal_claimed', detail: partners.id }` from LifestylePartners, FeaturedDeals and the deal-claim handler. Note that `detail` must be the partners **uuid**, not the static slug.
- [P1] [Function] Partner — the RPC `{error}` is ignored, and any failure shows "Your account isn't linked to a partner listing yet. Contact Operations" (`:27-35`) → handle `error` separately with a retry. Also add `.catch`, because loading never clears on a rejection.
- [P1] [Function] Partner — "My Blueprint" uses `navigate('HomeMain')`, which pushes in v7 (`:19-22`) → `popTo('HomeMain')`.
- [P2] [Function] Partner — the "THIS PERIOD" label is wrong, because the view is all-time with no date filter (`:71`; the view definition has no time predicate) → relabel "ALL TIME", or add a period parameter to the RPC.
- [P2] [Looks] Partner — the portal looks unfinished: two numbers and one card. There's no deal list, logo, payout history (`partner_payouts` exists live), terms, or contact (`:67-95`) → add the partner logo and name header, a list of their live deals, payouts, and a "Contact your partner manager" action.

### Weekly Issue Editor — `screens/portals/WeeklyIssueEditorScreen.jsx`
- Publishing **does work**: the `published` toggle updates `weekly_issues.published`, and `get_current_weekly_issue()` serves the most recent published issue by `week_of`.
- [P1] [Function] WeeklyIssueEditor — the page has 20+ text inputs and multi-line textareas and no KeyboardAvoidingView, so the lower fields (Founders' Note, Blueprint Feature) are typed blind behind the keyboard (`:232`) → KeyboardAvoidingView + `automaticallyAdjustKeyboardInsets`.
- [P1] [Function] WeeklyIssueEditor — 10 independent per-card "Save" buttons, no dirty tracking, and no guard. Tapping "All Issues", Android back or swipe-back discards all unsaved cards silently (`:170-180`, `:189-192`) → track dirty page keys and show a sticky "Save all (3 unsaved)" bar. Confirm on leave with `usePreventRemove`, or autosave each card on blur.
- [P1] [Function] WeeklyIssueEditor — the "Published" switch makes the issue live to every student instantly: no confirmation, no check for unsaved cards, and a failed update just snaps the switch back with no message (`:161-168`, `:248-252`) → Alert "Publish Issue N to all students?". Block it while cards are dirty, and Alert on error.
- [P2] [Function] WeeklyIssueEditor — publishing next week's issue early immediately replaces the current live issue, because `week_of` = next Monday and the RPC picks the latest published issue. There is no scheduling, and the list doesn't show which issue is **currently live** (several can be "Live") (`:146-159`, `:222-226`) → mark "Currently showing" on the issue the RPC would return, and add `publish_at`, or only serve issues with `week_of <= current_date`.
- [P2] [Function] WeeklyIssueEditor — `openIssue` sets `activeIssue` before the content fetch resolves, so for a moment the previous issue's content is shown (and saveable) under the new issue's header. Fetch errors are ignored (`:138-144`) → `setContent({})` plus a loading state before fetching, and handle errors.
- [P2] [Function] WeeklyIssueEditor — `loadIssues` ignores errors and shows "No issues yet. Create the first one" (`:129-134`). `createIssue` has no busy state, so a double-tap hits `weekly_issues_issue_number_key UNIQUE`. If the list failed to load, `nextNumber` = 1 collides (`:146-159`) → surface the error, disable the button while creating, and compute the next number server-side (`max(issue_number)+1` in an RPC or a DB default).
- [P3] [Looks] WeeklyIssueEditor — hints expose dev internals ("Matches a slug in src/data/blogPosts.js on the website", `:33`) and a real third party's name as example copy ("Zainab Adeyemi (Soft Life Investing)", `:54`) → rewrite as user-facing hints, e.g. "The blog post's URL slug, e.g. back-to-campus-guide", with a neutral example name.
- [P3] [Looks] WeeklyIssueEditor — the "lines" textarea format ("Institution | Event | Date | Location") is error-prone, with no preview or validation of the pipe count (`:84-100`) → a per-line pipe-count warning, or a "Preview this page" link to WeeklyBlueprintScreen.

### Role gating (portals and studio)
- [P2] [Function] All portal/studio screens — no in-screen role guard. Access is limited only by HomeScreen showing the switcher (`screens/HomeScreen.jsx:140-149,408`). Neither the drawer nor `navigation/linking.js` exposes these routes today, so a student **cannot** reach them in practice, and RLS blocks the data. But any future deep link, notification tap or dev path would render a staff UI with misleading zeros, and writes that fail silently (see the ignored errors above) → a `RequireRole({ roles:['founder'] })` wrapper, or a check at the top of each screen: if the role is missing, `navigation.replace('HomeMain')`. Also gate by `useAuth().roles` loading, so a staff user isn't bounced before roles resolve.

---

## Shared lib / context / utils

- [P2] [Function] AuthContext — `loadRolesAndSubscription` ignores errors. If the `user_roles` fetch fails, staff silently lose the portal switcher until they restart the app (`context/AuthContext.jsx:27-32`) → retry on failure, or re-run on AppState `active`.
- [P3] [Function] AuthContext — every foreground calls `refreshSession()`, which fires `TOKEN_REFRESHED`, which then re-fetches roles and profile, flips `profileLoading` to true, and tears down and re-creates the realtime channel (`:90-104`, `:112-121`). Any UI keyed on `profileLoading` flickers on each app resume → in `onAuthStateChange`, only reload on `SIGNED_IN`/`USER_UPDATED` when the user id changed. Skip the channel re-subscribe if it's the same user.
- [P2] [Function] lib/supabase — silently falls back to `https://placeholder.supabase.co` / `placeholder-key` when the env vars are missing, so a mis-configured build fails with opaque network errors on every screen in scope (`lib/supabase.js:4-5`) → `if (!url || !key) console.error(...)` in dev and show a blocking "Configuration error" screen, rather than calling a placeholder host.
- [P3] [Function] useWeekendDeliveryCopy — `hour12:false` can return `"24"` at midnight on some ICU builds, so Monday 00:00–00:59 is treated as outside the window (`hooks/useWeekendDeliveryCopy.js:17-19`) → use `hourCycle: 'h23'`.
- [P3] [Function] ImageUploader — fixed-path upsert, so the URL never changes and caches go stale (see Founder); coach self-edit is affected too (`CoachStudioScreen.jsx:105-112`) → versioned URL.
- utils/formatNumber: no issues.

---

## Company registration (CRO) items

Items in these screens that name a person or personal mailbox rather than the company, or that are blocked on (or must change for) a registered company.

- [P1] [Missing] All 8 builders + GenerationSubmitted — **no receipt or invoice of any kind.** Once the payment step (above) is added, every Foundation order needs a receipt or invoice showing: the registered company name, the CRO number, the registered office address, and the VAT number with the VAT breakdown if VAT-registered. The tier step also needs VAT-inclusive pricing. (`GenerationSubmittedScreen.jsx:21-36`; tier steps e.g. `CvBuilderScreen.jsx:253-258`; `submissions.amount_cents/paid` exist but are unused.) **Needs: registered company name + CRO number + registered office address + VAT number (if registered).**
- [P1] [Function] Availability — the "Contact Operations" mailto and fallback text use a personal Gmail: `uniblueprintoperations@gmail.com` (`screens/studio/AvailabilityScreen.jsx:203,206`). The same address appears in the FoundationScreen order-fallback mailto (`screens/FoundationScreen.jsx:330`, the other auditor's screen). **Needs: a company-domain operations mailbox (e.g. operations@uniblueprint.ie), ideally a single constant in `constants/site.js`.**
- [P1] [Missing] CoachStudio earnings — "Full earnings breakdowns arrive once payments are live" (`CoachStudioScreen.jsx:237-253`). Coach payouts (#40, Stripe Connect split) need the platform Stripe account in the company's name. Coaches, as contractors, also need payout statements and self-billing invoices that name the company as payer. **Needs: registered company name + CRO number + company bank account / Stripe platform account in the company name + VAT number (if registered) on payout statements; the coach contractor agreement must name the company as the contracting party.**
- [P1] [Missing] Partner Portal — no partner terms, agreement reference, contracting entity or payout remittance. `partner_payouts` exists live, but none of it is surfaced (`PartnerPortalScreen.jsx:67-95`). **Needs: registered company name + CRO number + registered office on the partner agreement and payout remittances. Add a "Partner terms" link (`constants/site.js` WEBSITE_LINKS) that names the company.**
- [P2] [Function] Handler Studio (Availability rota copy, StudioQueue) — handler obligations ("Mandatory 8am check-in", auto-removal from rota) are stated in-app with no reference to which entity engages the handler (`AvailabilityScreen.jsx:246-268`) → link the handler agreement. **Needs: registered company name as the engaging party.**
- [P2] [Missing] Weekly Issue Editor / The Weekly Blueprint — the in-app magazine has no publisher imprint. The Founders' Note is "in your own voice" (a personal byline is fine), and the Financial Tip page publishes third-party money tips with no company disclaimer (`WeeklyIssueEditorScreen.jsx:51-57,78-81`) → add a fixed imprint and disclaimer line: "Published by <Company> Ltd, CRO no. …, registered office …. General information, not financial advice." **Needs: registered company name + CRO number + registered office.**
- [P2] [Function] Terms/Privacy consent versions — when the Terms and Privacy pages are re-issued naming the company as operator and data controller, `TERMS_VERSION` / `PRIVACY_VERSION` must be bumped to force re-consent (`constants/legal.js:10-11`). The Ops GDPR screen processes DSARs on behalf of the controller, which must be the company (`OperationsPortalScreen.jsx:132-159`). **Needs: registered company name + CRO number as data controller in the Privacy policy; then bump both versions.**
- [P3] [Function] Generated documents — the generate-* prompts and outputs carry no operator footer (correct for a CV or cover letter body). Any future PDF export or delivery cover sheet in My Outputs, though, must carry "Prepared by <Company> Ltd" rather than a person. **Needs: registered company name (+ CRO number on the delivery email footer).**
- [P3] [Function] Cross-reference (outside this scope, flagged because it assumes an individual): `navigation/linking.js:14-15` refers to "Desmond's Apple Team ID". The Apple Developer and Google Play accounts should be enrolled as an **Organisation** (which needs a D-U-N-S number for the CRO-registered company) so the store seller name is the company, not a person. `supabase/functions/notify-team-submission/index.ts:22` routes to `uniblueprint26@gmail.com`. **Needs: registered company name + D-U-N-S + a company-domain inbox.**

---

## Severity counts

| Severity | Count |
|---|---|
| P0 | 5 |
| P1 | 47 |
| P2 | 53 |
| P3 | 24 |
| **Total** | **129** |

The CRO section contributes 9 of these: 4 P1, 3 P2 and 2 P3. Counted by grep over the bullet prefixes.
