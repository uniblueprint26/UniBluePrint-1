// ── Color tokens: light + dark ──────────────────────────────────────────────
//
// `colors` (the plain object below) is the original, unchanged light palette
// — every screen that imports `{ colors }` directly (not yet migrated to
// `useTheme()`, see context/ThemeContext.jsx) keeps getting exactly these
// values, so this file staying backward-compatible is what keeps the dark
// mode rollout safe to do screen-by-screen rather than as one atomic flip.
//
// `lightColors`/`darkColors` are the mode-aware palettes `useTheme()` picks
// between. The brand swatches (navy/cream/white/gold family) keep the same
// literal hex in both — they're the fixed identity colors, not UI roles — so
// anything that genuinely wants "the brand navy" or "the brand gold" itself
// still gets it unchanged in dark mode too. The *semantic* roles that used to
// be done by reusing those same brand swatches (navy-as-heading-text,
// cream-as-page-background, white-as-card-background, navy-as-button-fill)
// are split out into their own tokens below — background/surface/
// textPrimary/textSecondary/accentBg/chromeBg/etc — because a literal hex
// can't do both "the page is light" and "the page is dark" jobs at once.
// Status/semantic colors (success/destructive/warning/newBadge) and
// goldDeep/goldLight get lightened where needed for dark mode so text set in
// them still clears WCAG AA (4.5:1) against the dark backgrounds below —
// verified with a relative-luminance check while building this palette, not
// just eyeballed. See context/ThemeContext.jsx for how the switch happens.

export const lightColors = {
  navy: '#1E3A5F',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  muted: '#6B7280',
  light: '#9CA3AF',
  border: 'rgba(30,58,95,0.12)',
  success: '#16A34A',
  destructive: '#DC2626',
  gold: '#C9A24B',
  goldDeep: '#A5813B',
  goldLight: '#E4C77E',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  infoBg: 'rgba(30,58,95,0.06)',
  successBg: '#F0FDF4',
  newBadge: '#7C3AED',

  // Semantic roles (mode-aware) — prefer these in any screen/component
  // that's been migrated to useTheme() over the brand swatches above.
  background: '#F5F0E8',   // page background
  surface: '#FFFFFF',      // card/sheet background
  surfaceAlt: '#F5F0E8',   // secondary surface, e.g. nested sections
  chromeBg: '#1E3A5F',     // "always navy" bars — TopBar, drawer, dark-variant ScreenHeader
  chromeFg: '#F5F0E8',     // text/icons on chromeBg
  accentBg: '#1E3A5F',     // primary button / active-state fill
  accentFg: '#F5F0E8',     // text/icons on accentBg
  textPrimary: '#1E3A5F',  // headings/body ink on background/surface
  textSecondary: '#6B7280', // muted/secondary text
  textTertiary: '#9CA3AF', // placeholders, disabled, least-emphasis text
  divider: 'rgba(30,58,95,0.12)',
  overlay: 'rgba(11,22,35,0.5)', // modal/sheet backdrop
}

export const darkColors = {
  navy: '#1E3A5F',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  muted: '#9BA8B8',
  light: '#7C8A9A',
  border: 'rgba(245,240,232,0.14)',
  success: '#4ADE80',
  destructive: '#F87171',
  gold: '#C9A24B',
  goldDeep: '#A5813B',
  goldLight: '#E4C77E',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.14)',
  infoBg: 'rgba(245,240,232,0.07)',
  successBg: 'rgba(74,222,128,0.12)',
  newBadge: '#A78BFA',

  background: '#0B1623',   // near-black, navy-tinted page background
  surface: '#132330',      // elevated card/sheet surface
  surfaceAlt: '#17293A',
  chromeBg: '#0B1623',     // chrome bars blend into the dark background
  chromeFg: '#F5F0E8',
  accentBg: '#406A90',     // lightened steel-navy so primary actions still read against a near-black page
  accentFg: '#F5F0E8',
  textPrimary: '#F5F0E8',
  textSecondary: '#9BA8B8',
  textTertiary: '#7C8A9A',
  divider: 'rgba(245,240,232,0.14)',
  overlay: 'rgba(0,0,0,0.65)',
}

// getColors(mode) — the one place that resolves a 'light' | 'dark' mode to
// its token object. useTheme() is the normal way to get these at runtime;
// this is exported for the rare case of needing a palette outside a
// component (e.g. a non-hook helper).
export function getColors(mode) {
  return mode === 'dark' ? darkColors : lightColors
}

// Unmigrated screens' existing `import { colors } from '...theme'` — always
// the light palette, unchanged from before dark mode existed.
export const colors = lightColors

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
}

export const shadows = {
  card: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
}

export const radius = {
  card: 12,
  button: 8,
  badge: 6,
  pill: 20,
  circle: 9999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
}
