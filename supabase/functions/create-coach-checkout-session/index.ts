// Creates a Stripe Checkout Session for an Elevation coach booking — a
// one-time charge (mode: 'payment'), not a subscription — and records it as
// a pending public.coach_payments row. Called from the app's
// CoachCheckoutModal right after CoachBookingScreen inserts a
// 'pending_payment' coach_bookings row, for a coach with a real chargeable
// price only.
//
// Deploy: supabase functions deploy create-coach-checkout-session
//
// Required Edge Function secrets (already configured — reused, not
// duplicated):
//   STRIPE_SECRET_KEY   — sk_test_xxx while in test mode, sk_live_xxx once live
//   SITE_URL             — e.g. https://uniblueprint.ie
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Task #95's sibling for Elevation — "Elevation coach bookings have no
// payment anywhere." CoachBookingScreen.jsx used to insert a coach_bookings
// row (status 'requested') with zero payment collected, for every coach,
// including ones with a real, fixed price. Mirrors
// create-foundation-checkout-session's architecture closely: validate the
// thing being paid for belongs to the caller and isn't already settled,
// create the Checkout Session, record a pending payment row, hand back the
// URL — except here "the thing being paid for" is a coach_bookings row
// (status 'pending_payment', inserted by the client just before this is
// called) rather than a pre-existing document.
//
// Coach pricing is NOT a clean fixed table like Foundation's 8 services —
// see ElevationScreen.jsx's COACHES array. COACH_PRICING below is a
// hand-kept mirror of that array's `pricelist` (and, for a future coach
// with no pricelist, a single flat `from` price) — same inline-price,
// kept-in-sync-by-hand tradeoff create-foundation-checkout-session's own
// PRICING map already accepts, and for the same reason: the amount Stripe
// actually charges has to be computed server-side from a value this
// function trusts, never from anything the client sends, or a tampered
// client could request any price it likes.
//
// A pricelist item priced "Free" (e.g. Kevin/TrainWitKev's "Initial
// consultation") is deliberately left OUT of this map — there's nothing to
// charge, so the client never calls this function for that selection; it
// books directly instead (see CoachBookingScreen.jsx).
//
// Deliberately NOT built here: coach commission/payout/revenue-split. This
// charges the full listed price to the student and nothing else — what (if
// anything) the coach is later paid from that is a founder decision that
// hasn't been made (see docs/business/subscription-pricing-model.md's
// "Note — coach/partner commission split"), and this function has no
// notion of it at all.
//
// Self-service intro call (Desmond-approved, migration
// 20261015150000_coach_intro_call_offers.sql): coaches decide for
// themselves whether to offer a priced "intro call" and at what price —
// deliberately NOT assigned centrally, so it can't live in the hand-kept
// COACH_PRICING map below. When the request carries `intro_call: true`,
// the amount is instead resolved by reading the coach's own ACTIVE
// coach_intro_call_offers row (RLS lets any authenticated user read an
// active row — see that table's own policy) — never trusted from the
// client. A coach's intro call set to €0 is never sent here at all; the
// client books that directly, no Stripe step, same as any other free
// pricelist item (e.g. Kevin/TrainWitKev's "Initial consultation") — see
// CoachBookingScreen.jsx.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

type CoachPricing = {
  // A coach with a `pricelist` in ElevationScreen.jsx — keys are the exact
  // pricelist item `label` strings, values are that item's price in cents.
  // Free items are omitted (see header comment).
  items?: Record<string, number>
  // A coach with a single parseable `from` price and no pricelist. No coach
  // in today's roster actually needs this (every priced coach happens to
  // have a pricelist), but it's here so a future flat-price coach doesn't
  // need a code change to this function, only a new map entry.
  flatCents?: number
}

