import type { Industry } from './industries.ts'

/**
 * Infers a likely industry from what the student is actually studying, for the
 * case where they filled in a course but never set a target industry.
 *
 * ── On ordering ─────────────────────────────────────────────────────────────
 * Course names overlap heavily, so the order these rules are tested in decides
 * the answer. Specific compounds are tested before the generic word they
 * contain, because a first-match-wins scan over a generic-first list gets real
 * Irish CAO courses wrong:
 *
 *   'Sports Science'         -> 'science' before 'sport'  = Science, not Sports
 *   'Culinary Arts'          -> 'arts' before 'culinary'  = Creative, not Hospitality
 *   'Computer Science'       -> 'science' before 'computer' = Science, not Technology
 *   'Social Science'         -> 'science' before 'social' = Science, not Social Work
 *   'Business and Law'       -> 'business' before 'law'   = Business, not Law
 *   'Biomedical Engineering' -> 'medical' before 'engineering' = Healthcare, not Engineering
 *
 * Hence: compounds first, bare generics last. `arts` is deliberately excluded
 * as a standalone keyword — "Bachelor of Arts" is the most common degree title
 * in the country and says nothing about industry.
 */

type Rule = [keywords: string[], industry: Industry]

const COURSE_RULES: Rule[] = [
  // ── compounds that would otherwise be captured by a generic below ────────
  [['computer science', 'computing science', 'data science'], 'Technology and Software'],
  // Listed here so it beats the bare 'science' rule at the bottom — an
  // actuarial degree is its own pathway (Insurance and Actuarial), not a
  // research-science one and, since a dedicated bucket now exists, not a
  // general finance one either.
  [['actuarial science', 'actuarial studies', 'actuarial'], 'Insurance and Actuarial'],
  [['sports science', 'sport science', 'exercise science', 'sports management',
    'physical education', 'sports coaching', 'athletic therapy'], 'Sports and Fitness'],
  [['social science', 'social work', 'applied social studies', 'social care',
    'youth and community', 'community development', 'counselling'], 'Social Work and Community'],
  [['culinary arts', 'hospitality management', 'hotel management', 'tourism management',
    'bar management', 'event management'], 'Hospitality and Tourism'],
  [['biomedical engineering'], 'Engineering'],
  // Pharma/biotech/medtech compounds, tested before both the bare 'science'
  // rule at the bottom and Science and Research's own discipline rule below
  // (which used to claim 'biotechnology') — a dedicated industry now exists
  // for these. 'medical device(s)' is split out of the 'biomedical
  // engineering' rule above: a biomedical engineering degree is still
  // Engineering, but a medical devices degree/role is this industry's own
  // manufacturing/regulatory pathway, not general engineering.
  [['pharmaceutical science', 'biopharmaceutical science', 'biopharmaceutical chemistry',
    'biopharmaceutical engineering', 'pharmaceutical engineering', 'pharmaceutical technology',
    'biotechnology', 'medical device', 'medical devices', 'industrial biosciences'],
    'Pharmaceuticals, Biotechnology and Medical Devices'],
  [['business and law', 'law and business', 'commercial law'], 'Law'],
  [['environmental science', 'marine science', 'food science',
    'sport and exercise'], 'Science and Research'],
  [['construction management', 'quantity surveying', 'building surveying',
    'construction economics', 'civil engineering and construction'], 'Construction and Architecture'],
  [['early childhood', 'primary education', 'physical education and',
    'professional master of education'], 'Education and Teaching'],
  [['digital marketing', 'public relations'], 'Marketing and Communications'],
  // 'agricultural science' moved here from the Science and Research compound
  // rule below it used to sit in — a dedicated Agriculture and Veterinary
  // bucket now exists, and is the better fit for what is fundamentally an
  // agriculture degree, not a general lab-science one.
  [['veterinary nursing', 'veterinary medicine', 'veterinary science',
    'agricultural science', 'animal science', 'equine science', 'farm management'],
    'Agriculture and Veterinary'],
  [['supply chain management', 'logistics and supply chain',
    'aviation management', 'air transport'], 'Aviation and Logistics'],
  [['hair and beauty', 'hairdressing and barbering', 'beauty therapy'],
    'Beauty, Hairdressing and Aesthetics'],
  // Compounds beat Engineering's bare 'engineering' rule below — a renewable
  // or sustainable energy degree is its own pathway, not general engineering.
  [['renewable energy', 'sustainable energy', 'sustainability studies',
    'environmental sustainability', 'green technology'],
    'Environmental Sustainability and Renewable Energy'],
  // Compounds beat Creative and Media's bare 'fashion' rule below — a retail
  // buying/merchandising degree is a retail pathway, not a design one.
  [['retail management', 'retail and services management',
    'buying and merchandising', 'fashion buying'], 'Retail and E-commerce'],
  // Beats Social Work and Community's bare 'psychology' rule below —
  // organisational/occupational psychology is a workplace-facing HR pathway,
  // not a clinical or community one.
  [['human resource management', 'human resources', 'human resource',
    'hr management', 'people management', 'organisational psychology',
    'occupational psychology'], 'Human Resources and People Operations'],
  // 'food science' deliberately stays with Science and Research below (the
  // same call as 'environmental science') — these compounds are the
  // manufacturing/production-facing pathway, a genuinely different degree.
  [['food technology', 'food production', 'food and beverage manufacturing',
    'brewing and distilling', 'food business'], 'Food and Beverage Manufacturing'],
  [['international development', 'humanitarian studies',
    'nonprofit management', 'non-profit management', 'charity management',
    'development studies'], 'Non-Profit and NGO Management'],
  // Beats Engineering's bare 'engineering' rule below — a telecoms degree is
  // its own pathway, not general engineering.
  [['telecommunications engineering', 'telecommunications',
    'utility management'], 'Telecommunications and Utilities'],
  // Pre-existing bug, found while testing the rules above rather than caused
  // by them: Technology and Software's discipline rule below tests bare
  // 'computer' and is listed BEFORE Engineering's, so "Computer Engineering"
  // and "Electronic and Computer Engineering" — real DCU/Trinity degree
  // titles, and genuinely engineering degrees — were resolving to Technology
  // and Software instead. Fixed the same way as every other compound-before-
  // generic case in this file: catch the compound here, before either
  // discipline rule gets a chance to fire on the bare word it contains.
  [['computer engineering', 'electronic and computer engineering'], 'Engineering'],
  // Sound/audio engineering degrees and courses are Creative and Media
  // roles, not the chartered/professional sense of "engineering" the bare
  // Engineering rule below is meant to catch.
  [['sound engineering', 'audio engineering'], 'Creative and Media'],
  // Named "new apprenticeships" (Apprenticeship Council-approved since 2016,
  // well outside the craft trades) that would otherwise be caught by the
  // bare 'apprenticeship' rule below, whose content (SOLAS phases, RECI,
  // RGII) is specifically about the craft/statutory-registration kind —
  // see the matching note in industries.ts for why this isn't a full
  // enumeration of all such programmes.
  [['accounting technician'], 'Finance and Accounting'],
  [['insurance practice', 'insurance practitioner'], 'Insurance and Actuarial'],
  [['commis chef'], 'Hospitality and Tourism'],
  [['retail supervisor', 'retail apprenticeship'], 'Retail and E-commerce'],

  // ── discipline-specific ─────────────────────────────────────────────────
  [['software', 'information technology', 'cybersecurity', 'computer',
    'machine learning', 'artificial intelligence', 'games development',
    'network', 'informatics'], 'Technology and Software'],
  [['civil engineering', 'mechanical engineering', 'electrical engineering',
    'electronic engineering', 'structural engineering', 'chemical engineering',
    'manufacturing engineering', 'engineering'], 'Engineering'],
  [['nursing', 'midwifery', 'medicine', 'pharmacy', 'physiotherapy',
    'occupational therapy', 'speech and language', 'radiography', 'dentistry',
    'paramedic', 'dietetics', 'podiatry', 'optometry'], 'Healthcare and Nursing'],
  // 'veterinary' moved to its own industry below — it used to fall in here,
  // which was the closest available bucket before Agriculture and Veterinary
  // existed as an option.
  [['veterinary', 'agriculture', 'agronomy', 'horticulture', 'forestry', 'equine'],
    'Agriculture and Veterinary'],
  [['accounting', 'accountancy', 'finance', 'financial mathematics', 'banking',
    'economics and finance'], 'Finance and Accounting'],
  [['law', 'legal science', 'criminology'], 'Law'],
  [['education', 'teaching', 'b.ed', 'bed '], 'Education and Teaching'],
  [['architecture', 'interior architecture'], 'Construction and Architecture'],
  [['psychology'], 'Social Work and Community'],
  [['marketing', 'communications', 'journalism'], 'Marketing and Communications'],
  [['graphic design', 'fine art', 'fashion', 'animation', 'film', 'music',
    'drama', 'creative', 'media', 'design', 'photography', 'visual'], 'Creative and Media'],
  // 'biotechnology' moved to the dedicated compound rule above — a dedicated
  // Pharmaceuticals, Biotechnology and Medical Devices industry now exists
  // for it, the same "vacate the superseded generic bucket" move used
  // throughout this file.
  [['genetics', 'biology', 'chemistry', 'physics',
    'biochemistry', 'microbiology', 'neuroscience', 'pharmacology'], 'Science and Research'],
  // 'human resource' moved to its own compound rule above — it used to fall
  // in here, the closest available bucket before a dedicated HR industry
  // existed.
  [['business', 'commerce', 'management', 'entrepreneurship',
    'international business'], 'Business and Management'],
  [['hospitality', 'tourism', 'culinary'], 'Hospitality and Tourism'],
  [['sport', 'fitness'], 'Sports and Fitness'],
  [['public administration', 'public policy', 'government', 'politics'], 'Public Sector and Civil Service'],
  [['hairdressing', 'barbering', 'beauty', 'cosmetology', 'aesthetics'],
    'Beauty, Hairdressing and Aesthetics'],
  [['real estate', 'property', 'auctioneering', 'valuation'], 'Real Estate and Property'],
  [['aviation', 'logistics', 'supply chain', 'freight', 'air transport'], 'Aviation and Logistics'],
  [['apprenticeship', 'electrician', 'plumbing', 'carpentry', 'joinery',
    'motor mechanics', 'bricklaying', 'welding', 'toolmaking', 'refrigeration',
    'pipefitting'], 'Skilled Trades and Apprenticeships'],
  [['insurance', 'actuary'], 'Insurance and Actuarial'],
  [['retail', 'merchandising', 'e-commerce', 'ecommerce'], 'Retail and E-commerce'],
  [['sustainability', 'renewable energy'], 'Environmental Sustainability and Renewable Energy'],
  [['human resources', 'recruitment', 'talent acquisition', 'employee relations'],
    'Human Resources and People Operations'],
  [['food manufacturing', 'brewing', 'distilling', 'food processing'],
    'Food and Beverage Manufacturing'],
  [['charity', 'humanitarian', 'fundraising', 'voluntary sector'],
    'Non-Profit and NGO Management'],
  [['telecoms', 'telecommunications', 'utilities', 'broadband'],
    'Telecommunications and Utilities'],

  // ── bare generic, tested last ───────────────────────────────────────────
  [['science'], 'Science and Research'],
]

export function inferIndustryFromCourse(course: string | null | undefined): Industry | null {
  if (!course) return null
  const lower = course.toLowerCase().trim()
  if (!lower) return null

  for (const [keywords, industry] of COURSE_RULES) {
    if (keywords.some((k) => lower.includes(k))) return industry
  }
  return null
}
