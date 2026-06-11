// TODO: Send confirmation email via Resend or Supabase Edge Function when a new early access
// signup is submitted. Email should confirm their spot and set expectations on launch timeline.

/*
  TODO: Create Supabase table:

  create table early_access_signups (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    email text not null unique,
    source text default 'coming_soon'
  );
*/

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) return
    setLoading(true); setError(null); setDuplicate(false)
    const { error: dbError } = await supabase
      .from('early_access_signups')
      .insert([{ email, source: 'coming_soon' }])
    if (dbError) {
      if (dbError.code === '23505') {
        setDuplicate(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <>
      <Helmet>
        <title>Coming Soon | Uniblueprint</title>
        <meta name="description" content="Uniblueprint is coming to Irish universities in September 2026. Sign up for early access." />
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: 'rgba(245,240,232,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          September 2026
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '56px', color: '#F5F0E8', marginTop: '8px', lineHeight: 1.1 }}>
          Something big<br />is coming
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: 'rgba(245,240,232,0.7)',
          margin: '16px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          Uniblueprint launches across Irish universities at freshers week. Be first to know.
        </p>
      </section>

      {/* EMAIL CAPTURE */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '16px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '40px 32px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Mail size={26} color="#1E3A5F" />
            </div>

            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F' }}>
              Get early access
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>
              We will notify you when Uniblueprint launches at your university.
            </p>

            {success ? (
              <div style={{ marginTop: '24px' }}>
                <CheckCircle size={40} color="#16A34A" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
                  You are on the list
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                  We will be in touch before September 2026.
                </p>
              </div>
            ) : duplicate ? (
              <div style={{ marginTop: '24px' }}>
                <CheckCircle size={40} color="#16A34A" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
                  You are already on the list
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                  We have got your email — we will be in touch before launch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                {error && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '8px' }}>
                    {error}
                  </p>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@university.ie"
                  required
                  aria-label="Email address"
                  style={{
                    width: '100%', height: '48px',
                    border: '1.5px solid rgba(30,58,95,0.15)',
                    borderRadius: '8px',
                    paddingLeft: '14px', paddingRight: '14px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#1E3A5F',
                    background: '#FFFFFF', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.15)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: '48px',
                    background: loading ? 'rgba(30,58,95,0.4)' : '#1E3A5F',
                    color: '#F5F0E8', border: 'none', borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms',
                  }}
                >
                  {loading ? 'Signing up…' : 'Notify me at launch'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section style={{ background: '#FFFFFF', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
          Want to know more?{' '}
          <Link to="/how-it-works" style={{ color: '#1E3A5F', fontWeight: '600' }}>How it works</Link>
          {' · '}
          <Link to="/pricing" style={{ color: '#1E3A5F', fontWeight: '600' }}>Pricing</Link>
          {' · '}
          <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '600' }}>Contact us</Link>
        </p>
      </section>
    </>
  )
}
