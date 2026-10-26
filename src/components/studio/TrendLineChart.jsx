import { useRef } from 'react'
import { FONT_SANS, GREY, getChartNeutral } from './theme'
import { ChartSkeleton } from './Skeleton'
import ChartExportButton from './ChartExportButton'

// Studio Phase 13 -- SVG line chart for a genuine time series (revenue by
// month, signups by month, tickets opened/resolved by week, ...). Plain
// inline SVG, no charting library: every series this phase feeds it is
// already a short (<=12 point), pre-aggregated array from studioMetrics.js,
// nowhere near the volume that would justify a dependency.
//
// Literal hex colors only (see theme.js's getChartNeutral/getStatusColor
// header comment) -- never a CSS var() -- so the PNG export button
// (chartExport.js) can serialize this exact markup into a detached <img>
// and still render correctly with no page CSS available to it.
//
// `series`: [{ key, label, color (real hex), data: [{ x: label, y: number|null }] }]
// For the common single-line case, pass `data` instead of `series` and it
// is wrapped into one series using `accentColor`.
//
// Honest-empty rule (the brief's own "too sparse/zero" case): a flat line
// drawn at y=0 across every point reads as a real, if boring, zero trend
// on a BAR chart (MetricBarChart already handles real zero bars fine) --
// but a LINE chart with every point at zero looks identical to a broken
// chart, not a real flat trend, so this component renders the same honest
// "not enough data yet" text MetricBarChart's own emptyLabel pattern uses
// instead of ever drawing that fake-looking flat line. Fewer than 2 real
// (non-null) points across every series is always insufficient too -- a
// single point cannot show a trend at all.
export default function TrendLineChart({
  data,
  series,
  accentColor = '#1E3A5F',
  height = 160,
  valueFormatter = n => (n == null ? '—' : n.toLocaleString('en-IE')),
  emptyLabel = 'Not enough real data yet to show a trend.',
  loading = false,
  exportFilename = 'trend-chart',
}) {
  const svgRef = useRef(null)
  const realSeries = series || (data ? [{ key: 'series', label: null, color: accentColor, data }] : [])

  if (loading) return <ChartSkeleton rows={3} />

  const allPoints = realSeries.flatMap(s => s.data || [])
  const realValues = allPoints.map(p => p.y).filter(v => v != null)
  const totalValue = realValues.reduce((a, b) => a + Math.abs(b), 0)
  const insufficient = realValues.length < 2 || totalValue === 0

  if (insufficient) {
    return <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.5, margin: 0 }}>{emptyLabel}</p>
  }

  const neutral = { text: getChartNeutral('text'), grid: getChartNeutral('grid') }
  const W = 560
  const H = height
  const padL = 34
  const padR = 10
  const padT = 10
  const padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const labels = (realSeries[0]?.data || []).map(p => p.x)
  const n = Math.max(labels.length, 2)
  const max = Math.max(...realValues, 0)
  const min = Math.min(0, ...realValues)
  const span = max - min || 1

  function xAt(i) { return padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW) }
  function yAt(v) { return padT + plotH - ((v - min) / span) * plotH }

  const labelStep = n > 8 ? Math.ceil(n / 7) : 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
        <ChartExportButton svgRef={svgRef} filename={exportFilename} background={getChartNeutral('surface')} />
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={realSeries.map(s => s.label).filter(Boolean).join(' vs ') || 'Trend chart'}
        style={{ width: '100%', height: `${H}px`, display: 'block' }}
      >
        {/* 3 horizontal gridlines: max / mid / baseline. The mid line's own
            label is skipped when a small value range (e.g. max of 1) would
            round it to the same text as the line above or below it --
            otherwise a real "0 to 1" trend showed "1" twice. */}
        {[0, 0.5, 1].map((f, i) => {
          const y = padT + plotH * f
          const v = max - f * span
          const label = valueFormatter(Math.round(v))
          const dupesNeighbor = i === 1 && (label === valueFormatter(Math.round(max)) || label === valueFormatter(Math.round(min)))
          return (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={neutral.grid} strokeWidth="1" />
              {!dupesNeighbor && (
                <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontFamily={FONT_SANS} fontSize="9.5" fill={neutral.text}>
                  {label}
                </text>
              )}
            </g>
          )
        })}

        {labels.map((lab, i) => (
          (i % labelStep === 0 || i === labels.length - 1) && (
            <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fontFamily={FONT_SANS} fontSize="9.5" fill={neutral.text}>
              {lab}
            </text>
          )
        ))}

        {realSeries.map(s => {
          const pts = (s.data || []).map((p, i) => ({ x: xAt(i), y: yAt(p.y ?? 0), raw: p.y }))
          const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
          const color = s.color || accentColor
          return (
            <g key={s.key}>
              <path d={linePath} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => p.raw != null && (
                <circle key={i} cx={p.x} cy={p.y} r="2.75" fill={color} />
              ))}
            </g>
          )
        })}
      </svg>

      {realSeries.length > 1 && realSeries.some(s => s.label) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px' }}>
          {realSeries.map(s => s.label && (
            <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: FONT_SANS, fontSize: '12px', color: GREY }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color || accentColor, display: 'inline-block' }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
