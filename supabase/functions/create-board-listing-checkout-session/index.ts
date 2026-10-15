// Creates a Stripe Checkout Session for a single Ad Board ad or Marketplace
// "Providing Services" listing — a one-time charge (mode: 'payment'), not a
// subscription — mirroring create-foundation-checkout-session's shape
// (task #95). Called from BoardListingCheckoutModal.start() right before
// the client would otherwise have inserted the ad/listing row directly.
//
// Deploy: supabase functions deploy create-board-listing-checkout-session
//
// Required Edge Function secrets (already configured for
// create-checkout-session / create-foundation-checkout-session — reused,
// not duplicated):
//   STRIPE_SECRET_KEY   — sk_live_xxx (this account is live-mode only, no test mode)
//   SITE_URL             — e.g. https://uniblueprint.ie
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Per docs/business/subscription-pricing-model.md §1.6/§1.7:
//   'ad_board'          — every ad is subject to a "1 free per calendar
//                          month" allowance; the 2nd+ ad that month costs
//                          €4.99 (free tier) / €1.99 (Pro). This function is
//                          the one place that count is actually computed —
//                          not the client, and not the now-dropped `ads`
//                          insert RLS policy (see 20261015130000's header
//                          comment for why a client-side-only count would
//                          not have been a real gate).
//   'marketplace_skill' — the Skills Marketplace board's `listing_type =
//                          'Offering a skill'` rows only (the "Providing
//                          Services" case) — every listing is paid, no free
//                          one: €2.99 (free tier) / €0.99 (Pro). NOT Buy &
//                          Sell (marketplace_listings), and NOT `listing_type
//                          = 'Looking for a skill'` on this same board —
//                          neither is in §1.7's scope, and both stay
//                          directly insertable by the client (RLS still
//                          allows it; see that migration).
//
// For the free Ad Board case (1st of the month), this function inserts the
// `ads` row itself (service-role) and returns `{ free: true, row }` — no
// Stripe session, no board_listing_payments row, matching "skip payment
// entirely" (task requirement #6). Otherwise it creates a pending
// board_listing_payments row (payload = the exact insert-ready row for the
// target table) and a Stripe Checkout session, and returns `{ url,
// payment_id, amount_cents }`. The ad/listing row itself is NEVER inserted
// optimistically here in the paid case — only stripe-webhook does that,
// once Stripe actually confirms the charge (checkout.session.completed).

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

// Mirrors app/src/constants/boardListingPricing.js — this is the number
// Stripe actually charges; that file is client-side disclosure only.
const PRICING = {
  ad_board:          { freeCents: 499, proCents: 199, label: 'Ad Board listing' },
  marketplace_skill: { freeCents: 299, proCents: 99,  label: 'Marketplace listing' },
} as const

