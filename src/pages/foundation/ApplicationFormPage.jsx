import { useState, useEffect, useCallback, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Trash2, Send, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { loadProfileDefaults } from '../../lib/careerProfile'
import { FormCard, FormField, FormInput, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine, AddRowButton, repeatCard, removeBtn } from '../../components/foundation/QuestionFlowKit'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

const COMPETENCY_TAGS = ['Teamwork', 'Leadership', 'Problem Solving', 'Communication', 'Initiative', 'Resilience', 'Client / Stakeholder Focus', 'Adaptability']

export default function ApplicationFormPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('bank')

  return (
    <>
      <Helmet><title>Application Form Assistance | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Application Form Assistance</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '24px', lineHeight: 1.7 }}>
          Build your evidence bank once — real STAR stories from your own experience — then answer any application form by reusing them under the right competency lens.
        </p>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          <TabButton active={tab === 'bank'} onClick={() => setTab('bank')} label="My Evidence Bank" />
          <TabButton active={tab === 'form'} onClick={() => setTab('form')} label="Answer a Form" />
        </div>

        {tab === 'bank' ? <EvidenceBankTab userId={user.id} /> : <AnswerFormTab userId={user.id} onSwitchToBank={() => setTab('bank')} />}
      </div>
    </>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        padding: '10px 18px', borderRadius: '8px', border: active ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
        background: active ? '#1E3A5F' : '#FFFFFF', color: active ? '#F5F0E8' : '#1E3A5F',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/**
 * The evidence bank is a standing personal store the student builds up over
 * time (add/delete stories whenever), not a per-request generation intake —
 * it doesn't fit the QuestionFlow "one conversation, one output" shape and
 * is left exactly as it was.
 */
