import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { GdprForm } from './PrivacyPage'

// Public account deletion page. Google Play asks for a web link that explains
// how to delete an account and its data, for people who may have uninstalled
// the app. Enter https://uniblueprint.ie/delete-account in Play Console.
// Keep the retention wording in step with the Privacy Policy, section 7.

const H  = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '12px' }
const P  = { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, marginBottom: '12px' }
const LI = { marginBottom: '8px' }
const STRONG = { color: '#1E3A5F' }

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={H}>{title}</h2>
      {children}
    </div>
  )
}

export default function DeleteAccountPage() {
  return (
    <>
      <Helmet>
        <title>Delete your account | UniBlueprint</title>
        <meta name="description" content="How to delete your UniBlueprint account and the data attached to it, from the app or by request." />
        <link rel="canonical" href="https://uniblueprint.ie/delete-account" />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Delete your UniBlueprint account
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
          For the UniBlueprint app on iPhone and Android, and the website
        </p>
      </section>

      <section style={{ background: '#F5F0E8', padding: '64px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '48px 40px',
          }}>

            <Section title="Delete it yourself in the app">
              <p style={P}>This is the fastest way. It deletes your account straight away.</p>
              <ol style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>Open the UniBlueprint app and sign in.</li>
                <li style={LI}>Go to <strong style={STRONG}>Profile</strong>, then <strong style={STRONG}>Privacy and Data</strong>.</li>
                <li style={LI}>Tap <strong style={STRONG}>Delete</strong> under Delete your account, then confirm.</li>
              </ol>
              <p style={P}>You can also sign in on this website and use the delete button in the Your data section of the <Link to="/privacy" style={{ color: '#1E3A5F', fontWeight: '500' }}>Privacy Policy</Link> page.</p>
            </Section>

            <Section title="Cannot sign in, or removed the app?">
              <p style={P}>Send us a request below. Use the email address on your account. We may ask you to confirm it is you. We will delete your account within 30 days. You can also email <a href="mailto:support@uniblueprint.ie" style={{ color: '#1E3A5F', fontWeight: '500' }}>support@uniblueprint.ie</a>.</p>
              <GdprForm defaultRequestType="deletion" />
            </Section>

            <Section title="What is deleted">
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>Your profile, name, date of birth, interests and settings.</li>
                <li style={LI}>Your posts, comments, messages, listings, photos and clips.</li>
                <li style={LI}>Your budget goals, saved items, notification settings and push token.</li>
                <li style={LI}>Your sign in details. Any active paid subscription is cancelled first.</li>
              </ul>
            </Section>

            <Section title="What we keep, and for how long">
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={STRONG}>Payment records:</strong> kept for 7 years because Irish tax and accounting law requires it. They are held by us and Stripe, not linked to a profile.</li>
                <li style={LI}><strong style={STRONG}>A short deletion record:</strong> a note that your account was deleted and when, so we can show we dealt with your request.</li>
                <li style={LI}><strong style={STRONG}>Backups:</strong> removed from our backups within 30 days.</li>
              </ul>
              <p style={P}>Full details are in the <Link to="/privacy" style={{ color: '#1E3A5F', fontWeight: '500' }}>Privacy Policy</Link>.</p>
            </Section>

          </div>
        </div>
      </section>
    </>
  )
}
