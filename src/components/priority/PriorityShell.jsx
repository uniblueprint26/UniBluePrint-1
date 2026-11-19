import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { PC, CHROME_TEXT, FONT_SERIF, FONT_SANS } from '../../lib/priority'

// Black and silver wrapper for every Priority page. The site header and footer
// stay as they are; this fills the page between them.

export function PriorityMark({ size = 44 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'radial-gradient(circle at 35% 30%, #1d1d1d 0%, #070707 70%)',
        border: `1px solid ${PC.borderStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ ...CHROME_TEXT, fontFamily: FONT_SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size * 0.52, lineHeight: 1 }}>
        P
      </span>
    </div>
  )
}

export default function PriorityShell({ children, showTicketsLink = true, maxWidth = 1040 }) {
  return (
    <div style={{ background: PC.black, color: PC.fg, fontFamily: FONT_SANS, minHeight: '70vh' }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <Link to="/priority" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }} aria-label="Priority home">
            <PriorityMark />
            <span style={{ ...CHROME_TEXT, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: '24px' }}>Priority</span>
          </Link>
          {showTicketsLink && (
            <Link
              to="/priority/tickets"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '10px', textDecoration: 'none',
                border: `1px solid ${PC.borderStrong}`, color: PC.fg,
                fontSize: '14px', fontWeight: 600,
              }}
            >
              <Ticket size={16} aria-hidden="true" /> My tickets
            </Link>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatusPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { color: PC.fg, border: PC.borderStrong, bg: 'rgba(185,185,180,0.10)' },
    good:    { color: PC.success, border: 'rgba(74,222,128,0.35)', bg: 'rgba(74,222,128,0.10)' },
    bad:     { color: PC.danger, border: 'rgba(227,154,141,0.4)', bg: 'rgba(227,154,141,0.10)' },
  }
  const t = tones[tone] || tones.neutral
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
      color: t.color, border: `1px solid ${t.border}`, background: t.bg,
    }}>
      {children}
    </span>
  )
}

export function Notice({ children, tone = 'neutral', role }) {
  const bad = tone === 'bad'
  return (
    <div
      role={role}
      style={{
        padding: '14px 16px', borderRadius: '12px', fontSize: '14px', lineHeight: 1.6,
        color: bad ? PC.danger : PC.fg,
        background: bad ? 'rgba(227,154,141,0.08)' : 'rgba(185,185,180,0.08)',
        border: `1px solid ${bad ? 'rgba(227,154,141,0.4)' : PC.borderStrong}`,
      }}
    >
      {children}
    </div>
  )
}
