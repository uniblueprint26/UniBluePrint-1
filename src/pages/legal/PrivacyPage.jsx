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

const H  = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '12px' }
const H3 = { fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginBottom: '8px', marginTop: '20px' }
const P  = { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, marginBottom: '12px' }
const LI = { marginBottom: '6px' }
const TH = { padding: '10px 12px', textAlign: 'left', background: '#F5F0E8', color: '#1E3A5F', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Sans', sans-serif" }
const TD = { padding: '10px 12px', borderBottom: '1px solid rgba(30,58,95,0.08)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={H}>{title}</h2>
      {children}
    </div>
  )
}

function RetentionTable() {
  const rows = [
    ['Account data',             'Name, email, profile information',                   'Duration of account, plus 2 years after closure'],
    ['Usage data',               'Page views, feature interactions, session logs',     '26 months'],
    ['Payment records',          'Transaction amounts, dates, Stripe references',      '7 years (Irish tax and accounting law)'],
    ['Support communications',   'Email threads, in-app support messages',             '3 years after last contact'],
    ['Marketing consent',        'Opt-in records, unsubscribe timestamps',             'Until consent withdrawn, plus 1 year'],
    ['Campus Ambassador data',   'Role application details, activity records',          '3 years after end of role'],
    ['Cookie consent',           'Banner consent preference stored in local storage',  '1 year from consent date'],
  ]
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>Category</th>
            <th style={TH}>Data included</th>
            <th style={TH}>Retention period</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, data, period]) => (
            <tr key={cat}>
              <td style={{ ...TD, fontWeight: 600, color: '#1E3A5F', whiteSpace: 'nowrap' }}>{cat}</td>
              <td style={TD}>{data}</td>
              <td style={TD}>{period}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        <meta name="description" content="UniBlueprint Privacy Policy — how we collect, use, and protect your personal data under GDPR and the Irish Data Protection Act 2018." />
        <meta property="og:title" content="Privacy Policy | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Privacy Policy — how we collect, use, and protect your personal data under GDPR and the Irish Data Protection Act 2018." />
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
              <p style={P}>UniBlueprint Ltd is the data controller for personal data collected through the UniBlueprint platform. We are registered in Ireland and operate under the EU General Data Protection Regulation (GDPR) 2016/679 and the Irish Data Protection Act 2018.</p>
              <p style={P}>
                For privacy-related queries, contact us at{' '}
                <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>.
                {' '}For GDPR requests, use the form at the bottom of this page.
              </p>
            </Section>

            <Section title="2. Data We Collect">
              <p style={P}>We collect the following categories of personal data:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Account data:</strong> name, email address, and password (stored as a secure hash).</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Profile data:</strong> institution, course, year of study or pathway, and preferences you provide.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Service request data:</strong> CV content, essays, cover letters, application materials, and coaching notes you submit for Foundation Blueprint or Elevation Blueprint services.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Community data:</strong> posts, replies, and messages you create in Campus Connect or Course Connect.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Payment data:</strong> processed by Stripe on our behalf. We do not store your card number, CVV, or full payment details — only a Stripe customer reference.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Usage data:</strong> pages visited, features used, session duration, and in-app interactions.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Device and technical data:</strong> browser type, operating system, IP address, and device identifiers (collected automatically when you visit the Platform).</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Marketing preferences:</strong> your opt-in or opt-out status for marketing communications.</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Data">
              <p style={P}>We use your personal data to:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>Create and manage your Account and provide access to UniBlueprint services;</li>
                <li style={LI}>Process payments via Stripe for Pro subscriptions and individual services;</li>
                <li style={LI}>Deliver Foundation Blueprint outputs via Campus Handlers and Elevation Blueprint sessions via Uni Coaches;</li>
                <li style={LI}>Operate Campus Connect and Course Connect community features;</li>
                <li style={LI}>Send transactional emails (order confirmations, delivery notifications, password resets);</li>
                <li style={LI}>Send marketing communications where you have provided explicit opt-in consent;</li>
                <li style={LI}>Analyse usage to improve the Platform and fix issues;</li>
                <li style={LI}>Detect and prevent fraud and misuse;</li>
                <li style={LI}>Comply with our legal obligations under Irish and EU law.</li>
              </ul>
            </Section>

            <Section title="4. Legal Basis for Processing">
              <p style={P}>We process your personal data on the following legal bases under Article 6 of GDPR:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Contract (Article 6(1)(b)):</strong> to create your Account, deliver services you have requested, and process related payments.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Legitimate interests (Article 6(1)(f)):</strong> to improve the Platform, detect fraud, ensure security, and send service-related communications. Our interests do not override your rights and freedoms.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Consent (Article 6(1)(a)):</strong> for marketing emails and analytics cookies. You can withdraw consent at any time without affecting any prior processing.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Legal obligation (Article 6(1)(c)):</strong> to retain financial records for 7 years and to comply with data protection law.</li>
              </ul>
            </Section>

            <Section title="5. Data Sharing and Third Parties">
              <p style={P}>We share your personal data with the following third parties only where necessary to provide the Platform:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Supabase:</strong> database hosting and user authentication infrastructure. Data stored within the EU.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Stripe:</strong> payment processing. Stripe is the data controller for your card data under their own Privacy Policy. A Data Processing Agreement is in place under GDPR Article 28.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Resend:</strong> transactional email delivery (order confirmations, password resets).</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Google Analytics:</strong> platform usage analytics, only if you have accepted analytics cookies via the consent banner.</li>
              </ul>
              <p style={P}>We do not sell, rent, or trade your personal data to any third party. We may disclose your data where required by Irish or EU law, court order, or lawful request from a public authority.</p>
              <p style={P}>Campus Handlers and Uni Coaches access only the content you explicitly submit for review as part of a service request. They operate under confidentiality obligations and may not retain or reuse your content.</p>
            </Section>

            <Section title="6. International Data Transfers">
              <p style={P}>UniBlueprint stores and processes your data primarily within the European Economic Area (EEA). Where any data is transferred outside the EEA (for example, by Stripe or Google), those transfers are made under appropriate safeguards including Standard Contractual Clauses approved by the European Commission.</p>
            </Section>

            <Section title="7. Data Retention">
              <p style={P}>We keep your personal data only for as long as necessary for the purposes set out in this policy or as required by law. The table below sets out our standard retention periods by data category.</p>
              <RetentionTable />
              <p style={{ ...P, marginTop: '16px' }}>When a retention period expires, we securely delete or anonymise the data. If you delete your Account, your profile and service data will be purged within 30 days, except where retention is required by law (for example, 7-year financial record retention).</p>
            </Section>

            <Section title="8. Your Rights Under GDPR">
              <p style={P}>Under the GDPR and the Irish Data Protection Act 2018, you have the following rights in relation to your personal data:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Access (Article 15):</strong> request a copy of the personal data we hold about you.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Rectification (Article 16):</strong> correct inaccurate or incomplete personal data.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Erasure (Article 17):</strong> request deletion of your data ("right to be forgotten"), where no legal ground for retention applies.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Restriction (Article 18):</strong> request that we limit the processing of your data in certain circumstances.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Portability (Article 20):</strong> receive your data in a structured, machine-readable format.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Objection (Article 21):</strong> object to processing based on legitimate interests or for direct marketing at any time.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Withdraw consent:</strong> withdraw any previously given consent at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.</li>
              </ul>
              <p style={P}>
                To exercise any of these rights, use the request form at the bottom of this page or contact us at{' '}
                <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>.
                {' '}We will respond within 30 days as required by GDPR Article 12. We may need to verify your identity before processing your request.
              </p>
            </Section>

            <Section title="9. Cookies">
              <p style={P}>
                We use cookies and similar tracking technologies on the Platform. For full details of what cookies we use, why, and how to manage them, see our{' '}
                <Link to="/cookies" style={{ color: '#1E3A5F', fontWeight: '500' }}>Cookie Policy</Link>.
                {' '}You can manage your cookie preferences using the banner that appears when you first visit UniBlueprint.
              </p>
            </Section>

            <Section title="10. Children's Privacy">
              <p style={P}>UniBlueprint is not directed at children under 18 years of age. We do not knowingly collect personal data from anyone under 18. If you become aware that a person under 18 has provided personal data to UniBlueprint without appropriate consent, please contact us at <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a> and we will take steps to delete that data promptly.</p>
            </Section>

            <Section title="11. Security">
              <p style={P}>We implement appropriate technical and organisational measures to protect your personal data, including encryption in transit (TLS/HTTPS), secure password hashing, role-based access controls, and regular security reviews of our infrastructure.</p>
              <p style={P}>If a personal data breach occurs that is likely to result in a high risk to your rights and freedoms, we will notify you and the Data Protection Commission without undue delay and, where required, within 72 hours as required by GDPR Article 33.</p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p style={P}>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by email or in-app notification. The date at the top of this page indicates when the policy was last updated. Continued use of UniBlueprint after the effective date of any changes constitutes acceptance of the updated policy.</p>
            </Section>

            <Section title="13. Data Protection Officer">
              <p style={P}>UniBlueprint Ltd does not currently have an appointed Data Protection Officer. Under GDPR Article 37, a DPO is required only where processing is carried out by a public authority, where core activities consist of large-scale systematic monitoring of individuals, or where core activities involve large-scale processing of special categories of data. UniBlueprint does not meet any of these criteria at this time.</p>
              <p style={P}>All data protection matters are handled directly by the UniBlueprint team. For any privacy-related query or GDPR rights request, contact us at <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>.</p>
            </Section>

            <Section title="14. How to Make a Complaint">
              <p style={P}>If you are not satisfied with how we have handled your personal data, you have the right to lodge a complaint with the Data Protection Commission (DPC), the supervisory authority for data protection in Ireland.</p>
              <p style={P}>
                <strong style={{ color: '#1E3A5F' }}>Data Protection Commission</strong><br />
                21 Fitzwilliam Square South, Dublin 2, D02 RD28<br />
                <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>dataprotection.ie</a>
              </p>
              <p style={P}>We encourage you to contact us first at <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a> — we will do our best to resolve your concern quickly and fairly.</p>
            </Section>

            <Section title="15. Contact Us">
              <p style={P}>
                For any privacy-related queries, please contact us at{' '}
                <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>.
                {' '}For GDPR rights requests, use the form below.
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
