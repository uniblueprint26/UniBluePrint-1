import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import {
  ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE,
  buzzwordRule, HANDLER_NOTES_DESCRIPTION,
} from '../_shared/coreRules.ts'
import { LIMITS, checkLengths, checkRequired } from '../_shared/fieldLimits.ts'
import { fetchCareerTarget, fetchCareerProfile, profileNarrative, experienceNarrative, PROFILE_CONTEXT_RULE } from '../_shared/careerProfile.ts'
import { resolveIndustryContext, withIndustryHandlerNote } from '../_shared/industryContext.ts'

const PATHWAY_PROMPTS: Record<string, string> = {
  ucas: `UCAS PATHWAY — 2026 entry onwards uses a NEW three-question structured format, not a single free-form essay. Produce exactly three answers:
  1. Why do you want to study this course or subject?
  2. How have your qualifications and studies helped you prepare for this course?
  3. What else have you done to prepare outside of education, and why are these experiences useful?
Each answer must be a minimum of 350 characters, and the three combined must not exceed 4,000 characters total. Report the character count for each answer. Write in the applicant's own voice — specific and concrete, never generic ("I have always been passionate about...").`,
  cao_mature: `CAO MATURE APPLICANT PATHWAY — this statement (plus any subsequent interview) carries most of the weight of the application, since CAO does not assess mature applicants on Leaving Cert points. Produce ONE well-structured statement covering: why this course now, relevant life/work experience and what it demonstrates, how the applicant will manage returning to study (practical readiness), and genuine motivation. Do not apply a rigid word count — but be complete and substantive, not padded. This is fundamentally different from a school-leaver statement: lean into life and work experience as real, valid evidence, not something to apologise for lacking "traditional" academic credentials.`,
  postgrad: `POSTGRADUATE PATHWAY — 400-600 words, five-part structure:
  1. Academic background — what they studied, where, and why it connects to this course
  2. Evidence of relevant skills — core areas like research, analysis, communication, time management
  3. Goals — long-term plans and how this course fits them
  4. Any weaknesses (e.g. a lower module grade, a gap) reframed positively and honestly — only include this if the applicant actually told you about one, never invent a weakness to be "balanced"
  5. Course/institution-specific tailoring — must reference the actual course and institution given, and never be written so generically it could be resubmitted unchanged for a different course.`,
}

const SYSTEM_PROMPT_BASE = `You are writing a personal statement for a specific applicant, course, and institution. Never write anything generic enough to be resubmitted unchanged elsewhere.

${ANTI_HALLUCINATION_RULE}

${PROFILE_CONTEXT_RULE}

${buzzwordRule()}

CLICHÉ OPENER RULE — specific to personal statements, and a distinct failure from the buzzwords above: never open with "I have always been passionate about", "since I was young I have loved", "from a young age I have dreamed of", or any variant. Admissions readers see these on a large share of statements and they signal nothing. Open with something only this applicant could write.

NO FORMAL WORK EXPERIENCE IS THE NORM here — most applicants are school leavers, and admissions readers know it. Where a section invites experience outside education (especially the UCAS "what else have you done" question), school activities, hobbies, independent reading, sport, family or caring responsibilities, volunteering, and part-time work are all legitimate answers at full strength. If the applicant genuinely gave you little for such a section, write a shorter, honest answer built on what's real — never pad it with invented experiences or inflate a small activity into something it wasn't.

${NON_TRADITIONAL_EVIDENCE_RULE}

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ucas_answers: {
      type: 'array',
      description: 'Only for the ucas pathway — exactly 3 entries',
      items: {
        type: 'object',
        properties: { question: { type: 'string' }, answer: { type: 'string' }, character_count: { type: 'integer' } },
        required: ['question', 'answer', 'character_count'],
      },
    },
    single_statement: { type: 'string', description: 'Only for cao_mature and postgrad pathways' },
    word_count: { type: 'integer' },
    handler_notes: { type: 'array', items: { type: 'string' }, description: HANDLER_NOTES_DESCRIPTION },
  },
  required: ['ucas_answers', 'single_statement', 'word_count', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase.from('personal_statements').select('*').eq('id', document_id).single()
    if (fetchErr || !doc) return jsonResponse({ error: 'Personal statement not found' }, 404)

    const [profile, target] = await Promise.all([
      fetchCareerProfile(supabase, user.id),
      fetchCareerTarget(supabase, user.id),
    ])
    const input = doc.input || {}
    const targetCourse = doc.target_course || target?.target_course || null
    const targetInstitution = doc.target_institution || target?.target_institution || null

    const missing = checkRequired([
      ['Course', targetCourse],
      ['Institution', targetInstitution],
      ['Background and motivation', input.background_and_motivation],
    ])
    if (missing) return jsonResponse({ error: missing }, 422)

    const lengthError = checkLengths([
      ['Course', targetCourse, LIMITS.SHORT],
      ['Institution', targetInstitution, LIMITS.SHORT],
      ['Background and motivation', input.background_and_motivation, LIMITS.LONG],
      ['Relevant experience', input.relevant_experience, LIMITS.LONG],
      ['Life / work experience', input.life_work_experience, LIMITS.LONG],
      ['Goals', input.goals, LIMITS.LONG],
      ['Weaknesses or gaps', input.weaknesses_or_gaps, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const pathwayPrompt = PATHWAY_PROMPTS[doc.pathway]
    if (!pathwayPrompt) return jsonResponse({ error: 'Unknown pathway' }, 422)

    const goals = input.goals || profile?.goals || null
    const lifeWorkExperience = input.life_work_experience || experienceNarrative(profile) || null

    // A personal statement is an argument for belonging in a specific field, so
    // the industry it is aimed at matters more here than almost anywhere else.
    // The course is usually the better signal than a stated target industry for
    // this document, but stated still wins when the student gave one.
    const industryCtx = await resolveIndustryContext(supabase, target?.target_industry, targetCourse)

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT_BASE}\n\n${pathwayPrompt}\n\n${industryCtx.promptBlock}`,
      userContent: JSON.stringify({
        pathway: doc.pathway,
        target_course: targetCourse,
        target_institution: targetInstitution,
        target_industry: industryCtx.industry,
        background_and_motivation: input.background_and_motivation,
        relevant_experience: input.relevant_experience,
        life_work_experience: lifeWorkExperience,
        weaknesses_or_gaps: input.weaknesses_or_gaps,
        goals,
        career_profile_context: profileNarrative(profile),
      }),
      toolName: 'submit_personal_statement',
      toolDescription: 'Submit the generated personal statement.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 3072,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('personal_statements')
      .update({ generated: withIndustryHandlerNote(result, industryCtx), status: 'generated', updated_at: new Date().toISOString() })
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
