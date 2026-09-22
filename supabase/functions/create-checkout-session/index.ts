// Creates a Stripe Checkout Session for a Pro subscription and returns its
// URL for the client to redirect to. Called from CheckoutButton.jsx via
// supabase.functions.invoke('create-checkout-session', { body: { tier } }).
//
// Deploy: supabase functions deploy create-checkout-session
//
// Required Edge Function secrets:
//   STRIPE_SECRET_KEY   — sk_test_xxx while in test mode, sk_live_xxx once live
//   SITE_URL             — e.g. https://uniblueprint.ie (used to build the
//                           success/cancel redirect URLs)
//   SUPABASE_URL / SUPABASE_ANON_KEY — auto-injected by Supabase
//
// Deliberately uses Stripe's inline `price_data` rather than a pre-created
// Price object — Desmond doesn't need to go create products in the Stripe
// dashboard before this works; the price is defined right here, in code,
// and stays in sync with PRICING below automatically.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

// Kept in sync with src/lib/stripe-products.js — if pricing changes, update
// both. Amounts in cents, matching Stripe's unit_amount convention.
//
// Trial window during which Pro is 50% off, per the site's own copy
// (src/pages/FoundationBlueprintPage.jsx: "September trial prices apply
// throughout September 2026 only. Standard prices resume from 1 October
// 2026"; src/pages/FAQsPage.jsx says the same for Pro specifically). This
// only gates the price charged AT CHECKOUT — an existing subscription's
// future renewals keep whatever unit_amount was set at signup, same as any
// Stripe subscription. The blog post's separate "locked until the end of
// your first billing year" line (src/data/blogPosts.js) implies a monthly
// trial subscriber should keep the discounted rate for a full year even
// past 1 October 2026 — that would need a Stripe subscription schedule or
// a follow-up price change and is NOT implemented here; flagging rather
// than guessing at the exact intended mechanic.
const TRIAL_ENDS_AT = new Date('2026-10-01T00:00:00Z')

const PRICING: Record<string, { name: string; amount: number; trialAmount: number; interval: 'month' | 'year' }> = {
  pro_monthly: { name: 'UniBlueprint Pro (Monthly)', amount: 699, trialAmount: 350, interval: 'month' },
  pro_annual:  { name: 'UniBlueprint Pro (Annual)',  amount: 4999, trialAmount: 2499, interval: 'year' },
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { tier } = await req.json()
    const plan = PRICING[tier]
    if (!plan) {
      return new Response(JSON.stringify({ error: `Unknown tier: ${tier}. Expected pro_monthly or pro_annual.` }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'
    const inTrial = new Date() < TRIAL_ENDS_AT
    const unitAmount = inTrial ? plan.trialAmount : plan.amount

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: plan.name },
          unit_amount: unitAmount,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      }],
      subscription_data: {
        metadata: { user_id: user.id, tier, trial_price_applied: String(inTrial) },
      },
      metadata: { user_id: user.id, tier },
      success_url: `${siteUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
