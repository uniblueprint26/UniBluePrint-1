import { useState, useEffect } from 'react'
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
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'
import ProfilePrefillNote from '../../components/foundation/ProfilePrefillNote'

const TYPE_LABELS = { behavioural: 'Behavioural', technical: 'Technical', strengths_based: 'Strengths-based' }

export default function InterviewPrepPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [targetRole, setTargetRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [interviewType, setInterviewType] = useState('blended')
  const [backgroundSummary, setBackgroundSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pack, setPack] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadProfileDefaults(user.id).then(({ profile, target }) => {
      if (cancelled || (!profile && !target)) return
      if (target?.target_role) setTargetRole(target.target_role)
      if (target?.target_company) setTargetCompany(target.target_company)
      setBackgroundSummary((v) => v || experienceNarrative(profile))
      setPrefilled(true)
    })
    return () => { cancelled = true }
  }, [user.id])

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (!targetRole.trim()) { setError('Target role is required.'); return }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('interview_prep_packs')
        .insert([{ user_id: user.id, target_role: targetRole, target_company: targetCompany || null, interview_type: interviewType, input: { background_summary: backgroundSummary } }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-interview-prep', { pack_id: inserted.id })
      setPack(data.pack)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setLoading(false)
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
      const subId = await submitForReview('interview_prep_packs', pack.id, serviceName, `Interview Prep — ${targetRole}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

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
        {prefilled && !pack && <ProfilePrefillNote />}

        {!pack ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="target_role" label="Role you're interviewing for" required><FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="target_company" label="Company" hint="Optional"><FormInput id="target_company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="interview_type" label="Interview format" hint="Not sure? Blended covers all three.">
                <FormSelect id="interview_type" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                  <option value="blended">Blended (behavioural + technical + strengths)</option>
                  <option value="behavioural">Behavioural / competency-based</option>
                  <option value="technical">Technical</option>
                  <option value="strengths_based">Strengths-based</option>
                </FormSelect>
              </FormField>
              <FormField id="background_summary" label="Anything specific about your background or this interview?" hint="Optional">
                <FormTextarea id="background_summary" value={backgroundSummary} onChange={(e) => setBackgroundSummary(e.target.value)} rows={3} maxLength={LIMITS.LONG} />
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

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
