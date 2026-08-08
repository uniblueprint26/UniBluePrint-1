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

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Terms of Service — the rules and conditions governing your use of the UniBlueprint platform." />
        <meta property="og:title" content="Terms of Service | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Terms of Service — the rules and conditions governing your use of the UniBlueprint platform." />
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

            <Section title="1. Introduction and Acceptance">
              <p style={P}>These Terms of Service ("Terms") govern your access to and use of the UniBlueprint platform, including the website, mobile application, and all associated services (collectively, the "Platform"). UniBlueprint is operated by UniBlueprint Ltd, a company registered in Ireland.</p>
              <p style={P}>By creating an account, accessing the Platform, or using any UniBlueprint service, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use UniBlueprint. These Terms form a legally binding agreement between you and UniBlueprint Ltd.</p>
              <p style={P}>
                These Terms should be read alongside our{' '}
                <Link to="/privacy" style={{ color: '#1E3A5F', fontWeight: '500' }}>Privacy Policy</Link>,{' '}
                <Link to="/cookies" style={{ color: '#1E3A5F', fontWeight: '500' }}>Cookie Policy</Link>, and{' '}
                <Link to="/refund-policy" style={{ color: '#1E3A5F', fontWeight: '500' }}>Refund Policy</Link>,
                {' '}all of which form part of your agreement with us.
              </p>
            </Section>

            <Section title="2. Definitions">
              <p style={P}>In these Terms, the following definitions apply:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Account</strong> means the registered profile you create to access UniBlueprint services.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Campus Ambassador</strong> means a member who promotes UniBlueprint at their institution.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Campus Handler</strong> means a vetted university or college member who reviews and delivers Foundation Blueprint submissions.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Elevation Blueprint</strong> means the career coaching and professional development service delivered by Uni Coaches.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Foundation Blueprint</strong> means the document review and feedback service delivered by Campus Handlers.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Lifestyle Blueprint</strong> means the member benefits and partner deals feature of the Platform.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Pro Subscription</strong> means the paid tier of UniBlueprint membership that unlocks access to premium services.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>Uni Coach</strong> means a vetted professional who delivers Elevation Blueprint sessions.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>User Content</strong> means any content you submit, post, or transmit through the Platform.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>We / Us / Our</strong> means UniBlueprint Ltd.</li>
                <li style={LI}><strong style={{ color: '#1E3A5F' }}>You / Your</strong> means the individual accessing or using the Platform.</li>
              </ul>
            </Section>

            <Section title="3. Eligibility">
              <p style={P}>To use UniBlueprint, you must be at least 18 years of age. By creating an Account, you confirm that you meet this requirement.</p>
              <p style={P}>UniBlueprint is designed for young people in Ireland who are currently enrolled in, or who have graduated from, a third-level institution, further education programme, or apprenticeship within the previous two years. However, eligibility is not restricted solely to this group and all services are available to any eligible user who accepts these Terms.</p>
              <p style={P}>If you are registering on behalf of an organisation or institution, you represent that you have the authority to bind that organisation to these Terms.</p>
            </Section>

            <Section title="4. Account Registration">
              <p style={P}>To access most UniBlueprint features, you must register for an Account. During registration, you must provide accurate, current, and complete information. You agree to keep your account information up to date at all times.</p>
              <p style={P}>You are responsible for maintaining the security and confidentiality of your account credentials, including your password. You must not share your credentials with any other person. You are solely liable for all activity that occurs under your Account.</p>
              <p style={P}>
                If you become aware of any unauthorised use of your Account, you must notify us immediately at{' '}
                <a href="mailto:support@uniblueprint.ie" style={{ color: '#1E3A5F', fontWeight: '500' }}>support@uniblueprint.ie</a>.
                {' '}UniBlueprint will not be liable for any loss arising from unauthorised use of your Account where you have failed to maintain the security of your credentials.
              </p>
            </Section>

            <Section title="5. Subscription Plans and Payments">
              <h3 style={H3}>5.1 Plans</h3>
              <p style={P}>UniBlueprint offers a free tier and a Pro subscription. The free tier includes access to Campus Connect, Course Connect, and certain other features at no charge. The Pro subscription unlocks access to purchase Foundation Blueprint and Elevation Blueprint services, Lifestyle Blueprint partner deals, and other premium features as set out on the Pricing page.</p>

              <h3 style={H3}>5.2 Payments via Stripe</h3>
              <p style={P}>All Pro subscription payments are processed by Stripe, Inc., a third-party payment processor. By subscribing, you authorise UniBlueprint to charge your selected payment method through Stripe for the applicable subscription fee. UniBlueprint does not store your card details directly. Payment is due at the beginning of each billing period. All prices are displayed in Euro (EUR) and are inclusive of VAT where applicable under Irish law.</p>

              <h3 style={H3}>5.3 Auto-Renewal</h3>
              <p style={P}>Your Pro subscription renews automatically at the end of each billing period unless you cancel before the renewal date. You may cancel your subscription at any time via Account Settings. Cancellation takes effect at the end of the current billing period and access continues until that date. No partial-period refunds are issued on cancellation except where required by law or as set out in our Refund Policy.</p>

              <h3 style={H3}>5.4 September 2026 Trial</h3>
              <p style={P}>During September 2026, UniBlueprint may offer a trial pricing period. The specific terms, pricing, and duration of any trial are set out at the time of sign-up and on the Pricing page. Where a trial converts to a paid subscription, you will be notified in advance and given the opportunity to cancel before any charge is made. Full trial terms are set out in our Refund Policy.</p>
            </Section>

            <Section title="6. Foundation Blueprint Service Terms">
              <p style={P}>Foundation Blueprint services are delivered by trained and vetted Campus Handlers. When you submit a request, you must provide all information specified in the submission form. Incomplete or unclear submissions may result in delayed or incomplete delivery, and UniBlueprint will not be liable for any resulting delay.</p>
              <p style={P}>Standard delivery is within 48 hours from acceptance of your submission. Same-day delivery ("Premium") is available subject to Handler availability and is offered at an additional cost. Delivery times are indicative and not guaranteed, though we take them seriously.</p>
              <p style={P}>One revision is included with Standard delivery. Two revisions are included with Premium. Revision requests must be submitted within 48 hours of receiving your output. UniBlueprint reserves the right to decline a revision request that materially changes the scope of the original submission.</p>
            </Section>

            <Section title="7. Elevation Blueprint Service Terms">
              <p style={P}>Elevation Blueprint services are delivered by vetted Uni Coaches. Session scheduling is subject to Coach availability and is confirmed via in-app booking.</p>
              <p style={P}>You may reschedule a session with at least 24 hours' notice without penalty. Rescheduling requests made with less than 24 hours' notice, and no-shows, are subject to the cancellation terms in our Refund Policy.</p>
              <p style={P}>Standard Elevation engagements include one session or deliverable with one revision. Premium engagements include a follow-up review, priority Coach assignment, and two revisions. For deliverable-based services, the same 48-hour revision window applies as for Foundation Blueprint.</p>
            </Section>

            <Section title="8. Community Features">
              <p style={P}>Campus Connect and Course Connect are community features provided free of charge to all UniBlueprint users. These features allow you to post, browse, and engage with content created by other users at your institution or on your course.</p>
              <p style={P}>By using community features, you agree to our Community Standards, which prohibit harassment, hate speech, spam, the posting of false or misleading information, sharing the personal details of others without consent, and any other conduct that is harmful, offensive, or unlawful.</p>
              <p style={P}>UniBlueprint moderates community boards and reserves the right to remove any content that violates our Community Standards at any time, without notice. Repeated violations may result in temporary suspension or permanent termination of your Account.</p>
            </Section>

            <Section title="9. Campus Ambassadors, Handlers, and Coaches">
              <p style={P}>Campus Ambassadors, Campus Handlers, and Uni Coaches operate under separate role agreements with UniBlueprint in addition to these Terms. If you apply for and are accepted into one of these roles, the relevant role agreement will supplement and, where it conflicts, take precedence over these Terms in respect of your role activities.</p>
              <p style={P}>Handlers and Coaches are not employees of UniBlueprint. They provide services as independent contractors. UniBlueprint vets and trains all Handlers and Coaches to maintain quality standards, but does not warrant that any individual output will meet your specific expectations beyond the quality commitment in the Refund Policy.</p>
            </Section>

            <Section title="10. Intellectual Property">
              <p style={P}>All intellectual property on the UniBlueprint Platform, including the brand, name, logo, design, software, and content created by UniBlueprint or on its behalf, is owned by UniBlueprint Ltd or its licensors. All rights are reserved.</p>
              <p style={P}>Nothing in these Terms grants you any right to use UniBlueprint's intellectual property without express written permission. You may not copy, reproduce, distribute, modify, or create derivative works of any part of the Platform without our prior written consent.</p>
              <p style={P}>You retain ownership of your User Content. By submitting User Content to UniBlueprint, you grant UniBlueprint a non-exclusive, royalty-free, worldwide licence to use, store, and display that content as necessary to provide the service and improve the Platform. This licence ends when you delete your content or close your Account, subject to any legal retention obligations.</p>
            </Section>

            <Section title="11. Prohibited Conduct">
              <p style={P}>You must not use UniBlueprint to:</p>
              <ul style={{ ...P, paddingLeft: '20px' }}>
                <li style={LI}>Impersonate any person, entity, or institution;</li>
                <li style={LI}>Post, upload, or transmit illegal, harmful, offensive, defamatory, or fraudulent content;</li>
                <li style={LI}>Scrape, harvest, or otherwise collect data from the Platform without authorisation;</li>
                <li style={LI}>Attempt to gain unauthorised access to any part of the Platform or any user account;</li>
                <li style={LI}>Submit fraudulent service requests or misrepresent your identity or qualifications;</li>
                <li style={LI}>Use the Platform to send spam, unsolicited communications, or advertising;</li>
                <li style={LI}>Upload or distribute viruses, malware, or other harmful code;</li>
                <li style={LI}>Use the Platform in any way that violates applicable Irish, EU, or international law.</li>
              </ul>
              <p style={P}>UniBlueprint reserves the right to investigate suspected violations and to take appropriate action, including account suspension, termination, or referral to relevant authorities.</p>
            </Section>

            <Section title="12. Third-Party Services">
              <p style={P}>UniBlueprint integrates with third-party services including Stripe (payments), Supabase (infrastructure), Google Analytics (analytics), and Resend (email). Your use of these services is subject to their respective terms and privacy policies. UniBlueprint is not responsible for the practices of third-party providers.</p>
              <p style={P}>The Platform may contain links to third-party websites, including partner businesses listed in the Lifestyle Blueprint. UniBlueprint does not endorse and is not responsible for the content, products, or services of any linked third-party website. You access third-party websites at your own risk.</p>
            </Section>

            <Section title="13. Disclaimers and Limitation of Liability">
              <p style={P}>UniBlueprint is provided on an "as is" and "as available" basis. To the fullest extent permitted by applicable law, UniBlueprint Ltd disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
              <p style={P}>UniBlueprint does not guarantee that the Platform will be uninterrupted, error-free, or free from harmful components. We do not warrant that any service output will meet your specific requirements or expectations beyond the quality commitment set out in the Refund Policy.</p>
              <p style={P}>To the fullest extent permitted by applicable law, UniBlueprint Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform. Our total aggregate liability to you in connection with any claim arising out of or relating to these Terms or the Platform shall not exceed the total fees paid by you to UniBlueprint in the 12 months preceding the claim.</p>
              <p style={P}>Nothing in these Terms limits or excludes our liability for death or personal injury caused by our negligence, fraudulent misrepresentation, or any other liability that cannot be excluded or limited under Irish or EU law, including your rights under the Consumer Rights Act 2022.</p>
            </Section>

            <Section title="14. Indemnification">
              <p style={P}>You agree to indemnify, defend, and hold harmless UniBlueprint Ltd and its officers, directors, employees, agents, and partners from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to: your use of the Platform; your breach of these Terms; your User Content; or your violation of any law or the rights of any third party.</p>
            </Section>

            <Section title="15. Termination">
              <p style={P}>You may close your Account at any time via Account Settings. On closure, any active Pro subscription will continue until the end of the current billing period unless you cancel it separately.</p>
              <p style={P}>UniBlueprint reserves the right to suspend or terminate your Account, with or without notice, for breach of these Terms, fraudulent activity, conduct harmful to other users or the Platform, or any other reason at our sole discretion. If your Account is terminated for cause, no refund will be issued for any remaining subscription period.</p>
              <p style={P}>On termination, all rights granted to you under these Terms cease immediately. Provisions that by their nature should survive termination, including Intellectual Property, Prohibited Conduct, Disclaimers, Limitation of Liability, Indemnification, and Governing Law, will continue to apply.</p>
            </Section>

            <Section title="16. Governing Law and Dispute Resolution">
              <p style={P}>These Terms are governed by and construed in accordance with the laws of Ireland. Any dispute arising from these Terms or your use of UniBlueprint shall be subject to the exclusive jurisdiction of the courts of Ireland.</p>
              <p style={P}>
                If you have a consumer complaint, you may also contact the Competition and Consumer Protection Commission (CCPC) at{' '}
                <a href="https://www.ccpc.ie" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>ccpc.ie</a>.
                {' '}EU residents may also access the European Commission's Online Dispute Resolution platform at{' '}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', fontWeight: '500' }}>ec.europa.eu/consumers/odr</a>.
              </p>
            </Section>

            <Section title="17. Changes to These Terms">
              <p style={P}>UniBlueprint may update these Terms from time to time. We will notify you of significant changes by email and in-app notification at least 14 days before the changes take effect. The updated Terms will be published on this page with a revised "Last updated" date.</p>
              <p style={P}>Your continued use of UniBlueprint after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using UniBlueprint and close your Account before the changes take effect.</p>
            </Section>

            <Section title="18. Contact Us">
              <p style={P}>
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:support@uniblueprint.ie" style={{ color: '#1E3A5F', fontWeight: '500' }}>support@uniblueprint.ie</a>
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
