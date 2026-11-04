import { NAVY, GREY, BORDER, FONT_SERIF, FONT_SANS } from './theme'
import { StudioCard, SectionTitle } from './StudioPrimitives'
import { GENERAL_FAQS, getFaqPool } from './faqs'

// <summary> defaults to a browser disclosure triangle (via ::marker in
// Chrome/Firefox, the separate ::-webkit-details-marker pseudo-element in
// older WebKit) -- inline styles can't target either pseudo-element, so
// this one small global rule replaces the shared StudioShell <style> block
// every other hub primitive already relies on for its own CSS (e.g.
// .studio-table above). Scoped to .faq-summary, not a bare `summary`
// selector, so it can't affect <details> elsewhere in the app.
const FAQ_STYLES = `
  .faq-summary { list-style: none; }
  .faq-summary::-webkit-details-marker { display: none; }
  .faq-summary .faq-marker { transition: transform 150ms; }
  details[open] > .faq-summary .faq-marker { transform: rotate(45deg); }
`

/**
 * Studio "Extras" -- a quick-answers accordion for each hub, shown as the
 * last section on every hub page (same id-in-sections pattern as every
 * other Card here, so it's reachable from the sidebar and Cmd+K search like
 * everything else). Native <details>/<summary> rather than a JS-driven
 * accordion: no open/close state to wire up, keyboard and screen-reader
 * support come for free, and a page with 7+ questions never needs to track
 * which one is open.
 *
 * Shows GENERAL_FAQS (true of every hub -- sidebar/Cmd+K/Quick Add/
 * Requests/dark mode, all wired identically everywhere) first, then the
 * hub's own specific questions from faqs.js. A hub with no specific
 * entries yet still renders the general pool, never an empty section.
 */
export default function FaqSection({ id, hubKey, accentColor = NAVY }) {
  const items = [...GENERAL_FAQS, ...getFaqPool(hubKey)]

  return (
    <StudioCard id={id} style={{ marginTop: 'var(--studio-gap)' }}>
      <style>{FAQ_STYLES}</style>
      <SectionTitle
        eyebrow="Help"
        title="FAQ"
        caption="Quick answers for this hub. Still stuck? Use Requests below to ask another hub, or flag it to your lead."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <details
            key={i}
            style={{
              border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '2px 16px',
              background: 'var(--studio-surface-tint)',
            }}
          >
            <summary
              className="faq-summary"
              style={{
                fontFamily: FONT_SANS, fontSize: '13.5px', fontWeight: 700, color: NAVY,
                padding: '12px 0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}
            >
              <span>{item.q}</span>
              <span aria-hidden="true" className="faq-marker" style={{ color: accentColor, fontFamily: FONT_SERIF, fontSize: '18px', flexShrink: 0, display: 'inline-block' }}>
                +
              </span>
            </summary>
            <p style={{
              fontFamily: FONT_SANS, fontSize: '13px', color: GREY, lineHeight: 1.6,
              margin: '0 0 14px', overflowWrap: 'anywhere',
            }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </StudioCard>
  )
}
