// Creates a Stripe Checkout Session for Priority event tickets: a one-time
// charge (mode: 'payment'), same shape as create-board-listing-checkout-session.
// Called from the website's /priority/:slug page. The app never takes payment;
// it only links to that page (tickets are for real world events).
//
// Deploy: supabase functions deploy create-priority-checkout-session
//
// Required Edge Function secrets (already configured for the other checkout
// functions, reused, not duplicated):
//   STRIPE_SECRET_KEY    sk_live_xxx (this account is live mode only)
//   SITE_URL             e.g. https://uniblueprint.ie (falls back to that)
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY   auto injected
//
// Request body: { tier_id: string, quantity: number }
//
// What this function decides, all on the server and never from the client:
//   - the buyer is signed in
//   - the buyer is old enough (profiles.date_of_birth against the event's age_min)
//   - the event is on sale, the tier is inside its sale window and has stock,
//     and quantity is 1 to 6 (all checked, with a row lock, inside the
//     priority_reserve_tickets SQL function so two buyers cannot oversell)
//   - the price, read from priority_ticket_tiers
// It creates a pending priority_orders row, then the Stripe session. Tickets
// are only created by stripe-webhook once Stripe confirms the payment.
//
// Stripe Connect: if priority_events.stripe_account_id is set, the Checkout
// Session is a destination charge to that connected account with no
// application fee. If it is empty, behaviour is unchanged.
//
// Returns { url, order_id, amount_cents } or { error, code }.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const MAX_QUANTITY = 6
// Most open, unpaid checkouts one person can hold at a time. Stops someone
// holding back stock by starting checkouts and walking away.
const MAX_OPEN_ORDERS = 3
// Stripe needs a session to last at least 30 minutes. The order hold in the
// database is a little longer, so stock is never released while a session is
// still payable.
const STRIPE_SESSION_SECONDS = 30 * 60 + 60

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function fail(code: string, error: string, status: number, extra: Record<string, unknown> = {}) {
  return jsonResponse({ error, code, ...extra }, status)
}

// Plain, short messages. No dashes in user facing copy.
const RESERVE_ERRORS: Record<string, { message: string, status: number }> = {
  invalid_quantity: { message: 'Choose between 1 and 6 tickets.', status: 422 },
  tier_not_found:   { message: 'That ticket is no longer available.', status: 404 },
  not_on_sale:      { message: 'Tickets for this event are not on sale.', status: 409 },
  sale_not_open:    { message: 'Tickets in this release are not on sale yet.', status: 409 },
  sale_closed:      { message: 'This release has closed.', status: 409 },
  event_ended:      { message: 'This event is over.', status: 409 },
  sold_out:         { message: 'There are not enough tickets left.', status: 409 },
}

