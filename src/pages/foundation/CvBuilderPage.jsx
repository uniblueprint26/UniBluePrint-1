import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Trash2, Download, Send, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import { submitForReview } from '../../lib/submitForReview'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { loadProfileDefaults } from '../../lib/careerProfile'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import {
  FormCard, FormField, FormInput, FormSelect, FormTextarea,
  ErrorBanner, parseDbError,
} from '../../components/ui/Form'
import QuestionFlow from '../../components/foundation/QuestionFlow'
import {
  SummaryRows, ResumeDraftCard, LoadingLine, ChoiceGrid, AddRowButton,
  repeatCard, removeBtn, sectionHeading, splitCsv,
} from '../../components/foundation/QuestionFlowKit'
import ScoreGauge from '../../components/foundation/ScoreGauge'
import CvPreview from '../../components/foundation/CvPreview'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'
import IndustrySelect from '../../components/foundation/IndustrySelect'
import TierPicker from '../../components/foundation/TierPicker'
import PipelineStatusTimeline from '../../components/foundation/PipelineStatusTimeline'

/**
 * CV Optimisation's intake, rebuilt as a one-question-at-a-time questionnaire.
 *
 * This is the reference implementation for Foundation Blueprint's other 8
 * services — see the product spec: the questionnaire is a conversation, not
 * a form; every question earns its place; nothing is asked twice. Building
 * block choices made here (QuestionFlow, the draft-autosave pattern, the
 * profile-confirm step) are meant to be copied, not reinvented, for the next
 * service.
 *
 * What's reused unchanged from before this rebuild, because it already
 * matched the spec: TierPicker (Standard/Premium, no payment dependency),
 * submitForReview + submit_document_for_review (tier recorded atomically,
 * queued into the Handler pipeline), the ATS report / CV preview / delivery
 * pipeline downstream of generation. This rebuild only touches how the INPUT
 * is collected, not what happens after "Generate my CV".
 *
 * Draft autosave needs no migration: cv_documents.status already allows
 * 'draft' (it just sat unused before this), and `input` is schemaless jsonb —
 * the current step key is stashed inside it as input._current_step so a
 * returning student resumes at the exact question they left on, not just
 * with their data intact.
 */

const emptyEducation = () => ({ institution: '', degree: '', year: '', grade: '', modules: '', awards: '' })
const emptyExperience = () => ({ job_title: '', company: '', dates: '', responsibilities: '' })

const YEARS_EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'None yet' },
  { value: 'under_1', label: 'Less than 1 year' },
  { value: '1_2', label: '1–2 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_plus', label: '5+ years' },
]

const DRAFT_MAX_AGE_DAYS = 7

const initialForm = {
  personal_info: { full_name: '', email: '', phone: '', location: '', linkedin_url: '', portfolio_url: '' },
  target_industry: '', target_role: '', opportunity_type: '', target_company: '', target_emphasis: '', job_description: '',
  years_experience_band: '',
  education: [emptyEducation()],
  has_no_experience: false,
  experience: [emptyExperience()],
  skills: { technical: '', soft: '', languages: '', tools: '' },
  achievements_highlight: '',
  unsure_about: '',
  existing_cv_text: '',
  tone: 'balanced', length: 'one_page', specific_requests: '',
  style: 'classic_ats',
}

