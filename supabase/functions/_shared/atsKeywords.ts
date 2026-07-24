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

// Naive but dependency-free keyword extraction from a pasted job description:
// pulls candidate terms from the known banks that literally appear in the JD text,
// plus any capitalised multi-word tool/platform-looking tokens. Deliberately
// conservative — false negatives are safer than inventing keywords that aren't there.
export function extractJdKeywords(jobDescription: string, industry: string | null | undefined): string[] {
  const text = jobDescription.toLowerCase()
  const candidateBank = [...bankForIndustry(industry), ...Object.values(ATS_KEYWORD_BANKS).flat()]
  const unique = Array.from(new Set(candidateBank))
  return unique.filter(term => text.includes(term.toLowerCase()))
}

export function scoreKeywordMatch(generatedText: string, keywords: string[]): { score: number; matched: string[]; missing: string[] } {
  if (keywords.length === 0) return { score: 0, matched: [], missing: [] }
  const text = generatedText.toLowerCase()
  const matched = keywords.filter(k => text.includes(k.toLowerCase()))
  const missing = keywords.filter(k => !matched.includes(k))
  const score = Math.round((matched.length / keywords.length) * 100)
  return { score, matched, missing }
}
