import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tag, TrendingUp, Users, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table business_enquiries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    business_name text not null,
    contact_name text not null,
    role text not null,
    email text not null,
    phone text,
    business_type text not null,
    message text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table business_enquiries enable row level security;
  create policy "anon_insert" on business_enquiries for insert to anon with check (true);
*/

// TODO: Send confirmation email via Resend or Supabase Edge Function when this form is submitted.

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Direct access to young adults',
    description: 'Reach 18-26 year olds across 100+ Irish institutions — active, engaged, and looking for brands that understand them.',
  },
  {
    icon: Tag,
    title: 'Lifestyle Blueprint placement',
    description: 'Your brand featured in the deals section, directly unlockable in the app by Pro subscribers.',
  },
  {
    icon: TrendingUp,
    title: 'Campus Connect presence',
    description: 'Sponsored listings on relevant campus boards — your brand where young people are already spending time.',
  },
  {
    icon: Star,
    title: 'Authentic, opt-in',
    description: 'Young people choose to engage with your brand. No interruption advertising — only genuine, opted-in discovery.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Tell us about your brand',
    description: 'Share your brand, your goal, and the offer you want to bring to the UniBlueprint audience.',
  },
  {
    n: 2,
    title: 'Agree a placement',
    description: 'We find the right approach together — Lifestyle Blueprint, Campus Connect, or both.',
  },
  {
    n: 3,
    title: 'Go live',
    description: 'Your brand goes live in the app with a verified partner badge.',
  },
]

const BUSINESS_TYPES = [
  'Food & Drink',
  'Fitness',
  'Shopping',
  'Travel',
  'Entertainment',
  'Other',
]

// ─── Page styles ──────────────────────────────────────────────────────────────

const BIZ_STYLES = `
  .biz-value-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 900px;
    margin: 40px auto 0;
  }
  .biz-steps-row {
    display: flex;
    align-items: flex-start;
    gap: 0;
    max-width: 760px;
    margin: 40px auto 0;
    position: relative;
  }
  .biz-steps-row::before {
    content: '';
    position: absolute;
    top: 24px;
    left: calc(33.33% / 2);
    right: calc(33.33% / 2);
    height: 1px;
    background: rgba(30,58,95,0.18);
    z-index: 0;
  }
  .biz-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 16px;
    position: relative;
    z-index: 1;
  }
  .biz-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 640px) {
    .biz-value-grid { grid-template-columns: 1fr !important; }
    .biz-steps-row { flex-direction: column; align-items: flex-start; gap: 32px; }
    .biz-steps-row::before { display: none; }
    .biz-step { align-items: flex-start; text-align: left; padding: 0; }
    .biz-form-grid { grid-template-columns: 1fr !important; }
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

// ─── ForBusinessesPage ────────────────────────────────────────────────────────

export default function ForBusinessesPage() {
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    role: '',
    email: '',
    phone: '',
    business_type: '',
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
    const { error: dbError } = await supabase.from('business_enquiries').insert([{
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
    document.getElementById('biz-enquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Helmet>
        <title>For Businesses | UniBlueprint</title>
        <meta
          name="description"
          content="Partner with UniBlueprint to reach young people across Ireland through the Lifestyle Blueprint and Campus Connect — launching September 2026."
        />
        <meta property="og:title" content="For Businesses | UniBlueprint" />
        <meta property="og:description" content="Partner with UniBlueprint to reach young people across Ireland through the Lifestyle Blueprint and Campus Connect — launching September 2026." />
        <style>{BIZ_STYLES}</style>
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
          <SectionLabel light>For Businesses and Brands</SectionLabel>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.1,
          }}>
            Reach young people in Ireland. Authentically.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', lineHeight: 1.7,
          }}>
            UniBlueprint connects you directly with the student and young adult market across Ireland through the Lifestyle Blueprint deals section and Campus Connect boards.
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
          <SectionLabel>Why advertise with us</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.15,
          }}>
            The student audience, curated.
          </h2>

          <div className="biz-value-grid">
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
            From conversation to live in the app.
          </h2>

          <div className="biz-steps-row">
            {STEPS.map(step => (
              <div key={step.n} className="biz-step">
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
      <section id="biz-enquiry-form" style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <SectionLabel>Partner application</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px',
          }}>
            Get in touch
          </h2>
        </div>

        <FormCard subtitle="Tell us about your business and the deal you have in mind. We review every application before any listing goes live.">
          {success ? (
            <SuccessCard subtitle="We'll review your application and be in touch within 2 business days." />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text" name="website" value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
              />
              {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

              <div className="biz-form-grid">
                <FormField label="Business name">
                  <FormInput value={form.business_name} onChange={set('business_name')} placeholder="Acme Coffee Co." required />
                </FormField>
                <FormField label="Contact name">
                  <FormInput value={form.contact_name} onChange={set('contact_name')} placeholder="John Murphy" required />
                </FormField>
              </div>
              <div className="biz-form-grid">
                <FormField label="Your role">
                  <FormInput value={form.role} onChange={set('role')} placeholder="Marketing Manager" required />
                </FormField>
                <FormField label="Your email">
                  <FormInput type="email" value={form.email} onChange={set('email')} placeholder="john@business.ie" required />
                </FormField>
              </div>
              <div className="biz-form-grid">
                <FormField label="Phone (optional)">
                  <FormInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+353 1 000 0000" />
                </FormField>
                <FormField label="Type of business">
                  <FormSelect value={form.business_type} onChange={set('business_type')} required>
                    <option value="">Select a category</option>
                    {BUSINESS_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </FormSelect>
                </FormField>
              </div>
              <FormField label="Tell us about the deal you want to offer" hint="Include details about the offer you'd like to list for young people.">
                <FormTextarea value={form.message} onChange={set('message')} placeholder="We'd like to offer 10% off all orders for verified students..." rows={5} />
              </FormField>

              <FormConsent />
              <SubmitButton loading={loading} label="Apply to Partner with UniBlueprint" />
            </form>
          )}
        </FormCard>
      </section>
    </>
  )
}
