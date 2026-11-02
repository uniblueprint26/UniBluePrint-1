import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MessageSquare, Handshake, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError, sendFormConfirmation, notifyTeam,
} from '../components/ui/Form'

// general_enquiries, partnership_enquiries, and team_applications (all 3 forms below) are
// already migrated — see supabase/migrations/20260824120000_website_public_forms.sql for
// the real schema and RLS policies. This comment used to carry a draft CREATE TABLE block;
// removed since it was stale and could read as "these tables don't exist yet."

// Confirmation email: send-form-confirmation (see supabase/functions/), called
// via sendFormConfirmation() right after each successful insert below. It's a
// no-op until RESEND_API_KEY is set as an Edge Function secret, deploy the
// function and set that key to turn these on; nothing else needs touching.

// Rate limiting is live: enforce_form_rate_limit() (see
// supabase/migrations/20260828160000_rate_limit_public_forms.sql) caps every
// table this page writes to (general_enquiries, partnership_enquiries,
// team_applications, university_enquiries, business_enquiries) at 3
// submissions per email per hour, enforced by a database trigger.

// Two-up field rows (name/email, organisation/contact name, role/university)
// were hardcoded to `gridTemplateColumns: '1fr 1fr'` with no mobile
// breakpoint, on narrow phones each field shrank to ~half-width, cramped
// enough that placeholder text truncated and the fields became fiddly to
// tap accurately. Stacks to one column below 480px.
const CONTACT_FORM_STYLES = `
  .contact-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 480px) {
    .contact-form-row { grid-template-columns: 1fr; }
  }
`

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

const COMMITMENT_HOURS = [
  '2-3 hrs/week',
  '3-5 hrs/week',
  '5-10 hrs/week',
  '10+ hrs/week',
]

// Same overview + role write-ups used on LinkedIn for the internal-team
// hiring push, unchanged, so the story reads the same wherever someone
// first encounters it.
const TEAM_OVERVIEW = "UniBlueprint is Ireland's first all-in-one platform for student life, built by students, for students. Five pillars in one place: Foundation Blueprint for CVs, cover letters, and interview prep, Elevation Blueprint connecting students with real coaches and mentors, Lifestyle Blueprint for exclusive partner deals and discounts, Campus Connect for community at your own university, and Course Connect linking students across Ireland on the same course. Mental health and wellbeing support is permanently free for every student, no subscription, no exceptions. We're a team of 30+ across tech, legal, marketing, outreach, and finance, already live across 10+ Irish universities with partners on board and growing fast."

const TEAM_ROLE_INFO = [
  {
    name: 'Outreach',
    body: "We're growing the Outreach team at UniBlueprint under Sienna, our Outreach Lead, alongside Fabz and Ethan running their own sub-projects within the team. We're looking for outgoing, people-first personalities who are genuinely good at building relationships and opening doors, more than any specific background or qualification. If you can talk to anyone and get a yes, we want to hear from you. You'll work directly on real partnerships from day one, building the kind of experience and CV line that's hard to get anywhere else as a student.",
  },
  {
    name: 'Marketing',
    body: "We're growing the Marketing team at UniBlueprint across a few different strands. Creatives who can shoot, direct, and bring visuals to life will work closely with Bene on shoots and content. People who live and breathe posts and digital marketing will work alongside Elizabeth and Alex. And if you're a feature specialist with a specific skill to bring, you'll work directly alongside Emily. Whatever your lane, you'll help shape how a real, live platform tells its story to thousands of students, with genuine portfolio and CV-building experience in exactly the kind of work you want to be doing.",
  },
  {
    name: 'Finance',
    body: "We're growing the Finance team at UniBlueprint. You'll work under Wami, our Finance Lead, and alongside the existing team, filling specific gaps across budgeting, analysis, bookkeeping, and financial planning. This one's more experience and skill-based than our other teams. We're looking for people who already know their way around real numbers and can step into real responsibility quickly. It's genuine exposure to how a live startup actually runs its finances, not a classroom exercise.",
  },
  {
    name: 'Tech & Development',
    body: "We're growing the Tech team at UniBlueprint and looking for good tech students across the board, frontend, backend, mobile, QA, whatever your lane is. We only bring people on for work where a real person genuinely adds something and where we can offer real experience in return, not busywork. You'll work under Eman and the existing team across the real, live app and Studio platform, shipping production code used by real students. It's the kind of hands-on technical experience that actually moves a CV forward.",
  },
  {
    name: 'Legal',
    body: "We're looking for a small number of committed people to support the Legal team at UniBlueprint under Basmali and Rachel, helping with contracts, compliance, and partnership terms in your own spare time. This is one of the most important teams in the business, so we're looking for people who are genuinely reliable and want to build real legal experience on a live company, not just add a CV line. If that's you, we'd love to hear from you.",
  },
]

