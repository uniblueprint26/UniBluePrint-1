import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GA_ID = 'G-YKY97WYWQD'

export default function CookieBanner() {
  const [consent, setConsent] = useState(() => localStorage.getItem('ubp_cookie_consent'))
  const [showPreferences, setShowPreferences] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)

  useEffect(() => {
    if (consent === 'accepted' && !document.getElementById('ga-script')) {
      const script = document.createElement('script')
      script.id = 'ga-script'
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      script.async = true
      document.head.appendChild(script)
      window.dataLayer = window.dataLayer || []
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
      window.gtag('js', new Date())
      window.gtag('config', GA_ID)
    }
  }, [consent])

  if (consent) return null

  function choose(value) {
    localStorage.setItem('ubp_cookie_consent', value)
    setConsent(value)
  }

  // "Manage Preferences" opens the one real choice there currently is
  // (Google Analytics is the only cookie category that's actually optional —
  // see CookiesPage.jsx sections 2-4). Saving here still only ever writes
  // 'accepted' or 'rejected' to ubp_cookie_consent, same two values Accept
  // All / Reject All write, so it stays consistent with what the Cookie
  // Policy documents about that key.
  if (showPreferences) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 500,
        background: '#FFFFFF',
        boxShadow: '0 -4px 20px rgba(30,58,95,0.1)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', margin: 0, fontWeight: '600' }}>
          Manage cookie preferences
        </p>
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#374151',
          cursor: 'default',
        }}>
          <input type="checkbox" checked disabled style={{ marginTop: '3px' }} />
          <span><strong>Strictly necessary</strong> — always on, required for sign-in and core functionality.</span>
        </label>
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#374151',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={analyticsChecked}
            onChange={e => setAnalyticsChecked(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
          <span><strong>Analytics</strong> — Google Analytics, helps us understand how the Platform is used. See the{' '}
            <Link to="/cookies" style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'underline' }}>Cookie Policy</Link>.
          </span>
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => choose(analyticsChecked ? 'accepted' : 'rejected')}
            style={{
              height: '40px', padding: '0 20px',
              background: '#1E3A5F', color: '#F5F0E8',
              border: 'none', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Save preferences
          </button>
          <button
            onClick={() => setShowPreferences(false)}
            style={{
              height: '40px', padding: '0 20px',
              background: 'none', color: '#1E3A5F',
              border: '1.5px solid rgba(30,58,95,0.2)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 500,
      background: '#FFFFFF',
      boxShadow: '0 -4px 20px rgba(30,58,95,0.1)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        color: '#1E3A5F',
        flex: '1 1 280px',
        maxWidth: '500px',
        margin: 0,
        lineHeight: 1.6,
      }}>
        We use cookies to improve your experience.{' '}
        <Link to="/cookies" style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'underline' }}>
          See our Cookie Policy
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => choose('accepted')}
          style={{
            height: '40px', padding: '0 20px',
            background: '#1E3A5F', color: '#F5F0E8',
            border: 'none', borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Accept All
        </button>
        <button
          onClick={() => setShowPreferences(true)}
          style={{
            height: '40px', padding: '0 20px',
            background: 'none', color: '#1E3A5F',
            border: '1.5px solid rgba(30,58,95,0.2)',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Manage Preferences
        </button>
        <button
          onClick={() => choose('rejected')}
          style={{
            background: 'none', border: 'none',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
            color: '#6B7280', cursor: 'pointer',
            padding: '0 8px', textDecoration: 'underline',
            whiteSpace: 'nowrap',
          }}
        >
          Reject All
        </button>
      </div>
    </div>
  )
}
