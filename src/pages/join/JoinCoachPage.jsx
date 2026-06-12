import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Award, Briefcase, Users, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table coach_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    email text not null,
    linkedin_url text not null,
    specialisms text[] not null,
    experience text not null,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table coach_applications enable row level security;
  create policy "anon_insert" on coach_applications for insert to anon with check (true);
*/

// TODO: Send confirmation email via Resend or Supabase Edge Function when this form is submitted.

const BENEFITS = [
  {
    icon: Users,
    title: 'Impact at scale',
    description: "Reach students who genuinely need your expertise — career coaching, personal branding, and interview prep from someone who has been there.",
  },
  {
    icon: TrendingUp,
    title: 'Build your practice',
    description: 'Uniblueprint connects you with a pipeline of motivated students. Grow your coaching practice alongside your main career.',
  },
  {
    icon: Briefcase,
    title: 'Flexible engagement',
    description: 'Coaches define their availability. Take on as many or as few engagements as fits your schedule.',
  },
  {
    icon: Award,
    title: 'Verified Coach status',
    description: 'Approved Uni Coaches are listed on the platform with a verified badge — credibility for your professional profile.',
  },
]

const EXPERTISE_AREAS = [
  'Career Coaching',
  'Personal Branding',
  'Interview Preparation',
  'LinkedIn Optimisation',
  'Portfolio Building',
  'Pitch & Presentation Coaching',
  'Mentorship',
  'Graduate Scheme Advice',
  'Postgraduate Applications',
  'Other',
]

const EXPERIENCE = ['1–2 years', '3–5 years', '5–10 years', '10+ years']

export default function JoinCoachPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    linkedin_url: '',
    specialisms: '',
    experience: '',
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
    const { error: dbError } = await supabase.from('coach_applications').insert([{
      full_name:    form.full_name,
      email:        form.email,
      linkedin_url: form.linkedin_url,
      specialisms:  form.specialisms ? [form.specialisms] : [],
      experience:   form.experience,
      utm_source:   utm_source || null,
      utm_medium:   utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <>
      <Helmet>
        <title>Become a Uni Coach | Uniblueprint</title>
        <meta
          name="description"
          content="Join Uniblueprint as a Uni Coach — deliver expert career coaching, personal branding, and mentorship to Irish students."
        />
        <meta property="og:title" content="Become a Uni Coach | Uniblueprint" />
        <meta property="og:description" content="Join Uniblueprint as a Uni Coach — deliver expert career coaching, personal branding, and mentorship to Irish students." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Become a Uni Coach
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Deliver expert coaching and career development services to Irish students through the Elevation Blueprint.
        </p>
      </section>

      {/* ── WHAT COACHES DO ───────────────────────────────────────────────── */}
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
            What Uni Coaches do
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
            textAlign: 'center', margin: '12px auto 0', maxWidth: '640px', lineHeight: 1.7,
          }}>
            Uni Coaches deliver Elevation Blueprint services — career coaching, personal branding, interview preparation, portfolio review, pitch coaching, and mentorship. You bring the expertise; Uniblueprint brings the students.
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
          Coach application
        </h2>

        <FormCard subtitle="All applications are reviewed by our team. We will be in touch within 2 business days.">
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
                  <FormInput value={form.full_name} onChange={set('full_name')} placeholder="Ciarán Kelly" required />
                </FormField>
                <FormField label="Email">
                  <FormInput type="email" value={form.email} onChange={set('email')} placeholder="ciaran@example.ie" required />
                </FormField>
              </div>
              <FormField label="LinkedIn URL">
                <FormInput value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/yourname" required />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Primary specialism">
                  <FormSelect value={form.specialisms} onChange={set('specialisms')} required>
                    <option value="">Select specialism</option>
                    {EXPERTISE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </FormSelect>
                </FormField>
                <FormField label="Years of experience">
                  <FormSelect value={form.experience} onChange={set('experience')} required>
                    <option value="">Select range</option>
                    {EXPERIENCE.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </FormSelect>
                </FormField>
              </div>

              <FormConsent />
              <SubmitButton loading={loading} label="Submit application" />
            </form>
          )}
        </FormCard>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Help shape the next generation
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Coaches onboarding ahead of September 2026 launch.
        </p>
      </section>
    </>
  )
}
