import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const H = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '12px' }
const P = { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, marginBottom: '12px' }
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

function CookieTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>Cookie</th>
            <th style={TH}>Purpose</th>
            <th style={TH}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, purpose, duration]) => (
            <tr key={name}>
              <td style={TD}><code style={{ background: '#F5F0E8', padding: '2px 5px', borderRadius: '4px' }}>{name}</code></td>
              <td style={TD}>{purpose}</td>
              <td style={TD}>{duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | Uniblueprint</title>
        <meta name="description" content="Uniblueprint Cookie Policy — how we use cookies and how you can manage your preferences." />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Cookie Policy
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
            <Section title="1. What Are Cookies">
              <p style={P}>TODO: Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work, to improve efficiency, and to provide information to website operators. Cookies do not damage your device or files.</p>
            </Section>

            <Section title="2. Essential Cookies">
              <p style={P}>TODO: Essential cookies are strictly necessary for the platform to function. They enable core features such as account authentication, session management, and security. <strong>You cannot opt out of essential cookies</strong> — these are set automatically and the platform cannot function without them.</p>
              <CookieTable rows={[
                ['sb-auth-token', 'Supabase authentication session (Essential — cannot be rejected)', 'Session'],
                ['ubp_cookie_consent', 'Stores your cookie consent preference (Essential — cannot be rejected)', '1 year'],
              ]} />
            </Section>

            <Section title="3. Functional Cookies">
              <p style={P}>TODO: Functional cookies remember choices you make on the platform to improve your experience — such as your session state, UI preferences, and in-app settings. These cookies are set when you use interactive features of the platform.</p>
              <p style={P}>You may opt out of functional cookies by choosing "Reject All" when the consent banner appears; however, some features (such as staying signed in) may not work correctly without them.</p>
              <CookieTable rows={[
                ['ubp_utm', 'Remembers UTM campaign parameters for your session (session storage only — not persisted)', 'Session'],
              ]} />
            </Section>

            <Section title="4. Analytics Cookies">
              <p style={P}>TODO: We use Google Analytics to understand how visitors use the platform — which pages are most visited, how long people stay, and where they navigate from. Analytics cookies are only set if you choose "Accept All" when the cookie banner appears.</p>
              <CookieTable rows={[
                ['_ga', 'Google Analytics — distinguishes users', '2 years'],
                ['_ga_*', 'Google Analytics — maintains session state', '2 years'],
              ]} />
            </Section>

            <Section title="5. Marketing Cookies">
              <p style={P}>TODO: We do not currently use marketing or targeting cookies. If this changes, this policy will be updated and your consent will be requested before any marketing cookies are set.</p>
            </Section>

            <Section title="6. Managing Your Preferences">
              <p style={P}>
                TODO: When you first visit Uniblueprint, a cookie consent banner will appear at the bottom of the screen. You may choose "Accept All", "Manage Preferences", or "Reject All". You can change your preference at any time by clearing the{' '}
                <code style={{ background: '#F5F0E8', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>ubp_cookie_consent</code>
                {' '}key from your browser's local storage and refreshing the page.
              </p>
              <p style={P}>You may also disable cookies entirely through your browser settings. Note that disabling essential cookies will prevent you from signing in to Uniblueprint.</p>
            </Section>

            <Section title="7. Third-Party Cookies">
              <p style={P}>TODO: Some cookies on Uniblueprint are set by third-party services — specifically Supabase (authentication) and Google Analytics (analytics, if accepted). These providers operate under their own cookie policies. We do not control third-party cookies beyond the access controls we configure.</p>
            </Section>

            <Section title="8. Contact Us">
              <p style={P}>
                TODO: If you have any questions about our use of cookies, contact us at{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                {' '}or visit our{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>Contact page</Link>.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </>
  )
}
