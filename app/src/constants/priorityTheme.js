// ─── Priority brand tokens ──────────────────────────────────────────────────
// Priority is UniBlueprint's events arm (campus nightlife + live music),
// run day-to-day by Ross — a distinct brand from UBP itself, same way
// Lifestyle's partner brands keep their own look inside a UBP-built screen.
//
// CORRECTED 2026-11-11: an earlier pass through this file claimed "no
// standalone Priority logo/colour palette exists" — that was wrong. It does:
// the "Priority Inventory" artifact (claude.ai/artifact/6MCGyJr3tSq2QDxEpa8kxJ)
// already establishes a real identity, confirmed directly from its markup:
//   — a black + chrome/silver nightlife identity (NOT gold-dominant — see
//     below), with Playfair Display for headers and DM Sans for body.
//   — an actual logo mark: a circular dark badge (radial-gradient near-black
//     fill, a thin light "chrome" ring) holding an italic serif "P" rendered
//     in a moving silver/white gradient ("chrome" shine text effect). The
//     "Priority" wordmark itself uses that same chrome gradient treatment.
//   — gold/amber appears exactly ONCE in that real artifact: a small "In
//     collaboration with UniBlueprint" footer credit, gold applied only to
//     the word "UniBlueprint". It is NOT Priority's own accent colour.
// `silver1`/`silver2`/`silver3` below are the verified real chrome palette.
// `black`/`surfaceDeep`/`fg`/`muted` are the verified real base tokens.
//
// FIXED 2026-11-12: `priorityColors` below used to hold the original
// placeholder (pre-correction) gold-as-primary-accent tokens, used as the
// workhorse accent across PrioritiesScreen.jsx, PriorityEventScreen.jsx and
// PriorityCheckoutScreen.jsx (flagship gradient, CTA buttons, price text,
// active states) — that didn't match the real identity above. It's now
// DERIVED from `priorityChrome` below, so all three screens pick up the
// real black+chrome/silver identity with no changes to the screens
// themselves. `gold`/`goldLight`/`goldDeep` keep their original key names
// (to avoid a three-file mechanical rename in the same pass) but hold
// silver tones now, not gold — renaming those keys to `accent`/
// `accentLight`/`accentDeep` is a real but purely cosmetic follow-up.
// Similarly, `priorityFonts.serif` below is still DM Serif Display, not Playfair
// Display — Playfair Display isn't loaded as a font anywhere in this app
// yet (would need adding via @expo-google-fonts), so the export is left as
// the font that's actually available rather than pointing at one that
// would silently fail to load.
//
// Also real, carried over from the actual "UBP x Priority" planning
// materials (the Blueprint deck, the Meeting Pack, the Ross project-setup
// doc):
//   — Priority currently runs three genre pools: House (Sligo/Galway, the
//     proven baseline), Afrobeats (Dublin), and Folk (nationwide). These
//     genre accent colours are a reasonable extension for telling the three
//     pools apart at a glance, not challenged by the identity correction
//     above — no change needed there.
//   — the flagship concept in flight is a New Year's Refreshers launch,
//     ticketed through the UBP app itself, with tiered pricing
//     (Super Early Bird → 1st Release → Final Release).

// Verified real chrome/silver identity, confirmed directly from the
// "Priority Inventory" artifact's own markup (see the correction note
// above). `priorityColors` below is now derived from this.
export const priorityChrome = {
  black:      '#070707',
  surfaceDeep:'#121212',
  surfaceTint:'#1A1A1A',
  fg:         '#F2F1EE',
  muted:      '#9A9A95',
  border:     'rgba(242,241,238,0.14)',

  silver1:    '#B9B9B4', // primary chrome accent
  silver2:    '#FFFFFF', // brightest chrome highlight / shine peak
  silver3:    '#8C8C87', // deeper chrome tone

  danger:     '#D98677',

  // The one legitimate gold use: a small "in collaboration with
  // UniBlueprint" credit, applied to the word "UniBlueprint" only — never
  // to anything that reads as Priority's own brand. None of the 3 live
  // Priority screens show this credit today, so none of them use this.
  ubpCollabGold: '#C9A24B',
  ubpNavy:       '#1E3A5F',
  ubpCream:      '#F5F0E8',
}

export const priorityColors = {
  bg:        priorityChrome.black,
  surface:   priorityChrome.surfaceDeep,
  card:      priorityChrome.surfaceTint,
  cardAlt:   '#232323',
  border:    priorityChrome.border,
  borderStrong: 'rgba(185,185,180,0.32)',

  gold:      priorityChrome.silver1,
  goldLight: priorityChrome.silver2,
  goldDeep:  priorityChrome.silver3,

  cream:     priorityChrome.fg,
  textPrimary: priorityChrome.fg,
  textMuted:   priorityChrome.muted,
  textFaint:   '#6E6E69',

  success:   '#4ADE80',
  successBg: 'rgba(74,222,128,0.14)',
  danger:    priorityChrome.danger,

  house:      '#8B5CF6',
  afrobeats:  '#E8692B',
  folk:       '#4C8A63',
}

export const priorityGenres = {
  house:     { label: 'House',     color: priorityColors.house,     tag: 'HOUSE' },
  afrobeats: { label: 'Afrobeats', color: priorityColors.afrobeats, tag: 'AFROBEATS' },
  folk:      { label: 'Folk',      color: priorityColors.folk,      tag: 'FOLK' },
}

// `sans` here is correct — DM Sans is genuinely the real body typeface.
// `serif` is a stand-in: the real headline typeface is Playfair Display
// (see the correction note above), not loaded anywhere in this app yet.
// Add it via @expo-google-fonts/playfair-display before using it for real,
// rather than pointing this export at a font name that isn't loaded.
export const priorityFonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
}
