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

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: GraduationCap,
    title: 'Student success support',
    description: 'CV, career documents, and coaching in one place — extending your careers team without adding headcount.',
  },
  {
    icon: Users,
    title: 'Campus community',
    description: 'Campus Connect boards reduce isolation and build student belonging across your institution.',
  },
  {
    icon: BarChart3,
    title: 'Outcomes data',
    description: 'Anonymous engagement data to inform your student support strategy and demonstrate service reach.',
  },
  {
    icon: Shield,
    title: 'No cost to the institution',
    description: 'UniBlueprint is free to join for students. Partnership is about integration, not licensing fees.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Get in touch',
    description: 'We discuss fit, answer your questions, and understand what your institution needs.',
  },
  {
    n: 2,
    title: 'Onboard to Campus Connect',
    description: 'We set up your institution on Campus Connect and configure the community boards.',
  },
  {
    n: 3,
    title: 'Students join',
    description: 'Your students download the app or sign up on the web and join their campus board.',
  },
]

// ─── Page styles ──────────────────────────────────────────────────────────────

const UNI_STYLES = `
  .uni-value-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 900px;
    margin: 40px auto 0;
  }
  .uni-steps-row {
    display: flex;
    align-items: flex-start;
    gap: 0;
    max-width: 760px;
    margin: 40px auto 0;
    position: relative;
  }
  .uni-steps-row::before {
    content: '';
    position: absolute;
    top: 24px;
    left: calc(33.33% / 2);
    right: calc(33.33% / 2);
    height: 1px;
    background: rgba(30,58,95,0.18);
    z-index: 0;
  }
  .uni-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 16px;
    position: relative;
    z-index: 1;
  }
  .uni-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 640px) {
    .uni-value-grid { grid-template-columns: 1fr !important; }
    .uni-steps-row { flex-direction: column; align-items: flex-start; gap: 32px; }
    .uni-steps-row::before { display: none; }
    .uni-step { align-items: flex-start; text-align: left; padding: 0; }
    .uni-form-grid { grid-template-columns: 1fr !important; }
  }
`

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: 0,
    }}>
      {children}
    </p>
  )
}

// ─── ForUniversitiesPage ──────────────────────────────────────────────────────

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

  function scrollToForm() {
    document.getElementById('uni-enquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        <style>{UNI_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '100px 24px 80px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
          <SectionLabel light>For Universities and Colleges</SectionLabel>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.1,
          }}>
            Support your students. Strengthen your outcomes.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', lineHeight: 1.7,
          }}>
            UniBlueprint gives your students access to CV support, career coaching, and campus community tools — reducing the load on your careers office and student services.
          </p>

          <button
            type="button"
            onClick={scrollToForm}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '50px', padding: '0 28px',
              background: '#F5F0E8', color: '#1E3A5F',
              border: 'none', borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', marginTop: '28px',
            }}
          >
            Get in touch
          </button>
        </div>
      </section>

      {/* ── SECTION 2 — VALUE PROPS ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(30,58,95,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <SectionLabel>Why partner with us</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.15,
          }}>
            Built to support your institution.
          </h2>

          <div className="uni-value-grid">
            {VALUE_PROPS.map(v => (
              <div key={v.title} style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(30,58,95,0.08)',
                borderRadius: '16px',
                padding: '28px 26px 24px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                textAlign: 'left',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <v.icon size={22} color="#F5F0E8" strokeWidth={1.8} />
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '18px', color: '#1E3A5F', margin: 0,
                }}>
                  {v.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.65,
                }}>
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ───────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.15,
          }}>
            Three steps to launch.
          </h2>

          <div className="uni-steps-row">
            {STEPS.map(step => (
              <div key={step.n} className="uni-step">
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginBottom: '14px',
                }}>
                  <span style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '20px', color: '#F5F0E8', lineHeight: 1,
                  }}>
                    {step.n}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '18px', color: '#1E3A5F',
                  margin: '0 0 6px',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  lineHeight: 1.6, margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — ENQUIRY FORM ───────────────────────────────────────── */}
      <section id="uni-enquiry-form" style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <SectionLabel>Get in touch</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px',
          }}>
            University enquiry
          </h2>
        </div>

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
              <div className="uni-form-grid">
                <FormField label="Your name">
                  <FormInput value={form.contact_name} onChange={set('contact_name')} placeholder="Jane Smith" required />
                </FormField>
                <FormField label="Your role">
                  <FormInput value={form.role} onChange={set('role')} placeholder="Head of Student Services" required />
                </FormField>
              </div>
              <div className="uni-form-grid">
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
    </>
  )
}
