import { CREAM, NAVY, GREY, MUTED, SAND, SURFACE_TINT, BORDER, FONT_SERIF, FONT_SANS, tint } from './theme'
import QuoteBanner from './QuoteBanner'
import SectionJumpNav from './SectionJumpNav'
import MetricBarChart from './MetricBarChart'
import { StudioCard, Eyebrow } from './StudioPrimitives'

// Studio Phase 10: every rule here is shared by all 8 hubs -- page rhythm,
// the "Studio card" surface, data tables, responsive form rows, and the
// sticky jump-nav offset. Hub pages keep only genuinely hub-specific layout
// (their own two-col/three-col grids) in their local PAGE_STYLES.
//
// Sticky offsets: the site Navbar (src/components/layout/Navbar.jsx) is
// itself sticky at top:0 -- 72px tall at >=960px, 56px below that -- so the
// jump-nav sticks just under it rather than sliding behind it, and every
// anchored section gets enough scroll-margin to clear both.
const SHELL_STYLES = `
  .studio-shell { --studio-gap: 24px; background: ${CREAM}; min-height: 100vh; padding: 32px 32px 72px; }
  .studio-shell [id] { scroll-margin-top: 148px !important; }
  .studio-shell-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: var(--studio-gap); }
  .studio-hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: stretch; margin-bottom: var(--studio-gap); }
  .studio-card { padding: 22px 24px; }

  .studio-jumpnav { position: sticky; top: 72px; z-index: 20; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
    background: rgba(255,255,255,0.92); backdrop-filter: saturate(1.4) blur(8px); -webkit-backdrop-filter: saturate(1.4) blur(8px);
    border: 1px solid ${BORDER}; border-radius: 12px; padding: 8px; margin-bottom: var(--studio-gap); box-shadow: 0 1px 2px rgba(30,58,95,0.04); }
  .studio-jumpnav-label { font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${GREY}; padding: 0 8px 0 6px; white-space: nowrap; }
  .studio-jumpnav button { font-family: ${FONT_SANS}; font-size: 12.5px; font-weight: 600; padding: 7px 14px; border-radius: 999px;
    border: 1px solid ${BORDER}; background: ${SURFACE_TINT}; color: ${NAVY}; cursor: pointer; white-space: nowrap;
    transition: background 150ms, color 150ms, border-color 150ms; }
  .studio-jumpnav button:hover, .studio-jumpnav button:focus-visible { background: var(--studio-accent-tint); color: var(--studio-accent); border-color: var(--studio-accent-border); outline: none; }

  .studio-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid ${BORDER}; border-radius: 10px; }
  .studio-table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .studio-table th { position: sticky; top: 0; z-index: 1; text-align: left; font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${GREY};
    background: ${SURFACE_TINT}; padding: 10px 12px; border-bottom: 1px solid ${BORDER}; white-space: nowrap; }
  .studio-table td { font-family: ${FONT_SANS}; font-size: 13px; color: ${NAVY}; padding: 10px 12px; border-bottom: 1px solid rgba(30,58,95,0.06);
    white-space: nowrap; vertical-align: middle; font-variant-numeric: tabular-nums; line-height: 1.45; }
  .studio-table tbody tr:nth-child(even) td { background: rgba(245,240,232,0.38); }
  .studio-table tbody tr:hover td { background: rgba(30,58,95,0.035); }
  .studio-table tbody tr:last-child td { border-bottom: none; }
  .studio-table--top td { vertical-align: top; white-space: normal; }

  .studio-form-panel { background: ${SURFACE_TINT}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .studio-form-row { display: grid; gap: 12px; align-items: end; }
  .studio-input:focus, .studio-form-panel input:focus, .studio-form-panel select:focus, .studio-form-panel textarea:focus {
    outline: none; border-color: var(--studio-accent); box-shadow: 0 0 0 3px var(--studio-accent-tint); }
  .studio-shell select, .studio-shell input, .studio-shell textarea { color: ${NAVY}; }
  .studio-shell input::placeholder, .studio-shell textarea::placeholder { color: ${MUTED}; }

  @keyframes studio-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
  .studio-fade-in { animation: studio-fade-in 420ms ease both; }

  @media (max-width: 959px) {
    .studio-jumpnav { top: 56px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
    .studio-jumpnav::-webkit-scrollbar { display: none; }
    .studio-jumpnav-label { display: none; }
    .studio-shell [id] { scroll-margin-top: 128px !important; }
  }
  @media (max-width: 720px) {
    .studio-shell { --studio-gap: 16px; padding: 20px 16px 56px; }
    .studio-hero-grid { grid-template-columns: 1fr; gap: 12px; }
    .studio-card { padding: 16px; }
    .studio-jumpnav { margin: 0 -16px var(--studio-gap); border-radius: 0; border-left: none; border-right: none; padding: 8px 16px; }
  }
  @media (max-width: 700px) { .studio-form-row { grid-template-columns: 1fr 1fr !important; } .studio-form-row > .studio-form-wide { grid-column: 1 / -1; } }
  @media (max-width: 480px) { .studio-form-row { grid-template-columns: 1fr !important; } .studio-form-row > button { width: 100%; } }
  @media (prefers-reduced-motion: reduce) { .studio-fade-in { animation: none; } }
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
    <div className="studio-shell" style={accentVars(accentColor)}>
      <style>{SHELL_STYLES}</style>

      <header className="studio-shell-header">
        <div style={{ minWidth: 0, flex: '1 1 420px' }}>
          <p style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 0 8px',
            fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: GREY,
          }}>
            <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${SAND}` }} />
            UniBlueprint Studio
          </p>
          <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 34px)', lineHeight: 1.15, color: NAVY, margin: 0 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontFamily: FONT_SANS, fontSize: '13.5px', color: GREY, margin: '8px 0 0', lineHeight: 1.6, maxWidth: '780px', overflowWrap: 'anywhere' }}>{subtitle}</p>
          )}
        </div>
        {rangeControl}
      </header>

      <QuoteBanner hubKey={hubKey} accentColor={accentColor} />

      {error}

      {heroCharts.length > 0 && (
        <div className="studio-hero-grid">
          {heroCharts.map(chart => (
            <StudioCard key={chart.key} style={{ display: 'flex', flexDirection: 'column' }}>
              <Eyebrow>{chart.eyebrow || 'This period'}</Eyebrow>
              <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: '19px', lineHeight: 1.25, color: NAVY, margin: '4px 0 8px' }}>{chart.title}</h2>
              {chart.caption && (
                <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, margin: '0 0 16px', lineHeight: 1.55, overflowWrap: 'anywhere' }}>{chart.caption}</p>
              )}
              <div>
                <MetricBarChart
                  data={chart.data}
                  accentColor={chart.accentColor || accentColor}
                  valueFormatter={chart.valueFormatter}
                  emptyLabel={chart.emptyLabel}
                  nameWidth={chart.nameWidth || 130}
                />
              </div>
            </StudioCard>
          ))}
        </div>
      )}

      {sections.length > 0 && <SectionJumpNav sections={sections} accentColor={accentColor} />}

      {children}
    </div>
  )
}

// Exposes the hub accent to the shared CSS above (jump-nav hover, input
// focus rings) without each rule needing the hex inlined.
function accentVars(accent) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent || '') ? accent : NAVY
  return {
    '--studio-accent': hex,
    '--studio-accent-tint': tint(hex, 0.10),
    '--studio-accent-border': tint(hex, 0.28),
  }
}
