import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NAVY, GREY, MUTED, BORDER, FONT_SANS, FONT_SERIF, tint } from './theme'
import { SkeletonBlock } from './Skeleton'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const SCOPES = [
  { key: 'mine', label: 'Mine' },
  { key: 'team', label: 'This hub' },
  { key: 'all', label: 'UBP-wide' },
]

function pad(n) { return String(n).padStart(2, '0') }
function toKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

/**
 * Compact month-view due-date calendar -- Studio Phase 13. Real
 * team_tasks.target_date density (via `onFetchScope`, wired by each hub
 * page to getTaskDueDateDensity(team, scope)), with a scope toggle:
 * 'mine' (this caller's own assigned tasks), 'team' (every task for this
 * hub), 'all' (every team's tasks -- founder/co_director/admin only; a
 * non-admin caller who taps it simply gets the server's real "not
 * authorized" error back, shown inline, not a fabricated empty calendar).
 *
 * Built to pick up a future reports table's own due dates the moment one
 * exists (get_task_due_date_density's own migration comment) -- this
 * component only ever renders whatever `onFetchScope` hands it, so that
 * day is a data-layer change, not a UI change.
 */
export default function MiniCalendar({ team, accentColor = NAVY, canViewAll = false, onFetchScope }) {
  const [scope, setScope] = useState('team')
  const [monthOffset, setMonthOffset] = useState(0)
  const [density, setDensity] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    onFetchScope(scope)
      .then(res => {
        if (cancelled) return
        const map = new Map()
        for (const row of res?.value || []) {
          const key = typeof row.due_date === 'string' ? row.due_date.slice(0, 10) : row.due_date
          map.set(key, (map.get(key) || 0) + row.task_count)
        }
        setDensity(map)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || 'Could not load that view.')
        setDensity(new Map())
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [scope, onFetchScope])

  const base = new Date()
  const viewDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
  const y = viewDate.getFullYear()
  const m = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const firstDow = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const out = []
    for (let i = 0; i < firstDow; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(d)
    return out
  }, [y, m])

  const todayKey = toKey(base.getFullYear(), base.getMonth(), base.getDate())
  const monthTotal = cells.reduce((sum, d) => sum + (d ? (density.get(toKey(y, m, d)) || 0) : 0), 0)

  function intensity(count) {
    if (!count) return 'transparent'
    if (count === 1) return tint(accentColor, 0.18)
    if (count === 2) return tint(accentColor, 0.34)
    return tint(accentColor, 0.5)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div role="group" aria-label="Calendar scope" style={{ display: 'inline-flex', background: 'var(--studio-cream)', borderRadius: '9px', padding: '3px', border: `1px solid ${BORDER}` }}>
          {SCOPES.filter(s => s.key !== 'all' || canViewAll).map(s => (
            <button
              key={s.key} type="button" aria-pressed={scope === s.key}
              onClick={() => setScope(s.key)}
              style={{
                fontFamily: FONT_SANS, fontSize: '11.5px', fontWeight: 600, padding: '5px 10px', borderRadius: '7px',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: scope === s.key ? accentColor : 'transparent',
                color: scope === s.key ? '#FFFFFF' : GREY,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" aria-label="Previous month" onClick={() => setMonthOffset(o => o - 1)} style={navBtnStyle}><ChevronLeft size={14} /></button>
          <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, color: NAVY, minWidth: '108px', textAlign: 'center' }}>{monthLabel}</span>
          <button type="button" aria-label="Next month" onClick={() => setMonthOffset(o => o + 1)} style={navBtnStyle}><ChevronRight size={14} /></button>
        </div>
      </div>

      {error ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: 0 }}>{error}</p>
      ) : loading ? (
        <SkeletonBlock height="180px" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {WEEKDAYS.map((w, i) => (
              <span key={i} style={{ fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700, color: MUTED, textAlign: 'center', textTransform: 'uppercase' }}>{w}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const key = toKey(y, m, d)
              const count = density.get(key) || 0
              const isToday = key === todayKey
              return (
                <div
                  key={i}
                  title={count ? `${count} task${count === 1 ? '' : 's'} due` : 'No tasks due'}
                  style={{
                    aspectRatio: '1', borderRadius: '7px', background: intensity(count),
                    border: isToday ? `1.5px solid ${accentColor}` : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_SERIF, fontSize: '11.5px', color: count >= 2 ? '#FFFFFF' : NAVY,
                  }}
                >
                  {d}
                </div>
              )
            })}
          </div>
          <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '10px 0 0' }}>
            {monthTotal === 0 ? 'No real tasks due this month in this view.' : `${monthTotal} real task${monthTotal === 1 ? '' : 's'} due this month in this view.`}
          </p>
        </>
      )}
    </div>
  )
}

const navBtnStyle = {
  width: '26px', height: '26px', borderRadius: '7px', border: `1px solid ${BORDER}`,
  background: '#FFFFFF', color: NAVY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
