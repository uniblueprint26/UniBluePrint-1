import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FormCard, FormField, FormInput, FormTextarea, ErrorBanner } from '../../components/ui/Form'
import ScoreGauge from '../../components/foundation/ScoreGauge'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'

export default function CvReviewPage() {
  const [rawText, setRawText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [industry, setIndustry] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (rawText.trim().length < 50) { setError('Paste the full text of your CV to review.'); return }
    setLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('review-cv', {
        body: { raw_text: rawText, target_role: targetRole || null, industry: industry || null, job_description: jobDescription || null },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setReview(data.review)
    } catch (err) {
      setError(err.message || 'Review failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>CV Review | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>CV Review</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Already have a CV? Paste it below for an ATS score and specific, actionable feedback. Add a target role or job description for a much sharper keyword analysis.
        </p>

        {error && <ErrorBanner message={error} />}

        {!review ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="raw_text" label="Paste your CV text" required>
                <FormTextarea id="raw_text" value={rawText} onChange={(e) => setRawText(e.target.value)} rows={12} required />
              </FormField>
              <FormField id="target_role" label="Target role" hint="Optional, but strongly recommended">
                <FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </FormField>
              <FormField id="industry" label="Industry" hint="Optional — unlocks industry-specific red-flag checks (e.g. tech, law, healthcare, finance)">
                <FormInput id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </FormField>
              <FormField id="job_description" label="Paste a job description" hint="Optional — the most accurate way to score keyword match">
                <FormTextarea id="job_description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} />
              </FormField>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Reviewing…' : 'Review my CV'}
              </button>
            </form>
          </FormCard>
        ) : (
          <ReviewResult review={review} onReset={() => setReview(null)} />
        )}
      </div>
    </>
  )
}

function ReviewResult({ review, onReset }) {
  const r = review.report
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <BenchmarkNote sources={review.report?.benchmarked_against} />
      <FormCard>
        <h2 style={sectionHeading}>ATS Report</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '16px' }}>
          <ScoreGauge label="Overall" score={r.ats_report.overall_score} large />
          <ScoreGauge label="Keyword match (40%)" score={r.ats_report.keyword_match_score} />
          <ScoreGauge label="Role alignment (35%)" score={r.ats_report.role_alignment_score} />
          <ScoreGauge label="Formatting (25%)" score={r.ats_report.formatting_score} />
        </div>
        {r.ats_report.note && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF', marginTop: '12px' }}>{r.ats_report.note}</p>
        )}
        {r.ats_report.missing_keywords?.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '8px' }}>Keywords not found:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {r.ats_report.missing_keywords.map((k) => (
                <span key={k} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', background: 'rgba(30,58,95,0.06)', padding: '4px 9px', borderRadius: '4px' }}>{k}</span>
              ))}
            </div>
          </div>
        )}
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Summary</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{r.overall_summary}</p>
      </FormCard>

      <FindingsCard title="Industry-specific red flags" items={r.industry_red_flags} color="#DC2626" icon />
      <FindingsCard title="Strengths" items={r.strengths} color="#16A34A" />
      <FindingsCard title="Weaknesses" items={r.weaknesses} color="#DC2626" />
      <FindingsCard title="Duty vs. achievement flags" items={r.duty_vs_achievement_flags} color="#DC2626" icon />
      <FindingsCard title="Generic language flags" items={r.generic_language_flags} color="#DC2626" />
      <FindingsCard title="Formatting issues" items={r.formatting_issues} color="#DC2626" />
      <FindingsCard title="Spelling & grammar" items={r.spelling_grammar_issues} color="#DC2626" />

      <button
        type="button" onClick={onReset}
        style={{ alignSelf: 'flex-start', height: '44px', padding: '0 20px', background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
      >
        Review another CV
      </button>
    </div>
  )
}

function FindingsCard({ title, items, color, icon }) {
  if (!items || items.length === 0) return null
  return (
    <FormCard>
      <h2 style={sectionHeading}>{title}</h2>
      <ul style={{ margin: '12px 0 0', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
            {icon && <AlertTriangle size={14} color={color} style={{ marginTop: '3px', flexShrink: 0 }} aria-hidden="true" />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </FormCard>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }
