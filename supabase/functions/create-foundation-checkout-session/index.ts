// Creates a Stripe Checkout Session for a single Foundation Blueprint
// document — a one-time charge (mode: 'payment'), not a subscription — and
// records it as a pending public.foundation_payments row. Called from the
// app's useFoundationCheckout hook right after a builder screen inserts its
// draft document row, before it generates anything or submits for review.
//
// Deploy: supabase functions deploy create-foundation-checkout-session
//
// Required Edge Function secrets (already configured for
// create-checkout-session — reused, not duplicated):
//   STRIPE_SECRET_KEY   — sk_test_xxx while in test mode, sk_live_xxx once live
//   SITE_URL             — e.g. https://uniblueprint.ie
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Task #95 — "Foundation Blueprint has no real payment processing
// anywhere." Foundation is pay-per-service for every tier, free and Pro
// alike (docs/business/subscription-pricing-model.md §1.1/§1.4) — this is
// NOT the Pro subscription gate (useProAccess/ProUpgradeGate, task #56/D2).
// Pro only changes the Premium price (see PRICING below) and is read here
// purely to pick which Premium number to charge; Standard is identical for
// everyone and this function still runs for it.
//
// Like create-checkout-session, prices are defined inline as Stripe
// price_data rather than pre-created Price objects, kept in sync with the
// canonical pricing doc by hand (same tradeoff that function's own header
// comment already accepts).

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

// Keyed by the exact document table each of the 8 Foundation builder
// screens inserts into (is_valid_document_table()'s own whitelist —
// supabase/migrations/20260730090000_job_search_support_pipeline.sql).
// standardCents is identical for Free and Pro per the pricing doc; only
// the two premium numbers differ.
//
// Interview Preparation only: the pricing doc also lists a separate
// "pack + mock session" line (€35/€45/€38) that is NOT represented here —
// InterviewPrepBuilderScreen's own TIERS array only ever offers
// standard/premium, with no mock-session upsell built into the intake
// flow at all. Charging for a tier the UI never lets anyone pick would be
// unreachable dead code, so this prices the pack only (the tier that
// screen actually offers) and flags the mock-session gap for a founder
// decision rather than inventing a new UI step here.
const PRICING: Record<string, { serviceLabel: string; standardCents: number; premiumFreeCents: number; premiumProCents: number }> = {
  cv_documents:         { serviceLabel: 'CV Optimisation',             standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  linkedin_documents:   { serviceLabel: 'LinkedIn Optimisation',       standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  cover_letters:        { serviceLabel: 'Cover Letter Assistance',     standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  application_forms:    { serviceLabel: 'Application Form Assistance', standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  interview_prep_packs: { serviceLabel: 'Interview Preparation',       standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  job_search_sessions:  { serviceLabel: 'Job Search Support',          standardCents: 1500, premiumFreeCents: 2600, premiumProCents: 2200 },
  personal_statements:  { serviceLabel: 'CAO Personal Statement',      standardCents: 2000, premiumFreeCents: 3600, premiumProCents: 3000 },
  portfolio_plans:      { serviceLabel: 'Portfolio Building',          standardCents: 3000, premiumFreeCents: 4600, premiumProCents: 3800 },
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

    // Scoped to the caller's own JWT — reads below (the document row,
    // user_has_active_pro) run under that user's own RLS, same pattern as
    // create-checkout-session.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const { document_table, document_id, tier } = await req.json()

    const pricing = PRICING[document_table]
    if (!pricing) return jsonResponse({ error: `Unknown document_table: ${document_table}` }, 422)
    if (tier !== 'standard' && tier !== 'premium') return jsonResponse({ error: `Unsupported tier: ${tier}` }, 422)
    if (!document_id || typeof document_id !== 'string') return jsonResponse({ error: 'document_id is required' }, 422)

    // Confirm the document actually exists, belongs to this caller, and
    // hasn't already been submitted — RLS on document_table already
    // scopes this select to the caller's own rows, so a bare .single()
    // failing means "not found or not theirs" either way.
    const { data: doc, error: docErr } = await supabase
      .from(document_table)
      .select('id, status')
      .eq('id', document_id)
      .single()
    if (docErr || !doc) return jsonResponse({ error: 'Document not found.' }, 404)
    if (doc.status === 'submitted' || doc.status === 'delivered') {
      return jsonResponse({ error: 'This request has already been submitted.' }, 409)
    }

    // Pro status decides which Premium price applies (Standard is the
    // same for everyone — pricing doc §1.4). Reuses the one shared
    // Pro-check function (public.user_has_active_pro) rather than a
    // second, differently-derived notion of "is this user Pro" — same
    // function pro_access_gating.sql and the deals RLS policies already
    // rely on.
    const { data: isProData } = await supabase.rpc('user_has_active_pro', { _user_id: user.id })
    const isPro = !!isProData

    const serviceName = tier === 'premium'
      ? `${pricing.serviceLabel} — Premium`
      : `${pricing.serviceLabel} — Standard`
    const unitAmount = tier === 'premium'
      ? (isPro ? pricing.premiumProCents : pricing.premiumFreeCents)
      : pricing.standardCents

    // Service-role client for the actual write — foundation_payments has
    // no insert policy for `authenticated` on purpose (see its own
    // migration comment), so only this can create the pending row.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Idempotency: if this exact document+tier was already paid for
    // (e.g. a retried request after the client missed the first
    // confirmation), don't charge again — just hand back that it's
    // already settled so the caller can skip straight past checkout.
    const { data: existingPaid } = await supabaseAdmin
      .from('foundation_payments')
      .select('id')
      .eq('document_table', document_table)
      .eq('document_id', document_id)
      .eq('tier', tier)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle()
    if (existingPaid) {
      return jsonResponse({ already_paid: true, payment_id: existingPaid.id })
    }

    const { data: paymentRow, error: insertErr } = await supabaseAdmin
      .from('foundation_payments')
      .insert({
        user_id: user.id,
        document_table,
        document_id,
        service_name: serviceName,
        tier,
        amount_cents: unitAmount,
        currency: 'eur',
        status: 'pending',
      })
      .select('id')
      .single()
    if (insertErr || !paymentRow) {
      console.error('[create-foundation-checkout-session] could not insert pending payment', insertErr)
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
            product_data: { name: serviceName },
            unit_amount: unitAmount,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          metadata: { user_id: user.id, document_table, document_id, tier, foundation_payment_id: paymentRow.id },
        },
        metadata: { user_id: user.id, document_table, document_id, tier, foundation_payment_id: paymentRow.id, kind: 'foundation_one_time' },
        success_url: `${siteUrl}/foundation/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/foundation-blueprint`,
      })
    } catch (stripeErr) {
      // Stripe never created the session — mark the pending row failed
      // rather than leaving an orphaned 'pending' payment nothing will
      // ever resolve.
      await supabaseAdmin.from('foundation_payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentRow.id)
      throw stripeErr
    }

    await supabaseAdmin
      .from('foundation_payments')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', paymentRow.id)

    return jsonResponse({ url: session.url, payment_id: paymentRow.id })
  } catch (err) {
    console.error('create-foundation-checkout-session error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 502)
  }
})
