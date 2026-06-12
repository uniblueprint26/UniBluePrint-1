import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

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

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Uniblueprint</title>
        <meta name="description" content="Uniblueprint Terms of Service — the rules and conditions governing your use of the Uniblueprint platform." />
        <meta property="og:title" content="Terms of Service | Uniblueprint" />
        <meta property="og:description" content="Uniblueprint Terms of Service — the rules and conditions governing your use of the Uniblueprint platform." />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Terms of Service
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
            <Section title="1. Introduction">
              <p style={P}>TODO: These Terms of Service govern your use of the Uniblueprint platform, website, and services. By creating an account or using any Uniblueprint service, you agree to be bound by these terms. Please read them carefully.</p>
            </Section>

            <Section title="2. Eligibility">
              <p style={P}>TODO: You must be at least 18 years old, or the age of majority in your jurisdiction, to use Uniblueprint. By using the platform, you confirm that you meet this requirement. Uniblueprint is designed for students and recent graduates enrolled in or having completed third-level education in Ireland.</p>
            </Section>

            <Section title="3. Account Registration">
              <p style={P}>TODO: To access most Uniblueprint features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate, current, and complete information during registration and keep it updated.</p>
            </Section>

            <Section title="4. Services and Pricing">
              <p style={P}>TODO: Uniblueprint offers free and paid services. Free services include Campus Connect, Course Connect, and Mental Health resources. Paid services include Foundation Blueprint and Elevation Blueprint, which require a Pro subscription. All prices are displayed in Euro (€) inclusive of VAT where applicable.</p>
            </Section>

            <Section title="5. Pro Subscription">
              <p style={P}>TODO: A Pro subscription unlocks access to purchase Foundation Blueprint and Elevation Blueprint services. Pro is charged monthly or annually. You may cancel at any time; access continues until the end of the current billing period. Trial pricing applies during September 2026 only.</p>
            </Section>

            <Section title="6. Foundation Blueprint Service Terms">
              <p style={P}>TODO: Foundation Blueprint services are delivered by trained Campus Handlers. Standard delivery is within 48 hours; Premium is same-day subject to availability. One revision is included with Standard; two with Premium. Requests must be submitted with sufficient information for the Handler to deliver the service. Revision requests must be submitted within 48 hours of delivery.</p>
            </Section>

            <Section title="7. Elevation Blueprint Service Terms">
              <p style={P}>TODO: Elevation Blueprint services are delivered by vetted Uni Coaches. Standard includes one session or deliverable with one revision. Premium includes a follow-up review, priority Coach assignment, and two revisions. Session scheduling is subject to Coach availability. Rescheduling must be requested at least 24 hours in advance.</p>
            </Section>

            <Section title="8. Campus Connect and Course Connect">
              <p style={P}>TODO: Campus Connect and Course Connect are community features provided free of charge. You are solely responsible for content you post. Content that violates our Community Standards may be removed without notice. Repeated violations may result in account suspension or termination.</p>
            </Section>

            <Section title="9. User Content">
              <p style={P}>TODO: By submitting content to Uniblueprint — including posts, notes, messages, or application materials — you grant Uniblueprint a non-exclusive, royalty-free licence to use, store, and display that content as necessary to provide the service. You retain ownership of your content.</p>
            </Section>

            <Section title="10. Prohibited Conduct">
              <p style={P}>TODO: You may not use Uniblueprint to: impersonate any person or entity; post illegal, harmful, or offensive content; scrape or harvest data; circumvent security measures; submit fraudulent service requests; or use the platform in any way that violates applicable Irish or EU law.</p>
            </Section>

            <Section title="11. Intellectual Property">
              <p style={P}>TODO: All intellectual property on the Uniblueprint platform — including the brand, design, software, and content created by Uniblueprint or its handlers and coaches — is owned by Uniblueprint Ltd or its licensors. Nothing in these terms grants you any rights to use Uniblueprint's intellectual property without express written permission.</p>
            </Section>

            <Section title="12. Disclaimer of Warranties">
              <p style={P}>TODO: Uniblueprint is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, Uniblueprint disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
            </Section>

            <Section title="13. Limitation of Liability">
              <p style={P}>TODO: To the fullest extent permitted by applicable law, Uniblueprint Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability in any matter shall not exceed the total amount paid by you to Uniblueprint in the 12 months preceding the claim.</p>
            </Section>

            <Section title="14. Termination">
              <p style={P}>TODO: Uniblueprint reserves the right to suspend or terminate your account at any time for breach of these terms, fraudulent activity, or any other reason at our sole discretion. You may delete your account at any time via account settings. On termination, your right to use the platform ceases immediately.</p>
            </Section>

            <Section title="15. Governing Law">
              <p style={P}>TODO: These terms are governed by and construed in accordance with the laws of Ireland. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the Irish courts.</p>
            </Section>

            <Section title="16. Changes to These Terms">
              <p style={P}>TODO: We may update these Terms of Service from time to time. We will notify you of significant changes by email or in-app notification. Continued use of Uniblueprint after changes take effect constitutes acceptance of the revised terms.</p>
            </Section>

            <Section title="17. Contact Us">
              <p style={P}>
                TODO: If you have any questions about these terms, please contact us at{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                {' '}or via the{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>Contact page</Link>.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </>
  )
}
