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
import { loadProfileDefaults, experienceNarrative } from '../../lib/careerProfile'
import { FormCard, FormInput, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine, ChoiceGrid } from '../../components/foundation/QuestionFlowKit'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

const TYPE_LABELS = { behavioural: 'Behavioural', technical: 'Technical', strengths_based: 'Strengths-based' }

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'blended', label: 'Blended (behavioural + technical + strengths)' },
  { value: 'behavioural', label: 'Behavioural / competency-based' },
  { value: 'technical', label: 'Technical' },
  { value: 'strengths_based', label: 'Strengths-based' },
]

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  target_role: '', target_company: '', industry: '',
  interview_type: 'blended',
  background_summary: '',
  unsure_about: '',
}

/**
 * Interview Preparation's intake, rebuilt as a one-question-at-a-time
 * questionnaire — fifth Foundation Blueprint service on the QuestionFlow
 * pattern, reusing QuestionFlowKit as its siblings do.
 *
 * interview_prep_packs.target_role was NOT NULL — same class of gap as the
 * other services, see 20260906090000_interview_prep_target_role_nullable.sql.
 *
 * New: an industry override, matching the same gap fixed for Application
 * Form Assistance. generate-interview-prep's own system prompt calls
 * preparing the wrong interview FORMAT "worse than not preparing" — and the
 * old form had no way to specify industry at all, meaning
 * INTERVIEW_FORMAT_BY_INDUSTRY (27 fields' worth of real, distinct format
 * guidance) could only ever be reached through whatever the student's
 * currently-active Career Target happened to be.
 */
