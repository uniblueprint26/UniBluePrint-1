import { useEffect, useRef, useState } from 'react'
import { StudioCard, SectionTitle } from './StudioPrimitives'
import { FONT_SANS, FONT_SERIF, tint, isZeroish } from './theme'
import { avatarColorFor, initialsFor } from './avatarColor'
import { getMyStudioAvatar } from '../../lib/studioMetrics'
import ChartExportButton from './ChartExportButton'
import { SkeletonBlock } from './Skeleton'

const CARD_W = 600
const CARD_H = 338

// Literal hex, not the var()-backed NAVY/CREAM exports -- same reasoning
// as every other exportable SVG chart (DonutChart/TrendLineChart/
// ActivityHeatmap/MiniCalendar, see theme.js's getChartNeutral comment):
// this card IS an <svg>, serialized to a standalone PNG via
// chartExport.js's detached <img>, which has no access to this page's CSS
// custom properties -- a var() there would resolve to nothing.
const NAVY_HEX = '#1E3A5F'
const CREAM_HEX = '#F5F0E8'

/**
 * Studio Phase 15 -- a branded, shareable snapshot of a hub's own "at a
 * glance" numbers, for dropping into a team chat or a slide. Deliberately
 * takes the EXACT same `items` shape a hub page already builds for
 * GlanceCard ({ key, label, value, sub? }) -- no new metric is computed
 * here, just a second, exportable rendering of numbers the hub already
 * trusts. Reuses the existing SVG-to-PNG export mechanism (chartExport.js
 * / ChartExportButton) rather than a new dependency: this card is a plain
 * self-contained <svg>, the same contract every other exportable Studio
 * chart already follows.
 */
export default function ShareableStatCard({ hubLabel, accentColor = NAVY_HEX, items = [], loading = false }) {
  const [me, setMe] = useState(null)
  const svgRef = useRef(null)
  const shown = items.slice(0, 3)

  useEffect(() => {
    let cancelled = false
    getMyStudioAvatar().then(result => { if (!cancelled) setMe(result) }).catch(() => { if (!cancelled) setMe(null) })
    return () => { cancelled = true }
  }, [])

  const dateLabel = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const name = me?.fullName || 'UniBlueprint Studio'
  const initials = initialsFor(me?.fullName || hubLabel)
  const avatarBg = avatarColorFor(me?.userId || hubLabel)
  const colW = CARD_W / Math.max(shown.length, 1)

  return (
    <StudioCard style={{ marginBottom: 'var(--studio-gap)' }}>
      <SectionTitle
        eyebrow="Share"
        title="Shareable stat card"
        caption="This hub's own numbers above, dropped into one branded card -- for a team chat or a slide, not a new metric."
        action={shown.length > 0 && !loading ? (
          <ChartExportButton
            svgRef={svgRef}
            filename={`${(hubLabel || 'studio').toLowerCase().replace(/\s+/g, '-')}-stat-card`}
            background={NAVY_HEX}
            label="Download stat card as PNG"
          />
        ) : null}
      />
      {loading ? (
        <SkeletonBlock width="100%" height="190px" />
      ) : shown.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: 'var(--studio-grey)', margin: 0 }}>
          Nothing to show yet -- once this hub has at least one real number above, its card appears here.
        </p>
      ) : (
        <div style={{ maxWidth: '480px' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CARD_W} ${CARD_H}`}
            width="100%"
            style={{ display: 'block', borderRadius: '14px', overflow: 'hidden' }}
            role="img"
            aria-label={`${hubLabel} stat card for ${name}, ${dateLabel}`}
          >
            <rect width={CARD_W} height={CARD_H} fill={NAVY_HEX} />
            <circle cx={CARD_W - 70} cy={-40} r="220" fill={tint(accentColor, 0.16)} />
            <circle cx={40} cy={CARD_H + 30} r="160" fill={tint(accentColor, 0.1)} />

            <text x="32" y="40" fontFamily={FONT_SANS} fontSize="11" fontWeight="700" letterSpacing="2.5" fill={tint(CREAM_HEX, 0.7)}>
              UNIBLUEPRINT STUDIO
            </text>
            <text x="32" y="66" fontFamily={FONT_SERIF} fontSize="25" fill={CREAM_HEX}>
              {hubLabel}
            </text>

            <circle cx={CARD_W - 48} cy="34" r="16" fill={avatarBg} />
            <text x={CARD_W - 48} y="38" textAnchor="middle" fontFamily={FONT_SANS} fontSize="11" fontWeight="700" fill="#FFFFFF">
              {initials}
            </text>

            {shown.map((item, i) => {
              const cx = colW * i + 32
              const zero = isZeroish(item.value)
              return (
                <g key={item.key || item.label} transform={`translate(${cx}, 150)`}>
                  <text x="0" y="0" fontFamily={FONT_SANS} fontSize="10.5" fontWeight="700" letterSpacing="1" fill={tint(CREAM_HEX, 0.6)}>
                    {String(item.label || '').toUpperCase()}
                  </text>
                  <text x="0" y="40" fontFamily={FONT_SERIF} fontSize="29" fill={zero ? tint(CREAM_HEX, 0.45) : CREAM_HEX}>
                    {item.value}
                  </text>
                  {item.sub && (
                    <text x="0" y="64" fontFamily={FONT_SANS} fontSize="10.5" fill={tint(CREAM_HEX, 0.55)}>
                      {item.sub}
                    </text>
                  )}
                </g>
              )
            })}

            <line x1="32" y1={CARD_H - 44} x2={CARD_W - 32} y2={CARD_H - 44} stroke={tint(CREAM_HEX, 0.15)} strokeWidth="1" />
            <text x="32" y={CARD_H - 20} fontFamily={FONT_SANS} fontSize="11" fill={tint(CREAM_HEX, 0.55)}>
              {name} &#183; {dateLabel}
            </text>
          </svg>
        </div>
      )}
    </StudioCard>
  )
}
