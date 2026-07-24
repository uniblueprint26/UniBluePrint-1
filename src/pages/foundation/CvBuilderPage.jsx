import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, Trash2, Download, Send, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox,
  SubmitButton, ErrorBanner, parseDbError,
} from '../../components/ui/Form'
import ScoreGauge from '../../components/foundation/ScoreGauge'
import CvPreview from '../../components/foundation/CvPreview'
import BenchmarkNote from '../../components/foundation/BenchmarkNote'

const STEPS = ['Personal', 'Target role', 'Education', 'Experience', 'Skills', 'Achievements', 'Style', 'Review']

const emptyEducation = () => ({ institution: '', degree: '', year: '', grade: '', modules: '', awards: '' })
const emptyExperience = () => ({ job_title: '', company: '', dates: '', responsibilities: '' })

const initialForm = {
  personal_info: { full_name: '', email: '', phone: '', location: '', linkedin_url: '', portfolio_url: '' },
  target_industry: '', target_role: '', opportunity_type: '', target_company: '', target_emphasis: '', job_description: '',
  education: [emptyEducation()],
  has_no_experience: false,
  experience: [emptyExperience()],
  skills: { technical: '', soft: '', languages: '', tools: '' },
  achievements: { societies: '', volunteering: '', projects: '', publications: '', other: '' },
  tone: 'balanced', length: 'one_page', specific_requests: '',
  style: 'classic_ats',
}

