import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, ErrorBanner, parseDbError } from '../../components/ui/Form'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'

export default function CoverLetterBuilderPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [targetRole, setTargetRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [backgroundSummary, setBackgroundSummary] = useState('')
  const [whyCompany, setWhyCompany] = useState('')
  const [relevantExperience, setRelevantExperience] = useState('')
  const [hasNoExperience, setHasNoExperience] = useState(false)
  const [tone, setTone] = useState('balanced')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [letter, setLetter] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (!targetRole.trim() || !targetCompany.trim() || !relevantExperience.trim()) {
      setError('Target role, company, and relevant experience are required.')
      return
    }
    const tooLong = checkLengths([['The job description', jobDescription, LIMITS.PASTE_JD]])
    if (tooLong) { setError(tooLong); return }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('cover_letters')
        .insert([{
          user_id: user.id, target_role: targetRole, target_company: targetCompany, job_description: jobDescription || null,
          input: { background_summary: backgroundSummary, why_this_company: whyCompany, relevant_experience: relevantExperience, has_no_experience: hasNoExperience, tone, industry },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-cover-letter', { document_id: inserted.id })
      setLetter(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!letter) return
    setSubmitting(true)
    setError('')
    try {
      await submitForReview('cover_letters', letter.id, 'Cover Letter Assistance — Standard', `Cover Letter — ${targetRole} at ${targetCompany}`)
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

  return (
    <>
      <Helmet><title>Cover Letter Builder | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Cover Letter Builder</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Written for one specific role at one specific company — never a generic template.
        </p>

        {error && <ErrorBanner message={error} />}

        {!letter ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="target_role" label="Role you're applying for" required><FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="target_company" label="Company" required><FormInput id="target_company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} required maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="industry" label="Industry" hint="Optional — helps us benchmark against real examples from your field"><FormInput id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="job_description" label="Paste the job description" hint="Optional — sharpens relevance"><FormTextarea id="job_description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} maxLength={LIMITS.PASTE_JD} /></FormField>
              <FormField id="background_summary" label="A little about your background" hint="Optional"><FormTextarea id="background_summary" value={backgroundSummary} onChange={(e) => setBackgroundSummary(e.target.value)} rows={3} maxLength={LIMITS.LONG} /></FormField>
              <FormCheckbox
                id="has_no_experience"
                checked={hasNoExperience}
                onChange={(e) => setHasNoExperience(e.target.checked)}
                label="I have no formal work experience yet"
              />
              <FormField
                id="relevant_experience"
                label={hasNoExperience ? 'Your most relevant projects, coursework, or activities for this role' : 'Your most relevant experience for this role'}
                required
                hint={hasNoExperience ? 'College projects, societies, volunteering, and part-time work all count — this is the real evidence your letter will be built on.' : undefined}
              >
                <FormTextarea id="relevant_experience" value={relevantExperience} onChange={(e) => setRelevantExperience(e.target.value)} rows={4} required maxLength={LIMITS.LONG} />
              </FormField>
              <FormField id="why_company" label="Why this company specifically?" hint="Optional, but makes the letter much stronger"><FormTextarea id="why_company" value={whyCompany} onChange={(e) => setWhyCompany(e.target.value)} rows={3} maxLength={LIMITS.LONG} /></FormField>
              <FormField id="tone" label="Tone">
                <FormSelect id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option value="formal">Formal</option>
                  <option value="balanced">Balanced</option>
                  <option value="modern">Modern</option>
                </FormSelect>
              </FormField>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Writing…' : 'Generate my cover letter'}
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