export default function CvBuilderPage() {
  const { user } = useAuth()
  const location = useLocation()
  const { runLocked } = useSubmitLock()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  // §08 Career Profile: Quick Generate on the profile page inserts the row and
  // calls generate-cv itself, then hands the finished document here via router
  // state so the result renders immediately instead of the empty wizard.
  const [cvDoc, setDocument] = useState(location.state?.document ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [profileKnown, setProfileKnown] = useState(null) // null = still loading, {} = checked, nothing found
  const [tier, setTier] = useState('standard')

  // Draft detection/resume — checked before the flow renders at all, so a
  // returning student sees the resume prompt first, not a blank flow.
  const [draftCheck, setDraftCheck] = useState('checking') // checking | offer | resumed | none
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
      .from('cv_documents')
      .select('id, input, target_role, target_industry, target_company, job_description, style, updated_at')
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
    const draftInput = pendingDraft.input || {}
    setForm((f) => ({
      ...f,
      ...draftInput,
      // buildInputPayload saves skills as arrays (splitCsv'd for the
      // generator); the form's own skills fields are the raw comma-separated
      // strings the FormInputs edit. Without converting back on resume, a
      // returning student's skills step would silently hold arrays where it
      // expects strings, and the next save would call splitCsv() on an
      // array and throw.
      skills: draftInput.skills ? {
        technical: (draftInput.skills.technical || []).join(', '),
        soft: (draftInput.skills.soft || []).join(', '),
        languages: (draftInput.skills.languages || []).join(', '),
        tools: (draftInput.skills.tools || []).join(', '),
      } : f.skills,
      // Top-level columns, not part of input — restored from the row itself,
      // matching every other rebuilt service's resumeDraft.
      target_role: pendingDraft.target_role || f.target_role,
      target_industry: pendingDraft.target_industry || f.target_industry,
      target_company: pendingDraft.target_company || f.target_company,
      job_description: pendingDraft.job_description || f.job_description,
      style: pendingDraft.style || f.style,
    }))
    setDraftCheck('resumed')
  }
  const discardDraft = () => {
    supabase.from('cv_documents').delete().eq('id', pendingDraft.id).then(() => {})
    setPendingDraft(null)
    setDraftCheck('none')
  }

  const onFieldChange = (path, value) => {
    setForm((f) => {
      const next = { ...f }
      const keys = path.split('.')
      let cursor = next
      for (let i = 0; i < keys.length - 1; i++) {
        cursor[keys[i]] = { ...cursor[keys[i]] }
        cursor = cursor[keys[i]]
      }
      cursor[keys[keys.length - 1]] = value
      return next
    })
  }

  // Fires on every "Next" — the autosave. Failure here is deliberately silent
  // (a network blip must never block someone moving through the flow): the
  // student loses nothing but the resume convenience, not their answers,
  // which still live in local state either way.
  const saveDraft = async (stepKey) => {
    const draftInput = { ...buildInputPayload(form), _current_step: stepKey }
    try {
      if (draftIdRef.current) {
        await supabase.from('cv_documents').update({
          input: draftInput,
          title: `${form.personal_info.full_name || 'Untitled'} — ${form.target_role || form.target_industry || 'CV'}`,
          style: form.style,
          target_role: form.target_role || null,
          target_industry: form.target_industry || null,
          target_company: form.target_company || null,
          job_description: form.job_description || null,
          updated_at: new Date().toISOString(),
        }).eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('cv_documents')
          .insert([{
            user_id: user.id,
            title: `${form.personal_info.full_name || 'Untitled'} — ${form.target_role || form.target_industry || 'CV'}`,
            style: form.style,
            target_role: form.target_role || null,
            target_industry: form.target_industry || null,
            target_company: form.target_company || null,
            job_description: form.job_description || null,
            input: draftInput,
            status: 'draft',
          }])
          .select('id')
          .single()
        if (data) draftIdRef.current = data.id
      }
    } catch {
      // silent — see comment above
    }
  }

  const buildInputPayload = (f) => ({
    personal_info: f.personal_info,
    target_emphasis: f.target_emphasis,
    opportunity_type: f.opportunity_type,
    years_experience_band: f.years_experience_band,
    education: f.education.filter((e) => e.institution || e.degree),
    has_no_experience: f.has_no_experience,
    experience: f.has_no_experience ? [] : f.experience
      .filter((r) => r.job_title || r.company)
      .map((r) => ({ ...r, responsibilities: r.responsibilities })),
    skills: {
      technical: splitCsv(f.skills.technical),
      soft: splitCsv(f.skills.soft),
      languages: splitCsv(f.skills.languages),
      tools: splitCsv(f.skills.tools),
    },
    achievements_highlight: f.achievements_highlight,
    unsure_about: f.unsure_about,
    existing_cv_text: f.existing_cv_text,
    tone: f.tone,
    length: f.length,
    specific_requests: f.specific_requests,
  })

  const handleGenerate = () => runLocked(async () => {
    const tooLong = checkLengths([
      ['The job description', form.job_description, LIMITS.PASTE_JD],
      ['Your existing CV', form.existing_cv_text, LIMITS.PASTE_DOC],
    ])
    if (tooLong) { setError(tooLong); return }
    setGenerating(true)
    setError('')
    try {
      const payload = {
        user_id: user.id,
        title: `${form.personal_info.full_name || 'Untitled'} — ${form.target_role || form.target_industry}`,
        style: form.style,
        target_role: form.target_role || null,
        target_industry: form.target_industry,
        target_company: form.target_company || null,
        job_description: form.job_description || null,
        input: buildInputPayload(form),
      }

      // Reuse the draft row if one exists — generate-cv itself flips status to
      // 'generated', so this is the only place that row's lifecycle needs
      // handling. No draft yet (e.g. resumed instantly and hit the last step
      // in one sitting) means there's nothing to reuse — insert fresh.
      let documentId = draftIdRef.current
      if (documentId) {
        const { error: updateErr } = await supabase.from('cv_documents').update(payload).eq('id', documentId)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('cv_documents').insert([payload]).select('id').single()
        if (insertErr) throw insertErr
        documentId = inserted.id
      }

      const data = await invokeFunction('generate-cv', { document_id: documentId })
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
      const serviceName = tier === 'premium' ? 'CV Optimisation — Premium' : 'CV Optimisation — Standard'
      const subId = await submitForReview('cv_documents', cvDoc.id, serviceName, `CV Builder — ${cvDoc.title}`, tier)
      setSubmissionId(subId)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  })

  const steps = useCvSteps({ form, profileKnown, tier, setTier })

  return (
    <>
      <Helmet><title>CV Optimisation | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>CV Optimisation</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          A few quick questions, then a tailored, ATS-optimised CV — reviewed by a Campus Handler before delivery.
        </p>

        {error && <ErrorBanner message={error} />}

        {draftCheck === 'checking' || profileKnown === null ? (
          <FormCard><LoadingLine label="Loading…" /></FormCard>
        ) : draftCheck === 'offer' ? (
          <ResumeDraftCard onResume={resumeDraft} onDiscard={discardDraft} />
        ) : !cvDoc ? (
          <QuestionFlow
            steps={steps}
            form={form}
            onFieldChange={onFieldChange}
            onStepAdvance={saveDraft}
            onComplete={handleGenerate}
            completing={generating}
            completeLabel="Generate my CV"
            strapline="The more you give us, the better your output — this takes about 5 minutes, and everything is saved as you go."
            initialStepKey={form._current_step}
          />
        ) : (
          <ReviewStep
            cvDoc={cvDoc}
            submitted={submitted}
            submissionId={submissionId}
            submitting={submitting}
            tier={tier}
            onTierChange={setTier}
            onSubmitForReview={handleSubmitForReview}
            onStartOver={() => { setDocument(null); setForm(initialForm); draftIdRef.current = null; setSubmitted(false) }}
          />
        )}
      </div>
    </>
  )
}

/** Fills blanks from the profile/target — never overwrites something already typed. */
function applyProfileDefaults(f, profile, target) {
  const next = { ...f }
  if (profile) {
    next.personal_info = { ...profile.personal_info, ...stripEmpty(f.personal_info) }
    if (profile.education?.length && !f.education.some((e) => e.institution || e.degree)) next.education = profile.education
    if (profile.experience?.length && !f.experience.some((r) => r.job_title || r.company)) next.experience = profile.experience
    if (profile.skills) next.skills = { ...profile.skills, ...stripEmpty(f.skills) }
    if (profile.has_no_experience) next.has_no_experience = true
    if (!f.achievements_highlight && profile.achievements) {
      next.achievements_highlight = flattenAchievements(profile.achievements)
    }
  }
  if (target) {
    next.target_industry = f.target_industry || target.target_industry || ''
    next.target_role = f.target_role || target.target_role || ''
    next.target_company = f.target_company || target.target_company || ''
    next.job_description = f.job_description || target.job_description || ''
  }
  return next
}

/** Old profile shape (5 category fields) collapsed into the new single open-text question. */
function flattenAchievements(a) {
  return [a.societies, a.volunteering, a.projects, a.publications, a.other].filter(Boolean).join('\n')
}

function stripEmpty(obj) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined))
}

