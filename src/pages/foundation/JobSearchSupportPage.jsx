import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FormCard, FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, ErrorBanner } from '../../components/ui/Form'

const OPPORTUNITY_TYPES = [
  ['graduate_scheme', 'Graduate scheme'],
  ['internship', 'Internship'],
  ['part_time', 'Part-time job'],
  ['placement_year', 'Placement year'],
  ['work_experience', 'Work experience'],
]

const initialInput = {
  field_or_industry: '', opportunity_type: '', location: '', timeline: '',
  urgency: 'longer_runway', cv_status: '', linkedin_status: '',
  applications_so_far: '', interview_conversion: 'no_responses',
  professional_registration_status: '', non_university_type: '',
  has_no_experience: false,
}

export default function JobSearchSupportPage() {
  const { user } = useAuth()
  const [input, setInput] = useState(initialInput)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)
  const [handlerGuide, setHandlerGuide] = useState(null)

  const set = (key) => (e) => setInput((f) => ({
    ...f,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!input.field_or_industry || !input.opportunity_type) {
      setError('Field/industry and target opportunity type are required — they\'re the minimum needed to build a personalised strategy.')
      return
    }
    setLoading(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('job_search_sessions')
        .insert([{ user_id: user.id, input }])
        .select()
        .single()
      if (insertErr) throw insertErr

      const { data, error: fnError } = await supabase.functions.invoke('generate-job-search-support', {
        body: { session_id: inserted.id },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setSession(data.session)

      // Only returns data if this account holds the handler/operations role — RLS,
      // not a UI check, is what actually keeps this from students.
      const { data: guideRow } = await supabase
        .from('job_search_handler_guides')
        .select('handler_guide')
        .eq('session_id', data.session.id)
        .maybeSingle()
      if (guideRow) setHandlerGuide(guideRow.handler_guide)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Job Search Support | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Job Search Support</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Free opportunity alerts, plus a live advisory session with a Campus Handler and a personalised strategy document. Tell us where you're at.
        </p>

        {error && <ErrorBanner message={error} />}

        {!session ? (
          <FormCard>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormField id="field_or_industry" label="Field / industry" required>
                <FormInput id="field_or_industry" value={input.field_or_industry} onChange={set('field_or_industry')} required />
              </FormField>
              <FormField id="opportunity_type" label="Target opportunity type" required>
                <FormSelect id="opportunity_type" value={input.opportunity_type} onChange={set('opportunity_type')} required>
                  <option value="">Select…</option>
                  {OPPORTUNITY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </FormSelect>
              </FormField>
              <FormCheckbox
                id="has_no_experience"
                checked={input.has_no_experience}
                onChange={set('has_no_experience')}
                label="This would be my first ever job — I have no formal work experience yet"
              />
              {input.has_no_experience && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6, marginTop: '-6px' }}>
                  Good to know — searching for a first role works differently. Your strategy will lead on your college careers service, speculative applications, and building visibility, rather than assuming a work history you don't have yet.
                </p>
              )}
              <FormField id="location" label="Preferred location" hint="e.g. Dublin, Cork, open to relocate">
                <FormInput id="location" value={input.location} onChange={set('location')} />
              </FormField>
              <FormField id="timeline" label="When do you want to start?" hint="e.g. September 2026, ASAP, flexible">
                <FormInput id="timeline" value={input.timeline} onChange={set('timeline')} />
              </FormField>
              <FormField id="urgency" label="How urgent is this?">
                <FormSelect id="urgency" value={input.urgency} onChange={set('urgency')}>
                  <option value="longer_runway">I have time to build a longer-term strategy</option>
                  <option value="needs_income_2_4_weeks">I need income within the next 2–4 weeks</option>
                </FormSelect>
              </FormField>
              <FormField id="applications_so_far" label="What have you tried so far?" hint="Optional">
                <FormTextarea id="applications_so_far" value={input.applications_so_far} onChange={set('applications_so_far')} rows={3} />
              </FormField>
              <FormField id="interview_conversion" label="Are your applications converting to interviews?">
                <FormSelect id="interview_conversion" value={input.interview_conversion} onChange={set('interview_conversion')}>
                  <option value="no_responses">Not applied yet / no responses at all</option>
                  <option value="interviews_no_offers">Getting interviews, but no offers</option>
                  <option value="havent_applied">Haven't started applying yet</option>
                </FormSelect>
              </FormField>
              <FormField id="cv_status" label="CV status" hint="Optional">
                <FormSelect id="cv_status" value={input.cv_status} onChange={set('cv_status')}>
                  <option value="">Not sure</option>
                  <option value="dont_have_one">Don't have one</option>
                  <option value="outdated">Have one, but it's outdated</option>
                  <option value="current">Up to date</option>
                </FormSelect>
              </FormField>
              <FormField id="linkedin_status" label="LinkedIn status" hint="Optional">
                <FormSelect id="linkedin_status" value={input.linkedin_status} onChange={set('linkedin_status')}>
                  <option value="">Not sure</option>
                  <option value="no_profile">No profile</option>
                  <option value="inactive">Have one, rarely use it</option>
                  <option value="active">Active and current</option>
                </FormSelect>
              </FormField>
              <FormField id="professional_registration_status" label="Does your field require professional registration?" hint="e.g. NMBI, Teaching Council, CORU — optional">
                <FormInput id="professional_registration_status" value={input.professional_registration_status} onChange={set('professional_registration_status')} />
              </FormField>
              <FormField id="non_university_type" label="If not a university student, what best describes you?" hint="Optional">
                <FormSelect id="non_university_type" value={input.non_university_type} onChange={set('non_university_type')}>
                  <option value="">University student</option>
                  <option value="apprentice">Apprentice</option>
                  <option value="young_worker">Young worker</option>
                  <option value="fifth_sixth_year">5th / 6th year student</option>
                </FormSelect>
              </FormField>

              <button
                type="submit" disabled={loading}
                style={{ height: '48px', background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Building your strategy…' : 'Get my strategy'}
              </button>
            </form>
          </FormCard>
        ) : (
          <StrategyResult strategy={session.student_strategy} handlerGuide={handlerGuide} />
        )}
      </div>
    </>
  )
}

function StrategyResult({ strategy, handlerGuide }) {
  if (!strategy) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {strategy.compatibility_warning && (
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '10px', padding: '16px' }}>
          <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#7A1D1D', lineHeight: 1.6 }}>{strategy.compatibility_warning}</p>
        </div>
      )}

      <FormCard>
        <h2 style={sectionHeading}>Your situation</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', marginTop: '10px', lineHeight: 1.65 }}>{strategy.your_situation_summary}</p>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Your five-channel plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {strategy.five_channel_plan?.map((c, i) => (
            <div key={i} style={{ padding: '14px', background: '#F5F0E8', borderRadius: '8px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 700, color: '#1E3A5F' }}>{c.channel}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', marginTop: '4px', lineHeight: 1.6 }}>{c.what_to_do}</p>
              {c.platforms?.length > 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '6px' }}>{c.platforms.join(' · ')}</p>}
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Platform directory</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {strategy.platform_directory?.map((p, i) => (
            <div key={i} title={p.use_for} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#1E3A5F', background: 'rgba(30,58,95,0.06)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {p.name}
              {p.verify_before_use && <span style={{ fontSize: '10px', color: '#9C6B26', fontWeight: 700 }}>VERIFY</span>}
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard>
        <h2 style={sectionHeading}>Your 7-day action plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {strategy.seven_day_action_plan?.map((d, i) => (
            <div key={i}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.day_range}</p>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {d.actions?.map((a, j) => <li key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {strategy.application_tracking_tip && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '16px', fontStyle: 'italic' }}>{strategy.application_tracking_tip}</p>
        )}
      </FormCard>

      {strategy.closing_encouragement && (
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(22,163,74,0.08)', borderRadius: '10px', padding: '16px' }}>
          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#14532D', lineHeight: 1.6 }}>{strategy.closing_encouragement}</p>
        </div>
      )}

      {handlerGuide && <HandlerGuidePanel guide={handlerGuide} />}
    </div>
  )
}

function HandlerGuidePanel({ guide }) {
  return (
    <div style={{ border: '2px dashed #9C6B26', borderRadius: '10px', padding: '18px', background: 'rgba(156,107,38,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <ShieldAlert size={16} color="#9C6B26" aria-hidden="true" />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Handler only — do not share this section with the student
        </p>
      </div>
      {guide.redirect_to_interview_prep && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#7A1D1D', marginBottom: '10px', fontWeight: 600 }}>
          Redirect flag: {guide.redirect_reason}
        </p>
      )}
      {guide.wellbeing_note && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', marginBottom: '10px' }}>{guide.wellbeing_note}</p>
      )}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '6px' }}>Opening questions</p>
      <ul style={{ margin: '0 0 12px', paddingLeft: '18px' }}>
        {guide.diagnostic_opening_questions?.map((q, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{q}</li>)}
      </ul>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '6px' }}>Talking points</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {guide.talking_points?.map((t, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{t}</li>)}
      </ul>
    </div>
  )
}

const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }
