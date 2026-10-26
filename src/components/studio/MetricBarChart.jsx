import { NAVY, SAND, GREY, BORDER, FONT_SANS } from './theme'
import { ChartSkeleton } from './Skeleton'

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
  loading = false,
}) {
  // Studio Phase 12: while the real data is still in flight, show a
  // shimmer skeleton shaped like this chart instead of the real bars.
  // Checking `loading` alone (not also data.length) matters here: several
  // hubs build their hero chart rows as a fixed-shape array seeded with
  // value: 0 (e.g. Tech's Error/Warn/Info severity totals), so `data`
  // already has real length before the real numbers arrive -- gating only
  // on an empty array would never show the skeleton for those charts, the
  // exact "looks like it loaded (as zeros), not like it's loading" problem
  // the brief flags. Once `loading` is false, an empty `data` still falls
  // through to the real empty-state text below.
  if (loading) {
    return <ChartSkeleton rows={Math.max(data.length, 3)} />
  }
  if (!data.length) {
    return <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.5, margin: 0 }}>{emptyLabel}</p>
  }
  const realValues = data.filter(d => !d.tbd).map(d => d.value || 0)
  const max = Math.max(...realValues, 1)
  // One fixed value-column width per chart (sized to its longest label), so
  // every bar track ends at the same x and nothing like "€1,250.00" clips.
  const valueWidth = Math.max(48, ...data.filter(d => !d.tbd).map(d => String(valueFormatter(d.value)).length * 8 + 4))

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '18px' }}>
            <span title={d.name} style={{
              fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 500, color: NAVY,
              width: `${nameWidth}px`, maxWidth: '45%', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {d.name}
            </span>
            {d.tbd ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 600, color: GREY,
                  background: SAND, borderRadius: '999px', padding: '3px 10px', lineHeight: 1.4,
                }}>
                  TBD{d.tbdReason ? ` — ${d.tbdReason}` : ' — not yet tracked'}
                </span>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: '40px', background: SAND, borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(((d.value || 0) / max) * 100, d.value ? 3 : 0)}%`, height: '100%',
                    background: d.color || accentColor, borderRadius: '0 4px 4px 0',
                    transition: 'width 200ms ease',
                  }} />
                </div>
                <span style={{
                  fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, color: d.value ? NAVY : GREY,
                  width: `${valueWidth}px`, textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                }}>
                  {valueFormatter(d.value)}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {legend && legend.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${BORDER}` }}>
          {legend.map(l => (
            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: FONT_SANS, fontSize: '12px', color: GREY }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color || accentColor, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