function TeamIntro() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#4B5565',
        lineHeight: 1.7, margin: '0 0 24px',
      }}>
        {TEAM_OVERVIEW}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {TEAM_ROLE_INFO.map(role => (
          <div
            key={role.name}
            style={{
              background: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.06)',
              padding: '20px 24px',
            }}
          >
            <h3 style={{
              fontFamily: "'DM Serif Display', serif", fontSize: '19px',
              color: '#1E3A5F', margin: '0 0 8px',
            }}>
              {role.name}
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280',
              lineHeight: 1.65, margin: 0,
            }}>
              {role.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'general',     label: 'General enquiry', icon: MessageSquare },
  { id: 'partnership', label: 'Partnership',      icon: Handshake },
  { id: 'team',        label: 'Join the team',    icon: Users },
]

// ─── General Enquiry Form ──────────────────────────────────────────────────────

function GeneralForm({ initialSubject = '', initialMessage = '' }) {
  const [form, setForm] = useState({ name: '', email: '', subject: initialSubject, message: initialMessage })
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
    else { sendFormConfirmation('general', form.email, form.name); setSuccess(true) }
  }

  if (success) return <SuccessCard subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div className="contact-form-row">
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
    else { sendFormConfirmation('partnership', form.email, form.contact_name); setSuccess(true) }
  }

  if (success) return <SuccessCard subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div className="contact-form-row">
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
  const [form, setForm] = useState({
    name: '', email: '', role: '', university: '',
    commitment_hours: '', experience_notes: '', message: '',
  })
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
    else {
      sendFormConfirmation('team', form.email, form.name)
      notifyTeam('team_application', form.email, form.name)
      setSuccess(true)
    }
  }

  if (success) return <SuccessCard title="Application received" subtitle="We'll be in touch within 2 business days." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div className="contact-form-row">
        <FormField label="Full name">
          <FormInput value={form.name} onChange={set('name')} placeholder="Ciarán Kelly" required />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={set('email')} placeholder="ciaran@example.ie" required />
        </FormField>
      </div>
      <div className="contact-form-row">
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
      <FormField label="How many hours a week can you commit?">
        <FormSelect value={form.commitment_hours} onChange={set('commitment_hours')} required>
          <option value="">Select hours</option>
          {COMMITMENT_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </FormSelect>
      </FormField>
      <FormField
        label="Have you done this kind of work before?"
        hint="No experience needed, just curious what you've tried, through study, work, or your own projects."
      >
        <FormTextarea value={form.experience_notes} onChange={set('experience_notes')} placeholder="Optional, tell us a bit if you have" rows={3} />
      </FormField>
      <FormField label="Tell us about yourself" hint="Why do you want to work with UniBlueprint?">
        <FormTextarea value={form.message} onChange={set('message')} placeholder="I would love to contribute to..." rows={5} required />
      </FormField>
      <FormConsent />
      <SubmitButton loading={loading} label="Submit application" />
    </form>
  )
}

// ─── ContactPage ───────────────────────────────────────────────────────────────

const VALID_TABS = new Set(TABS.map(t => t.id))

export default function ContactPage() {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic') || ''
  const requestedTab = searchParams.get('tab') || ''
  const [activeTab, setActiveTab] = useState(VALID_TABS.has(requestedTab) ? requestedTab : 'general')

  return (
    <>
      <Helmet>
        <title>Contact | UniBlueprint</title>
        <meta
          name="description"
          content="Get in touch with the UniBlueprint team, general enquiries, partnership opportunities, or joining the team."
        />
        <meta property="og:title" content="Contact | UniBlueprint" />
        <meta property="og:description" content="Get in touch with the UniBlueprint team, general enquiries, partnership opportunities, or joining the team." />
        <style>{CONTACT_FORM_STYLES}</style>
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

          {activeTab === 'team' && <TeamIntro />}

          {/* Form card */}
          <FormCard
            title={
              activeTab === 'general'     ? 'General enquiry' :
              activeTab === 'partnership' ? 'Partnership enquiry' :
              'Join the team'
            }
            subtitle={
              activeTab === 'general'     ? 'Ask us anything, we read every message.' :
              activeTab === 'partnership' ? 'Tell us about your organisation and what you have in mind.' :
              "Interested in working with UniBlueprint? Tell us about yourself."
            }
          >
            {activeTab === 'general'     && (
              <GeneralForm
                initialSubject={topic ? 'General question' : ''}
                initialMessage={topic ? `I have a question about: ${topic}\n\n` : ''}
              />
            )}
            {activeTab === 'partnership' && <PartnershipForm />}
            {activeTab === 'team'        && <TeamForm />}
          </FormCard>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '20px',
          }}>
            You can also reach us at{' '}
            <a href="mailto:support@uniblueprint.ie" style={{ color: '#1E3A5F', fontWeight: '500' }}>
              support@uniblueprint.ie
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
