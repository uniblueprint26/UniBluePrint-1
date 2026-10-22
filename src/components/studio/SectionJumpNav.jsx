import { NAVY, GREY, FONT_SANS } from './theme'

/**
 * Jump-tabs that scroll-anchor down the page -- NOT separate routes/pages.
 * Clicking a tab smooth-scrolls to the section with that id, on the same
 * continuously-scrolling hub page. `sections`: [{ id, label }].
 */
export default function SectionJumpNav({ sections = [], accentColor = NAVY }) {
  function jumpTo(id) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!sections.length) return null

  return (
    <nav
      aria-label="Jump to section"
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        background: '#FFFFFF', border: '1px solid rgba(30,58,95,0.08)', borderRadius: '10px',
        padding: '10px 12px', marginBottom: '20px', position: 'sticky', top: '0', zIndex: 5,
      }}
    >
      {sections.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => jumpTo(s.id)}
          style={{
            fontFamily: FONT_SANS, fontSize: '12px', fontWeight: '600',
            padding: '6px 12px', borderRadius: '999px', border: `1px solid rgba(30,58,95,0.12)`,
            background: 'transparent', color: GREY, cursor: 'pointer',
            transition: 'background 150ms, color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.12)'; e.currentTarget.style.color = GREY }}
        >
          {s.label}
        </button>
      ))}
    </nav>
  )
}
