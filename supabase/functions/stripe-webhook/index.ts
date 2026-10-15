// Handles Stripe webhook events and keeps public.subscriptions (Pro
// subscriptions), public.foundation_payments (Foundation Blueprint
// one-time document charges, task #95), public.coach_payments (Elevation
// coach booking charges, task #95's sibling) AND public.board_listing_payments
// (Ad Board / Marketplace "Providing Services" listing charges, pricing
// doc §1.6/§1.7) in sync.
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
// invoice.payment_failed, account.updated
// (checkout.session.expired is new as of task #95 — needed so an
// abandoned Foundation checkout doesn't leave its foundation_payments row
// stuck on 'pending' forever. This needs an actual Stripe dashboard
// config change outside this codebase — see task #95's report. Also now
// needed for coach_payments, same reason.)
//
// account.updated is new as of the Stripe Connect coach-payout work
// (20261015150039) and needs its OWN manual Dashboard step beyond just
// adding it to this list: the webhook endpoint must also have "Listen to
// events on Connected accounts" enabled, since account.updated fires on a
// connected account (a coach's Express account), not the platform account
// itself. See handleConnectAccountUpdated's own comment below.
//
// Writes to public.subscriptions (tier/status/current_period_end/
// stripe_customer_id/stripe_subscription_id), not profiles — that's the
// real schema (see migration 20260606160000_subscriptions.sql and how
// AuthContext.jsx derives isPro). An earlier version of this file's TODO
// comments referenced a nonexistent profiles.is_pro column; same bug class
// already found and fixed on the website's SubscriptionManagementPage.
//
// checkout.session.completed now covers four distinct kinds of session —
// session.mode distinguishes the subscription case, and session.metadata.kind
// distinguishes the three 'payment'-mode cases, same way Stripe itself
// reports both back verbatim (a Checkout Session's mode and metadata are
// fixed at creation):
//   'subscription'                     -> Pro/Premium (create-checkout-session), unchanged.
//   'payment', kind 'foundation_one_time' -> a single Foundation Blueprint
//                                            document (create-foundation-checkout-session, task #95).
//   'payment', kind 'coach_booking'       -> a single Elevation coach booking
//                                            (create-coach-checkout-session, task #95's sibling).
//   'payment', kind 'board_listing_payment' -> a single Ad Board ad or
//                                            Marketplace "Providing Services"
//                                            listing (create-board-listing-
//                                            checkout-session, pricing doc
//                                            §1.6/§1.7). Unlike the other two,
//                                            the listing row does not exist
//                                            yet when checkout starts — this
//                                            is the one case where the
//                                            webhook itself inserts the real
//                                            content row (see
//                                            markBoardListingPaymentPaid below).

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

// Task #95's sibling (Elevation) — marks a coach booking payment paid once
// Stripe actually confirms the charge, and flips its coach_bookings row from
// 'pending_payment' to 'requested' in the same breath. That second update is
// what makes the booking "real" (notify_on_coach_booking's own comment) —
// the coach_bookings row existed before this (inserted by the client as
// 'pending_payment'), but it isn't a request the coach/Ops should see or act
// on until a real charge backs it. Matched by booking_id (set in checkout
// session metadata at creation, create-coach-checkout-session/index.ts),
// same as foundation_payment_id above — already known and unique, no
// ambiguity to resolve.
async function markCoachPaymentPaid(paymentId: string, bookingId: string | undefined, paymentIntentId: string | null) {
  // .select() on the UPDATE: returns the row only when the update actually
  // matched (first time pending -> paid). A retried webhook delivery for an
  // already-paid payment matches zero rows, so `updatedPayment` comes back
  // null and the Connect payout attempt below is correctly skipped — this
  // is what makes attemptCoachPayout() idempotent against Stripe's own
  // at-least-once delivery guarantee, with no separate dedupe table needed.
  const { data: updatedPayment, error } = await supabase
    .from('coach_payments')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('status', 'pending') // don't resurrect a row already marked failed/canceled
    .select('id, coach_slug, amount_cents')
    .maybeSingle()
  if (error) console.error('[stripe-webhook] could not mark coach_payments paid', paymentId, error)

  if (!bookingId) {
    console.error('[stripe-webhook] coach payment completed with no booking_id in metadata', paymentId)
  } else {
    const { error: bookingErr } = await supabase
      .from('coach_bookings')
      .update({ status: 'requested', paid: true })
      .eq('id', bookingId)
      .eq('status', 'pending_payment') // don't resurrect a booking already cancelled
    if (bookingErr) console.error('[stripe-webhook] could not flip coach_bookings to requested', bookingId, bookingErr)
  }

  // Stripe Connect automated coach payout (20261015150039) — only ever
  // attempted the first time this exact payment flips pending -> paid (see
  // the .select()/maybeSingle() comment above).
  if (updatedPayment) {
    await attemptCoachPayout(updatedPayment.id, updatedPayment.coach_slug, updatedPayment.amount_cents)
  }
}

