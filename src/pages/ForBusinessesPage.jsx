import { useState, Fragment } from 'react'
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

const STATS = [
  { value: 'Ireland',        label: 'Nationwide reach' },
  { value: 'September 2026', label: 'Live across campuses' },
  { value: 'Pro Subscribers', label: 'Actively seeking deals' },
  { value: '50% OFF',        label: 'September trial driving sign-ups' },
]

const STEPS = [
  { n: 1, title: 'Apply',         description: 'Tell us about your business and the deal you want to offer.' },
  { n: 2, title: 'Verified',      description: 'We review and confirm your listing meets our standards.' },
  { n: 3, title: 'Listed',        description: 'Your deal goes live on the UniBlueprint Lifestyle Blueprint.' },
  { n: 4, title: 'Students save', description: 'Pro subscribers discover and redeem your deal.' },
]

const BENEFITS = [
  {
    icon: Tag,
    title: 'Listed on the Lifestyle Blueprint',
    description: 'Visible to every UniBlueprint Pro subscriber, daily.',
  },
  {
    icon: Star,
    title: 'Category placement',
    description: 'Your deal appears in the right category for your business.',
  },
  {
    icon: TrendingUp,
    title: 'Featured deal opportunities',
    description: 'Top deals are featured on the home dashboard.',
  },
  {
    icon: Users,
    title: 'September launch visibility',
    description: 'Listed during our nationwide freshers week campaign.',
  },
  {
    icon: Tag,
    title: 'Partner page listing',
    description: 'Featured on uniblueprint.com/partners.',
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

  return (
    <>
      <Helmet>
        <title>For Businesses | UniBlueprint</title>
        <meta
          name="description"
          content="Partner with UniBlueprint to list exclusive student deals in the Lifestyle Blueprint and reach Irish students from freshers week 2026."
        />
        <meta property="og:title" content="For Businesses | UniBlueprint" />
        <meta property="og:description" content="Partner with UniBlueprint to list exclusive student deals in the Lifestyle Blueprint and reach Irish students from freshers week 2026." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Your brand. Their campus. UniBlueprint.
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          List your deals and discounts on UniBlueprint's Lifestyle Blueprint — accessed daily by students, apprentices, and young people across Ireland. Pro subscribers are actively looking for the right deals right now.
        </p>

        <div className="stats-grid" style={{ marginTop: '48px' }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              background: '#F5F0E8', borderRadius: '12px',
              padding: '20px', textAlign: 'center', flex: 1,
            }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY PARTNER WITH US ──────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Why partner with us
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
          margin: '20px auto 0', maxWidth: '700px', lineHeight: 1.7,
        }}>
          UniBlueprint Pro subscribers are actively spending. They are looking for food, fitness, travel, entertainment, and services that fit their lifestyle and budget. A listing on UniBlueprint puts your brand directly in front of them — at the moment they are deciding where to spend.
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
          margin: '16px auto 0', maxWidth: '700px', lineHeight: 1.7,
        }}>
          Ireland is launching into a student economy moment. September 2026 brings one of the largest freshers cohorts in years. UniBlueprint is there from day one — and so are our partners.
        </p>
      </section>

      {/* ── HOW PARTNERSHIP WORKS ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          How partnership works
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
          marginTop: '8px',
        }}>
          From application to live listing
        </h2>

        <div className="steps-row" style={{ marginTop: '40px' }}>
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flex: '1 0 0', maxWidth: '220px', minWidth: '140px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#F5F0E8' }}>
                    {step.n}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F',
                  marginTop: '12px', textAlign: 'center',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', textAlign: 'center', lineHeight: 1.5,
                }}>
                  {step.description}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="step-connector" style={{
                  flex: '1 0 16px',
                  borderTop: '1px dashed rgba(30,58,95,0.2)',
                  marginTop: '24px',
                }} />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            What you get
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            The student audience, curated
          </h2>
          <div className="about-team-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <b.icon size={24} color="#1E3A5F" />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginTop: '12px' }}>
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
          Partner application
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center', marginTop: '8px', marginBottom: '40px',
        }}>
          Apply to become a partner
        </h2>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Business name">
                  <FormInput value={form.business_name} onChange={set('business_name')} placeholder="Acme Coffee Co." required />
                </FormField>
                <FormField label="Contact name">
                  <FormInput value={form.contact_name} onChange={set('contact_name')} placeholder="John Murphy" required />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Your role">
                  <FormInput value={form.role} onChange={set('role')} placeholder="Marketing Manager" required />
                </FormField>
                <FormField label="Your email">
                  <FormInput type="email" value={form.email} onChange={set('email')} placeholder="john@business.ie" required />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <FormField label="Tell us about the deal you want to offer UniBlueprint students" hint="Include details about the offer you'd like to list for students.">
                <FormTextarea value={form.message} onChange={set('message')} placeholder="We'd like to offer 10% off all orders for verified students..." rows={5} />
              </FormField>

              <FormConsent />
              <SubmitButton loading={loading} label="Apply to Partner with UniBlueprint" />
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
          Get your deal in front of Irish students from freshers week.
        </p>
      </section>
    </>
  )
}
