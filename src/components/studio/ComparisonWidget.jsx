import { useState } from 'react'
import { TrendingUp, Trophy, Users } from 'lucide-react'
import { NAVY, GREY, CREAM, WHITE, SURFACE_TINT, BORDER, CARD_RADIUS, CARD_SHADOW, FONT_SERIF, FONT_SANS, tint } from './theme'
import { buildComparisonCopy } from './comparisonCopy'

const WINDOWS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

/**
 * "What You've Got vs What You're Missing" -- for one person/entity, shows:
 *  (a) vs the #1 performer in their category this period, ANONYMIZED
 *  (b) vs the lowest performer this period
 *  (c) vs their own last period (self vs self)
 * Default window = week; day/month/year are toggle buttons, not all shown
 * at once. All copy comes from comparisonCopy.js so the forward/
 * motivational framing rule lives in one place.
 *
 * `onWindowChange(windowKey)` lets the caller re-fetch data for the newly
 * selected window; this component holds the UI state but never fetches.
 */
export default function ComparisonWidget({
  entityLabel,
  value, topValue, lowestValue, lastPeriodValue,
  unit = '', higherIsBetter = true,
  window: windowProp, onWindowChange,
  accentColor = NAVY,
  loading = false,
  emptyNote,
}) {
  const [localWindow, setLocalWindow] = useState('week')
  const activeWindow = windowProp || localWindow

  function selectWindow(key) {
    setLocalWindow(key)
    if (onWindowChange) onWindowChange(key)
  }

  const noun = activeWindow === 'day' ? 'today'
    : activeWindow === 'week' ? 'this week'
    : activeWindow === 'month' ? 'this month' : 'this year'
  const periodLabel = `last ${activeWindow === 'day' ? 'day' : activeWindow === 'week' ? 'week' : activeWindow === 'month' ? 'month' : 'year'}`

  const copy = buildComparisonCopy({ value, topValue, lowestValue, lastPeriodValue, unit, higherIsBetter, noun, periodLabel })

  return (
    <div className="studio-card" style={{ background: WHITE, borderRadius: CARD_RADIUS, border: `1px solid ${BORDER}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, color: GREY, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            What You&rsquo;ve Got vs What You&rsquo;re Missing
          </p>
          <h3 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: '19px', color: NAVY, margin: '4px 0 0' }}>
            {entityLabel || 'This period'}
          </h3>
        </div>
        <div role="group" aria-label="Comparison window" style={{ display: 'inline-flex', background: CREAM, borderRadius: '9px', padding: '3px', border: `1px solid ${BORDER}` }}>
          {WINDOWS.map(w => (
            <button
              key={w.key}
              type="button"
              onClick={() => selectWindow(w.key)}
              style={{
                fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600,
                padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: activeWindow === w.key ? NAVY : 'transparent',
                color: activeWindow === w.key ? CREAM : GREY,
                transition: 'background 150ms, color 150ms',
              }}
              aria-pressed={activeWindow === w.key}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {emptyNote && (
        <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.55, margin: '0 0 16px', maxWidth: '860px', overflowWrap: 'anywhere' }}>{emptyNote}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <Row icon={Trophy} accent={accentColor} text={copy.vsTop} />
        <Row icon={Users} accent={accentColor} text={copy.vsLowest} />
        <Row icon={TrendingUp} accent={accentColor} text={copy.vsSelf} />
      </div>
    </div>
  )
}

function Row({ icon: Icon, accent, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: SURFACE_TINT, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: tint(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={accent} aria-hidden="true" />
      </div>
      <p style={{ fontFamily: FONT_SANS, fontSize: '13.5px', color: NAVY, lineHeight: 1.55, margin: '4px 0 0' }}>{text}</p>
    </div>
  )
}