/**
 * The step configuration for QuestionFlow — this is the actual questionnaire
 * design, matching the CV Optimisation question list from the product spec:
 * existing CV, target role, target industry, years of experience, key
 * achievements to highlight, anything unsure about, and style preference —
 * plus the profile-confirm opener, a consolidated context/quality-signals
 * step, tier selection, and a closing summary, all positioned per the spec's
 * step ordering (context signals after core questions, tier at the end).
 */
function useCvSteps({ form, profileKnown, tier, setTier }) {
  const hasKnownProfile = profileKnown && (profileKnown.profile || profileKnown.target)

  return [
    {
      key: 'profile_check',
      title: 'Here\'s what we already know',
      skip: () => !hasKnownProfile,
      render: () => <SummaryRows intro="From your Career Profile — you'll get the chance to update anything on the next few screens." rows={profileCheckRows(profileKnown)} emptyLabel="Not much on file yet — that's fine, we'll capture it as we go." />,
    },
    {
      key: 'existing_cv',
      title: 'Have an existing CV?',
      optional: true,
      whyItHelps: 'paste it in and we\'ll pull real detail from it instead of starting blank.',
      render: ({ form: f, set }) => (
        <FormTextarea id="existing_cv_text" value={f.existing_cv_text} onChange={set('existing_cv_text')} rows={8} maxLength={LIMITS.PASTE_DOC} placeholder="Paste the text of your current CV here…" />
      ),
    },
    {
      key: 'personal_info',
      title: 'How can employers reach you?',
      validate: (f) => {
        const p = f.personal_info
        if (!p.full_name?.trim() || !p.email?.trim() || !p.phone?.trim() || !p.location?.trim()) return 'Full name, email, phone, and location are required.'
        return ''
      },
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="full_name" label="Full name" required><FormInput id="full_name" value={f.personal_info.full_name} onChange={set('personal_info.full_name')} required maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="email" label="Email address" required><FormInput id="email" type="email" value={f.personal_info.email} onChange={set('personal_info.email')} required maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="phone" label="Phone number" required><FormInput id="phone" value={f.personal_info.phone} onChange={set('personal_info.phone')} required maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="location" label="Location (city/county)" required><FormInput id="location" value={f.personal_info.location} onChange={set('personal_info.location')} required maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="linkedin_url" label="LinkedIn URL" hint="Optional"><FormInput id="linkedin_url" value={f.personal_info.linkedin_url} onChange={set('personal_info.linkedin_url')} maxLength={LIMITS.MEDIUM} /></FormField>
          <FormField id="portfolio_url" label="Portfolio / website URL" hint="Optional"><FormInput id="portfolio_url" value={f.personal_info.portfolio_url} onChange={set('personal_info.portfolio_url')} maxLength={LIMITS.MEDIUM} /></FormField>
        </div>
      ),
    },
    {
      key: 'target_industry',
      title: 'What industry are you targeting?',
      validate: (f) => (!f.target_industry?.trim() ? 'Pick an industry so we can tailor your CV to it.' : ''),
      render: ({ form: f, set }) => <IndustrySelect id="target_industry" value={f.target_industry} onChange={set('target_industry')} required />,
    },
    {
      key: 'target_role',
      title: 'What role or job title are you going for?',
      optional: true,
      whyItHelps: 'leave it blank for a general-purpose CV, or tell us for a tailored one.',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormInput id="target_role" value={f.target_role} onChange={set('target_role')} placeholder="e.g. Graduate Software Engineer" maxLength={LIMITS.SHORT} />
          <FormField id="opportunity_type" label="Type of opportunity" hint="Optional">
            <FormSelect id="opportunity_type" value={f.opportunity_type} onChange={set('opportunity_type')}>
              <option value="">Select…</option>
              <option value="graduate_scheme">Graduate scheme</option>
              <option value="internship">Internship</option>
              <option value="part_time">Part time</option>
              <option value="full_time">Full time</option>
              <option value="placement_year">Placement year</option>
            </FormSelect>
          </FormField>
        </div>
      ),
    },
    {
      key: 'years_experience',
      title: 'How much work experience do you have?',
      validate: (f) => (!f.years_experience_band ? 'Pick the closest option.' : ''),
      render: ({ form: f, set, setPath }) => (
        <ChoiceGrid
          options={YEARS_EXPERIENCE_OPTIONS}
          value={f.years_experience_band}
          onChange={(v) => {
            set('years_experience_band')(v)
            setPath('has_no_experience', v === 'none')
          }}
        />
      ),
    },
    {
      key: 'experience',
      title: 'Tell us about your work experience',
      skip: (f) => f.has_no_experience,
      validate: (f) => {
        const hasValidRole = f.experience.some((r) => r.job_title?.trim() && r.company?.trim() && r.dates?.trim())
        return hasValidRole ? '' : 'Add at least one role with a title, company, and dates.'
      },
      render: ({ form: f, setPath }) => (
        <ExperienceEntries
          experience={f.experience}
          onChange={(i, field, v) => setPath('experience', f.experience.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)))}
          onAdd={() => setPath('experience', [...f.experience, emptyExperience()])}
          onRemove={(i) => setPath('experience', f.experience.filter((_, idx) => idx !== i))}
        />
      ),
    },
    {
      key: 'education',
      title: 'And your education',
      validate: (f) => {
        const e0 = f.education[0]
        return (!e0?.institution?.trim() || !e0?.degree?.trim() || !e0?.year?.trim())
          ? 'The first education entry needs an institution, degree, and year.' : ''
      },
      render: ({ form: f, setPath }) => (
        <EducationEntries
          education={f.education}
          onChange={(i, field, v) => setPath('education', f.education.map((e, idx) => (idx === i ? { ...e, [field]: v } : e)))}
          onAdd={() => setPath('education', [...f.education, emptyEducation()])}
          onRemove={(i) => setPath('education', f.education.filter((_, idx) => idx !== i))}
        />
      ),
    },
    {
      key: 'skills',
      title: 'What skills do you want on your CV?',
      validate: (f) => {
        const count = Object.values(f.skills).reduce((n, v) => n + (v ? v.split(',').filter((s) => s.trim()).length : 0), 0)
        return count < 3 ? 'List at least 3 skills in total, across any of the categories below.' : ''
      },
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>At least 3 in total. Separate with commas.</p>
          <FormField id="skills_technical" label="Technical skills"><FormInput id="skills_technical" value={f.skills.technical} onChange={set('skills.technical')} placeholder="e.g. Excel, Python, Salesforce" maxLength={LIMITS.MEDIUM} /></FormField>
          <FormField id="skills_soft" label="Soft skills"><FormInput id="skills_soft" value={f.skills.soft} onChange={set('skills.soft')} placeholder="e.g. Communication, Teamwork" maxLength={LIMITS.MEDIUM} /></FormField>
          <FormField id="skills_languages" label="Languages"><FormInput id="skills_languages" value={f.skills.languages} onChange={set('skills.languages')} placeholder="e.g. Irish (fluent), French (B2)" maxLength={LIMITS.MEDIUM} /></FormField>
          <FormField id="skills_tools" label="Tools and software"><FormInput id="skills_tools" value={f.skills.tools} onChange={set('skills.tools')} placeholder="e.g. Figma, SAP, Google Analytics" maxLength={LIMITS.MEDIUM} /></FormField>
        </div>
      ),
    },
    {
      key: 'achievements_highlight',
      title: 'What do you most want us to highlight?',
      optional: true,
      whyItHelps: 'the more specific, the better — this is the raw material we turn into your strongest bullets.',
      render: ({ form: f, set }) => (
        <FormTextarea
          id="achievements_highlight" value={f.achievements_highlight} onChange={set('achievements_highlight')}
          rows={6} maxLength={LIMITS.LONG}
          placeholder="e.g. a project you led, an award, a society committee role, a measurable result you're proud of, something you built…"
        />
      ),
    },
    {
      key: 'unsure_about',
      title: 'Anything you\'re unsure how to present?',
      optional: true,
      whyItHelps: 'a gap, a low grade, a career change — tell us and we\'ll frame it honestly rather than skip it.',
      render: ({ form: f, set }) => (
        <FormTextarea id="unsure_about" value={f.unsure_about} onChange={set('unsure_about')} rows={4} maxLength={LIMITS.LONG} />
      ),
    },
    {
      key: 'formatting_preferences',
      title: 'How should it look?',
      validate: (f) => (!f.tone?.trim() || !f.length?.trim() ? 'Tone and length preference are required.' : ''),
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="tone" label="Tone" required>
            <FormSelect id="tone" value={f.tone} onChange={set('tone')} required>
              <option value="formal">Formal</option>
              <option value="balanced">Balanced</option>
              <option value="modern">Modern</option>
            </FormSelect>
          </FormField>
          <FormField id="length" label="Length preference" required>
            <FormSelect id="length" value={f.length} onChange={set('length')} required>
              <option value="one_page">One page</option>
              <option value="two_page">Two page</option>
            </FormSelect>
          </FormField>
          <FormField id="style" label="Template" hint="Both templates are equally ATS-safe — single column, no tables, standard section names. They differ only in visual tone.">
            <FormSelect id="style" value={f.style} onChange={set('style')}>
              <option value="classic_ats">Classic — serif, traditional. Expected in finance, law, healthcare, government</option>
              <option value="modern">Modern — sans-serif, cleaner. Common in tech, startups, creative</option>
            </FormSelect>
          </FormField>
        </div>
      ),
    },
    {
      key: 'context_signals',
      title: 'A couple of last details',
      optional: true,
      whyItHelps: 'these sharpen tailoring but nothing here blocks a strong CV either way.',
      render: ({ form: f, set }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField id="target_company" label="Specific company you're applying to" hint="Optional"><FormInput id="target_company" value={f.target_company} onChange={set('target_company')} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id="job_description" label="Paste a job description" hint="Optional — improves ATS keyword matching"><FormTextarea id="job_description" value={f.job_description} onChange={set('job_description')} rows={5} maxLength={LIMITS.PASTE_JD} /></FormField>
          <FormField id="target_emphasis" label="Anything specific to emphasise — or avoid?" hint="Optional"><FormTextarea id="target_emphasis" value={f.target_emphasis} onChange={set('target_emphasis')} rows={3} maxLength={LIMITS.LONG} /></FormField>
        </div>
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
      render: ({ form: f }) => <SummaryRows intro="Here's what we'll build from. Go back to change anything, or generate your CV now." rows={summaryRows(f, tier)} />,
    },
  ]
}

