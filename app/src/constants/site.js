// Canonical website URLs the app links out to. Anything involving money or
// legal document text lives on the website, never duplicated or forked into
// the app bundle — the app always deep-links out for these, it never renders
// its own copy or collects payment details itself.

export const SITE_URL = 'https://uniblueprint.ie'

export const WEBSITE_LINKS = {
  terms:         `${SITE_URL}/terms`,
  privacy:       `${SITE_URL}/privacy`,
  refundPolicy:  `${SITE_URL}/refund-policy`,
  cookies:       `${SITE_URL}/cookies`,
  pricing:       `${SITE_URL}/pricing`,
  contact:       `${SITE_URL}/contact`,
  blog:          `${SITE_URL}/blog`,
}

// Foundation Blueprint's own builder pages — same 8 services as the app's
// Foundation builder screens, mirrored on the website (src/pages/
// foundation/*PageJsx). Used on iOS only: Foundation is pay-per-service
// digital content (App Store 3.1.1), so the app hides the whole in-app
// order/submit path there and points here instead, same call as the Pro
// subscription in PricingScreen. Keep this map's keys in sync with
// FoundationScreen.jsx's BUILDER_SCREEN_BY_TITLE (same service titles).
export const FOUNDATION_WEBSITE_LINKS = {
  'CV Optimisation':               `${SITE_URL}/foundation/cv-builder`,
  'LinkedIn Optimisation':         `${SITE_URL}/foundation/linkedin-optimisation`,
  'Cover Letter Assistance':       `${SITE_URL}/foundation/cover-letter`,
  'Application Form Assistance':   `${SITE_URL}/foundation/application-form-assistance`,
  'Interview Preparation':         `${SITE_URL}/foundation/interview-preparation`,
  'Personal Statement':            `${SITE_URL}/foundation/personal-statement`,
  'Portfolio Building':            `${SITE_URL}/foundation/portfolio-building`,
  'Job Search Support':            `${SITE_URL}/foundation/job-search-support`,
}

// Elevation Blueprint — the website's coach-booking landing page (src/pages/
// ElevationCoachBookingPage.jsx), used on iOS (and nowhere else) in place of
// the in-app CoachBookingScreen. Coaching sessions are a real-world service
// (App Store 3.1.3(e), "goods and services outside the app"), so unlike
// Foundation above, this is a normal external link, not a hidden path — see
// CoachProfileScreen.jsx for where it's called. `id` matches the numeric id
// used by ElevationScreen's coachSlug(id) helper ("coach-<id>"), which this
// mirrors rather than importing (the two codebases don't share modules).
export function coachBookingUrl(coach) {
  const params = [
    `coach=${encodeURIComponent(`coach-${coach.id}`)}`,
    coach.name ? `name=${encodeURIComponent(coach.name)}` : null,
    coach.category ? `category=${encodeURIComponent(coach.category)}` : null,
  ].filter(Boolean).join('&')
  return `${SITE_URL}/elevation/book-coach?${params}`
}
