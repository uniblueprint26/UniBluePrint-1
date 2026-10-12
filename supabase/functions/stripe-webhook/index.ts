// Handles Stripe webhook events and keeps public.subscriptions (Pro
// subscriptions) AND public.foundation_payments (Foundation Blueprint
// one-time document charges, task #95) in sync.
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt because Stripe calls this directly, not through a
// logged-in user's session — signature verification below is what
// actually authenticates the caller.)
//
// Required Edge Function secrets:
//   STRIPE_SECRET_KEY         — sk_test_xxx while in test mode, sk_live_xxx once live
//   STRIPE_WEBHOOK_SECRET     — whsec_xxx, from the Stripe dashboard's webhook config
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
//
// Register in the Stripe dashboard pointing at:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// subscribed to: checkout.session.completed, checkout.session.expired,
// customer.subscription.updated, customer.subscription.deleted,
// invoice.payment_failed
// (checkout.session.expired is new as of task #95 — needed so an
// abandoned Foundation checkout doesn't leave its foundation_payments row
// stuck on 'pending' forever. This needs an actual Stripe dashboard
// config change outside this codebase — see task #95's report.)
//
// Writes to public.subscriptions (tier/status/current_period_end/
// stripe_customer_id/stripe_subscription_id), not profiles — that's the
// real schema (see migration 20260606160000_subscriptions.sql and how
// AuthContext.jsx derives isPro). An earlier version of this file's TODO
// comments referenced a nonexistent profiles.is_pro column; same bug class
// already found and fixed on the website's SubscriptionManagementPage.
//
// checkout.session.completed now covers two distinct kinds of session —
// session.mode distinguishes them, same way Stripe itself does:
//   'subscription' -> Pro/Premium (create-checkout-session), unchanged.
//   'payment'      -> a single Foundation Blueprint document
//                      (create-foundation-checkout-session, task #95).
// They're never confused with each other because a Checkout Session's
// mode is fixed at creation and Stripe reports it back verbatim.

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function upsertSubscription(userId: string, tier: string, stripeCustomerId: string, stripeSubscriptionId: string, currentPeriodEnd: number | null) {
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    tier,
    status: 'active',
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// Task #95 — marks a Foundation one-time payment paid once Stripe actually
// confirms the charge. This is the only thing that can ever flip a
// foundation_payments row to 'paid' (RLS gives `authenticated` no
// insert/update on that table at all), which is what makes
// submit_document_for_review()'s payment check real rather than
// cosmetic. Matched by the row's own id (set in checkout session
// metadata at creation, create-foundation-checkout-session/index.ts),
// not by stripe_checkout_session_id — the id is already known and unique,
// so there's no ambiguity to resolve.
async function markFoundationPaymentPaid(paymentId: string, paymentIntentId: string | null) {
  const { error } = await supabase
    .from('foundation_payments')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('status', 'pending') // don't resurrect a row already marked failed/canceled
  if (error) console.error('[stripe-webhook] could not mark foundation_payments paid', paymentId, error)
}

async function markFoundationPaymentFailed(paymentId: string) {
  const { error } = await supabase
    .from('foundation_payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('status', 'pending')
  if (error) console.error('[stripe-webhook] could not mark foundation_payments failed', paymentId, error)
}

Deno.serve(async req => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment') {
          // Foundation Blueprint one-time document charge (task #95).
          const paymentId = session.metadata?.foundation_payment_id
          if (!paymentId) {
            console.error('checkout.session.completed (payment mode) missing foundation_payment_id metadata', session.id)
            break
          }
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
          await markFoundationPaymentPaid(paymentId, paymentIntentId)
          break
        }

        // Pro/Premium subscription (create-checkout-session) — unchanged.
        const userId = session.client_reference_id || session.metadata?.user_id
        const tier = session.metadata?.tier
        if (!userId || !tier) {
          console.error('checkout.session.completed missing user_id or tier in metadata', session.id)
          break
        }
        const subscriptionId = session.subscription as string
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        await upsertSubscription(
          userId, tier,
          session.customer as string, subscriptionId,
          stripeSub.current_period_end,
        )
        break
      }

      case 'checkout.session.expired': {
        // Only meaningful for Foundation's one-time payment sessions — a
        // Pro/Premium subscription checkout has nothing in `subscriptions`
        // to roll back if it's abandoned (no row was ever created for it
        // until completion). Needs this event added to the Stripe
        // dashboard's webhook subscription list; see this file's header.
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment') {
          const paymentId = session.metadata?.foundation_payment_id
          if (paymentId) await markFoundationPaymentFailed(paymentId)
        }
        break
      }

      case 'customer.subscription.updated': {
        // Renewals and plan changes — refresh current_period_end and status
        // so a lapsed/past_due subscription doesn't silently keep showing
        // as active.
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) { console.error('subscription.updated missing user_id metadata', sub.id); break }
        await supabase.from('subscriptions').update({
          status: sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'canceled',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) { console.error('subscription.deleted missing user_id metadata', sub.id); break }
        await supabase.from('subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'invoice.payment_failed': {
        // Not yet wired to a follow-up email (Resend isn't configured).
        // Logged for now so a failed payment is at least visible in
        // function logs rather than silently ignored.
        const invoice = event.data.object as Stripe.Invoice
        console.warn('Payment failed for customer', invoice.customer, 'invoice', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    // Stripe retries on non-2xx, so a DB hiccup gets another attempt rather
    // than silently dropping the event.
    console.error(`Error handling ${event.type}:`, err)
    return new Response(JSON.stringify({ error: 'Internal error processing webhook' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
