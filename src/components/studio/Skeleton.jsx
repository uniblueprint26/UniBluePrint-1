// Studio Phase 12 -- shimmer loading skeletons with a small UBP watermark
// mark animated into the shine sweep, replacing generic spinners/blank
// gaps wherever a section is genuinely still loading (as opposed to
// genuinely empty -- see EmptyNote in StudioPrimitives.jsx for that other
// state). Pure CSS keyframe animation, no JS/animation library.
//
// The "UBP watermark" is the same navy/gold diamond-U mark used elsewhere
// in the brand, drawn as a tiny inline SVG data URI baked into the shine
// gradient layer so it visibly sweeps across the skeleton with the shimmer
// rather than sitting static -- satisfies "shimmer sweeping across a small
// UBP watermark mark" literally, while staying one lightweight CSS rule.

export const SKELETON_STYLES = `
  @keyframes studio-shimmer { 0% { background-position: -140% 0; } 100% { background-position: 140% 0; } }
  .studio-skeleton {
    position: relative; overflow: hidden; border-radius: 8px;
    background: var(--studio-skeleton-base);
  }
  .studio-skeleton::after {
    content: ''; position: absolute; inset: 0;
    background-image:
      url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Cpath d='M11 2 L19 7 V15 L11 20 L3 15 V7 Z' fill='none' stroke='white' stroke-opacity='0.55' stroke-width='1.1'/%3E%3Cpath d='M11 6 L15 8.3 V13.7 L11 16 L7 13.7 V8.3 Z' fill='white' fill-opacity='0.35'/%3E%3C/svg%3E"),
      linear-gradient(100deg, transparent 20%, var(--studio-skeleton-shine) 50%, transparent 80%);
    background-repeat: no-repeat, no-repeat;
    background-position: center, -140% 0;
    background-size: 22px 22px, 55% 100%;
    animation: studio-shimmer 1.7s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) { .studio-skeleton::after { animation: none; } }
`

/** One shimmering block -- compose rows/grids of these for a specific shape. */
export function SkeletonBlock({ width = '100%', height = '14px', style }) {
  return <div className="studio-skeleton" style={{ width, height, ...style }} />
}

/** Shape matching a MetricBarChart hero chart -- a few name/bar/value rows. */
export function ChartSkeleton({ rows = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonBlock width="90px" height="12px" />
          <SkeletonBlock height="10px" style={{ flex: 1 }} />
          <SkeletonBlock width="48px" height="12px" />
        </div>
      ))}
    </div>
  )
}

/** Shape matching a TaskBoard/RequestPanel list -- a few card-ish rows. */
export function ListSkeleton({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          border: '1px solid var(--studio-border)', borderRadius: '10px', padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
            <SkeletonBlock width="55%" height="13px" />
            <SkeletonBlock width="35%" height="11px" />
          </div>
          <SkeletonBlock width="80px" height="22px" style={{ borderRadius: '999px', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

/** Shape matching a studio-table -- a header row + a few body rows. */
export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {Array.from({ length: cols }).map((_, i) => <SkeletonBlock key={i} height="11px" style={{ flex: 1 }} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '12px', padding: '6px 0' }}>
          {Array.from({ length: cols }).map((_, c) => <SkeletonBlock key={c} height="13px" style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  )
}

/** Shape matching StatStrip -- a row of stat tiles. */
export function StatStripSkeleton({ columns = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '12px' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{
          border: '1px solid var(--studio-border)', borderRadius: '10px', padding: '14px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <SkeletonBlock width="70%" height="11px" />
          <SkeletonBlock width="50%" height="24px" />
        </div>
      ))}
    </div>
  )
}
