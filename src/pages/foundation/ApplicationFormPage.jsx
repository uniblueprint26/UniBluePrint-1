import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Plus, Trash2, Send, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { fetchActiveTarget } from '../../lib/careerProfile'
import { FormCard, FormField, FormInput, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import ProfilePrefillNote from '../../components/foundation/ProfilePrefillNote'

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

        {tab === 'bank' ? <EvidenceBankTab userId={user.id} /> : <AnswerFormTab userId={user.id} />}
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

function AnswerFormTab({ userId }) {
  const { runLocked } = useSubmitLock()
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [questions, setQuestions] = useState([{ question_text: '', word_limit: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchActiveTarget(userId).then((target) => {
      if (cancelled || !target) return
      if (target.target_company) setTargetCompany(target.target_company)
      if (target.target_role) setTargetRole(target.target_role)
      setPrefilled(true)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  const updateQ = (i, field, value) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))
  const addQ = () => setQuestions((qs) => [...qs, { question_text: '', word_limit: '' }])
  const removeQ = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i))

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    const validQuestions = questions.filter((q) => q.question_text.trim())
    if (validQuestions.length === 0) { setError('Add at least one question.'); return }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('application_forms')
        .insert([{ user_id: userId, target_company: targetCompany || null, target_role: targetRole || null, questions: validQuestions }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-application-answers', { form_id: inserted.id })
      setResult(data.form)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!result) return
    setSubmitting(true)
    try {
      await submitForReview('application_forms', result.id, 'Application Form Assistance — Standard', `Application Form — ${targetCompany || 'Untitled'}`)
            setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  if (submitted) {
    return (
      <FormCard>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
        </div>
      </FormCard>
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
    <FormCard>
      {error && <ErrorBanner message={error} />}
      {prefilled && <ProfilePrefillNote />}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField id="target_company" label="Company" hint="Optional"><FormInput id="target_company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
        <FormField id="target_role" label="Role" hint="Optional"><FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
        {questions.map((q, i) => (
          <div key={i} style={{ position: 'relative', background: '#F5F0E8', borderRadius: '10px', padding: '16px' }}>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQ(i)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }} aria-label="Remove question"><Trash2 size={14} /></button>
            )}
            <FormField id={`q-${i}`} label={`Question ${i + 1}`} required>
              <FormTextarea id={`q-${i}`} value={q.question_text} onChange={(e) => updateQ(i, 'question_text', e.target.value)} rows={2} required maxLength={LIMITS.LONG} />
            </FormField>
            <div style={{ marginTop: '10px' }}>
              <FormField id={`q-limit-${i}`} label="Word limit" hint="Optional"><FormInput id={`q-limit-${i}`} value={q.word_limit} onChange={(e) => updateQ(i, 'word_limit', e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
            </div>
          </div>
        ))}
        <button
          type="button" onClick={addQ}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px dashed rgba(30,58,95,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}
        >
          <Plus size={14} aria-hidden="true" /> Add another question
        </button>
        <button
          type="submit" disabled={loading}
          style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {loading ? 'Drafting answers…' : 'Generate my answers'}
        </button>
      </form>
    </FormCard>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
