import { NAVY, SAND, GREY, MUTED, FONT_SANS } from './theme'

/**
 * Horizontal bar chart matching the exact visual language already shipped
 * on FounderDashboardPage's HBarList / campus breakdown bars: rounded
 * (0 4px 4px 0) bar end, direct value label to the right, name truncated
 * with an ellipsis on the left, a legend row when more than one series is
 * passed, and a "TBD" status-chip for rows explicitly flagged not-yet-
 * trackable rather than a silently-zero bar.
 *
 * `data`: [{ name, value, tbd?: boolean, tbdReason?: string, color? }]
 * `accentColor` overrides the default NAVY bar fill (per-hub accent).
 */
export default function MetricBarChart({
  data = [],
  accentColor = NAVY,
  valueFormatter = n => (n == null ? '—' : n.toLocaleString('en-IE')),
  emptyLabel = 'Nothing recorded yet.',
  nameWidth = 160,
  legend,
}) {
  if (!data.length) {
    return <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>{emptyLabel}</p>
  }
  const realValues = data.filter(d => !d.tbd).map(d => d.value || 0)
  const max = Math.max(...realValues, 1)

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: FONT_SANS, fontSize: '12px', color: NAVY,
              width: `${nameWidth}px`, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {d.name}
            </span>
            {d.tbd ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: '700', color: MUTED,
                  background: SAND, borderRadius: '999px', padding: '3px 10px',
                }}>
                  TBD{d.tbdReason ? ` — ${d.tbdReason}` : ' — not yet tracked'}
                </span>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, background: SAND, borderRadius: '4px', height: '12px' }}>
                  <div style={{
                    width: `${Math.max(((d.value || 0) / max) * 100, d.value ? 3 : 0)}%`, height: '100%',
                    background: d.color || accentColor, borderRadius: '0 4px 4px 0',
                    transition: 'width 200ms ease',
                  }} />
                </div>
                <span style={{
                  fontFamily: FONT_SANS, fontSize: '11.5px', fontWeight: '600', color: GREY,
                  width: '54px', textAlign: 'right', flexShrink: 0,
                }}>
                  {valueFormatter(d.value)}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {legend && legend.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          {legend.map(l => (
            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: FONT_SANS, fontSize: '11px', color: GREY }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color || accentColor, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
