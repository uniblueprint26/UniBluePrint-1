import { Platform } from 'react-native'

// The one place that decides how a store build behaves. Read this before
// adding any purchase button, price or link to the website.
//
// IS_NATIVE: an iOS or Android build. The web build is everything else.
export const IS_NATIVE = Platform.OS !== 'web'

// Neutral billing (App Store 3.1.1 and Google Play Payments policy).
// On iOS and Android the app never sells digital things or steers people to
// buy them elsewhere. That means, on native:
//   - no "Upgrade to Pro" button, no Pro prices, no link to the pricing page
//   - no checkout for Foundation, Ad Board ads or Marketplace skill listings
//   - Pro is simply managed on the website, said once in plain text at most
// Web keeps every purchase flow as it works today.
//
// Real-world services (coaching in person, tickets for a night out) are not
// digital goods, so they are the one exception. Use `isRealWorldCoach` below
// and keep the list of exceptions short and obvious.
export const NATIVE_NEUTRAL_BILLING = IS_NATIVE

// True only when a coach is clearly delivered in person, so the website
// booking link may stay on native. Online, digital or unclear coaching is
// treated as neutral: no booking link, the person can still send a message.
export function isRealWorldCoach(coach) {
  if (!coach) return false
  if (coach.filter !== 'Fitness') return false
  return !/online|virtual|remote|digital/i.test(`${coach.category || ''} ${coach.cardTag || ''}`)
}
