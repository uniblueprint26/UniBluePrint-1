import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tag, TrendingUp, Users, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, TextInput, TextArea, SelectInput,
  SubmitButton, SuccessCard, ErrorBanner,
} from '../components/forms/FormUI'

/*
  TODO: Create Supabase table:

  create table business_enquiries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    business_name text not null,
    contact_name text not null,
    email text not null,
    phone text,
    category text not null,
    deal_description text,
    message text,
    status text default 'pending'
  );
*/

// TODO: Send confirmation email via Resend or Supabase Edge Function when this form is submitted.
// Email should confirm receipt and set expectations on response time.

const BENEFITS = [
  {
    icon: Users,
    title: 'Reach Irish students directly',
    description: 'Uniblueprint launches at Irish universities during freshers week September 2026 — your deal in front of students from day one.',
  },
  {
    icon: Tag,
    title: 'Lifestyle Blueprint placement',
    description: 'Your deal is listed in the Lifestyle Blueprint, visible to all Pro subscribers. Exclusive, curated, and actually used.',
  },
  {
    icon: TrendingUp,
    title: 'Growing student audience',
    description: 'As Uniblueprint grows, your deal reaches more students — no additional cost per impression.',
  },
  {
    icon: Star,
    title: 'Quality-reviewed listing',
    description: 'We review every deal before it goes live. Being listed on Uniblueprint signals genuine student value.',
  },
]

const CATEGORIES = [
  'Food & Drink',
  'Fitness',
  'Shopping',
  'Travel',
  'Entertainment',
  'Technology',
  'Health & Wellbeing',
  'Other',
]

export default function ForBusinessesPage() {
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    category: '',
    deal_description: '',
    message: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) return
    setLoading(true)
    setError(null)
    const { error: dbError } = await supabase
      .from('business_enquiries')
      .insert([{ ...form, status: 'pending' }])
    if (dbError) {
      setError('Something went wrong. Please try again or email us directly.')
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <>
      <Helmet>
        <title>For Businesses | Uniblueprint</title>
        <meta
          name="description"
          content="Partner with Uniblueprint to list exclusive student deals in the Lifestyle Blueprint and reach Irish students from freshers week 2026."
        />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          For Businesses
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Reach Irish students with exclusive deals in the Uniblueprint Lifestyle Blueprint.
        </p>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
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
            <SuccessCard />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Business name">
                  <TextInput value={form.business_name} onChange={set('business_name')} placeholder="Acme Coffee Co." required />
                </FormField>
                <FormField label="Your name">
                  <TextInput value={form.contact_name} onChange={set('contact_name')} placeholder="John Murphy" required />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Email">
                  <TextInput type="email" value={form.email} onChange={set('email')} placeholder="john@business.ie" required />
                </FormField>
                <FormField label="Phone (optional)">
                  <TextInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+353 1 000 0000" />
                </FormField>
              </div>
              <FormField label="Deal category">
                <SelectInput value={form.category} onChange={set('category')} required>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Deal description" hint="Describe the offer you would like to list for students.">
                <TextArea value={form.deal_description} onChange={set('deal_description')} placeholder="10% off all orders for verified students..." rows={3} />
              </FormField>
              <FormField label="Anything else?">
                <TextArea value={form.message} onChange={set('message')} placeholder="Any other information..." rows={3} />
              </FormField>

              <SubmitButton loading={loading} label="Submit application" />
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