const MARKETPLACE_SKILL_CATEGORIES = [
  'Tutoring & Academic', 'Creative & Design', 'Tech & Development',
  'Photography & Video', 'Fitness & Wellness', 'Music & Performance',
  'Writing & Editing', 'Other',
]
const MARKETPLACE_SKILL_RATE_TYPES = ['Fixed price', 'Hourly rate', 'Budget (negotiable)']
const AD_BOARD_BOARDS = ['cross-ireland', 'campus', 'course', 'marketplace']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function startOfCurrentMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const { listing_kind, payload } = await req.json()
    const pricing = PRICING[listing_kind as keyof typeof PRICING]
    if (!pricing) return jsonResponse({ error: `Unknown listing_kind: ${listing_kind}` }, 422)
    if (!payload || typeof payload !== 'object') return jsonResponse({ error: 'payload is required' }, 422)

    // Service-role client for every write below — both board_listing_payments
    // and (once paid, or immediately for the free case) `ads` /
    // `marketplace_skills` now have no insert policy for `authenticated` at
    // all for the paid-eligible rows (see 20261015130000's migration
    // comment), so only this can create them.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const displayName = (user.user_metadata as Record<string, unknown> | null)?.full_name as string | undefined
      || user.email?.split('@')[0]
      || 'A student'

    let targetTable: string
    let insertPayload: Record<string, unknown>

    if (listing_kind === 'ad_board') {
      const title = typeof payload.title === 'string' ? payload.title.trim() : ''
      const description = typeof payload.description === 'string' ? payload.description.trim() : ''
      const boards = Array.isArray(payload.boards) ? payload.boards.filter((b: unknown) => typeof b === 'string') : []
      if (!title) return jsonResponse({ error: 'title is required' }, 422)
      if (!description) return jsonResponse({ error: 'description is required' }, 422)
      if (boards.length === 0) return jsonResponse({ error: 'boards is required' }, 422)
      if (boards.some((b: string) => !AD_BOARD_BOARDS.includes(b))) return jsonResponse({ error: 'Invalid board selection' }, 422)
      targetTable = 'ads'
      insertPayload = {
        user_id: user.id,
        title,
        description,
        target_url: typeof payload.target_url === 'string' && payload.target_url.trim() ? payload.target_url.trim() : null,
        boards,
        image_url: typeof payload.image_url === 'string' ? payload.image_url : null,
        status: 'pending_review',
        active: false,
      }
    } else {
      // marketplace_skill — "Providing Services" (§1.7). Only
      // `listing_type === 'Offering a skill'` is ever paid; this endpoint
      // is only meant to be called for that case (the client inserts
      // 'Looking for a skill' rows directly — still allowed by RLS).
      const listingType = payload.listing_type
      if (listingType !== 'Offering a skill') {
        return jsonResponse({ error: 'This endpoint only handles "Offering a skill" listings.' }, 422)
      }
      const title = typeof payload.title === 'string' ? payload.title.trim() : ''
      const description = typeof payload.description === 'string' ? payload.description.trim() : ''
      const category = payload.category
      const rateType = payload.rate_type
      const contactMethod = typeof payload.contact_method === 'string' ? payload.contact_method.trim() : ''
      if (!title) return jsonResponse({ error: 'title is required' }, 422)
      if (!description) return jsonResponse({ error: 'description is required' }, 422)
      if (!contactMethod) return jsonResponse({ error: 'contact_method is required' }, 422)
      if (!MARKETPLACE_SKILL_CATEGORIES.includes(category)) return jsonResponse({ error: 'Invalid category' }, 422)
      if (!MARKETPLACE_SKILL_RATE_TYPES.includes(rateType)) return jsonResponse({ error: 'Invalid rate_type' }, 422)
      const rateAmount = payload.rate_amount === '' || payload.rate_amount == null ? null : Number(payload.rate_amount)
      if (rateAmount != null && !Number.isFinite(rateAmount)) return jsonResponse({ error: 'Invalid rate_amount' }, 422)
      targetTable = 'marketplace_skills'
      insertPayload = {
        user_id: user.id,
        poster_name: displayName,
        listing_type: 'Offering a skill',
        title,
        category,
        description,
        rate_type: rateType,
        rate_amount: rateAmount,
        contact_method: contactMethod,
        status: 'active',
      }
    }

    // Pro status decides the price — reuses the one shared Pro-check
    // function (public.user_has_active_pro), same as
    // create-foundation-checkout-session and the Pro access RLS policies.
    const { data: isProData } = await supabase.rpc('user_has_active_pro', { _user_id: user.id })
    const isPro = !!isProData

    if (listing_kind === 'ad_board') {
      // The real monthly-count gate (§1.6) — computed here, server-side,
      // against the actual `ads` table, not trusted from the client.
      const { count, error: countErr } = await supabaseAdmin
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfCurrentMonthUTC())
      if (countErr) {
        console.error('[create-board-listing-checkout-session] could not count this month\'s ads', countErr)
        return jsonResponse({ error: 'Could not start checkout. Please try again.' }, 500)
      }
      if ((count || 0) === 0) {
        const { data: row, error: insertErr } = await supabaseAdmin.from('ads').insert(insertPayload).select().single()
        if (insertErr || !row) {
          console.error('[create-board-listing-checkout-session] could not insert free ad', insertErr)
          return jsonResponse({ error: 'Could not post your ad. Please try again.' }, 500)
        }
        return jsonResponse({ free: true, row })
      }
    }

    const unitAmount = isPro ? pricing.proCents : pricing.freeCents

    const { data: paymentRow, error: insertPaymentErr } = await supabaseAdmin
      .from('board_listing_payments')
      .insert({
        user_id: user.id,
        listing_kind,
        payload: insertPayload,
        amount_cents: unitAmount,
        currency: 'eur',
        status: 'pending',
      })
      .select('id')
      .single()
    if (insertPaymentErr || !paymentRow) {
      console.error('[create-board-listing-checkout-session] could not insert pending payment', insertPaymentErr)
      return jsonResponse({ error: 'Could not start checkout. Please try again.' }, 500)
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: user.id,
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: pricing.label },
            unit_amount: unitAmount,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          metadata: { user_id: user.id, listing_kind, board_listing_payment_id: paymentRow.id },
        },
        metadata: { user_id: user.id, listing_kind, board_listing_payment_id: paymentRow.id, kind: 'board_listing_payment' },
        success_url: `${siteUrl}/board-listing/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/ad-board`,
      })
    } catch (stripeErr) {
      await supabaseAdmin.from('board_listing_payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentRow.id)
      throw stripeErr
    }

    await supabaseAdmin
      .from('board_listing_payments')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', paymentRow.id)

    return jsonResponse({ url: session.url, payment_id: paymentRow.id, amount_cents: unitAmount })
  } catch (err) {
    console.error('create-board-listing-checkout-session error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 502)
  }
})
