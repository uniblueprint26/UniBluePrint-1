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

export function EmptyNote({ children, style }) {
  return (
    <p style={{
      fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.5,
      display: 'flex', alignItems: 'center', gap: '8px', margin: 0, overflowWrap: 'anywhere', ...style,
    }}>
      {children}
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
