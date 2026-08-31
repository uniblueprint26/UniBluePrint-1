// Creates a Stripe Customer Portal session for a Pro subscriber and returns
// its URL for the client to redirect to. Called from
// SubscriptionManagementPage.jsx via
// supabase.functions.invoke('create-portal-session').
//
// Deploy: supabase functions deploy create-portal-session
//
// Required Edge Function secrets (same ones create-checkout-session and
// stripe-webhook already need):
//   STRIPE_SECRET_KEY   — sk_test_xxx while in test mode, sk_live_xxx once live
//   SITE_URL             — e.g. https://uniblueprint.ie (used to build the
//                           portal's "return to" URL)
//   SUPABASE_URL / SUPABASE_ANON_KEY — auto-injected by Supabase
//
// The portal needs a Stripe customer id, not a user id — that's
// subscriptions.stripe_customer_id, written by stripe-webhook the first
// time checkout.session.completed fires. A user with no completed
// checkout (never subscribed, or a row that predates stripe_customer_id
// being recorded) has nothing to open a portal session for, hence the
// 404 below rather than a Stripe error.
//
// One more prerequisite this doesn't handle: the Stripe dashboard's
// Customer Portal needs to be activated once (Settings → Billing →
// Customer portal) before any session.create() call here will succeed —
// that's a one-time dashboard step, not something this function can do.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

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

    const { data: subRow, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    if (!subRow?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No billing account found for this user yet.' }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://uniblueprint.ie'

    const session = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${siteUrl}/subscription-management`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-portal-session error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
