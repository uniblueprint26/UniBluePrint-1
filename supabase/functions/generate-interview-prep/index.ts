import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { CORE_COMPETENCIES, STRENGTHS_BASED_FORMAT_NOTE, STAR_TIMING_GUIDANCE } from '../_shared/competencyBank.ts'

const SYSTEM_PROMPT = `You are building a personalised interview preparation pack.

INTERVIEW TYPES — these are genuinely different formats, not the same prep with a different label:
- BEHAVIOURAL / COMPETENCY: past-example questions, answered in STAR. ${STAR_TIMING_GUIDANCE}
- TECHNICAL: role-specific problem-solving, not a personal story — give a preparation approach and what to research, not a fake worked answer to a technical problem you can't verify.
- STRENGTHS-BASED: ${STRENGTHS_BASED_FORMAT_NOTE} Prepare the candidate to talk genuinely about what energises them, not rehearsed stories.
- BLENDED: a realistic mix of all of the above, common at large graduate employers and the public sector — flag which questions are which type so the candidate knows how to answer each differently.

EVIDENCE BANK: for behavioural/competency questions, use the candidate's own evidence bank stories where they genuinely fit — never invent a story. If no story fits a likely question, say so in missing_evidence rather than fabricating one. Cover the core competencies employers actually ask about: ${CORE_COMPETENCIES.join(', ')}.

COMPANY RESEARCH: give the candidate specific things to actually go find out (recent news, values, what the interviewer likely cares about) — never assert something you don't know to be true about the specific company, since your knowledge of current events may be stale. Frame these as research prompts ("look up X"), not as facts you're telling them about the company.

ANTI-HALLUCINATION: never invent a fact about the company, never invent a metric or story not in the evidence bank.

HANDLER MOCK RUBRIC: produce a three-criterion scoring rubric (First impression / Poise & delivery / Content) for the Handler to use in a live mock session, mirroring how university career-services offices actually score mock interviews — 1/3/5 scale per criterion, with a one-line description of what's assessed.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    likely_questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['behavioural', 'technical', 'strengths_based'] },
          model_answer: { type: 'string' },
          source_story_title: { type: 'string' },
          missing_evidence: { type: 'string' },
          preparation_approach: { type: 'string', description: 'Used instead of model_answer for technical questions' },
        },
        required: ['question', 'type', 'model_answer', 'source_story_title', 'missing_evidence', 'preparation_approach'],
      },
    },
    company_research_prompts: { type: 'array', items: { type: 'string' } },
    confidence_tips: { type: 'array', items: { type: 'string' } },
    handler_mock_rubric: {
      type: 'array',
      items: {
        type: 'object',
        properties: { criterion: { type: 'string' }, description: { type: 'string' } },
        required: ['criterion', 'description'],
      },
    },
  },
  required: ['likely_questions', 'company_research_prompts', 'confidence_tips', 'handler_mock_rubric'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { pack_id } = await req.json()
    if (!pack_id) return jsonResponse({ error: 'pack_id is required' }, 400)

    const { data: pack, error: fetchErr } = await supabase.from('interview_prep_packs').select('*').eq('id', pack_id).single()
    if (fetchErr || !pack) return jsonResponse({ error: 'Interview prep pack not found' }, 404)
    if (!pack.target_role) return jsonResponse({ error: 'Target role is required.' }, 422)

    const { data: stories } = await supabase
      .from('evidence_bank_stories')
      .select('title, situation, task, action, result, competency_tags')
      .eq('user_id', user.id)

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_company: pack.target_company,
        target_role: pack.target_role,
        interview_type: pack.interview_type,
        background_summary: (pack.input || {}).background_summary,
        evidence_bank: stories || [],
      }),
      toolName: 'submit_interview_prep',
      toolDescription: 'Submit the interview preparation pack.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('interview_prep_packs')
      .update({ generated: result, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', pack_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return jsonResponse({ pack: updated })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
