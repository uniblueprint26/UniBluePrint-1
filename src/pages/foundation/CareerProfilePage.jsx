import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Plus, Trash2, CheckCircle, Target, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { invokeFunction } from '../../lib/invokeFunction'
import {
  fetchCareerProfile, saveCareerProfile, fetchCareerTargets,
  createCareerTarget, setActiveTarget, deleteCareerTarget, experienceNarrative,
} from '../../lib/careerProfile'
import { LIMITS, checkLengths } from '../../lib/fieldLimits'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import {
  FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox,
  ErrorBanner,
} from '../../components/ui/Form'
import { OPPORTUNITY_TYPES } from '../../lib/jobSearchConstants'

/**
 * Foundation Blueprint §08 — the Career Profile.
 *
 * This is the thing that turns eight separate document generators into one
 * employability companion: the user states who they are once, and what they're
 * applying for once per application, and every builder reads from it instead of
 * asking again.
 */

const splitCsv = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean)

const emptyEducation = () => ({ institution: '', degree: '', year: '', grade: '', modules: '', awards: '' })
const emptyExperience = () => ({ job_title: '', company: '', dates: '', responsibilities: '' })
const emptyTarget = () => ({
  label: '', target_role: '', target_industry: '', target_company: '',
  target_course: '', target_institution: '', job_description: '',
})

const initialProfile = {
  personal_info: { full_name: '', email: '', phone: '', location: '', linkedin_url: '', portfolio_url: '' },
  education: [emptyEducation()],
  experience: [emptyExperience()],
  skills: { technical: '', soft: '', languages: '', tools: '' },
  achievements: { societies: '', volunteering: '', projects: '', publications: '', other: '' },
  education_system: '',
  pathway: '',
  goals: '',
  interests: '',
  has_no_experience: false,
}

// Mirrors the sign-up pathway question so a user is never asked it twice.
const PATHWAYS = [
  'Secondary school / Sixth Form', 'PLC / Further Education', 'Apprenticeship',
  'University / College', 'Gap year', 'Recent graduate', 'Working — early career',
]

