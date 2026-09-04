# Portals, Operations, and Dual-Portal System

**Status document.** Maps every item from `UniBlueprint_Subscription_Handler_Model.docx` onto what actually exists in this repository as of this build, what's real and tested, what's demo-wired and needs a live schema to go live, and what still needs a founder or legal decision before it can be built further. Pricing figures from the source document are intentionally omitted throughout — pricing has changed since that document was written and is being finalised separately. Nothing in this file should be read as a live price.

---

## 1. What's real vs what's demo

Three different levels of "done" appear in this build. Knowing which is which matters before anyone reports a feature as live.

| Level | Meaning | Where |
|---|---|---|
| **Live and tested** | Runs against a real Postgres instance, RLS proven with actual test users, not just written | `supabase/migrations/20260810120000_portal_roles.sql`, `20260810120100_portals_operations_schema.sql` |
| **Built, demo data** | Real component, real layout, real logic, but reads from a `DEMO` object instead of Supabase, because the tables it needs don't have real rows yet | Founder Dashboard, Operations Dashboard, Partner Portal, all Studio screens |
| **Spec only** | Described here, not yet code | Scheduled notification delivery (Ghost Handler welfare checks, Monday rota reminders, Sunday evening volume notice) — these need a deployed cron job, not just a database function |

---

## 2. Portals built

### Founder Dashboard — `src/pages/admin/FounderDashboardPage.jsx`
Route: `/admin/founder`, gated to `founder`/`admin` roles via `RequireRole`.

Strictly stats, no admin actions, per the brief. Top-line tiles, feature engagement ranking, 12-week signup growth, a Lifestyle partner impact table (views/claims/trend per partner — this is the source of truth for proving impact to partners), a coach impact table, a campus breakdown across the 12 institutions already in the codebase, and a retention snapshot.

### Operations Dashboard — `src/pages/admin/OperationsDashboardPage.jsx`
Route: `/admin/operations`, gated to `operations`/`founder`/`admin`.

Queue status tiles, the green/amber/red deadline urgency breakdown (with the Standard-elevated-to-red rule called out), an 8-handler roster table including a Ghost Handler flagged state, a dedicated Sunday Queue panel showing the cap formula, campus and service-type demand breakdowns, hottest outputs today/this week/this year, and the tier mix with the 10-position Standard-ticket protection zone.

### Lifestyle Partner Portal — `src/pages/portal/PartnerPortalPage.jsx`
Route: `/portal/partner`, gated to `business`/`operations`/`founder`/`admin`.

A partner's own views/claims/click-through, views over time, member engagement by institution, and the anonymized category benchmarking section ("top 20% of Fitness partners", category average vs your value). The database enforces the anonymization, not just the UI (see §4) — a business role's `get_all_partner_stats()` call returns nothing, only `get_my_partner_stats()` works, and that returns exactly one row.

### The Blueprint Studio / The Elevation Studio — `app/src/screens/studio/*`
The Handler and Coach professional workspace, reached via the `PortalSwitcher` in the app's `HomeScreen` top bar (Handlers and Coaches only). No student-facing submission forms exist anywhere in this directory, per the spec's "no path from work portal to personal submission" requirement.

- `StudioQueueScreen.jsx` — Handler ticket queue, tier and urgency badges
- `PromptLibraryScreen.jsx` — searchable prompts grouped by service type
- `AvailabilityScreen.jsx` — weekly availability template, Monday rota opt-in, clock in/out
- `SpecialismScreen.jsx` — declared confidence per service type + real performance
- `CoachStudioScreen.jsx` — "The Elevation Studio": bookings, client activity, earnings, specialisms
- `PortalSwitcher.jsx` / `ActiveMemberBadge.jsx` — shared components, reusable if a second entry point is ever needed

---

## 3. Schema — what shipped and how it was verified

`supabase/migrations/20260810120000_portal_roles.sql` and `20260810120100_portals_operations_schema.sql`. Not just written: applied against a real local Postgres 16 instance with the entire existing migration history replayed first, then exercised with real test rows. Specifically proven, not asserted:

- A free-tier test user querying `deals` directly (no app-level filter) returned **only** the 2 mental-health rows out of 9 total.
- A Pro test user querying the same table returned all 9.
- Inserting `coach` for a user who already holds `handler` raised the exclusivity error, not a silent double-role.
- A `business`-role test user's `get_my_partner_stats()` returned exactly their own partner; `get_all_partner_stats()` on the same session returned zero rows.
- A non-operations test user's `get_ops_queue_snapshot()` returned zero rows, no error, no leak.
- `ticket_urgency()`, `sunday_queue_cap()`, and `is_ghost_handler()` all returned correct values against seeded data.

