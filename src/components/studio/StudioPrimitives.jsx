import { NAVY, GREY, WHITE, BORDER, CARD_RADIUS, CARD_SHADOW, FONT_SERIF, FONT_SANS } from './theme'

// Studio Phase 10: the Card / SectionTitle / EmptyNote / Field building
// blocks every hub page used to re-declare locally (eight near-identical
// copies). Same props as those local copies, so a hub swaps its local
// definition for an import with no call-site changes:
//   Card({ id, style, children })
//   SectionTitle({ eyebrow, title, caption, action })
//   EmptyNote({ style, children })
//   StudioField({ label, children })

export function StudioCard({ children, style, id, className }) {
  return (
    <div
      id={id}
      className={`studio-card${className ? ` ${className}` : ''}`}
      style={{
        background: WHITE, borderRadius: CARD_RADIUS, border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW, ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Eyebrow({ children, style }) {
  if (!children) return null
  return (
    <p style={{
      fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, color: GREY,
      textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, lineHeight: 1.4, ...style,
    }}>
      {children}
    </p>
  )
}

export function SectionTitle({ eyebrow, title, caption, action }) {
  return (
    <div className="studio-section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0, flex: '1 1 320px' }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: '22px', lineHeight: 1.25, color: NAVY, margin: eyebrow ? '4px 0 0' : 0 }}>{title}</h2>
        {caption && (
          <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: GREY, margin: '6px 0 0', lineHeight: 1.6, maxWidth: '860px', overflowWrap: 'anywhere' }}>{caption}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// Studio Phase 12 -- branded empty state. Every hub has genuinely empty
// tables/sections right now (honestly so, pre-launch) -- this renders a
// small UBP mark instead of a bare caption, so an empty section reads as
// deliberate rather than broken. EmptyNote is already the one shared
// "nothing here" primitive imported across every hub page (36+ call
// sites), so upgrading it here applies everywhere with no per-page edits.
function UbpMark({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M11 2 L19 7 V15 L11 20 L3 15 V7 Z" fill="none" stroke={GREY} strokeOpacity="0.5" strokeWidth="1.3" />
      <path d="M11 6 L15 8.3 V13.7 L11 16 L7 13.7 V8.3 Z" fill={GREY} fillOpacity="0.35" />
    </svg>
  )
}

export function EmptyNote({ children, style }) {
  // Mark trails the text (a quiet "signature", not a second leading icon --
  // most existing call sites already open with their own contextual lucide
  // icon, e.g. <EmptyNote><ShieldAlert .../> No advisor snapshot yet.
  // </EmptyNote>, and stacking two icons at the front would clash).
  return (
    <p style={{
      fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.5,
      display: 'flex', alignItems: 'center', gap: '8px', margin: 0, overflowWrap: 'anywhere', ...style,
    }}>
      {children}
      <UbpMark />
    </p>
  )
}

export function StudioField({ label, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{
        fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: GREY, display: 'block', marginBottom: '6px',
      }}>
        {label}
      </span>
      {children}
    </label>
  )
}
