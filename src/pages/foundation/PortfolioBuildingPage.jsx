import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Send, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { loadProfileDefaults } from '../../lib/careerProfile'
import { FormCard, FormInput, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine } from '../../components/foundation/QuestionFlowKit'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  field: '', work_type: '', career_goal: '', existing_presence: '', unsure_about: '',
}

/**
 * Portfolio Building's intake, rebuilt as a one-question-at-a-time
 * questionnaire — eighth Foundation Blueprint service on the QuestionFlow
 * pattern. Not one of the 9 services named in the product spec, but the
 * same service family and the same generation-request shape, so it gets
 * the same treatment.
 *
 * portfolio_plans.field was NOT NULL — same class of gap as every other
 * rebuilt service, would have rejected the very first autosave before the
 * question was answered. Migration drops it; generate-portfolio-plan's own
 * checkRequired() still enforces it at generation time.
 *
 * field was free text despite the backend already resolving it through the
 * controlled vocabulary (resolveIndustryContext) — upgraded to
 * IndustrySelect, matching every other rebuilt service. Added unsure_about
 * and a handler_notes schema field, which generate-portfolio-plan's output
 * didn't have at all — the reviewing role here is a Coach, not a Handler
 * (this service's own existing copy already said "Sent for Coach review",
 * preserved as-is), but the mechanism is the same one every other
 * generator uses.
 */
