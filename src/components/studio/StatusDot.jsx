import { GREEN, AMBER, RED, MUTED } from './theme'

// Universal green/yellow/red indicator -- hub health, individual
// performance, task urgency, anything else that needs a three-state
// status at a glance. Deliberately generic: the CALLER decides what
// green/yellow/red mean for its context (pass `status` + `label`), this
// component never hardcodes one meaning (e.g. "active/good" vs
// "recently active" vs "needs attention") into itself.
const COLORS = { green: GREEN, yellow: AMBER, red: RED, grey: MUTED }

export default function StatusDot({ status = 'grey', label, size = 8, showLabel = false }) {
  const color = COLORS[status] || COLORS.grey
  const dot = (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-block', width: `${size}px`, height: `${size}px`,
        borderRadius: '50%', background: color, flexShrink: 0,
      }}
    />
  )
  if (!showLabel || !label) return dot
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {dot}
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: '#6B7280' }}>{label}</span>
    </span>
  )
}
