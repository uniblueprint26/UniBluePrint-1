import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { NAVY, GREY, MUTED, SAND, SURFACE_TINT, BORDER, FONT_SERIF, FONT_SANS, tint } from './theme'
import GreetingBanner from './GreetingBanner'
import StudioSidebar, { SIDEBAR_STYLES, SidebarToggleButton } from './StudioSidebar'
import MetricBarChart from './MetricBarChart'
import { StudioCard, Eyebrow } from './StudioPrimitives'
import { SKELETON_STYLES } from './Skeleton'
import { useStudioTheme } from './useStudioTheme'

// Studio Phase 10: every rule here is shared by all 8 hubs -- page rhythm,
// the "Studio card" surface, data tables, responsive form rows, and the
// sticky jump-nav offset. Hub pages keep only genuinely hub-specific layout
// (their own two-col/three-col grids) in their local PAGE_STYLES.
//
// Studio Phase 12 -- this file is the single integration point for the
// whole shared visual shell: every hub page renders through StudioShell
// already, so the sidebar, dark mode, personalized greeting, background
// texture and skeleton CSS all land here ONCE rather than needing edits to
// all 8 hub page files. The var() defaults/overrides below are the real
// light/dark token tables theme.js's exported constants resolve against --
// see that file's header comment for why a CSS variable rather than a
// live-updated JS constant.
//
// Sticky offsets: the site Navbar (src/components/layout/Navbar.jsx) is
// itself sticky at top:0 -- 72px tall at >=960px, 56px below that -- so the
// sidebar/content stick just under it rather than sliding behind it, and
// every anchored section gets enough scroll-margin to clear both.
const SHELL_STYLES = `
  .studio-shell {
    /* Light defaults -- the ORIGINAL Phase 10 palette, unchanged. */
    --studio-navy: #1E3A5F; --studio-cream: #F5F0E8; --studio-white: #FFFFFF;
    --studio-grey: #6B7280; --studio-muted: #9CA3AF; --studio-sand: #EDE8DF;
    --studio-surface-tint: #FAF8F4;
    --studio-border: rgba(30,58,95,0.08); --studio-border-strong: rgba(30,58,95,0.16);
    --studio-overlay: rgba(11,22,35,0.5);
    --studio-card-shadow: 0 1px 2px rgba(30,58,95,0.04), 0 2px 12px rgba(30,58,95,0.05);
    --studio-disabled-bg: rgba(30,58,95,0.28);
    --studio-green: #16A34A; --studio-amber: #F59E0B; --studio-red: #DC2626;
    --studio-skeleton-base: rgba(30,58,95,0.06); --studio-skeleton-shine: rgba(255,255,255,0.85);
    color-scheme: light;

    --studio-gap: 24px; background: var(--studio-cream); min-height: 100vh; padding: 32px 32px 72px;
    display: flex; gap: 32px; align-items: flex-start;
  }
  /* Studio Phase 12 dark mode -- reuses the app's own REAL shipped dark
     palette (app/src/constants/theme.js darkColors), not an invented one:
     background IS the brand navy, surface is the lighter steel-navy,
     text IS the brand cream. Status colors brighten for the same reason
     that file documents -- WCAG AA against this lighter navy. */
  .studio-shell[data-theme="dark"] {
    --studio-navy: #F5F0E8; --studio-cream: #1E3A5F; --studio-white: #2B4A74;
    --studio-grey: #B6C3D3; --studio-muted: #8FA0B5; --studio-sand: rgba(245,240,232,0.10);
    --studio-surface-tint: rgba(245,240,232,0.06);
    --studio-border: rgba(245,240,232,0.14); --studio-border-strong: rgba(245,240,232,0.22);
    --studio-overlay: rgba(0,0,0,0.65);
    --studio-card-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.35);
    --studio-disabled-bg: rgba(245,240,232,0.18);
    --studio-green: #4ADE80; --studio-amber: #FBBF24; --studio-red: #FCA5A5;
    --studio-skeleton-base: rgba(245,240,232,0.08); --studio-skeleton-shine: rgba(245,240,232,0.24);
    color-scheme: dark;
  }

  .studio-shell [id] { scroll-margin-top: 108px !important; }
  .studio-main { flex: 1; min-width: 0; }
  .studio-shell-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: var(--studio-gap); }
  .studio-header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .studio-theme-toggle {
    display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex-shrink: 0;
    border-radius: 9px; border: 1px solid var(--studio-border-strong); background: var(--studio-white); color: var(--studio-navy);
    cursor: pointer; transition: background 120ms, border-color 120ms;
  }
  .studio-theme-toggle:hover, .studio-theme-toggle:focus-visible { border-color: var(--studio-accent); color: var(--studio-accent); outline: none; }
  .studio-header-texture {
    position: relative; border-radius: 16px; padding: 18px 20px 4px; margin: -18px -20px var(--studio-gap);
    overflow: hidden;
  }
  .studio-header-texture::before {
    content: ''; position: absolute; inset: 0; opacity: 1; pointer-events: none;
    background-image: var(--studio-texture-image); background-size: 26px 26px;
  }
  .studio-header-texture > * { position: relative; z-index: 1; }

  .studio-hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: stretch; margin-bottom: var(--studio-gap); }
  .studio-card { padding: 22px 24px; background: var(--studio-white); box-shadow: var(--studio-card-shadow); border-color: var(--studio-border); }

  ${SIDEBAR_STYLES}
  ${SKELETON_STYLES}

  .studio-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid ${BORDER}; border-radius: 10px; }
  .studio-table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .studio-table th { position: sticky; top: 0; z-index: 1; text-align: left; font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${GREY};
    background: ${SURFACE_TINT}; padding: 10px 12px; border-bottom: 1px solid ${BORDER}; white-space: nowrap; }
  .studio-table td { font-family: ${FONT_SANS}; font-size: 13px; color: ${NAVY}; padding: 10px 12px; border-bottom: 1px solid var(--studio-border);
    white-space: nowrap; vertical-align: middle; font-variant-numeric: tabular-nums; line-height: 1.45; }
  .studio-table tbody tr:nth-child(even) td { background: var(--studio-surface-tint); }
  .studio-table tbody tr:hover td { background: var(--studio-sand); }
  .studio-table tbody tr:last-child td { border-bottom: none; }
  .studio-table--top td { vertical-align: top; white-space: normal; }

  .studio-form-panel { background: ${SURFACE_TINT}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .studio-form-row { display: grid; gap: 12px; align-items: end; }
  .studio-input:focus, .studio-form-panel input:focus, .studio-form-panel select:focus, .studio-form-panel textarea:focus {
    outline: none; border-color: var(--studio-accent); box-shadow: 0 0 0 3px var(--studio-accent-tint); }
  .studio-shell select, .studio-shell input, .studio-shell textarea { color: ${NAVY}; background: var(--studio-white); }
  .studio-shell input::placeholder, .studio-shell textarea::placeholder { color: ${MUTED}; }

  @keyframes studio-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
  .studio-fade-in { animation: studio-fade-in 420ms ease both; }

  @media (max-width: 959px) {
    .studio-shell { gap: 0; }
    .studio-shell [id] { scroll-margin-top: 128px !important; }
  }
  @media (max-width: 720px) {
    .studio-shell { --studio-gap: 16px; padding: 20px 16px 56px; }
    .studio-hero-grid { grid-template-columns: 1fr; gap: 12px; }
    .studio-card { padding: 16px; }
    .studio-header-texture { margin: -14px -16px var(--studio-gap); padding: 14px 16px 4px; }
  }
  @media (max-width: 700px) { .studio-form-row { grid-template-columns: 1fr 1fr !important; } .studio-form-row > .studio-form-wide { grid-column: 1 / -1; } }
  @media (max-width: 480px) { .studio-form-row { grid-template-columns: 1fr !important; } .studio-form-row > button { width: 100%; } }
  @media (prefers-reduced-motion: reduce) { .studio-fade-in { animation: none; } }
`

