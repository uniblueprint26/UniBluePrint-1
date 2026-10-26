// Shared design tokens for the Studio component library (internal hubs).
//
// These are the EXACT tokens already in production use on
// src/pages/admin/{FounderDashboardPage,OperationsDashboardPage,
// FinanceDashboardPage}.jsx -- re-exported from one place rather than
// re-typed per hub, so a future hub built on StudioShell automatically
// matches the look of the ones that came before it.
//
// ─── Studio Phase 12: dark mode, via CSS custom properties ───────────────
// Every token below that's used as a plain `color`/`background` value
// (NAVY, CREAM, WHITE, GREY, MUTED, SAND, BORDER, BORDER_STRONG,
// SURFACE_TINT, CARD_SHADOW, GREEN, AMBER, RED) is now the STRING NAME of a
// CSS variable (e.g. NAVY = 'var(--studio-navy)'), not a literal hex. The
// hundreds of existing `style={{ color: NAVY }}` call sites across every
// hub page do not need to change at all -- the browser resolves the var()
// against whichever value is cascading from `.studio-shell`'s own
// :root-level declaration (light defaults) or `.studio-shell[data-theme=
// "dark"]` (the override), both defined once in StudioShell.jsx's
// SHELL_STYLES. Toggling data-theme on the shell root is the entire
// mechanism -- no React re-render of any of these call sites is required
// for their colors to flip. See StudioShell.jsx + useStudioTheme.js.
//
// Reuses the app's own REAL shipped dark palette (app/src/constants/
// theme.js's darkColors) rather than inventing a second one: background IS
// the brand navy (#1E3A5F), surface is the lighter steel-navy (#2B4A74),
// text is the brand cream (#F5F0E8) -- see the var defaults/overrides in
// StudioShell.jsx for the exact values and the same WCAG-AA reasoning that
// file already documents.
//
// The one exception is STATUS_COLORS (green/yellow/red/grey): StatusDot/
// TaskBoard/RequestPanel feed these through `tint()` below to compute an
// rgba() halo/pill-background, which needs a REAL hex at JS-eval time, not
// a var() string. Those three files call getStatusColor(key) instead (see
// bottom of this file) -- a tiny function reading a module-level mode flag
// that StudioShell's theme hook sets synchronously on every render, before
// any descendant (including those three) renders in that same pass.
// GREEN/AMBER/RED below stay as var()-backed exports too, for every OTHER
// call site that uses them as a plain color (StatStrip `accent`, button
// backgrounds, etc.) -- those don't need getStatusColor(), var() is enough.

export const NAVY = 'var(--studio-navy)'
export const CREAM = 'var(--studio-cream)'
export const SAND = 'var(--studio-sand)'
export const GREY = 'var(--studio-grey)'
export const MUTED = 'var(--studio-muted)'
export const GREEN = 'var(--studio-green)'
export const AMBER = 'var(--studio-amber)'
export const RED = 'var(--studio-red)'
export const WHITE = 'var(--studio-white)'

// StatusDot's status -> color language, shared with TaskBoard's status pill.
// var()-backed -- fine for any plain color/background use. See
// getStatusColor() below for the real-hex version `tint()` math needs.
export const STATUS_COLORS = { green: GREEN, yellow: AMBER, red: RED, grey: MUTED }

// ── Mode-aware REAL hex, for the few call sites that run a status color
//    through tint() (StatusDot's halo, TaskBoard/RequestPanel's status
//    pill background) rather than using it as a plain color. ──
let _studioThemeMode = 'light'

/** Called by useStudioTheme() on every StudioShell render, synchronously,
 * before any descendant renders in that pass -- see the long comment above. */
export function setStudioThemeMode(mode) {
  _studioThemeMode = mode === 'dark' ? 'dark' : 'light'
}

export function getStudioThemeMode() {
  return _studioThemeMode
}

// Light values match STATUS_COLORS' own light defaults exactly (see
// --studio-green etc. in StudioShell.jsx). Dark values are the app's real
// dark-mode success/warning/destructive tokens (app/src/constants/
// theme.js's darkColors) -- brightened specifically so they still clear
// WCAG AA against the dark navy/steel-navy backgrounds, same reasoning
// that file documents for its own dark palette. "it's not just orange
// yellow red we need some greens" (founder) -- green is real in both modes,
// not a fallback to grey/amber.
const STATUS_HEX = {
  light: { green: '#16A34A', yellow: '#F59E0B', red: '#DC2626', grey: '#9CA3AF' },
  dark: { green: '#4ADE80', yellow: '#FBBF24', red: '#FCA5A5', grey: '#8FA0B5' },
}

