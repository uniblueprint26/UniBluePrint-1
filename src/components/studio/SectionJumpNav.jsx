/**
 * Jump-tabs that scroll-anchor down the page -- NOT separate routes/pages.
 * Clicking a tab smooth-scrolls to the section with that id, on the same
 * continuously-scrolling hub page. `sections`: [{ id, label }].
 *
 * Styling lives in StudioShell's shared stylesheet (.studio-jumpnav): sticks
 * just under the site navbar, wraps on desktop, and becomes a single
 * horizontally-scrolling row on phones so it never eats half the viewport
 * while stuck. Hover/focus picks up the hub accent via --studio-accent.
 */
// (`accentColor` is still accepted for API compatibility; the accent now
// arrives through StudioShell's CSS variables instead.)
export default function SectionJumpNav({ sections = [] }) {
  function jumpTo(id) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!sections.length) return null

  return (
    <nav aria-label="Jump to section" className="studio-jumpnav">
      <span className="studio-jumpnav-label" aria-hidden="true">Jump to</span>
      {sections.map(s => (
        <button key={s.id} type="button" onClick={() => jumpTo(s.id)}>
          {s.label}
        </button>
      ))}
    </nav>
  )
}
