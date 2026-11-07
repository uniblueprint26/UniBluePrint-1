// ─── Priority brand tokens ──────────────────────────────────────────────────
// Priority is UniBlueprint's events arm (campus nightlife + live music),
// run day-to-day by Ross — a distinct brand from UBP itself, same way
// Lifestyle's partner brands keep their own look inside a UBP-built screen.
//
// No standalone Priority logo/colour palette exists yet (checked every
// Priority artifact available before writing this). What IS real, carried
// over from the actual "UBP x Priority" planning materials (the Blueprint
// deck, the Meeting Pack, the Ross project-setup doc):
//   — Priority currently runs three genre pools: House (Sligo/Galway, the
//     proven baseline), Afrobeats (Dublin), and Folk (nationwide).
//   — the flagship concept in flight is a New Year's Refreshers launch,
//     ticketed through the UBP app itself, with tiered pricing
//     (Super Early Bird → 1st Release → Final Release).
//   — every real document about Priority sets its type in DM Serif Display
//     + DM Sans — the same two families UBP already loads app-wide.
// What's NOT documented anywhere is a Priority logo or hex palette — every
// real visual treatment found simply reuses UBP's own navy/cream/gold.
// Per the brief, this screen needs its own identity rather than looking like
// standard UBP navy/cream, so the one recurring signal that IS specifically
// tied to "Priority" content across every source (a warm gold/amber accent,
// used there to flag Priority-related callouts) is pulled forward here as
// the brand colour, set against a near-black nightlife background instead
// of UBP's cream daytime one. Genre accent colours (house/afrobeats/folk)
// are a new, reasonable extension for telling the three real pools apart at
// a glance — flag for Desmond/Ross to swap for real brand colours if/when
// Priority commissions its own identity.

export const priorityColors = {
  bg:        '#0B0B10',
  surface:   '#15151D',
  card:      '#1B1B24',
  cardAlt:   '#20202B',
  border:    'rgba(245,240,232,0.10)',
  borderStrong: 'rgba(201,162,75,0.35)',

  gold:      '#C9A24B',
  goldLight: '#E4C77E',
  goldDeep:  '#A5813B',

  cream:     '#F5F0E8',
  textPrimary: '#F5F0E8',
  textMuted:   '#9A9FAE',
  textFaint:   '#6B707E',

  success:   '#4ADE80',
  successBg: 'rgba(74,222,128,0.14)',
  danger:    '#F87171',

  house:      '#8B5CF6',
  afrobeats:  '#E8692B',
  folk:       '#4C8A63',
}

export const priorityGenres = {
  house:     { label: 'House',     color: priorityColors.house,     tag: 'HOUSE' },
  afrobeats: { label: 'Afrobeats', color: priorityColors.afrobeats, tag: 'AFROBEATS' },
  folk:      { label: 'Folk',      color: priorityColors.folk,      tag: 'FOLK' },
}

// Same two Google Fonts families as app/src/constants/theme.js — already
// loaded app-wide, and the real typefaces every Priority document uses.
export const priorityFonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
}
