import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { fetchIndustryExamples } from '../_shared/exampleLibrary.ts'

const SYSTEM_PROMPT = `You are an expert cover letter writer. Every letter is written for ONE specific role at ONE specific company — never a generic template, and it must read like it could not be sent to any other employer unchanged.

STRUCTURE — real four-part hook/proof/motivation/close pattern, 250-400 words total, 3-4 paragraphs:
  1. HOOK — a specific opening that connects the candidate to this role in the first 1-2 sentences. NEVER start with "I am writing to apply for..." or "I am excited to apply for the position of...". Lead with a concrete proof point, a specific connection to the company, or the company's actual work — not a restatement of the job title.
  2. PROOF — the strongest piece of evidence connecting the candidate's actual background to what this role needs. Only use what's in the input — never invent an achievement, employer, or metric.
  3. MOTIVATION — why THIS company specifically, using anything genuine the user told you about them (not generic flattery like "your company's excellent reputation").
  4. CLOSE — confident, specific call to action (e.g. "I'd welcome the chance to talk through how I could contribute to X" rather than a generic "Thank you for your consideration").

TONE BY SECTOR: conservative and traditional phrasing for finance, law, and government roles. More personality and voice is appropriate — even rewarded — for tech, startup, and creative roles. Match the tone to the target_industry/target_role given.

The letter should ADD to the CV, not repeat it — pick the one or two things from the candidate's background most relevant to this specific role and go deep, rather than summarising everything.

ANTI-HALLUCINATION: never invent facts, employers, dates, or achievements not present in the input.

REAL EXAMPLES: you may be given real, published, sourced cover letter openers from this industry (real_examples). Study why each works — never copy its wording or reuse its specific facts. Every sentence you write must come from this candidate's own input.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    opening_hook: { type: 'string' },
    body_paragraphs: { type: 'array', items: { type: 'string' } },
    closing: { type: 'string' },
    full_text: { type: 'string', description: 'The complete letter, ready to send, combining the hook/body/closing into proper paragraphs' },
    word_count: { type: 'integer' },
    handler_notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['opening_hook', 'body_paragraphs', 'closing', 'full_text', 'word_count', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase.from('cover_letters').select('*').eq('id', document_id).single()
    if (fetchErr || !doc) return jsonResponse({ error: 'Cover letter not found' }, 404)

    const input = doc.input || {}
    if (!doc.target_role || !doc.target_company) return jsonResponse({ error: 'Target role and company are required.' }, 422)
    if (!input.relevant_experience) return jsonResponse({ error: 'Add at least a little about your relevant experience or background.' }, 422)

    const examples = await fetchIndustryExamples(supabase, 'cover_letter_opener', input.industry, 2)

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_role: doc.target_role,
        target_company: doc.target_company,
        job_description: doc.job_description,
        background_summary: input.background_summary,
        why_this_company: input.why_this_company,
        relevant_experience: input.relevant_experience,
        tone: input.tone,
        real_examples: examples.map(e => ({ excerpt: e.excerpt, why_it_works: e.why_it_works })),
      }),
      toolName: 'submit_cover_letter',
      toolDescription: 'Submit the generated cover letter.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 2048,
    })

    const resultWithBenchmark = {
      ...result,
      benchmarked_against: examples.map(e => ({ source_name: e.source_name, source_url: e.source_url })),
    }

    const { data: updated, error: updateErr } = await supabase
      .from('cover_letters')
      .update({ generated: resultWithBenchmark, status: 'generated', updated_at: new Date().toISOString() })
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