export default function CareerProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { runLocked } = useSubmitLock()
  const [form, setForm] = useState(initialProfile)
  const [targets, setTargets] = useState([])
  const [newTarget, setNewTarget] = useState(emptyTarget())
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Quick Generate: creates the document/session and calls its generator
  // directly from whatever is currently in this form — the user does not have
  // to save first, since the form itself is always the freshest statement of
  // who they are. `quickGenerating` names which card is mid-request so only
  // that one button shows a spinner. `quickFields` holds the one or two
  // essential inputs (LinkedIn's current_status, Job Search's opportunity
  // type) that genuinely cannot come from the profile.
  const [quickGenerating, setQuickGenerating] = useState(null)
  const [quickError, setQuickError] = useState('')
  const [quickFields, setQuickFields] = useState({ linkedin_current_status: '', job_search_opportunity_type: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [profile, targetList] = await Promise.all([
        fetchCareerProfile(user.id),
        fetchCareerTargets(user.id),
      ])
      if (profile) {
        setForm({
          ...initialProfile,
          ...profile,
          personal_info: { ...initialProfile.personal_info, ...(profile.personal_info || {}) },
          skills: { ...initialProfile.skills, ...(profile.skills || {}) },
          achievements: { ...initialProfile.achievements, ...(profile.achievements || {}) },
          education: profile.education?.length ? profile.education : [emptyEducation()],
          experience: profile.experience?.length ? profile.experience : [emptyExperience()],
          education_system: profile.education_system || '',
          pathway: profile.pathway || '',
          goals: profile.goals || '',
          interests: profile.interests || '',
        })
      }
      setTargets(targetList)
    } catch (err) {
      setError(err.message || 'Could not load your profile.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  const set = (path) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setSaved(false)
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

  const updateListItem = (listKey, index, field, value) => {
    setSaved(false)
    setForm((f) => {
      const list = [...f[listKey]]
      list[index] = { ...list[index], [field]: value }
      return { ...f, [listKey]: list }
    })
  }
  const addListItem = (listKey, factory) => setForm((f) => ({ ...f, [listKey]: [...f[listKey], factory()] }))
  const removeListItem = (listKey, index) =>
    setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== index) }))

  const handleSave = () => runLocked(async () => {
    const p = form.personal_info
    const tooLong = checkLengths([
      ['Full name', p.full_name, LIMITS.SHORT],
      ['Email', p.email, LIMITS.SHORT],
      ['Goals', form.goals, LIMITS.LONG],
      ['Interests', form.interests, LIMITS.LONG],
    ])
    if (tooLong) { setError(tooLong); return }

    setSaving(true)
    setError('')
    try {
      await saveCareerProfile(user.id, {
        personal_info: form.personal_info,
        education: form.education.filter((e) => e.institution || e.degree),
        experience: form.has_no_experience
          ? []
          : form.experience.filter((r) => r.job_title || r.company),
        skills: form.skills,
        achievements: form.achievements,
        education_system: form.education_system || null,
        pathway: form.pathway || null,
        goals: form.goals || null,
        interests: form.interests || null,
        has_no_experience: form.has_no_experience,
      })
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  })

  const handleAddTarget = () => runLocked(async () => {
    if (!newTarget.label.trim()) { setError('Give this application a name so you can find it later.'); return }
    const tooLong = checkLengths([['Job description', newTarget.job_description, LIMITS.PASTE_JD]])
    if (tooLong) { setError(tooLong); return }
    setError('')
    try {
      const created = await createCareerTarget(user.id, {
        label: newTarget.label,
        target_role: newTarget.target_role || null,
        target_industry: newTarget.target_industry || null,
        target_company: newTarget.target_company || null,
        target_course: newTarget.target_course || null,
        target_institution: newTarget.target_institution || null,
        job_description: newTarget.job_description || null,
      })
      setTargets((ts) => [created, ...ts.map((t) => ({ ...t, is_active: false }))])
      setNewTarget(emptyTarget())
      setShowTargetForm(false)
    } catch (err) {
      setError(err.message || 'Could not save that application.')
    }
  })

  const handleActivate = async (targetId) => {
    try {
      await setActiveTarget(targetId)
      setTargets((ts) => ts.map((t) => ({ ...t, is_active: t.id === targetId })))
    } catch (err) { setError(err.message) }
  }

  const handleDeleteTarget = async (targetId) => {
    try {
      await deleteCareerTarget(targetId)
      setTargets((ts) => ts.filter((t) => t.id !== targetId))
    } catch (err) { setError(err.message) }
  }

  const activeTarget = targets.find((t) => t.is_active) || null

  const handleQuickGenerateCv = () => runLocked(async () => {
    setQuickError('')
    setQuickGenerating('cv')
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('cv_documents')
        .insert([{
          user_id: user.id,
          title: `${form.personal_info.full_name || 'Untitled'} — ${activeTarget?.target_role || activeTarget?.target_industry || 'CV'}`,
          style: 'classic_ats',
          target_role: activeTarget?.target_role || null,
          target_industry: activeTarget?.target_industry || null,
          target_company: activeTarget?.target_company || null,
          job_description: activeTarget?.job_description || null,
          input: {
            personal_info: form.personal_info,
            education: form.education.filter((e) => e.institution || e.degree),
            has_no_experience: form.has_no_experience,
            experience: form.has_no_experience ? [] : form.experience.filter((r) => r.job_title || r.company),
            skills: {
              technical: splitCsv(form.skills.technical),
              soft: splitCsv(form.skills.soft),
              languages: splitCsv(form.skills.languages),
              tools: splitCsv(form.skills.tools),
            },
            achievements: form.achievements,
            tone: 'balanced', length: 'one_page', specific_requests: '',
          },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-cv', { document_id: inserted.id })
      navigate('/foundation/cv-builder', { state: { document: data.document } })
    } catch (err) {
      setQuickError(err.message || 'Could not generate your CV yet.')
    } finally {
      setQuickGenerating(null)
    }
  })

  const handleQuickGenerateLinkedin = () => runLocked(async () => {
    if (!quickFields.linkedin_current_status.trim()) {
      setQuickError('Add your current status (e.g. your year and course, or your role) to generate a LinkedIn profile.')
      return
    }
    setQuickError('')
    setQuickGenerating('linkedin')
    try {
      const keySkills = [...new Set([
        ...splitCsv(form.skills.technical), ...splitCsv(form.skills.soft),
        ...splitCsv(form.skills.languages), ...splitCsv(form.skills.tools),
      ])]
      const { data: inserted, error: insertErr } = await supabase
        .from('linkedin_documents')
        .insert([{
          user_id: user.id,
          target_industry: activeTarget?.target_industry || null,
          target_role: activeTarget?.target_role || null,
          input: {
            current_status: quickFields.linkedin_current_status,
            key_skills: keySkills,
            notable_achievements: form.achievements.projects || form.achievements.other || '',
            target_connections: '',
            experience: form.has_no_experience ? '' : experienceNarrative(form),
            has_no_experience: form.has_no_experience,
            tone: 'balanced',
          },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-linkedin', { document_id: inserted.id })
      navigate('/foundation/linkedin-optimisation', { state: { document: data.document } })
    } catch (err) {
      setQuickError(err.message || 'Could not generate your LinkedIn profile yet.')
    } finally {
      setQuickGenerating(null)
    }
  })

  const handleQuickGenerateJobSearch = () => runLocked(async () => {
    if (!quickFields.job_search_opportunity_type) {
      setQuickError('Choose what you\'re looking for to build a strategy.')
      return
    }
    setQuickError('')
    setQuickGenerating('jobsearch')
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('job_search_sessions')
        .insert([{
          user_id: user.id,
          input: {
            field_or_industry: activeTarget?.target_industry || '',
            opportunity_type: quickFields.job_search_opportunity_type,
            has_no_experience: form.has_no_experience,
          },
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const data = await invokeFunction('generate-job-search-support', { session_id: inserted.id })

      // Same visibility rule as the standalone page: only an account holding
      // the handler/operations role can actually read this row back — RLS
      // decides that, not this check.
      let handlerGuide = null
      const { data: guideRow } = await supabase
        .from('job_search_handler_guides')
        .select('handler_guide')
        .eq('session_id', data.session.id)
        .maybeSingle()
      if (guideRow) handlerGuide = guideRow.handler_guide

      navigate('/foundation/job-search-support', { state: { session: data.session, handlerGuide } })
    } catch (err) {
      setQuickError(err.message || 'Could not build your strategy yet.')
    } finally {
      setQuickGenerating(null)
    }
  })

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading your profile…
      </div>
    )
  }

  const p = form.personal_info

  return (
    <>
      <Helmet><title>Career Profile | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={backLink}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Career Profile</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Fill this in once and every Foundation Blueprint tool starts from it — your CV, LinkedIn, cover letters,
          application forms and interview prep all read from here instead of asking you the same questions again.
          You can still change anything inside an individual tool; whatever you type there wins.
        </p>

        {error && <ErrorBanner message={error} onRetry={load} />}

        <QuickGenerateSection
          activeTarget={activeTarget}
          quickGenerating={quickGenerating}
          quickError={quickError}
          quickFields={quickFields}
          setQuickFields={setQuickFields}
          onGenerateCv={handleQuickGenerateCv}
          onGenerateLinkedin={handleQuickGenerateLinkedin}
          onGenerateJobSearch={handleQuickGenerateJobSearch}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FormCard title="About you">
            <div style={grid}>
              <FormField id="full_name" label="Full name"><FormInput id="full_name" value={p.full_name} onChange={set('personal_info.full_name')} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="email" label="Email address"><FormInput id="email" type="email" value={p.email} onChange={set('personal_info.email')} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="phone" label="Phone number"><FormInput id="phone" value={p.phone} onChange={set('personal_info.phone')} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="location" label="Location (city/county)"><FormInput id="location" value={p.location} onChange={set('personal_info.location')} maxLength={LIMITS.SHORT} /></FormField>
              <FormField id="linkedin_url" label="LinkedIn URL" hint="Optional"><FormInput id="linkedin_url" value={p.linkedin_url} onChange={set('personal_info.linkedin_url')} maxLength={LIMITS.MEDIUM} /></FormField>
              <FormField id="portfolio_url" label="Portfolio / website" hint="Optional"><FormInput id="portfolio_url" value={p.portfolio_url} onChange={set('personal_info.portfolio_url')} maxLength={LIMITS.MEDIUM} /></FormField>
            </div>
          </FormCard>

          <FormCard title="Where you are right now">
            <div style={grid}>
              <FormField id="education_system" label="Which system are you in?" hint="Decides whether we build CAO or UCAS applications for you">
                <FormSelect id="education_system" value={form.education_system} onChange={set('education_system')}>
                  <option value="">Select…</option>
                  <option value="ireland">Ireland (CAO)</option>
                  <option value="uk">UK (UCAS)</option>
                  <option value="other">Somewhere else</option>
                </FormSelect>
              </FormField>
              <FormField id="pathway" label="Your pathway">
                <FormSelect id="pathway" value={form.pathway} onChange={set('pathway')}>
                  <option value="">Select…</option>
                  {PATHWAYS.map((path) => <option key={path} value={path}>{path}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </FormCard>

          <FormCard title="Education">
            {form.education.map((e, i) => (
              <ListBlock key={i} index={i} count={form.education.length} onRemove={() => removeListItem('education', i)}>
                <div style={grid}>
                  <FormField id={`edu-inst-${i}`} label="University / college / school"><FormInput id={`edu-inst-${i}`} value={e.institution} onChange={(ev) => updateListItem('education', i, 'institution', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                  <FormField id={`edu-degree-${i}`} label="Course / qualification"><FormInput id={`edu-degree-${i}`} value={e.degree} onChange={(ev) => updateListItem('education', i, 'degree', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                  <FormField id={`edu-year-${i}`} label="Year / expected graduation"><FormInput id={`edu-year-${i}`} value={e.year} onChange={(ev) => updateListItem('education', i, 'year', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                  <FormField id={`edu-grade-${i}`} label="Grade" hint="Optional"><FormInput id={`edu-grade-${i}`} value={e.grade} onChange={(ev) => updateListItem('education', i, 'grade', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                </div>
              </ListBlock>
            ))}
            <AddButton label="Add another" onClick={() => addListItem('education', emptyEducation)} />
          </FormCard>

          <FormCard title="Experience">
            <FormCheckbox
              id="has_no_experience"
              checked={form.has_no_experience}
              onChange={set('has_no_experience')}
              label="I have no formal work experience yet"
            />
            {!form.has_no_experience && (
              <>
                {form.experience.map((r, i) => (
                  <ListBlock key={i} index={i} count={form.experience.length} onRemove={() => removeListItem('experience', i)}>
                    <div style={grid}>
                      <FormField id={`exp-title-${i}`} label="Job title"><FormInput id={`exp-title-${i}`} value={r.job_title} onChange={(ev) => updateListItem('experience', i, 'job_title', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                      <FormField id={`exp-company-${i}`} label="Company"><FormInput id={`exp-company-${i}`} value={r.company} onChange={(ev) => updateListItem('experience', i, 'company', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                      <FormField id={`exp-dates-${i}`} label="Dates"><FormInput id={`exp-dates-${i}`} value={r.dates} onChange={(ev) => updateListItem('experience', i, 'dates', ev.target.value)} maxLength={LIMITS.SHORT} /></FormField>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <FormField id={`exp-resp-${i}`} label="What you did"><FormTextarea id={`exp-resp-${i}`} value={r.responsibilities} onChange={(ev) => updateListItem('experience', i, 'responsibilities', ev.target.value)} rows={3} maxLength={LIMITS.LONG} /></FormField>
                    </div>
                  </ListBlock>
                ))}
                <AddButton label="Add another role" onClick={() => addListItem('experience', emptyExperience)} />
              </>
            )}
          </FormCard>

          <FormCard title="Skills">
            <div style={grid}>
              <FormField id="skills_technical" label="Technical skills"><FormInput id="skills_technical" value={form.skills.technical} onChange={set('skills.technical')} placeholder="e.g. Excel, Python" maxLength={LIMITS.MEDIUM} /></FormField>
              <FormField id="skills_soft" label="Soft skills"><FormInput id="skills_soft" value={form.skills.soft} onChange={set('skills.soft')} maxLength={LIMITS.MEDIUM} /></FormField>
              <FormField id="skills_languages" label="Languages"><FormInput id="skills_languages" value={form.skills.languages} onChange={set('skills.languages')} maxLength={LIMITS.MEDIUM} /></FormField>
              <FormField id="skills_tools" label="Tools and software"><FormInput id="skills_tools" value={form.skills.tools} onChange={set('skills.tools')} maxLength={LIMITS.MEDIUM} /></FormField>
            </div>
          </FormCard>

          <FormCard title="Achievements and activities">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField id="ach_societies" label="Societies / clubs"><FormTextarea id="ach_societies" value={form.achievements.societies} onChange={set('achievements.societies')} rows={2} maxLength={LIMITS.LONG} /></FormField>
              <FormField id="ach_volunteering" label="Volunteering"><FormTextarea id="ach_volunteering" value={form.achievements.volunteering} onChange={set('achievements.volunteering')} rows={2} maxLength={LIMITS.LONG} /></FormField>
              <FormField id="ach_projects" label="Projects"><FormTextarea id="ach_projects" value={form.achievements.projects} onChange={set('achievements.projects')} rows={2} maxLength={LIMITS.LONG} /></FormField>
              <FormField id="ach_other" label="Anything else"><FormTextarea id="ach_other" value={form.achievements.other} onChange={set('achievements.other')} rows={2} maxLength={LIMITS.LONG} /></FormField>
            </div>
          </FormCard>

          <FormCard title="Where you're heading" subtitle="Used as context so your outputs sound like you, not a template.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField id="goals" label="Your goals" hint="What are you working towards over the next year or two?"><FormTextarea id="goals" value={form.goals} onChange={set('goals')} rows={3} maxLength={LIMITS.LONG} /></FormField>
              <FormField id="interests" label="Your interests" hint="What genuinely interests you in your field?"><FormTextarea id="interests" value={form.interests} onChange={set('interests')} rows={3} maxLength={LIMITS.LONG} /></FormField>
            </div>
          </FormCard>

          <button type="button" onClick={handleSave} disabled={saving} style={primaryButton(saving)}>
            {saving && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save my profile'}
            {saved && !saving && <CheckCircle size={17} aria-hidden="true" />}
          </button>

          <div style={{ height: '1px', background: 'rgba(30,58,95,0.1)', margin: '16px 0' }} />

          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>What you're applying for</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '6px', marginBottom: '18px', lineHeight: 1.7 }}>
              Add an application once — the role, the company, the job description — and every tool tailors to it
              automatically. Switch the active one when you move on to the next application.
            </p>

            {targets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {targets.map((t) => (
                  <div key={t.id} style={{ background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: t.is_active ? '1.5px solid #1E3A5F' : '1.5px solid transparent' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: 600, color: '#1E3A5F' }}>{t.label}</span>
                        {t.is_active && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: '#15803D', background: 'rgba(22,163,74,0.12)', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Target size={11} aria-hidden="true" /> Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '3px' }}>
                        {[t.target_role, t.target_company, t.target_course, t.target_institution, t.target_industry].filter(Boolean).join(' · ') || 'No details yet'}
                      </p>
                    </div>
                    {!t.is_active && (
                      <button type="button" onClick={() => handleActivate(t.id)} style={linkButton}>Make active</button>
                    )}
                    <button type="button" onClick={() => handleDeleteTarget(t.id)} aria-label={`Delete ${t.label}`} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showTargetForm ? (
              <FormCard>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <FormField id="t_label" label="Name this application" required hint="Just for you — e.g. 'Stripe grad scheme' or 'UCD Psychology'">
                    <FormInput id="t_label" value={newTarget.label} onChange={(e) => setNewTarget((t) => ({ ...t, label: e.target.value }))} required maxLength={LIMITS.SHORT} />
                  </FormField>
                  <div style={grid}>
                    <FormField id="t_role" label="Role" hint="If it's a job"><FormInput id="t_role" value={newTarget.target_role} onChange={(e) => setNewTarget((t) => ({ ...t, target_role: e.target.value }))} maxLength={LIMITS.SHORT} /></FormField>
                    <FormField id="t_company" label="Company" hint="If it's a job"><FormInput id="t_company" value={newTarget.target_company} onChange={(e) => setNewTarget((t) => ({ ...t, target_company: e.target.value }))} maxLength={LIMITS.SHORT} /></FormField>
                    <FormField id="t_course" label="Course" hint="If it's a college application"><FormInput id="t_course" value={newTarget.target_course} onChange={(e) => setNewTarget((t) => ({ ...t, target_course: e.target.value }))} maxLength={LIMITS.SHORT} /></FormField>
                    <FormField id="t_institution" label="Institution" hint="If it's a college application"><FormInput id="t_institution" value={newTarget.target_institution} onChange={(e) => setNewTarget((t) => ({ ...t, target_institution: e.target.value }))} maxLength={LIMITS.SHORT} /></FormField>
                  </div>
                  <FormField id="t_industry" label="Industry / field"><FormInput id="t_industry" value={newTarget.target_industry} onChange={(e) => setNewTarget((t) => ({ ...t, target_industry: e.target.value }))} placeholder="e.g. Technology, Law, Healthcare" maxLength={LIMITS.SHORT} /></FormField>
                  <FormField id="t_jd" label="Paste the job description" hint="Optional — this is what sharpens keyword matching the most">
                    <FormTextarea id="t_jd" value={newTarget.job_description} onChange={(e) => setNewTarget((t) => ({ ...t, job_description: e.target.value }))} rows={5} maxLength={LIMITS.PASTE_JD} />
                  </FormField>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={handleAddTarget} style={{ ...primaryButton(false), flex: 1 }}>Save application</button>
                    <button type="button" onClick={() => { setShowTargetForm(false); setNewTarget(emptyTarget()) }} style={secondaryButton}>Cancel</button>
                  </div>
                </div>
              </FormCard>
            ) : (
              <AddButton label="Add an application" onClick={() => setShowTargetForm(true)} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Tools with no essential field beyond profile + active target: cover letter
// (needs a tailored "relevant experience"), application forms (needs the
// actual questions), interview prep (only needs a role, already covered by
// the active target so it's effectively one-click too, but keeps its own
// question — interview format — worth choosing deliberately), personal
// statement (needs a pathway choice that changes the whole generator), and
// portfolio (needs a description of the actual work). Rather than guess at
// those, these route to the builder — already pre-filled by the same profile
// data — instead of guessing at content that has to be genuinely theirs.
const LINK_ONLY_TOOLS = [
  { label: 'Cover Letter', route: '/foundation/cover-letter' },
  { label: 'Application Form', route: '/foundation/application-form-assistance' },
  { label: 'Interview Prep', route: '/foundation/interview-preparation' },
  { label: 'Personal Statement', route: '/foundation/personal-statement' },
  { label: 'Portfolio Plan', route: '/foundation/portfolio-building' },
]

function QuickGenerateSection({
  activeTarget, quickGenerating, quickError, quickFields, setQuickFields,
  onGenerateCv, onGenerateLinkedin, onGenerateJobSearch,
}) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '14px', boxShadow: '0px 4px 20px rgba(30,58,95,0.10)', padding: '24px', marginBottom: '28px', border: '1.5px solid rgba(30,58,95,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={18} color="#9C6B26" aria-hidden="true" />
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>Quick Generate</h2>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', marginTop: '6px', marginBottom: '18px', lineHeight: 1.6 }}>
        Generate straight from what's in this form right now — no need to save first, and no separate builder to fill in again.
        {activeTarget ? (
          <> Targeting <strong style={{ color: '#1E3A5F' }}>{activeTarget.label}</strong>.</>
        ) : (
          <> Add an application below to target these, or generate a general version now.</>
        )}
      </p>

      {quickError && <div style={{ marginBottom: '14px' }}><ErrorBanner message={quickError} /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <QuickGenerateCard
          label="CV" description="Uses your education, experience, and skills as they stand right now."
          busy={quickGenerating === 'cv'} disabled={quickGenerating !== null}
          onClick={onGenerateCv}
        />

        <QuickGenerateCard
          label="LinkedIn Profile" description="Headline, About section, and skills to add."
          busy={quickGenerating === 'linkedin'} disabled={quickGenerating !== null}
          expanded={expanded === 'linkedin'}
          onClick={() => (expanded === 'linkedin' ? onGenerateLinkedin() : setExpanded('linkedin'))}
        >
          {expanded === 'linkedin' && (
            <div style={{ marginTop: '10px' }}>
              <FormField id="qg_current_status" label="Current status" hint="e.g. Final year Computer Science student at UCD">
                <FormInput
                  id="qg_current_status" value={quickFields.linkedin_current_status}
                  onChange={(e) => setQuickFields((f) => ({ ...f, linkedin_current_status: e.target.value }))}
                  maxLength={LIMITS.MEDIUM}
                />
              </FormField>
            </div>
          )}
        </QuickGenerateCard>

        <QuickGenerateCard
          label="Job Search Strategy" description="A live Handler session plus a personalised search plan."
          busy={quickGenerating === 'jobsearch'} disabled={quickGenerating !== null}
          expanded={expanded === 'jobsearch'}
          onClick={() => (expanded === 'jobsearch' ? onGenerateJobSearch() : setExpanded('jobsearch'))}
        >
          {expanded === 'jobsearch' && (
            <div style={{ marginTop: '10px' }}>
              <FormField id="qg_opportunity_type" label="What are you looking for?">
                <FormSelect
                  id="qg_opportunity_type" value={quickFields.job_search_opportunity_type}
                  onChange={(e) => setQuickFields((f) => ({ ...f, job_search_opportunity_type: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {OPPORTUNITY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </FormSelect>
              </FormField>
            </div>
          )}
        </QuickGenerateCard>
      </div>

      <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          These need a bit more from you — open the pre-filled builder
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {LINK_ONLY_TOOLS.map((t) => (
            <Link
              key={t.route} to={t.route}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F',
                background: 'rgba(30,58,95,0.05)', padding: '7px 12px', borderRadius: '8px', textDecoration: 'none',
              }}
            >
              {t.label} <ArrowRight size={12} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickGenerateCard({ label, description, busy, disabled, expanded, onClick, children }) {
  return (
    <div style={{ border: expanded ? '1.5px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.12)', borderRadius: '10px', padding: '14px 16px', background: expanded ? 'rgba(30,58,95,0.03)' : '#FFFFFF' }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: 700, color: '#1E3A5F' }}>{label}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '3px', lineHeight: 1.5, minHeight: '32px' }}>{description}</p>
      {children}
      <button
        type="button" onClick={onClick} disabled={disabled}
        style={{
          marginTop: '10px', width: '100%', height: '38px', borderRadius: '7px', border: 'none',
          background: disabled && !busy ? 'rgba(30,58,95,0.15)' : '#1E3A5F', color: '#F5F0E8',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
      >
        {busy && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />}
        {busy ? 'Generating…' : 'Generate'}
      </button>
    </div>
  )
}

function ListBlock({ index, count, onRemove, children }) {
  return (
    <div style={{ paddingTop: index === 0 ? '14px' : '18px', marginTop: index === 0 ? 0 : '18px', borderTop: index === 0 ? 'none' : '1px solid rgba(30,58,95,0.08)' }}>
      {count > 1 && (
        <button type="button" onClick={onRemove} style={{ float: 'right', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px' }}>
          Remove
        </button>
      )}
      {children}
    </div>
  )
}

function AddButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px dashed rgba(30,58,95,0.25)', borderRadius: '8px', padding: '10px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A5F', cursor: 'pointer' }}>
      <Plus size={15} aria-hidden="true" /> {label}
    </button>
  )
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }

const backLink = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }

const primaryButton = (busy) => ({
  height: '48px', background: busy ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8',
  border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
  fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '8px', padding: '0 24px',
})

const secondaryButton = {
  height: '48px', padding: '0 20px', background: '#FFFFFF', color: '#1E3A5F',
  border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px',
  fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: 'pointer',
}

const linkButton = {
  background: 'none', border: 'none', color: '#1E3A5F', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
  textDecoration: 'underline', textUnderlineOffset: '3px', flexShrink: 0,
}
