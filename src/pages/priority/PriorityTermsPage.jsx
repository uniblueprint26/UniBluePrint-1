import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PriorityShell from '../../components/priority/PriorityShell'
import { PC, CHROME_TEXT, FONT_SERIF, FONT_SANS } from '../../lib/priority'
import { SUPPORT_EMAIL } from '../../lib/site'
import { PRIORITY_TERMS, PRIORITY_TERMS_INTRO } from '../../data/priorityTerms'

export default function PriorityTermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of sale for Priority tickets | UniBlueprint</title>
        <meta name="description" content="The terms for buying Priority event tickets on UniBlueprint: 18 plus, no booking fee, refunds only if an event is cancelled." />
      </Helmet>

      <PriorityShell maxWidth={760}>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', color: PC.silver, margin: 0 }}>PRIORITY</p>
        <h1 style={{ ...CHROME_TEXT, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: 1.1, margin: '10px 0 0' }}>
          Terms of sale
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: '16px', lineHeight: 1.7, color: PC.muted, margin: '16px 0 0' }}>
          {PRIORITY_TERMS_INTRO}
        </p>

        <div style={{ marginTop: '36px', display: 'grid', gap: '28px' }}>
          {PRIORITY_TERMS.map(item => (
            <div key={item.title}>
              <h2 style={{ fontFamily: FONT_SERIF, fontSize: '22px', fontWeight: 700, margin: 0 }}>{item.title}</h2>
              <p style={{ fontFamily: FONT_SANS, fontSize: '15px', lineHeight: 1.7, color: PC.muted, margin: '8px 0 0' }}>{item.text}</p>
            </div>
          ))}
          <div>
            <h2 style={{ fontFamily: FONT_SERIF, fontSize: '22px', fontWeight: 700, margin: 0 }}>Who to contact</h2>
            <p style={{ fontFamily: FONT_SANS, fontSize: '15px', lineHeight: 1.7, color: PC.muted, margin: '8px 0 0' }}>
              Questions about a ticket or an order? Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: PC.silver }}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </div>

        <p style={{ fontFamily: FONT_SANS, fontSize: '14px', lineHeight: 1.7, color: PC.faint, margin: '40px 0 0' }}>
          Our general <Link to="/terms" style={{ color: PC.silver }}>Terms of Service</Link> also apply.{' '}
          <Link to="/priority" style={{ color: PC.silver }}>Back to Priority</Link>
        </p>
      </PriorityShell>
    </>
  )
}
