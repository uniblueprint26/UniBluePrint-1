import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { fetchIndustryExamples } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import {
  ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE,
  buzzwordRule, realExamplesRule, HANDLER_NOTES_DESCRIPTION,
} from '../_shared/coreRules.ts'
import { LIMITS, checkLengths, checkRequired } from '../_shared/fieldLimits.ts'
import {
  fetchProfileContext, profileNarrative, experienceNarrative, PROFILE_CONTEXT_RULE,
} from '../_shared/careerProfile.ts'

const SYSTEM_PROMPT = `You are an expert cover letter writer. Every letter is written for ONE specific role at ONE specific company — never a generic template, and it must read like it could not be sent to any other employer unchanged.

STRUCTURE — real four-part hook/proof/motivation/close pattern, 250-400 words total, 3-4 paragraphs:
  1. HOOK — a specific opening that connects the candidate to this role in the first 1-2 sentences. NEVER start with "I am writing to apply for..." or "I am excited to apply for the position of...". Lead with a concrete proof point, a specific connection to the company, or the company's actual work — not a restatement of the job title.
  2. PROOF — the strongest piece of evidence connecting the candidate's actual background to what this role needs. Only use what's in the input — never invent an achievement, employer, or metric.
  3. MOTIVATION — why THIS company specifically. The test: reference something specific and true the user told you about the company or the role — a real project, a real thing they do, a real reason it fits this person — never a generic compliment like "your company's excellent reputation" or "your innovative culture" that could be pasted into a letter for any employer. If the user gave you nothing specific about the company, write around it honestly rather than manufacturing false specificity.
  4. CLOSE — confident, specific call to action (e.g. "I'd welcome the chance to talk through how I could contribute to X" rather than a generic "Thank you for your consideration").

TONE BY SECTOR: conservative and traditional phrasing for finance, law, and government roles. More personality and voice is appropriate — even rewarded — for tech, startup, and creative roles. Match the tone to the target_industry/target_role given.

The letter should ADD to the CV, not repeat it — pick the one or two things from the candidate's background most relevant to this specific role and go deep, rather than summarising everything.

NO FORMAL WORK EXPERIENCE — if has_no_experience is true, the letter's architecture shifts, honestly: the HOOK leads with the genuine, specific connection between what this person has actually studied, built, or done and what this role needs — not a manufactured career narrative. The PROOF draws from academic projects, coursework, societies, volunteering, or part-time work, presented at full confidence as the real evidence it is. Never imply professional experience that doesn't exist, never dress a college project in workplace language it didn't have, and never apologise for the absence ("although I have not yet worked in..."). A first cover letter earns the interview on genuine specificity and demonstrated initiative, not on borrowed seniority.

${ANTI_HALLUCINATION_RULE}

${PROFILE_CONTEXT_RULE}

${NON_TRADITIONAL_EVIDENCE_RULE}

${buzzwordRule()}

${realExamplesRule('real, published, sourced cover letter openers from this industry')}

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    opening_hook: { type: 'string' },
    body_paragraphs: { type: 'array', items: { type: 'string' } },
    closing: { type: 'string' },
    full_text: { type: 'string', description: 'The complete letter, ready to send, combining the hook/body/closing into proper paragraphs' },
    word_count: { type: 'integer' },
    handler_notes: { type: 'array', items: { type: 'string' }, description: HANDLER_NOTES_DESCRIPTION },
  },
  required: ['opening_hook', 'body_paragraphs', 'closing', 'full_text', 'word_count', 'handler_notes'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { document_id } = await req.json()
    if (!document_id) return jsonResponse({ error: 'document_id is required' }, 400)

    const { data: doc, error: fetchErr } = await supabase.from('cover_letters').select('*').eq('id', document_id).single()
    if (fetchErr || !doc) return jsonResponse({ error: 'Cover letter not found' }, 404)

    const { profile, target } = await fetchProfileContext(supabase, user.id)
    const input = doc.input || {}
    const targetRole = doc.target_role || target?.target_role || null
    const targetCompany = doc.target_company || target?.target_company || null
    const industry = input.industry || target?.target_industry || null
    const jobDescription = doc.job_description || target?.job_description || null

    const missing = checkRequired([
      ['Target role', targetRole],
      ['Target company', targetCompany],
      ['Relevant experience', input.relevant_experience],
    ])
    if (missing) return jsonResponse({ error: missing }, 422)

    const lengthError = checkLengths([
      ['Target role', targetRole, LIMITS.SHORT],
      ['Target company', targetCompany, LIMITS.SHORT],
      ['Industry', industry, LIMITS.SHORT],
      ['Job description', jobDescription, LIMITS.PASTE_JD],
      ['Background summary', input.background_summary, LIMITS.LONG],
      ['Relevant experience', input.relevant_experience, LIMITS.LONG],
      ['Why this company', input.why_this_company, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const examples = await fetchIndustryExamples(supabase, 'cover_letter_opener', industry, 2)
    const hasNoExperience = input.has_no_experience !== undefined ? !!input.has_no_experience : !!profile?.has_no_experience
    const backgroundSummary = input.background_summary || experienceNarrative(profile) || null

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({
        target_role: targetRole,
        target_company: targetCompany,
        job_description: jobDescription,
        background_summary: backgroundSummary,
        why_this_company: input.why_this_company,
        relevant_experience: input.relevant_experience,
        has_no_experience: hasNoExperience,
        tone: input.tone,
        career_profile_context: profileNarrative(profile),
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
