import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { NAVY, GREY, WHITE, BORDER_STRONG, FONT_SANS, FONT_SERIF, OVERLAY } from './theme'
import { getActiveTeamUpdate } from '../../lib/studioMetrics'

const SEEN_KEY = 'ubp-studio-updates-seen'

function readSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markSeen(id) {
  try {
    const seen = readSeen()
    seen.add(id)
    // Cap at the 50 most recent ids so this never grows unbounded.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-50)))
  } catch {
    // localStorage unavailable (private window, blocked) -- the badge just
    // won't persist across visits, not worth surfacing an error for.
  }
}

/**
 * A small "what's new" notification bell in StudioShell's header, next to
 * the theme toggle. Independent of GreetingBanner's hero welcome message on
 * purpose -- see get_active_team_update()'s migration comment: most named
 * team members already have a permanent personal "Welcome Back" greeting,
 * which always wins over a team-wide one in GreetingBanner's own resolution
 * order, so a team update posted there would never actually reach anyone.
 * This reads the SAME studio_greetings content (scope='team', written from
 * the Team Greetings panel on the Founder Hub) through a separate RPC that
 * ignores personal greetings entirely, so a real update always surfaces
 * here regardless of what GreetingBanner is showing that person.
 *
 * "Seen" is a per-viewer convenience (localStorage, keyed by greeting id),
 * not shared state -- the same class of thing useStudioTheme's light/dark
 * choice already is. Nothing server-side tracks who has read an update.
 */
export default function TeamUpdateBell({ hubKey, accentColor = NAVY }) {
  const [update, setUpdate] = useState(null) // { id, message, created_at } | null
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getActiveTeamUpdate(hubKey)
      .then(res => {
        if (cancelled) return
        const resolved = res?.value || null
        setUpdate(resolved)
        setUnseen(!!resolved && !readSeen().has(resolved.id))
      })
      .catch(() => {
        if (cancelled) return
        setUpdate(null)
        setUnseen(false)
      })
    return () => { cancelled = true }
  }, [hubKey])

  useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function onToggle() {
    setOpen(o => !o)
    if (update && unseen) {
      markSeen(update.id)
      setUnseen(false)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="studio-theme-toggle"
        onClick={onToggle}
        aria-label={unseen ? 'New update -- open to read' : 'Hub updates'}
        title={unseen ? 'New update -- open to read' : 'Hub updates'}
        style={{ position: 'relative' }}
      >
        <Bell size={16} />
        {unseen && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px',
              borderRadius: '50%', background: accentColor, boxShadow: '0 0 0 2px var(--studio-white)',
            }}
          />
        )}
      </button>

      {open && (
        <div className="studio-update-popover" role="dialog" aria-label="Hub updates">
          <p style={{
            fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: accentColor, margin: '0 0 8px',
          }}>
            What&apos;s new
          </p>
          {update ? (
            <p style={{ fontFamily: FONT_SERIF, fontSize: '15px', lineHeight: 1.5, color: NAVY, margin: 0 }}>
              {update.message}
            </p>
          ) : (
            <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: 0 }}>
              Nothing posted here yet.
            </p>
          )}
        </div>
      )}

      <style>{`
        .studio-update-popover {
          position: absolute; top: calc(100% + 10px); right: 0; z-index: 120; width: 260px;
          background: ${WHITE}; border: 1px solid ${BORDER_STRONG}; border-radius: 12px; box-shadow: 0 12px 32px ${OVERLAY};
          padding: 14px;
        }
        @media (max-width: 480px) { .studio-update-popover { right: -8px; width: 230px; } }
      `}</style>
    </div>
  )
}
