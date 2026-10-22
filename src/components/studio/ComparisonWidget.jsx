import { useState } from 'react'
import { TrendingUp, Trophy, Users } from 'lucide-react'
import { NAVY, GREY, MUTED, CREAM, FONT_SERIF, FONT_SANS } from './theme'
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
    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(30,58,95,0.08)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div>
          <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            What You&rsquo;ve Got vs What You&rsquo;re Missing
          </p>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: '17px', color: NAVY, margin: '3px 0 0' }}>
            {entityLabel || 'This period'}
          </h3>
        </div>
        <div style={{ display: 'inline-flex', background: CREAM, borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
          {WINDOWS.map(w => (
            <button
              key={w.key}
              type="button"
              onClick={() => selectWindow(w.key)}
              style={{
                fontFamily: FONT_SANS, fontSize: '11.5px', fontWeight: '600',
                padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: activeWindow === w.key ? NAVY : 'transparent',
                color: activeWindow === w.key ? CREAM : GREY,
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {emptyNote && (
        <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: MUTED, marginBottom: '12px' }}>{emptyNote}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: loading ? 0.6 : 1 }}>
        <Row icon={Trophy} accent={accentColor} text={copy.vsTop} />
        <Row icon={Users} accent={accentColor} text={copy.vsLowest} />
        <Row icon={TrendingUp} accent={accentColor} text={copy.vsSelf} />
      </div>
    </div>
  )
}

function Row({ icon: Icon, accent, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <Icon size={12} color={accent} />
      </div>
      <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, lineHeight: 1.5, margin: 0 }}>{text}</p>
    </div>
  )
}
