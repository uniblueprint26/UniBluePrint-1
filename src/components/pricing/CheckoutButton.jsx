// TODO: Activate real checkout when Stripe is ready
//
// Implementation steps:
//   1. Complete setup in src/lib/stripe.js (uncomment loadStripe)
//   2. Fill in price IDs in src/lib/stripe-products.js
//   3. Deploy supabase/functions/stripe-webhook/index.ts
//   4. Replace the modal below with a real Stripe Checkout redirect:
//
//   import stripePromise from '../../lib/stripe'
//   import { STRIPE_PRODUCTS } from '../../lib/stripe-products'
//   import { supabase } from '../../lib/supabase'
//
//   async function handleCheckout() {
//     setLoading(true)
//     // Call a Supabase Edge Function to create a Checkout Session
//     const { data, error } = await supabase.functions.invoke('create-checkout-session', {
//       body: { priceId: STRIPE_PRODUCTS[plan].priceId }
//     })
//     if (error || !data?.url) { setLoading(false); return }
//     const stripe = await stripePromise
//     await stripe.redirectToCheckout({ sessionId: data.sessionId })
//     // OR: window.location.href = data.url  (for Stripe-hosted checkout)
//   }

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, X } from 'lucide-react'

export default function CheckoutButton({ label = 'Get Pro', style: extraStyle }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
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
          cursor: 'pointer',
          width: '100%',
          transition: 'opacity 150ms',
          ...extraStyle,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        {label}
      </button>

      {/* Coming Soon modal */}
      {open && (
        <>
          {/* Backdrop */}
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

          {/* Card */}
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
            {/* Close */}
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

            {/* Icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <Clock size={48} color="#1E3A5F" aria-hidden="true" />
            </div>

            {/* Heading */}
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

            {/* Body */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}>
              Download the app to get started with UniBlueprint.
            </p>

            {/* CTA */}
            <Link
              to="/download"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '52px',
                background: '#1E3A5F',
                color: '#F5F0E8',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              Download the App
            </Link>

            {/* Close link */}
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
