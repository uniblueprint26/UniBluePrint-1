// Shared design tokens for the Studio component library (internal hubs).
//
// These are the EXACT tokens already in production use on
// src/pages/admin/{FounderDashboardPage,OperationsDashboardPage,
// FinanceDashboardPage}.jsx -- re-exported from one place rather than
// re-typed per hub, so a future hub built on StudioShell automatically
// matches the look of the ones that came before it.
//
// Dark mode: deliberately NOT implemented here. Checked the whole website
// side of this repo (src/) for a dark-mode pattern before building this --
// there isn't one. The mobile app (app/) has its own ThemeContext, but that
// is a different codebase this pass is explicitly not touching. Every
// existing internal dashboard (Founder/Operations/Finance) renders a fixed
// light CREAM/NAVY surface regardless of system theme, so "follow the
// existing pattern" here means staying light-only, not inventing a new
// dark-mode system for just this one hub. Flagged in the handback report
// for the founder to confirm -- if the website is meant to pick up system
// dark mode later, that is a cross-hub design decision, not a Finance Hub
// one-off.

export const NAVY = '#1E3A5F'
export const CREAM = '#F5F0E8'
export const SAND = '#EDE8DF'
export const GREY = '#6B7280'
export const MUTED = '#9CA3AF'
export const GREEN = '#16A34A'
export const AMBER = '#F59E0B'
export const RED = '#DC2626'
export const WHITE = '#FFFFFF'

// StatusDot's status -> color language, shared with TaskBoard's status pill.
export const STATUS_COLORS = { green: GREEN, yellow: AMBER, red: RED, grey: MUTED }

export const FONT_SERIF = "'DM Serif Display', serif"
export const FONT_SANS = "'DM Sans', sans-serif"

// ─── Studio Phase 10: shared surface tokens ──────────────────────────────
// One "Studio card" visual language for every hub, instead of each page
// re-declaring its own border/radius/padding. Values stay inside the main
// site's own design reference (DESIGN_REFERENCE.md: 12px card radius,
// rgba(30,58,95,0.08-0.15) borders, navy-tinted soft shadow) -- only
// softened slightly so a page with 10+ cards doesn't read as a stack of
// floating tiles.
export const SURFACE_TINT = '#FAF8F4' // nested surfaces (stat tiles, form panels, table headers) inside a white card
export const BORDER = 'rgba(30,58,95,0.08)'
export const BORDER_STRONG = 'rgba(30,58,95,0.16)' // inputs, selects
export const CARD_RADIUS = '12px'
export const CARD_SHADOW = '0 1px 2px rgba(30,58,95,0.04), 0 2px 12px rgba(30,58,95,0.05)'

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
    background: enabled ? background : 'rgba(30,58,95,0.28)', color: WHITE,
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
  founder: NAVY,
  operations: '#2563EB',
  legal: '#0F766E',     // deep teal -- distinct from Finance's purple/Operations' blue, reads as "compliance" without borrowing red/amber (reserved for status, not identity, on this page)
  tech: '#EA580C',      // burnt orange -- distinct from finance/legal/operations' purple/teal/blue, reads as "build/ship" energy without touching red/amber (status-only on this page) or green (reserved for "healthy"/good status elsewhere)
  outreach: '#DB2777',  // rose/pink -- distinct hue from finance's violet-purple (#A21CAF), legal's teal, tech's burnt orange and operations' blue, and from the RED (#DC2626) reserved for status elsewhere on this page; reads as "outward-facing/relationships" warmth, fitting for a team whose job is people, not infrastructure
  marketing: '#4F46E5', // indigo -- distinct from finance's violet-purple (#A21CAF), legal's teal, tech's burnt orange, outreach's rose and Operations' own royal blue (#2563EB) above, and from RED/AMBER/GREEN (status-only on this page); reads as "brand/visibility" energy, fitting for the team that curates what gets promoted
  co_director: '#475569', // slate/graphite -- deliberately the one muted, cool-neutral accent among six warm/saturated hub hues (finance violet, legal teal, tech burnt orange, outreach rose, marketing indigo, operations blue) -- a rollup view sitting ABOVE the five operational hubs reads as senior/oversight precisely by not competing with any one of their colors, the same way NAVY/CREAM/GREY already read as the shared "base" layer every hub sits on. Distinct from GREY (#6B7280)/MUTED (#9CA3AF) by being darker and more saturated, so it still reads as a real accent, not disabled text. Judgment call, flagged in the Studio Phase 6 handback report.
  handler: '#B45309',   // deep amber/gold (amber-700) -- distinct hue from every existing accent: warmer/browner than tech's burnt orange (#EA580C), nowhere near finance's violet-purple, legal's teal, outreach's rose, marketing's indigo, operations' blue or co_director's slate. Reads as "dispatch/operational logistics" -- a queue being worked, tickets moving through stages -- the same intuition amber has in a shift-rota or ticketing UI, without touching GREEN/AMBER-as-status (#F59E0B, reserved for status elsewhere) or RED (status-only). Judgment call, flagged in the Studio Phase 7 handback report.
}

// Display labels for the free-text team values studio_requests/team_tasks
// use (Studio Phase 11) -- shared by RequestPanel's target-team picker and
// every hub's own "Requests" section so a cross-hub request reads the same
// hub name everywhere, not a re-typed label per page.
export const HUB_LABELS = {
  finance: 'Finance', legal: 'Legal', tech: 'Tech', outreach: 'Outreach',
  marketing: 'Marketing', handler: 'Campus Handler', operations: 'Operations',
  co_director: 'Co-Director', founder: 'Founder',
}
