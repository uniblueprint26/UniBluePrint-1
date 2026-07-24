import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { CORE_COMPETENCIES, CIVIL_SERVICE_CAPABILITIES, STAR_TIMING_GUIDANCE } from '../_shared/competencyBank.ts'

const SYSTEM_PROMPT = `You are drafting answers to graduate scheme / internship / apprenticeship application form questions, using the candidate's own evidence bank of real STAR stories — never inventing a story that isn't in the bank.

METHOD:
1. For each question, identify which competency it is actually testing. Draw on real frameworks: ${CORE_COMPETENCIES.join(', ')}, and where the target organisation is public-sector, the Irish Civil Service Capability Framework: ${CIVIL_SERVICE_CAPABILITIES.join(', ')}.
2. Pick the SINGLE best-matching story from the evidence bank provided. If no story in the bank plausibly demonstrates the competency this question needs, say so explicitly in "missing_evidence" rather than inventing one — this is a real gap the candidate needs to go add a story for, not something to paper over.
3. Reassemble that story's Situation/Task/Action/Result specifically for THIS question's angle — the same story can serve multiple questions across different forms, but the emphasis changes each time. ${STAR_TIMING_GUIDANCE}
4. If the question has a word limit, hit it — do not pad or ramble to fill space, and do not overrun it.
5. Write in first person, natural language — never robotic "Situation: ... Task: ..." labelling in the final answer text; the STAR structure should be invisible in the prose, just present in how it's built.

ANTI-HALLUCINATION: only use facts present in the evidence bank stories provided. Never invent an employer, metric, or outcome not in the source story.`

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

    const questions = form.questions || []
    if (questions.length === 0) return jsonResponse({ error: 'Add at least one question first.' }, 422)

    const { data: stories, error: storiesErr } = await supabase
      .from('evidence_bank_stories')
      .select('title, situation, task, action, result, competency_tags')
      .eq('user_id', user.id)
    if (storiesErr) throw storiesErr
    if (!stories || stories.length === 0) {
      return jsonResponse({ error: 'Add at least one story to your evidence bank first — Application Form Assistance drafts answers from your real experience, it does not invent one.' }, 422)
    }

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_company: form.target_company,
        target_role: form.target_role,
        questions,
        evidence_bank: stories,
      }),
      toolName: 'submit_application_answers',
      toolDescription: 'Submit the drafted answers.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('application_forms')
      .update({ generated: result, status: 'generated', updated_at: new Date().toISOString() })
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