export default function PortfolioBuildingPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
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
        setForm((f) => {
          const presence = [profile?.personal_info?.portfolio_url, profile?.personal_info?.linkedin_url].filter(Boolean).join(', ')
          return {
            ...f,
            field: f.field || target?.target_industry || '',
            career_goal: f.career_goal || profile?.goals || '',
            existing_presence: f.existing_presence || presence,
          }
        })
      }
    })

    supabase
      .from('portfolio_plans')
      .select('id, input, field, updated_at')
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
    setForm((f) => ({
      ...f,
      ...(pendingDraft.input || {}),
      field: pendingDraft.field || f.field,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('portfolio_plans').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => setForm((f) => ({ ...f, [path]: value }))

  const buildInputPayload = (f) => ({
    work_type: f.work_type,
    career_goal: f.career_goal,
    existing_presence: f.existing_presence,
    unsure_about: f.unsure_about,
  })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('portfolio_plans').update({
          input: draftInput, field: form.field || null, updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('portfolio_plans')
          .insert([{ user_id: user.id, field: form.field || null, input: draftInput, status: 'draft' }])
          .select('id')
          .single()
        if (data) draftIdRef.current = data.id
      }
    } catch {
      // silent — a network blip must never block moving through the flow
    }
  }

  const handleGenerate = () => runLocked(async () => {
    setGenerating(true)
    setError('')
    try {
      const payload = { user_id: user.id, field: form.field, input: buildInputPayload(form) }

      let planId = draftIdRef.current
      if (planId) {
        const { error: updateErr } = await supabase.from('portfolio_plans').update({ ...payload, status: 'draft' }).eq('id', planId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('portfolio_plans').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        planId = inserted.id
      }

      const data = await invokeFunction('generate-portfolio-plan', { plan_id: planId })
      setPlan(data.plan)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!plan) return
    setSubmitting(true)
    try {
      const serviceName = tier === 'premium' ? 'Portfolio Building — Premium' : 'Portfolio Building — Standard'
      const subId = await submitForReview('portfolio_plans', plan.id, serviceName, `Portfolio Building — ${form.field}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = usePortfolioSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>Portfolio Building | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Portfolio Building</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          The right platform for your field, plus a structure checklist — a portfolio's job is to get out of the way of the work.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished portfolio plan"
          />
        ) : !plan ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Get my portfolio plan"
            strapline="The more you give us, the better your plan — this takes about 2 minutes, and everything is saved as you go."
            initialStepKey={form._current_step}
          />
        ) : submitted ? (
          <>
            <FormCard>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Coach review</h2>
              </div>
            </FormCard>
            <PipelineStatusTimeline submissionId={submissionId} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormCard>
              <h2 style={sectionHeading}>Recommended platform: {plan.generated.recommended_platform}</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{plan.generated.why_this_platform}</p>
              {plan.generated.alternative_platform && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '10px' }}>Alternative: {plan.generated.alternative_platform}</p>
              )}
            </FormCard>
            <FormCard>
              <h2 style={sectionHeading}>Structure checklist</h2>
              <ul style={{ margin: '10px 0 0', paddingLeft: '18px' }}>
                {plan.generated.structure_checklist?.map((s, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{s}</li>)}
              </ul>
            </FormCard>
            <FormCard>
              <h2 style={sectionHeading}>Presentation tips</h2>
              <ul style={{ margin: '10px 0 0', paddingLeft: '18px' }}>
                {plan.generated.presentation_tips?.map((t, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{t}</li>)}
              </ul>
            </FormCard>
            <div style={{ maxWidth: '360px' }}>
              <TierPicker value={tier} onChange={setTier} />
            </div>
            <button
              type="button" onClick={handleSubmitForReview} disabled={submitting}
              style={{ height: '48px', padding: '0 24px', background: submitting ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
            >
              {submitting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
              {submitting ? 'Sending…' : 'Submit for Coach review'}
            </button>
          </div>
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
    ['Field', form.field || '—'],
    ['Showcasing', form.work_type ? `${form.work_type.slice(0, 40)}${form.work_type.length > 40 ? '…' : ''}` : '—'],
    ['Existing presence', form.existing_presence || 'None yet'],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — the fields
 * generate-portfolio-plan already reads (field, work type, career goal,
 * existing presence), plus unsure_about as the same universal quality
 * signal every other rebuilt service added. Short by design — this is a
 * strategy plan, not a document with many structural questions.
 */
function usePortfolioSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'field',
      title: 'What field is this for?',
      validate: (f) => (!f.field?.trim() ? 'Field is required.' : ''),
      render: ({ form: f, set }) => <IndustrySelect id="field" value={f.field} onChange={set('field')} required />,
    },
    {
      key: 'work_type',
      title: 'What kind of work do you want to showcase?',
      validate: (f) => (!f.work_type?.trim() ? 'This is required.' : ''),
      render: ({ form: f, set }) => <FormTextarea id="work_type" value={f.work_type} onChange={set('work_type')} rows={4} required maxLength={LIMITS.LONG} />,
    },
    {
      key: 'existing_presence',
      title: 'Do you already have anything online?',
      optional: true,
      whyItHelps: 'GitHub, a site, social profiles — we\'ll build on what you have rather than starting you over.',
      render: ({ form: f, set }) => <FormInput id="existing_presence" value={f.existing_presence} onChange={set('existing_presence')} placeholder="e.g. github.com/you, a personal site" maxLength={LIMITS.MEDIUM} />,
    },
    {
      key: 'career_goal',
      title: 'What\'s this portfolio for?',
      optional: true,
      whyItHelps: 'e.g. internship applications, freelance clients — sharpens who it\'s written to convince.',
      render: ({ form: f, set }) => <FormInput id="career_goal" value={f.career_goal} onChange={set('career_goal')} maxLength={LIMITS.MEDIUM} />,
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure about?',
      optional: true,
      whyItHelps: 'whether you have enough to show, how to present a weak or unfinished piece — tell us and we\'ll address it honestly rather than skip it.',
      render: ({ form: f, set }) => <FormTextarea id="unsure_about" value={f.unsure_about} onChange={set('unsure_about')} rows={4} maxLength={LIMITS.LONG} />,
    },
    {
      key: 'tier',
      title: 'Choose your turnaround',
      render: () => <TierPicker value={tier} onChange={setTier} />,
    },
    {
      key: 'summary',
      title: 'Ready to generate',
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or get your portfolio plan now." rows={summaryRows(f, tier)} />,
    },
  ]
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
