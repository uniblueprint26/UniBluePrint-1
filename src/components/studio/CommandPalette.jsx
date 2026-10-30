import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, LayoutGrid, ListTodo, Inbox, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { FONT_SANS, FONT_SERIF, NAVY, GREY, MUTED, BORDER, WHITE, OVERLAY } from './theme'
import { HUB_REGISTRY, hubsAccessibleTo } from './hubRegistry'

// Studio Phase 14 -- the cmd-k / ctrl-k quick-jump search every hub renders
// through StudioShell (one integration point, same reasoning as every
// prior shared-shell piece in this file family). Three real sources, none
// duplicated from elsewhere:
//
//   1. Sections on THIS hub -- the exact same `sections` array StudioShell
//      already passes to StudioSidebar (imported by the caller, not
//      re-typed here).
//   2. Other hubs the signed-in user can actually reach -- hubRegistry.js,
//      filtered by the SAME roles useAuth() exposes to RequireRole, so a
//      person only ever sees hubs they are genuinely allowed into.
//   3. This hub's own already-fetched tasks/requests (whatever the host
//      page passed to StudioShell for its own TaskBoard/RequestPanel) --
//      filtered client-side by title/message. No new RPC: these rows are
//      already in memory because the page that's open fetched them for
//      its own TaskBoard/RequestPanel a moment ago.
//
// No Reports hub exists yet anywhere in the repo (checked live before
// building this) -- the brief's "or report" is a no-op today, not a
// broken link: the Reports group simply never appears.
export default function CommandPalette({ hubKey, sections = [], tasks = [], requests = [], open, onClose }) {
  const { roles } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Next tick -- the input isn't mounted yet on the same render that flips `open`.
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
    return undefined
  }, [open])

  const groups = useMemo(() => buildGroups({ hubKey, sections, tasks, requests, roles, query }), [hubKey, sections, tasks, requests, roles, query])
  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups])

  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function run(item) {
    if (!item) return
    item.action()
    onClose()
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatItems.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter') { e.preventDefault(); run(flatItems[activeIndex]); return }
  }

  if (!open) return null

  let runningIdx = -1

  return (
    <div
      role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: OVERLAY, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 16px 16px' }}
    >
      <style>{PALETTE_STYLES}</style>
      <div className="studio-cmdk" role="dialog" aria-modal="true" aria-label="Jump to anything">
        <div className="studio-cmdk-input-row">
          <Search size={16} color={GREY} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section, a hub, a task or a request..."
            className="studio-cmdk-input"
            aria-label="Search"
          />
          <kbd className="studio-cmdk-esc">Esc</kbd>
        </div>

        <div ref={listRef} className="studio-cmdk-list">
          {flatItems.length === 0 ? (
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: MUTED, padding: '20px 16px', margin: 0, textAlign: 'center' }}>
              Nothing matches "{query}".
            </p>
          ) : groups.map(group => group.items.length === 0 ? null : (
            <div key={group.label}>
              <p className="studio-cmdk-group-label">{group.label}</p>
              {group.items.map(item => {
                runningIdx += 1
                const idx = runningIdx
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-idx={idx}
                    className={`studio-cmdk-item${idx === activeIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => run(item)}
                  >
                    <item.Icon size={14} className="studio-cmdk-item-icon" aria-hidden="true" />
                    <span className="studio-cmdk-item-label">{item.label}</span>
                    {item.sub && <span className="studio-cmdk-item-sub">{item.sub}</span>}
                    {idx === activeIndex && <CornerDownLeft size={13} className="studio-cmdk-item-enter" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="studio-cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

function buildGroups({ hubKey, sections, tasks, requests, roles = [], query }) {
  const q = query.trim().toLowerCase()
  const match = label => q === '' || String(label || '').toLowerCase().includes(q)

  function jumpTo(id) {
    return () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const sectionItems = sections
    .filter(s => match(s.label))
    .slice(0, 8)
    .map(s => ({ key: `section-${s.id}`, label: s.label, Icon: ArrowRight, action: jumpTo(s.id) }))

  const otherHubs = hubsAccessibleTo(roles, hubKey)
    .filter(h => match(h.label))
    .map(h => ({ key: `hub-${h.key}`, label: h.label, sub: 'Open hub', Icon: LayoutGrid, action: () => { window.location.href = h.path } }))

  // Tasks/requests groups only once the person is actually typing -- with
  // an empty query they'd otherwise flood the list above the far more
  // useful "jump to a section" results.
  const taskItems = q === '' ? [] : tasks
    .filter(t => String(t.title || '').toLowerCase().includes(q))
    .slice(0, 6)
    .map(t => ({
      key: `task-${t.id}`, label: t.title, sub: t.status === 'done' ? 'Done' : (t.assignee_name && t.assignee_name !== 'Unassigned' ? t.assignee_name : 'Unassigned'),
      Icon: ListTodo, action: jumpTo(findSectionId(sections, /task|board/i)),
    }))

  const requestItems = q === '' ? [] : requests
    .filter(r => String(r.message || '').toLowerCase().includes(q))
    .slice(0, 6)
    .map(r => ({
      key: `request-${r.id}`, label: r.message, sub: r.direction === 'incoming' ? 'Incoming' : 'Sent',
      Icon: Inbox, action: jumpTo(findSectionId(sections, /request/i)),
    }))

  return [
    { label: 'This hub', items: sectionItems },
    { label: 'Jump to a hub', items: otherHubs },
    { label: 'Tasks', items: taskItems },
    { label: 'Requests', items: requestItems },
  ]
}

function findSectionId(sections, pattern) {
  const hit = sections.find(s => pattern.test(s.label) || pattern.test(s.id))
  return hit?.id
}

const PALETTE_STYLES = `
  .studio-cmdk {
    width: min(560px, 100%); max-height: 70vh; display: flex; flex-direction: column;
    background: ${WHITE}; border-radius: 14px; border: 1px solid var(--studio-border-strong);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
  }
  .studio-cmdk-input-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid ${BORDER}; flex-shrink: 0; }
  .studio-cmdk-input { flex: 1; border: none; outline: none; background: transparent; font-family: ${FONT_SANS}; font-size: 14.5px; color: ${NAVY}; }
  .studio-cmdk-input::placeholder { color: ${MUTED}; }
  .studio-cmdk-esc { font-family: ${FONT_SANS}; font-size: 11px; color: ${MUTED}; border: 1px solid var(--studio-border-strong); border-radius: 5px; padding: 2px 6px; flex-shrink: 0; }
  .studio-cmdk-list { overflow-y: auto; padding: 6px; flex: 1; }
  .studio-cmdk-group-label { font-family: ${FONT_SANS}; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED}; margin: 10px 10px 4px; }
  .studio-cmdk-item {
    width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; border: none; background: transparent;
    padding: 9px 10px; border-radius: 8px; cursor: pointer; font-family: ${FONT_SANS}; font-size: 13.5px; color: ${NAVY};
  }
  .studio-cmdk-item.is-active, .studio-cmdk-item:hover { background: var(--studio-accent-tint); }
  .studio-cmdk-item-icon { color: ${GREY}; flex-shrink: 0; }
  .studio-cmdk-item.is-active .studio-cmdk-item-icon { color: var(--studio-accent); }
  .studio-cmdk-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .studio-cmdk-item-sub { font-size: 11.5px; color: ${MUTED}; flex-shrink: 0; }
  .studio-cmdk-item-enter { color: var(--studio-accent); flex-shrink: 0; }
  .studio-cmdk-footer {
    display: flex; gap: 14px; padding: 8px 16px; border-top: 1px solid ${BORDER}; flex-shrink: 0;
    font-family: ${FONT_SANS}; font-size: 11px; color: ${MUTED};
  }
  .studio-cmdk-footer kbd { font-family: ${FONT_SANS}; border: 1px solid var(--studio-border-strong); border-radius: 4px; padding: 1px 4px; margin-right: 3px; }
  @media (max-width: 600px) { .studio-cmdk { max-height: 80vh; } }
`