/** Real hex (not a var() string) for the current mode -- use this, not
 * STATUS_COLORS, anywhere the value is fed through tint(). */
export function getStatusColor(key) {
  const table = STATUS_HEX[_studioThemeMode] || STATUS_HEX.light
  return table[key] || table.grey
}

// ─── Studio Phase 13: real-hex neutrals for raw SVG charts ───────────────
// TrendLineChart/DonutChart/ActivityHeatmap/MiniCalendar draw their own
// axis/grid/text/surface colors as literal SVG attributes (stroke="...",
// fill="..."), not CSS -- so, same reasoning as STATUS_HEX/getStatusColor
// above, they cannot use the var()-backed NAVY/GREY/BORDER/WHITE exports:
// a var() only resolves while the element is painted live in THIS page's
// DOM, cascading from .studio-shell's own declaration. The PNG export
// button (chartExport.js) serializes a chart's <svg> to a standalone
// string and repaints it in a plain, detached <img> with no access to
// this page's CSS custom properties at all -- a var() there resolves to
// nothing (default initial value), not the light/dark value, so an
// exported chart would download with invisible axis labels. These two
// helpers are the exact light/dark hex pairs StudioShell.jsx's own
// SHELL_STYLES already declares for --studio-grey/--studio-muted/
// --studio-border/--studio-white -- re-read from the current mode flag,
// never re-invented.
export function getChartNeutral(key) {
  const dark = _studioThemeMode === 'dark'
  const table = {
    text: dark ? '#B6C3D3' : '#6B7280',                              // --studio-grey
    muted: dark ? '#8FA0B5' : '#9CA3AF',                              // --studio-muted
    grid: dark ? 'rgba(245,240,232,0.14)' : 'rgba(30,58,95,0.08)',    // --studio-border
    surface: dark ? '#2B4A74' : '#FFFFFF',                            // --studio-white
    heading: dark ? '#F5F0E8' : '#1E3A5F',                            // --studio-navy
  }
  return table[key] || table.text
}

export const FONT_SERIF = "'DM Serif Display', serif"
export const FONT_SANS = "'DM Sans', sans-serif"

// ─── Studio Phase 10: shared surface tokens ──────────────────────────────
// One "Studio card" visual language for every hub, instead of each page
// re-declaring its own border/radius/padding. Values stay inside the main
// site's own design reference (DESIGN_REFERENCE.md: 12px card radius,
// rgba(30,58,95,0.08-0.15) borders, navy-tinted soft shadow) -- only
// softened slightly so a page with 10+ cards doesn't read as a stack of
// floating tiles.
export const SURFACE_TINT = 'var(--studio-surface-tint)' // nested surfaces (stat tiles, form panels, table headers) inside a white card
export const BORDER = 'var(--studio-border)'
export const BORDER_STRONG = 'var(--studio-border-strong)' // inputs, selects
export const CARD_RADIUS = '12px'
export const CARD_SHADOW = 'var(--studio-card-shadow)'
export const OVERLAY = 'var(--studio-overlay)' // modal/drawer backdrop

// Spacing rhythm shared by every hub: 4 / 8 / 12 / 16 / 24 / 32.
export const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px' }

