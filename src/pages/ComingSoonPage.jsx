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

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, Mail, Instagram } from 'lucide-react'
import { supabase } from '../lib/supabase'
import UBPLogo from '../components/ui/UBPLogo'

// ─── Countdown to 1 September 2026 ────────────────────────────────────────────

const LAUNCH_DATE = new Date('2026-09-01T00:00:00+01:00')

function calcTimeLeft() {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now())
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  }
}

function CountdownTimer() {
  const [time, setTime] = useState(calcTimeLeft)
  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { value: time.days,    label: 'Days' },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <div style={{
      display: 'flex', gap: '8px', justifyContent: 'center',
      flexWrap: 'wrap', marginTop: '32px',
    }}>
      {units.map(({ value, label }) => (
        <div key={label} className="countdown-card" style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: '8px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p className="countdown-value" style={{
            fontFamily: "'DM Serif Display', serif",
            color: '#F5F0E8', lineHeight: 1,
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: 'rgba(245,240,232,0.6)', marginTop: '4px',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── ComingSoonPage ────────────────────────────────────────────────────────────

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
        <title>Coming Soon | UniBlueprint</title>
        <meta name="description" content="The UniBlueprint Budgeting Tool is coming soon. Track your income, expenses, and savings as a student in Ireland." />
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px', textAlign: 'center' }}>
        <Link to="/" aria-label="UniBlueprint home" style={{ display: 'inline-block', marginBottom: '40px' }}>
          <UBPLogo height={100} color="#F5F0E8" />
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '56px', color: '#F5F0E8', lineHeight: 1.1 }}>
          Coming Soon
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: 'rgba(245,240,232,0.7)',
          margin: '16px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          The UniBlueprint Budgeting Tool is in development. Track your income, expenses, and savings as a student in Ireland.
        </p>
        <CountdownTimer />
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
              We will notify you when UniBlueprint launches at your university.
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
                  placeholder="Enter your email for early access"
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

      {/* SOCIAL + FOOTER */}
      <section style={{ background: '#FFFFFF', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Follow us for updates
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://www.instagram.com/uniblueprint26"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              height: '40px', padding: '0 16px',
              border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
              color: '#1E3A5F', textDecoration: 'none',
            }}
          >
            <Instagram size={16} color="#1E3A5F" />
            @uniblueprint26
          </a>
          <a
            href="https://www.tiktok.com/@uniblueprint26"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              height: '40px', padding: '0 16px',
              border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
              color: '#1E3A5F', textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E3A5F" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/>
            </svg>
            @uniblueprint26
          </a>
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF',
          marginTop: '32px',
        }}>
          The Structure Behind Your Success
        </p>
      </section>
    </>
  )
}
