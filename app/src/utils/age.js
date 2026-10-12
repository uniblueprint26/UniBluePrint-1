/**
 * age — shared helpers for turning a date_of_birth into a whole-years age.
 *
 * Used by SignUpScreen (client-side block on sign-up under
 * constants/legal.js's MIN_SIGNUP_AGE) and the Investment tab's gate
 * (BudgetingScreen, via hooks/useInvestmentAccess.js) on
 * MIN_INVESTMENT_AGE. Both read the same `date_of_birth` concept — see
 * the profiles_date_of_birth_age_gate migration for the database-level
 * backstop on the 16+ side.
 */

/**
 * Whole-years age as of today for a given date of birth. Accepts a Date,
 * an ISO "YYYY-MM-DD" string, or anything `new Date()` can parse. Returns
 * null for anything missing or unparseable — callers should treat null as
 * "unknown", never as "old enough" or "too young".
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hadBirthdayThisYear) age -= 1
  return age
}

/**
 * True only when dateOfBirth is present, parseable, and indicates an age of
 * at least minAge. Fails closed: a missing or unparseable date of birth
 * returns false rather than assuming the person qualifies.
 */
export function isAtLeastAge(dateOfBirth, minAge) {
  const age = calculateAge(dateOfBirth)
  return age !== null && age >= minAge
}

/** Builds a same-calendar-day Date exactly `years` ago from today — the
 * cutoff date-of-birth values are compared against. Someone born ON this
 * date turns `years` old today and counts as meeting it. */
export function yearsAgoToday(years) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setFullYear(d.getFullYear() - years)
  return d
}
