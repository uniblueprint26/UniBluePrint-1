import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, parseDbError,
} from '../../components/ui/Form'

// TODO: Manual processing workflow for GDPR requests:
// 1. New row inserted into gdpr_requests with status 'pending'
// 2. Team member reviews request and verifies identity via email reply
// 3. Action performed (deletion, export, correction, or restriction) within 30 days per GDPR Art. 12
// 4. Status updated to 'completed' in Supabase after processing
// 5. Confirmation email sent to user

/*
  TODO: Create Supabase table:

  create table gdpr_requests (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    name text not null,
    email text not null,
    request_type text not null,
    message text,
    status text default 'pending'
  );
  alter table gdpr_requests enable row level security;
  create policy "anon_insert" on gdpr_requests for insert to anon with check (true);
*/

const REQUEST_TYPES = [
  'Delete my data',
  'Access my data',
  'Correct my data',
  'Restrict processing',
]

const H = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '12px' }
const P = { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, marginBottom: '12px' }

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={H}>{title}</h2>
      {children}
    </div>
  )
}

function GdprForm() {
  const [form, setForm] = useState({ name: '', email: '', request_type: '', message: '' })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { error: dbError } = await supabase.from('gdpr_requests').insert([{ ...form, status: 'pending' }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return <SuccessCard title="Request received" subtitle="We will process your request within 30 days as required by GDPR." />
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Full name">
          <FormInput value={form.name} onChange={set('name')} placeholder="Your name" required />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={set('email')} placeholder="you@example.ie" required />
        </FormField>
      </div>
      <FormField label="Request type">
        <FormSelect value={form.request_type} onChange={set('request_type')} required>
          <option value="">Select request type</option>
          {REQUEST_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </FormSelect>
      </FormField>
      <FormField label="Message" hint="Tell us more about your request (optional).">
        <FormTextarea value={form.message} onChange={set('message')} placeholder="Additional details..." rows={4} />
      </FormField>
      <FormConsent />
      <SubmitButton loading={loading} label="Submit request" />
    </form>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Privacy Policy — how we collect, use, and protect your personal data under GDPR." />
        <meta property="og:title" content="Privacy Policy | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Privacy Policy — how we collect, use, and protect your personal data under GDPR." />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
          Last updated: June 2026
        </p>
      </section>

      <section style={{ background: '#F5F0E8', padding: '64px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '48px 40px',
          }}>
            <Section title="1. Who We Are">
              <p style={P}>TODO: UniBlueprint Ltd is the data controller for personal data collected through the UniBlueprint platform. We are registered in Ireland. Contact: hello@uniblueprint.com. [TODO: Data Protection Officer details if required.]</p>
            </Section>

            <Section title="2. Data We Collect">
              <p style={P}>TODO: We collect the following categories of personal data: account data (name, email, password hash); profile data (university, course, year of study); service request data (CV content, application materials, coaching notes); community data (posts, messages); payment data (processed by Stripe — we do not store card details); usage data (page views, feature interactions); device data (browser type, IP address).</p>
            </Section>

            <Section title="3. How We Use Your Data">
              <p style={P}>TODO: We use your data to: provide and improve UniBlueprint services; process payments via Stripe; deliver Foundation Blueprint and Elevation Blueprint outputs; operate Campus Connect and Course Connect communities; send transactional emails (order confirmations, password resets); send marketing communications where you have opted in; comply with legal obligations.</p>
            </Section>

            <Section title="4. Legal Basis for Processing">
              <p style={P}>TODO: We process your data on the following legal bases under GDPR: Contract (Article 6(1)(b)) — to provide services you have requested; Legitimate Interests (Article 6(1)(f)) — to improve the platform and prevent fraud; Consent (Article 6(1)(a)) — for marketing communications and analytics cookies; Legal Obligation (Article 6(1)(c)) — for tax and accounting records.</p>
            </Section>

            <Section title="5. Data Sharing">
              <p style={P}>TODO: We share your data with: Supabase (database and authentication infrastructure); Stripe (payment processing); Resend (transactional email); Google Analytics (usage analytics, only if you have accepted analytics cookies). We do not sell your personal data. We may disclose data where required by Irish or EU law.</p>
            </Section>

            <Section title="6. Data Retention">
              <p style={P}>TODO: We retain your account data for as long as your account is active. Deleted accounts are purged within 30 days. Service request data is retained for 12 months after delivery to handle revision requests. Financial records are retained for 7 years as required by Irish law.</p>
            </Section>

            <Section title="7. Your Rights Under GDPR">
              <p style={P}>TODO: Under GDPR, you have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data ("right to be forgotten"); restrict or object to processing; data portability; withdraw consent at any time; lodge a complaint with the Data Protection Commission of Ireland (dataprotection.ie).</p>
              <p style={P}>To exercise any of these rights, use the form below or contact us at hello@uniblueprint.com. We will respond within 30 days.</p>
            </Section>

            <Section title="8. Cookies">
              <p style={P}>
                TODO: We use cookies to operate the platform and analyse usage. For full details, see our{' '}
                <Link to="/cookies" style={{ color: '#1E3A5F', fontWeight: '500' }}>Cookie Policy</Link>.
                You can manage your cookie preferences using the banner at the bottom of this page.
              </p>
            </Section>

            <Section title="9. Third-Party Services">
              <p style={P}>TODO: UniBlueprint uses third-party services that may process your data in their own right. These include Stripe (payments), Supabase (infrastructure), Google Analytics (analytics, if accepted), and Resend (email). Each provider operates under their own privacy policy. Where applicable, we have data processing agreements in place.</p>
            </Section>

            <Section title="10. Security">
              <p style={P}>TODO: We implement appropriate technical and organisational measures to protect your personal data, including encryption in transit (TLS), password hashing, and access controls. We conduct periodic security reviews. If a data breach occurs that is likely to result in high risk to your rights, we will notify you and the Data Protection Commission as required by law.</p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p style={P}>TODO: We may update this Privacy Policy from time to time. We will notify you of material changes by email or in-app notification. The date at the top of this page indicates when the policy was last updated.</p>
            </Section>

            <Section title="12. Contact Us">
              <p style={P}>
                TODO: For privacy-related queries, contact us at{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                . For GDPR requests, use the form below.
              </p>
            </Section>
          </div>

          <div style={{ marginTop: '48px' }}>
            <FormCard
              title="Exercise Your Rights"
              subtitle="Submit a GDPR request and we will respond within 30 days."
            >
              <GdprForm />
            </FormCard>
          </div>
        </div>
      </section>
    </>
  )
}
