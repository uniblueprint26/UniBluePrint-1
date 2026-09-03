import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { loadProfileDefaults } from '../../lib/careerProfile'
import { OPPORTUNITY_TYPES } from '../../lib/jobSearchConstants'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, ErrorBanner } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine, ChoiceGrid } from '../../components/foundation/QuestionFlowKit'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'
import JobSearchHandlerGuide from '../../components/handler/JobSearchHandlerGuide'

const OPPORTUNITY_TYPE_OPTIONS = OPPORTUNITY_TYPES.map(([value, label]) => ({ value, label }))
const URGENCY_OPTIONS = [
  { value: 'longer_runway', label: 'I have time to build a longer-term strategy' },
  { value: 'needs_income_2_4_weeks', label: 'I need income within the next 2–4 weeks' },
]
const INTERVIEW_CONVERSION_OPTIONS = [
  { value: 'no_responses', label: 'Not applied yet / no responses at all' },
  { value: 'interviews_no_offers', label: 'Getting interviews, but no offers' },
  { value: 'havent_applied', label: "Haven't started applying yet" },
]

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  field_or_industry: '', opportunity_type: '',
  has_no_experience: false,
  urgency: 'longer_runway',
  interview_conversion: 'no_responses', applications_so_far: '',
  location: '', timeline: '',
  cv_status: '', linkedin_status: '',
  professional_registration_status: '', non_university_type: '',
  unsure_about: '',
}

/**
 * Job Search Support's intake, rebuilt as a one-question-at-a-time
 * questionnaire — sixth Foundation Blueprint service on the QuestionFlow
 * pattern. Architecturally different from its siblings in two ways this
 * rebuild preserves exactly:
 *
 * 1. Unlike the other 8 generators, this one is never gated on Handler
 *    approval — the strategy is shown to the student immediately after
 *    generation. Submitting to the Handler queue runs alongside that (for
 *    the live advisory session the service promises), not as a precondition
 *    for the student seeing their result — and a failure there is soft, not
 *    fatal, exactly as before.
 * 2. Tier is picked before generation, not after — there's no separate
 *    "review the result, then submit" step here.
 *
 * job_search_sessions needed no migration: input is already schemaless
 * jsonb and status already allows 'draft', unlike several sibling tables.
 * field_or_industry was free text despite the backend already resolving it
 * through the controlled vocabulary — upgraded to IndustrySelect, matching
 * every other rebuilt service.
 */
