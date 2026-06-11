import { useState, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Check, X as XIcon, ChevronDown, Sparkles,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Campus Connect (all boards)',
  'Course Connect (all boards)',
  'Mental Health & Wellbeing resources',
  'Basic profile and account',
  'View Lifestyle Blueprint deals',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Foundation Blueprint (all services)',
  'Elevation Blueprint (all services)',
  'Lifestyle Blueprint deals access',
  'Priority Handler & Coach assignment',
  'Discount on service bundles',
]

const COMPARISON_SECTIONS = [
  {
    label: 'Foundation Blueprint',
    rows: [
      { feature: 'CV Optimisation',             free: false, pro: true },
      { feature: 'LinkedIn Optimisation',        free: false, pro: true },
      { feature: 'Cover Letter Assistance',      free: false, pro: true },
      { feature: 'Application Form Assistance',  free: false, pro: true },
      { feature: 'Interview Preparation',        free: false, pro: true },
      { feature: 'Job Search Support',           free: false, pro: true },
      { feature: 'CAO Personal Statement',       free: false, pro: true },
      { feature: 'College Interview Prep',       free: false, pro: true },
      { feature: 'Scholarship & Grants',         free: false, pro: true },
      { feature: 'Course Selection Guidance',    free: false, pro: true },
    ],
  },
  {
    label: 'Elevation Blueprint',
    rows: [
      { feature: 'Personal Branding Support',         free: false, pro: true },
      { feature: 'Network Assistance',                free: false, pro: true },
      { feature: 'Portfolio Building',                free: false, pro: true },
      { feature: 'Mentorship Matching',               free: 'Free matching', pro: 'Free matching + sessions' },
      { feature: 'Pitch & Presentation Coaching',     free: false, pro: true },
      { feature: 'Personal Statement & Postgrad',     free: false, pro: true },
    ],
  },
  {
    label: 'Lifestyle Blueprint',
    rows: [
      { feature: 'Mental Health & Wellbeing',   free: true, pro: true },
      { feature: 'Lifestyle deals access',       free: false, pro: true },
      { feature: 'New deals notifications',      free: false, pro: true },
    ],
  },
  {
    label: 'Campus & Course Features',
    rows: [
      { feature: 'Campus Connect (all boards)', free: true, pro: true },
      { feature: 'Course Connect (all boards)', free: true, pro: true },
      { feature: 'Study group creation',         free: true, pro: true },
      { feature: 'Resource sharing',             free: true, pro: true },
    ],
  },
  {
    label: 'Delivery & Support',
    rows: [
      { feature: 'Standard 48hr delivery',    free: false, pro: true },
      { feature: 'Same-day Premium delivery', free: false, pro: true },
      { feature: 'Priority Handler/Coach',    free: false, pro: true },
      { feature: 'Email support',             free: true, pro: true },
    ],
  },
]

// All 16 services across both blueprints
const PRICING_ROWS = {
  foundation: [
    { name: 'CV Optimisation',             stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'LinkedIn Optimisation',        stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'Cover Letter Assistance',      stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'Application Form Assistance',  stdOrig: 'From €20', stdTrial: 'From €10', premOrig: 'From €30', premTrial: 'From €15' },
    { name: 'Interview Preparation',        stdOrig: 'From €20', stdTrial: 'From €10', premOrig: 'From €30', premTrial: 'From €15' },
    { name: 'Job Search Support',           stdOrig: '€15', stdTrial: '€8', premOrig: '€22', premTrial: '€11' },
    { name: 'CAO Personal Statement',       stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'College Interview Prep',       stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'Scholarship & Grants',         stdOrig: '€20', stdTrial: '€10', premOrig: '€30', premTrial: '€15' },
    { name: 'Course Selection Guidance',    stdOrig: '€15', stdTrial: '€8', premOrig: '€22', premTrial: '€11' },
  ],
  elevation: [
    { name: 'Personal Branding Support',        stdOrig: '€40', stdTrial: '€20', premOrig: '€55', premTrial: '€28' },
    { name: 'Network Assistance',               stdOrig: '€30', stdTrial: '€15', premOrig: '€46', premTrial: '€23' },
    { name: 'Portfolio Building',               stdOrig: '€30', stdTrial: '€15', premOrig: '€46', premTrial: '€23' },
    { name: 'Mentorship Matching',              stdOrig: '€20', stdTrial: '€10', premOrig: '€36', premTrial: '€18' },
    { name: 'Pitch & Presentation Coaching',    stdOrig: '€25', stdTrial: '€13', premOrig: '€45', premTrial: '€18' },
    { name: 'Personal Statement & Postgrad',    stdOrig: '€30', stdTrial: '€15', premOrig: '€52', premTrial: '€26' },
  ],
}

