import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'
import { CORE_COMPETENCIES, STRENGTHS_BASED_FORMAT_NOTE, STAR_TIMING_GUIDANCE } from '../_shared/competencyBank.ts'
import { fetchCompetencyExamples, citableSources } from '../_shared/exampleLibrary.ts'
import { ANTI_GENERIC_RULE } from '../_shared/antiGeneric.ts'
import { ANTI_HALLUCINATION_RULE, NON_TRADITIONAL_EVIDENCE_RULE, realExamplesRule, HANDLER_NOTES_DESCRIPTION } from '../_shared/coreRules.ts'
import { LIMITS, checkLengths, checkRequired } from '../_shared/fieldLimits.ts'
import { fetchCareerTarget, fetchCareerProfile, profileNarrative, experienceNarrative, PROFILE_CONTEXT_RULE } from '../_shared/careerProfile.ts'
import { resolveIndustryContext, withIndustryHandlerNote } from '../_shared/industryContext.ts'

/**
 * Interview format varies more by field than almost anything else the platform
 * generates for, and preparing for the wrong format is worse than not preparing
 * — a candidate rehearsing STAR stories for a whiteboard round wastes the run-up.
 */
const INTERVIEW_FORMAT_BY_INDUSTRY: Record<string, string> = {
  'Business and Management':
    'Expect an online aptitude or situational-judgement stage before or alongside the interview itself, not only at the end of the process — a strong later-round performance does not recover a weak aptitude score. The interview stage is typically competency-based, sometimes within a wider assessment centre, and probes commercial awareness of the specific employer directly: its market, competitors, and recent results, not the sector in general.',
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
  'Agriculture and Veterinary':
    'Expect scenario-based clinical or animal-husbandry questions probing judgement under uncertainty (what would you do if a case didn\'t match the textbook presentation), alongside direct questions on registration status (VCI, or progress toward it) and scope of practice. Farm and advisory roles probe practical, hands-on decision-making over theory.',
  'Beauty, Hairdressing and Aesthetics':
    'Expect a practical trial or "model" element — a live cut, colour, or treatment performed on the day — alongside a portfolio walkthrough. Be ready to talk through technique choices and product reasoning, not just show the finished result.',
  'Real Estate and Property':
    'Expect scenario-based negotiation questions (a difficult vendor, a disputed valuation) and direct questions on PSRA licensing status or the pathway toward it. Local market knowledge — actual recent comparable sales or rents — is frequently tested directly rather than assumed.',
  'Aviation and Logistics':
    'Pilot-track interviews include a technical and simulator-based assessment stage alongside a panel interview, testing decision-making under pressure as much as raw knowledge. Logistics and transport roles are more scenario-based — a disrupted schedule or a compliance gap — probing operational judgement and, where relevant, named certifications (CPC, ADR, DGSA).',
  'Skilled Trades and Apprenticeships':
    'Expect direct questions on the actual trade, phase reached, and registration pathway (Safe Electric, RGII) rather than abstract competency questions. For an apprenticeship application itself, a practical or aptitude test alongside the interview is common; for a qualified role, expect questions probing real on-site problem-solving, not theory recall.',
  'Insurance and Actuarial':
    'Insurance advisory interviews probe Minimum Competency Code awareness and product knowledge directly — expect a question on what qualification stage you are at and why it matters. Actuarial interviews are technical and numerate, often including a case-style problem worked through live, alongside direct questions on exam progress and exemptions.',
  'Retail and E-commerce':
    'Expect scenario-based questions (a difficult customer, a stock discrepancy) and direct questions on commercial metrics — conversion rate, average transaction value — over abstract competency questions. Many retail interviews include or are preceded by a trial shift or working interview.',
  'Environmental Sustainability and Renewable Energy':
    'Expect direct questions distinguishing regulatory bodies (EPA vs SEAI) and probing whether impact claims are properly baselined — vague "green" language is tested for directly. Technical roles may include a case study on a real compliance or impact-measurement scenario.',
  'Human Resources and People Operations':
    'Expect scenario-based questions (a difficult employee relations situation, a hiring-process bottleneck) and direct questions on CIPD qualification level rather than abstract competency questions alone. Values and confidentiality judgement are probed directly, since HR roles handle sensitive information as standard.',
  'Food and Beverage Manufacturing':
    'Expect direct questions on food safety and quality standards (HACCP, BRCGS, or the site\'s specific certification) and scenario-based questions on a production or compliance problem. Technical and quality roles may include a case study on a real audit or non-conformance scenario.',
  'Non-Profit and NGO Management':
    'Expect direct questions on governance and accountability (Charities Regulator registration, the Governance Code) alongside mission-fit questions — panels probe for operational substance behind stated passion for the cause, not passion alone. Fundraising and programme roles often include a scenario question on a real donor or beneficiary situation.',
  'Telecommunications and Utilities':
    'Expect scenario-based technical questions (a network fault, a compliance documentation check) and direct questions distinguishing the relevant regulator (ComReg for telecoms, the CRU for utilities) — conflating the two is a specifically watched-for gap. Field and network roles may include a practical or technical assessment stage.',
  'Pharmaceuticals, Biotechnology and Medical Devices':
    'Expect direct questions on GMP and the specific regulatory framework relevant to the role (HPRA and Manufacturer\'s Authorisation for medicinal products, EU MDR 2017/745 and ISO 13485 for medical devices) — conflating the two regulatory pathways is a specifically watched-for gap. Scenario-based questions on a real deviation, CAPA, or audit-observation situation are common for quality and manufacturing roles.',
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

UNCERTAINTY FLAG — if unsure_about is provided, the person told us themselves what they're unsure about for this interview (a format they've never done, a weak area, a gap they don't know how to field). Do your best with it, but always add a handler_notes entry naming it so the reviewing Handler double-checks that specific area — never silently guess past it.

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
    handler_notes: { type: 'array', items: { type: 'string' }, description: HANDLER_NOTES_DESCRIPTION },
  },
  required: ['likely_questions', 'company_research_prompts', 'confidence_tips', 'handler_mock_rubric', 'handler_notes'],
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

    const input = pack.input || {}
    const lengthError = checkLengths([
      ['Target role', targetRole, LIMITS.SHORT],
      ['Target company', targetCompany, LIMITS.SHORT],
      ['Industry', input.industry, LIMITS.SHORT],
      ['Background summary', input.background_summary, LIMITS.LONG],
      ["What you're unsure about", input.unsure_about, LIMITS.LONG],
    ])
    if (lengthError) return jsonResponse({ error: lengthError }, 422)

    const { data: stories } = await supabase
      .from('evidence_bank_stories')
      .select('title, situation, task, action, result, competency_tags')
      .eq('user_id', user.id)

    const backgroundSummary = input.background_summary || experienceNarrative(profile) || null

    const industryCtx = await resolveIndustryContext(
      supabase,
      input.industry || target?.target_industry || targetRole,
      target?.target_course,
      target?.industry_details,
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
        unsure_about: input.unsure_about || null,
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
