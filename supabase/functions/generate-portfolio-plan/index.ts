import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE } from '../_shared/coreRules.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import { LIMITS, checkLengths, checkRequired } from '../_shared/fieldLimits.ts'
import { fetchCareerTarget, fetchCareerProfile, profileNarrative, PROFILE_CONTEXT_RULE } from '../_shared/careerProfile.ts'
import { resolveIndustryContext, withIndustryHandlerNote } from '../_shared/industryContext.ts'

/**
 * What a portfolio even *is* changes completely by field, so a generic
 * "build a portfolio site" plan is close to useless. These are the platform and
 * artefact conventions per field, applied on top of whatever the intelligence
 * table carries.
 */
const PORTFOLIO_BY_INDUSTRY: Record<string, string> = {
  'Technology and Software':
    'GitHub is the portfolio. Pinned repositories with real READMEs, at least one deployed and reachable project with a live URL, commit history that shows sustained work rather than a single dump, and a short technical write-up per project explaining the problem and the trade-off taken. A personal site is optional; a dead GitHub is disqualifying.',
  'Creative and Media':
    'Behance, Dribbble, or a self-hosted site, plus a PDF or physical portfolio for client and interview settings. Curate hard — six strong pieces beat twenty mixed ones, because the weakest piece sets the perceived ceiling. Each piece needs the brief, the constraint, and the outcome, not just the artwork.',
  'Science and Research':
    'A publications and outputs list in a citable format, conference posters archived as PDFs, and a described final-year project or thesis with hypothesis, method, and result. ORCID iD where held. Lab technique inventory as a standalone section.',
  'Marketing and Communications':
    'Campaign case studies with baseline, intervention, and measured result. Published content and secured coverage linked directly. Platform certifications listed. One or two deep case studies outperform a list of logos.',
  'Construction and Architecture':
    'A project portfolio with drawings, models, and site photography, organised by project and RIBA/RIAI work stage. State your own role on each project explicitly — reviewers assume the whole sheet is yours otherwise. BIM outputs where relevant.',
  Engineering:
    'A project and placement portfolio: CAD or simulation outputs, calculations, and testing results, each with the tool named and your specific contribution isolated. Placement reports where they can be shared.',
  'Education and Teaching':
    'A teaching portfolio: sample lesson plans and schemes of work, differentiated resources you produced, school placement reports, and evidence of assessment practice. Anonymise all pupil material.',
  'Sports and Fitness':
    'Programme design samples, client or athlete outcomes with honest timeframes and starting points, coaching qualifications with awarding bodies, and video of coaching practice where consent allows.',
}

const SYSTEM_PROMPT = `You are a portfolio strategist. Portfolio building is a decision-tree problem, not a document to generate — there is no single "portfolio" you can write for someone.

REAL PLATFORM GUIDANCE, matched to field — never recommend a platform that doesn't fit:
- Developers / engineers: GitHub (for the actual code) + a lightweight personal site linking to it. Portfolio pieces should be real, working projects, not screenshots.
- Visual / graphic designers: Behance or Dribbble — built for visual browsing, not a generic site builder.
- General creative / business / consulting: a proper site builder (Wix, Squarespace, Webflow) or a well-structured Canva site — needs to look intentional, not templated.
- Writers: a simple site or Substack-style publication linking to actual published pieces.
Recommend ONE primary platform with a clear reason tied to the person's actual field and existing work, plus at most one credible alternative.

CORE PRINCIPLE: "show, don't tell" — the plan should push the person toward presenting actual work directly, not writing narrative filler about themselves. A portfolio's job is to get out of the way of the work.

STRUCTURE CHECKLIST: give a concrete, ordered checklist for what to build/include (e.g. case studies, a short intro, contact method, 3-5 best projects with brief context each) — tailored to what the person actually has, not a generic list.

NO PROFESSIONAL WORK YET: for a student or first-time job seeker, coursework projects, society work, hackathon builds, and personal projects ARE the portfolio — that's the normal starting point, not a compromise. Plan around presenting that work at its best (clean write-ups, honest framing of what was a college project) rather than suggesting they wait until they have "real" work. If they genuinely have very few pieces, the checklist's first items should be about creating one or two small, real, finishable pieces — never about presenting thin work as more than it is.

${ANTI_HALLUCINATION_RULE}

${PROFILE_CONTEXT_RULE}

${NON_TRADITIONAL_EVIDENCE_RULE}

${ANTI_GENERIC_RULE}`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    recommended_platform: { type: 'string' },
    why_this_platform: { type: 'string' },
    alternative_platform: { type: 'string' },
    structure_checklist: { type: 'array', items: { type: 'string' } },
    presentation_tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['recommended_platform', 'why_this_platform', 'alternative_platform', 'structure_checklist', 'presentation_tips'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { supabase, user } = await requireUser(req)
    const { plan_id } = await req.json()
    if (!plan_id) return jsonResponse({ error: 'plan_id is required' }, 400)

    const { data: plan, error: fetchErr } = await supabase.from('portfolio_plans').select('*').eq('id', plan_id).single()
    if (fetchErr || !plan) return jsonResponse({ error: 'Portfolio plan not found' }, 404)

    const [profile, target] = await Promise.all([
      fetchCareerProfile(supabase, user.id),
      fetchCareerTarget(supabase, user.id),
    ])
    const input = plan.input || {}
    const field = plan.field || target?.target_industry || null

    const missing = checkRequired([
      ['Field', field],
      ['What kind of work you want to showcase', input.work_type],
    ])
    if (missing) return jsonResponse({ error: missing }, 422)

    const lengthError = checkLengths([
      ['Field', field, LIMITS.SHORT],
      ['Career goal', input.career_goal, LIMITS.MEDIUM],
      ['Existing presence', input.existing_presence, LIMITS.MEDIUM],
      ['Work type', input.work_type, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const careerGoal = input.career_goal || profile?.goals || null

    const industryCtx = await resolveIndustryContext(supabase, field, target?.target_course)
    const portfolioConvention = PORTFOLIO_BY_INDUSTRY[industryCtx.industry]
    const portfolioRule = portfolioConvention
      ? `\n\nPORTFOLIO CONVENTION FOR THIS FIELD — ${industryCtx.industry}\n${portfolioConvention}\n\nRecommend against this convention. If the student's existing presence already partly meets it, build on what they have rather than starting them over.`
      : ''

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT}${portfolioRule}\n\n${industryCtx.promptBlock}`,
      userContent: JSON.stringify({
        field, resolved_industry: industryCtx.industry,
        work_type: input.work_type, career_goal: careerGoal, existing_presence: input.existing_presence,
        career_profile_context: profileNarrative(profile),
      }),
      toolName: 'submit_portfolio_plan',
      toolDescription: 'Submit the portfolio plan.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 2048,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('portfolio_plans')
      .update({ generated: withIndustryHandlerNote(result, industryCtx), status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', plan_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return jsonResponse({ plan: updated })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