export default function JobSearchSupportPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  // §08 Career Profile: Quick Generate on the profile page can hand a
  // finished session (and Handler guide, if this account can see one) here.
  const [session, setSession] = useState(location.state?.session ?? null)
  const [handlerGuide, setHandlerGuide] = useState(location.state?.handlerGuide ?? null)
  const [tier, setTier] = useState('standard')
  const [submissionId, setSubmissionId] = useState(null)
  const [profileKnown, setProfileKnown] = useState(null)

  const [draftCheck, setDraftCheck] = useState('checking')
  const [pendingDraft, setPendingDraft] = useState(null)
  const draftIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadProfileDefaults(user.id).then(({ profile, target }) => {
      if (cancelled) return
      setProfileKnown((profile || target) ? { profile, target } : {})
      if (profile || target) {
        setForm((f) => ({
          ...f,
          field_or_industry: f.field_or_industry || target?.target_industry || '',
          has_no_experience: f.has_no_experience || !!profile?.has_no_experience,
        }))
      }
    })

    supabase
      .from('job_search_sessions')
      .select('id, input, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (!data) { setDraftCheck('none'); return }
        const ageMs = Date.now() - new Date(data.updated_at).getTime()
        if (ageMs > DRAFT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) { setDraftCheck('none'); return }
        setPendingDraft(data)
        setDraftCheck('offer')
      })
      .catch(() => { if (!cancelled) setDraftCheck('none') })

    return () => { cancelled = true }
  }, [user.id])

  const resumeDraft = () => {
    draftIdRef.current = pendingDraft.id
    setForm((f) => ({ ...f, ...(pendingDraft.input || {}) }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('job_search_sessions').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => setForm((f) => ({ ...f, [path]: value }))

  const buildInputPayload = (f) => ({
    field_or_industry: f.field_or_industry,
    opportunity_type: f.opportunity_type,
    has_no_experience: f.has_no_experience,
    urgency: f.urgency,
    interview_conversion: f.interview_conversion,
    applications_so_far: f.applications_so_far,
    location: f.location,
    timeline: f.timeline,
    cv_status: f.cv_status,
    linkedin_status: f.linkedin_status,
    professional_registration_status: f.professional_registration_status,
    non_university_type: f.non_university_type,
    unsure_about: f.unsure_about,
  })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('job_search_sessions').update({ input: draftInput, updated_at: new Date().toISOString() }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('job_search_sessions')
          .insert([{ user_id: user.id, input: draftInput, status: 'draft', tier }])
          .select('id')
          .single()
        if (data) draftIdRef.current = data.id
      }
    } catch {
      // silent — a network blip must never block moving through the flow
    }
  }

  const handleGenerate = () => runLocked(async () => {
    setError('')
    if (!form.field_or_industry.trim() || !form.opportunity_type.trim()) {
      setError('Field/industry and target opportunity type are required — they\'re the minimum needed to build a personalised strategy.')
      return
    }
    setGenerating(true)
    try {
      const payload = { user_id: user.id, input: buildInputPayload(form), tier }

      let sessionId = draftIdRef.current
      if (sessionId) {
        const { error: updateErr } = await supabase.from('job_search_sessions').update({ ...payload, status: 'draft' }).eq('id', sessionId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('job_search_sessions').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        sessionId = inserted.id
      }

      const data = await invokeFunction('generate-job-search-support', { session_id: sessionId })
      setSession(data.session)

      // Only returns data if this account holds the handler/operations role — RLS,
      // not a UI check, is what actually keeps this from students.
      const { data: guideRow } = await supabase
        .from('job_search_handler_guides')
        .select('handler_guide')
        .eq('session_id', data.session.id)
        .maybeSingle()
      if (guideRow) setHandlerGuide(guideRow.handler_guide)

      // The strategy is shown to the student immediately, above — unlike the
      // other 8 generators, this one was never gated on Handler approval, and
      // that stays true here. Submitting to the queue runs alongside it so a
      // Handler can pick up the live advisory conversation the service
      // description promises; it is not a precondition for the student seeing
      // their result. A failure here is therefore soft: the student keeps
      // their strategy, and this is the one thing worth surfacing to fix later
      // rather than silently losing the ticket.
      try {
        const serviceName = tier === 'premium' ? 'Job Search Support — Premium' : 'Job Search Support — Standard'
        const label = `Job Search — ${form.field_or_industry}`
        const subId = await submitForReview('job_search_sessions', data.session.id, serviceName, label, tier)
        setSubmissionId(subId)
      } catch (queueErr) {
        console.error('Could not queue this session for a Campus Handler:', queueErr)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  })

  const steps = useJobSearchSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>Job Search Support | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Job Search Support</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          Free opportunity alerts, plus a live advisory session with a Campus Handler and a personalised strategy document. Tell us where you're at.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished job search session"
          />
        ) : !session ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Get my strategy"
            strapline="The more you give us, the better your strategy — this takes about 4 minutes, and everything is saved as you go."
            initialStepKey={form._current_step}
          />
        ) : (
          <>
            <StrategyResult strategy={session.student_strategy} handlerGuide={handlerGuide} />
            <PipelineStatusTimeline submissionId={submissionId} />
          </>
        )}
      </div>
    </>
  )
}

