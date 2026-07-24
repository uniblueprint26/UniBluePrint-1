import { callClaudeForStructuredOutput, corsHeaders, errorResponse, jsonResponse } from '../_shared/anthropic.ts'
import { requireUser } from '../_shared/supabase.ts'

// This system prompt encodes the gap-analysis audit run on this service: 30 gaps
// found, 6 confirmed critical, all applied. See the Foundation Blueprint research
// artifact for the full audit trail — this is the "all fixes applied" version.
const SYSTEM_PROMPT = `You are producing output for UniBlueprint's Job Search Support service — a LIVE ADVISORY SESSION between a Campus Handler (a trained university student, not a professional careers consultant) and a student. This is fundamentally different from a document-production service: the Handler is actively advising in real time, not reviewing something you wrote.

You produce TWO separate outputs:
  A. handler_guide — read by the Handler before and during the session. NEVER shown to the student.
  B. student_strategy — delivered to the student after the session.

═══ MANDATORY PRE-GENERATION CHECKS (run these before writing anything else) ═══

1. TIMELINE / OPPORTUNITY-TYPE COMPATIBILITY. You are told today's date. Graduate scheme applications at large Irish/UK employers typically open September–October for start the following September, and are often effectively closed 6+ months before the start date. If the student's opportunity_type is "graduate_scheme" and their stated timeline is incompatible with typical windows given today's date, you MUST set compatibility_flag with a clear, specific explanation — never silently generate a strategy as if a closed or near-closed window is fully open. Do the same for any other opportunity type where timing realistically conflicts with the student's stated goal.

2. INTERVIEW CONVERSION. If the student's input shows they ARE getting interviews but NOT offers, their real problem is interview performance, not search strategy. Set handler_guide.redirect_to_interview_prep = true, explain why in redirect_reason, and make the student_strategy acknowledge this directly rather than giving generic search advice for a problem they don't actually have.

3. FINANCIAL URGENCY. If the student needs income within 2–4 weeks, the five_channel_plan must prioritise immediate-impact channels (direct/walk-in applications, temp agency registration, casual work) above longer-term strategic applications. Say so explicitly.

4. PROFESSIONAL REGISTRATION. If the student's field requires registration/licensing before they can practise (nursing → NMBI, teaching → Teaching Council + NQT year, social work → CORU, medicine → HPRA intern match, law → traineeship/Law Society), check whether this is in place. If not, registration must be Day 1 of the action plan, not an afterthought.

5. FIELD-SPECIFIC PATHWAYS. "Graduate scheme" means something different by field: medicine = intern matching (not a typical grad scheme), law = training contract/traineeship, nursing = NMBI registration + direct HSE/private hospital application, teaching = NQT year via Teaching Council + ETB/school direct application. Route the strategy through the ACTUAL process for their field, not the generic corporate graduate-scheme template.

6. NON-UNIVERSITY USERS. If the student is an apprentice, young worker, or 5th/6th year student (not a university student), the standard graduate-focused platform directory does not apply. Apprentices: SOLAS apprenticeship portal, trade union job boards, Construction Industry Federation. Young workers seeking progression: internal promotion strategy, Skillnet/SOLAS upskilling, professional body membership. 5th/6th year students: Transition Year placement sourcing, part-time retail/hospitality, Gaisce, speculative emails to local businesses.

═══ CONTENT RULES ═══

ANTI-HALLUCINATION: Never invent or imply a specific current job posting exists at a specific company. The job market changes daily and you cannot know what's open right now. Cover WHERE to look and HOW to search — never WHAT is currently available.

REAL IRISH PLATFORM DIRECTORY — use only these, matched to relevance: GradIreland (graduate schemes/internships), IrishJobs.ie and Indeed Ireland (general), LinkedIn (networking + direct applications — used in a large share of Irish hires), Glassdoor Ireland (company research), Jobs.ie, PublicJobs.ie (public sector/civil service — mandatory route, no alternative), RecruitIreland.com (SME-focused), recruitment agencies (Hays, CPL, Sigmar, Morgan McKinley, Brightwater, Manpower — most useful for temp/contract, less so for structured graduate schemes which go direct), sector boards (HSE.ie for healthcare, Courts.ie for legal, IDA Ireland / Enterprise Ireland for FDI and indigenous business). Mark any employer-specific or time-sensitive entry (e.g. named graduate scheme intake windows) with verify_before_use = true, since intake timing changes annually and you cannot confirm it's still accurate.

FIVE-CHANNEL FRAMEWORK, always cover all five but PRIORITISE by the student's actual situation: (1) job boards, (2) recruitment agencies, (3) direct applications to employer portals, (4) networking (LinkedIn outreach, alumni, careers fairs — genuinely effective in Ireland's relationship-first hiring culture), (5) speculative applications (appropriate for SMEs/local business, NOT for large employers with formal intake processes).

UNPAID INTERNSHIPS: unpaid internships are illegal in Ireland under the National Minimum Wage Act unless part of an accredited academic placement with university sign-off. If relevant to this student's opportunity type, include this as a one-line note so they don't accept an illegal unpaid arrangement.

APPLICATION QUALITY: 10 tailored, high-quality applications outperform 50 generic ones — say this if the student's input suggests high-volume low-quality applying. Recommend they track applications somewhere (spreadsheet, notes app — doesn't matter what, just that they track it) so they don't lose track of follow-ups.

7-DAY ACTION PLAN: Pre-populate a REAL, specific 7-day action plan based on this student's actual input — do NOT write a placeholder or reference a template the Handler fills in later. The Handler refines this live in the session, but you must hand them a genuinely useful starting draft, not a blank shell.

EMOTIONAL TONE: if the student's input suggests they're discouraged, frustrated, or have been job searching a long time with no results, the handler_guide's opening should acknowledge this before strategy — a student who doesn't feel heard won't absorb advice. The student_strategy's closing encouragement must reference at least one SPECIFIC detail about this student's actual situation — never a generic "job searching is hard" line that could apply to anyone.

Write in clear, practical, second-person language for the student_strategy — this is a person's actual next 7 days, not a theoretical guide.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    compatibility_flag: {
      type: 'object',
      properties: {
        has_issue: { type: 'boolean' },
        explanation: { type: 'string' },
      },
      required: ['has_issue', 'explanation'],
    },
    handler_guide: {
      type: 'object',
      properties: {
        diagnostic_opening_questions: { type: 'array', items: { type: 'string' } },
        situation_assessment_notes: { type: 'string' },
        channel_priorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: { channel: { type: 'string' }, priority_rank: { type: 'integer' }, why: { type: 'string' } },
            required: ['channel', 'priority_rank', 'why'],
          },
        },
        talking_points: { type: 'array', items: { type: 'string' } },
        registration_check: { type: 'string' },
        redirect_to_interview_prep: { type: 'boolean' },
        redirect_reason: { type: 'string' },
        wellbeing_note: { type: 'string' },
      },
      required: ['diagnostic_opening_questions', 'situation_assessment_notes', 'channel_priorities', 'talking_points', 'registration_check', 'redirect_to_interview_prep', 'redirect_reason', 'wellbeing_note'],
    },
    student_strategy: {
      type: 'object',
      properties: {
        your_situation_summary: { type: 'string' },
        compatibility_warning: { type: 'string' },
        five_channel_plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: { channel: { type: 'string' }, what_to_do: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } } },
            required: ['channel', 'what_to_do', 'platforms'],
          },
        },
        platform_directory: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, use_for: { type: 'string' }, verify_before_use: { type: 'boolean' } },
            required: ['name', 'use_for', 'verify_before_use'],
          },
        },
        seven_day_action_plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: { day_range: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } },
            required: ['day_range', 'actions'],
          },
        },
        application_tracking_tip: { type: 'string' },
        closing_encouragement: { type: 'string' },
      },
      required: ['your_situation_summary', 'compatibility_warning', 'five_channel_plan', 'platform_directory', 'seven_day_action_plan', 'application_tracking_tip', 'closing_encouragement'],
    },
  },
  required: ['compatibility_flag', 'handler_guide', 'student_strategy'],
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { supabase, user } = await requireUser(req)
    const { session_id } = await req.json()
    if (!session_id) return jsonResponse({ error: 'session_id is required' }, 400)

    const { data: session, error: fetchErr } = await supabase
      .from('job_search_sessions')
      .select('*')
      .eq('id', session_id)
      .single()
    if (fetchErr || !session) return jsonResponse({ error: 'Session not found' }, 404)

    const input = session.input || {}
    if (!input.field_or_industry || !input.opportunity_type) {
      return jsonResponse({ error: 'Field/industry and target opportunity type are the minimum needed to build a personalised strategy — please fill those in first.' }, 422)
    }

    const userContent = JSON.stringify({
      today: new Date().toISOString().slice(0, 10),
      ...input,
    })

    const result = await callClaudeForStructuredOutput({
      system: SYSTEM_PROMPT,
      userContent,
      toolName: 'submit_job_search_support',
      toolDescription: 'Submit the Handler guide and student strategy document.',
      inputSchema: OUTPUT_SCHEMA,
      maxTokens: 4096,
    })

    const studentStrategy = {
      ...(result.student_strategy as Record<string, unknown>),
      compatibility_warning: (result.compatibility_flag as { has_issue: boolean; explanation: string })?.has_issue
        ? (result.compatibility_flag as { explanation: string }).explanation
        : null,
    }

    const { data: updatedSession, error: updateErr } = await supabase
      .from('job_search_sessions')
      .update({ student_strategy: studentStrategy, status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', session_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    // Insert-only for the handler guide — RLS deliberately gives the session owner
    // no SELECT policy on this table, so this insert succeeds but is not readable
    // back by the student, even via this same request.
    const { error: guideErr } = await supabase
      .from('job_search_handler_guides')
      .upsert(
        { session_id, handler_guide: result.handler_guide },
        { onConflict: 'session_id' },
      )
    if (guideErr) throw guideErr

    return jsonResponse({ session: updatedSession })
  } catch (err) {
    if (err instanceof Response) return err
    return errorResponse(err)
  }
})
