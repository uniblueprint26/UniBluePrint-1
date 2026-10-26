import { useEffect, useState } from 'react'
import { NAVY, FONT_SERIF, FONT_SANS, tint } from './theme'
import { getQuotePool } from './quotes'
import { getActiveStudioGreeting } from '../../lib/studioMetrics'

// Studio Phase 12 -- replaces QuoteBanner as what StudioShell renders near
// the top of every hub. Same spot, same job (a welcome moment), but now a
// REAL personalization system instead of an always-generic quote rotation:
//
//   1. an active message aimed at THIS person specifically (studio_
//      greetings, scope='user'), if one exists
//   2. else an active message aimed at everyone on THIS hub (scope='team')
//   3. else the existing quotes.js pool for this hub, unchanged -- so a hub
//      the founder hasn't written anything for yet still shows something,
//      never an empty greeting area.
//
// Rendered in the hub's own accent color (the founder's own correction:
// "team colour accent with a greeting for the team member not just a
// massive white page") -- a filled accent chip + larger serif line, not a
// small caption, so it reads as a genuine welcome rather than decoration.
export default function GreetingBanner({ hubKey, accentColor = NAVY }) {
  const [state, setState] = useState({ loading: true, message: null, source: 'quote' })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    getActiveStudioGreeting(hubKey)
      .then(res => {
        if (cancelled) return
        const resolved = res?.value
        if (resolved?.message) {
          setState({ loading: false, message: resolved.message, source: resolved.source })
        } else {
          setState({ loading: false, message: pickQuote(hubKey), source: 'quote' })
        }
      })
      .catch(() => {
        if (cancelled) return
        // RPC failed (offline, not yet authenticated, etc.) -- the quote
        // pool fallback still applies so the greeting area is never empty.
        setState({ loading: false, message: pickQuote(hubKey), source: 'quote' })
      })
    return () => { cancelled = true }
  }, [hubKey])

  return (
    <figure
      className="studio-greeting studio-fade-in"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px', margin: '0 0 var(--studio-gap, 24px)',
        background: tint(accentColor, 0.1), border: `1px solid ${tint(accentColor, 0.28)}`, borderRadius: '14px',
        padding: '18px 22px', position: 'relative', overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontSize: '22px', color: 'var(--studio-white)', lineHeight: 1 }}>&ldquo;</span>
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: accentColor, margin: '0 0 4px',
        }}>
          {state.source === 'user' ? 'A note for you' : state.source === 'team' ? 'From the team' : 'Welcome back'}
        </p>
        <blockquote
          key={state.message}
          style={{
            margin: 0, fontFamily: FONT_SERIF, fontSize: '17px', lineHeight: 1.45, color: 'var(--studio-navy)',
            fontStyle: 'italic', opacity: state.loading ? 0.45 : 1, transition: 'opacity 150ms',
          }}
        >
          {state.message || ' '}
        </blockquote>
      </div>
    </figure>
  )
}

function pickQuote(hubKey) {
  const pool = getQuotePool(hubKey)
  return pool[0]
}