/** Rows for the profile-confirm opener step — what we already know, before the questionnaire asks it again. */
function profileCheckRows(profileKnown) {
  const { profile, target } = profileKnown || {}
  return [
    profile?.personal_info?.full_name && ['Name', profile.personal_info.full_name],
    profile?.education?.[0] && ['Studying', [profile.education[0].degree, profile.education[0].institution].filter(Boolean).join(' at ')],
    profile?.pathway && ['Pathway', profile.pathway],
    target?.target_industry && ['Targeting', target.target_industry],
  ].filter(Boolean)
}

function ExperienceEntries({ experience, onChange, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {experience.map((r, i) => (
        <div key={i} style={repeatCard}>
          {experience.length > 1 && (
            <button type="button" onClick={() => onRemove(i)} style={removeBtn} aria-label="Remove role"><Trash2 size={14} /></button>
          )}
          <FormField id={`exp-title-${i}`} label="Job title" required={i === 0}><FormInput id={`exp-title-${i}`} value={r.job_title} onChange={(ev) => onChange(i, 'job_title', ev.target.value)} required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`exp-company-${i}`} label="Company name" required={i === 0}><FormInput id={`exp-company-${i}`} value={r.company} onChange={(ev) => onChange(i, 'company', ev.target.value)} required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`exp-dates-${i}`} label="Dates" required={i === 0}><FormInput id={`exp-dates-${i}`} value={r.dates} onChange={(ev) => onChange(i, 'dates', ev.target.value)} placeholder="e.g. Jun 2024 – Aug 2024" required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`exp-resp-${i}`} label="Key responsibilities and achievements" required={i === 0} hint="Bullet points or a few sentences — we'll rewrite these properly">
            <FormTextarea id={`exp-resp-${i}`} value={r.responsibilities} onChange={(ev) => onChange(i, 'responsibilities', ev.target.value)} rows={4} required={i === 0} maxLength={LIMITS.LONG} />
          </FormField>
        </div>
      ))}
      <AddRowButton onClick={onAdd} label="Add another role" />
    </div>
  )
}