const FAQS = [
  { q: 'What does the Free plan actually include?', a: 'TODO: Full answer — Campus Connect, Course Connect, mental health resources, basic profile. No service purchases on Free.' },
  { q: 'Do I need Pro to use Foundation or Elevation Blueprint services?', a: 'TODO: Full answer — yes, Pro subscription required to access and purchase Blueprint services.' },
  { q: 'What is the September trial price?', a: 'TODO: Full answer — 50% off all services and Pro subscription throughout September 2026 only.' },
  { q: 'Can I cancel Pro at any time?', a: 'TODO: Full answer — yes, cancel any time, access continues until end of billing period.' },
  { q: 'Is there a student discount on top of the trial price?', a: 'TODO: Full answer — September trial is already the discounted price. No additional stacking.' },
  { q: 'What payment methods are accepted?', a: 'TODO: Full answer — card, Apple Pay, Google Pay. Handled via Stripe.' },
  { q: 'Does Pro include unlimited service usage?', a: 'TODO: Full answer — Pro unlocks access to purchase services at listed prices. Services are pay-per-use within the subscription.' },
  { q: 'Is there a refund policy?', a: 'TODO: Full answer — see Refund Policy page. Services covered within 48 hours of delivery if quality standard not met.' },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function ComingSoonModal({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.4)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: '#FFFFFF', borderRadius: '16px',
        padding: '36px', maxWidth: '420px', width: '100%',
        boxShadow: '0px 16px 48px rgba(30,58,95,0.18)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#F5F0E8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Sparkles size={28} color="#1E3A5F" />
        </div>
        <h2
          id="modal-title"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}
        >
          Subscriptions coming soon
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#6B7280',
          marginTop: '12px', lineHeight: 1.6,
        }}>
          Subscription payments aren't live yet. Download the app to get started — you'll be notified when Pro launches.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <Link
            to="/download"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Download the App
          </Link>
          <button
            onClick={onClose}
            style={{
              height: '48px', background: 'none',
              border: '1.5px solid rgba(30,58,95,0.2)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, annual, onProClick }) {
  const isFree = plan === 'free'
  const isAnnual = plan === 'annual'

  const name = isFree ? 'Free' : 'Pro'
  const badge = plan === 'monthly' ? 'Most Popular' : plan === 'annual' ? 'Best Value' : null

  const origPrice = isFree ? null : plan === 'monthly' ? '€13.98' : '€99.98'
  const price = isFree ? '€0' : plan === 'monthly' ? '€6.99' : '€49.99'
  const period = isFree ? 'Forever' : plan === 'monthly' ? '/month' : '/year'

  return (
    <div style={{
      position: 'relative',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      borderLeft: !isFree ? '3px solid #1E3A5F' : 'none',
      padding: '28px',
      flex: 1,
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '3px 10px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700',
        }}>
          {badge}
        </span>
      )}

      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F' }}>
        {name}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
        {origPrice && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#9CA3AF',
            textDecoration: 'line-through',
          }}>
            {origPrice}
          </span>
        )}
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '44px', fontWeight: '700', color: '#1E3A5F',
          lineHeight: 1,
        }}>
          {price}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#6B7280',
        }}>
          {period}
        </span>
      </div>

      {!isFree && (
        <>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF', marginTop: '4px',
          }}>
            September trial price
          </p>
          {isAnnual && (
            <span style={{
              display: 'inline-block', marginTop: '8px',
              background: 'rgba(22,163,74,0.1)', color: '#16A34A',
              borderRadius: '4px', padding: '3px 8px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px', fontWeight: '700',
            }}>
              Save 40% vs monthly
            </span>
          )}
        </>
      )}

      <ul style={{
        marginTop: '20px', padding: 0, listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {(isFree ? FREE_FEATURES : PRO_FEATURES).map(f => (
          <li key={f} style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#1E3A5F',
          }}>
            <Check size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
            {f}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '24px' }}>
        {isFree ? (
          <Link
            to="/sign-up"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', width: '100%',
              background: 'none', color: '#1E3A5F',
              border: '1.5px solid #1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Get started free
          </Link>
        ) : (
          <button
            onClick={onProClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', width: '100%',
              background: '#1E3A5F', color: '#F5F0E8',
              border: 'none', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {plan === 'monthly' ? 'Start Pro' : 'Start Pro Annual'}
          </button>
        )}
      </div>
    </div>
  )
}

