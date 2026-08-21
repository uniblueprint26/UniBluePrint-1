/**
 * The controlled industry vocabulary.
 *
 * Before this existed, industry was free text matched with a naive substring
 * scan against eight bank names, so anything that didn't happen to contain one
 * of them fell silently to `general` — and the student never knew their whole
 * industry layer had been skipped.
 *
 * ── On the matching algorithm ───────────────────────────────────────────────
 * Aliases are matched longest-key-first, and short keys are matched on word
 * boundaries. Both matter, and a plain `for (const k of Object.keys(map)) if
 * (input.includes(k))` gets them wrong:
 *
 *   'hospitality'  contains 'it'    -> would resolve to Technology
 *   'recruitment'  contains 'it'    -> would resolve to Technology
 *   'architecture' contains 'it'    -> would resolve to Technology
 *   'civil service' contains 'civil' -> would resolve to Engineering
 *
 * Longest-first fixes the compound cases ('civil service' beats 'civil',
 * 'social work' beats 'work', 'digital marketing' beats 'marketing'), and the
 * word-boundary rule for two-letter aliases fixes the rest.
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
] as const

export type Industry = typeof INDUSTRIES[number]

/** What a resolver returns when nothing matched. */
export const GENERAL = 'general' as const
export type ResolvedIndustry = Industry | typeof GENERAL

const ALIASES: Record<string, Industry> = {
  // Technology and Software
  tech: 'Technology and Software',
  technology: 'Technology and Software',
  software: 'Technology and Software',
  it: 'Technology and Software',
  computing: 'Technology and Software',
  computer: 'Technology and Software',
  developer: 'Technology and Software',
  'data science': 'Technology and Software',
  cybersecurity: 'Technology and Software',
  devops: 'Technology and Software',

  // Engineering
  engineering: 'Engineering',
  engineer: 'Engineering',
  mechanical: 'Engineering',
  electrical: 'Engineering',
  electronic: 'Engineering',
  manufacturing: 'Engineering',

  // Healthcare and Nursing
  health: 'Healthcare and Nursing',
  healthcare: 'Healthcare and Nursing',
  nursing: 'Healthcare and Nursing',
  nurse: 'Healthcare and Nursing',
  medical: 'Healthcare and Nursing',
  medicine: 'Healthcare and Nursing',
  pharmacy: 'Healthcare and Nursing',
  physio: 'Healthcare and Nursing',
  physiotherapy: 'Healthcare and Nursing',
  'occupational therapy': 'Healthcare and Nursing',
  'speech and language': 'Healthcare and Nursing',
  radiography: 'Healthcare and Nursing',
  midwifery: 'Healthcare and Nursing',
  dentistry: 'Healthcare and Nursing',

  // Finance and Accounting
  finance: 'Finance and Accounting',
  financial: 'Finance and Accounting',
  accounting: 'Finance and Accounting',
  accountancy: 'Finance and Accounting',
  accountant: 'Finance and Accounting',
  banking: 'Finance and Accounting',
  investment: 'Finance and Accounting',
  actuarial: 'Finance and Accounting',
  audit: 'Finance and Accounting',

  // Law
  law: 'Law',
  legal: 'Law',
  solicitor: 'Law',
  barrister: 'Law',

  // Education and Teaching
  education: 'Education and Teaching',
  teaching: 'Education and Teaching',
  teacher: 'Education and Teaching',
  montessori: 'Education and Teaching',
  'early childhood': 'Education and Teaching',

  // Business and Management
  business: 'Business and Management',
  management: 'Business and Management',
  commerce: 'Business and Management',
  entrepreneurship: 'Business and Management',
  consulting: 'Business and Management',
  'human resources': 'Business and Management',
  logistics: 'Business and Management',

  // Creative and Media
  creative: 'Creative and Media',
  media: 'Creative and Media',
  design: 'Creative and Media',
  film: 'Creative and Media',
  journalism: 'Creative and Media',
  animation: 'Creative and Media',
  photography: 'Creative and Media',
  music: 'Creative and Media',

  // Science and Research
  science: 'Science and Research',
  scientific: 'Science and Research',
  biology: 'Science and Research',
  chemistry: 'Science and Research',
  physics: 'Science and Research',
  research: 'Science and Research',
  biotechnology: 'Science and Research',
  laboratory: 'Science and Research',
  pharmaceutical: 'Science and Research',

  // Construction and Architecture
  construction: 'Construction and Architecture',
  architecture: 'Construction and Architecture',
  architect: 'Construction and Architecture',
  'quantity surveying': 'Construction and Architecture',
  'quantity surveyor': 'Construction and Architecture',
  surveying: 'Construction and Architecture',
  'building services': 'Construction and Architecture',

  // Hospitality and Tourism
  hospitality: 'Hospitality and Tourism',
  tourism: 'Hospitality and Tourism',
  hotel: 'Hospitality and Tourism',
  // Compound forms, so the longest-first sort keeps these out of Business and
  // Management — 'management' is longer than 'hotel' and would otherwise win.
  'hotel management': 'Hospitality and Tourism',
  'hospitality management': 'Hospitality and Tourism',
  'tourism management': 'Hospitality and Tourism',
  'restaurant management': 'Hospitality and Tourism',
  catering: 'Hospitality and Tourism',
  culinary: 'Hospitality and Tourism',
  chef: 'Hospitality and Tourism',

  // Public Sector and Civil Service
  'civil service': 'Public Sector and Civil Service',
  'public sector': 'Public Sector and Civil Service',
  'public service': 'Public Sector and Civil Service',
  government: 'Public Sector and Civil Service',
  garda: 'Public Sector and Civil Service',
  'local authority': 'Public Sector and Civil Service',
  'defence forces': 'Public Sector and Civil Service',

  // Social Work and Community
  'social work': 'Social Work and Community',
  'social care': 'Social Work and Community',
  'youth work': 'Social Work and Community',
  community: 'Social Work and Community',
  counselling: 'Social Work and Community',

  // Sports and Fitness
  sport: 'Sports and Fitness',
  sports: 'Sports and Fitness',
  fitness: 'Sports and Fitness',
  coaching: 'Sports and Fitness',
  // Stem, so it catches both "personal training" and "personal trainer".
  'personal train': 'Sports and Fitness',
  'strength and conditioning': 'Sports and Fitness',
  gym: 'Sports and Fitness',
  pe: 'Sports and Fitness',

  // Marketing and Communications
  marketing: 'Marketing and Communications',
  communications: 'Marketing and Communications',
  pr: 'Marketing and Communications',
  'public relations': 'Marketing and Communications',
  advertising: 'Marketing and Communications',
  branding: 'Marketing and Communications',
}

