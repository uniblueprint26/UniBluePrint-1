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
  'Agriculture and Veterinary',
  'Beauty, Hairdressing and Aesthetics',
  'Real Estate and Property',
  'Aviation and Logistics',
  'Skilled Trades and Apprenticeships',
  'Insurance and Actuarial',
  'Retail and E-commerce',
  'Environmental Sustainability and Renewable Energy',
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
  audit: 'Finance and Accounting',
  // 'actuarial' moved to Insurance and Actuarial below — a dedicated bucket
  // now exists for it, and it fits there more accurately than folding into
  // general finance.

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
  // 'logistics' moved to Aviation and Logistics below — supply chain and
  // logistics specifically now have their own home rather than folding into
  // general business, which is the more accurate resolution for that term.

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

  // Agriculture and Veterinary
  agriculture: 'Agriculture and Veterinary',
  agri: 'Agriculture and Veterinary',
  farming: 'Agriculture and Veterinary',
  farm: 'Agriculture and Veterinary',
  agronomy: 'Agriculture and Veterinary',
  horticulture: 'Agriculture and Veterinary',
  veterinary: 'Agriculture and Veterinary',
  // Word-boundary — 'vet' is short enough to appear inside unrelated text.
  vet: 'Agriculture and Veterinary',

  // Beauty, Hairdressing and Aesthetics
  beauty: 'Beauty, Hairdressing and Aesthetics',
  hairdressing: 'Beauty, Hairdressing and Aesthetics',
  hairdresser: 'Beauty, Hairdressing and Aesthetics',
  barbering: 'Beauty, Hairdressing and Aesthetics',
  barber: 'Beauty, Hairdressing and Aesthetics',
  aesthetics: 'Beauty, Hairdressing and Aesthetics',
  aesthetician: 'Beauty, Hairdressing and Aesthetics',
  cosmetology: 'Beauty, Hairdressing and Aesthetics',
  makeup: 'Beauty, Hairdressing and Aesthetics',
  'make-up': 'Beauty, Hairdressing and Aesthetics',
  nails: 'Beauty, Hairdressing and Aesthetics',
  nail: 'Beauty, Hairdressing and Aesthetics',
  spa: 'Beauty, Hairdressing and Aesthetics',

  // Real Estate and Property
  'real estate': 'Real Estate and Property',
  property: 'Real Estate and Property',
  // Compound, so the longest-first sort keeps this out of Business and
  // Management — 'management' (10 chars) is longer than 'property' (8) and
  // would otherwise win.
  'property management': 'Real Estate and Property',
  auctioneering: 'Real Estate and Property',
  auctioneer: 'Real Estate and Property',
  'estate agent': 'Real Estate and Property',
  lettings: 'Real Estate and Property',
  valuation: 'Real Estate and Property',
  // 'surveying' is deliberately not claimed here — it already resolves to
  // Construction and Architecture (quantity/building surveying), and that is
  // the far more common meaning of the bare word in an Irish CAO/careers
  // context. Property valuation surveying still resolves correctly via
  // 'valuation' and 'property'.

  // Aviation and Logistics
  aviation: 'Aviation and Logistics',
  airline: 'Aviation and Logistics',
  pilot: 'Aviation and Logistics',
  'air traffic': 'Aviation and Logistics',
  'cabin crew': 'Aviation and Logistics',
  logistics: 'Aviation and Logistics',
  'supply chain': 'Aviation and Logistics',
  freight: 'Aviation and Logistics',
  warehousing: 'Aviation and Logistics',
  shipping: 'Aviation and Logistics',

  // Skilled Trades and Apprenticeships
  apprentice: 'Skilled Trades and Apprenticeships',
  apprenticeship: 'Skilled Trades and Apprenticeships',
  'craft apprentice': 'Skilled Trades and Apprenticeships',
  tradesperson: 'Skilled Trades and Apprenticeships',
  tradesman: 'Skilled Trades and Apprenticeships',
  electrician: 'Skilled Trades and Apprenticeships',
  plumber: 'Skilled Trades and Apprenticeships',
  plumbing: 'Skilled Trades and Apprenticeships',
  carpentry: 'Skilled Trades and Apprenticeships',
  carpenter: 'Skilled Trades and Apprenticeships',
  joinery: 'Skilled Trades and Apprenticeships',
  joiner: 'Skilled Trades and Apprenticeships',
  'motor mechanic': 'Skilled Trades and Apprenticeships',
  mechanic: 'Skilled Trades and Apprenticeships',
  bricklaying: 'Skilled Trades and Apprenticeships',
  bricklayer: 'Skilled Trades and Apprenticeships',
  stonelaying: 'Skilled Trades and Apprenticeships',
  pipefitting: 'Skilled Trades and Apprenticeships',
  welding: 'Skilled Trades and Apprenticeships',
  welder: 'Skilled Trades and Apprenticeships',
  toolmaking: 'Skilled Trades and Apprenticeships',
  toolmaker: 'Skilled Trades and Apprenticeships',
  refrigeration: 'Skilled Trades and Apprenticeships',
  'gas installer': 'Skilled Trades and Apprenticeships',
  'heating installer': 'Skilled Trades and Apprenticeships',
  // Deliberately not claiming bare 'electrical' or 'construction' here — those
  // already resolve to Engineering and Construction and Architecture
  // respectively, and remain the more common meaning of those bare words in a
  // CAO/careers context (an electrical engineering degree, not an electrician
  // apprenticeship). The specific trade names above still resolve correctly.

  // Insurance and Actuarial
  insurance: 'Insurance and Actuarial',
  actuarial: 'Insurance and Actuarial',
  actuary: 'Insurance and Actuarial',
  actuaries: 'Insurance and Actuarial',
  underwriting: 'Insurance and Actuarial',
  underwriter: 'Insurance and Actuarial',
  reinsurance: 'Insurance and Actuarial',
  'insurance broker': 'Insurance and Actuarial',
  'claims adjuster': 'Insurance and Actuarial',
  'loss adjusting': 'Insurance and Actuarial',
  // Deliberately not claiming bare 'broker' or 'claims' — both are genuinely
  // ambiguous with Finance (stockbroker) and Law (legal claims), and the
  // compounds above still resolve the insurance-specific meaning correctly.

  // Retail and E-commerce
  retail: 'Retail and E-commerce',
  retailer: 'Retail and E-commerce',
  ecommerce: 'Retail and E-commerce',
  'e-commerce': 'Retail and E-commerce',
  merchandising: 'Retail and E-commerce',
  merchandiser: 'Retail and E-commerce',
  'visual merchandising': 'Retail and E-commerce',
  'store management': 'Retail and E-commerce',
  'store manager': 'Retail and E-commerce',
  'retail buyer': 'Retail and E-commerce',
  'retail buying': 'Retail and E-commerce',
  // Deliberately not claiming bare 'shop', 'sales', or 'buying' — each is too
  // generic and appears inside or alongside unrelated fields ('workshop',
  // 'sales' in every industry, 'car buying'), so only the retail-specific
  // compounds above are claimed.

  // Environmental Sustainability and Renewable Energy
  sustainability: 'Environmental Sustainability and Renewable Energy',
  environmental: 'Environmental Sustainability and Renewable Energy',
  'renewable energy': 'Environmental Sustainability and Renewable Energy',
  renewables: 'Environmental Sustainability and Renewable Energy',
  'wind energy': 'Environmental Sustainability and Renewable Energy',
  'solar energy': 'Environmental Sustainability and Renewable Energy',
  'green building': 'Environmental Sustainability and Renewable Energy',
  'carbon footprint': 'Environmental Sustainability and Renewable Energy',
  'climate action': 'Environmental Sustainability and Renewable Energy',
  'net zero': 'Environmental Sustainability and Renewable Energy',
  // Word-boundary — short enough to appear inside unrelated text otherwise.
  esg: 'Environmental Sustainability and Renewable Energy',
  // Deliberately not touching 'environmental science' as a course/degree
  // name — that already resolves to Science and Research via
  // courseToIndustry.ts's own compound rule, which is the better fit for a
  // lab/research-based degree. Bare 'environmental' here is a different
  // resolution path (the free-text industry field, not a course name) and
  // was previously unclaimed, so adding it does not conflict.
}

/**
 * Aliases short enough to appear inside unrelated words. These are matched on
 * word boundaries instead of as bare substrings — 'it' must not fire on
 * "hospitality", and 'pr' must not fire on "primary".
 */
const WORD_BOUNDARY_ALIASES = new Set(['it', 'pe', 'pr', 'ai', 'hr', 'vet', 'tech', 'esg'])

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
