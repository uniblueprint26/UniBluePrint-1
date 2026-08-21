// ATS keyword banks by field, gathered from published 2026 ATS/recruiter guidance
// (see the Foundation Blueprint research artifact for sourcing). Used for deterministic
// keyword-match scoring — never left to the model to self-grade.
//
// Keyed by the controlled INDUSTRIES vocabulary. Previously these were keyed by
// eight loose names matched with a substring scan, which silently sent anything
// unrecognised to `general` — and mis-keyed real inputs along the way
// ('hospitality' contains 'it', so it resolved to technology).

import { GENERAL, type Industry, type ResolvedIndustry } from './industries.ts'

export const ATS_KEYWORD_BANKS: Record<Industry | typeof GENERAL, string[]> = {
  'Technology and Software': [
    'python', 'javascript', 'typescript', 'java', 'react', 'node.js', 'aws', 'azure',
    'gcp', 'ci/cd', 'agile', 'scrum', 'git', 'docker', 'kubernetes', 'sql', 'rest api',
    'microservices', 'unit testing', 'debugging', 'cloud', 'devops',
  ],
  'Healthcare and Nursing': [
    'ehr', 'emr', 'patient care', 'telehealth', 'remote patient monitoring',
    'value-based care', 'clinical', 'nmbi', 'coru', 'infection control', 'care plan',
    'multidisciplinary team', 'patient safety', 'clinical placement', 'safeguarding',
    'manual handling', 'basic life support',
  ],
  Engineering: [
    'cad', 'solidworks', 'autocad', 'catia', 'matlab', 'revit', 'civil 3d',
    'finite element analysis', 'lean manufacturing', 'six sigma', 'quality assurance',
    'process improvement', 'gmp', 'leed', 'project engineering', 'root cause analysis',
    'engineers ireland', 'chartered engineer',
  ],
  'Finance and Accounting': [
    'financial modelling', 'excel', 'valuation', 'dcf', 'budgeting', 'forecasting',
    'reconciliation', 'ifrs', 'gaap', 'audit', 'risk management', 'compliance',
    'financial reporting', 'variance analysis', 'aca', 'acca', 'cima',
  ],
  'Business and Management': [
    'stakeholder management', 'project management', 'kpi', 'process improvement',
    'client relations', 'business development', 'market research', 'crm',
    'presentation', 'negotiation', 'cross-functional', 'commercial awareness',
    'power bi', 'tableau',
  ],
  Law: [
    'legal research', 'drafting', 'due diligence', 'contract review', 'litigation',
    'compliance', 'regulatory', 'case management', 'legal writing', 'fe-1', 'ppc',
    'training contract',
  ],
  'Education and Teaching': [
    'lesson planning', 'curriculum design', 'classroom management', 'differentiated instruction',
    'assessment', 'sen', 'behaviour management', 'student engagement', 'teaching council',
    'garda vetting', 'school placement', 'droichead',
  ],
  'Creative and Media': [
    'adobe creative suite', 'figma', 'brand identity', 'portfolio', 'content creation',
    'copywriting', 'visual design', 'ux', 'ui', 'storytelling', 'after effects',
    'premiere pro', 'davinci resolve',
  ],
  'Science and Research': [
    'pcr', 'elisa', 'western blot', 'chromatography', 'cell culture', 'assay development',
    'bioinformatics', 'spss', 'graphpad', 'gmp', 'glp', 'data analysis', 'statistical analysis',
    'literature review', 'regulatory affairs', 'validation',
  ],
  'Construction and Architecture': [
    'revit', 'archicad', 'autocad', 'bim', 'safe pass', 'quantity surveying',
    'cost planning', 'tendering', 'site management', 'building regulations',
    'planning permission', 'riai', 'scsi', 'snagging',
  ],
  'Hospitality and Tourism': [
    'haccp', 'food safety', 'front of house', 'covers', 'guest experience', 'occupancy',
    'revenue per available room', 'opera pms', 'micros', 'upselling', 'rostering',
    'stock control', 'customer service',
  ],
  'Public Sector and Civil Service': [
    'delivery of results', 'interpersonal and communication skills',
    'specialist knowledge', 'drive and commitment to public service values',
    'analysis and decision making', 'competency framework', 'public appointments service',
    'stakeholder engagement', 'policy', 'freedom of information', 'gdpr',
  ],
  'Social Work and Community': [
    'coru', 'garda vetting', 'safeguarding', 'child protection', 'children first',
    'person-centred', 'anti-discriminatory practice', 'reflective practice',
    'case management', 'risk assessment', 'advocacy', 'multidisciplinary team',
  ],
  'Sports and Fitness': [
    'strength and conditioning', 'personal training', 'ncef', 'first aid', 'cpr',
    'programme design', 'periodisation', 'injury prevention', 'movement screening',
    'client retention', 'coaching qualification', 'safeguarding in sport',
  ],
  'Marketing and Communications': [
    'google analytics', 'ga4', 'seo', 'sem', 'meta ads manager', 'hubspot', 'mailchimp',
    'content strategy', 'campaign management', 'social media', 'copywriting',
    'engagement rate', 'conversion rate', 'press release', 'media relations',
  ],
  general: [
    'communication', 'teamwork', 'leadership', 'problem solving', 'initiative',
    'time management', 'attention to detail', 'adaptability', 'collaboration',
  ],
}

