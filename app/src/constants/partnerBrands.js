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

// Kobo (kobopayments.com). The site says "Closed beta, test money only", so UBP
// only ever shows it as a waitlist partner, never as a live money service.
// Palette read from the live site. Outfit for headings and body.
export const KOBO = {
  name: 'Kobo',
  teal: '#073F3C',
  tealDeep: '#021413',
  tealMid: '#12645D',
  mint: '#A8E6CF',
  amber: '#F4B942',
  cream: '#FAF7F0',
  waitlistUrl: 'https://kobopayments.com/waitlist',
  siteUrl: 'https://kobopayments.com',
  fonts: { heading: 'Outfit_600SemiBold', body: 'Outfit_400Regular', bodyMedium: 'Outfit_500Medium' },
}

// ScoutByRohi (scoutbyrohi.com), built by Rohi Aluede. Palette from the site.
export const SCOUT = {
  name: 'ScoutByRohi',
  forest: '#0B3327',
  green: '#0A7449',
  signal: '#12B76F',
  mint: '#D5E9DF',
  paper: '#F6F8F5',
  ink: '#0C2219',
  trackerUrl: 'https://scoutbyrohi.com/tracker',
  alertsUrl: 'https://scoutbyrohi.com/alerts',
  siteUrl: 'https://scoutbyrohi.com',
  fonts: { heading: 'DMSerifDisplay_400Regular', body: 'DMSans_400Regular', bodyMedium: 'DMSans_500Medium', bodySemi: 'DMSans_600SemiBold' },
}

// Roomy.ie (roomy.ie), the accommodation partner. Colours are taken from the
// roomy.ie site: blue theme colour #2563eb, dark green #1a2e1a, and the
// neon green outline house in their logo. They use system sans type.
export const ROOMY = {
  name: 'Roomy.ie',
  teal: '#2563EB',
  deep: '#1A2E1A',
  mint: '#4ADE80',
  siteUrl: 'https://roomy.ie',
  fonts: { heading: 'DMSans_700Bold', body: 'DMSans_400Regular', bodyMedium: 'DMSans_500Medium', bodySemi: 'DMSans_600SemiBold' },
}

