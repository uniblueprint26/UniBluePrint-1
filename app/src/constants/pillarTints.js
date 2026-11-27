// Pillar accent colours with a lighter version for dark mode.
//   Elevation  #5B4B8A, the arrow
//   Lifestyle  #D9596B, the heart
// Use these for small accents only (borders, dots, tinted chip backgrounds).
// Body text stays on the normal theme text colours.
export const PILLAR_TINTS = {
  elevation: { light: '#5B4B8A', dark: '#B7A3F0' },
  lifestyle: { light: '#D9596B', dark: '#EE8796' },
}

export function pillarTint(key, isDark) {
  const t = PILLAR_TINTS[key] || PILLAR_TINTS.lifestyle
  return isDark ? t.dark : t.light
}
