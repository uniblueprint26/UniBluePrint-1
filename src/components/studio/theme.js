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

export const FONT_SERIF = "'DM Serif Display', serif"
export const FONT_SANS = "'DM Sans', sans-serif"

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
}