What the migration adds, in brief:

- **Roles**: `business`, `founder` added to `app_role` (own migration file, ahead of everything that reads them — Postgres won't let a new enum value be read in the same transaction it was added in)
- **`partner_users`**: links a business login to the partner row it manages
- **`subscriptions.is_complimentary`**: distinguishes Active Member Pro Access from a paid subscription (see §7 on the benefit-in-kind question this exists to support)
- **`handler_availability`, `handler_shifts`**: weekly template + clock in/out + Ghost Handler detection
- **`handler_specialisms`**: confidence per service type, with the 10-ticket performance-replaces-training-score rule and the false-declaration step-down, both as real triggers
- **`prompt_library`**: Handler-only read, Operations-managed
- **Deadline urgency + queue priority**: `ticket_urgency()`, `compute_queue_priority()` — the Pro-above-Standard-capped-at-10 rule and the Standard-elevated-to-red rule, both as callable functions (see §5, these are not yet wired to run automatically)
- **`deals` RLS rewrite**: the two-layer Lifestyle Blueprint access control (§4)
- **`partner_performance_stats`, `ops_queue_snapshot`**: revoked views, only reachable through access-controlled functions

---

## 4. Lifestyle Blueprint access control, database level

This was explicitly flagged in the source spec as needing to be enforced "at the database query level regardless of UI state," and it now is. The `deals` table's old single permissive policy (any authenticated user, any active deal) is gone. In its place:

```sql
create policy "deals_mental_health_always_free" on public.deals
  for select to authenticated
  using (active = true and exists (
    select 1 from public.partners p where p.id = deals.partner_id and p.type = 'mental-health'
  ));

create policy "deals_pro_only_non_mental_health" on public.deals
  for select to authenticated
  using (active = true and not exists (
    select 1 from public.partners p where p.id = deals.partner_id and p.type = 'mental-health'
  ) and public.user_has_active_pro(auth.uid()));
```

Postgres OR's multiple permissive policies together. A free user's session satisfies only the first; a Pro user's satisfies both. This holds even if a compromised or buggy client tries to query `deals` directly — there is no code path, UI or otherwise, that can retrieve a non-mental-health deal for a free-tier session.

---

## 5. What still needs deployment, not more code

Three things are written and correct but inert until deployed to your actual Supabase project, which this session has no credentials for:

1. **Run the two migration files.** `supabase db push` (or the Supabase dashboard SQL editor, in order: `20260810120000_portal_roles.sql` then `20260810120100_portals_operations_schema.sql`).
2. **Scheduled jobs.** `compute_queue_priority()` and the Ghost Handler / Monday rota / Sunday flock notification timings all need a Supabase Edge Function on a `pg_cron` schedule to actually fire. The functions that decide *what* to do are written and tested; the thing that calls them on a clock is not, because that's a deployment artifact tied to your project, not portable code.
3. **Stripe webhook**: `stripe_payment_method_fingerprint` needs to be populated from Stripe's payment method fingerprint at subscription-creation time for the "same card can't back two active Pro subs" constraint to actually catch anything. The unique index is live; nothing writes to that column yet.

---

## 6. Multiple-account prevention — status per layer

| Layer | Status |
|---|---|
| 1. One account per verified email | Already enforced by Supabase Auth (unique email) |
| 2. Device fingerprinting | Columns added (`profiles.device_fingerprint`), nothing captures a value yet — needs a device-info library wired into sign-up |
| 3. Payment card linkage | **Live**: unique index on `stripe_payment_method_fingerprint` for active subscriptions. Needs Stripe webhook to populate the column (§5) |
| 4. Behavioural pattern detection | Not built. Reuse `operations_flags` (`target_type = 'account'`) once a detection job exists — the table's ready, the job isn't |
| 5. Phone verification | **Live**: unique index on `profiles.verified_phone`. Needs a phone-verification flow (Twilio or Supabase phone auth) to populate it |
| 6. Terms and Conditions prohibition | Legal drafting, not engineering — see the parked contract suite |

---

## 7. Flagged for Basmali / legal, not built further here

Per your instruction, legal work stays parked until Basmali replies. These items from Section 4 of the source document are structurally supported (the schema doesn't block any of the outcomes below) but the actual policy language, and in two cases the underlying legal question, still needs an answer:

- **Annual subscription "significant change" refund definition** — needs to be locked in the Terms before an annual plan can safely launch.
- **14-day cooling-off exclusion conditions** — when does using a Pro benefit exclude the cooling-off right.
- **App Store / Google Play external payment link, EU DMA** — whether directing users to the mobile browser for subscription qualifies as permitted external linking under current Apple/Google rules for EU apps. This is the item most worth prioritising with legal: get it wrong and the app risks App Store rejection or removal, not just a bad clause.
- **Lifestyle partner 30-day commission holding period** — needs confirming as sufficient under Irish/EU consumer law, and mental health / regulated services may need different treatment.
- **Partner exit obligations** — the exact clause covering both platform-payment and direct-discount-code models.
- **Active Member Pro Access, benefit-in-kind tax** — whether comped Pro access for active Handlers/Coaches is a taxable benefit in kind, and how it would need to be declared. `subscriptions.is_complimentary` exists specifically so Finance can separate this from real revenue once the answer comes back.
- **Session recording consent, wallet deletion disclosure, request-submission declaration** — all need Terms language; the mechanics (name-mismatch flagging, self-declaration checkbox column) are already in the schema.

None of this blocks the engineering work already shipped. It blocks turning any of it into something you can actually charge for or put in front of Apple's review team.

---

## 8. Notifications

`app/src/screens/NotificationsScreen.jsx` now reads the real `notifications` table (it was a hardcoded empty array before this build), with realtime subscription so new notifications appear without leaving the screen, and a live unread-count badge on the Home screen bell (the badge styles already existed in the code and were simply never wired to anything).

Category to icon mapping covers the existing `welcome` category plus the new ones this build introduces: `checkin_reminder`, `ghost_handler`, `sunday_flock`, `ticket_reassigned`, `subscription`, `wallet`. Actually inserting rows for the time-based categories (Monday 7:45am warning, Sunday 8pm volume notice, etc) is the scheduled-job work described in §5 — the display side is ready for them the moment they exist.

The in-app unverified-email banner (`UnverifiedEmailBanner.jsx`) is wired once at the tab-navigator level, above every tab, so it is genuinely on every screen without having been added to each screen individually. Known trade-off: because each screen already computes its own top safe-area padding independently, the banner adds a modest extra gap above each screen's own header while it's visible, rather than every screen being touched to account for it. Copy switches at the September 15 boundary per the spec; it's live now (dates are hardcoded to September 2026, which is still upcoming).

---

## 9. Session refresh on subscription change

`AuthContext` (both app and website) now subscribes to realtime changes on the signed-in user's own `subscriptions` row. The instant that row changes, the client updates its local `isPro` state and calls `supabase.auth.refreshSession()`. This is the practical equivalent of "access level updates in real time" — a literal server-forced JWT invalidation isn't something a client can do to itself, but the round-trip from webhook-driven database change to refreshed client session now happens in one realtime hop instead of waiting for the next login or the token's normal hourly refresh cycle.

---

## 10. Dynamic pricing copy

`useWeekendDeliveryCopy()` (both `app/src/hooks/` and `src/hooks/`) computes the 11pm-Saturday-to-8am-Monday window against Europe/Dublin time specifically, not device-local time, and re-checks every minute. Wired into `FoundationScreen.jsx`'s Premium turnaround display as the reference implementation. Not yet wired into every other page that shows Premium pricing/delivery copy — the hook is ready to drop into any of them the same way.

---

## 11. What to do next, in order

1. Run the two migrations against your real Supabase project.
2. Populate `handler_availability`, `handler_specialisms`, `prompt_library` with real rows (currently the demo dashboards read from `DEMO` objects, not these tables — once real rows exist, replace the `DEMO` reads with the corresponding Supabase queries page by page).
3. Assign real users the `founder`, `operations`, `business`, `handler`, `coach` roles via `user_roles` so the portals have someone who can actually see them.
4. Wire the Stripe webhook to populate `stripe_payment_method_fingerprint` and to write `subscriptions` changes (this table already exists and already has realtime enabled from before this build).
5. Deploy the scheduled Edge Function(s) for queue-priority recomputation and the time-based notifications in §5.
6. Once legal returns on §7, finalise the Terms language those items depend on.
