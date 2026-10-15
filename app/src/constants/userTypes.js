/**
 * userTypes — the general "what kind of user is this" concept, shared
 * across the whole app.
 *
 * This is deliberately a small, coarse, five-way split — NOT the same thing
 * as SignUpScreen's more granular `situation` field (leaving_cert,
 * in_college, plc, apprenticeship, working, gap_year, recent_grad,
 * prospective, other), which drives institution/trade lookups and the
 * Directory profile line. `user_type` is the general-purpose value other
 * features key off: which Budgeting income categories to show, which copy
 * reads naturally on Home, and how Course Connect frames itself.
 *
 * Stored on profiles.user_type (see the 20260912090000_profiles_user_type_
 * default migration, extended by 20261015120000_profiles_user_type_leaving_
 * cert), default 'student'. Read/write it through useUserType() (see
 * hooks/useUserType.js) rather than querying the profiles table directly.
 *
 * LEAVING_CERT (added for 5th/6th-year secondary students): distinct from
 * STUDENT, which means "already at third level, PLC, or between/applying
 * for study" — LEAVING_CERT is specifically for someone still in secondary
 * school, pre-CAO-offer, who hasn't started a course yet. This matters
 * concretely: they have no SUSI grant (not in college yet), their real
 * income sources are part-time work/allowance rather than a grant, and the
 * app's course-choice and personal-statement tooling is literally built for
 * them rather than being a nice-to-have.
 */

export const USER_TYPE_STUDENT      = 'student'
export const USER_TYPE_APPRENTICE   = 'apprentice'
export const USER_TYPE_GAP_YEAR     = 'gap_year'
export const USER_TYPE_WORKER       = 'worker'
export const USER_TYPE_LEAVING_CERT = 'leaving_cert'

export const DEFAULT_USER_TYPE = USER_TYPE_STUDENT

export const USER_TYPES = [
  {
    key:   USER_TYPE_LEAVING_CERT,
    label: '5th/6th Year (Leaving Cert)',
    sub:   'Still in secondary school, preparing for the Leaving Cert and CAO',
  },
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
 * Best-effort default for the five-way user_type based on the more granular
 * `situation` value collected during signup. Used only to pre-select a
 * sensible starting point — the signup step and Settings both let the
 * person override it explicitly.
 */
export function mapSituationToUserType(situation) {
  switch (situation) {
    case 'leaving_cert':   return USER_TYPE_LEAVING_CERT
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