function CellValue({ value }) {
  if (value === true)  return <Check size={18} color="#16A34A" style={{ margin: '0 auto', display: 'block' }} />
  if (value === false) return <XIcon size={18} color="#9CA3AF" style={{ margin: '0 auto', display: 'block' }} />
  return (
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>
      {value}
    </span>
  )
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerId = useId()
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      overflow: 'hidden',
    }}>
      <button
        id={triggerId}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-accordion-trigger
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px',
          padding: '20px 24px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', fontWeight: '500', color: '#1E3A5F',
        }}>
          {question}
        </span>
        <ChevronDown
          size={18} color="#6B7280" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
        />
      </button>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#6B7280',
            lineHeight: 1.7, paddingTop: '16px',
          }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function AccordionGroup({ children }) {
  const groupRef = useRef(null)
  function handleKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const triggers = Array.from(groupRef.current?.querySelectorAll('[data-accordion-trigger]') || [])
    const idx = triggers.indexOf(document.activeElement)
    if (idx === -1) return
    e.preventDefault()
    if (e.key === 'ArrowDown') triggers[(idx + 1) % triggers.length]?.focus()
    else triggers[(idx - 1 + triggers.length) % triggers.length]?.focus()
  }
  return <div ref={groupRef} onKeyDown={handleKeyDown}>{children}</div>
}

