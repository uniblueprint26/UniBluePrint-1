/**
 * Canonical input length limits, chosen by field purpose.
 *
 * MIRRORED in supabase/functions/_shared/fieldLimits.ts — the frontend enforces
 * these with `maxLength` for immediate feedback, and every edge function
 * re-checks them because a maxLength attribute is trivially bypassed. If you
 * change a value here, change it there too.
 */
export const LIMITS = {
  /** Names, emails, phones, locations, job titles, companies, institutions,
   *  courses, industries — single-line identity/target fields. */
  SHORT: 200,

  /** URLs, module names/codes, short descriptors, comma-separated skill lists. */
  MEDIUM: 500,

  /** The user's own narrative content: responsibilities, achievements,
   *  motivation, why-this-company, STAR story parts, application answers. */
  LONG: 5000,

  /** Pasted job description. Feeds extractJdKeywords, which scans the text once
   *  per known keyword — bounded input is what keeps that scan bounded. */
  PASTE_JD: 10000,

  /** A full pasted CV or cover letter being reviewed. Higher than PASTE_JD
   *  because this is the primary content of the request, not context for it —
   *  a dense two-page CV runs ~4k characters, so this is generous but finite. */
  PASTE_DOC: 20000,
}

/**
 * Returns an error string if any field exceeds its limit, else ''.
 * Fields are given as [label, value, limit].
 *
 * `maxLength` caps typing and clips an over-long paste, but it does not apply
 * to values set programmatically (autofill, extensions, restored form state),
 * and a clipped paste is silent. This runs on the paste-heavy fields before we
 * spend a generation on them so the user gets a named, visible reason.
 */
export function checkLengths(fields) {
  for (const [label, value, limit] of fields) {
    if (typeof value === 'string' && value.length > limit) {
      return `${label} is too long — ${value.length.toLocaleString()} characters, limit is ${limit.toLocaleString()}. Please shorten it and try again.`
    }
  }
  return ''
}
