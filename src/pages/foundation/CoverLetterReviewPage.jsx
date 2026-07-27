import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { FormCard, FormField, FormInput, FormTextarea, ErrorBanner } from '../../components/ui/Form'

const DIMENSIONS = [
  ['structure', 'Structure'], ['tone', 'Tone'], ['storytelling', 'Storytelling'],
  ['relevance', 'Relevance'], ['employer_alignment', 'Employer alignment'],
]

export default function CoverLetterReviewPage() {
  const { runLocked } = useSubmitLock()
  const [rawText, setRawText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    if (rawText.trim().length < 50) { setError('Paste the full text of your cover letter to review.'); return }
    const tooLong = checkLengths([['Your cover letter text', rawText, LIMITS.PASTE_DOC]])
    if (tooLong) { setError(tooLong); return }
    setLoading(true)
    try {
      const data = await invokeFunction('review-cover-letter', { raw_text: rawText, target_role: targetRole || null, target_company: targetCompany || null })
      setReview(data.review)
    } catch (err) {
      setError(err.message || 'Review failed. Please try again.')
    } finally {
      setLoading(false)
    }
  })

  return (
    <>
      <Helmet><title>Cover Letter Review | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Cover Letter Review</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Structure, tone, storytelling, relevance, and employer alignment — five specific things, not a made-up score.
        </p>

        {error && <ErrorBanner message={error} />}

        {!review ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="raw_text" label="Paste your cover letter" required><FormTextarea id="raw_text" value={rawText} onChange={(e) => setRawText(e.target.value)} rows={10} required maxLength={LIMITS.PASTE_DOC} /></FormField>
              <FormField id="target_role" label="Target role" hint="Optional"><FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="target_company" label="Target company" hint="Optional"><FormInput id="target_company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} maxLength={LIMITS.SHORT} /></FormField>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Reviewing…' : 'Review my cover letter'}
              </button>
            </form>
          </FormCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormCard>
              <h2 style={sectionHeading}>Overall</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{review.report.overall_summary}</p>
            </FormCard>
            {DIMENSIONS.map(([key, label]) => (
              <FormCard key={key}>
                <h2 style={sectionHeading}>{label}</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.6 }}>{review.report[key]}</p>
              </FormCard>
            ))}
            <button
              type="button" onClick={() => setReview(null)}
              style={{ alignSelf: 'flex-start', height: '44px', padding: '0 20px', background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              Review another letter
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }
