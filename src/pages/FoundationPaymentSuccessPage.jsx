// Stripe redirects here after a Foundation Blueprint one-time document payment
// (create-foundation-checkout-session's success_url). That URL is shared by
// two flows:
//
//  - Started in the mobile app: opened in an external browser that may have no
//    website session at all. The app polls public.foundation_payments itself
//    and submits the document, so this page must NOT submit — doing so would
//    queue the same document twice (submit_document_for_review has no
//    idempotency guard).
//  - Started on the website: payAndSubmit() left a pending-checkout marker in
//    this browser's sessionStorage before redirecting. Only then does this
//    page wait for Stripe's webhook to mark the payment paid and then finish
//    the submission.
//
// Deliberately not behind ProtectedRoute, for the app case above.
import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { submitForReview } from '../lib/submitForReview'
import { readPendingCheckout, clearPendingCheckout, FOUNDATION_PRICING } from '../lib/foundationPayment'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 90000

export default function FoundationPaymentSuccessPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { user, loading: authLoading } = useAuth()
  const [pending] = useState(() => readPendingCheckout())
  // idle (app flow) | waiting | submitting | done | timeout | error | signin
  const [phase, setPhase] = useState(pending ? 'waiting' : 'idle')
  const [message, setMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!pending || started.current || authLoading) return
    if (!user) { setPhase('signin'); return }
    if (!FOUNDATION_PRICING[pending.table]) { setPhase('error'); setMessage('Unrecognised document type.'); return }
    started.current = true

    let cancelled = false
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

    ;(async () => {
      try {
        const deadline = Date.now() + POLL_TIMEOUT_MS
        let paid = false
        while (!cancelled && Date.now() < deadline) {
          let q = supabase.from('foundation_payments').select('status').eq('document_table', pending.table).eq('document_id', pending.documentId).eq('tier', pending.tier).eq('status', 'paid')
          if (sessionId) q = q.eq('stripe_checkout_session_id', sessionId)
          const { data } = await q.limit(1).maybeSingle()
          if (data) { paid = true; break }
          await sleep(POLL_INTERVAL_MS)
        }
        if (cancelled) return
        if (!paid) { setPhase('timeout'); return }

        setPhase('submitting')
        // Another tab or a retry may have submitted already — never queue twice.
        const { data: doc } = await supabase.from(pending.table).select('status').eq('id', pending.documentId).maybeSingle()
        if (doc?.status !== 'submitted' && doc?.status !== 'delivered') {
          await submitForReview(pending.table, pending.documentId, pending.serviceName, pending.notes, pending.tier)
        }
        clearPendingCheckout()
        if (!cancelled) setPhase('done')
      } catch (err) {
        if (!cancelled) { setPhase('error'); setMessage(err.message || 'Something went wrong.') }
      }
    })()

    return () => { cancelled = true; started.current = false }
  }, [pending, user, authLoading, sessionId])

  return (
    <>
      <Helmet>
        <title>Payment Received | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{ background: '#F5F0E8', minHeight: '80vh', padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '48px 40px' }}>
            <Body phase={phase} message={message} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', marginTop: '20px' }}>
              A receipt has been sent to your email. If anything looks wrong with this payment, <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: 500 }}>contact us</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

const h1 = { fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F' }
const p = { fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '12px', lineHeight: 1.6 }
const btn = { display: 'inline-block', marginTop: '20px', padding: '12px 24px', background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, textDecoration: 'none' }

function Body({ phase, message }) {
  if (phase === 'waiting' || phase === 'submitting') {
    return (
      <>
        <Loader2 size={48} color="#1E3A5F" aria-hidden="true" style={{ margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
        <h1 style={h1}>{phase === 'waiting' ? 'Confirming your payment…' : 'Sending to your Handler…'}</h1>
        <p style={p}>This usually takes a few seconds. Please keep this page open.</p>
      </>
    )
  }
  if (phase === 'done') {
    return (
      <>
        <CheckCircle size={56} color="#16A34A" aria-hidden="true" style={{ margin: '0 auto 20px' }} />
        <h1 style={h1}>Paid and sent for review</h1>
        <p style={p}>A Campus Handler will review your request before it's delivered. You'll be notified when it's ready.</p>
        <Link to="/foundation/my-documents" style={btn}>View my documents</Link>
      </>
    )
  }
  if (phase === 'signin') {
    return (
      <>
        <CheckCircle size={56} color="#16A34A" aria-hidden="true" style={{ margin: '0 auto 20px' }} />
        <h1 style={h1}>Payment received</h1>
        <p style={p}>Sign in to finish sending your request to a Campus Handler.</p>
        <Link to="/sign-in" style={btn}>Sign in</Link>
      </>
    )
  }
  if (phase === 'timeout' || phase === 'error') {
    return (
      <>
        <AlertTriangle size={56} color="#D97706" aria-hidden="true" style={{ margin: '0 auto 20px' }} />
        <h1 style={h1}>{phase === 'timeout' ? 'Still confirming your payment' : 'We couldn’t finish sending it'}</h1>
        <p style={p}>
          {phase === 'error' && message ? `${message} ` : ''}
          Your payment is safe and you won’t be charged twice. Open your document and press submit again to finish — it will go straight through once the payment is confirmed.
        </p>
        <Link to="/foundation/my-documents" style={btn}>Go to my documents</Link>
      </>
    )
  }
  // idle: the checkout was started elsewhere (typically the mobile app).
  return (
    <>
      <CheckCircle size={56} color="#16A34A" aria-hidden="true" style={{ margin: '0 auto 20px' }} />
      <h1 style={h1}>Payment received</h1>
      <p style={p}>
        Thanks — your Foundation Blueprint request is paid for. If you started in the UniBlueprint app, return to it to finish submitting to a Campus Handler. You can close this tab now.
      </p>
    </>
  )
}