function EducationEntries({ education, onChange, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {education.map((e, i) => (
        <div key={i} style={repeatCard}>
          {education.length > 1 && (
            <button type="button" onClick={() => onRemove(i)} style={removeBtn} aria-label="Remove education entry"><Trash2 size={14} /></button>
          )}
          <FormField id={`edu-inst-${i}`} label="University / college name" required={i === 0}><FormInput id={`edu-inst-${i}`} value={e.institution} onChange={(ev) => onChange(i, 'institution', ev.target.value)} required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`edu-degree-${i}`} label="Degree title" required={i === 0}><FormInput id={`edu-degree-${i}`} value={e.degree} onChange={(ev) => onChange(i, 'degree', ev.target.value)} required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`edu-year-${i}`} label="Year of study / expected graduation" required={i === 0}><FormInput id={`edu-year-${i}`} value={e.year} onChange={(ev) => onChange(i, 'year', ev.target.value)} required={i === 0} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`edu-grade-${i}`} label="Grade / GPA" hint="Optional"><FormInput id={`edu-grade-${i}`} value={e.grade} onChange={(ev) => onChange(i, 'grade', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
          <FormField id={`edu-modules-${i}`} label="Relevant modules" hint="Optional"><FormInput id={`edu-modules-${i}`} value={e.modules} onChange={(ev) => onChange(i, 'modules', ev.target.value)} maxLength={LIMITS.MEDIUM} /></FormField>
          <FormField id={`edu-awards-${i}`} label="Academic achievements / awards" hint="Optional"><FormInput id={`edu-awards-${i}`} value={e.awards} onChange={(ev) => onChange(i, 'awards', ev.target.value)} maxLength={LIMITS.LONG} /></FormField>
        </div>
      ))}
      <AddRowButton onClick={onAdd} label="Add another education entry" />
    </div>
  )
}

