import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Send, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { FormCard, FormField, FormInput, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'

export default function PortfolioBuildingPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [field, setField] = useState('')
  const [workType, setWorkType] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [existingPresence, setExistingPresence] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (!field.trim() || !workType.trim()) { setError('Field and the kind of work you want to showcase are required.'); return }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('portfolio_plans')
        .insert([{ user_id: user.id, field, input: { work_type: workType, career_goal: careerGoal, existing_presence: existingPresence } }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-portfolio-plan', { plan_id: inserted.id })
      setPlan(data.plan)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!plan) return
    setSubmitting(true)
    try {
      await submitForReview('portfolio_plans', plan.id, 'Portfolio Building — Standard', `Portfolio Building — ${field}`)
            setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <>
      <Helmet><title>Portfolio Building | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Portfolio Building</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          The right platform for your field, plus a structure checklist — a portfolio's job is to get out of the way of the work.
        </p>

        {error && <ErrorBanner message={error} />}

        {!plan ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="field" label="Field" required hint="e.g. Software development, Graphic design, Marketing"><FormInput id="field" value={field} onChange={(e) => setField(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="work_type" label="What kind of work do you want to showcase?" required><FormTextarea id="work_type" value={workType} onChange={(e) => setWorkType(e.target.value)} rows={3} required maxLength={LIMITS.LONG} /></FormField>
              <FormField id="career_goal" label="What's this portfolio for?" hint="Optional — e.g. internship applications, freelance clients">
                <FormInput id="career_goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} maxLength={LIMITS.MEDIUM} />
              </FormField>
              <FormField id="existing_presence" label="Do you already have anything online?" hint="Optional — GitHub, a site, social profiles">
                <FormInput id="existing_presence" value={existingPresence} onChange={(e) => setExistingPresence(e.target.value)} maxLength={LIMITS.MEDIUM} />
              </FormField>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Building your plan…' : 'Get my portfolio plan'}
              </button>
            </form>
          </FormCard>
        ) : submitted ? (
          <FormCard>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Check size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Coach review</h2>
            </div>
          </FormCard>
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

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