/** Rows for the profile-confirm opener step. */
function profileCheckRows(profileKnown) {
  const { profile, target } = profileKnown || {}
  return [
    profile?.education?.[0] && ['Studying', [profile.education[0].degree, profile.education[0].institution].filter(Boolean).join(' at ')],
    profile?.pathway && ['Pathway', profile.pathway],
    target?.target_industry && ['Targeting', target.target_industry],
  ].filter(Boolean)
}

/** Rows for the closing "here's what we'll build from" summary step. */
function summaryRows(form, tier) {
  return [
    ['Field', form.field_or_industry || '—'],
    ['Looking for', OPPORTUNITY_TYPE_OPTIONS.find((o) => o.value === form.opportunity_type)?.label || '—'],
    ['Experience', form.has_no_experience ? 'First-ever job search' : 'Has prior experience'],
    ['Urgency', URGENCY_OPTIONS.find((o) => o.value === form.urgency)?.label],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — the fields
 * generate-job-search-support already reads, grouped into related clusters
 * where several optional fields belong to one "beat" (CV/LinkedIn readiness,
 * logistics, less-common specifics) rather than one screen per field, plus
 * unsure_about as the same universal quality signal every other rebuilt
 * service added.
 */
function useJobSearchSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'field_or_industry',
      title: 'What field or industry?',
      validate: (f) => (!f.field_or_industry?.trim() ? 'Field/industry is required.' : ''),
      render: ({ form: f, set }) => <IndustrySelect id="field_or_industry" value={f.field_or_industry} onChange={set('field_or_industry')} required />,
    },
    {
      key: 'opportunity_type',
      title: 'What are you looking for?',
      validate: (f) => (!f.opportunity_type ? 'Pick the closest option.' : ''),
      render: ({ form: f, set }) => <ChoiceGrid options={OPPORTUNITY_TYPE_OPTIONS} value={f.opportunity_type} onChange={set('opportunity_type')} />,
    },
    {
      key: 'has_no_experience',
      title: 'Is this your first ever job search?',
      render: ({ form: f, set }) => (
        <div>
          <FormCheckbox
            id="has_no_experience"
            checked={f.has_no_experience}
            onChange={set('has_no_experience')}
            label="Yes — I have no formal work experience yet"
          />
          {f.has_no_experience && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6, marginTop: '12px' }}>
              Good to know — searching for a first role works differently. Your strategy will lead on your college careers service, speculative applications, and building visibility, rather than assuming a work history you don't have yet.
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'urgency',
      title: 'How urgent is this?',
      render: ({ form: f, set }) => <ChoiceGrid options={URGENCY_OPTIONS} value={f.urgency} onChange={set('urgency')} />,
    },
    {
      key: 'search_progress',
      title: 'How has the search gone so far?',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <ChoiceGrid options={INTERVIEW_CONVERSION_OPTIONS} value={f.interview_conversion} onChange={set('interview_conversion')} />
          <FormField id="applications_so_far" label="What have you tried so far?" hint="Optional">
            <FormTextarea id="applications_so_far" value={f.applications_so_far} onChange={set('applications_so_far')} rows={3} maxLength={LIMITS.LONG} />
          </FormField>
        </div>
      ),
    },
    {
      key: 'logistics',
      title: 'Where and when?',
      optional: true,
      whyItHelps: 'sharpens which channels and timing actually apply to you.',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="location" label="Preferred location" hint="e.g. Dublin, Cork, open to relocate">
            <FormInput id="location" value={f.location} onChange={set('location')} maxLength={LIMITS.SHORT} />
          </FormField>
          <FormField id="timeline" label="When do you want to start?" hint="e.g. September 2026, ASAP, flexible">
            <FormInput id="timeline" value={f.timeline} onChange={set('timeline')} maxLength={LIMITS.SHORT} />
          </FormField>
        </div>
      ),
    },
    {
      key: 'presence',
      title: 'Your CV and LinkedIn',
      optional: true,
      whyItHelps: 'so the strategy doesn\'t assume you have either sorted already.',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="cv_status" label="CV status">
            <FormSelect id="cv_status" value={f.cv_status} onChange={set('cv_status')}>
              <option value="">Not sure</option>
              <option value="dont_have_one">Don't have one</option>
              <option value="outdated">Have one, but it's outdated</option>
              <option value="current">Up to date</option>
            </FormSelect>
          </FormField>
          <FormField id="linkedin_status" label="LinkedIn status">
            <FormSelect id="linkedin_status" value={f.linkedin_status} onChange={set('linkedin_status')}>
              <option value="">Not sure</option>
              <option value="no_profile">No profile</option>
              <option value="inactive">Have one, rarely use it</option>
              <option value="active">Active and current</option>
            </FormSelect>
          </FormField>
        </div>
      ),
    },
    {
      key: 'specifics',
      title: 'A couple of specifics',
      optional: true,
      whyItHelps: 'only relevant to some fields and situations — skip freely if neither applies.',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="professional_registration_status" label="Does your field require professional registration?" hint="e.g. NMBI, Teaching Council, CORU">
            <FormInput id="professional_registration_status" value={f.professional_registration_status} onChange={set('professional_registration_status')} maxLength={LIMITS.MEDIUM} />
          </FormField>
          <FormField id="non_university_type" label="If not a university student, what best describes you?">
            <FormSelect id="non_university_type" value={f.non_university_type} onChange={set('non_university_type')}>
              <option value="">University student</option>
              <option value="apprentice">Apprentice</option>
              <option value="young_worker">Young worker</option>
              <option value="fifth_sixth_year">5th / 6th year student</option>
            </FormSelect>
          </FormField>
        </div>
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure about?',
      optional: true,
      whyItHelps: 'whether your background even applies here, a gap, anything — tell us and the Handler will raise it in your session.',
      render: ({ form: f, set }) => (
        <FormTextarea id="unsure_about" value={f.unsure_about} onChange={set('unsure_about')} rows={4} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'tier',
      title: 'Choose your turnaround',
      render: () => <TierPicker value={tier} onChange={setTier} />,
    },
    {
      key: 'summary',
      title: 'Ready to build your strategy',
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or get your strategy now." rows={summaryRows(f, tier)} />,
    },
  ]
}

