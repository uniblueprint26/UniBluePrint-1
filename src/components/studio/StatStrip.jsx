import { NAVY, GREY, MUTED, CREAM, SURFACE_TINT, BORDER, FONT_SERIF, FONT_SANS, isZeroish } from './theme'
import Sparkline from './Sparkline'

// Horizontal row-of-stat-cells pattern, matching the existing admin
// dashboards' Tile/StatTile components (same card shape, icon chip, serif
// value, sans label) -- reused here as one shared component instead of
// every hub re-typing its own Tile.
//
// Studio Phase 10 hierarchy: icon chip + label on one line (the "what"),
// then a large serif value (the "how much"), then the optional sub-line.
// Tiles sit on a faint cream tint so they read as nested inside their
// parent white card rather than as a second competing card layer. An honest
// zero/empty value ("0", "€0.00", "—") renders in calm slate grey instead of
// a saturated accent, so a pre-launch row of zeros reads as "nothing yet",
// not as a wall of loud green/orange numbers or an error.
// Studio Phase 13: `trend` is an optional array of real historical numbers
// (oldest -> newest, same metric as `value`) backing a tiny inline
// Sparkline next to the label. Deliberately opt-in per cell, never
// defaulted on -- a tile with no real per-period history behind it (most
// of them, on a pre-launch dashboard) stays a plain number, per the brief's
// own "do not fabricate a fake sparkline" rule. Sparkline itself already
// renders nothing for <2 real points, so passing a short/empty `trend` is
// always safe, never a visible gap.
function StatCell({ label, sub, value, icon: Icon, accent = NAVY, trend }) {
  const zero = isZeroish(value)
  // MUTED (#9CA3AF) is passed as an accent to mean "de-emphasised", but it is
  // too light for a 30px figure or an icon on the cream tile -- render that
  // intent with the readable slate GREY instead.
  const tone = accent === MUTED ? GREY : accent
  return (
    <div style={{
      background: SURFACE_TINT, borderRadius: '10px',
      border: `1px solid ${BORDER}`,
      padding: '14px 16px 16px',
      display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {Icon && (
          <span style={{
            width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
            background: '#FFFFFF', border: `1px solid ${BORDER}`, boxShadow: `inset 0 0 0 1px ${CREAM}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color={tone} strokeWidth={2.1} aria-hidden="true" />
          </span>
        )}
        <span style={{ fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: GREY, lineHeight: 1.35, minWidth: 0 }}>
          {label}
        </span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', justifyContent: 'space-between' }}>
          <p className="studio-stat-value" style={{
            fontFamily: FONT_SERIF, fontSize: '30px', lineHeight: 1.05, margin: 0,
            color: zero ? GREY : tone, letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere',
          }}>
            {value}
          </p>
          {trend && trend.length >= 2 && <Sparkline points={trend} color={zero ? GREY : tone} />}
        </div>
        {sub && (
          <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, lineHeight: 1.4, margin: '6px 0 0' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// One shared stylesheet for every strip on the page (identical text, so
// repeated <style> tags never fight each other). Single-column strips stay
// single-column at every width; multi-column strips go to 2 columns under
// 1100px and stay 2-up on phones (tiles are compact enough), dropping to 1
// only on very narrow screens.
const STRIP_STYLES = `
  @media (max-width: 1100px) { .studio-stat-strip:not(.studio-stat-strip--single) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
  @media (max-width: 560px) { .studio-stat-strip .studio-stat-value { font-size: 24px !important; } }
  @media (max-width: 340px) { .studio-stat-strip { grid-template-columns: 1fr !important; } }
`

/**
 * `cells`: [{ key, label, sub?, value, icon?, accent?, trend? }] -- `trend`
 * (Studio Phase 13) is an optional array of real historical numbers behind
 * a tiny inline Sparkline, see StatCell's own comment above.
 * `columns`: how many columns at desktop width (grid auto-collapses to 2
 * under 1100px; `columns={1}` stays a single column at every width).
 */
export default function StatStrip({ cells = [], columns = 4, style }) {
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '12px',
        ...style,
      }}
      className={`studio-stat-strip${columns === 1 ? ' studio-stat-strip--single' : ''}`}
    >
      <style>{STRIP_STYLES}</style>
      {cells.map(({ key, ...c }) => <StatCell key={key || c.label} {...c} />)}
    </div>
  )
}
