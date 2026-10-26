import { useEffect, useMemo, useRef, useState } from 'react'
import { FONT_SANS, GREY, tint, getChartNeutral } from './theme'
import { SkeletonBlock } from './Skeleton'
import ChartExportButton from './ChartExportButton'

const DAY_MS = 24 * 60 * 60 * 1000

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * GitHub-style contribution heatmap -- Studio Phase 13. Real per-day event
 * density for one hub's team (via `onFetch`, wired by each hub page to
 * getTeamActivityHeatmap(team, days)): team_tasks created/closed activity
 * everywhere, plus that hub's own append-only status log where one exists
 * (legal/tech/outreach -- see the migration's own comment). Most hubs are
 * pre-launch with near-zero real activity, so most squares are honestly
 * empty -- that is the correct, expected render, not a bug to paper over.
 *
 * Literal hex only for the SVG's own cells (see theme.js's getChartNeutral
 * header comment) -- the PNG export button needs this chart to carry no
 * CSS var() dependency, same reasoning as TrendLineChart/DonutChart.
 */
export default function ActivityHeatmap({ team, accentColor = '#1E3A5F', days = 182, onFetch, exportFilename = 'activity-heatmap' }) {
  const svgRef = useRef(null)
  const [counts, setCounts] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    onFetch(days)
      .then(res => {
        if (cancelled) return
        const map = new Map()
        for (const row of res?.value || []) {
          const key = typeof row.activity_date === 'string' ? row.activity_date.slice(0, 10) : row.activity_date
          map.set(key, row.activity_count)
        }
        setCounts(map)
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Could not load activity.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [team, days, onFetch])

  const { weeks, totalEvents, maxCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Start on the Sunday on/before (today - days), so columns align to
    // real calendar weeks the way GitHub's own heatmap does.
    const start = new Date(today.getTime() - (days - 1) * DAY_MS)
    start.setDate(start.getDate() - start.getDay())

    const cols = []
    let cursor = new Date(start)
    let total = 0
    let max = 0
    while (cursor <= today) {
      const col = []
      for (let i = 0; i < 7; i++) {
        const key = toKey(cursor)
        const inRange = cursor <= today
        const count = inRange ? (counts.get(key) || 0) : null
        if (inRange) { total += count; max = Math.max(max, count) }
        col.push({ key, count, future: !inRange })
        cursor = new Date(cursor.getTime() + DAY_MS)
      }
      cols.push(col)
    }
    return { weeks: cols, totalEvents: total, maxCount: max }
  }, [counts, days])

  function cellColor(count, future) {
    if (future) return 'transparent'
    if (!count) return getChartNeutral('grid')
    const frac = maxCount > 0 ? count / maxCount : 0
    if (frac > 0.66) return accentColor
    if (frac > 0.33) return tint(accentColor, 0.55)
    return tint(accentColor, 0.28)
  }

  if (loading) return <SkeletonBlock height="90px" />
  if (error) return <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: 0 }}>{error}</p>

  const cellSize = 11
  const gap = 3
  const W = weeks.length * (cellSize + gap)
  const H = 7 * (cellSize + gap)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
        <ChartExportButton svgRef={svgRef} filename={exportFilename} background={getChartNeutral('surface')} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Activity heatmap">
          {weeks.map((col, ci) => col.map((cell, ri) => (
            <rect
              key={cell.key}
              x={ci * (cellSize + gap)} y={ri * (cellSize + gap)}
              width={cellSize} height={cellSize} rx="2.5"
              fill={cellColor(cell.count, cell.future)}
            >
              <title>{cell.future ? '' : `${cell.key}: ${cell.count} real event${cell.count === 1 ? '' : 's'}`}</title>
            </rect>
          )))}
        </svg>
      </div>
      <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '10px 0 0' }}>
        {totalEvents === 0
          ? `Genuinely 0 real events logged for this hub in the last ${days} days -- an honest pre-launch state, not a broken chart.`
          : `${totalEvents.toLocaleString('en-IE')} real event${totalEvents === 1 ? '' : 's'} over the last ${days} days.`}
      </p>
    </div>
  )
}
