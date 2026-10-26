// Studio Phase 13 -- PNG export for the new SVG-based charts (TrendLineChart/
// DonutChart/ActivityHeatmap/MiniCalendar). Deliberately NOT html2canvas:
// this session already hit real, hard-to-diagnose html2canvas text-
// rendering/transform-interaction bugs on an unrelated Artifact build, and
// every chart this phase adds is already a plain, self-contained <svg> with
// no external DOM to capture -- so the far more predictable path is
// serializing that SVG directly to a canvas and reading the PNG back out,
// never touching html2canvas or any new dependency at all.
//
// The one real constraint this imposes on the chart components themselves:
// their <svg> markup must use literal hex colors (see theme.js's
// getChartNeutral/getStatusColor), never a CSS var() -- see this file's
// own comment on that for why a var() would silently resolve to nothing in
// the detached <img> below.

/**
 * Serializes `svgEl` (a real, already-painted SVG element) to a PNG and
 * triggers a browser download. Best-effort: swallows failures rather than
 * throwing into a click handler, since this is a "nice to have" export,
 * never something the chart's own correctness depends on.
 */
export function exportSvgAsPng(svgEl, filename = 'chart.png', background) {
  if (!svgEl || typeof window === 'undefined') return
  try {
    const viewBox = svgEl.viewBox && svgEl.viewBox.baseVal
    const rect = svgEl.getBoundingClientRect()
    const width = Math.max(1, Math.round((viewBox && viewBox.width) || rect.width || 480))
    const height = Math.max(1, Math.round((viewBox && viewBox.height) || rect.height || 240))

    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))

    const svgString = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 2))
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)
        ctx.fillStyle = background || '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(svgUrl)

        canvas.toBlob(pngBlob => {
          if (!pngBlob) return
          const pngUrl = URL.createObjectURL(pngBlob)
          const a = document.createElement('a')
          a.href = pngUrl
          a.download = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`
          document.body.appendChild(a)
          a.click()
          a.remove()
          setTimeout(() => URL.revokeObjectURL(pngUrl), 2000)
        }, 'image/png')
      } catch {
        URL.revokeObjectURL(svgUrl)
      }
    }
    img.onerror = () => URL.revokeObjectURL(svgUrl)
    img.src = svgUrl
  } catch {
    /* best-effort export only */
  }
}
