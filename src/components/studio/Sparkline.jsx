// Studio Phase 13 -- tiny inline trend squiggle for a StatStrip tile (see
// StatStrip.jsx's `trend` prop). Deliberately NOT exported through the
// barrel on its own merits, beyond StatStrip using it internally -- a
// sparkline is only ever decoration next to a real number, never a
// standalone chart with its own export button/axis, so it skips the
// shared chart-neutral/export machinery TrendLineChart/DonutChart use.
//
// `points`: plain array of numbers (nulls allowed, skipped). Literal hex
// `color` only (same var()-in-export reasoning as the bigger charts,
// harmless here since this is never exported, but kept consistent).
export default function Sparkline({ points = [], color = '#1E3A5F', width = 56, height = 20 }) {
  const real = points.filter(v => v != null)
  if (real.length < 2) return null

  const max = Math.max(...real)
  const min = Math.min(...real)
  const span = max - min || 1
  const n = points.length
  const pad = 2

  const coords = points.map((v, i) => {
    const x = pad + (i / (n - 1)) * (width - pad * 2)
    const y = v == null ? null : height - pad - ((v - min) / span) * (height - pad * 2)
    return { x, y }
  })

  const segments = []
  let current = []
  for (const c of coords) {
    if (c.y == null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push(c)
    }
  }
  if (current.length) segments.push(current)

  const last = [...coords].reverse().find(c => c.y != null)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"
        />
      ))}
      {last && <circle cx={last.x} cy={last.y} r="1.75" fill={color} />}
    </svg>
  )
}
