// Starts (or continues) Stripe Express Connect onboarding for an Elevation
// coach — the founder-approved automated-payout work (see
// 20261015150039_coach_stripe_connect.sql's header for the full picture).
// Identity/bank verification itself is entirely Stripe's hosted onboarding
// flow (an Account Link) — this function never collects or sees a coach's
// bank details, same "Stripe handles the sensitive bit" shape
// create-coach-checkout-session already uses for card details.
//
// Deploy: supabase functions deploy create-coach-connect-account
//
// Required Edge Function secrets (already configured — reused, not
// duplicated):
//   STRIPE_SECRET_KEY   — sk_live_xxx (this Stripe account is LIVE MODE ONLY)
//   SITE_URL             — e.g. https://uniblueprint.ie
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Flow (single endpoint handles both "start" and "continue/refresh"):
//   1. Resolve the caller's own linked coach_profiles row (same unlinked-
//      profile guard CoachStudioScreen's other self-service sections use —
//      a coach with no coach_slug has nothing to attach a Connect account to).
//   2. No coach_connect_accounts row yet -> stripe.accounts.create() (Express,
//      country 'IE' — see note below), insert the row, then create an
//      Account Link (type 'account_onboarding').
//   3. A row already exists -> re-fetch the Account from Stripe (keeps
//      charges_enabled/payouts_enabled/details_submitted fresh even if the
//      account.updated webhook hasn't landed yet), then create a fresh
//      Account Link against the SAME stripe_account_id — this is what makes
//      "Continue Onboarding" work after a coach abandoned the hosted flow
//      partway (an Account Link is single-use/short-lived; stripe_account_id
//      itself is permanent).
//   4. Already fully verified (charges_enabled && payouts_enabled) -> no new
//      link needed; just return the current status so the UI can show
//      "Verified" without redirecting anywhere.
//
// Deliberately NOT built here (flagged, not guessed):
//   - Country is hard-coded to 'IE'. Every coach on this roster today is
//     Irish (uniblueprint.ie is an Irish platform) and Stripe Express
//     requires a country at account-creation time that cannot be changed
//     later — a non-Irish coach would need either a per-coach country field
//     added to coach_profiles or an onboarding question, neither of which
//     exists today. Flagged in this task's hand-back report as a founder/
//     product decision, not guessed at here.
//   - No "view your Stripe Express dashboard" link once verified (Stripe
//     offers a login-link endpoint for that) — out of scope for this task,
//     which only needed onboarding + automated transfers.
//   - Does not delete/recreate a Stripe account if a coach's onboarding was
//     rejected outright (Stripe sets requirements.disabled_reason in that
//     case) — this function always re-links the same account; a genuinely
//     rejected account needs a human (Operations/Founder) to look at it.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    // Scoped to the caller's own JWT first, same pattern as
    // create-coach-checkout-session — the coach_profiles lookup below is
    // under this user's own identity, never anything the client claims.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const { data: coachProfile, error: profileErr } = await supabase
      .from('coach_profiles')
      .select('id, coach_slug')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profileErr) {
      console.error('[create-coach-connect-account] coach_profiles lookup failed', profileErr)
      return jsonResponse({ error: 'Could not look up your coach profile. Please try again.' }, 500)
    }
    if (!coachProfile?.coach_slug) {
      return jsonResponse({ error: 'Your coach profile hasn\'t been linked yet. Contact Operations first.' }, 422)
    }

    // Service-role client for everything else — coach_connect_accounts has
    // no insert/update policy for `authenticated` on purpose (see its own
    // migration comment), so only this can create/refresh the row.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('coach_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('coach_profile_id', coachProfile.id)
      .maybeSingle()
    if (existingErr) {
      console.error('[create-coach-connect-account] coach_connect_accounts lookup failed', existingErr)
      return jsonResponse({ error: 'Could not check your payout account status. Please try again.' }, 500)
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'
    // Reuses the Elevation page itself rather than a dedicated route that
    // doesn't exist on the website today — same "point back at a real,
    // existing page" choice create-coach-checkout-session's cancel_url
    // already makes. The query params are informational only (nothing reads
    // them yet); the coach's real status always comes from a fresh
    // coach_connect_accounts read, never from the URL.
    const refreshUrl = `${siteUrl}/elevation-blueprint?connect_onboarding=refresh`
    const returnUrl = `${siteUrl}/elevation-blueprint?connect_onboarding=return`

    let stripeAccountId: string

    if (existing) {
      stripeAccountId = existing.stripe_account_id

      if (existing.charges_enabled && existing.payouts_enabled) {
        // Already fully verified — nothing to send the coach back to Stripe
        // for. Still worth a cheap re-check so this can't go stale forever,
        // but no Account Link is created.
        return jsonResponse({ already_verified: true, status: { charges_enabled: true, payouts_enabled: true } })
      }

      // Re-sync from Stripe before deciding whether a new link is even
      // needed — covers the case where the coach finished onboarding since
      // the last account.updated webhook delivery.
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId)
        await supabaseAdmin
          .from('coach_connect_accounts')
          .update({
            details_submitted: !!account.details_submitted,
            charges_enabled: !!account.charges_enabled,
            payouts_enabled: !!account.payouts_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('coach_profile_id', coachProfile.id)
        if (account.charges_enabled && account.payouts_enabled) {
          return jsonResponse({ already_verified: true, status: { charges_enabled: true, payouts_enabled: true } })
        }
      } catch (stripeErr) {
        // Non-fatal — fall through and still try to create a fresh Account
        // Link against the stored stripe_account_id; the coach can still
        // continue onboarding even if this particular status re-check failed.
        console.error('[create-coach-connect-account] stripe.accounts.retrieve failed', stripeAccountId, stripeErr)
      }
    } else {
      // First time — create the Express account itself. See header comment
      // for why country is hard-coded to 'IE'.
      let account
      try {
        account = await stripe.accounts.create({
          type: 'express',
          country: 'IE',
          email: user.email,
          capabilities: {
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            coach_profile_id: coachProfile.id,
            coach_slug: coachProfile.coach_slug,
            user_id: user.id,
          },
        })
      } catch (stripeErr) {
        console.error('[create-coach-connect-account] stripe.accounts.create failed', stripeErr)
        return jsonResponse({ error: stripeErr instanceof Error ? stripeErr.message : 'Could not create a Stripe payout account.' }, 502)
      }

      const { error: insertErr } = await supabaseAdmin
        .from('coach_connect_accounts')
        .insert({ coach_profile_id: coachProfile.id, stripe_account_id: account.id })
      if (insertErr) {
        // The Stripe account now exists but our own record of it doesn't —
        // logged loudly rather than silently losing track of a real Stripe
        // object. Still return the onboarding link below so the coach isn't
        // blocked; a retry of this function will find nothing in
        // coach_connect_accounts and create ANOTHER Stripe account, which is
        // the known tradeoff of this failure path rather than something
        // this function guesses a cleanup for.
        console.error('[create-coach-connect-account] CRITICAL: stripe account', account.id, 'created but coach_connect_accounts insert failed', insertErr)
      }

      stripeAccountId = account.id
    }

    let accountLink
    try {
      accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      })
    } catch (stripeErr) {
      console.error('[create-coach-connect-account] stripe.accountLinks.create failed', stripeAccountId, stripeErr)
      return jsonResponse({ error: stripeErr instanceof Error ? stripeErr.message : 'Could not start Stripe onboarding.' }, 502)
    }

    return jsonResponse({ url: accountLink.url })
  } catch (err) {
    console.error('create-coach-connect-account error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 502)
  }
})
