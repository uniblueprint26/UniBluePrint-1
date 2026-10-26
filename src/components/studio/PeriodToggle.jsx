import { NAVY, CREAM, GREY, BORDER, FONT_SANS, DAY_WEEK_MONTH_YEAR } from './theme'

// Studio Phase 13 -- the ONE shared period-toggle control, extracted from
// ComparisonWidget's own inline day/week/month/year pill row (the exact
// markup it already had) so every chart that needs a time-range control
// reuses this one component instead of each hub re-typing the same pill
// row (FinanceDashboardPage's own range control was a second, slightly
// different copy of this same pattern before this pass).
//
// `options`: [{ key, label }] -- DAY_WEEK_MONTH_YEAR (theme.js) is the
// common one. Fully controlled -- `value` + `onChange`, no internal
// state, so a caller can keep several controls (a hero-chart range AND a
// ComparisonWidget window) in sync with one shared piece of state when it
// wants to, or keep them independent when it doesn't.
export default function PeriodToggle({ options = DAY_WEEK_MONTH_YEAR, value, onChange, ariaLabel = 'Time range' }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{
      display: 'inline-flex', background: CREAM, borderRadius: '9px', padding: '3px',
      border: `1px solid ${BORDER}`, maxWidth: '100%', overflowX: 'auto',
    }}>
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          style={{
            fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
            padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: value === o.key ? NAVY : 'transparent',
            color: value === o.key ? CREAM : GREY,
            transition: 'background 150ms, color 150ms',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
