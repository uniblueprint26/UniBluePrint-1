/**
 * useUserType — the shared, reusable "what kind of user is this" hook.
 *
 * Sourced from AuthContext, which loads it from profiles.user_type
 * (default 'student', see the 20260912090000_profiles_user_type_default
 * migration) whenever a session starts and keeps it in sync locally the
 * moment it's changed. Any screen can import this to read or change the
 * current user's type — used today by BudgetingScreen (income categories)
 * and the signup/Settings editors; Phase 6's Course Connect reframe should
 * read it the same way rather than adding its own copy of this concept.
 *
 * import { useUserType } from '../hooks/useUserType'
 * const { userType, label, setUserType, types, loading } = useUserType()
 *
 * Return shape:
 *   userType   — one of 'student' | 'apprentice' | 'gap_year' | 'worker'
 *                (see constants/userTypes.js), never null/undefined —
 *                falls back to the default while loading or signed out.
 *   label      — display label for the current userType, e.g. "Apprentice".
 *   types      — the full USER_TYPES list ({ key, label, sub }[]) for
 *                rendering a picker.
 *   loading    — true while the backing profile row is still being fetched.
 *   setUserType(nextKey) — async, writes to profiles.user_type and updates
 *                every consumer immediately. Resolves { error } (error is
 *                null on success) — never throws.
 */

import { useAuth } from '../context/AuthContext'
import { USER_TYPES, userTypeLabel } from '../constants/userTypes'

export function useUserType() {
  const { userType, updateUserType, profileLoading } = useAuth()
  return {
    userType,
    label: userTypeLabel(userType),
    types: USER_TYPES,
    loading: profileLoading,
    setUserType: updateUserType,
  }
}
