import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { UserCheck, Clock, Award, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table handler_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    university text not null,
    course text not null,
    year text not null,
    email text not null,
    why_apply text not null,
    availability text not null,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table handler_applications enable row level security;
  create policy "anon_insert" on handler_applications for insert to anon with check (true);
*/

// TODO: Send confirmation email via Resend or Supabase Edge Function when this form is submitted.

const BENEFITS = [
  {
    icon: Award,
    title: 'Build your CV',
    description: 'Real review work on a growing platform — verified experience you can speak to in interviews.',
  },
  {
    icon: Clock,
    title: 'Flexible hours',
    description: 'Work around your studies. Handlers choose their availability — no fixed shifts.',
  },
  {
    icon: BookOpen,
    title: 'Training provided',
    description: 'Full onboarding, quality guidelines, and ongoing support. You are never reviewing blind.',
  },
  {
    icon: UserCheck,
    title: 'Earn while you study',
    description: 'Handlers are compensated per submission reviewed. Consistent quality, consistent earnings.',
  },
]

const UNIVERSITIES = [
  'University College Dublin',
  'Trinity College Dublin',
  'University College Cork',
  'Dublin City University',
  'University of Galway',
  'University of Limerick',
  'Maynooth University',
  'Technological University Dublin',
  'RCSI University',
  'Atlantic Technological University',
  'South East Technological University',
  'Dundalk Institute of Technology',
  'Other',
]

const YEARS        = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'Mature Student']
const AVAILABILITY = ['2–4 hours/week', '4–6 hours/week', '6–8 hours/week', '8+ hours/week']

export default function JoinHandlerPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    university: '',
    course: '',
    year: '',
    availability: '',
    why_apply: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('handler_applications').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <>
      <Helmet>
        <title>Become a Campus Handler | UniBlueprint</title>
        <meta
          name="description"
          content="Join UniBlueprint as a Campus Handler — review student submissions, build your CV, and earn while you study."
        />
        <meta property="og:title" content="Become a Campus Handler | UniBlueprint" />
        <meta property="og:description" content="Join UniBlueprint as a Campus Handler — review student submissions, build your CV, and earn while you study." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Become a Campus Handler
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Review Foundation Blueprint submissions, build your CV, and earn while you study.
        </p>
      </section>

      {/* ── WHAT HANDLERS DO ─────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            The role
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            What Campus Handlers do
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
            textAlign: 'center', margin: '12px auto 0', maxWidth: '640px', lineHeight: 1.7,
          }}>
            Campus Handlers are trained students who review Foundation Blueprint submissions — CVs, cover letters, personal statements, and application forms. Every output goes through a Handler before delivery.
          </p>
          <div className="about-team-grid" style={{ marginTop: '40px' }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '20px 24px',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '10px',
                }}>
                  <b.icon size={20} color="#1E3A5F" />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F' }}>
                  {b.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
          textAlign: 'center',
        }}>
          Apply now
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center', marginTop: '8px', marginBottom: '40px',
        }}>
          Handler application
        </h2>

        <FormCard subtitle="Applications are reviewed on a rolling basis. We'll be in touch within 2 business days.">
          {success ? (
            <SuccessCard title="Application received" subtitle="We'll review your application and be in touch within 2 business days." />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text" name="website" value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
              />
              {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Full name">
                  <FormInput value={form.full_name} onChange={set('full_name')} placeholder="Aoife Murphy" required />
                </FormField>
                <FormField label="Email">
                  <FormInput type="email" value={form.email} onChange={set('email')} placeholder="aoife@university.ie" required />
                </FormField>
              </div>
              <FormField label="University">
                <FormSelect value={form.university} onChange={set('university')} required>
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Course">
                <FormInput value={form.course} onChange={set('course')} placeholder="Business & Management" required />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Year of study">
                  <FormSelect value={form.year} onChange={set('year')} required>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </FormSelect>
                </FormField>
                <FormField label="Availability per week">
                  <FormSelect value={form.availability} onChange={set('availability')} required>
                    <option value="">Select availability</option>
                    {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
                  </FormSelect>
                </FormField>
              </div>
              <FormField label="Why do you want to be a Campus Handler?" hint="Tell us what draws you to the role and any relevant experience.">
                <FormTextarea value={form.why_apply} onChange={set('why_apply')} placeholder="I want to..." rows={5} required />
              </FormField>

              <FormConsent />
              <SubmitButton loading={loading} label="Submit application" />
            </form>
          )}
        </FormCard>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Join the team behind the Blueprint
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Handlers onboarding ahead of September 2026 launch.
        </p>
      </section>
    </>
  )
}
