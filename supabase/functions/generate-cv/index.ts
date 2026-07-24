import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { bankForIndustry, extractJdKeywords, scoreKeywordMatch } from '../_shared/atsKeywords.ts'
import { fetchIndustryExamples } from '../_shared/exampleLibrary.ts'

const SYSTEM_PROMPT = `You are an expert CV writer combining the judgement of an experienced recruiter, a university careers advisor, and an ATS optimisation specialist. You write CVs for Irish and UK students, apprentices, and young professionals.

METHOD — every experience, project, or achievement bullet follows the Harvard Careers Services formula:
  action verb + what you did + quantified result + why it mattered
Write phrases, not full sentences. Never start a bullet with "I" or use personal pronouns.

ABSOLUTE RULE — NEVER INVENT FACTS. Only use information the user actually provided. If the user did not give you a number, do not invent one — sharpen the action and result language instead of fabricating a metric. A CV with an invented statistic is worse than one with none, because it can be caught and destroys trust.

BUZZWORD RULE — never write "passionate", "hardworking", "results-driven", "team player", "motivated individual", or similar unsupported claims unless the user's own input gives you a specific fact that actually demonstrates it. If they haven't given you evidence, don't claim the trait.

NO WORK EXPERIENCE FALLBACK — if has_no_experience is true, do NOT write an empty or padded Experience section. Restructure the CV to lead with Education (including relevant modules and achievements), then Projects, then Skills, then any Achievements & Extras (societies, volunteering, publications). This is a completely different, equally strong structure for first-years and students entering the workforce for the first time — not a lesser version of the standard CV.

TARGETING — if target_role, target_industry, target_company, or job_description are provided, tailor language and emphasis toward them, and naturally work in relevant terminology for that field without keyword-stuffing. If they are blank, produce a strong general-purpose CV for the stated industry only.

TONE & LENGTH — respect the user's stated tone (formal / balanced / modern) and length preference (one page / two page) by how much you include and how you phrase it — formal is more conservative and traditional in phrasing, modern allows slightly more personality while staying professional.

Never produce anything a recruiter would immediately flag as "obviously AI" — generic, interchangeable phrasing. Every output must sound like it was written by someone who actually knows this specific person's background.

REAL EXAMPLES — you will be given a small set of real, published, sourced bullet examples from this person's industry (real_examples in the input). These exist so you understand what genuinely effective writing looks like in this specific field — the level of specificity, what kind of results actually get named, how numbers get used. Study why each one works. NEVER copy an example's wording, numbers, or structure into the output — every bullet you write must be built entirely from this specific person's own input.`

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
    handler_notes: { type: 'array', items: { type: 'string' }, description: 'Short notes for the reviewing Campus Handler — e.g. "No metrics were provided for the retail role; bullets sharpened without inventing numbers."' },
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

    const input = doc.input || {}
    if (!doc.target_industry) return jsonResponse({ error: 'Target industry/field is required.' }, 422)
    const validationError = validateInput(input)
    if (validationError) return jsonResponse({ error: validationError }, 422)

    const examples = await fetchIndustryExamples(supabase, 'cv_bullet', doc.target_industry, 3)

    const userContent = JSON.stringify({
      personal_info: input.personal_info,
      target: {
        industry: doc.target_industry,
        role: doc.target_role,
        company: doc.target_company,
        emphasis: input.target_emphasis,
        job_description: doc.job_description,
      },
      education: input.education,
      has_no_experience: !!input.has_no_experience,
      experience: input.has_no_experience ? [] : input.experience,
      skills: input.skills,
      achievements: input.achievements,
      style: { tone: input.tone, length: input.length, specific_requests: input.specific_requests },
      real_examples: examples.map(e => ({ excerpt: e.excerpt, why_it_works: e.why_it_works })),
    })

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent,
      toolName: 'submit_cv',
      toolDescription: 'Submit the generated CV content, structured by section.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const atsReport = computeAtsReport(result, doc.target_industry, doc.target_role, doc.job_description)
    const resultWithBenchmark = {
      ...result,
      benchmarked_against: examples.map(e => ({ source_name: e.source_name, source_url: e.source_url })),
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
  if (!personal.full_name || !personal.email || !personal.phone || !personal.location) {
    return 'Personal information is incomplete — name, email, phone, and location are required.'
  }
  const education = (input.education || []) as unknown[]
  if (education.length === 0) return 'At least one education entry is required.'
  const edu0 = education[0] as Record<string, string>
  if (!edu0?.institution || !edu0?.degree || !edu0?.year) {
    return 'Education entries need an institution, degree title, and year.'
  }
  if (!input.has_no_experience) {
    const experience = (input.experience || []) as unknown[]
    if (experience.length === 0) {
      return 'Add at least one role, or check "I have no formal work experience yet".'
    }
  }
  const skills = (input.skills || {}) as Record<string, string[]>
  const skillCount = ['technical', 'soft', 'languages', 'tools']
    .reduce((n, k) => n + (skills[k]?.length || 0), 0)
  if (skillCount < 3) return 'At least 3 skills are required across the skills section.'
  if (!input.tone || !input.length) return 'Tone and length preference are required.'
  return null
}

function computeAtsReport(
  generated: Record<string, unknown>,
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

  // Formatting is guaranteed by our own single-column, standard-section template.
  const formattingScore = 95

  const overall = Math.round(keywordScore * 0.4 + roleAlignmentScore * 0.35 + formattingScore * 0.25)

  return {
    overall_score: overall,
    keyword_match_score: keywordScore,
    role_alignment_score: roleAlignmentScore,
    formatting_score: formattingScore,
    matched_keywords: matched,
    missing_keywords: missing.slice(0, 12),
    scored_against: jobDescription ? 'job_description' : 'industry_baseline',
  }
}
