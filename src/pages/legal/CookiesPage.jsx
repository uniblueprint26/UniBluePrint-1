import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

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
        <title>Cookie Policy | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Cookie Policy — how we use cookies and how you can manage your preferences." />
        <meta property="og:title" content="Cookie Policy | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Cookie Policy — how we use cookies and how you can manage your preferences." />
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
              <p style={P}>Cookies are small text files placed on your device when you visit a website or use a web application. They are widely used to make websites work, to improve efficiency, and to provide information to website operators. Cookies do not damage your device or files.</p>
              <p style={P}>This Cookie Policy is issued in compliance with the EU ePrivacy Directive (2002/58/EC as amended by 2009/136/EC), implemented in Ireland as the European Communities (Electronic Communications Networks and Services) (Privacy and Electronic Communications) Regulations 2011 (S.I. No. 336/2011), and in line with the EU General Data Protection Regulation (GDPR) 2016/679.</p>
            </Section>

            <Section title="2. Strictly Necessary Cookies">
              <p style={P}>Strictly necessary cookies are essential for the Platform to function. They enable core features such as account authentication, session management, and security controls. <strong>You cannot opt out of strictly necessary cookies</strong> — they are set automatically and the Platform cannot function without them. No consent is required for these cookies under S.I. No. 336/2011.</p>
              <CookieTable rows={[
                ['sb-auth-token', 'Supabase authentication session (strictly necessary — cannot be rejected)', 'Session'],
                ['ubp_cookie_consent', 'Stores your cookie consent preference (strictly necessary — cannot be rejected)', '1 year'],
              ]} />
            </Section>

            <Section title="3. Functional Cookies">
              <p style={P}>Functional cookies remember choices you make on the Platform to improve your experience, such as your session state, UI preferences, and in-app settings. These cookies are set when you use interactive features of the Platform.</p>
              <p style={P}>You may opt out of functional cookies by choosing "Reject All" when the consent banner appears. Some features, such as staying signed in across sessions, may not work correctly without them.</p>
              <CookieTable rows={[
                ['ubp_utm', 'Remembers UTM campaign parameters for your session (session storage only — not persisted to disk)', 'Session'],
              ]} />
            </Section>

            <Section title="4. Analytics Cookies">
              <p style={P}>We use Google Analytics 4 to understand how visitors use the Platform — which pages are most visited, how long people stay, and where they navigate from. Analytics cookies are only set if you choose "Accept All" when the cookie banner appears. If you choose "Reject All" or do not accept analytics cookies, these cookies are not set and no analytical data is collected about your visit.</p>
              <CookieTable rows={[
                ['_ga',    'Google Analytics 4 — distinguishes unique users by assigning a random ID', '2 years'],
                ['_ga_*',  'Google Analytics 4 — maintains session state for the measurement ID',      '2 years'],
              ]} />
              <p style={{ ...P, marginTop: '12px' }}>
                You may also opt out of Google Analytics across all websites using the{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>Google Analytics Opt-out Browser Add-on</a>.
              </p>
            </Section>

            <Section title="5. Third-Party Cookies">
              <p style={P}>Stripe, our payment processor, may set cookies when you proceed through a payment flow. These are essential to the payment process and are set and controlled by Stripe under their own cookie policy.</p>
              <CookieTable rows={[
                ['stripe_mid', 'Stripe — fraud detection and payment flow integrity', '1 year'],
                ['stripe_sid', 'Stripe — payment session identification',             'Session'],
              ]} />
              <p style={{ ...P, marginTop: '12px' }}>UniBlueprint does not control Stripe's cookies. For details, see the <a href="https://stripe.com/en-ie/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>Stripe Privacy Policy</a>.</p>
            </Section>

            <Section title="6. Marketing Cookies">
              <p style={P}>We do not currently use marketing or targeting cookies on UniBlueprint. If this changes, this policy will be updated and your explicit consent will be requested before any marketing cookies are set.</p>
            </Section>

            <Section title="7. Managing Your Cookie Preferences">
              <p style={P}>
                When you first visit UniBlueprint, a cookie consent banner appears at the bottom of the screen. You may choose "Accept All", "Manage Preferences", or "Reject All". You can change your preference at any time by clearing the{' '}
                <code style={{ background: '#F5F0E8', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>ubp_cookie_consent</code>
                {' '}key from your browser's local storage and refreshing the page.
              </p>
              <p style={P}>You may also control cookies through your browser settings. Instructions for the most common browsers:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Chrome:</strong> Settings, then Privacy and security, then Cookies and other site data.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Firefox:</strong> Settings, then Privacy and Security, then Cookies and Site Data.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Safari:</strong> Preferences, then Privacy, then Manage Website Data.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Edge:</strong> Settings, then Cookies and site permissions, then Manage and delete cookies and site data.</li>
              </ul>
              <p style={P}>Note that disabling strictly necessary cookies will prevent you from signing in to UniBlueprint.</p>
            </Section>

            <Section title="8. Cookies in the UniBlueprint Mobile App">
              <p style={P}>The UniBlueprint mobile application does not use traditional browser cookies. Instead, it uses the following technologies to provide equivalent functionality:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Local storage and secure storage:</strong> used to store your authentication token and user preferences on your device. This data remains on your device and is not a cookie.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Advertising identifiers:</strong> we do not use mobile advertising identifiers (IDFA on iOS or GAID on Android) for tracking or targeting.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Firebase Analytics:</strong> we use Firebase Analytics for in-app usage analytics, subject to the same consent basis as Google Analytics on the web.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Push notification tokens:</strong> if you grant permission, a push token is stored to deliver in-app notifications. You may revoke notification permission at any time via your device settings.</li>
              </ul>
              <p style={P}>To limit app tracking on your device:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>iOS:</strong> Settings, then Privacy and Security, then Tracking, then toggle off "Allow Apps to Request to Track".</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Android:</strong> Settings, then Privacy, then Ads, then opt out of Ads Personalisation.</li>
              </ul>
            </Section>

            <Section title="9. Contact Us">
              <p style={P}>
                If you have any questions about our use of cookies, contact us at{' '}
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