/**
 * Keyword bank for an industry that has already been through the controlled
 * vocabulary. Always returns the general bank alongside the specific one —
 * transferable terms matter in every field.
 *
 * There is deliberately no free-text variant any more. Callers resolve the
 * industry once, via resolveIndustryContext, so that the resolution (and which
 * of stated/inferred/fallback produced it) is decided in one place and reported
 * to the Handler, rather than being re-derived silently here.
 */
export function bankForResolvedIndustry(industry: ResolvedIndustry): string[] {
  if (industry === GENERAL) return ATS_KEYWORD_BANKS.general
  return [...ATS_KEYWORD_BANKS[industry], ...ATS_KEYWORD_BANKS.general]
}

export interface WeightedKeyword {
  term: string
  weight: number
}

// Naive but dependency-free keyword extraction from a pasted job description:
// pulls candidate terms from the known banks that literally appear in the JD text.
// Weighted by how many times each term actually appears in the JD — real 2026
// ATS/tailoring guidance treats a term repeated five times in a posting as a
// stronger signal than one mentioned once, and frequency is the one part of
// that signal a simple text search can measure honestly (semantic relevance,
// the other half of how modern ATS score, isn't something a keyword-count
// function can claim to do — that's left to the model's own judgement, not
// faked here). Weight is capped so one very-repeated term can't dominate the
// whole score. Deliberately conservative on extraction — false negatives are
// safer than inventing keywords that aren't there.
export function extractJdKeywords(jobDescription: string, industry: ResolvedIndustry): WeightedKeyword[] {
  const text = jobDescription.toLowerCase()
  const candidateBank = [...bankForResolvedIndustry(industry), ...Object.values(ATS_KEYWORD_BANKS).flat()]
  const unique = Array.from(new Set(candidateBank))
  return unique
    .map(term => ({ term, count: countOccurrences(text, term.toLowerCase()) }))
    .filter(({ count }) => count > 0)
    .map(({ term, count }) => ({ term, weight: Math.min(count, 5) }))
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let pos = haystack.indexOf(needle)
  while (pos !== -1) {
    count++
    pos = haystack.indexOf(needle, pos + needle.length)
  }
  return count
}

export function scoreKeywordMatch(
  generatedText: string,
  keywords: WeightedKeyword[] | string[],
): { score: number; matched: string[]; missing: string[] } {
  const weighted: WeightedKeyword[] = keywords.length > 0 && typeof keywords[0] === 'string'
    ? (keywords as string[]).map(term => ({ term, weight: 1 }))
    : (keywords as WeightedKeyword[])

  if (weighted.length === 0) return { score: 0, matched: [], missing: [] }
  const text = generatedText.toLowerCase()
  const matchedKw = weighted.filter(k => text.includes(k.term.toLowerCase()))
  const missingKw = weighted.filter(k => !matchedKw.includes(k)).sort((a, b) => b.weight - a.weight)
  const totalWeight = weighted.reduce((s, k) => s + k.weight, 0)
  const matchedWeight = matchedKw.reduce((s, k) => s + k.weight, 0)
  const score = Math.round((matchedWeight / totalWeight) * 100)
  return { score, matched: matchedKw.map(k => k.term), missing: missingKw.map(k => k.term) }
}