/**
 * Page shell every Studio hub sits on top of: a persistent left sidebar
 * (grouped section nav -- see StudioSidebar.jsx), a personalized greeting
 * banner, then a row of 2-4 hero bar-chart cards (the hub's "main chart"),
 * then the hub's own sections -- NOT separate pages, one continuous
 * scrolling page per hub, the sidebar just jumps around it.
 *
 * `heroCharts`: [{ key, title, caption?, data, valueFormatter? }] -- each
 * rendered as its own MetricBarChart card via the shared chart style.
 * `heroChartsLoading`: true while the hub's own page-level fetch is still
 * in flight, so each hero chart shows a shimmer skeleton instead of
 * momentarily looking like an empty chart (see MetricBarChart.jsx).
 * `sections`: passed straight to StudioSidebar, same [{id,label}] shape
 * every hub page already builds for the old SectionJumpNav.
 * `accentColor`: per-hub accent, layered on the shared navy/cream/gold base
 * -- also what the greeting banner and background texture render in.
 * `rangeControl`: optional node (e.g. the existing day/week/month/year
 * toggle) rendered in the header next to the title.
 */
export default function StudioShell({
  hubKey,
  title,
  subtitle,
  accentColor = NAVY,
  heroCharts = [],
  heroChartsLoading = false,
  sections = [],
  rangeControl,
  error,
  children,
}) {
  const { mode, toggle } = useStudioTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="studio-shell" data-theme={mode} style={accentVars(accentColor)}>
      <style>{SHELL_STYLES}</style>

      {sections.length > 0 && (
        <StudioSidebar hubKey={hubKey} sections={sections} title={title} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="studio-main">
        {/* Studio Phase 12: a very faint per-hub geometric texture, contained
            to the header + greeting area only (not the whole page), in the
            hub's own accent color at low opacity -- a repeating diamond
            motif echoing the UBP mark, not a generic dot grid. Text inside
            sits in a later paint layer (z-index) so contrast is unaffected;
            alpha is intentionally low enough (~6%) to stay well clear of
            WCAG AA on both light and dark chrome. */}
        <div className="studio-header-texture" style={{ '--studio-texture-image': textureImage(accentColor) }}>
          <header className="studio-shell-header">
            <div style={{ minWidth: 0, flex: '1 1 420px' }}>
              <div className="studio-header-row">
                {sections.length > 0 && <SidebarToggleButton onClick={() => setSidebarOpen(true)} />}
                <p style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0,
                  fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: GREY,
                }}>
                  <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${SAND}` }} />
                  UniBlueprint Studio
                </p>
              </div>
              <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 34px)', lineHeight: 1.15, color: NAVY, margin: 0 }}>{title}</h1>
              {subtitle && (
                <p style={{ fontFamily: FONT_SANS, fontSize: '13.5px', color: GREY, margin: '8px 0 0', lineHeight: 1.6, maxWidth: '780px', overflowWrap: 'anywhere' }}>{subtitle}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button" className="studio-theme-toggle" onClick={toggle}
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {rangeControl}
            </div>
          </header>

          <GreetingBanner hubKey={hubKey} accentColor={accentColor} />
        </div>

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
                    loading={heroChartsLoading}
                  />
                </div>
              </StudioCard>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}

// Exposes the hub accent to the shared CSS above (sidebar hover, input
// focus rings) without each rule needing the hex inlined.
function accentVars(accent) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent || '') ? accent : '#1E3A5F'
  return {
    '--studio-accent': hex,
    '--studio-accent-tint': tint(hex, 0.10),
    '--studio-accent-border': tint(hex, 0.28),
  }
}

// Faint repeating diamond motif (echoes the UBP mark) in the hub's own
// accent at low opacity, for the header texture layer above.
function textureImage(accent) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent || '') ? accent : '#1E3A5F'
  const fill = encodeURIComponent(tint(hex, 0.07))
  const stroke = encodeURIComponent(tint(hex, 0.16))
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'>` +
    `<path d='M13 2 L24 13 L13 24 L2 13 Z' fill='${fill}' stroke='${stroke}' stroke-width='1'/>` +
    `</svg>`
  return `url("data:image/svg+xml;utf8,${svg}")`
}