const COACH_PRICING: Record<string, CoachPricing> = {
  'coach-2': { // JMC Fitness
    items: {
      '12-Week Online Plan': 30000,
      'In-Person Session (1hr)': 5000,
      'Analytics Breakdown': 10000,
    },
  },
  'coach-3': { // Nathan Yanzo (Nyz3ditz)
    items: {
      'Monthly Subscription': 5500,
      '1-1 Shoot Session': 9000,
    },
  },
  'coach-17': { // Camila Aruk
    items: {
      'PT — 1x/week': 22000,
      'PT — 2x/week': 37000,
      'PT — Pay as you go': 6000,
      'Body Scan': 7000,
      'Food Plan + e-book': 12000,
      'Online Coach': 32000,
    },
  },
  'coach-8': { // Milan Piroska (MPFitness)
    items: {
      '1x per week': 5000,
      '2x per week': 4500,
      '3x per week': 4000,
      'One-time session': 6000,
    },
  },
  'coach-9': { // Kevin (TrainWitKev) — 'Initial consultation' (Free) omitted on purpose
    items: {
      '1-to-1 PT: Single session': 2500,
      '1-to-1 PT: 4 sessions': 9000,
      '1-to-1 PT: 8 sessions': 17000,
      'Personalised Training Programme': 2500,
    },
  },
}

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

    // Scoped to the caller's own JWT — the booking lookup below runs under
    // that user's own RLS, same pattern as create-foundation-checkout-session.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const { booking_id, item_label, intro_call } = await req.json()
    if (!booking_id || typeof booking_id !== 'string') {
      return jsonResponse({ error: 'booking_id is required' }, 422)
    }

    // Confirm the booking actually exists, belongs to this caller, and is
    // still awaiting payment — RLS on coach_bookings already scopes this
    // select to the caller's own rows, so a bare .single() failing means
    // "not found or not theirs" either way.
    const { data: booking, error: bookingErr } = await supabase
      .from('coach_bookings')
      .select('id, coach_slug, coach_name, status')
      .eq('id', booking_id)
      .single()
    if (bookingErr || !booking) return jsonResponse({ error: 'Booking not found.' }, 404)
    if (booking.status !== 'pending_payment') {
      return jsonResponse({ error: 'This booking is not awaiting payment.' }, 409)
    }

    let unitAmount: number | undefined
    let resolvedItemLabel: string | null = null

    if (intro_call === true) {
      // Self-service intro call (see header comment) — resolved from the
      // coach's own ACTIVE coach_intro_call_offers row, never from
      // COACH_PRICING (which has no notion of this offer at all) and never
      // from anything the client sends beyond the `intro_call` flag itself.
      const { data: offer, error: offerErr } = await supabase
        .from('coach_intro_call_offers')
        .select('price_cents, duration_minutes')
        .eq('coach_slug', booking.coach_slug)
        .eq('active', true)
        .maybeSingle()
      if (offerErr || !offer) {
        return jsonResponse({ error: 'This coach has no active intro call offer.' }, 422)
      }
      unitAmount = offer.price_cents
      resolvedItemLabel = `Intro Call (${offer.duration_minutes} min)`
    } else {
      const pricing = COACH_PRICING[booking.coach_slug]
      if (!pricing) return jsonResponse({ error: 'This coach has no payable pricing configured.' }, 422)

      if (pricing.items) {
        if (!item_label || typeof item_label !== 'string' || !(item_label in pricing.items)) {
          return jsonResponse({ error: 'A valid item_label is required for this coach.' }, 422)
        }
        unitAmount = pricing.items[item_label]
        resolvedItemLabel = item_label
      } else if (pricing.flatCents) {
        unitAmount = pricing.flatCents
      }
    }

    if (!unitAmount || unitAmount <= 0) {
      return jsonResponse({ error: 'This coach has no payable pricing configured.' }, 422)
    }

    // Service-role client for the actual write — coach_payments has no
    // insert/update policy for `authenticated` on purpose (see its own
    // migration comment), so only this can create the pending row.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Idempotency: if this exact booking was already paid for (e.g. a
    // retried request after the client missed the first confirmation),
    // don't charge again.
    const { data: existingPaid } = await supabaseAdmin
      .from('coach_payments')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle()
    if (existingPaid) {
      return jsonResponse({ already_paid: true, payment_id: existingPaid.id })
    }

    const { data: paymentRow, error: insertErr } = await supabaseAdmin
      .from('coach_payments')
      .insert({
        user_id: user.id,
        booking_id,
        coach_slug: booking.coach_slug,
        coach_name: booking.coach_name,
        item_label: resolvedItemLabel,
        amount_cents: unitAmount,
        currency: 'eur',
        status: 'pending',
      })
      .select('id')
      .single()
    if (insertErr || !paymentRow) {
      console.error('[create-coach-checkout-session] could not insert pending payment', insertErr)
      return jsonResponse({ error: 'Could not start checkout. Please try again.' }, 500)
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'
    const serviceName = resolvedItemLabel
      ? `${booking.coach_name} — ${resolvedItemLabel}`
      : `${booking.coach_name} — Coaching Session`

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: user.id,
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: serviceName },
            unit_amount: unitAmount,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          metadata: { user_id: user.id, booking_id, coach_slug: booking.coach_slug, item_label: resolvedItemLabel ?? '', coach_payment_id: paymentRow.id },
        },
        metadata: { user_id: user.id, booking_id, coach_slug: booking.coach_slug, item_label: resolvedItemLabel ?? '', coach_payment_id: paymentRow.id, kind: 'coach_booking' },
        success_url: `${siteUrl}/elevation/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/elevation-blueprint`,
      })
    } catch (stripeErr) {
      // Stripe never created the session — mark the pending row failed
      // rather than leaving an orphaned 'pending' payment nothing will
      // ever resolve. The coach_bookings row itself stays 'pending_payment'
      // so the student can simply retry checkout against it.
      await supabaseAdmin.from('coach_payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentRow.id)
      throw stripeErr
    }

    await supabaseAdmin
      .from('coach_payments')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', paymentRow.id)

    return jsonResponse({ url: session.url, payment_id: paymentRow.id, amount_cents: unitAmount })
  } catch (err) {
    console.error('create-coach-checkout-session error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 502)
  }
})
