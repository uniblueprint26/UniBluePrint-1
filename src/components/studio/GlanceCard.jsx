import { NAVY, GREY, BORDER, FONT_SERIF, FONT_SANS, tint, isZeroish } from './theme'
import { SkeletonBlock } from './Skeleton'
import HealthBadge from './HealthBadge'

// Studio Phase 13 -- the pinned "at a glance" summary card every hub's
// Overview now starts with, rendered by StudioShell itself (via its new
// `glanceCard` prop) right above the hero bar-chart row, so it lands in
// one shared place rather than each hub page positioning its own copy.
//
// `items`: [{ key, label, value, sub?, health? ('good'|'warning'|
// 'critical'|'neutral') }] -- exactly 2-3 per hub, the founder's own
// judgment call per hub (documented on each hub page) for which numbers
// matter most there, grounded in that hub's own already-established key
// metrics -- never a new metric invented just to fill this card.
export default function GlanceCard({ items = [], accentColor = NAVY, loading = false }) {
  return (
    <div
      className="studio-fade-in"
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '20px',
        background: tint(accentColor, 0.06), border: `1px solid ${tint(accentColor, 0.22)}`,
        borderRadius: '14px', padding: '16px 20px', marginBottom: 'var(--studio-gap)',
      }}
    >
      {loading ? (
        Array.from({ length: Math.max(items.length, 2) }).map((_, i) => (
          <div key={i} style={{ minWidth: '120px', flex: '1 1 140px' }}>
            <SkeletonBlock width="60%" height="10px" style={{ marginBottom: '8px' }} />
            <SkeletonBlock width="45%" height="22px" />
          </div>
        ))
      ) : items.map((item, i) => (
        <div key={item.key || item.label} style={{
          minWidth: '120px', flex: '1 1 140px',
          paddingLeft: i > 0 ? '20px' : 0,
          borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none',
        }}>
          <p style={{
            fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, color: GREY,
            textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {item.health && <HealthBadge level={item.health} showLabel={false} size={7} />}
            {item.label}
          </p>
          <p style={{
            fontFamily: FONT_SERIF, fontSize: '26px', lineHeight: 1.1, margin: 0,
            color: isZeroish(item.value) ? GREY : accentColor, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere',
          }}>
            {item.value}
          </p>
          {item.sub && (
            <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '4px 0 0', lineHeight: 1.4 }}>{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
