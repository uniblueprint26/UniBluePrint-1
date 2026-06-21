import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MessageSquare, Handshake, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../components/ui/Form'

const SUBJECTS = [
  'General question',
  'My account',
  'A service I received',
  'Billing or payment',
  'Technical issue',
  'Media or press',
  'Other',
]

const PARTNERSHIP_TYPES = [
  'University partnership',
  'Business / Lifestyle Blueprint',
  'Sponsorship',
  'Media or press',
  'Other',
]

const TEAM_ROLES = [
  'Tech & Development',
  'Marketing',
  'Outreach',
  'Finance',
  'Legal',
  'Other',
]

const TABS = [
  { id: 'general',     label: 'General enquiry', icon: MessageSquare },
  { id: 'partnership', label: 'Partnership',      icon: Handshake },
  { id: 'team',        label: 'Join the team',    icon: Users },
]

// ─── General Enquiry Form ──────────────────────────────────────────────────────

function GeneralForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('general_enquiries').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return <SuccessCard subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Your name">
          <FormInput value={form.name} onChange={set('name')} placeholder="Aoife Murphy" required />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={set('email')} placeholder="aoife@example.ie" required />
        </FormField>
      </div>
      <FormField label="Subject">
        <FormSelect value={form.subject} onChange={set('subject')} required>
          <option value="">Select a subject</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </FormSelect>
      </FormField>
      <FormField label="Message">
        <FormTextarea value={form.message} onChange={set('message')} placeholder="How can we help?" rows={5} required />
      </FormField>
      <FormConsent />
      <SubmitButton loading={loading} label="Send message" />
    </form>
  )
}

// ─── Partnership Enquiry Form ──────────────────────────────────────────────────

function PartnershipForm() {
  const [form, setForm] = useState({ organisation: '', contact_name: '', email: '', type: '', message: '' })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('partnership_enquiries').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return <SuccessCard subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Organisation name">
          <FormInput value={form.organisation} onChange={set('organisation')} placeholder="Acme Ltd." required />
        </FormField>
        <FormField label="Your name">
          <FormInput value={form.contact_name} onChange={set('contact_name')} placeholder="John Smith" required />
        </FormField>
      </div>
      <FormField label="Email">
        <FormInput type="email" value={form.email} onChange={set('email')} placeholder="john@acme.ie" required />
      </FormField>
      <FormField label="Partnership type">
        <FormSelect value={form.type} onChange={set('type')} required>
          <option value="">Select type</option>
          {PARTNERSHIP_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
        </FormSelect>
      </FormField>
      <FormField label="Message">
        <FormTextarea value={form.message} onChange={set('message')} placeholder="Tell us about your partnership interest..." rows={5} required />
      </FormField>
      <FormConsent />
      <SubmitButton loading={loading} label="Send enquiry" />
    </form>
  )
}

// ─── Team Application Form ─────────────────────────────────────────────────────

function TeamForm() {
  const [form, setForm] = useState({ name: '', email: '', role: '', university: '', message: '' })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('team_applications').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return <SuccessCard title="Application received" subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Full name">
          <FormInput value={form.name} onChange={set('name')} placeholder="Ciarán Kelly" required />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={set('email')} placeholder="ciaran@example.ie" required />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Area of interest">
          <FormSelect value={form.role} onChange={set('role')} required>
            <option value="">Select area</option>
            {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </FormSelect>
        </FormField>
        <FormField label="University (optional)">
          <FormInput value={form.university} onChange={set('university')} placeholder="University College Dublin" />
        </FormField>
      </div>
      <FormField label="Tell us about yourself" hint="Why do you want to work with UniBlueprint?">
        <FormTextarea value={form.message} onChange={set('message')} placeholder="I would love to contribute to..." rows={5} required />
      </FormField>
      <FormConsent />
      <SubmitButton loading={loading} label="Submit application" />
    </form>
  )
}

// ─── ContactPage ───────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <>
      <Helmet>
        <title>Contact | UniBlueprint</title>
        <meta
          name="description"
          content="Get in touch with the UniBlueprint team — general enquiries, partnership opportunities, or joining the team."
        />
        <meta property="og:title" content="Contact | UniBlueprint" />
        <meta property="og:description" content="Get in touch with the UniBlueprint team — general enquiries, partnership opportunities, or joining the team." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Contact
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          We respond to every message within 2 business days.
        </p>
      </section>

      {/* ── CONTACT FORMS ─────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>

          {/* Tab selector */}
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            marginBottom: '32px', justifyContent: 'center',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px',
                  background: activeTab === tab.id ? '#1E3A5F' : '#FFFFFF',
                  color: activeTab === tab.id ? '#F5F0E8' : '#6B7280',
                  border: activeTab === tab.id ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form card */}
          <FormCard
            title={
              activeTab === 'general'     ? 'General enquiry' :
              activeTab === 'partnership' ? 'Partnership enquiry' :
              'Join the team'
            }
            subtitle={
              activeTab === 'general'     ? 'Ask us anything — we read every message.' :
              activeTab === 'partnership' ? 'Tell us about your organisation and what you have in mind.' :
              "Interested in working with UniBlueprint? Tell us about yourself."
            }
          >
            {activeTab === 'general'     && <GeneralForm />}
            {activeTab === 'partnership' && <PartnershipForm />}
            {activeTab === 'team'        && <TeamForm />}
          </FormCard>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '20px',
          }}>
            You can also reach us at{' '}
            <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>
              hello@uniblueprint.com
            </a>
          </p>
        </div>
      </section>

      {/* ── FAQ PROMPT ────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280' }}>
          Looking for a quick answer?{' '}
          <Link to="/faqs" style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'none' }}>
            Browse the FAQs →
          </Link>
        </p>
      </section>
    </>
  )
}