function EvidenceBankTab({ userId }) {
  const { runLocked } = useSubmitLock()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyStory())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase.from('evidence_bank_stories').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setStories(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const toggleTag = (tag) => setForm((f) => ({
    ...f,
    competency_tags: f.competency_tags.includes(tag) ? f.competency_tags.filter((t) => t !== tag) : [...f.competency_tags, tag],
  }))

  const handleAdd = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (!form.title.trim() || !form.situation.trim() || !form.task.trim() || !form.action.trim() || !form.result.trim() || form.competency_tags.length === 0) {
      setError('Every field is required, and at least one competency tag.')
      return
    }
    setSaving(true)
    try {
      const { error: err } = await supabase.from('evidence_bank_stories').insert([{ user_id: userId, ...form }])
      if (err) throw err
      setForm(emptyStory())
      await load()
    } catch (err) {
      setError(err.message || parseDbError(err))
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async (id) => {
    await supabase.from('evidence_bank_stories').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <ErrorBanner message={error} />}

      <FormCard>
        <h2 style={sectionHeading}>Add a story</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>
          No formal work experience needed — stories from college projects, societies, sport, volunteering, and part-time jobs all count. Graduate employers expect exactly these.
        </p>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          <FormField id="story_title" label="Short title" required><FormInput id="story_title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="story_situation" label="Situation" required><FormTextarea id="story_situation" value={form.situation} onChange={(e) => setForm((f) => ({ ...f, situation: e.target.value }))} rows={2} required maxLength={LIMITS.LONG} /></FormField>
          <FormField id="story_task" label="Task" required><FormTextarea id="story_task" value={form.task} onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))} rows={2} required maxLength={LIMITS.LONG} /></FormField>
          <FormField id="story_action" label="Action" required hint="This is the bulk of the story — what did you specifically do?"><FormTextarea id="story_action" value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} rows={3} required maxLength={LIMITS.LONG} /></FormField>
          <FormField id="story_result" label="Result" required><FormTextarea id="story_result" value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} rows={2} required maxLength={LIMITS.LONG} /></FormField>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A5F', marginBottom: '8px' }}>Which competencies does this demonstrate? *</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMPETENCY_TAGS.map((tag) => (
                <button
                  type="button" key={tag} onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                    border: form.competency_tags.includes(tag) ? 'none' : '1px solid rgba(30,58,95,0.2)',
                    background: form.competency_tags.includes(tag) ? '#1E3A5F' : '#FFFFFF',
                    color: form.competency_tags.includes(tag) ? '#F5F0E8' : '#1E3A5F',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 500,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={saving}
            style={{ height: '46px', background: saving ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />} Add to evidence bank
          </button>
        </form>
      </FormCard>

      <div>
        <h2 style={{ ...sectionHeading, marginBottom: '12px' }}>Your stories ({stories.length})</h2>
        {loading ? (
          <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', color: '#1E3A5F' }} />
        ) : stories.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF' }}>No stories yet — add your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stories.map((s) => (
              <div key={s.id} style={{ background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: 600, color: '#1E3A5F' }}>{s.title}</p>
                  <button type="button" onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }} aria-label="Delete story"><Trash2 size={14} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                  {s.competency_tags.map((t) => (
                    <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B7280', background: 'rgba(30,58,95,0.06)', padding: '2px 8px', borderRadius: '10px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function emptyStory() {
  return { title: '', situation: '', task: '', action: '', result: '', competency_tags: [] }
}

const emptyQuestion = () => ({ question_text: '', word_limit: '' })

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  target_company: '', target_role: '', industry: '',
  questions: [emptyQuestion()],
  unsure_about: '',
}

/**
 * "Answer a Form" — the actual generation request, rebuilt on QuestionFlow.
 * generate-application-answers hard-requires at least one story in the
 * evidence bank; the empty-bank case is checked before the flow even
 * renders, since no amount of questionnaire polish fixes a request that
 * can't succeed.
 */
function AnswerFormTab({ userId, onSwitchToBank }) {
  const { runLocked } = useSubmitLock()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [profileKnown, setProfileKnown] = useState(null)
  const [storyCount, setStoryCount] = useState(null) // null = loading

  const [draftCheck, setDraftCheck] = useState('checking')
  const [pendingDraft, setPendingDraft] = useState(null)
  const draftIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadProfileDefaults(userId).then(({ profile, target }) => {
      if (cancelled) return
      setProfileKnown((profile || target) ? { profile, target } : {})
      if (target) {
        setForm((f) => ({
          ...f,
          target_company: f.target_company || target.target_company || '',
          target_role: f.target_role || target.target_role || '',
          industry: f.industry || target.target_industry || '',
        }))
      }
    })

    supabase.from('evidence_bank_stories').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      .then(({ count }) => { if (!cancelled) setStoryCount(count || 0) })

    supabase
      .from('application_forms')
      .select('id, input, target_company, target_role, questions, updated_at')
      .eq('user_id', userId)
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
  }, [userId])

  const resumeDraft = () => {
    draftIdRef.current = pendingDraft.id
    setForm((f) => ({
      ...f,
      ...(pendingDraft.input || {}),
      target_company: pendingDraft.target_company || f.target_company,
      target_role: pendingDraft.target_role || f.target_role,
      questions: pendingDraft.questions?.length ? pendingDraft.questions : f.questions,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('application_forms').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => setForm((f) => ({ ...f, [path]: value }))

  const buildInputPayload = (f) => ({ industry: f.industry, unsure_about: f.unsure_about })

  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    const validQuestions = form.questions.filter((q) => q.question_text.trim())
    try {
      if (draftIdRef.current) {
        await supabase.from('application_forms').update({
          input: draftInput,
          target_company: form.target_company || null, target_role: form.target_role || null,
          questions: validQuestions,
          updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('application_forms')
          .insert([{
            user_id: userId,
            target_company: form.target_company || null, target_role: form.target_role || null,
            questions: validQuestions,
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
    const validQuestions = form.questions.filter((q) => q.question_text.trim())
    if (validQuestions.length === 0) { setError('Add at least one question.'); return }
    setGenerating(true)
    setError('')
    try {
      const payload = {
        user_id: userId,
        target_company: form.target_company || null, target_role: form.target_role || null,
        questions: validQuestions,
        input: buildInputPayload(form),
      }

      let formId = draftIdRef.current
      if (formId) {
        const { error: updateErr } = await supabase.from('application_forms').update({ ...payload, status: 'draft' }).eq('id', formId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('application_forms').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        formId = inserted.id
      }

      const data = await invokeFunction('generate-application-answers', { form_id: formId })
      setResult(data.form)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!result) return
    setSubmitting(true)
    try {
      const serviceName = tier === 'premium' ? 'Application Form Assistance — Premium' : 'Application Form Assistance — Standard'
      const subId = await submitForReview('application_forms', result.id, serviceName, `Application Form — ${form.target_company || 'Untitled'}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = useApplicationFormSteps({ form, profileKnown, tier, setTier })

  if (submitted) {
    return (
      <>
        <FormCard>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
          </div>
        </FormCard>
        <PipelineStatusTimeline submissionId={submissionId} />
      </>
    )
  }

  if (result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <ErrorBanner message={error} />}
        <BenchmarkNote sources={result.generated?.benchmarked_against} />
        {result.generated.answers.map((a, i) => (
          <FormCard key={i}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.competency_identified}</p>
            <h2 style={{ ...sectionHeading, marginTop: '4px' }}>{a.question}</h2>
            {a.missing_evidence ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#DC2626', marginTop: '10px' }}>{a.missing_evidence}</p>
            ) : (
              <>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{a.answer}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: '#9CA3AF', marginTop: '8px' }}>Drawn from: {a.source_story_titles.join(', ')}</p>
              </>
            )}
          </FormCard>
        ))}
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
    )
  }

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {draftCheck === 'checking' || profileKnown === null || storyCount === null ? (
        <FormCard><LoadingLine label="Loading…" /></FormCard>
      ) : storyCount === 0 ? (
        <FormCard>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>Add a story first</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>
            Application Form Assistance drafts answers from your real evidence bank — it never invents a story. Add at least one on the Evidence Bank tab, then come back here.
          </p>
          <button
            type="button" onClick={onSwitchToBank}
            style={{ height: '46px', padding: '0 22px', marginTop: '16px', background: '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Go to Evidence Bank
          </button>
        </FormCard>
      ) : draftCheck === 'offer' ? (
        <ResumeDraftCard
          onResume={resumeDraft} onDiscard={discardDraft}
          title="You have an unfinished application form"
        />
      ) : (
        <QuestionFlow
          steps={steps}
          form={form}
          onFieldChange={onFieldChange}
          onStepAdvance={saveDraft}
          onComplete={handleGenerate}
          completing={generating}
          completeLabel="Generate my answers"
          strapline="The more you give us, the better your output — this takes about 3 minutes, and everything is saved as you go."
          initialStepKey={form._current_step}
        />
      )}
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
  const validCount = form.questions.filter((q) => q.question_text.trim()).length
  return [
    ['Form', [form.target_role, form.target_company].filter(Boolean).join(' at ') || 'Not specified'],
    ['Industry', form.industry || 'Not specified'],
    ['Questions', `${validCount} question(s)`],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow. Shorter than CV/LinkedIn/Cover
 * Letter's flows by design: the substantive content here isn't a set of
 * questions ABOUT the student, it's the actual application form they need
 * answered — company/role/industry are targeting context, then one step
 * holding the (arbitrarily many) form questions as a repeating list, matching
 * QuestionFlow's own "a coherent unit, not one input per screen" principle.
 */
function useApplicationFormSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'target_company',
      title: 'What company is this form for?',
      optional: true,
      whyItHelps: 'sharpens the "why this company" angle where a question asks for it.',
      render: ({ form: f, set }) => <FormInput id="target_company" value={f.target_company} onChange={set('target_company')} maxLength={LIMITS.SHORT} />,
    },
    {
      key: 'target_role',
      title: 'What role is it for?',
      optional: true,
      whyItHelps: 'helps us pick the right competency lens for ambiguous questions.',
      render: ({ form: f, set }) => <FormInput id="target_role" value={f.target_role} onChange={set('target_role')} maxLength={LIMITS.SHORT} />,
    },
    {
      key: 'industry',
      title: 'What industry is this in?',
      optional: true,
      whyItHelps: 'some fields (like the Civil Service) score against a specific published framework — this makes sure we use it.',
      render: ({ form: f, set }) => <IndustrySelect id="industry" value={f.industry} onChange={set('industry')} />,
    },
    {
      key: 'questions',
      title: 'What are the form\'s questions?',
      validate: (f) => (f.questions.some((q) => q.question_text.trim()) ? '' : 'Add at least one question.'),
      render: ({ form: f, setPath }) => (
        <QuestionEntries
          questions={f.questions}
          onChange={(i, field, v) => setPath('questions', f.questions.map((q, idx) => (idx === i ? { ...q, [field]: v } : q)))}
          onAdd={() => setPath('questions', [...f.questions, emptyQuestion()])}
          onRemove={(i) => setPath('questions', f.questions.filter((_, idx) => idx !== i))}
        />
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure how to present?',
      optional: true,
      whyItHelps: 'a question you don\'t know how to angle, or a gap in your evidence bank — tell us and we\'ll flag it rather than guess.',
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
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or generate your answers now." rows={summaryRows(f, tier)} />,
    },
  ]
}

function QuestionEntries({ questions, onChange, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {questions.map((q, i) => (
        <div key={i} style={repeatCard}>
          {questions.length > 1 && (
            <button type="button" onClick={() => onRemove(i)} style={removeBtn} aria-label="Remove question"><Trash2 size={14} /></button>
          )}
          <FormField id={`q-${i}`} label={`Question ${i + 1}`} required={i === 0}>
            <FormTextarea id={`q-${i}`} value={q.question_text} onChange={(ev) => onChange(i, 'question_text', ev.target.value)} rows={2} required={i === 0} maxLength={LIMITS.LONG} />
          </FormField>
          <FormField id={`q-limit-${i}`} label="Word limit" hint="Optional">
            <FormInput id={`q-limit-${i}`} value={q.word_limit} onChange={(ev) => onChange(i, 'word_limit', ev.target.value)} maxLength={LIMITS.SHORT} />
          </FormField>
        </div>
      ))}
      <AddRowButton onClick={onAdd} label="Add another question" />
    </div>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
