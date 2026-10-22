import { NAVY, CREAM, GREY, FONT_SERIF, FONT_SANS } from './theme'

// Horizontal row-of-stat-cells pattern, matching the existing admin
// dashboards' Tile/StatTile components (same card shape, icon chip, serif
// value, sans label) -- reused here as one shared component instead of
// every hub re-typing its own Tile.
function StatCell({ label, sub, value, icon: Icon, accent = NAVY }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      {Icon && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={accent} />
        </div>
      )}
      <p style={{ fontFamily: FONT_SERIF, fontSize: '24px', color: accent, lineHeight: 1.1, marginTop: '2px' }}>
        {value}
      </p>
      <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, lineHeight: 1.3 }}>
        {label}{sub ? `, ${sub}` : ''}
      </p>
    </div>
  )
}

/**
 * `cells`: [{ key, label, sub?, value, icon?, accent? }]
 * `columns`: how many columns at desktop width (grid auto-collapses to 2
 * under 1100px and 1 under 560px, matching the existing admin grids).
 */
export default function StatStrip({ cells = [], columns = 4, style }) {
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '12px',
        ...style,
      }}
      className="studio-stat-strip"
    >
      <style>{`
        @media (max-width: 1100px) { .studio-stat-strip { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .studio-stat-strip { grid-template-columns: 1fr !important; } }
      `}</style>
      {cells.map(c => <StatCell key={c.key || c.label} {...c} />)}
    </div>
  )
}
