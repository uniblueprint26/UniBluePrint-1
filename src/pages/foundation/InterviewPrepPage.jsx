import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Send, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'

const TYPE_LABELS = { behavioural: 'Behavioural', technical: 'Technical', strengths_based: 'Strengths-based' }

export default function InterviewPrepPage() {
  const { user } = useAuth()
  const [targetRole, setTargetRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [interviewType, setInterviewType] = useState('blended')
  const [backgroundSummary, setBackgroundSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pack, setPack] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!targetRole) { setError('Target role is required.'); return }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('interview_prep_packs')
        .insert([{ user_id: user.id, target_role: targetRole, target_company: targetCompany || null, interview_type: interviewType, input: { background_summary: backgroundSummary } }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const { data, error: fnError } = await supabase.functions.invoke('generate-interview-prep', { body: { pack_id: inserted.id } })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setPack(data.pack)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!pack) return
    setSubmitting(true)
    try {
      const { data: service } = await supabase.from('services').select('id').eq('name', 'Interview Preparation — Standard Pack').single()
      const { data: submission, error: subErr } = await supabase
        .from('submissions')
        .insert([{ user_id: user.id, service_id: service?.id ?? null, notes: `Interview Prep — ${targetRole}` }])
        .select()
        .single()
      if (subErr) throw subErr
      await supabase.from('interview_prep_packs').update({ submission_id: submission.id, status: 'submitted' }).eq('id', pack.id)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet><title>Interview Preparation | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Interview Preparation</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Likely questions, model answers from your evidence bank, company research prompts, and confidence tips — matched to the actual interview format.
        </p>

        {error && <ErrorBanner message={error} />}

        {!pack ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="target_role" label="Role you're interviewing for" required><FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} required /></FormField>
              <FormField id="target_company" label="Company" hint="Optional"><FormInput id="target_company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} /></FormField>
              <FormField id="interview_type" label="Interview format" hint="Not sure? Blended covers all three.">
                <FormSelect id="interview_type" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                  <option value="blended">Blended (behavioural + technical + strengths)</option>
                  <option value="behavioural">Behavioural / competency-based</option>
                  <option value="technical">Technical</option>
                  <option value="strengths_based">Strengths-based</option>
                </FormSelect>
              </FormField>
              <FormField id="background_summary" label="Anything specific about your background or this interview?" hint="Optional">
                <FormTextarea id="background_summary" value={backgroundSummary} onChange={(e) => setBackgroundSummary(e.target.value)} rows={3} />
              </FormField>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF' }}>
                Model answers draw on your <Link to="/foundation/application-form-assistance" style={{ color: '#1E3A5F' }}>evidence bank</Link> — add stories there first for the strongest results.
              </p>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Building your pack…' : 'Build my prep pack'}
              </button>
            </form>
          </FormCard>
        ) : submitted ? (
          <FormCard>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
            </div>
          </FormCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
