import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { FONT_SANS } from './theme'

// Studio Phase 12 -- persistent left sidebar nav, replacing the old
// horizontal SectionJumpNav pill row (same scroll-anchor mechanism: every
// hub is still one continuously-scrolling page, this only changes how you
// jump around it). Checked first whether SectionJumpNav.jsx is used
// anywhere outside StudioShell -- it isn't (grep across src/), so
// StudioShell is now the only renderer of hub section nav and this
// component fully supersedes it there. The file itself is left in the repo
// unused rather than deleted (small, harmless, and not what was asked).
//
// `sections`: the exact same [{ id, label }] shape every hub page already
// passes to StudioShell -- no hub page needed to change its own code.
// Grouping (Overview / Work / Reports / Activity) is applied HERE, from a
// per-hub map below, so the grouping decision lives in one place and stays
// consistent in spirit across all 8 hubs: every hub uses the same four
// group names, applied to whichever of ITS OWN sections fit each one (a
// hub simply omits a group it has nothing for). This is a judgment call --
// the brief explicitly leaves the exact grouping to this pass -- documented
// in the Phase 12 handback report.
const GROUPS = ['Overview', 'Work', 'Reports', 'Activity']

// id -> group, per hub. Falls back to 'Overview' for any id not listed here
// (keeps this safe if a hub's sections array ever changes without this map
// being updated too) rather than silently dropping a section from the nav.
const SECTION_GROUPS = {
  finance: {
    'fn-revenue': 'Overview', 'fn-margin': 'Overview',
    'fn-clients': 'Work', 'fn-scorecard': 'Work', 'fn-pricing': 'Work', 'fn-requests': 'Work',
    'fn-comparison': 'Reports',
    'fn-crosshub': 'Activity',
  },
  legal: {
    'lg-contracts': 'Overview', 'lg-compliance': 'Overview',
    'lg-tasks': 'Work', 'lg-folders': 'Work',
    'lg-comparison': 'Reports',
    'lg-requests': 'Activity',
  },
  tech: {
    'tech-health': 'Overview',
    'tech-ideas': 'Work', 'tech-qa': 'Work',
    'tech-comparison': 'Reports',
    'tech-requests': 'Activity',
  },
  outreach: {
    'oh-health': 'Overview',
    'oh-log': 'Work', 'oh-tasks': 'Work',
    'oh-comparison': 'Reports',
    'oh-requests': 'Activity',
  },
  marketing: {
    'mh-health': 'Overview',
    'mh-featured': 'Work', 'mh-leads': 'Work', 'mh-tasks': 'Work',
    'mh-comparison': 'Reports',
    'mh-requests': 'Activity',
  },
  co_director: {
    'cd-finance': 'Overview', 'cd-legal': 'Overview', 'cd-tech': 'Overview', 'cd-outreach': 'Overview', 'cd-marketing': 'Overview',
    'cd-decisions': 'Work', 'cd-priorities': 'Work',
    'cd-all-requests': 'Activity', 'cd-requests': 'Activity',
  },
  handler: {
    'hh-overview': 'Overview',
    'hh-queue': 'Work', 'hh-tasks': 'Work',
    'hh-performance': 'Reports',
    'hh-requests': 'Activity',
  },
  founder: {
    'fh-overview': 'Overview', 'fh-platform': 'Overview', 'fh-partners': 'Overview',
    'fh-decisions': 'Work', 'fh-priorities': 'Work', 'fh-greetings': 'Work',
    'fh-activity': 'Reports',
    'fh-all-requests': 'Activity', 'fh-requests': 'Activity',
  },
}

function groupSections(hubKey, sections) {
  const map = SECTION_GROUPS[hubKey] || {}
  const byGroup = new Map(GROUPS.map(g => [g, []]))
  for (const s of sections) {
    const g = map[s.id] || 'Overview'
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g).push(s)
  }
  return GROUPS
    .map(g => ({ group: g, items: byGroup.get(g) || [] }))
    .filter(g => g.items.length > 0)
}

function jumpTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export const SIDEBAR_STYLES = `
  .studio-sidebar-toggle {
    display: none; align-items: center; justify-content: center; gap: 6px;
    height: 36px; padding: 0 12px; border-radius: 9px; border: 1px solid var(--studio-border-strong);
    background: var(--studio-white); color: var(--studio-navy); font-family: ${FONT_SANS}; font-size: 12.5px; font-weight: 600;
    cursor: pointer; flex-shrink: 0;
  }
  .studio-sidebar-backdrop { display: none; }

  .studio-sidebar {
    width: 228px; flex-shrink: 0; position: sticky; top: 88px;
    max-height: calc(100vh - 104px); overflow-y: auto;
    display: flex; flex-direction: column; gap: 18px;
    padding-right: 4px;
  }
  .studio-sidebar-group-label {
    font-family: ${FONT_SANS}; font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--studio-grey); margin: 0 0 6px 10px;
  }
  .studio-sidebar-link {
    display: flex; align-items: center; gap: 9px; width: 100%; text-align: left;
    font-family: ${FONT_SANS}; font-size: 13px; font-weight: 600; color: var(--studio-navy);
    padding: 8px 10px; border-radius: 8px; border: none; background: transparent; cursor: pointer;
    line-height: 1.3; transition: background 120ms, color 120ms;
  }
  .studio-sidebar-link::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--studio-border-strong); flex-shrink: 0;
    transition: background 120ms, transform 120ms;
  }
  .studio-sidebar-link:hover, .studio-sidebar-link:focus-visible {
    background: var(--studio-accent-tint); color: var(--studio-accent); outline: none;
  }
  .studio-sidebar-link:hover::before, .studio-sidebar-link:focus-visible::before { background: var(--studio-accent); }
  .studio-sidebar-link.is-active { background: var(--studio-accent-tint); color: var(--studio-accent); }
  .studio-sidebar-link.is-active::before { background: var(--studio-accent); transform: scale(1.3); }

  @media (max-width: 959px) {
    .studio-sidebar-toggle { display: inline-flex; }
    .studio-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 60; width: 258px; max-height: none;
      background: var(--studio-cream); box-shadow: 4px 0 24px rgba(0,0,0,0.18);
      padding: 20px 14px 24px; transform: translateX(-100%); transition: transform 220ms ease;
    }
    .studio-sidebar.is-open { transform: translateX(0); }
    .studio-sidebar-backdrop.is-open {
      display: block; position: fixed; inset: 0; z-index: 55; background: var(--studio-overlay);
    }
    .studio-sidebar-close {
      display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-bottom: 12px;
      border-radius: 8px; border: 1px solid var(--studio-border-strong); background: var(--studio-white);
      color: var(--studio-navy); cursor: pointer;
    }
  }
`

/**
 * Persistent left sidebar nav for a Studio hub page -- grouped section
 * links that scroll-anchor down the same page (NOT separate routes).
 * Collapses to a slide-out drawer (hamburger toggle rendered by the
 * caller, see StudioShell.jsx) under 960px so it's never just hidden with
 * no way to reach it on a phone.
 */
export default function StudioSidebar({ hubKey, sections = [], title, open, onClose }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const grouped = groupSections(hubKey, sections)

  function go(id) {
    setActiveId(id)
    jumpTo(id)
    if (onClose) onClose()
  }

  return (
    <>
      <div
        className={`studio-sidebar-backdrop${open ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={`studio-sidebar${open ? ' is-open' : ''}`}
        aria-label={`${title || 'Hub'} sections`}
      >
        <button type="button" className="studio-sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={16} />
        </button>
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="studio-sidebar-group-label">{group}</p>
            {items.map(s => (
              <button
                key={s.id}
                type="button"
                className={`studio-sidebar-link${s.id === activeId ? ' is-active' : ''}`}
                onClick={() => go(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  )
}

/** Hamburger button StudioShell renders in its header on phone/tablet. */
export function SidebarToggleButton({ onClick }) {
  return (
    <button type="button" className="studio-sidebar-toggle" onClick={onClick} aria-label="Open sections menu">
      <Menu size={15} /> Sections
    </button>
  )
}
