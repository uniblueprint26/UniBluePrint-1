import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'

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

ANTI-HALLUCINATION: only use facts, experiences, and achievements the applicant actually gave you. Never invent an experience, grade, or accomplishment.

BUZZWORD RULE: never write "passionate about", "always dreamed of", "since I was young I have loved" unless the applicant's own input gives you something specific and true to say instead of a cliché opener.

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
    handler_notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['ucas_answers', 'single_statement', 'word_count', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase.from('personal_statements').select('*').eq('id', document_id).single()
    if (fetchErr || !doc) return jsonResponse({ error: 'Personal statement not found' }, 404)
    if (!doc.target_course || !doc.target_institution) return jsonResponse({ error: 'Course and institution are required.' }, 422)

    const input = doc.input || {}
    if (!input.background_and_motivation) return jsonResponse({ error: 'Tell us about your background and motivation first.' }, 422)

    const pathwayPrompt = PATHWAY_PROMPTS[doc.pathway]
    if (!pathwayPrompt) return jsonResponse({ error: 'Unknown pathway' }, 422)

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT_BASE}\n\n${pathwayPrompt}`,
      userContent: JSON.stringify({
        pathway: doc.pathway,
        target_course: doc.target_course,
        target_institution: doc.target_institution,
        background_and_motivation: input.background_and_motivation,
        relevant_experience: input.relevant_experience,
        life_work_experience: input.life_work_experience,
        weaknesses_or_gaps: input.weaknesses_or_gaps,
        goals: input.goals,
      }),
      toolName: 'submit_personal_statement',
      toolDescription: 'Submit the generated personal statement.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 3072,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('personal_statements')
      .update({ generated: result, status: 'generated', updated_at: new Date().toISOString() })
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
