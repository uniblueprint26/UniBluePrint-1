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
  background: '#F7F2EA',   // page background
  surface: '#FFFFFF',      // card/sheet background
  surfaceSunk: '#ECE4D5',  // recessed surface (story-rail ring base)
  surfaceAlt: '#F7F2EA',   // secondary surface, e.g. nested sections
  chromeBg: '#1E3A5F',     // "always navy" bars — TopBar, drawer, dark-variant ScreenHeader
  chromeFg: '#F5F0E8',     // text/icons on chromeBg
  accentBg: '#1E3A5F',     // primary button / active-state fill
  accentFg: '#F5F0E8',     // text/icons on accentBg
  textPrimary: '#1E3A5F',  // headings/body ink on background/surface
  textSecondary: '#6B7280', // muted/secondary text
  textTertiary: '#9CA3AF', // placeholders, disabled, least-emphasis text
  divider: 'rgba(30,58,95,0.09)',
  overlay: 'rgba(11,22,35,0.5)', // modal/sheet backdrop
  // Rare "little detail" gold accent — timestamps only, never a workhorse
  // UI color. Mode-aware (separate from the brand-invariant `gold` swatch
  // above) because dark mode needs a lighter, more-yellow value to read
  // against navy than light mode needs against cream.
  goldText: '#B4923A',
}

export const darkColors = {
  navy: '#1E3A5F',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  // Warmed from a cool blue-grey to a cream-tinted warm grey (2026-11-09,
  // founder premium-pass feedback: "cream should have a bigger impact in
  // dark mode"). These two are the most-used colors on the screen after
  // navy/cream themselves — captions, labels, inactive icons — so a blue-
  // grey here was quietly fighting the navy/cream identity everywhere at
  // once, even while textPrimary/chromeFg were correctly cream. Contrast
  // re-verified against both background and surface, matching or slightly
  // beating the old blue-grey values' own ratios (~4.3-4.4:1 against navy
  // for `light`, ~6:1/4.8:1 against navy/surface for `muted`).
  muted: '#C4BCA8',
  light: '#A89F8A',
  border: 'rgba(245,240,232,0.14)',
  success: '#4ADE80',
  destructive: '#FCA5A5',
  gold: '#C9A24B',
  goldDeep: '#A5813B',
  goldLight: '#E4C77E',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.14)',
  infoBg: 'rgba(245,240,232,0.07)',
  successBg: 'rgba(74,222,128,0.12)',
  newBadge: '#A78BFA',

  // Founder decision (2026-10-14): direct swap of the brand's own navy/
  // cream, not a separate muted near-black palette — background IS the
  // brand navy swatch, text IS the brand cream swatch. surface/chromeBg
  // share one lighter navy step so cards and "always navy" chrome (TopBar,
  // drawer) read as one consistent elevated tone against the deeper navy
  // page; surfaceAlt mirrors light mode's own convention of equalling the
  // page background rather than introducing a third tone. textSecondary/
  // textTertiary/muted/light/destructive were nudged lighter than a literal
  // cream-at-opacity would give, specifically to keep clearing WCAG AA
  // 4.5:1 against this lighter navy (a near-black background forgives more
  // than the actual brand navy does) — verified with a relative-luminance
  // contrast check, not eyeballed; see the founder-approved preview at
  // claude.ai/artifact/KYtzjKVrcyCap74hzCTUME.
  //
  // accentBg revised (2026-11-09, founder premium-pass feedback): cream,
  // not gold. Navy+gold-as-workhorse-button-color read as diluting the
  // navy/cream identity the founder wants dominant — a solid cream fill
  // still clears contrast against navy (same reasoning gold originally
  // solved: navy-on-navy disappears) while keeping the whole dark-mode
  // palette to just navy + cream. Gold stays in the palette as a genuinely
  // rare "premium highlight" accent (badges, index tabs, special moments)
  // rather than the default interactive color — see `colors.gold` used
  // directly for that, not accentBg.
  //
  // textPrimary/chromeFg/accentFg lightened to `#FBF6E8` (2026-11-09,
  // mockup sign-off after several rounds: too dark/muddy, then too close
  // to white — this is the settled value, closer to white while staying
  // clearly cream, not the plain `#F5F0E8` brand swatch).
  background: '#1E3A5F',
  surface: '#2B4A74',
  surfaceSunk: '#17304C',
  surfaceAlt: '#1E3A5F',
  chromeBg: '#2B4A74',
  chromeFg: '#FBF6E8',
  accentBg: '#FBF6E8',
  accentFg: '#1E3A5F',
  textPrimary: '#FBF6E8',
  textSecondary: '#C4BCA8',
  textTertiary: '#A89F8A',
  divider: 'rgba(251,246,232,0.2)',
  overlay: 'rgba(0,0,0,0.65)',
  // See light mode's `goldText` — dark mode's version, more yellow than
  // orange per founder feedback, lightened to clear contrast on navy.
  goldText: '#E0C06C',
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
  // Soft, large-blur, low-opacity "floating glass" shadow — for elements
  // that should read as elevated above the page (composer bar, primary
  // buttons, story rings), not bordered stickers sitting on it. Use instead
  // of `card` wherever a border was previously doing the separation job —
  // relying on both a shadow AND a border at once is what was reading
  // "blocky" rather than premium.
  glow: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  // Dark-mode counterpart of `glow` — a navy shadow barely shows against an
  // already-dark background, so this leans on a deeper, higher-contrast
  // shadow color (near-black) instead of just turning opacity down to zero.
  glowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
}

// Top-to-bottom gradient stops for the subtle "glossy" highlight sheen
// overlaid on elevated surfaces (cards, buttons, the composer bar, story
// rings) — a thin band of light catching the top edge, like a real glossy
// surface, rather than a flat painted color. Pass to expo-linear-gradient's
// `colors` prop. Picked per mode since a light sheen needs more opacity to
// read against navy than it does against white/cream.
export const sheen = {
  light: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'],
  dark: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'],
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