/** '#RRGGBB' -> 'rgba(r,g,b,alpha)'. Falls back to the input for non-hex values. */
export function tint(hex, alpha) {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

// Shared form-control + button looks (plain style objects, so any hub can
// spread them onto its own inputs without a new component API).
export const STUDIO_INPUT = {
  fontFamily: FONT_SANS, fontSize: '13px', color: NAVY,
  padding: '0 12px', height: '40px', borderRadius: '8px',
  border: `1px solid ${BORDER_STRONG}`, background: WHITE,
  width: '100%', boxSizing: 'border-box',
}
export const STUDIO_SELECT_SM = {
  fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY,
  padding: '5px 8px', height: '30px', borderRadius: '7px',
  border: `1px solid ${BORDER_STRONG}`, background: WHITE,
}
export function studioButton(background, enabled = true) {
  return {
    fontFamily: FONT_SANS, fontSize: '13px', fontWeight: 700,
    height: '40px', padding: '0 18px', borderRadius: '8px', border: 'none',
    background: enabled ? background : 'var(--studio-disabled-bg)', color: WHITE,
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    whiteSpace: 'nowrap', transition: 'background 150ms, box-shadow 150ms',
  }
}

/** True for values that read as an honest zero/empty ("0", "€0.00", "0%", "—"). */
export function isZeroish(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return value === 0
  if (typeof value !== 'string') return false
  const s = value.trim()
  return s === '—' || s === '' || /^[^\d]*0(?:[.,]0+)?[^\d]*$/.test(s)
}

// Per-hub accent colors, layered on top of the shared navy/cream/gold base.
// Add a new key here when a future hub (Marketing/Outreach/Co-Director) is
// built on StudioShell -- do not invent a parallel palette.
export const HUB_ACCENTS = {
  finance: '#A21CAF',   // matches the existing "Coaching" tile accent on FinanceDashboardPage
  // Literal brand navy hex, NOT the NAVY export above -- NAVY is now a
  // var(--studio-navy) STRING (it flips to cream-text in dark mode, see
  // Studio Phase 12's theme.js header comment), while an identity accent
  // color must stay the one fixed hex in both modes (same as every other
  // hub's accent here) AND must stay real hex so tint() -- used for the
  // sidebar/jump-nav hover tint and focus rings -- can actually compute an
  // alpha-blended color from it instead of silently no-op'ing on a var().
  founder: '#1E3A5F',
  operations: '#2563EB',
  legal: '#0F766E',     // deep teal -- distinct from Finance's purple/Operations' blue, reads as "compliance" without borrowing red/amber (reserved for status, not identity, on this page)
  tech: '#EA580C',      // burnt orange -- distinct from finance/legal/operations' purple/teal/blue, reads as "build/ship" energy without touching red/amber (status-only on this page) or green (reserved for "healthy"/good status elsewhere)
  outreach: '#DB2777',  // rose/pink -- distinct hue from finance's violet-purple (#A21CAF), legal's teal, tech's burnt orange and operations' blue, and from the RED (#DC2626) reserved for status elsewhere on this page; reads as "outward-facing/relationships" warmth, fitting for a team whose job is people, not infrastructure
  marketing: '#4F46E5', // indigo -- distinct from finance's violet-purple (#A21CAF), legal's teal, tech's burnt orange, outreach's rose and Operations' own royal blue (#2563EB) above, and from RED/AMBER/GREEN (status-only on this page); reads as "brand/visibility" energy, fitting for the team that curates what gets promoted
  co_director: '#475569', // slate/graphite -- deliberately the one muted, cool-neutral accent among six warm/saturated hub hues (finance violet, legal teal, tech burnt orange, outreach rose, marketing indigo, operations blue) -- a rollup view sitting ABOVE the five operational hubs reads as senior/oversight precisely by not competing with any one of their colors, the same way NAVY/CREAM/GREY already read as the shared "base" layer every hub sits on. Distinct from GREY (#6B7280)/MUTED (#9CA3AF) by being darker and more saturated, so it still reads as a real accent, not disabled text. Judgment call, flagged in the Studio Phase 6 handback report.
  handler: '#B45309',   // deep amber/gold (amber-700) -- distinct hue from every existing accent: warmer/browner than tech's burnt orange (#EA580C), nowhere near finance's violet-purple, legal's teal, outreach's rose, marketing's indigo, operations' blue or co_director's slate. Reads as "dispatch/operational logistics" -- a queue being worked, tickets moving through stages -- the same intuition amber has in a shift-rota or ticketing UI, without touching GREEN/AMBER-as-status (#F59E0B, reserved for status elsewhere) or RED (status-only). Judgment call, flagged in the Studio Phase 7 handback report.
}

// Studio Phase 13 -- the one shared day/week/month/year option set for
// PeriodToggle.jsx. Lives here (plain constants only, same as HUB_ACCENTS/
// HUB_LABELS above) rather than in PeriodToggle.jsx itself, so that
// component file exports only the one component Fast Refresh expects --
// keeps the Tech Hub's own documented 14-warning lint baseline from
// growing by one for exporting a constant alongside a component.
export const DAY_WEEK_MONTH_YEAR = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

// Display labels for the free-text team values studio_requests/team_tasks
// use (Studio Phase 11) -- shared by RequestPanel's target-team picker and
// every hub's own "Requests" section so a cross-hub request reads the same
// hub name everywhere, not a re-typed label per page.
export const HUB_LABELS = {
  finance: 'Finance', legal: 'Legal', tech: 'Tech', outreach: 'Outreach',
  marketing: 'Marketing', handler: 'Campus Handler', operations: 'Operations',
  co_director: 'Co-Director', founder: 'Founder',
}