export default function InterviewPrepPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [pack, setPack] = useState(null)
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
        setForm((f) => applyProfileDefaults(f, profile, target))
      }
    })

    supabase
      .from('interview_prep_packs')
      .select('id, input, target_role, target_company, interview_type, updated_at')
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
      target_role: pendingDraft.target_role || f.target_role,
      target_company: pendingDraft.target_company || f.target_company,
      interview_type: pendingDraft.interview_type || f.interview_type,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('interview_prep_packs').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => setForm((f) => ({ ...f, [path]: value }))

  const buildInputPayload = (f) => ({
    industry: f.industry,
    background_summary: f.background_summary,
    unsure_about: f.unsure_about,
  })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('interview_prep_packs').update({
          input: draftInput,
          target_role: form.target_role || null, target_company: form.target_company || null,
          interview_type: form.interview_type,
          updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('interview_prep_packs')
          .insert([{
            user_id: user.id,
            target_role: form.target_role || null, target_company: form.target_company || null,
            interview_type: form.interview_type,
            input: draftInput,
            status: 'draft',
          }])
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
      const payload = {
        user_id: user.id,
        target_role: form.target_role, target_company: form.target_company || null,
        interview_type: form.interview_type,
        input: buildInputPayload(form),
      }

      let packId = draftIdRef.current
      if (packId) {
        const { error: updateErr } = await supabase.from('interview_prep_packs').update({ ...payload, status: 'draft' }).eq('id', packId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('interview_prep_packs').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        packId = inserted.id
      }

      const data = await invokeFunction('generate-interview-prep', { pack_id: packId })
      setPack(data.pack)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!pack) return
    setSubmitting(true)
    try {
      // The seeded services also include "+ Mock Session" variants for both
      // tiers, but the live mock-session feature itself isn't built anywhere
      // yet — simplifying to the two base packs rather than offering an
      // upsell for a feature that doesn't exist.
      const serviceName = tier === 'premium' ? 'Interview Preparation — Premium Pack' : 'Interview Preparation — Standard Pack'
      const subId = await submitForReview('interview_prep_packs', pack.id, serviceName, `Interview Prep — ${form.target_role}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = useInterviewPrepSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>Interview Preparation | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Interview Preparation</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          Likely questions, model answers from your evidence bank, company research prompts, and confidence tips — matched to the actual interview format.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished interview prep pack"
          />
        ) : !pack ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Build my prep pack"
            strapline="The more you give us, the better your output — this takes about 3 minutes, and everything is saved as you go."
            initialStepKey={form._current_step}
          />
        ) : submitted ? (
          <>
            <FormCard>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
              </div>
            </FormCard>
            <PipelineStatusTimeline submissionId={submissionId} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <BenchmarkNote sources={pack.generated?.benchmarked_against} />
            <FormCard>
              <h2 style={sectionHeading}>Company research to do</h2>
              <ul style={{ margin: '10px 0 0', paddingLeft: '18px' }}>
                {pack.generated.company_research_prompts?.map((p, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{p}</li>)}
              </ul>
            </FormCard>

            {pack.generated.likely_questions?.map((q, i) => (
              <FormCard key={i}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{TYPE_LABELS[q.type] || q.type}</p>
                <h2 style={{ ...sectionHeading, marginTop: '4px' }}>{q.question}</h2>
                {q.type === 'technical' ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{q.preparation_approach}</p>
                ) : q.missing_evidence ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#DC2626', marginTop: '10px' }}>{q.missing_evidence}</p>
                ) : (
                  <>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{q.model_answer}</p>
                    {q.source_story_title && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: '#9CA3AF', marginTop: '8px' }}>Drawn from: {q.source_story_title}</p>}
                  </>
                )}
              </FormCard>
            ))}

            <FormCard>
              <h2 style={sectionHeading}>Confidence tips</h2>
              <ul style={{ margin: '10px 0 0', paddingLeft: '18px' }}>
                {pack.generated.confidence_tips?.map((t, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{t}</li>)}
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
              {submitting ? 'Sending…' : 'Submit for Handler review'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/** Fills blanks from the profile/target — never overwrites something already typed. */
function applyProfileDefaults(f, profile, target) {
  const next = { ...f }
  if (profile && !f.background_summary) next.background_summary = experienceNarrative(profile)
  if (target) {
    next.target_role = f.target_role || target.target_role || ''
    next.target_company = f.target_company || target.target_company || ''
    next.industry = f.industry || target.target_industry || ''
  }
  return next
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
    ['Interviewing for', [form.target_role, form.target_company].filter(Boolean).join(' at ') || form.target_role || '—'],
    ['Industry', form.industry || 'Not specified'],
    ['Format', INTERVIEW_TYPE_OPTIONS.find((o) => o.value === form.interview_type)?.label || form.interview_type],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — the fields generate-interview-prep
 * already read (target role, target company, interview type, background
 * summary), plus the industry override and unsure_about that generator
 * previously had no way to receive.
 */
function useInterviewPrepSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'target_role',
      title: 'What role are you interviewing for?',
      validate: (f) => (!f.target_role?.trim() ? 'The role is required.' : ''),
      render: ({ form: f, set }) => (
        <FormInput id="target_role" value={f.target_role} onChange={set('target_role')} placeholder="e.g. Graduate Software Engineer" required maxLength={LIMITS.SHORT} />
      ),
    },
    {
      key: 'target_company',
      title: 'Which company?',
      optional: true,
      whyItHelps: 'sharpens the company research prompts — leave it blank for general prep.',
      render: ({ form: f, set }) => <FormInput id="target_company" value={f.target_company} onChange={set('target_company')} maxLength={LIMITS.SHORT} />,
    },
    {
      key: 'industry',
      title: 'What industry is this in?',
      optional: true,
      whyItHelps: 'interview format varies a lot by field — this makes sure we prepare you for the right one.',
      render: ({ form: f, set }) => <IndustrySelect id="industry" value={f.industry} onChange={set('industry')} />,
    },
    {
      key: 'interview_type',
      title: 'What format is the interview?',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>Not sure? Blended covers all three.</p>
          <ChoiceGrid options={INTERVIEW_TYPE_OPTIONS} value={f.interview_type} onChange={set('interview_type')} />
        </div>
      ),
    },
    {
      key: 'background_summary',
      title: 'Anything specific about your background or this interview?',
      optional: true,
      whyItHelps: 'context we should factor in — a career change, a specific worry, anything unusual about this process.',
      render: ({ form: f, set }) => (
        <FormTextarea id="background_summary" value={f.background_summary} onChange={set('background_summary')} rows={3} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure how to present?',
      optional: true,
      whyItHelps: 'a format you\'ve never done, a weak area, a gap — tell us and we\'ll flag it rather than guess.',
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
      title: 'Ready to generate',
      render: ({ form: f }) => (
        <div>
          <SummaryRows intro="Here's what we'll build from. Go back to change anything, or build your prep pack now." rows={summaryRows(f, tier)} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF', marginTop: '16px' }}>
            Model answers draw on your <Link to="/foundation/application-form-assistance" style={{ color: '#1E3A5F' }}>evidence bank</Link> — add stories there first for the strongest results.
          </p>
        </div>
      ),
    },
  ]
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
