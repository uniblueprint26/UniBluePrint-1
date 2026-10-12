// Stripe redirects here after a Foundation Blueprint one-time document
// payment (create-foundation-checkout-session's success_url, task #95).
// Deliberately NOT behind ProtectedRoute like SubscriptionSuccessPage is —
// this checkout is always started from the app (an external browser tab
// opened via Linking.openURL), so there is no guarantee this browser has
// any website session/cookie at all. This page can't usefully verify
// anything itself either: Foundation payments are scoped per-document, not
// a simple "is this user Pro" flag, and the paying app instance is already
// polling public.foundation_payments directly to detect confirmation — this
// page only needs to tell the student what to do next.
import { Helmet } from 'react-helmet-async'
import { CheckCircle } from 'lucide-react'

export default function FoundationPaymentSuccessPage() {
  return (
    <>
      <Helmet>
        <title>Payment Received | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{
        background: '#F5F0E8', minHeight: '80vh',
        padding: '80px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '48px 40px' }}>
            <CheckCircle size={56} color="#16A34A" style={{ margin: '0 auto 20px' }} />
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F' }}>
              Payment received
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '12px', lineHeight: 1.6 }}>
              Thanks — your Foundation Blueprint request is paid for. Return to the UniBlueprint app on your phone to finish submitting it to a Campus Handler. You can close this tab now.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', marginTop: '20px' }}>
              A receipt has been sent to your email. If anything looks wrong with this payment, <a href="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>contact us</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
