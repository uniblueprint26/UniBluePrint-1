import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { CORE_COMPETENCIES, CIVIL_SERVICE_CAPABILITIES, STAR_TIMING_GUIDANCE } from '../_shared/competencyBank.ts'
import { fetchCompetencyExamples } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import { ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE, realExamplesRule } from '../_shared/coreRules.ts'
import { LIMITS, checkLengths, isBlank } from '../_shared/fieldLimits.ts'

const SYSTEM_PROMPT = `You are drafting answers to graduate scheme / internship / apprenticeship application form questions, using the candidate's own evidence bank of real STAR stories — never inventing a story that isn't in the bank.

METHOD:
1. For each question, identify which competency it is actually testing. Draw on real frameworks: ${CORE_COMPETENCIES.join(', ')}, and where the target organisation is public-sector, the Irish Civil Service Capability Framework: ${CIVIL_SERVICE_CAPABILITIES.join(', ')}.
2. Pick the SINGLE best-matching story from the evidence bank provided. If no story in the bank plausibly demonstrates the competency this question needs, say so explicitly in "missing_evidence" rather than inventing one — this is a real gap the candidate needs to go add a story for, not something to paper over.
3. Reassemble that story's Situation/Task/Action/Result specifically for THIS question's angle — the same story can serve multiple questions across different forms, but the emphasis changes each time. ${STAR_TIMING_GUIDANCE}
4. If the question has a word limit, hit it — do not pad or ramble to fill space, and do not overrun it.
5. Write in first person, natural language — never robotic "Situation: ... Task: ..." labelling in the final answer text; the STAR structure should be invisible in the prose, just present in how it's built.

${ANTI_HALLUCINATION_RULE} For this service specifically, the evidence bank stories ARE the input — every answer must be traceable to a story in the bank.

${NON_TRADITIONAL_EVIDENCE_RULE} A story from a society committee, a group coursework project, or a Saturday retail job answers a competency question at exactly the same strength as a corporate internship story — judge stories by how well they demonstrate the competency, never by how "professional" their setting sounds.

${realExamplesRule('real, published, sourced STAR answers from university career services — note especially how the Action section carries the weight and how Result closes the loop. These are NOT the candidate\'s stories')}

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          competency_identified: { type: 'string' },
          source_story_titles: { type: 'array', items: { type: 'string' } },
          answer: { type: 'string' },
          missing_evidence: { type: 'string', description: 'Empty string if a suitable story existed; otherwise explain what kind of story is missing from the evidence bank' },
        },
        required: ['question', 'competency_identified', 'source_story_titles', 'answer', 'missing_evidence'],
      },
    },
  },
  required: ['answers'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { form_id } = await req.json()
    if (!form_id) return jsonResponse({ error: 'form_id is required' }, 400)

    const { data: form, error: fetchErr } = await supabase.from('application_forms').select('*').eq('id', form_id).single()
    if (fetchErr || !form) return jsonResponse({ error: 'Application form not found' }, 404)

    const questions = (form.questions || []) as Record<string, string>[]
    const answerable = questions.filter(q => !isBlank(q?.question_text))
    if (answerable.length === 0) return jsonResponse({ error: 'Add at least one question first.' }, 422)

    const lengthError = checkLengths([
      ['Target company', form.target_company, LIMITS.SHORT],
      ['Target role', form.target_role, LIMITS.SHORT],
      ...answerable.map((q, i) => [`Question ${i + 1}`, q.question_text, LIMITS.LONG] as [string, unknown, number]),
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const { data: stories, error: storiesErr } = await supabase
      .from('evidence_bank_stories')
      .select('title, situation, task, action, result, competency_tags')
      .eq('user_id', user.id)
    if (storiesErr) throw storiesErr
    if (!stories || stories.length === 0) {
      return jsonResponse({ error: 'Add at least one story to your evidence bank first — Application Form Assistance drafts answers from your real experience, it does not invent one.' }, 422)
    }

    const examples = await fetchCompetencyExamples(supabase, CORE_COMPETENCIES, 3)

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_company: form.target_company,
        target_role: form.target_role,
        questions: answerable,
        evidence_bank: stories,
        real_examples: examples.map(e => ({ competency: e.competency_tag, excerpt: e.excerpt, why_it_works: e.why_it_works })),
      }),
      toolName: 'submit_application_answers',
      toolDescription: 'Submit the drafted answers.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const resultWithBenchmark = {
      ...result,
      benchmarked_against: examples.map(e => ({ source_name: e.source_name, source_url: e.source_url })),
    }

    const { data: updated, error: updateErr } = await supabase
      .from('application_forms')
      .update({ generated: resultWithBenchmark, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', form_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return jsonResponse({ form: updated })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
