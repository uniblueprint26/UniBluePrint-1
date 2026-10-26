import { Download } from 'lucide-react'
import { FONT_SANS, GREY } from './theme'
import { exportSvgAsPng } from './chartExport'

// Studio Phase 13 -- the small "download this chart as a PNG" button every
// new SVG chart (TrendLineChart/DonutChart/ActivityHeatmap/MiniCalendar)
// renders in its own top-right corner. One shared component rather than
// each chart re-implementing the click handler, so the export mechanism
// (see chartExport.js) only exists in one place.
export default function ChartExportButton({ svgRef, filename = 'studio-chart', background, label = 'Download chart as PNG' }) {
  function handleClick() {
    exportSvgAsPng(svgRef && svgRef.current, filename, background)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
        border: '1px solid var(--studio-border-strong)', background: 'var(--studio-white)',
        color: GREY, cursor: 'pointer', fontFamily: FONT_SANS,
      }}
    >
      <Download size={13} aria-hidden="true" />
    </button>
  )
}
