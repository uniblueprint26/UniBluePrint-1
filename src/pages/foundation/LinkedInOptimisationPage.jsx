import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { loadProfileDefaults, flattenProfileSkills, experienceNarrative } from '../../lib/careerProfile'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, ErrorBanner, parseDbError } from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import { SummaryRows, ResumeDraftCard, LoadingLine, splitCsv } from '../../components/foundation/QuestionFlowKit'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

/**
 * LinkedIn Optimisation's intake, rebuilt as a one-question-at-a-time
 * questionnaire — the same QuestionFlow pattern CV Optimisation established
 * as the reference implementation. See CvBuilderPage.jsx for the fuller
 * design notes; this file follows its shape rather than re-explaining it.
 *
 * What's reused unchanged: TierPicker, submitForReview, the generated-profile
 * review screen below (copy cards, skills-to-add, featured-section ideas) —
 * this rebuild only touches how the INPUT is collected.
 *
 * Draft autosave needs one migration this time (see
 * 20260903090000_linkedin_target_industry_nullable.sql): unlike
 * cv_documents, linkedin_documents.target_industry was NOT NULL, which would
 * have rejected the first autosave before the industry question was even
 * answered.
 */

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  target_industry: '', target_role: '',
  current_status: '',
  has_no_experience: false, experience: '',
  key_skills: '',
  notable_achievements: '',
  unsure_about: '',
  tone: 'balanced',
  target_connections: '',
}

