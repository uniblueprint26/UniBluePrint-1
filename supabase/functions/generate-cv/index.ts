import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { bankForIndustry, extractJdKeywords, scoreKeywordMatch } from '../_shared/atsKeywords.ts'
import { fetchIndustryExamples, fetchIndustryIntelligence } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import {
  ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE,
  buzzwordRule, realExamplesRule, HANDLER_NOTES_DESCRIPTION,
} from '../_shared/coreRules.ts'
import { computeFormattingScore } from '../_shared/atsFormat.ts'
import { LIMITS, checkLengths, checkRequired, isBlank } from '../_shared/fieldLimits.ts'
import {
  fetchProfileContext, mergeWithProfile, profileNarrative, PROFILE_CONTEXT_RULE,
} from '../_shared/careerProfile.ts'

const SYSTEM_PROMPT = `You are an expert CV writer combining the judgement of an experienced recruiter, a university careers advisor, and an ATS optimisation specialist. You write CVs for Irish and UK students, apprentices, and young professionals.

METHOD — every experience, project, or achievement bullet follows the Harvard Careers Services formula:
  action verb + what you did + quantified result + why it mattered
Write phrases, not full sentences. Never start a bullet with "I" or use personal pronouns.

${ANTI_HALLUCINATION_RULE}

${PROFILE_CONTEXT_RULE}

${buzzwordRule()}

NO WORK EXPERIENCE FALLBACK — if has_no_experience is true, do NOT write an empty or padded Experience section. Restructure the CV to lead with Education (including relevant modules and achievements), then Projects, then Skills, then any Achievements & Extras (societies, volunteering, publications). This is a completely different, equally strong structure for first-years and students entering the workforce for the first time — not a lesser version of the standard CV.

${NON_TRADITIONAL_EVIDENCE_RULE}

TARGETING — if target_role, target_industry, target_company, or job_description are provided, tailor language and emphasis toward them, and naturally work in relevant terminology for that field without keyword-stuffing. If they are blank, produce a strong general-purpose CV for the stated industry only.

TONE & LENGTH — respect the user's stated tone (formal / balanced / modern) and length preference (one page / two page) by how much you include and how you phrase it — formal is more conservative and traditional in phrasing, modern allows slightly more personality while staying professional.

Never produce anything a recruiter would immediately flag as "obviously AI" — generic, interchangeable phrasing. Every output must sound like it was written by someone who actually knows this specific person's background.

${realExamplesRule("a small set of real, published, sourced CV bullet examples from this person's industry")}

INDUSTRY INTELLIGENCE — you may also be given industry_intelligence: real findings on how THIS specific industry actually screens candidates, sourced from that industry's own recruiters, professional bodies, or hiring communities.
  - red_flag entries are things you must actively AVOID — if a red_flag names specific words or patterns (e.g. certain buzzwords, or listing basic tools as skills), do not let them appear anywhere in the output.
  - must_have / real_entity entries name real credentials, exams, or qualifying bodies for this field — if the user's own input indicates they have one of these (e.g. they mention FE-1 exams for law, or a Critical Skills Employment Permit for tech), reference it correctly and precisely; never invent that the user holds a credential they didn't tell you about.
  - wording_convention entries describe how this field actually expects a CV to read (e.g. clauses vs sentences) — follow it.
  - screening_mechanism entries are context for you, not something to write into the CV.

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    professional_summary: { type: 'string', description: '2-3 line summary at the top of the CV, only if it adds real value beyond the sections below; empty string if not warranted for a first-CV / no-experience case' },
    experience_section: {
      type: 'array',
      description: 'Omit entirely (empty array) if has_no_experience is true',
      items: {
        type: 'object',
        properties: {
          job_title: { type: 'string' },
          company: { type: 'string' },
          dates: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['job_title', 'company', 'dates', 'bullets'],
      },
    },
    education_section: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string' },
          year: { type: 'string' },
          details: { type: 'array', items: { type: 'string' }, description: 'grade, relevant modules, awards — only what the user gave you' },
        },
        required: ['institution', 'degree', 'year', 'details'],
      },
    },
    projects_section: { type: 'array', items: { type: 'string' }, description: 'Populated especially for no-experience CVs; each entry follows the same action+result bullet formula' },
    skills_section: {
      type: 'object',
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } },
      },
      required: ['technical', 'soft', 'languages', 'tools'],
    },
    achievements_section: { type: 'array', items: { type: 'string' } },
    section_order: { type: 'array', items: { type: 'string' }, description: 'Ordered list of section keys to render, e.g. ["summary","education","projects","skills","achievements"] for a no-experience CV, or ["summary","experience","education","skills","achievements"] for a standard one' },
    handler_notes: { type: 'array', items: { type: 'string' }, description: HANDLER_NOTES_DESCRIPTION },
  },
  required: ['professional_summary', 'experience_section', 'education_section', 'projects_section', 'skills_section', 'achievements_section', 'section_order', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { supabase, user } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase
      .from('cv_documents')
      .select('*')
      .eq('id', document_id)
      .single()
    if (fetchErr || !doc) return jsonResponse({ error: 'CV document not found' }, 404)

    // §08 Career Profile: fill what the user has already told us elsewhere, so
    // a returning user is not re-typing their education into a fourth form.
    // Merged UNDER the request — anything this form supplied always wins.
    const { profile, target } = await fetchProfileContext(supabase, user.id)
    const input = mergeWithProfile(doc.input || {}, profile && {
      personal_info: profile.personal_info,
      education: profile.education,
      experience: profile.experience,
      skills: profile.skills,
      achievements: profile.achievements,
    })

    // Same precedence for the target-context object: the document's own target
    // wins, the active career target fills the blanks.
    const targetIndustry = doc.target_industry || target?.target_industry || null
    const targetRole = doc.target_role || target?.target_role || null
    const targetCompany = doc.target_company || target?.target_company || null
    const jobDescription = doc.job_description || target?.job_description || null

    if (isBlank(targetIndustry)) return jsonResponse({ error: 'Target industry/field is required.' }, 422)

    const lengthError = checkLengths([
      ['Target industry', targetIndustry, LIMITS.SHORT],
      ['Target role', targetRole, LIMITS.SHORT],
      ['Target company', targetCompany, LIMITS.SHORT],
      ['Job description', jobDescription, LIMITS.PASTE_JD],
      ['What you want emphasised', input.target_emphasis, LIMITS.LONG],
      ['Specific requests', input.specific_requests, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const validationError = validateInput(input)
    if (validationError) return jsonResponse({ error: validationError }, 422)

    const [examples, intelligence] = await Promise.all([
      fetchIndustryExamples(supabase, 'cv_bullet', targetIndustry, 3),
      fetchIndustryIntelligence(supabase, targetIndustry, 8),
    ])

    const userContent = JSON.stringify({
      personal_info: input.personal_info,
      target: {
        industry: targetIndustry,
        role: targetRole,
        company: targetCompany,
        emphasis: input.target_emphasis,
        job_description: jobDescription,
      },
      career_profile_context: profileNarrative(profile),
      education: input.education,
      has_no_experience: !!input.has_no_experience,
      experience: input.has_no_experience ? [] : input.experience,
      skills: input.skills,
      achievements: input.achievements,
      style: { tone: input.tone, length: input.length, specific_requests: input.specific_requests },
      real_examples: examples.map(e => ({ excerpt: e.excerpt, why_it_works: e.why_it_works })),
      industry_intelligence: intelligence.map(i => ({ dimension: i.dimension, content: i.content })),
    })

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent,
      toolName: 'submit_cv',
      toolDescription: 'Submit the generated CV content, structured by section.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const atsReport = computeAtsReport(result, input, targetIndustry, targetRole, jobDescription)
    const allSources = [...examples, ...intelligence]
    const resultWithBenchmark = {
      ...result,
      benchmarked_against: allSources.map(e => ({ source_name: e.source_name, source_url: e.source_url })),
    }

    const { data: updated, error: updateErr } = await supabase
      .from('cv_documents')
      .update({ generated: resultWithBenchmark, ats_report: atsReport, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', document_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return jsonResponse({ document: updated })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})

function validateInput(input: Record<string, unknown>): string | null {
  const personal = (input.personal_info || {}) as Record<string, string>
  const personalMissing = checkRequired([
    ['Full name', personal.full_name],
    ['Email', personal.email],
    ['Phone', personal.phone],
    ['Location', personal.location],
  ])
  if (personalMissing) return `Personal information is incomplete — ${personalMissing.toLowerCase()}`

  const personalTooLong = checkLengths([
    ['Full name', personal.full_name, LIMITS.SHORT],
    ['Email', personal.email, LIMITS.SHORT],
    ['Phone', personal.phone, LIMITS.SHORT],
    ['Location', personal.location, LIMITS.SHORT],
    ['LinkedIn URL', personal.linkedin_url, LIMITS.MEDIUM],
    ['Portfolio URL', personal.portfolio_url, LIMITS.MEDIUM],
  ])
  if (personalTooLong) return personalTooLong

  const education = (input.education || []) as Record<string, string>[]
  if (education.length === 0) return 'At least one education entry is required.'
  const edu0 = education[0]
  if (isBlank(edu0?.institution) || isBlank(edu0?.degree) || isBlank(edu0?.year)) {
    return 'Education entries need an institution, degree title, and year.'
  }
  for (const e of education) {
    const tooLong = checkLengths([
      ['Institution', e.institution, LIMITS.SHORT],
      ['Degree', e.degree, LIMITS.SHORT],
      ['Year', e.year, LIMITS.SHORT],
      ['Grade', e.grade, LIMITS.SHORT],
      ['Relevant modules', e.modules, LIMITS.MEDIUM],
      ['Academic achievements', e.awards, LIMITS.LONG],
    ])
    if (tooLong) return tooLong
  }

  if (!input.has_no_experience) {
    const experience = (input.experience || []) as Record<string, string>[]
    const hasValidRole = experience.some(
      r => !isBlank(r?.job_title) && !isBlank(r?.company) && !isBlank(r?.dates),
    )
    if (!hasValidRole) {
      return 'Add at least one role with a job title, company, and dates — or check "I have no formal work experience yet".'
    }
    for (const r of experience) {
      const tooLong = checkLengths([
        ['Job title', r.job_title, LIMITS.SHORT],
        ['Company', r.company, LIMITS.SHORT],
        ['Dates', r.dates, LIMITS.SHORT],
        ['Responsibilities and achievements', r.responsibilities, LIMITS.LONG],
      ])
      if (tooLong) return tooLong
    }
  }

  const skills = (input.skills || {}) as Record<string, string[]>
  const skillCount = ['technical', 'soft', 'languages', 'tools']
    .reduce((n, k) => n + (skills[k] || []).filter(s => !isBlank(s)).length, 0)
  if (skillCount < 3) return 'At least 3 skills are required across the skills section.'

  const achievements = (input.achievements || {}) as Record<string, string>
  const achievementsTooLong = checkLengths([
    ['Societies / clubs', achievements.societies, LIMITS.LONG],
    ['Volunteering', achievements.volunteering, LIMITS.LONG],
    ['Projects', achievements.projects, LIMITS.LONG],
    ['Publications / competitions', achievements.publications, LIMITS.LONG],
    ['Other achievements', achievements.other, LIMITS.LONG],
  ])
  if (achievementsTooLong) return achievementsTooLong

  if (isBlank(input.tone) || isBlank(input.length)) return 'Tone and length preference are required.'
  return null
}

function computeAtsReport(
  generated: Record<string, unknown>,
  input: Record<string, unknown>,
  targetIndustry: string | null,
  targetRole: string | null,
  jobDescription: string | null,
) {
  const generatedText = JSON.stringify(generated).toLowerCase()

  const keywords = jobDescription
    ? extractJdKeywords(jobDescription, targetIndustry)
    : bankForIndustry(targetIndustry)
  const { score: keywordScore, matched, missing } = scoreKeywordMatch(generatedText, keywords)

  const roleTerms = (targetRole || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const roleAlignmentScore = roleTerms.length === 0
    ? 70 // no target role given — neutral score, can't measure alignment to nothing
    : Math.round((roleTerms.filter(t => generatedText.includes(t)).length / roleTerms.length) * 100)

  const { score: formattingScore, checks: formattingChecks } = computeFormattingScore(
    generated,
    (input.personal_info || {}) as Record<string, string>,
  )

  const overall = Math.round(keywordScore * 0.4 + roleAlignmentScore * 0.35 + formattingScore * 0.25)

  return {
    overall_score: overall,
    keyword_match_score: keywordScore,
    role_alignment_score: roleAlignmentScore,
    formatting_score: formattingScore,
    formatting_checks: formattingChecks,
    matched_keywords: matched,
    missing_keywords: missing.slice(0, 12),
    scored_against: jobDescription ? 'job_description' : 'industry_baseline',
  }
}
