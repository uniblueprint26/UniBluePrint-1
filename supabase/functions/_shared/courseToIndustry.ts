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
  // actuarial degree is a finance pathway, not a research-science one.
  [['actuarial science', 'actuarial'], 'Finance and Accounting'],
  [['sports science', 'sport science', 'exercise science', 'sports management',
    'physical education', 'sports coaching', 'athletic therapy'], 'Sports and Fitness'],
  [['social science', 'social work', 'applied social studies', 'social care',
    'youth and community', 'community development', 'counselling'], 'Social Work and Community'],
  [['culinary arts', 'hospitality management', 'hotel management', 'tourism management',
    'bar management', 'event management'], 'Hospitality and Tourism'],
  [['biomedical engineering', 'medical device'], 'Engineering'],
  [['business and law', 'law and business', 'commercial law'], 'Law'],
  [['environmental science', 'marine science', 'food science', 'agricultural science',
    'sport and exercise'], 'Science and Research'],
  [['construction management', 'quantity surveying', 'building surveying',
    'construction economics', 'civil engineering and construction'], 'Construction and Architecture'],
  [['early childhood', 'primary education', 'physical education and',
    'professional master of education'], 'Education and Teaching'],
  [['digital marketing', 'public relations'], 'Marketing and Communications'],

  // ── discipline-specific ─────────────────────────────────────────────────
  [['software', 'information technology', 'cybersecurity', 'computer',
    'machine learning', 'artificial intelligence', 'games development',
    'network', 'informatics'], 'Technology and Software'],
  [['civil engineering', 'mechanical engineering', 'electrical engineering',
    'electronic engineering', 'structural engineering', 'chemical engineering',
    'manufacturing engineering', 'engineering'], 'Engineering'],
  [['nursing', 'midwifery', 'medicine', 'pharmacy', 'physiotherapy',
    'occupational therapy', 'speech and language', 'radiography', 'dentistry',
    'paramedic', 'dietetics', 'podiatry', 'optometry', 'veterinary'], 'Healthcare and Nursing'],
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
    'international business', 'human resource', 'supply chain'], 'Business and Management'],
  [['hospitality', 'tourism', 'culinary'], 'Hospitality and Tourism'],
  [['sport', 'fitness'], 'Sports and Fitness'],
  [['public administration', 'public policy', 'government', 'politics'], 'Public Sector and Civil Service'],

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
