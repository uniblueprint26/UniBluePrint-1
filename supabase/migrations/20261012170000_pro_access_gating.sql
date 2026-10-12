-- Real Pro-tier enforcement for Elevation Blueprint (task #56/D2, resolved
-- by the founder: "Gate it behind isPro"). Until now, isPro was computed
-- client-side only (AuthContext.jsx's own derivation, mirrored by the
-- website's src/context/AuthContext.jsx) and used purely for UI for
-- Elevation specifically — nothing in the database stopped a Free-tier
-- user from inserting a real coach_bookings / coach_enquiries row via a
-- direct API call, bypassing the app's UI entirely. The client-side gate
-- (hooks/useProAccess.js, ElevationScreen.jsx, CoachProfileScreen.jsx,
-- CoachBookingScreen.jsx, the website's ElevationCoachBookingPage.jsx) is
-- the honest "upgrade to Pro" UX; this migration is what actually backs it.
--
-- Reuses public.user_has_active_pro() (already defined in
-- 20260810120100_portals_operations_schema.sql and already enforced there
-- on public.deals — Lifestyle Blueprint's "Mental Health is always free,
-- everything else needs Pro" rule) rather than adding a second,
-- differently-named Pro-check function. That function's own formula
-- already matches AuthContext's client-side isPro exactly (status =
-- 'active' AND (no period end, or it hasn't passed yet)), so client and
-- server agree on what "Pro" means, and every Pro-gated table in the
-- database now shares the one helper — the same way has_role() is reused
-- everywhere a role check is needed, rather than each table re-deriving
-- its own.
--
-- (An earlier draft of this migration defined its own public.has_active_pro
-- before user_has_active_pro was found — that duplicate's grants were
-- revoked from every role once the overlap was caught, so it's inert; it
-- could not be dropped outright because `DROP FUNCTION` was timing out
-- against this project at the time. It is not referenced anywhere.)

-- Elevation booking requests (coach_bookings) — Pro-only, per
-- docs/business/subscription-pricing-model.md §1.1/§1.2 ("Elevation
-- Blueprint — full access to all six services" is listed only under Pro,
-- nothing under Free). Tightens the existing insert policy from
-- 20260907120000_coach_bookings.sql in place (ALTER POLICY, keeping its
-- name) rather than dropping and recreating it — a user can still only
-- ever insert a row for themselves, and now only while they're actually
-- Pro too.
alter policy "users_insert_own_coach_bookings" on public.coach_bookings
  with check (auth.uid() = user_id and public.user_has_active_pro(auth.uid()));

-- Elevation enquiries (coach_enquiries, including the "Find Me A Coach"
-- general-enquiry path) — same rule, same reasoning. Tightens the insert
-- policy from 20260811090000_gdpr_coach_enquiries_connections.sql.
alter policy "users_insert_own_enquiries" on public.coach_enquiries
  with check (auth.uid() = user_id and public.user_has_active_pro(auth.uid()));
