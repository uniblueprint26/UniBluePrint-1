/**
 * userTypes — the general "what kind of user is this" concept, shared
 * across the whole app.
 *
 * This is deliberately a small, coarse, four-way split — NOT the same thing
 * as SignUpScreen's more granular `situation` field (in_college, plc,
 * apprenticeship, working, gap_year, recent_grad, prospective, other),
 * which drives institution/trade lookups and the Directory profile line.
 * `user_type` is the general-purpose value other features key off: which
 * Budgeting income categories to show, which copy reads naturally on Home,
 * and (from Phase 6 onward) how Course Connect frames itself.
 *
 * Stored on profiles.user_type (see the
 * 20260912090000_profiles_user_type_default migration), default 'student'.
 * Read/write it through useUserType() (see hooks/useUserType.js) rather
 * than querying the profiles table directly.
 */

export const USER_TYPE_STUDENT    = 'student'
export const USER_TYPE_APPRENTICE = 'apprentice'
export const USER_TYPE_GAP_YEAR   = 'gap_year'
export const USER_TYPE_WORKER     = 'worker'

export const DEFAULT_USER_TYPE = USER_TYPE_STUDENT

export const USER_TYPES = [
  {
    key:   USER_TYPE_STUDENT,
    label: 'Student',
    sub:   'In college, PLC, or between/applying for study',
  },
  {
    key:   USER_TYPE_APPRENTICE,
    label: 'Apprentice',
    sub:   'On a registered apprenticeship',
  },
  {
    key:   USER_TYPE_GAP_YEAR,
    label: 'Gap Year',
    sub:   'Taking time between study or your next move',
  },
  {
    key:   USER_TYPE_WORKER,
    label: 'Worker (non-student)',
    sub:   'In employment and not currently studying',
  },
]

const VALID_KEYS = new Set(USER_TYPES.map(t => t.key))

export function isValidUserType(key) {
  return VALID_KEYS.has(key)
}

export function userTypeLabel(key) {
  return USER_TYPES.find(t => t.key === key)?.label || USER_TYPES[0].label
}

/**
 * Best-effort default for the four-way user_type based on the more granular
 * `situation` value collected during signup. Used only to pre-select a
 * sensible starting point — the signup step and Settings both let the
 * person override it explicitly.
 */
export function mapSituationToUserType(situation) {
  switch (situation) {
    case 'apprenticeship': return USER_TYPE_APPRENTICE
    case 'gap_year':       return USER_TYPE_GAP_YEAR
    case 'working':
    case 'recent_grad':
    case 'other':          return USER_TYPE_WORKER
    case 'in_college':
    case 'plc':
    case 'prospective':
    default:                return USER_TYPE_STUDENT
  }
}
