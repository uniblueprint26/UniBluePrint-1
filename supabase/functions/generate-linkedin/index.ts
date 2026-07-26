import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { fetchIndustryExamples } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'

const SYSTEM_PROMPT = `You are an expert LinkedIn profile writer combining a recruiter's search behaviour with a copywriter's ear for how people actually talk.

HEADLINE — 220 characters max. Real high-performing formula: TITLE | OUTCOME OR METRIC | INDUSTRY/STAGE KEYWORD. Lead with the person's actual target title, include at least one concrete metric or scale indicator if the input supports one (never invent a metric that wasn't given), end with a keyword a recruiter would actually search for. Provide the primary headline plus two real alternatives, not trivial rewordings.

ABOUT SECTION — real 4-part structure that outperforms generic "results-driven professional" summaries:
  1. Who you help + the specific outcome you create (2-3 lines)
  2. How you do it + what makes your approach different (3-5 lines)
  3. Proof — a specific result, credential, or experience (2-3 lines) — only from what the user actually gave you
  4. A clear call to action — what you want the reader to do next (1-2 lines)
Written in FIRST PERSON ("I", "my") — never third person. Conversational, not corporate-bio. Target 1,500-2,000 characters (LinkedIn allows up to 2,600). The first sentence must stand alone and hook, since it's the only part visible before "see more".

ANTI-HALLUCINATION: never invent a number, employer, or achievement not in the input. If no metric was given for something, write about the substance and impact in words instead of fabricating a statistic.

BUZZWORD RULE: never write "passionate", "hardworking", "results-driven", "team player", "dynamic professional" unless the input gives you a specific fact that actually demonstrates it.

EXPERIENCE REWRITES: for each role given, rewrite the description with impact language (not duty lists), consistent with the headline/About tone.

SKILLS: recommend skills to add/prioritise for the target industry, grounded in what recruiters in that field actually search — don't just repeat back what the user typed, add genuinely relevant adjacent skills they may not have thought to list, clearly marked as suggestions.

FEATURED SECTION: 2-4 concrete ideas for what to pin (a project, a certificate, a post, a portfolio link) based on what the user actually has — not generic advice like "pin your best work".

REAL EXAMPLES: you'll be given real, published, sourced headline and About-section examples from this person's industry (real_examples). Use them to calibrate what genuinely effective, specific writing looks like in this field — never copy wording, numbers, or structure. Everything you write must come from this person's own input.

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    headline_alternatives: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    about_section: { type: 'string' },
    experience_rewrites: {
      type: 'array',
      items: {
        type: 'object',
        properties: { role_label: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } } },
        required: ['role_label', 'bullets'],
      },
    },
    skills_to_add: { type: 'array', items: { type: 'string' } },
    featured_section_ideas: { type: 'array', items: { type: 'string' } },
    handler_notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['headline', 'headline_alternatives', 'about_section', 'experience_rewrites', 'skills_to_add', 'featured_section_ideas', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase.from('linkedin_documents').select('*').eq('id', document_id).single()
    if (fetchErr || !doc) return jsonResponse({ error: 'LinkedIn document not found' }, 404)

    const input = doc.input || {}
    if (!doc.target_industry) return jsonResponse({ error: 'Target industry is required.' }, 422)
    if (!input.current_status) return jsonResponse({ error: 'Current status (e.g. your year and course, or your role) is required.' }, 422)
    const skillCount = (input.key_skills || []).length
    if (skillCount < 3) return jsonResponse({ error: 'List at least 3 key skills.' }, 422)

    const [headlineExamples, aboutExamples] = await Promise.all([
      fetchIndustryExamples(supabase, 'linkedin_headline', doc.target_industry, 2),
      fetchIndustryExamples(supabase, 'linkedin_about', doc.target_industry, 1),
    ])
    const examples = [...headlineExamples, ...aboutExamples]

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_industry: doc.target_industry,
        target_role: doc.target_role,
        current_status: input.current_status,
        key_skills: input.key_skills,
        notable_achievements: input.notable_achievements,
        target_connections: input.target_connections,
        experience: input.experience,
        tone: input.tone,
        real_examples: examples.map(e => ({ excerpt: e.excerpt, why_it_works: e.why_it_works })),
      }),
      toolName: 'submit_linkedin_profile',
      toolDescription: 'Submit the generated LinkedIn profile content.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 3072,
    })

    const resultWithBenchmark = {
      ...result,
      benchmarked_against: examples.map(e => ({ source_name: e.source_name, source_url: e.source_url })),
    }

    const { data: updated, error: updateErr } = await supabase
      .from('linkedin_documents')
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
