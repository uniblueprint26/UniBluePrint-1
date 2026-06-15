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

export default function RefundPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Refund Policy | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Refund Policy — how refunds work for Pro subscriptions and Blueprint services." />
        <meta property="og:title" content="Refund Policy | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Refund Policy — how refunds work for Pro subscriptions and Blueprint services." />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Refund Policy
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
            <Section title="1. Pro Subscription">
              <p style={P}>TODO: Pro subscriptions may be cancelled at any time. Cancellation takes effect at the end of the current billing period — access continues until then. We do not offer prorated refunds for partial billing periods.</p>
              <p style={P}>TODO: If you believe you were charged incorrectly, contact us within 7 days of the charge at hello@uniblueprint.com with your order details. We will investigate and issue a refund if the charge was made in error.</p>
            </Section>

            <Section title="2. Foundation Blueprint Services">
              <p style={P}>TODO: If a Foundation Blueprint output does not meet the quality standard described in our service terms — for example, it is substantially incomplete or clearly fails to address your submission — you may raise a quality issue within 48 hours of delivery.</p>
              <p style={P}>TODO: Where a quality issue is upheld, we will first offer a revision. If the revised output still does not meet standard, a full refund of the service fee will be issued. Refunds are not available for services where you have already used the output or where the request does not qualify under our quality standard.</p>
            </Section>

            <Section title="3. Elevation Blueprint Services">
              <p style={P}>TODO: For session-based services, cancellations must be made at least 24 hours before the scheduled session to receive a full refund. Cancellations within 24 hours will receive a 50% refund. No-shows are non-refundable.</p>
              <p style={P}>TODO: For deliverable-based Elevation services, the same quality standard applies as Foundation Blueprint. If the output does not meet standard, raise a quality issue within 48 hours and we will offer a revision or refund.</p>
            </Section>

            <Section title="4. Non-Refundable Items">
              <p style={P}>TODO: The following are non-refundable: Pro subscription periods that have already been used; service fees where the output has been delivered and accepted; service fees for sessions that have taken place; any fees for services where a revision has already been delivered.</p>
            </Section>

            <Section title="5. How to Request a Refund">
              <p style={P}>
                TODO: To request a refund, contact us at{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                {' '}with your full name, account email, the service or charge in question, and the reason for your request. Alternatively, use the{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>Contact page</Link>.
              </p>
            </Section>

            <Section title="6. Processing Time">
              <p style={P}>TODO: Refund requests are reviewed within 5 business days. If approved, refunds are processed via the original payment method through Stripe. Depending on your bank, refunds may take 5–10 business days to appear on your statement.</p>
            </Section>

            <Section title="7. Contact Us">
              <p style={P}>
                TODO: For any refund-related queries, email{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                . Our team responds within 2 business days.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </>
  )
}
