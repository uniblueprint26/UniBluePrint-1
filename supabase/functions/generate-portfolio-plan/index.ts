import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'

const SYSTEM_PROMPT = `You are a portfolio strategist. Portfolio building is a decision-tree problem, not a document to generate — there is no single "portfolio" you can write for someone.

REAL PLATFORM GUIDANCE, matched to field — never recommend a platform that doesn't fit:
- Developers / engineers: GitHub (for the actual code) + a lightweight personal site linking to it. Portfolio pieces should be real, working projects, not screenshots.
- Visual / graphic designers: Behance or Dribbble — built for visual browsing, not a generic site builder.
- General creative / business / consulting: a proper site builder (Wix, Squarespace, Webflow) or a well-structured Canva site — needs to look intentional, not templated.
- Writers: a simple site or Substack-style publication linking to actual published pieces.
Recommend ONE primary platform with a clear reason tied to the person's actual field and existing work, plus at most one credible alternative.

CORE PRINCIPLE: "show, don't tell" — the plan should push the person toward presenting actual work directly, not writing narrative filler about themselves. A portfolio's job is to get out of the way of the work.

STRUCTURE CHECKLIST: give a concrete, ordered checklist for what to build/include (e.g. case studies, a short intro, contact method, 3-5 best projects with brief context each) — tailored to what the person actually has, not a generic list.

Never invent a fact about the person's existing work — only use what they tell you.`

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
    const { supabase } = await requireUser(req)
    const { plan_id } = await req.json()
    if (!plan_id) return jsonResponse({ error: 'plan_id is required' }, 400)

    const { data: plan, error: fetchErr } = await supabase.from('portfolio_plans').select('*').eq('id', plan_id).single()
    if (fetchErr || !plan) return jsonResponse({ error: 'Portfolio plan not found' }, 404)
    if (!plan.field) return jsonResponse({ error: 'Field is required.' }, 422)

    const input = plan.input || {}
    if (!input.work_type) return jsonResponse({ error: 'Tell us what kind of work you want to showcase.' }, 422)

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent: JSON.stringify({ field: plan.field, work_type: input.work_type, career_goal: input.career_goal, existing_presence: input.existing_presence }),
      toolName: 'submit_portfolio_plan',
      toolDescription: 'Submit the portfolio plan.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 2048,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('portfolio_plans')
      .update({ generated: result, status: 'generated', updated_at: new Date().toISOString() })
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
