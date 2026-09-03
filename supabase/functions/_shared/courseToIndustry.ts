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
  [['biomedical engineering', 'medical device'], 'Engineering'],
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
  [['biotechnology', 'genetics', 'biology', 'chemistry', 'physics',
    'biochemistry', 'microbiology', 'neuroscience', 'pharmacology'], 'Science and Research'],
  [['business', 'commerce', 'management', 'entrepreneurship',
    'international business', 'human resource'], 'Business and Management'],
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
