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
import { SummaryRows, ResumeDraftCard, LoadingLine } from '../../components/foundation/QuestionFlowKit'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

const PATHWAYS = [
  ['ucas', 'UCAS (UK undergraduate)', 'Three structured questions — the new 2026 entry format.'],
  ['cao_mature', 'CAO — Mature applicant', 'For mature students, or RCSI / portfolio-based programmes requiring a statement.'],
  ['postgrad', 'Postgraduate / Masters', 'The five-part structure — academic background, skills, goals, and course fit.'],
]

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  pathway: '', target_course: '', target_institution: '',
  background_and_motivation: '', relevant_experience: '',
  life_work_experience: '', goals: '', weaknesses_or_gaps: '',
}

/**
 * Personal Statement's intake, rebuilt as a one-question-at-a-time
 * questionnaire — seventh Foundation Blueprint service on the QuestionFlow
 * pattern. Covers all three pathways this page has always served (UCAS, CAO
 * mature applicant, postgraduate) — "CAO Personal Statement" in the product
 * spec's service list names one of the three, not the whole page.
 *
 * personal_statements.pathway (no default, unlike interview_type's
 * 'blended'), .target_course, and .target_institution were all NOT NULL —
 * see 20260907090000_personal_statement_fields_nullable.sql.
 *
 * weaknesses_or_gaps was only ever shown on the postgrad pathway, even
 * though generate-personal-statement reads and length-checks it completely
 * generically — the postgrad-only PATHWAY_PROMPT explains how to reframe
 * one, but nothing in the base prompt or the ucas/cao_mature prompts
 * forbids using it. Generalised to all three pathways, framed the same way
 * every other rebuilt service's unsure_about question is.
 */
export default function PersonalStatementPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [doc, setDoc] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [profileKnown, setProfileKnown] = useState(null)

  const [draftCheck, setDraftCheck] = useState('checking')
  const [pendingDraft, setPendingDraft] = useState(null)
  const draftIdRef = useRef(null)

  // §08 Career Profile: fills course/institution/goals and a life-experience
  // draft (used only on the cao_mature pathway). Pathway itself is never
  // auto-selected — it changes which generator prompt runs entirely, so it
  // stays a deliberate choice every time.
  useEffect(() => {
    let cancelled = false
    loadProfileDefaults(user.id).then(({ profile, target }) => {
      if (cancelled) return
      setProfileKnown((profile || target) ? { profile, target } : {})
      if (profile || target) {
        setForm((f) => ({
          ...f,
          target_course: f.target_course || target?.target_course || '',
          target_institution: f.target_institution || target?.target_institution || '',
          goals: f.goals || profile?.goals || '',
          life_work_experience: f.life_work_experience || experienceNarrative(profile),
        }))
      }
    })

    supabase
      .from('personal_statements')
      .select('id, input, pathway, target_course, target_institution, updated_at')
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
      pathway: pendingDraft.pathway || f.pathway,
      target_course: pendingDraft.target_course || f.target_course,
      target_institution: pendingDraft.target_institution || f.target_institution,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('personal_statements').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => setForm((f) => ({ ...f, [path]: value }))

  const buildInputPayload = (f) => ({
    background_and_motivation: f.background_and_motivation,
    relevant_experience: f.relevant_experience,
    life_work_experience: f.pathway === 'cao_mature' ? f.life_work_experience : '',
    goals: f.goals,
    weaknesses_or_gaps: f.weaknesses_or_gaps,
  })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('personal_statements').update({
          input: draftInput,
          pathway: form.pathway || null, target_course: form.target_course || null, target_institution: form.target_institution || null,
          updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('personal_statements')
          .insert([{
            user_id: user.id,
            pathway: form.pathway || null, target_course: form.target_course || null, target_institution: form.target_institution || null,
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
        pathway: form.pathway, target_course: form.target_course, target_institution: form.target_institution,
        input: buildInputPayload(form),
      }

      let documentId = draftIdRef.current
      if (documentId) {
        const { error: updateErr } = await supabase.from('personal_statements').update({ ...payload, status: 'draft' }).eq('id', documentId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('personal_statements').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        documentId = inserted.id
      }

      const data = await invokeFunction('generate-personal-statement', { document_id: documentId })
      setDoc(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!doc) return
    setSubmitting(true)
    try {
      const serviceName = tier === 'premium' ? 'Personal Statement — Premium' : 'Personal Statement — Standard'
      const subId = await submitForReview('personal_statements', doc.id, serviceName, `Personal Statement — ${form.target_course} at ${form.target_institution}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = usePersonalStatementSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>Personal Statement Builder | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Personal Statement Builder</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          UCAS, CAO mature applicant, or postgraduate — three genuinely different structures, not one template with the label swapped.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished personal statement"
          />
        ) : !doc ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Generate my statement"
            strapline="The more you give us, the better your statement — this takes about 4 minutes, and everything is saved as you go."
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
            {doc.pathway === 'ucas' ? (
              doc.generated.ucas_answers?.map((a, i) => (
                <FormCard key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h2 style={sectionHeading}>{a.question}</h2>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{a.character_count} chars</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{a.answer}</p>
                </FormCard>
              ))
            ) : (
              <FormCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h2 style={sectionHeading}>Your statement</h2>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{doc.generated.word_count} words</span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '12px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{doc.generated.single_statement}</p>
              </FormCard>
            )}
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

/** Rows for the profile-confirm opener step. */
function profileCheckRows(profileKnown) {
  const { profile, target } = profileKnown || {}
  return [
    profile?.education?.[0] && ['Studying', [profile.education[0].degree, profile.education[0].institution].filter(Boolean).join(' at ')],
    profile?.pathway && ['Pathway', profile.pathway],
    target?.target_course && ['Targeting', target.target_course],
  ].filter(Boolean)
}

/** Rows for the closing "here's what we'll build from" summary step. */
function summaryRows(form, tier) {
  return [
    ['Pathway', PATHWAYS.find(([v]) => v === form.pathway)?.[1] || '—'],
    ['Course', [form.target_course, form.target_institution].filter(Boolean).join(' at ') || '—'],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — pathway first, since it decides
 * which of the later questions apply (only the cao_mature pathway asks for
 * life/work experience), then the fields generate-personal-statement
 * already reads.
 */
function usePersonalStatementSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'pathway',
      title: 'Which applies to you?',
      validate: (f) => (!f.pathway ? 'Pick the pathway that applies to you.' : ''),
      render: ({ form: f, set }) => <PathwayPicker value={f.pathway} onChange={set('pathway')} />,
    },
    {
      key: 'target_course',
      title: 'What course?',
      validate: (f) => (!f.target_course?.trim() ? 'The course is required.' : ''),
      render: ({ form: f, set }) => <FormInput id="target_course" value={f.target_course} onChange={set('target_course')} required maxLength={LIMITS.SHORT} />,
    },
    {
      key: 'target_institution',
      title: 'At which institution?',
      validate: (f) => (!f.target_institution?.trim() ? 'The institution is required.' : ''),
      render: ({ form: f, set }) => <FormInput id="target_institution" value={f.target_institution} onChange={set('target_institution')} required maxLength={LIMITS.SHORT} />,
    },
    {
      key: 'background_and_motivation',
      title: 'Why this course? What draws you to it?',
      validate: (f) => (!f.background_and_motivation?.trim() ? 'Background and motivation is required.' : ''),
      render: ({ form: f, set }) => <FormTextarea id="background_and_motivation" value={f.background_and_motivation} onChange={set('background_and_motivation')} rows={5} required maxLength={LIMITS.LONG} />,
    },
    {
      key: 'relevant_experience',
      title: 'Any relevant academic experience or modules?',
      optional: true,
      whyItHelps: 'specific modules, projects, or academic work that connects to this course.',
      render: ({ form: f, set }) => <FormTextarea id="relevant_experience" value={f.relevant_experience} onChange={set('relevant_experience')} rows={3} maxLength={LIMITS.LONG} />,
    },
    {
      key: 'life_work_experience',
      title: 'What relevant life or work experience do you have?',
      skip: (f) => f.pathway !== 'cao_mature',
      optional: true,
      whyItHelps: 'this carries real weight for a mature applicant statement — CAO does not assess you on Leaving Cert points.',
      render: ({ form: f, set }) => <FormTextarea id="life_work_experience" value={f.life_work_experience} onChange={set('life_work_experience')} rows={5} maxLength={LIMITS.LONG} />,
    },
    {
      key: 'goals',
      title: 'What do you want this course to lead to?',
      optional: true,
      whyItHelps: 'sharpens the closing of your statement, but a strong one doesn\'t need it.',
      render: ({ form: f, set }) => <FormTextarea id="goals" value={f.goals} onChange={set('goals')} rows={2} maxLength={LIMITS.LONG} />,
    },
    {
      key: 'weaknesses_or_gaps',
      title: 'Anything you want addressed honestly?',
      optional: true,
      whyItHelps: 'a lower grade, a gap, an unconventional path — tell us and we\'ll frame it honestly rather than skip it.',
      render: ({ form: f, set }) => <FormTextarea id="weaknesses_or_gaps" value={f.weaknesses_or_gaps} onChange={set('weaknesses_or_gaps')} rows={3} maxLength={LIMITS.LONG} />,
    },
    {
      key: 'tier',
      title: 'Choose your turnaround',
      render: () => <TierPicker value={tier} onChange={setTier} />,
    },
    {
      key: 'summary',
      title: 'Ready to generate',
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or generate your statement now." rows={summaryRows(f, tier)} />,
    },
  ]
}

function PathwayPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {PATHWAYS.map(([v, label, hint]) => (
        <button
          type="button" key={v} onClick={() => onChange(v)}
          style={{
            textAlign: 'left', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
            border: value === v ? '2px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.15)',
            background: value === v ? 'rgba(30,58,95,0.05)' : '#FFFFFF',
          }}
        >
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1E3A5F' }}>{label}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '2px' }}>{hint}</p>
        </button>
      ))}
    </div>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
