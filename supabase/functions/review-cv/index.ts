import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { bankForResolvedIndustry, extractJdKeywords, scoreKeywordMatch } from '../_shared/atsKeywords.ts'
import { resolveIndustryContext } from '../_shared/industryContext.ts'
import { citableSources } from '../_shared/exampleLibrary.ts'
import { LIMITS, checkLengths } from '../_shared/fieldLimits.ts'

const SYSTEM_PROMPT = `You are an expert CV reviewer combining the judgement of a recruiter, an ATS specialist, and a university careers advisor. You are reviewing a CV someone already has — not writing one from scratch.

Real recruiter data on why CVs get rejected, which you should apply directly:
- 58% of hiring managers reject on spelling/grammar errors alone — flag every one you find, don't just say "check for typos"
- 36% of rejections are for being too generic / not tailored to the role — call this out specifically if the CV reads as generic
- 70% of ATS-stage rejections are formatting problems: tables, columns, text boxes, graphics, unusual fonts — flag any of these if present
- Bullets that list responsibilities instead of quantified achievements are a major weakness — flag every duty-only bullet you find and suggest how it could show impact instead (without inventing a number that isn't implied by the text)

STRUCTURE — give specific, actionable findings tied to actual text in the CV, never generic advice like "add more keywords". Quote or closely paraphrase the actual weak bullet, then say what's wrong and how to fix it.

FIRST CVs AND STUDENT CVs — many CVs you review will have little or no formal work experience, and will lead on education, projects, societies, volunteering, or part-time work. That is a legitimate, correct structure at this career stage, not a defect. Never list "lacks work experience" or "no professional experience" as a weakness — it is not something the person can fix by editing, and saying it is the fastest way to make a first-time job seeker abandon a CV that is actually fine. Review what IS there, at the same standard you would apply to any CV: are the project and activity bullets specific, evidenced, and written as achievements rather than duties? Do flag the opposite failure — student experience inflated with job titles or seniority it did not have.

If a target role or job description was provided, assess tailoring against it specifically. If not, assess general CV quality and flag that keyword-gap analysis needs a target role/JD to be meaningful.

Never fabricate a numeric score without ties to what you actually found — every score must be justified by the findings you list.

INDUSTRY INTELLIGENCE — you may be given industry_intelligence: real findings on how this specific industry actually screens candidates, sourced from that industry's own recruiters or professional bodies. Check the CV against every red_flag entry specifically and name any that apply in industry_red_flags, quoting the exact offending text. Check must_have / real_entity entries too — if the CV is missing a credential this industry specifically expects (and the person plausibly should have it, e.g. applying to law without ever mentioning FE-1/PPC status), flag it.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' }, description: 'Specific, quoting or paraphrasing the actual CV text where possible' },
    formatting_issues: { type: 'array', items: { type: 'string' } },
    generic_language_flags: { type: 'array', items: { type: 'string' }, description: 'Bullets or phrases that read as generic/templated rather than specific to this person' },
    duty_vs_achievement_flags: { type: 'array', items: { type: 'string' }, description: 'Bullets that describe a responsibility rather than a quantified/concrete achievement' },
    spelling_grammar_issues: { type: 'array', items: { type: 'string' } },
    industry_red_flags: { type: 'array', items: { type: 'string' }, description: "Specific matches against this industry's known red flags, quoting the offending text — empty if none found or no industry given" },
    overall_summary: { type: 'string', description: '2-3 sentence overall verdict' },
  },
  required: ['strengths', 'weaknesses', 'formatting_issues', 'generic_language_flags', 'duty_vs_achievement_flags', 'spelling_grammar_issues', 'industry_red_flags', 'overall_summary'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { supabase, user } = await requireUser(req)
    const { raw_text, target_role, job_description, industry } = await req.json()
    if (!raw_text || raw_text.trim().length < 50) {
      return jsonResponse({ error: 'Paste the full text of your CV (at least a few sentences) to review.' }, 422)
    }

    const lengthError = checkLengths([
      ['CV text', raw_text, LIMITS.PASTE_DOC],
      ['Target role', target_role, LIMITS.SHORT],
      ['Industry', industry, LIMITS.SHORT],
      ['Job description', job_description, LIMITS.PASTE_JD],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    // The role is a usable fallback signal when no industry was given — a
    // pasted CV often names the role and nothing else.
    const industryCtx = await resolveIndustryContext(supabase, industry || target_role, null)
    const intelligence = industryCtx.intelligence

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT}\n\n${industryCtx.promptBlock}`,
      userContent: JSON.stringify({
        cv_text: raw_text,
        target_role: target_role || null,
        job_description: job_description || null,
        resolved_industry: industryCtx.industry,
        industry_intelligence: intelligence.map(i => ({ dimension: i.dimension, content: i.content })),
      }),
      toolName: 'submit_cv_review',
      toolDescription: 'Submit the structured CV review findings.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 3072,
    })

    // Deterministic scoring, same 40/35/25 weighting as CV Review's real-world
    // ATS-checker source — kept separate from the model's qualitative findings above.
    const keywords = job_description
      ? extractJdKeywords(job_description, industryCtx.industry)
      : bankForResolvedIndustry(industryCtx.industry)
    const { score: keywordScore, matched, missing } = scoreKeywordMatch(raw_text.toLowerCase(), keywords)

    const roleTerms = (target_role || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
    const roleAlignmentScore = roleTerms.length === 0
      ? null // genuinely can't score alignment to a role that wasn't given
      : Math.round((roleTerms.filter((t: string) => raw_text.toLowerCase().includes(t)).length / roleTerms.length) * 100)

    // Unlike generate-cv — which validates its own render template structurally via
    // _shared/atsFormat.ts — a pasted CV arrives as plain text with its original
    // layout already stripped. We genuinely cannot inspect whether the source
    // document used tables or columns, so this score is derived from what the model
    // can actually detect in the text, and nothing is claimed beyond that.
    const formattingPenalty = (result.formatting_issues as unknown[] || []).length * 15
    const formattingScore = Math.max(0, 100 - formattingPenalty)

    const scorableParts = [
      { score: keywordScore, weight: 0.4 },
      ...(roleAlignmentScore !== null ? [{ score: roleAlignmentScore, weight: 0.35 }] : []),
      { score: formattingScore, weight: 0.25 },
    ]
    const totalWeight = scorableParts.reduce((s, p) => s + p.weight, 0)
    const overall = Math.round(scorableParts.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight)

    const report = {
      ...result,
      benchmarked_against: citableSources(intelligence),
      ats_report: {
        overall_score: overall,
        keyword_match_score: keywordScore,
        role_alignment_score: roleAlignmentScore,
        formatting_score: formattingScore,
        matched_keywords: matched,
        missing_keywords: missing.slice(0, 12),
        scored_against: job_description ? 'job_description' : (target_role ? 'target_role' : 'general_only'),
        note: roleAlignmentScore === null ? 'No target role given — role alignment not scored.' : null,
      },
    }

    const { data: saved, error: insertErr } = await supabase
      .from('cv_reviews')
      .insert([{ user_id: user.id, raw_text, target_role: target_role || null, job_description: job_description || null, report }])
      .select()
      .single()
    if (insertErr) throw insertErr

    return jsonResponse({ review: saved })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
