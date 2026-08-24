// TODO: This page receives redirect from Stripe after successful payment.
// Stripe webhook updates user Pro status in Supabase. Remove manual check once webhook is live.
// Pro status lives in the 'subscriptions' table, not 'profiles' — same
// table and shape AuthContext.jsx reads for the isPro flag used site-wide.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function SubscriptionSuccessPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('checking') // 'checking' | 'active' | 'none'

  useEffect(() => {
    async function checkPro() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle()
      const active = !error && data?.status === 'active' &&
        (!data.current_period_end || new Date(data.current_period_end) > new Date())
      setStatus(active ? 'active' : 'none')
    }
    if (user) checkPro()
  }, [user])

  return (
    <>
      <Helmet>
        <title>Subscription Confirmed | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{
        background: '#F5F0E8', minHeight: '80vh',
        padding: '80px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

          {status === 'checking' && (
            <>
              <Loader2 size={40} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280' }}>
                Verifying your subscription…
              </p>
            </>
          )}

          {status === 'active' && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '48px 40px' }}>
              <CheckCircle size={56} color="#16A34A" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>
                Welcome to Pro
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '12px', lineHeight: 1.6 }}>
                Your Pro subscription is now active. You have full access to Foundation Blueprint, Elevation Blueprint, and all Pro features.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                {[
                  'Foundation Blueprint services unlocked',
                  'Elevation Blueprint services unlocked',
                  'Priority Campus Handler and Uni Coach access',
                  'September trial pricing applies until 1 October 2026',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
                    <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/foundation-blueprint"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: '48px', padding: '0 28px',
                  background: '#1E3A5F', color: '#F5F0E8',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                Get started
              </Link>
            </div>
          )}

          {status === 'none' && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '48px 40px' }}>
              <AlertCircle size={56} color="#DC2626" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F' }}>
                No active subscription found
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '12px', lineHeight: 1.6 }}>
                We could not verify an active Pro subscription on your account. If you just completed a payment, please wait a moment and refresh. If the issue persists, contact us.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
                <Link
                  to="/pricing"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: '44px', padding: '0 24px',
                    background: '#1E3A5F', color: '#F5F0E8',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  Go to Pricing
                </Link>
                <Link
                  to="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: '44px', padding: '0 24px',
                    background: 'none', color: '#1E3A5F',
                    border: '1.5px solid rgba(30,58,95,0.2)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  Contact support
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
