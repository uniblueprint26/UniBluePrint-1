import { useRef } from 'react'
import { FONT_SANS, FONT_SERIF, GREY, NAVY, getChartNeutral } from './theme'
import { ChartSkeleton } from './Skeleton'
import ChartExportButton from './ChartExportButton'

// Studio Phase 13 -- SVG donut chart for a genuinely PROPORTIONAL breakdown
// (status mix, category split) -- as opposed to MetricBarChart, which is
// right for comparing independent totals side by side. Plain inline SVG
// (concentric arcs via stroke-dasharray + rotation), no charting library.
//
// Literal hex colors only for the chart's own neutrals/text (see theme.js's
// getChartNeutral header comment) -- the slice colors themselves are
// whatever real hex the caller passes per row (reuse getStatusColor()/
// HUB_ACCENTS, never theme.js's var()-backed GREEN/AMBER/RED/NAVY) so the
// PNG export button renders correctly with no page CSS available to it.
//
// `data`: [{ name, value, color (real hex) }]
export default function DonutChart({
  data = [],
  size = 150,
  thickness = 20,
  accentColor = '#1E3A5F',
  valueFormatter = n => (n == null ? '—' : n.toLocaleString('en-IE')),
  centerLabel,
  emptyLabel = 'Nothing to show yet.',
  loading = false,
  legend = true,
  exportFilename = 'donut-chart',
}) {
  const svgRef = useRef(null)
  if (loading) return <ChartSkeleton rows={3} />

  const rows = data.filter(d => (d.value || 0) > 0)
  const total = rows.reduce((s, d) => s + d.value, 0)

  if (total <= 0) {
    return <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.5, margin: 0 }}>{emptyLabel}</p>
  }

  const cx = size / 2
  const cy = size / 2
  const r = (size - thickness) / 2
  const circumference = 2 * Math.PI * r

  let cumulative = 0
  const segments = rows.map((d, i) => {
    const frac = d.value / total
    const dash = Math.max(frac * circumference - (rows.length > 1 ? 1.5 : 0), 0)
    const rotation = -90 + cumulative * 360
    cumulative += frac
    return { ...d, color: d.color || accentColor, dash, rotation, key: d.name || i }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, right: 0, transform: 'translate(8px,-8px)' }}>
          <ChartExportButton svgRef={svgRef} filename={exportFilename} background={getChartNeutral('surface')} />
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Proportional breakdown" width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={getChartNeutral('grid')} strokeWidth={thickness} />
          {segments.map(s => (
            <circle
              key={s.key}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeLinecap={rows.length > 1 ? 'butt' : 'round'}
              transform={`rotate(${s.rotation} ${cx} ${cy})`}
            />
          ))}
          {centerLabel != null && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_SERIF} fontSize="18" fill={getChartNeutral('heading')}>
              {centerLabel}
            </text>
          )}
        </svg>
      </div>

      {legend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          {segments.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, minWidth: 0 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              </span>
              <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, color: NAVY, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {valueFormatter(s.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
