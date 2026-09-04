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
  'Human Resources and People Operations',
  'Food and Beverage Manufacturing',
  'Non-Profit and NGO Management',
  'Telecommunications and Utilities',
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
  // Compound — Accounting Technician is one of the real "new apprenticeships"
  // (Apprenticeship Council-approved since 2016) Ireland now runs well
  // outside the craft trades; explicit so it doesn't depend on a length tie
  // against 'apprentice' (10 chars each) resolving the right way by luck.
  'accounting technician': 'Finance and Accounting',
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
  // 'human resources' moved to Human Resources and People Operations below —
  // a dedicated bucket now exists for it, the same "vacate the superseded
  // generic bucket" move as actuarial/veterinary/supply chain earlier.
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
  // Compounds, so the longest-first sort keeps these out of Engineering —
  // 'engineer' is shorter and would otherwise win. Sound/audio engineers are
  // real, common titles in this field, not the chartered/professional sense
  // of "engineer" the bare alias is meant to catch.
  'sound engineer': 'Creative and Media',
  'audio engineer': 'Creative and Media',

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
  // Commis Chef is one of the real "new apprenticeships" in hospitality —
  // without this compound, 'apprentice'/'apprenticeship' (10 chars) beats
  // bare 'chef' (4 chars) and misroutes it to Skilled Trades.
  'commis chef': 'Hospitality and Tourism',

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
  // Bare 'apprentice'/'apprenticeship' default here because craft trades are
  // still the large majority of apprentices in Ireland — but since 2016 the
  // state has also run genuine "new apprenticeships" well outside the
  // trades (Accounting Technician, Insurance Practice, Commis Chef, Retail
  // Supervisor, and dozens more, up to 87 programmes as of 2026), and this
  // industry's own content (SOLAS phases, RECI/Safe Electric, RGII) is
  // specifically about the craft/statutory-registration kind, not those.
  // The named, verified programmes above get their own explicit compound so
  // they aren't silently misrouted here — a full enumeration of all 87
  // programmes is out of scope; these are the well-known, high-profile ones.
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
  // Insurance Practice is a real, named "new apprenticeship" (an Earn and
  // Learn Insurance Practitioner programme leading to a BA Hons) — without
  // this compound, 'apprentice'/'apprenticeship' (10 chars) beats bare
  // 'insurance' (9 chars) and misroutes it to Skilled Trades.
  'insurance practice': 'Insurance and Actuarial',
  'insurance practitioner': 'Insurance and Actuarial',
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
  // Retail Supervisor is a real, popular "new apprenticeship" in this
  // field — without this compound, 'apprentice'/'apprenticeship' (10 chars)
  // beats bare 'retail' (6 chars) and misroutes it to Skilled Trades.
  'retail supervisor': 'Retail and E-commerce',
  'retail apprenticeship': 'Retail and E-commerce',
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

  // Human Resources and People Operations
  'human resources': 'Human Resources and People Operations',
  // Word-boundary — already registered below; two letters, appears inside
  // unrelated words otherwise (e.g. "shrink").
  hr: 'Human Resources and People Operations',
  'people operations': 'Human Resources and People Operations',
  'talent acquisition': 'Human Resources and People Operations',
  'talent management': 'Human Resources and People Operations',
  recruitment: 'Human Resources and People Operations',
  'employee relations': 'Human Resources and People Operations',
  'organisational development': 'Human Resources and People Operations',
  'organizational development': 'Human Resources and People Operations',
  'people and culture': 'Human Resources and People Operations',

  // Food and Beverage Manufacturing
  'food manufacturing': 'Food and Beverage Manufacturing',
  'food production': 'Food and Beverage Manufacturing',
  'food processing': 'Food and Beverage Manufacturing',
  'beverage manufacturing': 'Food and Beverage Manufacturing',
  'food technology': 'Food and Beverage Manufacturing',
  brewing: 'Food and Beverage Manufacturing',
  distilling: 'Food and Beverage Manufacturing',
  'food safety': 'Food and Beverage Manufacturing',
  // Deliberately not claiming bare 'manufacturing' — it already resolves to
  // Engineering (manufacturing engineering), and that remains the more
  // common meaning of the bare word. Deliberately not claiming bare 'food'
  // either — too ambiguous with Hospitality and Tourism's food-service
  // meaning. The compounds above still resolve the manufacturing-specific
  // meaning correctly.

  // Non-Profit and NGO Management
  charity: 'Non-Profit and NGO Management',
  charities: 'Non-Profit and NGO Management',
  'non-profit': 'Non-Profit and NGO Management',
  nonprofit: 'Non-Profit and NGO Management',
  'not-for-profit': 'Non-Profit and NGO Management',
  'international development': 'Non-Profit and NGO Management',
  humanitarian: 'Non-Profit and NGO Management',
  fundraising: 'Non-Profit and NGO Management',
  'voluntary sector': 'Non-Profit and NGO Management',
  'third sector': 'Non-Profit and NGO Management',
  // Word-boundary — 'ngo' is short enough to appear inside unrelated words
  // ("flamingo", "mango", "tango", "bingo", "Django").
  ngo: 'Non-Profit and NGO Management',

  // Telecommunications and Utilities
  telecommunications: 'Telecommunications and Utilities',
  telecoms: 'Telecommunications and Utilities',
  telecom: 'Telecommunications and Utilities',
  utilities: 'Telecommunications and Utilities',
  'gas network': 'Telecommunications and Utilities',
  'electricity network': 'Telecommunications and Utilities',
  broadband: 'Telecommunications and Utilities',
  // Compounds, so the longest-first sort keeps these out of Engineering —
  // 'engineer'/'engineering' (8-11 chars) is shorter than these and would
  // otherwise win for e.g. "telecoms engineer".
  'telecoms engineer': 'Telecommunications and Utilities',
  'telecommunications engineer': 'Telecommunications and Utilities',
  // Deliberately not claiming bare 'utility' or 'network' — both are common
  // generic words used well outside this industry (a software utility, a
  // computer network), and the compounds above still resolve the
  // utilities-specific meaning correctly.
}

/**
 * Aliases short enough to appear inside unrelated words. These are matched on
 * word boundaries instead of as bare substrings — 'it' must not fire on
 * "hospitality", and 'pr' must not fire on "primary".
 */
const WORD_BOUNDARY_ALIASES = new Set(['it', 'pe', 'pr', 'ai', 'hr', 'vet', 'tech', 'esg', 'ngo'])

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