export default function CvBuilderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [cvDoc, setDocument] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (path) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
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
    setForm((f) => {
      const list = [...f[listKey]]
      list[index] = { ...list[index], [field]: value }
      return { ...f, [listKey]: list }
    })
  }
  const addListItem = (listKey, factory) => setForm((f) => ({ ...f, [listKey]: [...f[listKey], factory()] }))
  const removeListItem = (listKey, index) => setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== index) }))

  const validateStep = () => {
    const p = form.personal_info
    if (step === 0 && (!p.full_name || !p.email || !p.phone || !p.location)) return 'Full name, email, phone, and location are required.'
    if (step === 1 && !form.target_industry) return 'Industry / field is required.'
    if (step === 2) {
      const e0 = form.education[0]
      if (!e0?.institution || !e0?.degree || !e0?.year) return 'The first education entry needs an institution, degree, and year.'
    }
    if (step === 3 && !form.has_no_experience) {
      const hasValidRole = form.experience.some((r) => r.job_title && r.company && r.dates)
      if (!hasValidRole) return 'Add at least one role (title, company, dates), or check "I have no formal work experience yet".'
    }
    if (step === 4) {
      const skillCount = Object.values(form.skills).reduce((n, v) => n + (v ? v.split(',').filter((s) => s.trim()).length : 0), 0)
      if (skillCount < 3) return 'List at least 3 skills in total across the categories below.'
    }
    if (step === 6 && (!form.tone || !form.length)) return 'Tone and length preference are required.'
    return ''
  }

  const goNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const goBack = () => { setError(''); setStep((s) => Math.max(s - 1, 0)) }

  const buildInputPayload = () => ({
    personal_info: form.personal_info,
    target_emphasis: form.target_emphasis,
    education: form.education.filter((e) => e.institution || e.degree),
    has_no_experience: form.has_no_experience,
    experience: form.has_no_experience ? [] : form.experience
      .filter((r) => r.job_title || r.company)
      .map((r) => ({ ...r, responsibilities: r.responsibilities })),
    skills: {
      technical: splitCsv(form.skills.technical),
      soft: splitCsv(form.skills.soft),
      languages: splitCsv(form.skills.languages),
      tools: splitCsv(form.skills.tools),
    },
    achievements: form.achievements,
    tone: form.tone,
    length: form.length,
    specific_requests: form.specific_requests,
  })

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('cv_documents')
        .insert([{
          user_id: user.id,
          title: `${form.personal_info.full_name || 'Untitled'} — ${form.target_role || form.target_industry}`,
          style: form.style,
          target_role: form.target_role || null,
          target_industry: form.target_industry,
          target_company: form.target_company || null,
          job_description: form.job_description || null,
          input: buildInputPayload(),
        }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const { data, error: fnError } = await supabase.functions.invoke('generate-cv', {
        body: { document_id: inserted.id },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setDocument(data.document)
      setStep(STEPS.length - 1)
    } catch (err) {
      setError(err.message || parseDbError(err) || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!cvDoc) return
    setSubmitting(true)
    setError('')
    try {
      const serviceName = form.style === 'modern' ? 'CV Optimisation — Standard' : 'CV Optimisation — Standard'
      const { data: service } = await supabase.from('services').select('id').eq('name', serviceName).single()

      const { data: submission, error: subErr } = await supabase
        .from('submissions')
        .insert([{ user_id: user.id, service_id: service?.id ?? null, notes: `CV Builder — ${cvDoc.title}` }])
        .select()
        .single()
      if (subErr) throw subErr

      const { error: updateErr } = await supabase
        .from('cv_documents')
        .update({ submission_id: submission.id, status: 'submitted' })
        .eq('id', cvDoc.id)
      if (updateErr) throw updateErr

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit for review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet><title>CV Builder | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>CV Builder</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Tell us about you once — we generate a tailored, ATS-optimised CV, then a Campus Handler reviews it before delivery.
        </p>

        {step < STEPS.length - 1 && <Stepper steps={STEPS} current={step} />}
        {error && <ErrorBanner message={error} />}

        {step < STEPS.length - 1 ? (
          <FormCard>
            {step === 0 && <PersonalStep form={form} set={set} />}
            {step === 1 && <TargetStep form={form} set={set} />}
            {step === 2 && (
              <EducationStep
                education={form.education}
                onChange={(i, f, v) => updateListItem('education', i, f, v)}
                onAdd={() => addListItem('education', emptyEducation)}
                onRemove={(i) => removeListItem('education', i)}
              />
            )}
            {step === 3 && (
              <ExperienceStep
                form={form} set={set}
                onChange={(i, f, v) => updateListItem('experience', i, f, v)}
                onAdd={() => addListItem('experience', emptyExperience)}
                onRemove={(i) => removeListItem('experience', i)}
              />
            )}
            {step === 4 && <SkillsStep form={form} set={set} />}
            {step === 5 && <AchievementsStep form={form} set={set} />}
            {step === 6 && <StyleStep form={form} set={set} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
              <button
                type="button" onClick={goBack} disabled={step === 0}
                style={{ background: 'none', border: 'none', color: step === 0 ? '#9CA3AF' : '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: step === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
              {step === 6 ? (
                <button
                  type="button" onClick={handleGenerate} disabled={generating}
                  style={{ height: '48px', padding: '0 28px', background: generating ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {generating && <Loader2 size={18} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {generating ? 'Generating your CV…' : 'Generate my CV'}
                </button>
              ) : (
                <button
                  type="button" onClick={goNext}
                  style={{ height: '48px', padding: '0 28px', background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Next <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </FormCard>
        ) : (
          <ReviewStep
            cvDoc={cvDoc}
            submitted={submitted}
            submitting={submitting}
            onSubmitForReview={handleSubmitForReview}
            onStartOver={() => { setDocument(null); setForm(initialForm); setStep(0); setSubmitted(false) }}
          />
        )}
      </div>
    </>
  )
}

function splitCsv(v) { return (v || '').split(',').map((s) => s.trim()).filter(Boolean) }

function Stepper({ steps, current }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
      {steps.slice(0, -1).map((label, i) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px', borderRadius: '20px',
          background: i === current ? '#1E3A5F' : i < current ? 'rgba(30,58,95,0.08)' : 'transparent',
          border: i < current ? 'none' : i === current ? 'none' : '1px solid rgba(30,58,95,0.15)',
        }}>
          {i < current && <CheckCircle size={12} color="#1E3A5F" aria-hidden="true" />}
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600,
            color: i === current ? '#F5F0E8' : '#1E3A5F',
          }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function PersonalStep({ form, set }) {
  const p = form.personal_info
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Personal information</h2>
      <FormField id="full_name" label="Full name" required><FormInput id="full_name" value={p.full_name} onChange={set('personal_info.full_name')} required /></FormField>
      <FormField id="email" label="Email address" required><FormInput id="email" type="email" value={p.email} onChange={set('personal_info.email')} required /></FormField>
      <FormField id="phone" label="Phone number" required><FormInput id="phone" value={p.phone} onChange={set('personal_info.phone')} required /></FormField>
      <FormField id="location" label="Location (city/county)" required><FormInput id="location" value={p.location} onChange={set('personal_info.location')} required /></FormField>
      <FormField id="linkedin_url" label="LinkedIn URL" hint="Optional"><FormInput id="linkedin_url" value={p.linkedin_url} onChange={set('personal_info.linkedin_url')} /></FormField>
      <FormField id="portfolio_url" label="Portfolio / website URL" hint="Optional"><FormInput id="portfolio_url" value={p.portfolio_url} onChange={set('personal_info.portfolio_url')} /></FormField>
    </div>
  )
}

function TargetStep({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Target role</h2>
      <FormField id="target_industry" label="Industry / field" required><FormInput id="target_industry" value={form.target_industry} onChange={set('target_industry')} placeholder="e.g. Technology, Healthcare, Finance" required /></FormField>
      <FormField id="target_role" label="Job title / role" hint="Optional — leave blank for a general CV"><FormInput id="target_role" value={form.target_role} onChange={set('target_role')} /></FormField>
      <FormField id="opportunity_type" label="Type of opportunity" hint="Optional — leave blank for a general CV">
        <FormSelect id="opportunity_type" value={form.opportunity_type} onChange={set('opportunity_type')}>
          <option value="">Select…</option>
          <option value="graduate_scheme">Graduate scheme</option>
          <option value="internship">Internship</option>
          <option value="part_time">Part time</option>
          <option value="full_time">Full time</option>
          <option value="placement_year">Placement year</option>
        </FormSelect>
      </FormField>
      <FormField id="target_company" label="Specific company" hint="Optional"><FormInput id="target_company" value={form.target_company} onChange={set('target_company')} /></FormField>
      <FormField id="target_emphasis" label="Anything specific you want emphasised?" hint="Optional"><FormTextarea id="target_emphasis" value={form.target_emphasis} onChange={set('target_emphasis')} rows={3} /></FormField>
      <FormField id="job_description" label="Paste a job description" hint="Optional — improves ATS keyword matching"><FormTextarea id="job_description" value={form.job_description} onChange={set('job_description')} rows={5} /></FormField>
    </div>
  )
}

function EducationStep({ education, onChange, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Education</h2>
      {education.map((e, i) => (
        <div key={i} style={repeatCard}>
          {education.length > 1 && (
            <button type="button" onClick={() => onRemove(i)} style={removeBtn} aria-label="Remove education entry"><Trash2 size={14} /></button>
          )}
          <FormField id={`edu-inst-${i}`} label="University / college name" required={i === 0}><FormInput id={`edu-inst-${i}`} value={e.institution} onChange={(ev) => onChange(i, 'institution', ev.target.value)} required={i === 0} /></FormField>
          <FormField id={`edu-degree-${i}`} label="Degree title" required={i === 0}><FormInput id={`edu-degree-${i}`} value={e.degree} onChange={(ev) => onChange(i, 'degree', ev.target.value)} required={i === 0} /></FormField>
          <FormField id={`edu-year-${i}`} label="Year of study / expected graduation" required={i === 0}><FormInput id={`edu-year-${i}`} value={e.year} onChange={(ev) => onChange(i, 'year', ev.target.value)} required={i === 0} /></FormField>
          <FormField id={`edu-grade-${i}`} label="Grade / GPA" hint="Optional"><FormInput id={`edu-grade-${i}`} value={e.grade} onChange={(ev) => onChange(i, 'grade', ev.target.value)} /></FormField>
          <FormField id={`edu-modules-${i}`} label="Relevant modules" hint="Optional"><FormInput id={`edu-modules-${i}`} value={e.modules} onChange={(ev) => onChange(i, 'modules', ev.target.value)} /></FormField>
          <FormField id={`edu-awards-${i}`} label="Academic achievements / awards" hint="Optional"><FormInput id={`edu-awards-${i}`} value={e.awards} onChange={(ev) => onChange(i, 'awards', ev.target.value)} /></FormField>
        </div>
      ))}
      <AddRowButton onClick={onAdd} label="Add another education entry" />
    </div>
  )
}

function ExperienceStep({ form, set, onChange, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Experience</h2>
      <FormCheckbox
        id="has_no_experience"
        checked={form.has_no_experience}
        onChange={set('has_no_experience')}
        label="I have no formal work experience yet"
      />
      {form.has_no_experience ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6 }}>
          No problem — we'll build your CV around your education, projects, skills, and achievements instead. You can fill those in on the next few steps.
        </p>
      ) : (
        <>
          {form.experience.map((r, i) => (
            <div key={i} style={repeatCard}>
              {form.experience.length > 1 && (
                <button type="button" onClick={() => onRemove(i)} style={removeBtn} aria-label="Remove role"><Trash2 size={14} /></button>
              )}
              <FormField id={`exp-title-${i}`} label="Job title" required={i === 0}><FormInput id={`exp-title-${i}`} value={r.job_title} onChange={(ev) => onChange(i, 'job_title', ev.target.value)} required={i === 0} /></FormField>
              <FormField id={`exp-company-${i}`} label="Company name" required={i === 0}><FormInput id={`exp-company-${i}`} value={r.company} onChange={(ev) => onChange(i, 'company', ev.target.value)} required={i === 0} /></FormField>
              <FormField id={`exp-dates-${i}`} label="Dates" required={i === 0}><FormInput id={`exp-dates-${i}`} value={r.dates} onChange={(ev) => onChange(i, 'dates', ev.target.value)} placeholder="e.g. Jun 2024 – Aug 2024" required={i === 0} /></FormField>
              <FormField id={`exp-resp-${i}`} label="Key responsibilities and achievements" required={i === 0} hint="Bullet points or a few sentences — we'll rewrite these properly">
                <FormTextarea id={`exp-resp-${i}`} value={r.responsibilities} onChange={(ev) => onChange(i, 'responsibilities', ev.target.value)} rows={4} required={i === 0} />
              </FormField>
            </div>
          ))}
          <AddRowButton onClick={onAdd} label="Add another role" />
        </>
      )}
    </div>
  )
}

function SkillsStep({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Skills</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>At least 3 skills required in total. Separate with commas.</p>
      <FormField id="skills_technical" label="Technical skills"><FormInput id="skills_technical" value={form.skills.technical} onChange={set('skills.technical')} placeholder="e.g. Excel, Python, Salesforce" /></FormField>
      <FormField id="skills_soft" label="Soft skills"><FormInput id="skills_soft" value={form.skills.soft} onChange={set('skills.soft')} placeholder="e.g. Communication, Teamwork" /></FormField>
      <FormField id="skills_languages" label="Languages"><FormInput id="skills_languages" value={form.skills.languages} onChange={set('skills.languages')} placeholder="e.g. Irish (fluent), French (B2)" /></FormField>
      <FormField id="skills_tools" label="Tools and software"><FormInput id="skills_tools" value={form.skills.tools} onChange={set('skills.tools')} placeholder="e.g. Figma, SAP, Google Analytics" /></FormField>
    </div>
  )
}

function AchievementsStep({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Achievements & extras</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>All optional — but especially useful if you checked "no work experience yet".</p>
      <FormField id="ach_societies" label="Societies / clubs" hint="Optional"><FormTextarea id="ach_societies" value={form.achievements.societies} onChange={set('achievements.societies')} rows={2} /></FormField>
      <FormField id="ach_volunteering" label="Volunteering" hint="Optional"><FormTextarea id="ach_volunteering" value={form.achievements.volunteering} onChange={set('achievements.volunteering')} rows={2} /></FormField>
      <FormField id="ach_projects" label="Projects" hint="Optional"><FormTextarea id="ach_projects" value={form.achievements.projects} onChange={set('achievements.projects')} rows={2} /></FormField>
      <FormField id="ach_publications" label="Publications / competitions" hint="Optional"><FormTextarea id="ach_publications" value={form.achievements.publications} onChange={set('achievements.publications')} rows={2} /></FormField>
      <FormField id="ach_other" label="Any other achievements" hint="Optional"><FormTextarea id="ach_other" value={form.achievements.other} onChange={set('achievements.other')} rows={2} /></FormField>
    </div>
  )
}

function StyleStep({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={sectionHeading}>Style preference</h2>
      <FormField id="tone" label="Tone" required>
        <FormSelect id="tone" value={form.tone} onChange={set('tone')} required>
          <option value="formal">Formal</option>
          <option value="balanced">Balanced</option>
          <option value="modern">Modern</option>
        </FormSelect>
      </FormField>
      <FormField id="length" label="Length preference" required>
        <FormSelect id="length" value={form.length} onChange={set('length')} required>
          <option value="one_page">One page</option>
          <option value="two_page">Two page</option>
        </FormSelect>
      </FormField>
      <FormField id="style" label="Template">
        <FormSelect id="style" value={form.style} onChange={set('style')}>
          <option value="classic_ats">Classic — most ATS-safe, best for finance/law/healthcare/government</option>
          <option value="modern">Modern — acceptable for tech/startups</option>
        </FormSelect>
      </FormField>
      <FormField id="specific_requests" label="Any specific requests?" hint="Optional"><FormTextarea id="specific_requests" value={form.specific_requests} onChange={set('specific_requests')} rows={3} /></FormField>
    </div>
  )
}

function ReviewStep({ cvDoc, submitted, submitting, onSubmitForReview, onStartOver }) {
  if (!cvDoc) return null
  if (submitted) {
    return (
      <FormCard>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircle size={48} color="#16A34A" aria-hidden="true" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>Sent for Handler review</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px' }}>
            A Campus Handler will review your CV before it's delivered. You'll be notified when it's ready.
          </p>
        </div>
      </FormCard>
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
        </FormCard>
      )}

      <div style={{ marginTop: '24px' }}>
        <CvPreview cvDoc={cvDoc} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
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

function AddRowButton({ onClick, label }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px dashed rgba(30,58,95,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}
    >
      <Plus size={14} aria-hidden="true" /> {label}
    </button>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }
const repeatCard = { position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#F5F0E8', borderRadius: '10px' }
const removeBtn = { position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }
