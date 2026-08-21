/**
 * The controlled industry vocabulary, browser side.
 *
 * This is a deliberate mirror of supabase/functions/_shared/industries.ts. The
 * edge functions are Deno modules bundled separately and import each other by
 * `.ts` path, which Vite cannot resolve from src/ — so one list cannot serve
 * both runtimes without a build step neither side currently has.
 *
 * The two are kept honest by `npm run check:industries`, which fails if the
 * lists diverge. If you add an industry, add it in both files.
 *
 * Normalisation deliberately does NOT live here. The browser stores whichever
 * controlled value the student picked, or their free text if they chose
 * "Other"; resolving free text to the vocabulary happens server-side in the
 * generators, so there is exactly one implementation of that logic.
 */

export const INDUSTRIES = [
  'Technology and Software',
  'Engineering',
  'Healthcare and Nursing',
  'Finance and Accounting',
  'Law',
  'Education and Teaching',
  'Business and Management',
  'Creative and Media',
  'Science and Research',
  'Construction and Architecture',
  'Hospitality and Tourism',
  'Public Sector and Civil Service',
  'Social Work and Community',
  'Sports and Fitness',
  'Marketing and Communications',
]

/** True when a stored value is one of the controlled options. */
export const isKnownIndustry = (value) => INDUSTRIES.includes(value)