// Computes the coach's share via the SAME commission helper
// get_my_coach_earnings() uses (public._coach_commission_for — never a
// second, possibly-drifted copy of that CASE logic) and, only when a real
// commission split is resolvable AND the coach has a verified Stripe
// Connect account, creates an actual Stripe Transfer for that share. Every
// outcome — transferred, or correctly not attempted, or attempted and
// rejected by Stripe — is recorded exactly once in coach_payment_transfers
// (coach_payment_id is unique on that table), so this is also idempotent
// against being called twice for the same payment by accident.
async function attemptCoachPayout(coachPaymentId: string, coachSlug: string, grossAmountCents: number) {
  try {
    const { data: coachProfile, error: profileErr } = await supabase
      .from('coach_profiles')
      .select('id')
      .eq('coach_slug', coachSlug)
      .maybeSingle()
    if (profileErr || !coachProfile) {
      console.error('[stripe-webhook] attemptCoachPayout: no coach_profiles row for', coachSlug, profileErr)
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: null, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, status: 'pending', pending_reason: 'pending_tier_assignment',
      })
      return
    }

    // Service-role call to the internal helper — _coach_commission_for is
    // deliberately NOT granted to anon/authenticated (see its own migration
    // comment), only to service_role, which is exactly what this client is.
    const { data: commissionRows, error: commissionErr } = await supabase
      .rpc('_coach_commission_for', { _coach_profile_id: coachProfile.id })
    if (commissionErr) {
      console.error('[stripe-webhook] attemptCoachPayout: commission RPC failed', coachPaymentId, commissionErr)
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, status: 'failed', error_message: `commission lookup failed: ${commissionErr.message}`,
      })
      return
    }

    const commission = commissionRows?.[0]
    if (!commission || commission.pending_tier_assignment || commission.commission_pct == null) {
      // Signature / unassigned tier / unset payment_option / Option B with
      // no logged rate yet — same "never guessed" case
      // get_my_coach_earnings() already shows the coach as a gross-only
      // figure. Nothing to transfer; Finance/Founder resolve this manually
      // once the tier/payment_option is actually assigned.
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, status: 'pending', pending_reason: 'pending_tier_assignment',
      })
      return
    }

    const commissionPct = Number(commission.commission_pct)
    const coachShareCents = Math.round(grossAmountCents * (100 - commissionPct) / 100)

    const { data: connectAccount, error: connectErr } = await supabase
      .from('coach_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('coach_profile_id', coachProfile.id)
      .maybeSingle()
    if (connectErr) {
      console.error('[stripe-webhook] attemptCoachPayout: connect account lookup failed', coachPaymentId, connectErr)
    }

    if (!connectAccount) {
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, commission_pct: commissionPct, commission_source: commission.commission_source,
        coach_share_cents: coachShareCents, status: 'pending', pending_reason: 'no_connect_account',
      })
      return
    }
    if (!connectAccount.charges_enabled || !connectAccount.payouts_enabled) {
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, commission_pct: commissionPct, commission_source: commission.commission_source,
        coach_share_cents: coachShareCents, stripe_connect_account_id: connectAccount.stripe_account_id,
        status: 'pending', pending_reason: 'connect_account_not_verified',
      })
      return
    }

    let transfer
    try {
      transfer = await stripe.transfers.create({
        amount: coachShareCents,
        currency: 'eur',
        destination: connectAccount.stripe_account_id,
        transfer_group: `coach_payment_${coachPaymentId}`,
        metadata: { coach_payment_id: coachPaymentId, coach_slug: coachSlug },
      })
    } catch (stripeErr) {
      console.error('[stripe-webhook] attemptCoachPayout: stripe.transfers.create failed', coachPaymentId, stripeErr)
      await recordPayoutAttempt({
        coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
        gross_amount_cents: grossAmountCents, commission_pct: commissionPct, commission_source: commission.commission_source,
        coach_share_cents: coachShareCents, stripe_connect_account_id: connectAccount.stripe_account_id,
        status: 'failed', error_message: stripeErr instanceof Error ? stripeErr.message : 'Stripe transfer failed.',
      })
      return
    }

    await recordPayoutAttempt({
      coach_payment_id: coachPaymentId, coach_profile_id: coachProfile.id, coach_slug: coachSlug,
      gross_amount_cents: grossAmountCents, commission_pct: commissionPct, commission_source: commission.commission_source,
      coach_share_cents: coachShareCents, stripe_connect_account_id: connectAccount.stripe_account_id,
      stripe_transfer_id: transfer.id, status: 'transferred', transferred_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[stripe-webhook] attemptCoachPayout unexpected error', coachPaymentId, err)
    await recordPayoutAttempt({
      coach_payment_id: coachPaymentId, coach_profile_id: null, coach_slug: coachSlug,
      gross_amount_cents: grossAmountCents, status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

async function recordPayoutAttempt(row: Record<string, unknown>) {
  // coach_payment_id is unique on this table — if a duplicate call somehow
  // slipped past markCoachPaymentPaid's own pending->paid guard, this insert
  // simply fails loudly rather than ever recording two attempts for the
  // same payment.
  const { error } = await supabase.from('coach_payment_transfers').insert(row)
  if (error) console.error('[stripe-webhook] could not record coach_payment_transfers row', row.coach_payment_id, error)
}

// Keeps coach_connect_accounts in sync with Stripe's own view of a coach's
// Express account — fires on every change Stripe makes to that account
// object (onboarding step completed, a capability enabled, a requirement
// added, etc.), not just the final "fully verified" moment.
//
// IMPORTANT — needs a Stripe Dashboard config step this codebase cannot do
// for itself (same class of manual step this file's header already flags
// for checkout.session.expired): the webhook endpoint must have "Listen to
// events on Connected accounts" turned on, AND account.updated added to its
// subscribed event list. Without that, Stripe never sends this event here
// at all and coach_connect_accounts only ever updates via this function's
// own on-demand stripe.accounts.retrieve() calls (create-coach-connect-
// account, on every "continue onboarding" click) — which still works, just
// not instantly the moment Stripe itself finishes verifying the coach.
async function handleConnectAccountUpdated(account: Stripe.Account) {
  const { error } = await supabase
    .from('coach_connect_accounts')
    .update({
      details_submitted: !!account.details_submitted,
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id)
  if (error) console.error('[stripe-webhook] could not update coach_connect_accounts from account.updated', account.id, error)
}

async function markCoachPaymentFailed(paymentId: string) {
  const { error } = await supabase
    .from('coach_payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('status', 'pending')
  if (error) console.error('[stripe-webhook] could not mark coach_payments failed', paymentId, error)
  // coach_bookings itself is deliberately left at 'pending_payment' — the
  // student can retry checkout against the same booking row (same
  // abandoned-checkout tradeoff foundation_payments already accepts).
}

// Ad Board / Marketplace "Providing Services" listing charge (pricing doc
// §1.6/§1.7). The one payment kind where the content row does not exist
// before checkout — board_listing_payments.payload holds the exact
// insert-ready row (captured at checkout-creation time by
// create-board-listing-checkout-session), and this is the only place that
// ever inserts it, only once Stripe has actually confirmed the charge.
//
// The update's `.eq('status', 'pending')` doubles as the idempotency guard:
// on a retried webhook delivery for the same event, the update matches zero
// rows (status is already 'paid') and `.select().maybeSingle()` returns
// null, so the insert below is skipped — the listing is never created
// twice. created_listing_id is set in a second update once the insert
// succeeds, same two-step shape foundation_payments' paid_at/status update
// already uses elsewhere in this file.
async function markBoardListingPaymentPaid(paymentId: string, paymentIntentId: string | null) {
  const { data: row, error } = await supabase
    .from('board_listing_payments')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('status', 'pending')
    .select('listing_kind, payload')
    .maybeSingle()
  if (error) {
    console.error('[stripe-webhook] could not mark board_listing_payments paid', paymentId, error)
    return
  }
  if (!row) return // already processed (webhook retry) or unknown id

  const targetTable = row.listing_kind === 'ad_board' ? 'ads' : 'marketplace_skills'
  const { data: listingRow, error: insertErr } = await supabase
    .from(targetTable)
    .insert(row.payload)
    .select('id')
    .single()
  if (insertErr || !listingRow) {
    console.error(`[stripe-webhook] could not insert ${targetTable} row after payment`, paymentId, insertErr)
    return
  }
  const { error: linkErr } = await supabase
    .from('board_listing_payments')
    .update({ created_listing_id: listingRow.id, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
  if (linkErr) console.error('[stripe-webhook] could not link created_listing_id', paymentId, linkErr)
}

async function markBoardListingPaymentFailed(paymentId: string) {
  const { error } = await supabase
    .from('board_listing_payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('status', 'pending')
  if (error) console.error('[stripe-webhook] could not mark board_listing_payments failed', paymentId, error)
  // Nothing was ever created for this attempt, so there's no content row to
  // roll back — the student can simply fill the form in again.
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
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
          const kind = session.metadata?.kind

          if (kind === 'coach_booking') {
            // Elevation coach booking charge (task #95's sibling).
            const paymentId = session.metadata?.coach_payment_id
            if (!paymentId) {
              console.error('checkout.session.completed (coach_booking) missing coach_payment_id metadata', session.id)
              break
            }
            await markCoachPaymentPaid(paymentId, session.metadata?.booking_id, paymentIntentId)
            break
          }

          if (kind === 'board_listing_payment') {
            // Ad Board / Marketplace "Providing Services" listing charge
            // (pricing doc §1.6/§1.7) — the one kind that inserts the real
            // content row itself; see markBoardListingPaymentPaid's comment.
            const paymentId = session.metadata?.board_listing_payment_id
            if (!paymentId) {
              console.error('checkout.session.completed (board_listing_payment) missing board_listing_payment_id metadata', session.id)
              break
            }
            await markBoardListingPaymentPaid(paymentId, paymentIntentId)
            break
          }

          // Foundation Blueprint one-time document charge (task #95) —
          // the default/only other payment-mode kind. Older sessions
          // created before `kind` existed on foundation_payment_id-bearing
          // sessions also fall through here correctly.
          const paymentId = session.metadata?.foundation_payment_id
          if (!paymentId) {
            console.error('checkout.session.completed (payment mode) missing foundation_payment_id metadata', session.id)
            break
          }
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
        // Only meaningful for one-time payment sessions (Foundation or
        // coach booking) — a Pro/Premium subscription checkout has nothing
        // in `subscriptions` to roll back if it's abandoned (no row was
        // ever created for it until completion). Needs this event added to
        // the Stripe dashboard's webhook subscription list; see this
        // file's header.
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment') {
          if (session.metadata?.kind === 'coach_booking') {
            const paymentId = session.metadata?.coach_payment_id
            if (paymentId) await markCoachPaymentFailed(paymentId)
          } else if (session.metadata?.kind === 'board_listing_payment') {
            const paymentId = session.metadata?.board_listing_payment_id
            if (paymentId) await markBoardListingPaymentFailed(paymentId)
          } else {
            const paymentId = session.metadata?.foundation_payment_id
            if (paymentId) await markFoundationPaymentFailed(paymentId)
          }
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

      case 'account.updated': {
        // Stripe Connect Express account status changed (onboarding step,
        // capability enabled/disabled, new requirement, etc.) — see
        // handleConnectAccountUpdated's own comment for the Dashboard config
        // this needs to actually arrive here.
        const account = event.data.object as Stripe.Account
        await handleConnectAccountUpdated(account)
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