export default function LinkedInOptimisationPage() {
  const { runLocked } = useSubmitLock()
  const { user } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  // §08 Career Profile: Quick Generate on the profile page can hand a
  // finished document straight here via router state.
  const [cvDoc, setDocument] = useState(location.state?.document ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [tier, setTier] = useState('standard')
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [profileKnown, setProfileKnown] = useState(null)

  const [draftCheck, setDraftCheck] = useState('checking')
  const [pendingDraft, setPendingDraft] = useState(null)
  const draftIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadProfileDefaults(user.id).then(({ profile, target }) => {
      if (cancelled) return
      setProfileKnown((profile || target) ? { profile, target } : {})
      if (profile || target) {
        setForm((f) => applyProfileDefaults(f, profile, target))
      }
    })

    supabase
      .from('linkedin_documents')
      .select('id, input, target_industry, target_role, updated_at')
      .eq('user_id', user.id)
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
  }, [user.id])

  const resumeDraft = () => {
    draftIdRef.current = pendingDraft.id
    setForm((f) => ({
      ...f,
      ...(pendingDraft.input || {}),
      target_industry: pendingDraft.target_industry || f.target_industry,
      target_role: pendingDraft.target_role || f.target_role,
      key_skills: Array.isArray(pendingDraft.input?.key_skills) ? pendingDraft.input.key_skills.join(', ') : (pendingDraft.input?.key_skills || f.key_skills),
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('linkedin_documents').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => {
    setForm((f) => ({ ...f, [path]: value }))
  }

  // Fires on every "Next" — silent-fail autosave, same rationale as CV's.
  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('linkedin_documents').update({
          input: draftInput, target_industry: form.target_industry || null, target_role: form.target_role || null, updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('linkedin_documents')
          .insert([{
            user_id: user.id,
            target_industry: form.target_industry || null,
            target_role: form.target_role || null,
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

  const buildInputPayload = (f) => ({
    current_status: f.current_status,
    key_skills: splitCsv(f.key_skills),
    notable_achievements: f.notable_achievements,
    target_connections: f.target_connections,
    experience: f.has_no_experience ? '' : f.experience,
    has_no_experience: f.has_no_experience,
    unsure_about: f.unsure_about,
    tone: f.tone,
  })

  const handleGenerate = () => runLocked(async () => {
    const tooLong = checkLengths([
      ['Current status', form.current_status, LIMITS.MEDIUM],
      ['Notable achievements', form.notable_achievements, LIMITS.LONG],
      ['Experience', form.experience, LIMITS.LONG],
    ])
    if (tooLong) { setError(tooLong); return }
    setGenerating(true)
    setError('')
    try {
      const payload = {
        user_id: user.id,
        target_industry: form.target_industry,
        target_role: form.target_role || null,
        input: buildInputPayload(form),
      }

      let documentId = draftIdRef.current
      if (documentId) {
        const { error: updateErr } = await supabase.from('linkedin_documents').update({ ...payload, status: 'draft' }).eq('id', documentId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('linkedin_documents').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        documentId = inserted.id
      }

      const data = await invokeFunction('generate-linkedin', { document_id: documentId })
      setDocument(data.document)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  })

  const handleSubmitForReview = () => runLocked(async () => {
    if (!cvDoc) return
    setSubmitting(true)
    setError('')
    try {
      const serviceName = tier === 'premium' ? 'LinkedIn Optimisation — Premium' : 'LinkedIn Optimisation — Standard'
      const subId = await submitForReview('linkedin_documents', cvDoc.id, serviceName, 'LinkedIn Optimisation', tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = useLinkedInSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>LinkedIn Optimisation | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>LinkedIn Optimisation</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          A headline and About section that actually get found — plus experience rewrites, skill suggestions, and Featured section ideas.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard
            onResume={resumeDraft} onDiscard={discardDraft}
            title="You have an unfinished LinkedIn request"
          />
        ) : !cvDoc ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Generate my LinkedIn profile"
            strapline="The more you give us, the better your output — this takes about 4 minutes, and everything is saved as you go."
            initialStepKey={form._current_step}
          />
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
            <div style={{ maxWidth: '360px' }}>
              <TierPicker value={tier} onChange={setTier} />
            </div>
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

/** Fills blanks from the profile/target — never overwrites something already typed. */
function applyProfileDefaults(f, profile, target) {
  const next = { ...f }
  if (profile) {
    if (!f.key_skills) next.key_skills = flattenProfileSkills(profile).join(', ')
    if (profile.has_no_experience) next.has_no_experience = true
    if (!f.experience && !profile.has_no_experience) next.experience = experienceNarrative(profile)
  }
  if (target) {
    next.target_industry = f.target_industry || target.target_industry || ''
    next.target_role = f.target_role || target.target_role || ''
  }
  return next
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
  return [
    ['Targeting', [form.target_role, form.target_industry].filter(Boolean).join(' · ') || form.target_industry],
    ['Current status', form.current_status || '—'],
    ['Experience', form.has_no_experience ? 'None yet — About section carries the profile' : 'Roles provided'],
    ['Skills', `${splitCsv(form.key_skills).length} listed`],
    ['Tone', form.tone],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

/**
 * The step configuration for QuestionFlow — profile-confirm opener, the
 * fields generate-linkedin already reads (current_status, target_industry,
 * target_role, experience, key_skills, notable_achievements, tone,
 * target_connections), plus unsure_about as the same universal quality
 * signal CV Optimisation added, tier selection, and a closing summary.
 *
 * tone was collected in state by the previous grouped form but never
 * actually exposed as an editable field — it silently sat at 'balanced'
 * forever. Fixed here: it's now its own real step.
 */
function useLinkedInSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'current_status',
      title: 'How would you describe your current status?',
      validate: (f) => (!f.current_status?.trim() ? 'Current status is required.' : ''),
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>e.g. Final year Computer Science student at UCD</p>
          <FormInput id="current_status" value={f.current_status} onChange={set('current_status')} required maxLength={LIMITS.MEDIUM} />
        </div>
      ),
    },
    {
      key: 'target_industry',
      title: 'What industry are you targeting?',
      validate: (f) => (!f.target_industry?.trim() ? 'Pick an industry so recruiters searching it can find you.' : ''),
      render: ({ form: f, set }) => <IndustrySelect id="target_industry" value={f.target_industry} onChange={set('target_industry')} required />,
    },
    {
      key: 'target_role',
      title: 'What title do you want to be found for?',
      optional: true,
      whyItHelps: 'the exact title recruiters search — leave it blank and we\'ll infer one from your status.',
      render: ({ form: f, set }) => (
        <FormInput id="target_role" value={f.target_role} onChange={set('target_role')} placeholder="e.g. Graduate Software Engineer" maxLength={LIMITS.SHORT} />
      ),
    },
    {
      key: 'experience',
      title: 'What work experience do you have?',
      validate: (f) => (!f.has_no_experience && !f.experience?.trim() ? 'Add your roles, or check "I have no formal work experience yet".' : ''),
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormCheckbox
            id="has_no_experience"
            checked={f.has_no_experience}
            onChange={set('has_no_experience')}
            label="I have no formal work experience yet"
          />
          {f.has_no_experience ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6 }}>
              No problem — a student profile built on your About section, education, and projects is exactly what recruiters searching for graduate talent expect to find.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>Job title, where, and roughly what you did — one per line.</p>
              <FormTextarea id="experience" value={f.experience} onChange={set('experience')} rows={4} maxLength={LIMITS.LONG} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'key_skills',
      title: 'What are your key skills?',
      validate: (f) => (splitCsv(f.key_skills).length < 3 ? 'List at least 3 skills, comma separated.' : ''),
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>At least 3, comma separated.</p>
          <FormInput id="key_skills" value={f.key_skills} onChange={set('key_skills')} maxLength={LIMITS.MEDIUM} />
        </div>
      ),
    },
    {
      key: 'notable_achievements',
      title: 'What achievements do you want your profile to highlight?',
      optional: true,
      whyItHelps: 'a project, an award, a result — this becomes the proof point in your About section.',
      render: ({ form: f, set }) => (
        <FormTextarea id="notable_achievements" value={f.notable_achievements} onChange={set('notable_achievements')} rows={4} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure how to present?',
      optional: true,
      whyItHelps: 'a gap, a career change, an unconventional path — tell us and we\'ll frame it honestly rather than skip it.',
      render: ({ form: f, set }) => (
        <FormTextarea id="unsure_about" value={f.unsure_about} onChange={set('unsure_about')} rows={4} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'tone',
      title: 'What tone should it have?',
      validate: (f) => (!f.tone?.trim() ? 'Tone is required.' : ''),
      render: ({ form: f, set }) => (
        <FormSelect id="tone" value={f.tone} onChange={set('tone')} required>
          <option value="formal">Formal</option>
          <option value="balanced">Balanced</option>
          <option value="modern">Modern</option>
        </FormSelect>
      ),
    },
    {
      key: 'context_signals',
      title: 'One last detail',
      optional: true,
      whyItHelps: 'sharpens who the profile is written to attract, but nothing here blocks a strong result either way.',
      render: ({ form: f, set }) => (
        <FormField id="target_connections" label="What kind of connections do you want to attract?" hint="Optional — e.g. recruiters, clients, peers in your field">
          <FormInput id="target_connections" value={f.target_connections} onChange={set('target_connections')} maxLength={LIMITS.MEDIUM} />
        </FormField>
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
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or generate your LinkedIn profile now." rows={summaryRows(f, tier)} />,
    },
  ]
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
