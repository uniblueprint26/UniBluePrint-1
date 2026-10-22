import { CREAM, NAVY, GREY, FONT_SERIF, FONT_SANS } from './theme'
import QuoteBanner from './QuoteBanner'
import SectionJumpNav from './SectionJumpNav'
import MetricBarChart from './MetricBarChart'

const SHELL_STYLES = `
  .studio-hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: stretch; }
  @media (max-width: 720px) { .studio-hero-grid { grid-template-columns: 1fr; } }
`

/**
 * Page shell every Studio hub sits on top of: top quote banner, then a row
 * of 2-4 hero bar-chart cards (the hub's "main chart"), then jump-tabs that
 * scroll-anchor down to sections below -- NOT separate pages, one
 * continuous scrolling page per hub.
 *
 * `heroCharts`: [{ key, title, caption?, data, valueFormatter? }] -- each
 * rendered as its own MetricBarChart card via the shared chart style.
 * `sections`: passed straight to SectionJumpNav.
 * `accentColor`: per-hub accent, layered on the shared navy/cream/gold base.
 * `rangeControl`: optional node (e.g. the existing day/week/month/year
 * toggle) rendered in the header next to the title.
 */
export default function StudioShell({
  hubKey,
  title,
  subtitle,
  accentColor = NAVY,
  heroCharts = [],
  sections = [],
  rangeControl,
  error,
  children,
}) {
  return (
    <div style={{ background: CREAM, minHeight: '100vh', padding: '24px 28px 64px' }}>
      <style>{SHELL_STYLES}</style>

      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
      }}>
        <div>
          <h1 style={{ fontFamily: FONT_SERIF, fontSize: '26px', color: NAVY, margin: 0 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: '4px 0 0' }}>{subtitle}</p>
          )}
        </div>
        {rangeControl}
      </div>

      <QuoteBanner hubKey={hubKey} accentColor={accentColor} />

      {error}

      {heroCharts.length > 0 && (
        <div className="studio-hero-grid" style={{ marginBottom: '20px' }}>
          {heroCharts.map(chart => (
            <div key={chart.key} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(30,58,95,0.08)', padding: '18px 20px' }}>
              <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                {chart.eyebrow || 'This period'}
              </p>
              <h2 style={{ fontFamily: FONT_SERIF, fontSize: '17px', color: NAVY, margin: '3px 0 10px' }}>{chart.title}</h2>
              {chart.caption && (
                <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '0 0 10px', lineHeight: 1.5 }}>{chart.caption}</p>
              )}
              <MetricBarChart
                data={chart.data}
                accentColor={chart.accentColor || accentColor}
                valueFormatter={chart.valueFormatter}
                emptyLabel={chart.emptyLabel}
                nameWidth={chart.nameWidth || 130}
              />
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && <SectionJumpNav sections={sections} accentColor={accentColor} />}

      {children}
    </div>
  )
}
