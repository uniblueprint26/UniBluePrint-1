/**
 * Canonical input length limits — backend copy.
 *
 * MIRRORED from src/lib/fieldLimits.js. The frontend uses `maxLength` for
 * immediate feedback; these checks are the ones that actually hold, because a
 * maxLength attribute is trivially bypassed by calling the function directly.
 * If you change a value here, change it there too.
 */
export const LIMITS = {
  SHORT: 200,
  MEDIUM: 500,
  LONG: 5000,
  PASTE_JD: 10000,
  PASTE_DOC: 20000,
} as const

/**
 * Returns an error string if any field exceeds its limit, else null.
 * Fields are given as [label, value, limit] so the message can name the
 * offending field rather than failing anonymously.
 */
export function checkLengths(
  fields: [label: string, value: unknown, limit: number][],
): string | null {
  for (const [label, value, limit] of fields) {
    if (typeof value === 'string' && value.length > limit) {
      return `${label} is too long — ${value.length.toLocaleString()} characters, limit is ${limit.toLocaleString()}.`
    }
  }
  return null
}

/** True when a required string is missing or only whitespace. */
export function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

/**
 * Returns an error naming the first blank required field, else null.
 * Replaces bare `!field` truthiness, which accepts "   " as valid.
 */
export function checkRequired(
  fields: [label: string, value: unknown][],
): string | null {
  const missing = fields.filter(([, v]) => isBlank(v)).map(([label]) => label)
  if (missing.length === 0) return null
  return missing.length === 1
    ? `${missing[0]} is required.`
    : `These fields are required: ${missing.join(', ')}.`
}