// ─── PricingPage ───────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annual'
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Helmet>
        <title>Pricing | Uniblueprint</title>
        <meta
          name="description"
          content="Simple transparent pricing. Free to join. Pro from €6.99/month. All services 50% off during September trial."
        />
      </Helmet>

      {showModal && <ComingSoonModal onClose={() => setShowModal(false)} />}

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px 0', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Simple, transparent pricing
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          marginTop: '12px',
        }}>
          Free to join. Pro unlocks everything.
        </p>

        {/* Trial strip */}
        <div style={{
          background: '#1E3A5F',
          marginTop: '40px',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Sparkles size={14} color="#F5F0E8" />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#F5F0E8', fontWeight: '500',
          }}>
            50% OFF — September Trial ends 30 September 2026
          </span>
        </div>
      </section>

      {/* ── SECTION 2 — PLAN CARDS ───────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex',
            background: '#FFFFFF', borderRadius: '8px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            height: '52px', overflow: 'hidden',
          }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '0 24px',
                background: billing === 'monthly' ? '#1E3A5F' : 'transparent',
                color: billing === 'monthly' ? '#F5F0E8' : '#6B7280',
                border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600',
                transition: 'background 150ms, color 150ms',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              style={{
                padding: '0 24px',
                background: billing === 'annual' ? '#1E3A5F' : 'transparent',
                color: billing === 'annual' ? '#F5F0E8' : '#6B7280',
                border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600',
                transition: 'background 150ms, color 150ms',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              Annual
              <span style={{
                background: 'rgba(22,163,74,0.15)', color: '#16A34A',
                borderRadius: '4px', padding: '2px 7px',
                fontSize: '11px', fontWeight: '700',
              }}>
                Save 40%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="pricing-plans-grid" style={{ maxWidth: '960px', margin: '40px auto 0' }}>
          <PlanCard plan="free"    annual={billing === 'annual'} onProClick={() => setShowModal(true)} />
          {billing === 'monthly'
            ? <PlanCard plan="monthly" annual={false} onProClick={() => setShowModal(true)} />
            : <PlanCard plan="annual"  annual={true}  onProClick={() => setShowModal(true)} />
          }
          {/* Third card: always show the opposite of the selected billing */}
          {billing === 'monthly'
            ? (
              <div style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '28px', flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: '8px',
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
                  Save 40% by paying annually
                </p>
                <button
                  onClick={() => setBilling('annual')}
                  style={{
                    background: 'none', border: '1.5px solid #1E3A5F',
                    borderRadius: '8px', padding: '10px 20px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                    color: '#1E3A5F', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  Switch to Annual →
                </button>
              </div>
            )
            : (
              <div style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '28px', flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: '8px',
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
                  Prefer month-to-month? Switch to monthly billing.
                </p>
                <button
                  onClick={() => setBilling('monthly')}
                  style={{
                    background: 'none', border: '1.5px solid #1E3A5F',
                    borderRadius: '8px', padding: '10px 20px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                    color: '#1E3A5F', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  Switch to Monthly →
                </button>
              </div>
            )
          }
        </div>
      </section>

      {/* ── SECTION 3 — FEATURE COMPARISON TABLE ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          What's included
        </h2>

        <div style={{
          maxWidth: '1000px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '460px' }}>
              <thead>
                <tr style={{ background: '#1E3A5F' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#F5F0E8' }}>
                    Feature
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#F5F0E8', width: '120px' }}>
                    Free
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#F5F0E8', width: '120px' }}>
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_SECTIONS.map(section => (
                  <>
                    <tr key={section.label} style={{ background: '#F5F0E8' }}>
                      <td
                        colSpan={3}
                        style={{
                          padding: '10px 24px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '12px', fontWeight: '600',
                          color: '#6B7280',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          borderTop: '1px solid rgba(30,58,95,0.08)',
                        }}
                      >
                        {section.label}
                      </td>
                    </tr>
                    {section.rows.map((row, i) => (
                      <tr
                        key={row.feature}
                        style={{
                          borderTop: '1px solid rgba(30,58,95,0.06)',
                          background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)',
                        }}
                      >
                        <td style={{ padding: '13px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                          {row.feature}
                        </td>
                        <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                          <CellValue value={row.free} />
                        </td>
                        <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                          <CellValue value={row.pro} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — FULL SERVICE PRICING TABLE ───────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Service pricing
        </h2>

        <div style={{
          maxWidth: '1000px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>Service</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>Standard</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>Std Trial</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>Premium</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>Prem Trial</th>
                </tr>
              </thead>
              <tbody>
                {/* Foundation subheader */}
                <tr style={{ background: '#F5F0E8', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
                  <td colSpan={5} style={{ padding: '10px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Foundation Blueprint
                  </td>
                </tr>
                {PRICING_ROWS.foundation.map((s, i) => (
                  <tr key={s.name} style={{ borderTop: '1px solid rgba(30,58,95,0.06)', background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)' }}>
                    <td style={{ padding: '12px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{s.stdOrig}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>{s.stdTrial}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{s.premOrig}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>{s.premTrial}</td>
                  </tr>
                ))}

                {/* Elevation subheader */}
                <tr style={{ background: '#F5F0E8', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
                  <td colSpan={5} style={{ padding: '10px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Elevation Blueprint
                  </td>
                </tr>
                {PRICING_ROWS.elevation.map((s, i) => (
                  <tr key={s.name} style={{ borderTop: '1px solid rgba(30,58,95,0.06)', background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)' }}>
                    <td style={{ padding: '12px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{s.stdOrig}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>{s.stdTrial}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{s.premOrig}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>{s.premTrial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF',
            padding: '14px 24px',
            borderTop: '1px solid rgba(30,58,95,0.06)',
          }}>
            * September trial prices apply throughout September 2026 only. Standard prices resume from 1 October 2026. Pro subscription required to purchase services.
          </p>
        </div>
      </section>

      {/* ── SECTION 5 — FAQ ACCORDION ─────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Pricing questions
        </h2>

        <AccordionGroup>
          <div style={{
            maxWidth: '700px', margin: '40px auto 0',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} question={q} answer={a} />
            ))}
          </div>
        </AccordionGroup>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            to="/faqs"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
              textDecoration: 'none',
            }}
          >
            See all FAQs →
          </Link>
        </div>
      </section>

      {/* ── SECTION 6 — CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#F5F0E8',
        }}>
          Start your Blueprint today
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '12px',
        }}>
          Free to join. September trial — 50% off everything.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link
            to="/download"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Download the App
          </Link>
          <Link
            to="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px',
              background: 'transparent', color: '#F5F0E8',
              border: '1.5px solid rgba(245,240,232,0.5)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Sign up free
          </Link>
        </div>
      </section>
    </>
  )
}
