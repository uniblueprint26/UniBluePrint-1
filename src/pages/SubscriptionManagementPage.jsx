// Billing is managed through Stripe's own Customer Portal — this page
// just opens it (create-portal-session), rather than re-building
// cancel/update-card/invoice-history flows Stripe already provides.
// Pro status lives in the 'subscriptions' table, not 'profiles' — same
// table and shape AuthContext.jsx reads for the isPro flag used site-wide.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { STRIPE_STATUS } from '../lib/stripe'

export default function SubscriptionManagementPage() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  useEffect(() => {
    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) setFetchError(true)
      else setSubscription(data)
      setLoading(false)
    }
    if (user) fetchSubscription()
  }, [user])

  async function openBillingPortal() {
    setPortalLoading(true)
    setPortalError('')
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session')
      if (error || !data?.url) {
        throw new Error(error?.message || 'Could not open the billing portal. Please try again.')
      }
      window.location.href = data.url
    } catch (err) {
      setPortalError(err.message || 'Something went wrong. Please try again.')
      setPortalLoading(false)
    }
  }

  const isPro = !!subscription && subscription.status === 'active' && (
    !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()
  )
  const planLabel = subscription?.tier === 'pro_annual' ? 'Pro — Annual'
    : subscription?.tier === 'pro_monthly' ? 'Pro — Monthly'
    : 'Pro'
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <Helmet>
        <title>Subscription | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{ background: '#F5F0E8', minHeight: '80vh', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#1E3A5F', marginBottom: '32px' }}>
            Subscription
          </h1>

          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader2 size={32} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
                Loading plan details…
              </p>
            </div>
          )}

          {!loading && !fetchError && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
              padding: '32px',
            }}>
              {/* Plan header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CreditCard size={22} color="#1E3A5F" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
                    {isPro ? planLabel : 'Free plan'}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </p>
                </div>
                {isPro && (
                  <span style={{
                    background: '#1E3A5F', color: '#F5F0E8',
                    borderRadius: '20px', padding: '4px 12px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    Pro
                  </span>
                )}
              </div>

              {/* Plan details */}
              <div style={{ borderTop: '1px solid rgba(30,58,95,0.08)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isPro ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>Status</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#16A34A', fontWeight: '500' }}>
                        <CheckCircle size={14} /> Active
                      </span>
                    </div>
                    {renewalDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>Next renewal</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500' }}>{renewalDate}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>Access level</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500' }}>Free features only</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isPro ? (
                  <>
                    <button
                      onClick={openBillingPortal}
                      disabled={portalLoading || STRIPE_STATUS !== 'configured'}
                      title={STRIPE_STATUS !== 'configured' ? 'Stripe isn’t configured yet' : undefined}
                      style={{
                        height: '44px', padding: '0 24px',
                        background: STRIPE_STATUS === 'configured' ? '#1E3A5F' : 'rgba(30,58,95,0.06)',
                        color: STRIPE_STATUS === 'configured' ? '#F5F0E8' : '#9CA3AF',
                        border: 'none', borderRadius: '8px',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                        cursor: portalLoading || STRIPE_STATUS !== 'configured' ? 'not-allowed' : 'pointer',
                        opacity: portalLoading ? 0.7 : 1,
                      }}
                    >
                      {portalLoading ? 'Opening billing portal…'
                        : STRIPE_STATUS === 'configured' ? 'Manage billing'
                        : 'Manage billing — coming soon'}
                    </button>
                    {!!portalError && (
                      <p style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626',
                      }}>
                        <AlertCircle size={14} /> {portalError}
                      </p>
                    )}
                  </>
                ) : (
                  <Link
                    to="/pricing"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: '44px', padding: '0 24px',
                      background: '#1E3A5F', color: '#F5F0E8',
                      borderRadius: '8px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    Upgrade to Pro
                  </Link>
                )}
                <Link
                  to="/contact"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '44px', padding: '0 24px',
                    background: 'none', color: '#6B7280',
                    border: '1.5px solid rgba(30,58,95,0.12)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Contact support
                </Link>
              </div>
            </div>
          )}

          {!loading && fetchError && (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
              padding: '32px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', lineHeight: 1.6 }}>
                Unable to load your plan details. Please try again or{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '600' }}>contact support</Link>.
              </p>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
