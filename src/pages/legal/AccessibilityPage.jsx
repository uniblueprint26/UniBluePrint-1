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

export default function AccessibilityPage() {
  return (
    <>
      <Helmet>
        <title>Accessibility | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Accessibility Statement — our commitment to making the platform accessible to all users." />
        <meta property="og:title" content="Accessibility | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Accessibility Statement — our commitment to making the platform accessible to all users." />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Accessibility Statement
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
            <Section title="Our Commitment">
              <p style={P}>UniBlueprint is committed to ensuring that our platform is accessible to all users, including those with disabilities. We believe that every young person should be able to access the tools and services that help them succeed, regardless of how they interact with technology.</p>
              <p style={P}>We are actively working to improve the accessibility of the UniBlueprint platform and to ensure that it meets recognised accessibility standards ahead of and beyond our September 2026 launch.</p>
            </Section>

            <Section title="Standards We Aim to Meet">
              <p style={P}>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including visual, auditory, physical, speech, cognitive, language, learning, and neurological disabilities.</p>
              <p style={P}>WCAG 2.1 AA requires that web content is Perceivable, Operable, Understandable, and Robust (the POUR principles). Our accessibility work is guided by these four principles across the website, the mobile app, and all platform features.</p>
              <p style={P}>We use automated accessibility testing tools as part of our development process and conduct periodic manual audits using screen readers and keyboard-only navigation on both desktop and mobile.</p>
            </Section>

            <Section title="Known Issues">
              <p style={P}>We are aware of the following accessibility areas that we are actively working to improve ahead of launch:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '6px' }}>Some interactive accordion components may not announce state changes to all screen readers. We are reviewing ARIA live region implementation.</li>
                <li style={{ marginBottom: '6px' }}>Certain form inputs may not surface inline error messages to assistive technologies in all browsers. We are implementing ARIA describedby associations throughout the checkout and submission flows.</li>
                <li style={{ marginBottom: '6px' }}>A small number of decorative SVG map elements may produce redundant announcements on some screen reader and browser combinations. We are auditing aria-hidden coverage.</li>
              </ul>
              <p style={P}>We are targeting full resolution of these items before or shortly after our September 2026 launch. If you encounter an issue not listed here, please let us know using the contact details below.</p>
            </Section>

            <Section title="How to Request Accessible Content">
              <p style={P}>
                If you need content in an accessible format, for example a service output in plain text or a screen-reader-friendly layout, please contact us at{' '}
                <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>
                {' '}with a description of what you need and your preferred format. We will do our best to provide an accessible version within 5 business days.
              </p>
            </Section>

            <Section title="Contact for Accessibility Issues">
              <p style={P}>If you experience an accessibility barrier on the UniBlueprint platform, or have feedback on how we can improve, please contact us:</p>
              <p style={P}>
                Email:{' '}
                <a href="mailto:uniblueprintoperations@gmail.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprintoperations@gmail.com</a>
              </p>
              <p style={P}>
                Contact form:{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>uniblueprint.ie/contact</Link>
              </p>
              <p style={P}>We aim to acknowledge accessibility feedback within 2 business days and to provide a resolution or a practical workaround within 10 business days. If you are not satisfied with our response, you may contact the relevant national accessibility enforcement body in your jurisdiction.</p>
            </Section>
          </div>
        </div>
      </section>
    </>
  )
}
