// Issues a real Stripe refund against a paid Foundation Blueprint one-time
// payment (task #95's checkout/webhook flow had no refund path at all).
// Operations/Founder only — the same two staff roles get_ops_queue_snapshot()
// (20260810120100_portals_operations_schema.sql) already treats as
// equivalent, checked here with has_role() itself rather than a second,
// locally-reinvented notion of "is this user staff".
//
// Deploy: supabase functions deploy refund-foundation-payment
//
// Required Edge Function secrets (already configured for stripe-webhook /
// create-foundation-checkout-session — reused, not duplicated):
//   STRIPE_SECRET_KEY   — sk_test_xxx while in test mode, sk_live_xxx once live
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Flow:
//   1. Caller must be authenticated and hold the 'operations' or 'founder'
//      role (has_role(), via the service-role client — RLS plays no part in
//      this check, same reasoning as every has_role() call elsewhere).
//   2. Look up the submission (service-role — submissions RLS doesn't matter
//      here either) and, from its (document_table, document_id, tier,
//      user_id), the exact matching *paid* foundation_payments row — the
//      same lookup predicate submit_document_for_review() uses to gate
//      submission in the first place, run in reverse.
//   3. stripe.refunds.create() against that payment's stripe_payment_intent_id.
//   4. Only on Stripe's own confirmation: insert into public.refunds (the
//      existing table — see this migration's own comment for why it needed
//      no shape change), flip foundation_payments.status to 'refunded', and
//      set submissions.refunded_at/refund_id. A ticket_revisions row records
//      it too, so it shows up in TicketDetailScreen's existing "REVIEW
//      HISTORY" list exactly like a flag or incomplete note would.
//
// Not wired to a Stripe webhook event (e.g. charge.refunded) — the refund is
// created and confirmed synchronously in this one request/response, so
// there's nothing async left to reconcile for the normal case. If Stripe
// later reverses a refund (e.g. a failed bank transfer), that would need its
// own follow-up and isn't handled here; flagged in task handoff notes rather
// than added speculatively, and left out of stripe-webhook/index.ts entirely
// to avoid colliding with other work landing in that same file tonight.

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

    // Identify the caller under their own JWT first (same pattern as
    // create-foundation-checkout-session) — the role check below then runs
    // against that real, verified user id, not anything the client claims.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Not authenticated' }, 401)

    // Service-role client for everything else below — this function's own
    // authority (has_role(), the submission/payment lookups, and every
    // write) runs independently of RLS, same reasoning as stripe-webhook
    // and create-foundation-checkout-session's own service-role writes.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const [{ data: isOperations, error: opsErr }, { data: isFounder, error: founderErr }] = await Promise.all([
      supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'operations' }),
      supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'founder' }),
    ])
    if (opsErr || founderErr) {
      console.error('[refund-foundation-payment] has_role check failed', opsErr || founderErr)
      return jsonResponse({ error: 'Could not verify permissions. Please try again.' }, 500)
    }
    if (!isOperations && !isFounder) {
      return jsonResponse({ error: 'Only Operations or Founder can issue a refund.' }, 403)
    }

    const { submission_id, reason } = await req.json()
    if (!submission_id || typeof submission_id !== 'string') {
      return jsonResponse({ error: 'submission_id is required' }, 422)
    }
    const trimmedReason = typeof reason === 'string' ? reason.trim() : ''
    if (trimmedReason.length < 10) {
      return jsonResponse({ error: 'A refund reason of at least 10 characters is required.' }, 422)
    }

    const { data: submission, error: subErr } = await supabaseAdmin
      .from('submissions')
      .select('id, user_id, document_table, document_id, tier, refunded_at')
      .eq('id', submission_id)
      .single()
    if (subErr || !submission) return jsonResponse({ error: 'Submission not found.' }, 404)

    if (submission.refunded_at) {
      return jsonResponse({ error: 'This submission has already been refunded.' }, 409)
    }
    if (!submission.document_table || !submission.document_id || !submission.tier) {
      return jsonResponse({ error: 'This submission has no linked Foundation payment to refund.' }, 422)
    }

    // Same (document_table, document_id, tier, user_id, status='paid')
    // predicate submit_document_for_review() uses to find the payment that
    // gated this exact submission in the first place — the authoritative
    // "what did this submission actually charge" lookup, not a guess from
    // submissions.amount_cents (which is only a copy taken at submit time).
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('foundation_payments')
      .select('id, amount_cents, stripe_payment_intent_id, status')
      .eq('document_table', submission.document_table)
      .eq('document_id', submission.document_id)
      .eq('tier', submission.tier)
      .eq('user_id', submission.user_id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (payErr) {
      console.error('[refund-foundation-payment] payment lookup failed', payErr)
      return jsonResponse({ error: 'Could not look up this submission\'s payment. Please try again.' }, 500)
    }
    if (!payment) {
      return jsonResponse({ error: 'No paid Foundation payment found for this submission.' }, 404)
    }
    if (!payment.stripe_payment_intent_id) {
      return jsonResponse({ error: 'This payment has no Stripe payment intent on record — cannot refund automatically.' }, 409)
    }

    let stripeRefund
    try {
      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          submission_id: submission.id,
          foundation_payment_id: payment.id,
          refunded_by: user.id,
        },
      })
    } catch (stripeErr) {
      console.error('[refund-foundation-payment] stripe.refunds.create failed', stripeErr)
      return jsonResponse({ error: stripeErr instanceof Error ? stripeErr.message : 'Stripe refund failed.' }, 502)
    }

    // From here the money has actually moved — every write below is
    // best-effort bookkeeping, logged loudly on failure rather than thrown,
    // so a DB hiccup after a successful Stripe refund doesn't read back to
    // the caller as "the refund failed" when it didn't.
    const nowIso = new Date().toISOString()

    const { data: refundRow, error: refundInsertErr } = await supabaseAdmin
      .from('refunds')
      .insert({
        user_id: submission.user_id,
        submission_id: submission.id,
        amount_cents: payment.amount_cents,
        reason: trimmedReason,
        status: 'completed',
        processed_at: nowIso,
        processed_by: user.id,
      })
      .select('id')
      .single()
    if (refundInsertErr) {
      console.error('[refund-foundation-payment] CRITICAL: stripe refund', stripeRefund.id, 'succeeded but refunds row insert failed', refundInsertErr)
    }

    const { error: paymentUpdateErr } = await supabaseAdmin
      .from('foundation_payments')
      .update({ status: 'refunded', updated_at: nowIso })
      .eq('id', payment.id)
      .eq('status', 'paid')
    if (paymentUpdateErr) {
      console.error('[refund-foundation-payment] CRITICAL: stripe refund', stripeRefund.id, 'succeeded but foundation_payments update failed', paymentUpdateErr)
    }

    const { error: submissionUpdateErr } = await supabaseAdmin
      .from('submissions')
      .update({ refunded_at: nowIso, refund_id: refundRow?.id ?? null })
      .eq('id', submission.id)
    if (submissionUpdateErr) {
      console.error('[refund-foundation-payment] CRITICAL: stripe refund', stripeRefund.id, 'succeeded but submissions update failed', submissionUpdateErr)
    }

    await supabaseAdmin
      .from('ticket_revisions')
      .insert({
        submission_id: submission.id,
        revised_by: user.id,
        revision_notes: `Refunded (€${(payment.amount_cents / 100).toFixed(2)}): ${trimmedReason}`,
      })

    return jsonResponse({
      success: true,
      refund_id: refundRow?.id ?? null,
      stripe_refund_id: stripeRefund.id,
      amount_cents: payment.amount_cents,
    })
  } catch (err) {
    console.error('refund-foundation-payment error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 502)
  }
})
