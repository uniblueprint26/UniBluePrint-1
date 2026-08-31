import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { CORE_COMPETENCIES, STRENGTHS_BASED_FORMAT_NOTE, STAR_TIMING_GUIDANCE } from '../_shared/competencyBank.ts'
import { fetchCompetencyExamples, citableSources } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import { ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE, realExamplesRule } from '../_shared/coreRules.ts'
import { LIMITS, checkLengths, checkRequired } from '../_shared/fieldLimits.ts'
import { fetchCareerTarget, fetchCareerProfile, profileNarrative, experienceNarrative, PROFILE_CONTEXT_RULE } from '../_shared/careerProfile.ts'
import { resolveIndustryContext, withIndustryHandlerNote } from '../_shared/industryContext.ts'

/**
 * Interview format varies more by field than almost anything else the platform
 * generates for, and preparing for the wrong format is worse than not preparing
 * — a candidate rehearsing STAR stories for a whiteboard round wastes the run-up.
 */
const INTERVIEW_FORMAT_BY_INDUSTRY: Record<string, string> = {
  Engineering:
    'Expect a technical round: design reasoning, calculations talked through aloud, and questions on named tools and standards. Whiteboard or shared-screen problem solving is common. Prepare to narrate the trade-off, not just the answer.',
  'Technology and Software':
    'Expect a live coding or system-design round alongside behavioural questions. Thinking aloud is assessed as much as the solution. Prepare to discuss any project on the CV in depth, including what you would change now.',
  'Healthcare and Nursing':
    'Expect a values-based panel, often with a clinical scenario. Answers should show patient-centred reasoning, escalation judgement, awareness of scope of practice, and honest reflection. Panels frequently include a clinical manager and a practice educator.',
  'Finance and Accounting':
    'Expect numerical reasoning, a case study or commercial-awareness discussion, and questions probing why this firm specifically. Be ready to discuss a recent story affecting the firm or its clients.',
  Law:
    'Expect scenario-based legal reasoning and precision-under-pressure questions. Structure the analysis before the conclusion. Commercial awareness of the firm\'s practice areas and clients is assessed directly.',
  'Education and Teaching':
    'Expect questions framed around classroom practice, often with a teaching demonstration or a discussion of a sample lesson. Differentiation, inclusion, assessment, and behaviour management come up in almost every panel.',
  'Public Sector and Civil Service':
    'Expect a panel scored against the published Civil Service Capability Framework for the grade (four capabilities at Executive Officer level, each with its own sub-dimensions). Answers are marked per capability, so name the one being evidenced and keep to one bounded example each.',
  'Social Work and Community':
    'Expect values-based questioning with risk and safeguarding scenarios. Panels probe boundaries, use of supervision, and anti-discriminatory practice.',
  'Creative and Media':
    'Expect a portfolio walkthrough as the core of the interview. Be ready to explain the brief, constraint, and your specific contribution on each piece, and to take critique on the work in the room.',
  'Marketing and Communications':
    'Expect a campaign or case discussion and questions on measurement. Be ready to quote baselines alongside results and to explain what you would do differently with the same budget.',
  'Construction and Architecture':
    'Expect project-based questioning anchored to stage, value and your own role. Site-based roles will probe safety awareness directly.',
  'Science and Research':
    'Expect a technical discussion of your project or thesis: method, controls, and limitations. Industry roles will probe GMP, documentation practice, and quality mindset.',
  'Hospitality and Tourism':
    'Expect service-scenario questions and, for many roles, a trial shift. Volume, standard, and composure under pressure are what panels are testing.',
  'Sports and Fitness':
    'Expect a practical coaching or programming task alongside the interview, plus questions on safeguarding and scope of practice.',
}

