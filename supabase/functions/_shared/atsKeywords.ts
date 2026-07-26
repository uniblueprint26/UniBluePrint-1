// ATS keyword banks by field, gathered from published 2026 ATS/recruiter guidance
// (see the Foundation Blueprint research artifact for sourcing). Used for deterministic
// keyword-match scoring — never left to the model to self-grade.

export const ATS_KEYWORD_BANKS: Record<string, string[]> = {
  technology: [
    'python', 'javascript', 'typescript', 'java', 'react', 'node.js', 'aws', 'azure',
    'gcp', 'ci/cd', 'agile', 'scrum', 'git', 'docker', 'kubernetes', 'sql', 'rest api',
    'microservices', 'unit testing', 'debugging', 'cloud', 'devops',
  ],
  healthcare: [
    'ehr', 'emr', 'hipaa', 'patient care', 'telehealth', 'remote patient monitoring',
    'value-based care', 'clinical', 'nmbi', 'infection control', 'care plan',
    'multidisciplinary team', 'patient safety',
  ],
  engineering: [
    'cad', 'solidworks', 'autocad', 'catia', 'matlab', 'finite element analysis',
    'lean manufacturing', 'six sigma', 'quality assurance', 'process improvement',
    'gmp', 'leed', 'project engineering', 'root cause analysis',
  ],
  finance: [
    'financial modelling', 'excel', 'valuation', 'dcf', 'budgeting', 'forecasting',
    'reconciliation', 'ifrs', 'gaap', 'audit', 'risk management', 'compliance',
    'financial reporting', 'variance analysis',
  ],
  business: [
    'stakeholder management', 'project management', 'kpi', 'process improvement',
    'client relations', 'business development', 'market research', 'crm',
    'presentation', 'negotiation', 'cross-functional',
  ],
  law: [
    'legal research', 'drafting', 'due diligence', 'contract review', 'litigation',
    'compliance', 'regulatory', 'case management', 'legal writing',
  ],
  education: [
    'lesson planning', 'curriculum design', 'classroom management', 'differentiated instruction',
    'assessment', 'sen', 'behaviour management', 'student engagement',
  ],
  creative: [
    'adobe creative suite', 'figma', 'brand identity', 'portfolio', 'content creation',
    'copywriting', 'visual design', 'ux', 'ui', 'storytelling',
  ],
  general: [
    'communication', 'teamwork', 'leadership', 'problem solving', 'initiative',
    'time management', 'attention to detail', 'adaptability', 'collaboration',
  ],
}

export function bankForIndustry(industry: string | null | undefined): string[] {
  if (!industry) return ATS_KEYWORD_BANKS.general
  const key = industry.toLowerCase()
  const match = Object.keys(ATS_KEYWORD_BANKS).find(k => key.includes(k))
  return match ? [...ATS_KEYWORD_BANKS[match], ...ATS_KEYWORD_BANKS.general] : ATS_KEYWORD_BANKS.general
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
export function extractJdKeywords(jobDescription: string, industry: string | null | undefined): WeightedKeyword[] {
  const text = jobDescription.toLowerCase()
  const candidateBank = [...bankForIndustry(industry), ...Object.values(ATS_KEYWORD_BANKS).flat()]
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
