/**
 * useInvestmentAccess — whether the current user is old enough to see the
 * Budgeting screen's Investment tab (trading/investment education, a
 * copier product, and named trading coaches).
 *
 * Sign-up (SignUpScreen) already blocks account creation under
 * constants/legal.js's MIN_SIGNUP_AGE (16, Ireland's digital consent age).
 * This is a separate, higher bar — MIN_INVESTMENT_AGE (18) — checked
 * against the same profiles.date_of_birth value, not a new field.
 *
 * Fails closed: a user with no date of birth on file at all (every account
 * created before this field existed) gets canAccess: false, same as anyone
 * confirmed under 18 — never canAccess: true for an unknown age.
 *
 * import { useInvestmentAccess } from '../hooks/useInvestmentAccess'
 * const { canAccess, hasDateOfBirth, loading } = useInvestmentAccess()
 */

import { useAuth } from '../context/AuthContext'
import { isAtLeastAge } from '../utils/age'
import { MIN_INVESTMENT_AGE } from '../constants/legal'

export function useInvestmentAccess() {
  const { dateOfBirth, profileLoading } = useAuth()
  return {
    canAccess: isAtLeastAge(dateOfBirth, MIN_INVESTMENT_AGE),
    hasDateOfBirth: !!dateOfBirth,
    minAge: MIN_INVESTMENT_AGE,
    loading: profileLoading,
  }
}