function StrategyResult({ strategy, handlerGuide }) {
  if (!strategy) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {strategy.compatibility_warning && (
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '10px', padding: '16px' }}>
          <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#7A1D1D', lineHeight: 1.6 }}>{strategy.compatibility_warning}</p>
        </div>
      )}

      <FormCard>
        <h2 style={sectionHeading}>Your situation</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{strategy.your_situation_summary}</p>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Your five-channel plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {strategy.five_channel_plan?.map((c, i) => (
            <div key={i} style={{ padding: '14px', background: '#F5F0E8', borderRadius: '8px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 700, color: '#1E3A5F' }}>{c.channel}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', marginTop: '4px', lineHeight: 1.6 }}>{c.what_to_do}</p>
              {c.platforms?.length > 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '6px' }}>{c.platforms.join(' · ')}</p>}
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Platform directory</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {strategy.platform_directory?.map((p, i) => (
            <div key={i} title={p.use_for} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#1E3A5F', background: 'rgba(30,58,95,0.06)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {p.name}
              {p.verify_before_use && <span style={{ fontSize: '10px', color: '#9C6B26', fontWeight: 700 }}>VERIFY</span>}
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Your 7-day action plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {strategy.seven_day_action_plan?.map((d, i) => (
            <div key={i}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.day_range}</p>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {d.actions?.map((a, j) => <li key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {strategy.application_tracking_tip && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '16px', fontStyle: 'italic' }}>{strategy.application_tracking_tip}</p>
        )}
      </FormCard>

      {strategy.closing_encouragement && (
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(22,163,74,0.08)', borderRadius: '10px', padding: '16px' }}>
          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#14532D', lineHeight: 1.6 }}>{strategy.closing_encouragement}</p>
        </div>
      )}

      {handlerGuide && <JobSearchHandlerGuide guide={handlerGuide} />}
    </div>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }
