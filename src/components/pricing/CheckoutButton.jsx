import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, X, AlertCircle } from 'lucide-react'
import stripePromise, { STRIPE_STATUS } from '../../lib/stripe'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Two fallback states, shown instead of real checkout:
//  - not signed in: send to sign-up first (a checkout session needs a real
//    user id to attribute the subscription to, via client_reference_id)
//  - Stripe not configured yet (no VITE_STRIPE_PUBLISHABLE_KEY set): the
//    original "coming soon" modal, so the button is never a dead click
//    even before Stripe keys exist
export default function CheckoutButton({ tier = 'pro_monthly', label = 'Get Pro', style: extraStyle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (STRIPE_STATUS !== 'configured') {
      setOpen(true)
      return
    }
    if (!user) {
      navigate('/sign-up')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier },
      })
      if (fnError || !data?.url) {
        throw new Error(fnError?.message || 'Could not start checkout. Please try again.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '52px',
          padding: '0 32px',
          background: '#1E3A5F',
          color: '#F5F0E8',
          border: 'none',
          borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          fontWeight: '600',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
          width: '100%',
          transition: 'opacity 150ms',
          ...extraStyle,
        }}
        onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => !loading && (e.currentTarget.style.opacity = '1')}
      >
        {loading ? 'Redirecting to checkout…' : label}
      </button>

      {!!error && (
        <p style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginTop: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626',
        }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {/* Coming Soon modal — only shown while Stripe isn't configured */}
      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 400,
            }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 401,
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '48px 40px 40px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0px 8px 32px rgba(30,58,95,0.18)',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <Clock size={48} color="#1E3A5F" aria-hidden="true" />
            </div>

            <h2
              id="checkout-modal-title"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '24px',
                color: '#1E3A5F',
                marginBottom: '12px',
              }}
            >
              Payments Coming Soon
            </h2>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}>
              Download the app to get started with UniBlueprint.
            </p>

            <button
              onClick={() => { setOpen(false); navigate('/download') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '52px',
                background: '#1E3A5F',
                color: '#F5F0E8',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              Download the App
            </button>

            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#9CA3AF',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </>
  )
}
