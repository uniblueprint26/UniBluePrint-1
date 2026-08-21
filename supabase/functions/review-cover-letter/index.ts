import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { LIMITS, checkLengths } from '../_shared/fieldLimits.ts'
import { fetchCareerTarget } from '../_shared/careerProfile.ts'
import { resolveIndustryContext } from '../_shared/industryContext.ts'

const SYSTEM_PROMPT = `You are an expert cover letter reviewer. Assess the pasted letter across exactly five dimensions — no more, no fewer, matching what a professional review actually checks:

1. STRUCTURE — does it follow hook/proof/motivation/close, or does it ramble / restate the CV / open with "I am writing to apply"?
2. TONE — is it matched to the target industry? Where industry intelligence is supplied below, judge tone and wording against that field's actual conventions rather than a general impression. Where it is not, fall back to the broad default: conservative and precise for finance, law, public sector and healthcare; more voice permitted in tech, creative and marketing.
3. STORYTELLING — does it connect specific experience to the role, or is it generic and could be sent to any employer unchanged?
4. RELEVANCE — does it actually address what this specific role/company needs, based on the job description or target role given?
5. EMPLOYER ALIGNMENT — does the motivation section show genuine, specific interest in this employer, or generic flattery?

For each dimension, give a short, specific verdict tied to the actual text — quote or closely paraphrase the weak part, then say what's wrong and how to fix it. Do NOT produce a numeric score for a cover letter — there is no defensible objective scoring model for this, unlike a CV's ATS parsing. Give qualitative, specific feedback only.

FIRST-TIME APPLICANTS: many letters you review will cite coursework, college projects, societies, volunteering, or part-time work as their evidence. That is legitimate, full-strength material for a graduate-level letter — assess how specifically and convincingly it's connected to the role, and never mark it down merely for not being professional experience. Do flag the opposite failure: language that dresses student experience up as professional seniority it wasn't.

INDUSTRY INTELLIGENCE — where an industry context block is supplied, check the letter against it directly. Name in your feedback any must_have this field treats as non-negotiable that the letter omits despite the writer plausibly having it, and quote any text that matches a red_flag for this field. Do not invent a requirement that is not in the supplied context.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    structure: { type: 'string' },
    tone: { type: 'string' },
    storytelling: { type: 'string' },
    relevance: { type: 'string' },
    employer_alignment: { type: 'string' },
    overall_summary: { type: 'string' },
  },
  required: ['structure', 'tone', 'storytelling', 'relevance', 'employer_alignment', 'overall_summary'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { raw_text, target_role, target_company, job_description } = await req.json()
    if (!raw_text || raw_text.trim().length < 50) {
      return jsonResponse({ error: 'Paste the full text of your cover letter to review.' }, 422)
    }

    const lengthError = checkLengths([
      ['Cover letter text', raw_text, LIMITS.PASTE_DOC],
      ['Target role', target_role, LIMITS.SHORT],
      ['Target company', target_company, LIMITS.SHORT],
      ['Job description', job_description, LIMITS.PASTE_JD],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    // No stored document here — a pasted letter carries only what the form
    // gave us, so the target role is the industry signal when nothing else is.
    const target = await fetchCareerTarget(supabase, user.id)
    const industryCtx = await resolveIndustryContext(
      supabase,
      target?.target_industry || target_role,
      target?.target_course,
    )

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT}\n\n${industryCtx.promptBlock}`,
      userContent: JSON.stringify({
        letter_text: raw_text,
        target_role: target_role || null,
        target_company: target_company || null,
        job_description: job_description || null,
        resolved_industry: industryCtx.industry,
        industry_intelligence: industryCtx.intelligence.map(i => ({ dimension: i.dimension, content: i.content })),
      }),
      toolName: 'submit_cover_letter_review',
      toolDescription: 'Submit the structured cover letter review.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 2048,
    })

    const { data: saved, error: insertErr } = await supabase
      .from('cover_letter_reviews')
      .insert([{ user_id: user.id, raw_text, target_role: target_role || null, target_company: target_company || null, report: result }])
      .select()
      .single()
    if (insertErr) throw insertErr

    return jsonResponse({ review: saved })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
