// TODO: Connect to Stripe Customer Portal when payments go live.
// For now show plan info and contact support link.
// Requires 'profiles' table with is_pro, pro_plan, pro_since, pro_expires_at fields.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function SubscriptionManagementPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, pro_plan, pro_since, pro_expires_at')
        .eq('id', user.id)
        .single()
      if (error) setFetchError(true)
      else setProfile(data)
      setLoading(false)
    }
    if (user) fetchProfile()
  }, [user])

  const isPro = profile?.is_pro
  const planLabel = profile?.pro_plan === 'annual' ? 'Pro — Annual'
    : profile?.pro_plan === 'monthly' ? 'Pro — Monthly'
    : 'Pro'
  const renewalDate = profile?.pro_expires_at
    ? new Date(profile.pro_expires_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
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
                  <button
                    disabled
                    title="Stripe Customer Portal coming soon"
                    style={{
                      height: '44px', padding: '0 24px',
                      background: 'rgba(30,58,95,0.06)', color: '#9CA3AF',
                      border: 'none', borderRadius: '8px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                      cursor: 'not-allowed',
                    }}
                  >
                    Manage billing — coming soon
                  </button>
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
