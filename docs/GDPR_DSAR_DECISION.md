# GDPR / DSAR tooling: custom vs. dedicated platform

**Decision: stick with the custom Supabase-based system through launch. Revisit a dedicated
platform (OneTrust, Osano, Termly, WireWheel, etc.) only once one of the triggers below is hit.**

## What already exists

- `gdpr_requests` table (`supabase/migrations/20260811090000_gdpr_coach_enquiries_connections.sql`):
  a request queue with `request_type` (export/deletion), `status` (pending/in_progress/completed/
  rejected), `notes`, `requested_at`, `processed_at`, `processed_by`.
- Student-facing intake: `app/src/screens/PrivacyDataScreen.jsx` — "Request a copy of your data"
  and "Delete your account" both file a real row, show the requester their own request history and
  its status.
- Operations-facing queue: `app/src/screens/portals/OperationsPortalScreen.jsx` — lists open
  requests, requires an explicit "confirm this has actually been actioned" step before marking a
  request done (not a rubber-stamp), and notifies Operations/Founder on every new request via a
  trigger.
- This covers the actual statutory obligation: a working request channel that logs a timestamp and
  gets a human response inside the 30-day GDPR window. What it does **not** do is *execute* the
  export or deletion automatically — that step is manual today.

## What a dedicated platform would add

- Automated discovery/fulfillment connectors that pull a user's data out of every connected system
  without someone manually querying tables.
- A cookie/consent management layer (UniBlueprint's is already hand-built: `CookiesPage.jsx` +
  `legal_acknowledgements`).
- Standing DPA templates, breach-response workflows, and audit trails built for multi-jurisdiction
  compliance teams.
- A vendor-of-record a partner or investor's due diligence can point to by name.

## Why not now

- Meaningful recurring SaaS cost and typically a sales-gated contract, for a team that is currently
  one person acting as Operations.
- All personal data lives in one place (Supabase). The main value of a discovery/connector platform
  — finding data scattered across many systems — doesn't apply yet; there's one system to query.
- Request volume is low enough that a human fulfilling requests inside 30 days is not a scaling risk
  today.

## Revisit when

1. Request volume makes manual fulfillment slow enough to risk the 30-day window, or
2. Personal data starts living in a second system outside Supabase (a CRM, an email platform with
   its own contact list, a separate analytics vendor storing PII), so "erase everywhere" stops being
   a single query, or
3. A partner, university, or investor contract requires a named, certified DSAR vendor.

## Gaps to close in the custom system before launch (do these, not a vendor swap)

1. **No documented data map.** Below is the full list of tables holding data tied to a specific
   user, generated from the schema, for whoever fulfills export/deletion requests to work from —
   this was tribal knowledge before, now it's written down.
2. ~~No SLA tracking.~~ Already solved: `due_at` (30-day statutory deadline, trigger-maintained) plus
   an overdue badge already ship in `OperationsPortalScreen.jsx`
   (`supabase/migrations/20260824130000_gdpr_system.sql`). No action needed.
3. **`notes` field exists on `gdpr_requests` but had no UI** — fixed alongside this doc: Operations
   now enters a short note ("exported to X on Y", "deleted per policy, financial records retained")
   when marking a request done, instead of a bare confirm dialog with nothing recorded.
4. **"Delete your account" doesn't distinguish what's actually erasable from what's retained.**
   Financial records (`subscriptions`, `commission_declarations`, `refunds`) may need to be retained
   for tax purposes even after a deletion request; `activity_events` may be worth anonymising rather
   than deleting so aggregate platform stats don't silently corrupt. This should be a documented
   policy, not decided ad hoc per request.

### Data map: tables keyed to a specific user

| Table | Column(s) |
|---|---|
| `profiles` | `id` (own row) |
| `activity_events` | `user_id` |
| `budget_entries` | `user_id` |
| `carpool_terms_acceptance` | `user_id` |
| `chat_messages` | `user_id` |
| `chat_participants` | `user_id` |
| `coach_enquiries` | `user_id` |
| `coach_profiles` | `user_id` (where claimed) |
| `coach_ratings` | `user_id` |
| `commission_declarations` | `handler_id` |
| `connection_requests` | `requester_id`, `recipient_id` |
| `engagements` | `user_id` |
| `gdpr_requests` | `user_id`, `processed_by` |
| `handler_assignments` | `handler_id` |
| `handler_availability` | `handler_id` |
| `handler_queue` | `handler_id` |
| `handler_ratings` | `user_id`, `handler_id` |
| `handler_shifts` | `handler_id` |
| `handler_specialisms` | `handler_id`, `approved_by` |
| `legal_acknowledgements` | `user_id` |
| `notifications` | `user_id` |
| `partner_users` | `user_id` |
| `posts` | `user_id` |
| `refunds` | `user_id`, `processed_by` |
| `submissions` | `user_id`, `handler_id` |
| `subscriptions` | `user_id` |
| `user_roles` | `user_id` |
| Storage: `profile-pictures`, `coach-photos` buckets | files keyed by `{user_id}/...` path |

Not included: `boards`, `chat_rooms`, `prompt_library`, `operations_flags`, `spot_checks`,
`ticket_revisions` reference a *creator/moderator* (`created_by`, `flagged_by`, `checked_by`,
`revised_by`) rather than being personal data belonging to the data subject — an export for user X
does not need to pull these, a deletion for user X should null these out (already the behaviour:
all are `on delete set null`, not cascade, so a deletion doesn't destroy other users' records).