/**
 * Aliases short enough to appear inside unrelated words. These are matched on
 * word boundaries instead of as bare substrings — 'it' must not fire on
 * "hospitality", and 'pr' must not fire on "primary".
 */
const WORD_BOUNDARY_ALIASES = new Set(['it', 'pe', 'pr', 'ai', 'hr'])

/** Longest first, so compound aliases beat the shorter alias inside them. */
const SORTED_ALIASES: Array<[string, Industry]> = Object.entries(ALIASES)
  .sort((a, b) => b[0].length - a[0].length)

function matches(haystack: string, alias: string): boolean {
  if (WORD_BOUNDARY_ALIASES.has(alias)) {
    return new RegExp(`\\b${alias}\\b`, 'i').test(haystack)
  }
  return haystack.includes(alias)
}

/** Already one of the controlled values? Return it untouched. */
function exactIndustry(raw: string): Industry | null {
  const found = INDUSTRIES.find((i) => i.toLowerCase() === raw)
  return found ?? null
}

export function normaliseIndustry(raw: string | null | undefined): ResolvedIndustry {
  if (!raw) return GENERAL
  const lower = raw.toLowerCase().trim()
  if (!lower) return GENERAL

  const exact = exactIndustry(lower)
  if (exact) return exact

  for (const [alias, industry] of SORTED_ALIASES) {
    if (matches(lower, alias)) return industry
  }
  return GENERAL
}

/** True when a value is one of the controlled industries. */
export function isKnownIndustry(value: string | null | undefined): value is Industry {
  return !!value && (INDUSTRIES as readonly string[]).includes(value)
}
