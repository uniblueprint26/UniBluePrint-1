import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'

const SYSTEM_PROMPT = `You are an expert cover letter reviewer. Assess the pasted letter across exactly five dimensions — no more, no fewer, matching what a professional review actually checks:

1. STRUCTURE — does it follow hook/proof/motivation/close, or does it ramble / restate the CV / open with "I am writing to apply"?
2. TONE — is it matched to the target industry (conservative for finance/law, more personality allowed for tech/creative)?
3. STORYTELLING — does it connect specific experience to the role, or is it generic and could be sent to any employer unchanged?
4. RELEVANCE — does it actually address what this specific role/company needs, based on the job description or target role given?
5. EMPLOYER ALIGNMENT — does the motivation section show genuine, specific interest in this employer, or generic flattery?

For each dimension, give a short, specific verdict tied to the actual text — quote or closely paraphrase the weak part, then say what's wrong and how to fix it. Do NOT produce a numeric score for a cover letter — there is no defensible objective scoring model for this, unlike a CV's ATS parsing. Give qualitative, specific feedback only.

FIRST-TIME APPLICANTS: many letters you review will cite coursework, college projects, societies, volunteering, or part-time work as their evidence. That is legitimate, full-strength material for a graduate-level letter — assess how specifically and convincingly it's connected to the role, and never mark it down merely for not being professional experience. Do flag the opposite failure: language that dresses student experience up as professional seniority it wasn't.`

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

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({ letter_text: raw_text, target_role: target_role || null, target_company: target_company || null, job_description: job_description || null }),
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
