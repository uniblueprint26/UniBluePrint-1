import { GREY, FONT_SANS, tint, getStatusColor } from './theme'

// Universal green/yellow/red indicator -- hub health, individual
// performance, task urgency, anything else that needs a three-state
// status at a glance. Deliberately generic: the CALLER decides what
// green/yellow/red mean for its context (pass `status` + `label`), this
// component never hardcodes one meaning (e.g. "active/good" vs
// "recently active" vs "needs attention") into itself.
//
// Studio Phase 10: same four colors (now STATUS_COLORS in theme.js, so
// TaskBoard's status pill reuses exactly this palette), plus a faint
// same-hue halo so the small dot -- amber especially -- stays legible on
// white, cream and zebra-striped table rows alike.
//
// Studio Phase 12: reads getStatusColor() (real, mode-aware hex) rather
// than the var()-backed STATUS_COLORS export, because both this dot's own
// fill AND its halo go through tint()'s rgba() math, which needs a real
// hex at JS-eval time -- see theme.js's header comment for the full
// reasoning. This is also where "green is real, not just orange/yellow/
// red" actually lands: dark mode gets the app's real brighter success/
// warning/destructive tokens, not a flat reuse of the light ones.

export default function StatusDot({ status = 'grey', label, size = 8, showLabel = false }) {
  const color = getStatusColor(status)
  const dot = (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-block', width: `${size}px`, height: `${size}px`,
        borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: `0 0 0 ${Math.max(2, Math.round(size / 4))}px ${tint(color, 0.18)}`,
      }}
    />
  )
  if (!showLabel || !label) return dot
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', verticalAlign: 'middle' }}>
      {dot}
      <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 500, color: GREY }}>{label}</span>
    </span>
  )
}
