// Self-service Elevation "intro call" / taster-session tier (Desmond-approved,
// see migration 20261015150000_coach_intro_call_offers.sql). Coaches decide
// for themselves whether to offer one and at what price — this is NOT part
// of ElevationScreen.jsx's static COACHES array / coachPricing.js's parsing
// of it, since it's a live, coach-editable row rather than hardcoded data.
//
// Used by:
//   - CoachProfileScreen.jsx / CoachBookingScreen.jsx — read-only, to show
//     and charge for a coach's ACTIVE offer only (fetchActiveIntroCallOffer).
//   - CoachStudioScreen.jsx — the coach's own self-service toggle, which
//     reads/writes its own row directly via supabase (coach_intro_call_offers
//     RLS lets a coach manage their own row regardless of active state, see
//     the migration's "coach_manage_own_intro_call_offer" policy), so it
//     doesn't need this file's active-only helper.

import { supabase } from './supabase'

// Re-exported from coachPricing.js so every screen that needs this offer's
// display label imports it from one place — see that file's own comment
// for why the label string itself lives there, next to the pricing shapes
// it gets merged into.
export { introCallLabel } from './coachPricing'

// Fetches the ACTIVE intro call offer for a coach, if any. Returns null if
// the coach has none active right now (never assumed, never defaulted) —
// most coaches will have none, since the toggle defaults OFF.
export async function fetchActiveIntroCallOffer(coachSlug) {
  const { data, error } = await supabase
    .from('coach_intro_call_offers')
    .select('coach_slug, price_cents, duration_minutes')
    .eq('coach_slug', coachSlug)
    .eq('active', true)
    .maybeSingle()
  if (error || !data) return null
  return data
}
