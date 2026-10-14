import { invokeFunction } from './invokeFunction'
import { submitForReview } from './submitForReview'

/**
 * Pay-before-review for Foundation Blueprint on the website.
 *
 * submit_document_for_review() now refuses to create a submission unless a
 * `paid` foundation_payments row exists for that exact (table, document, tier,
 * user), and only stripe-webhook can mark one paid. So submitting is a
 * two-step: create a Stripe Checkout Session via
 * create-foundation-checkout-session, then — once Stripe has confirmed — call
 * submit_document_for_review as before. The server is the authority on price
 * and on the Pro discount; the numbers below are display-only.
 */

// Display-only copy of the canonical pricing (cents, EUR). The amount Stripe
// actually charges is decided server-side in create-foundation-checkout-session.
const STANDARD_DOC = { standard: 2000, premiumFree: 3600, premiumPro: 3000 }
export const FOUNDATION_PRICING = {
  cv_documents: STANDARD_DOC,
  linkedin_documents: STANDARD_DOC,
  cover_letters: STANDARD_DOC,
  application_forms: STANDARD_DOC,
  interview_prep_packs: STANDARD_DOC,
  personal_statements: STANDARD_DOC,
  job_search_sessions: { standard: 1500, premiumFree: 2600, premiumPro: 2200 },
  portfolio_plans: { standard: 3000, premiumFree: 4600, premiumPro: 3800 },
}

export function priceCents(table, tier, isPro) {
  const p = FOUNDATION_PRICING[table]
  if (!p) return null
  if (tier === 'premium') return isPro ? p.premiumPro : p.premiumFree
  return p.standard
}

export function formatEuro(cents) {
  const euros = cents / 100
  return `€${Number.isInteger(euros) ? euros : euros.toFixed(2)}`
}

// Held in sessionStorage so the success page can tell "this browser started
// this checkout" apart from a checkout the mobile app started (the success_url
// is shared). Only the former may auto-submit — see FoundationPaymentSuccessPage.
const PENDING_KEY = 'uniblueprint.foundationCheckout'

export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearPendingCheckout() {
  try { sessionStorage.removeItem(PENDING_KEY) } catch { /* storage unavailable */ }
}

function savePendingCheckout(pending) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending)) } catch { /* storage unavailable */ }
}

/**
 * Takes payment, then submits to the Handler queue.
 *
 * Resolves with the submission id when the document was already paid for
 * (idempotent retry) and has now been submitted. Resolves with `null` when the
 * browser is being sent to Stripe Checkout — the caller should stop and leave
 * its UI in a "working" state; submission completes on the success page.
 */
export async function payAndSubmit(table, documentId, serviceName, notes, tier = 'standard') {
  const res = await invokeFunction('create-foundation-checkout-session', {
    document_table: table,
    document_id: documentId,
    tier,
  })

  if (res?.already_paid) {
    return submitForReview(table, documentId, serviceName, notes, tier)
  }
  if (!res?.url) throw new Error('Could not start checkout. Please try again.')

  savePendingCheckout({ table, documentId, serviceName, notes, tier, paymentId: res.payment_id })
  window.location.assign(res.url)
  return null
}