const SYSTEM_PROMPT = `You are building a personalised interview preparation pack.

INTERVIEW TYPES — these are genuinely different formats, not the same prep with a different label:
- BEHAVIOURAL / COMPETENCY: past-example questions, answered in STAR. ${STAR_TIMING_GUIDANCE}
- TECHNICAL: role-specific problem-solving, not a personal story — give a preparation approach and what to research, not a fake worked answer to a technical problem you can't verify.
- STRENGTHS-BASED: ${STRENGTHS_BASED_FORMAT_NOTE} Prepare the candidate to talk genuinely about what energises them, not rehearsed stories.
- BLENDED: a realistic mix of all of the above, common at large graduate employers and the public sector — flag which questions are which type so the candidate knows how to answer each differently.

EVIDENCE BANK: for behavioural/competency questions, use the candidate's own evidence bank stories where they genuinely fit — never invent a story. If no story fits a likely question, say so in missing_evidence rather than fabricating one. Cover the core competencies employers actually ask about: ${CORE_COMPETENCIES.join(', ')}.

EMPTY OR THIN EVIDENCE BANK: if the evidence bank is empty or has only one or two stories, still produce the full set of likely questions — the pack's value shifts from model answers to preparation coaching. For each behavioural question without a matching story, leave model_answer empty, state honestly in missing_evidence what kind of story is needed, and use preparation_approach to coach the candidate on where to mine one from their real life: a group coursework project, a society or team role, a part-time job, volunteering. These are full-strength interview evidence at graduate level, not placeholders for "real" experience. Never fill the gap with an invented story.

COMPANY RESEARCH: give the candidate specific things to actually go find out (recent news, values, what the interviewer likely cares about) — never assert something you don't know to be true about the specific company, since your knowledge of current events may be stale. Frame these as research prompts ("look up X"), not as facts you're telling them about the company.

${ANTI_HALLUCINATION_RULE} For this service specifically: never invent a fact about the company either — your knowledge of any given employer may be stale or wrong.

${PROFILE_CONTEXT_RULE}

${NON_TRADITIONAL_EVIDENCE_RULE}

HANDLER MOCK RUBRIC: produce a three-criterion scoring rubric (First impression / Poise & delivery / Content) for the Handler to use in a live mock session, mirroring how university career-services offices actually score mock interviews — 1/3/5 scale per criterion, with a one-line description of what's assessed.

${realExamplesRule('real, published, sourced STAR answers from university career services. Only the candidate\'s own evidence bank stories may be used as the substance of a model answer')}

${ANTI_GENERIC_RULE}`

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

    const [profile, target] = await Promise.all([
      fetchCareerProfile(supabase, user.id),
      fetchCareerTarget(supabase, user.id),
    ])
    const targetRole = pack.target_role || target?.target_role || null
    const targetCompany = pack.target_company || target?.target_company || null

    const missing = checkRequired([['Target role', targetRole]])
    if (missing) return jsonResponse({ error: missing }, 422)

    const lengthError = checkLengths([
      ['Target role', targetRole, LIMITS.SHORT],
      ['Target company', targetCompany, LIMITS.SHORT],
      ['Background summary', (pack.input || {}).background_summary, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const { data: stories } = await supabase
      .from('evidence_bank_stories')
      .select('title, situation, task, action, result, competency_tags')
      .eq('user_id', user.id)

    const backgroundSummary = (pack.input || {}).background_summary || experienceNarrative(profile) || null

    const industryCtx = await resolveIndustryContext(
      supabase,
      target?.target_industry || targetRole,
      target?.target_course,
    )
    const examples = await fetchCompetencyExamples(supabase, CORE_COMPETENCIES, 3, industryCtx.industry)
    const format = INTERVIEW_FORMAT_BY_INDUSTRY[industryCtx.industry]
    const formatRule = format
      ? `\n\nINTERVIEW FORMAT IN THIS FIELD — ${industryCtx.industry}\n${format}\nThe predicted questions must reflect this format. Do not pad the pack with behavioural questions for a field that interviews technically, or vice versa — and where the format includes a practical task, say so explicitly so the candidate prepares for it.`
      : ''

    const result = await callClaudeForStructuredOutput({
      system: `${SYSTEM_PROMPT}${formatRule}\n\n${industryCtx.promptBlock}`,
      userContent: JSON.stringify({
        target_company: targetCompany,
        target_role: targetRole,
        resolved_industry: industryCtx.industry,
        interview_type: pack.interview_type,
        background_summary: backgroundSummary,
        evidence_bank: stories || [],
        career_profile_context: profileNarrative(profile),
        real_examples: examples.map(e => ({ competency: e.competency_tag, excerpt: e.excerpt, why_it_works: e.why_it_works })),
      }),
      toolName: 'submit_interview_prep',
      toolDescription: 'Submit the interview preparation pack.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const resultWithBenchmark = {
      ...withIndustryHandlerNote(result, industryCtx),
      benchmarked_against: citableSources([...examples, ...industryCtx.intelligence]),
    }

    const { data: updated, error: updateErr } = await supabase
      .from('interview_prep_packs')
      .update({ generated: resultWithBenchmark, status: 'generated', updated_at: new Date().toISOString() })
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
