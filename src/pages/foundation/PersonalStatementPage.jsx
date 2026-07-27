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
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, ErrorBanner, parseDbError } from '../../components/ui/Form'

const PATHWAYS = [
  ['ucas', 'UCAS (UK undergraduate)', 'Three structured questions — the new 2026 entry format.'],
  ['cao_mature', 'CAO — Mature applicant', 'For mature students, or RCSI / portfolio-based programmes requiring a statement.'],
  ['postgrad', 'Postgraduate / Masters', 'The five-part structure — academic background, skills, goals, and course fit.'],
]

export default function PersonalStatementPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [pathway, setPathway] = useState('')
  const [targetCourse, setTargetCourse] = useState('')
  const [targetInstitution, setTargetInstitution] = useState('')
  const [backgroundAndMotivation, setBackgroundAndMotivation] = useState('')
  const [relevantExperience, setRelevantExperience] = useState('')
  const [lifeWorkExperience, setLifeWorkExperience] = useState('')
  const [goals, setGoals] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doc, setDoc] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (!pathway || !targetCourse.trim() || !targetInstitution.trim() || !backgroundAndMotivation.trim()) {
      setError('Pathway, course, institution, and background/motivation are required.')
      return
    }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('personal_statements')
        .insert([{
          user_id: user.id, pathway, target_course: targetCourse, target_institution: targetInstitution,
          input: {
            background_and_motivation: backgroundAndMotivation,
            relevant_experience: relevantExperience,
            life_work_experience: lifeWorkExperience,
            goals,
            weaknesses_or_gaps: weaknesses,
          },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-personal-statement', { document_id: inserted.id })
      setDoc(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!doc) return
    setSubmitting(true)
    try {
      await submitForReview('personal_statements', doc.id, 'Personal Statement — Standard', `Personal Statement — ${targetCourse} at ${targetInstitution}`)
            setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <>
      <Helmet><title>Personal Statement Builder | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Personal Statement Builder</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          UCAS, CAO mature applicant, or postgraduate — three genuinely different structures, not one template with the label swapped.
        </p>

        {error && <ErrorBanner message={error} />}

        {!doc ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A5F', marginBottom: '10px' }}>Which applies to you? *</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PATHWAYS.map(([value, label, hint]) => (
                    <button
                      type="button" key={value} onClick={() => setPathway(value)}
                      style={{
                        textAlign: 'left', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                        border: pathway === value ? '2px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.15)',
                        background: pathway === value ? 'rgba(30,58,95,0.05)' : '#FFFFFF',
                      }}
                    >
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1E3A5F' }}>{label}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '2px' }}>{hint}</p>
                    </button>
                  ))}
                </div>
              </div>
              <FormField id="target_course" label="Course" required><FormInput id="target_course" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="target_institution" label="Institution" required><FormInput id="target_institution" value={targetInstitution} onChange={(e) => setTargetInstitution(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="background" label="Background and motivation" required hint="Why this course? What draws you to it?">
                <FormTextarea id="background" value={backgroundAndMotivation} onChange={(e) => setBackgroundAndMotivation(e.target.value)} rows={4} required maxLength={LIMITS.LONG} />
              </FormField>
              <FormField id="relevant_experience" label="Relevant academic experience / modules" hint="Optional">
                <FormTextarea id="relevant_experience" value={relevantExperience} onChange={(e) => setRelevantExperience(e.target.value)} rows={3} maxLength={LIMITS.LONG} />
              </FormField>
              {pathway === 'cao_mature' && (
                <FormField id="life_work_experience" label="Relevant life or work experience" hint="This carries real weight for a mature applicant statement">
                  <FormTextarea id="life_work_experience" value={lifeWorkExperience} onChange={(e) => setLifeWorkExperience(e.target.value)} rows={4} maxLength={LIMITS.LONG} />
                </FormField>
              )}
              <FormField id="goals" label="Goals" hint="Optional — what do you want this course to lead to?">
                <FormTextarea id="goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} maxLength={LIMITS.LONG} />
              </FormField>
              {pathway === 'postgrad' && (
                <FormField id="weaknesses" label="Anything you want addressed honestly?" hint="Optional — e.g. a lower grade or a gap. Leave blank if not relevant.">
                  <FormTextarea id="weaknesses" value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2} maxLength={LIMITS.LONG} />
                </FormField>
              )}
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Writing…' : 'Generate my statement'}
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
