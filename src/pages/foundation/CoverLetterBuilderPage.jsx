import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { loadProfileDefaults, experienceNarrative } from '../../lib/careerProfile'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, ErrorBanner, parseDbError } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine } from '../../components/foundation/QuestionFlowKit'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

/**
 * Cover Letter Assistance's intake, rebuilt as a one-question-at-a-time
 * questionnaire — third Foundation Blueprint service on the QuestionFlow
 * pattern CV Optimisation established. See CvBuilderPage.jsx for the fuller
 * design notes.
 *
 * cover_letters.target_role and .target_company were both NOT NULL (same
 * class of gap as linkedin_documents.target_industry) — see
 * 20260904090000_cover_letter_targets_nullable.sql.
 *
 * industry was a free-text field on the old form even though the backend
 * already resolves it through the controlled vocabulary
 * (resolveIndustryContext) — upgraded to the same IndustrySelect picker
 * CV/LinkedIn use, for the same reason: fewer typos/mismatches feeding a
 * resolver that already expects controlled input.
 */

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  target_role: '', target_company: '',
  industry: '',
  job_description: '',
  background_summary: '',
  has_no_experience: false, relevant_experience: '',
  why_this_company: '',
  unsure_about: '',
  tone: 'balanced',
}

export default function CoverLetterBuilderPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [letter, setLetter] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [copied, setCopied] = useState(false)
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
      .from('cover_letters')
      .select('id, input, target_role, target_company, job_description, updated_at')
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
      job_description: pendingDraft.job_description || f.job_description,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('cover_letters').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => {
    setForm((f) => ({ ...f, [path]: value }))
  }

  const buildInputPayload = (f) => ({
    background_summary: f.background_summary,
    why_this_company: f.why_this_company,
    relevant_experience: f.relevant_experience,
    has_no_experience: f.has_no_experience,
    tone: f.tone,
    industry: f.industry,
    unsure_about: f.unsure_about,
  })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('cover_letters').update({
          input: draftInput,
          target_role: form.target_role || null, target_company: form.target_company || null,
          job_description: form.job_description || null,
          updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('cover_letters')
          .insert([{
            user_id: user.id,
            target_role: form.target_role || null, target_company: form.target_company || null,
            job_description: form.job_description || null,
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
    const tooLong = checkLengths([['The job description', form.job_description, LIMITS.PASTE_JD]])
    if (tooLong) { setError(tooLong); return }
    setGenerating(true)
    setError('')
    try {
      const payload = {
        user_id: user.id,
        target_role: form.target_role, target_company: form.target_company,
        job_description: form.job_description || null,
        input: buildInputPayload(form),
      }

      let documentId = draftIdRef.current
      if (documentId) {
        const { error: updateErr } = await supabase.from('cover_letters').update({ ...payload, status: 'draft' }).eq('id', documentId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('cover_letters').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        documentId = inserted.id
      }

      const data = await invokeFunction('generate-cover-letter', { document_id: documentId })
      setLetter(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!letter) return
    setSubmitting(true)
    setError('')
    try {
      const serviceName = tier === 'premium' ? 'Cover Letter Assistance — Premium' : 'Cover Letter Assistance — Standard'
      const subId = await submitForReview('cover_letters', letter.id, serviceName, `Cover Letter — ${form.target_role} at ${form.target_company}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter.generated.full_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const steps = useCoverLetterSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>Cover Letter Builder | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Cover Letter Builder</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          Written for one specific role at one specific company — never a generic template.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished cover letter"
          />
        ) : !letter ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Generate my cover letter"
            strapline="The more you give us, the better your output — this takes about 4 minutes, and everything is saved as you go."
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
            <BenchmarkNote sources={letter.generated?.benchmarked_against} />
            <FormCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>Your letter ({letter.generated.word_count} words)</h2>
                <button type="button" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', cursor: 'pointer' }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '12px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{letter.generated.full_text}</p>
            </FormCard>
            <div style={{ maxWidth: '360px' }}>
              <TierPicker value={tier} onChange={setTier} />
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button" onClick={handleSubmitForReview} disabled={submitting}
                style={{ height: '48px', padding: '0 24px', background: submitting ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
                {submitting ? 'Sending…' : 'Submit for Handler review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/** Fills blanks from the profile/target — never overwrites something already typed. */
function applyProfileDefaults(f, profile, target) {
  const next = { ...f }
  if (profile) {
    if (profile.has_no_experience) next.has_no_experience = true
    if (!f.background_summary) next.background_summary = experienceNarrative(profile)
  }
  if (target) {
    next.target_role = f.target_role || target.target_role || ''
    next.target_company = f.target_company || target.target_company || ''
    next.industry = f.industry || target.target_industry || ''
    next.job_description = f.job_description || target.job_description || ''
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
    ['Applying for', `${form.target_role || '—'} at ${form.target_company || '—'}`],
    ['Industry', form.industry || 'Not specified'],
    ['Experience', form.has_no_experience ? 'None yet — building around projects and coursework' : 'Provided'],
    ['Tone', form.tone],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — the fields generate-cover-letter
 * already reads (target_role, target_company, industry, job_description,
 * background_summary, relevant_experience, why_this_company, tone), plus
 * unsure_about as the same universal quality signal CV/LinkedIn added.
 */
function useCoverLetterSteps({ form, profileKnown, tier, setTier }) {
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
      title: 'What role are you applying for?',
      validate: (f) => (!f.target_role?.trim() ? 'The role is required.' : ''),
      render: ({ form: f, set }) => (
        <FormInput id="target_role" value={f.target_role} onChange={set('target_role')} placeholder="e.g. Graduate Software Engineer" required maxLength={LIMITS.SHORT} />
      ),
    },
    {
      key: 'target_company',
      title: 'What company is it at?',
      validate: (f) => (!f.target_company?.trim() ? 'The company is required.' : ''),
      render: ({ form: f, set }) => (
        <FormInput id="target_company" value={f.target_company} onChange={set('target_company')} required maxLength={LIMITS.SHORT} />
      ),
    },
    {
      key: 'industry',
      title: 'What industry is this in?',
      optional: true,
      whyItHelps: 'helps us benchmark against real examples from this field.',
      render: ({ form: f, set }) => <IndustrySelect id="industry" value={f.industry} onChange={set('industry')} />,
    },
    {
      key: 'background_summary',
      title: 'A little about your background',
      optional: true,
      whyItHelps: 'a sentence or two of context — we\'ll pull the rest from your relevant experience.',
      render: ({ form: f, set }) => (
        <FormTextarea id="background_summary" value={f.background_summary} onChange={set('background_summary')} rows={3} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'relevant_experience',
      title: 'What\'s your most relevant experience for this role?',
      validate: (f) => (!f.relevant_experience?.trim() ? 'This is the real evidence your letter is built on — required.' : ''),
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormCheckbox
            id="has_no_experience"
            checked={f.has_no_experience}
            onChange={set('has_no_experience')}
            label="I have no formal work experience yet"
          />
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
              {f.has_no_experience
                ? 'College projects, societies, volunteering, and part-time work all count — this is the real evidence your letter will be built on.'
                : 'The one or two things most relevant to this specific role — we\'ll go deep on these rather than summarising everything.'}
            </p>
            <FormTextarea id="relevant_experience" value={f.relevant_experience} onChange={set('relevant_experience')} rows={4} required maxLength={LIMITS.LONG} />
          </div>
        </div>
      ),
    },
    {
      key: 'why_this_company',
      title: 'Why this company specifically?',
      optional: true,
      whyItHelps: 'a real, specific reason makes the letter far stronger than a generic one.',
      render: ({ form: f, set }) => (
        <FormTextarea id="why_this_company" value={f.why_this_company} onChange={set('why_this_company')} rows={3} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure how to present?',
      optional: true,
      whyItHelps: 'a gap, a career change, an unconventional path — tell us and we\'ll frame it honestly rather than skip it.',
      render: ({ form: f, set }) => (
        <FormTextarea id="unsure_about" value={f.unsure_about} onChange={set('unsure_about')} rows={4} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'context_signals',
      title: 'One last detail',
      optional: true,
      whyItHelps: 'sharpens keyword relevance, but nothing here blocks a strong letter either way.',
      render: ({ form: f, set }) => (
        <FormField id="job_description" label="Paste the job description" hint="Optional">
          <FormTextarea id="job_description" value={f.job_description} onChange={set('job_description')} rows={5} maxLength={LIMITS.PASTE_JD} />
        </FormField>
      ),
    },
    {
      key: 'tone',
      title: 'What tone should it have?',
      render: ({ form: f, set }) => (
        <FormSelect id="tone" value={f.tone} onChange={set('tone')}>
          <option value="formal">Formal</option>
          <option value="balanced">Balanced</option>
          <option value="modern">Modern</option>
        </FormSelect>
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
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or generate your cover letter now." rows={summaryRows(f, tier)} />,
    },
  ]
}
