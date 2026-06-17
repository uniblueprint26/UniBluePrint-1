import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { GraduationCap, Users, BarChart3, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table university_enquiries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    institution_name text not null,
    contact_name text not null,
    role text not null,
    email text not null,
    phone text,
    message text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table university_enquiries enable row level security;
  create policy "anon_insert" on university_enquiries for insert to anon with check (true);
*/

// TODO: Send confirmation email via Resend or Supabase Edge Function when this form is submitted.

const VALUE_PROPS = [
  {
    icon: GraduationCap,
    title: 'Student success support',
    description: 'UniBlueprint gives your students access to CV support, career coaching, and academic services — reducing the load on your careers office.',
  },
  {
    icon: Users,
    title: 'Campus community built in',
    description: 'Campus Connect gives students a verified, moderated community board for their institution — improving campus belonging and peer support.',
  },
  {
    icon: BarChart3,
    title: 'Engagement and outcomes',
    description: "Track how your students are using the platform. Aggregate data helps your institution understand student support needs.",
  },
  {
    icon: Shield,
    title: 'Safe and moderated',
    description: 'All content is subject to community standards. Campus boards are moderated — no anonymous abuse or spam.',
  },
]

export default function ForUniversitiesPage() {
  const [form, setForm] = useState({
    institution_name: '',
    contact_name: '',
    role: '',
    email: '',
    phone: '',
    message: '',
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
    const { error: dbError } = await supabase.from('university_enquiries').insert([{
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
        <title>For Universities | UniBlueprint</title>
        <meta
          name="description"
          content="Partner with UniBlueprint to give your students access to career support, campus community, and academic tools — launching September 2026."
        />
        <meta property="og:title" content="For Universities | UniBlueprint" />
        <meta property="og:description" content="Partner with UniBlueprint to give your students access to career support, campus community, and academic tools — launching September 2026." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          For Universities
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Partner with UniBlueprint to give your students the tools, support, and community they need to succeed.
        </p>
      </section>

      {/* ── VALUE PROPS ───────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Why partner with us
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Built to support your institution
          </h2>
          <div className="about-team-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
            {VALUE_PROPS.map(v => (
              <div key={v.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <v.icon size={24} color="#1E3A5F" />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginTop: '12px' }}>
                  {v.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>
                  {v.description}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
            margin: '40px auto 0', maxWidth: '700px', lineHeight: 1.7, textAlign: 'center',
          }}>
            UniBlueprint is live and recruiting Campus Handlers from Irish university campuses right now. Your students can apply today at uniblueprint.com/join — earning money, getting Pro free, and building professional skills while they study.
          </p>
        </div>
      </section>

      {/* ── ENQUIRY FORM ──────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
          textAlign: 'center',
        }}>
          Get in touch
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center', marginTop: '8px', marginBottom: '40px',
        }}>
          University enquiry
        </h2>

        <FormCard subtitle="Tell us about your institution and what you're looking for — we'll be in touch within 2 business days.">
          {success ? (
            <SuccessCard subtitle="We'll be in touch within 2 business days." />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text" name="website" value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
              />
              {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

              <FormField label="Institution name">
                <FormInput value={form.institution_name} onChange={set('institution_name')} placeholder="University College Dublin" required />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Your name">
                  <FormInput value={form.contact_name} onChange={set('contact_name')} placeholder="Jane Smith" required />
                </FormField>
                <FormField label="Your role">
                  <FormInput value={form.role} onChange={set('role')} placeholder="Head of Student Services" required />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Email">
                  <FormInput type="email" value={form.email} onChange={set('email')} placeholder="jane@university.ie" required />
                </FormField>
                <FormField label="Phone (optional)">
                  <FormInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+353 1 000 0000" />
                </FormField>
              </div>
              <FormField label="Message" hint="Tell us what you're interested in — partnership, integration, or a general chat.">
                <FormTextarea value={form.message} onChange={set('message')} placeholder="We would like to explore..." rows={5} />
              </FormField>

              <FormConsent />
              <SubmitButton loading={loading} label="Get in touch about a partnership" />
            </form>
          )}
        </FormCard>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Launching September 2026
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Across Irish universities and colleges during freshers week.
        </p>
      </section>
    </>
  )
}
