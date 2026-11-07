// ─── Partner brand tokens ──────────────────────────────────────────────────────
// UniBlueprint integrates independent products (CourseCompass today, "Priority"
// queued separately) by linking out to a screen branded in THAT partner's own
// identity rather than UniBlueprint's navy/cream — it's their tool, wearing
// their look, just reachable from inside our app. Each entry here is everything
// a screen needs to render in that partner's brand: colors, fonts (already
// registered in App.jsx via @expo-google-fonts/*), and their own tagline/credit
// line. Add a new key here, then build the screen with PartnerBrandedHeader
// (src/components/partners/PartnerBrandedHeader.jsx) instead of hand-rolling
// another one-off header — that's the reusable half of the pattern.

export const COURSE_COMPASS = {
  key: 'course-compass',
  name: 'CourseCompass',
  tagline: 'Helping Irish students choose subjects, courses and careers with confidence from first year to CAO offer.',
  creditLine: 'An independent platform by Stephen McKeon, integrated in partnership with UniBlueprint',
  // Confirmed from coursecompass.ie's own favicon mask-color / brand assets.
  navy: '#1E3A5F',
  sky: '#3DA9E0',
  orange: '#F2994A',
  cream: '#F7F9FB',
  muted: '#64748B',
  white: '#FFFFFF',
  fonts: {
    // Crimson Pro for headlines (600/700), Outfit for body — CourseCompass's
    // real type pairing, loaded globally in App.jsx so any partner-branded
    // screen can use them without its own font loading.
    headingSemi: 'CrimsonPro_600SemiBold',
    headingBold: 'CrimsonPro_700Bold',
    body: 'Outfit_400Regular',
    bodyMedium: 'Outfit_500Medium',
    bodySemiBold: 'Outfit_600SemiBold',
  },
}