/** Rows for the closing "here's what we'll build from" summary step. */
function summaryRows(form, tier) {
  return [
    ['Targeting', [form.target_role, form.target_industry].filter(Boolean).join(' · ') || form.target_industry],
    ['Experience', form.has_no_experience ? 'None yet — building around education and projects' : `${form.experience.filter((r) => r.job_title).length} role(s)`],
    ['Education', `${form.education.filter((e) => e.institution).length} entry(ies)`],
    ['Skills', `${Object.values(form.skills).reduce((n, v) => n + (v ? v.split(',').filter((s) => s.trim()).length : 0), 0)} listed`],
    ['Style', `${form.tone}, ${form.length === 'one_page' ? 'one page' : 'two page'}, ${form.style === 'modern' ? 'modern template' : 'classic template'}`],
    ['Turnaround', tier === 'premium' ? 'Premium — same day' : 'Standard — 48 hours'],
  ]
}

function ReviewStep({ cvDoc, submitted, submissionId, submitting, tier, onTierChange, onSubmitForReview, onStartOver }) {
  if (!cvDoc) return null
  if (submitted) {
    return (
      <>
        <FormCard>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px' }}>
              A Campus Handler will review your CV before it's delivered. You'll be notified when it's ready.
            </p>
          </div>
        </FormCard>
        <PipelineStatusTimeline submissionId={submissionId} />
      </>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <BenchmarkNote sources={cvDoc.generated?.benchmarked_against} />
      </div>
      {cvDoc.ats_report && (
        <FormCard>
          <h2 style={sectionHeading}>ATS Report</h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '16px' }}>
            <ScoreGauge label="Overall" score={cvDoc.ats_report.overall_score} large />
            <ScoreGauge label="Keyword match (40%)" score={cvDoc.ats_report.keyword_match_score} />
            <ScoreGauge label="Role alignment (35%)" score={cvDoc.ats_report.role_alignment_score} />
            <ScoreGauge label="Formatting (25%)" score={cvDoc.ats_report.formatting_score} />
          </div>
          {cvDoc.ats_report.missing_keywords?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '8px' }}>Keywords not yet covered:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cvDoc.ats_report.missing_keywords.map((k) => (
                  <span key={k} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', background: 'rgba(30,58,95,0.06)', padding: '4px 9px', borderRadius: '4px' }}>{k}</span>
                ))}
              </div>
            </div>
          )}
          {cvDoc.ats_report.formatting_checks?.length > 0 && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(30,58,95,0.1)' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '10px' }}>Parseability checks</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {cvDoc.ats_report.formatting_checks.map((c) => (
                  <li key={c.check} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    {c.passed
                      ? <CheckCircle size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                      : <AlertTriangle size={14} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />}
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: c.passed ? '#6B7280' : '#374151', lineHeight: 1.55 }}>{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </FormCard>
      )}

      <div style={{ marginTop: '24px' }}>
        <CvPreview cvDoc={cvDoc} />
      </div>

      <div style={{ maxWidth: '360px', marginTop: '24px' }}>
        <TierPicker value={tier} onChange={onTierChange} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button
          type="button" onClick={() => window.print()}
          style={{ height: '48px', padding: '0 24px', background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} aria-hidden="true" /> Download PDF
        </button>
        <button
          type="button" onClick={onSubmitForReview} disabled={submitting}
          style={{ height: '48px', padding: '0 24px', background: submitting ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
          {submitting ? 'Sending…' : 'Submit for Handler review'}
        </button>
        <button
          type="button" onClick={onStartOver}
          style={{ height: '48px', padding: '0 20px', background: 'none', color: '#6B7280', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}
        >
          Start over
        </button>
      </div>
    </div>
  )
}

