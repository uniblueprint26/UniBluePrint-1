import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS } from '../../lib/fieldLimits'
import { FormCard, FormField, FormInput, FormTextarea, FormCheckbox, ErrorBanner, parseDbError } from '../../components/ui/Form'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'

const initialInput = {
  current_status: '', key_skills: '', notable_achievements: '', target_connections: '', experience: '', tone: 'balanced',
}

export default function LinkedInOptimisationPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const [targetIndustry, setTargetIndustry] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [hasNoExperience, setHasNoExperience] = useState(false)
  const [input, setInput] = useState(initialInput)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cvDoc, setDocument] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key) => (e) => setInput((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => runLocked(async () => {
    e?.preventDefault?.()
    setError('')
    const skills = input.key_skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (!targetIndustry.trim() || !input.current_status.trim() || skills.length < 3) {
      setError('Industry, current status, and at least 3 key skills are required.')
      return
    }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('linkedin_documents')
        .insert([{
          user_id: user.id,
          target_industry: targetIndustry,
          target_role: targetRole || null,
          input: {
            current_status: input.current_status,
            key_skills: skills,
            notable_achievements: input.notable_achievements,
            target_connections: input.target_connections,
            experience: hasNoExperience ? '' : input.experience,
            has_no_experience: hasNoExperience,
            tone: input.tone,
          },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-linkedin', { document_id: inserted.id })
      setDocument(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!cvDoc) return
    setSubmitting(true)
    setError('')
    try {
      await submitForReview('linkedin_documents', cvDoc.id, 'LinkedIn Optimisation — Standard', 'LinkedIn Optimisation')
            setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <>
      <Helmet><title>LinkedIn Optimisation | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>LinkedIn Optimisation</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          A headline and About section that actually get found — plus experience rewrites, skill suggestions, and Featured section ideas.
        </p>

        {error && <ErrorBanner message={error} />}

        {!cvDoc ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="target_industry" label="Target industry / field" required>
                <FormInput id="target_industry" value={targetIndustry} onChange={(e) => setTargetIndustry(e.target.value)} required maxLength={LIMITS.SHORT} />
              </FormField>
              <FormField id="target_role" label="Title you want to be found for" hint="Optional">
                <FormInput id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={LIMITS.SHORT} />
              </FormField>
              <FormField id="current_status" label="Current status" required hint="e.g. Final year Computer Science student at UCD">
                <FormInput id="current_status" value={input.current_status} onChange={set('current_status')} required maxLength={LIMITS.MEDIUM} />
              </FormField>
              <FormField id="key_skills" label="Key skills" required hint="At least 3, comma separated">
                <FormInput id="key_skills" value={input.key_skills} onChange={set('key_skills')} maxLength={LIMITS.MEDIUM} />
              </FormField>
              <FormCheckbox
                id="has_no_experience"
                checked={hasNoExperience}
                onChange={(e) => setHasNoExperience(e.target.checked)}
                label="I have no formal work experience yet"
              />
              {hasNoExperience ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6 }}>
                  No problem — a student profile built on your About section, education, and projects is exactly what recruiters searching for graduate talent expect to find.
                </p>
              ) : (
                <FormField id="experience" label="Roles you've held" hint="Optional — job title, where, and roughly what you did, one per line">
                  <FormTextarea id="experience" value={input.experience} onChange={set('experience')} rows={4} maxLength={LIMITS.LONG} />
                </FormField>
              )}
              <FormField id="notable_achievements" label="Notable achievements" hint="Optional">
                <FormTextarea id="notable_achievements" value={input.notable_achievements} onChange={set('notable_achievements')} rows={3} maxLength={LIMITS.LONG} />
              </FormField>
              <FormField id="target_connections" label="What kind of connections do you want to attract?" hint="Optional — e.g. recruiters, clients, peers in your field">
                <FormInput id="target_connections" value={input.target_connections} onChange={set('target_connections')} maxLength={LIMITS.MEDIUM} />
              </FormField>
              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Generating…' : 'Generate my LinkedIn profile'}
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
            <BenchmarkNote sources={cvDoc.generated?.benchmarked_against} />
            <CopyableCard title="Headline" text={cvDoc.generated.headline} />
            {cvDoc.generated.headline_alternatives?.map((h, i) => (
              <CopyableCard key={i} title={`Alternative ${i + 1}`} text={h} muted />
            ))}
            <CopyableCard title="About section" text={cvDoc.generated.about_section} multiline />
            {cvDoc.generated.experience_rewrites?.map((r, i) => (
              <CopyableCard key={i} title={r.role_label} text={r.bullets.map((b) => `• ${b}`).join('\n')} multiline />
            ))}
            <FormCard>
              <h2 style={sectionHeading}>Skills to add</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {cvDoc.generated.skills_to_add?.map((s) => (
                  <span key={s} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#1E3A5F', background: 'rgba(30,58,95,0.06)', padding: '5px 10px', borderRadius: '6px' }}>{s}</span>
                ))}
              </div>
            </FormCard>
            <FormCard>
              <h2 style={sectionHeading}>Featured section ideas</h2>
              <ul style={{ margin: '10px 0 0', paddingLeft: '18px' }}>
                {cvDoc.generated.featured_section_ideas?.map((f, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{f}</li>)}
              </ul>
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

function CopyableCard({ title, text, muted, multiline }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{ background: muted ? '#F5F0E8' : '#FFFFFF', borderRadius: '12px', boxShadow: muted ? 'none' : '0px 2px 12px rgba(30,58,95,0.08)', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ ...sectionHeading, fontSize: '16px' }}>{title}</h2>
        <button
          type="button" onClick={handleCopy}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', cursor: 'pointer' }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.65, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{text}</p>
    </div>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }
