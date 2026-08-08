import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const H  = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '12px' }
const H3 = { fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginBottom: '8px', marginTop: '20px' }
const P  = { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, marginBottom: '12px' }
const LI = { marginBottom: '6px' }

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
        <meta name="description" content="UniBlueprint Refund Policy — how refunds and cancellations work for Pro subscriptions and Blueprint services." />
        <meta property="og:title" content="Refund Policy | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Refund Policy — how refunds and cancellations work for Pro subscriptions and Blueprint services." />
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

            <Section title="1. Introduction">
              <p style={P}>This Refund Policy sets out the terms on which UniBlueprint Ltd ("UniBlueprint", "we", "us") handles refunds, cancellations, and cooling-off rights for Pro subscriptions, Foundation Blueprint services, and Elevation Blueprint services.</p>
              <p style={P}>This policy is issued in compliance with the Consumer Rights Act 2022 (Ireland) and the EU Consumer Rights Directive 2011/83/EU. It does not affect any statutory rights you have under Irish or EU consumer law.</p>
            </Section>

            <Section title="2. Your Right to Cancel (14-Day Cooling-Off Period)">
              <p style={P}>Under the Consumer Rights Act 2022, you have the right to cancel a Pro subscription within 14 days of purchase without giving any reason (the "cooling-off period"). To exercise this right, contact us at <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a> before the 14-day period expires. If you cancel within this window, we will issue a full refund within 14 days via the original payment method.</p>
              <p style={P}><strong style={{ color: '#1E3A5F' }}>Important:</strong> where you have used a Foundation Blueprint or Elevation Blueprint service during the cooling-off period, you expressly request and acknowledge that we begin performing the service immediately. In that case, you may be charged pro-rata for services already delivered, in accordance with Article 16(m) of the Consumer Rights Directive. This acknowledgement is collected during the checkout flow.</p>
            </Section>

            <Section title="3. September 2026 Trial">
              <p style={P}>Where you sign up for a September 2026 trial period, the following terms apply in addition to (and, where they conflict, in place of) the standard subscription terms:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>You will receive a reminder notification at least 3 days before your trial converts to a paid subscription.</li>
                <li style={LI}>To avoid being charged, you must cancel before the trial end date via Account Settings, then Subscription, then Cancel Trial.</li>
                <li style={LI}>If you cancel during the trial period, your access continues until the trial end date and no charge is made.</li>
                <li style={LI}>If your trial converts and you are charged, you may cancel within 14 days of the charge for a full refund under Section 2 above, provided you have not used paid services during that period.</li>
              </ul>
            </Section>

            <Section title="4. Pro Subscription Cancellation">
              <p style={P}>Pro subscriptions may be cancelled at any time via Account Settings. Cancellation takes effect at the end of the current billing period, and access to Pro features continues until that date.</p>
              <p style={P}>We do not issue prorated refunds for the unused portion of a billing period on cancellation, except as required by law or as set out in Section 6 (Exceptional Refund Circumstances) below.</p>
              <p style={P}>If you believe you were charged incorrectly, contact us within 7 days of the charge at <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a> with your account email and details of the charge.</p>
            </Section>

            <Section title="5. Foundation Blueprint Services">
              <p style={P}>If a Foundation Blueprint output does not meet the quality standard described in our Terms of Service — for example, it is substantially incomplete or clearly fails to address your submission — you may raise a quality issue within 48 hours of delivery.</p>
              <p style={P}>Where a quality issue is upheld, we will first offer a revision. If the revised output still does not meet standard, a full refund of the service fee will be issued. Refunds are not available where you have already used the output or where the submission did not provide sufficient information for the Handler to deliver the service.</p>
            </Section>

            <Section title="6. Elevation Blueprint Services">
              <p style={P}><strong style={{ color: '#1E3A5F' }}>Session-based services:</strong> cancellations must be made at least 24 hours before the scheduled session to receive a full refund. Cancellations within 24 hours of the session will receive a 50% refund. No-shows are non-refundable.</p>
              <p style={P}><strong style={{ color: '#1E3A5F' }}>Deliverable-based services:</strong> the same quality standard and revision process applies as for Foundation Blueprint. Raise a quality issue within 48 hours of delivery and we will offer a revision or refund.</p>
            </Section>

            <Section title="7. Exceptional Refund Circumstances">
              <p style={P}>Outside the cooling-off period and normal service quality process, UniBlueprint may issue a pro-rated or full refund in the following exceptional circumstances:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Technical error:</strong> a billing error caused by a fault in our payment processing system.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Sustained outage:</strong> the Platform is unavailable for more than 72 consecutive hours due to a fault on our side during your active billing period.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>No content within 48 hours:</strong> a Foundation Blueprint or Elevation Blueprint service is accepted but no output or communication is provided by the assigned Handler or Coach within 48 hours.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Service discontinued:</strong> UniBlueprint discontinues a paid service you have purchased and cannot fulfil it.</li>
              </ul>
              <p style={P}>Exceptional refund decisions are made at UniBlueprint's sole discretion. To request consideration, contact us at <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a> with full details.</p>
            </Section>

            <Section title="8. Non-Refundable Items">
              <p style={P}>The following are not eligible for refund:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>Pro subscription billing periods that have already been used (unless an exceptional circumstance under Section 7 applies);</li>
                <li style={LI}>Service fees where the output has been delivered, accepted, and used;</li>
                <li style={LI}>Session fees for sessions that have taken place;</li>
                <li style={LI}>Service fees where a revision has already been delivered and accepted;</li>
                <li style={LI}>Lifestyle Blueprint partner deals or transactions conducted directly with a partner business.</li>
              </ul>
            </Section>

            <Section title="9. How to Request a Refund">
              <p style={P}>
                To request a refund, contact us at{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                {' '}with: your full name, account email address, the service or charge in question, and the reason for your request. Alternatively, use the{' '}
                <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>Contact page</Link>.
              </p>
              <p style={P}>Refund requests are reviewed within 5 business days. If approved, the refund is processed via the original payment method through Stripe. Depending on your bank, refunds may take 5 to 10 business days to appear on your statement.</p>
            </Section>

            <Section title="10. Chargebacks">
              <p style={P}>If you believe a charge is incorrect, please contact us before initiating a chargeback with your bank or card provider. We will investigate promptly and issue a refund if appropriate. Initiating a chargeback without first contacting UniBlueprint may result in suspension of your Account while the dispute is investigated. If a chargeback is found to be fraudulent or raised without good cause, we reserve the right to recover costs incurred.</p>
            </Section>

            <Section title="11. VAT on Refunds">
              <p style={P}>Where VAT was charged on a payment, it will be included in any refund issued. Where applicable, UniBlueprint will issue a VAT credit note in accordance with Irish Revenue requirements.</p>
            </Section>

            <Section title="12. Your Statutory Rights">
              <p style={P}>This Refund Policy does not affect your statutory rights under the Consumer Rights Act 2022, the Sale of Goods and Supply of Services Act 1980, or any other applicable Irish or EU consumer protection legislation.</p>
              <p style={P}>
                If you are not satisfied with our handling of your refund request, you may contact:
              </p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>
                  <strong style={{ color: '#1E3A5F' }}>Competition and Consumer Protection Commission (CCPC):</strong>{' '}
                  <a href="https://www.ccpc.ie" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>ccpc.ie</a>
                </li>
                <li style={LI}>
                  <strong style={{ color: '#1E3A5F' }}>EU Online Dispute Resolution (ODR) platform:</strong>{' '}
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>ec.europa.eu/consumers/odr</a>
                </li>
                <li style={LI}>
                  <strong style={{ color: '#1E3A5F' }}>Small Claims Court:</strong> for claims up to €2,000 via the Small Claims procedure in Ireland (Courts Service, <a href="https://www.courts.ie" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>courts.ie</a>).
                </li>
              </ul>
            </Section>

            <Section title="13. Contact Us">
              <p style={P}>
                For any refund-related queries, email{' '}
                <a href="mailto:hello@uniblueprint.com" style={{ color: '#1E3A5F', fontWeight: '500' }}>hello@uniblueprint.com</a>
                {' '}or use the <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '500' }}>Contact page</Link>. Our team responds within 2 business days.
              </p>
            </Section>

          </div>
        </div>
      </section>
    </>
  )
}