// True if a date of birth (YYYY-MM-DD) is at least `years` years before today.
function isAtLeastYearsOld(dateOfBirth: string, years: number): boolean {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) return false
  const now = new Date()
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()))
  return dob.getTime() <= cutoff.getTime()
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return fail('not_signed_in', 'Sign in to buy tickets.', 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return fail('not_signed_in', 'Sign in to buy tickets.', 401)

    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* handled below */ }
    const tierId = typeof body.tier_id === 'string' ? body.tier_id : ''
    const quantity = Number(body.quantity)
    if (!tierId) return fail('invalid_request', 'Choose a ticket type.', 422)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return fail('invalid_quantity', `Choose between 1 and ${MAX_QUANTITY} tickets.`, 422)
    }

    // Service role for every read and write below. Orders have no client
    // write access at all.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // The tier and its event, from the database.
    const { data: tier, error: tierErr } = await supabaseAdmin
      .from('priority_ticket_tiers')
      .select('id, label, event:priority_events(id, slug, title, age_min, stripe_account_id)')
      .eq('id', tierId)
      .maybeSingle()
    if (tierErr) {
      console.error('[create-priority-checkout-session] tier lookup failed', tierErr)
      return fail('server_error', 'Could not start checkout. Please try again.', 500)
    }
    const event = Array.isArray(tier?.event) ? tier?.event[0] : tier?.event
    if (!tier || !event) return fail('tier_not_found', RESERVE_ERRORS.tier_not_found.message, 404)

    // 18 or over (or the event's own minimum if it is higher).
    const ageMin = Math.max(Number(event.age_min) || 18, 18)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('date_of_birth')
      .eq('id', user.id)
      .maybeSingle()
    if (profileErr) {
      console.error('[create-priority-checkout-session] profile lookup failed', profileErr)
      return fail('server_error', 'Could not start checkout. Please try again.', 500)
    }
    if (!profile?.date_of_birth) {
      return fail('dob_missing', `This event is ${ageMin}+. Add your date of birth to your UniBlueprint profile, then try again.`, 403)
    }
    if (!isAtLeastYearsOld(profile.date_of_birth, ageMin)) {
      return fail('under_age', `This event is ${ageMin}+. You must be ${ageMin} or over to buy tickets.`, 403)
    }

    // Cap how many unpaid checkouts one person holds.
    const { count: openCount, error: openErr } = await supabaseAdmin
      .from('priority_orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
    if (openErr) {
      console.error('[create-priority-checkout-session] open order count failed', openErr)
      return fail('server_error', 'Could not start checkout. Please try again.', 500)
    }
    if ((openCount || 0) >= MAX_OPEN_ORDERS) {
      return fail('too_many_open', 'You have checkouts waiting to be paid. Finish one or wait a few minutes, then try again.', 429)
    }

    // Lock the tier, check the window and the stock, price it, and create the
    // pending order, all in one database call.
    const { data: reserved, error: reserveErr } = await supabaseAdmin.rpc('priority_reserve_tickets', {
      p_tier_id: tier.id,
      p_user_id: user.id,
      p_quantity: quantity,
    })
    if (reserveErr || !reserved) {
      console.error('[create-priority-checkout-session] reserve failed', reserveErr)
      return fail('server_error', 'Could not start checkout. Please try again.', 500)
    }
    if (!reserved.ok) {
      const known = RESERVE_ERRORS[reserved.code as string]
      return fail(
        reserved.code || 'unavailable',
        known?.message || 'Those tickets are not available.',
        known?.status || 409,
        reserved.remaining != null ? { remaining: reserved.remaining } : {},
      )
    }

    const orderId: string = reserved.order_id
    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: user.id,
        customer_email: user.email,
        expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_SECONDS,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `${reserved.event_title} (${reserved.tier_label})` },
            unit_amount: reserved.unit_amount_cents,
          },
          quantity,
        }],
        payment_intent_data: {
          metadata: { user_id: user.id, kind: 'priority_ticket', priority_order_id: orderId },
          // Priority Events takes the money and handles its own VAT. When the
          // event has a connected account, the whole charge goes to it as a
          // destination charge. No application fee: UBP keeps nothing and the
          // buyer pays the ticket price only. Without an account, the money
          // lands in the UBP Stripe account as before.
          ...(event.stripe_account_id
            ? { transfer_data: { destination: event.stripe_account_id } }
            : {}),
        },
        metadata: { user_id: user.id, kind: 'priority_ticket', priority_order_id: orderId },
        success_url: `${siteUrl}/priority/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/priority/${event.slug}`,
      })
    } catch (stripeErr) {
      console.error('[create-priority-checkout-session] stripe session create failed', stripeErr)
      // Give the held tickets back straight away.
      await supabaseAdmin.rpc('priority_cancel_pending_order', { p_order_id: orderId })
      return fail('payment_unavailable', 'Could not start payment. Please try again.', 502)
    }

    const { error: linkErr } = await supabaseAdmin
      .from('priority_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)
    if (linkErr) {
      // The webhook matches on the order id in metadata, so payment still
      // works. Log it so it can be fixed by hand.
      console.error('[create-priority-checkout-session] could not store stripe_session_id', orderId, linkErr)
    }

    return jsonResponse({ url: session.url, order_id: orderId, amount_cents: reserved.amount_cents })
  } catch (err) {
    console.error('create-priority-checkout-session error:', err)
    return fail('server_error', 'Something went wrong. Please try again.', 502)
  }
})
