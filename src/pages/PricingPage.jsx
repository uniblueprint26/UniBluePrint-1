import { useState, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronDown } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Campus Connect (all boards)',
  'Course Connect (all boards)',
  'Mental Health and Wellbeing resources',
  'Basic profile and account',
  'View Lifestyle Blueprint deals',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Foundation Blueprint (all services)',
  'Elevation Blueprint (all services)',
  'Lifestyle Blueprint deals access',
  'Priority Handler and Coach assignment',
  'Discount on service bundles',
]

const PRICING_ROWS = {
  foundation: [
    { name: 'CV Optimisation',             std: '€20',      trial: '€10'      },
    { name: 'LinkedIn Optimisation',        std: '€20',      trial: '€10'      },
    { name: 'Cover Letter Assistance',      std: '€20',      trial: '€10'      },
    { name: 'Application Form Assistance',  std: 'From €20', trial: 'From €10' },
    { name: 'Interview Preparation',        std: 'From €20', trial: 'From €10' },
    { name: 'Job Search Support',           std: '€15',      trial: '€8'       },
    { name: 'CAO Personal Statement',       std: '€20',      trial: '€10'      },
    { name: 'College Interview Prep',       std: '€20',      trial: '€10'      },
    { name: 'Scholarship and Grants',       std: '€20',      trial: '€10'      },
    { name: 'Course Selection Guidance',    std: '€15',      trial: '€8'       },
  ],
  elevation: [
    { name: 'Personal Branding Support',        std: '€40', trial: '€20' },
    { name: 'Network Assistance',               std: '€30', trial: '€15' },
    { name: 'Portfolio Building',               std: '€30', trial: '€15' },
    { name: 'Mentorship Matching',              std: '€20', trial: '€10' },
    { name: 'Pitch and Presentation Coaching',  std: '€25', trial: '€13' },
    { name: 'Personal Statement and Postgrad',  std: '€30', trial: '€15' },
  ],
}

const FAQS = [
  {
    q: 'What does the Free plan actually include?',
    a: 'Campus Connect, Course Connect, all Mental Health and Wellbeing resources, and a basic profile are free for every user. Foundation Blueprint services are available to purchase on the free tier at listed prices.',
  },
  {
    q: 'What is the September trial price?',
    a: 'Every UniBlueprint service is available at 50% off standard pricing throughout September 2026. The discount is applied automatically — no code needed.',
  },
  {
    q: 'Can I cancel Pro at any time?',
    a: 'Yes — cancel any time. Monthly subscribers retain Pro access until the end of the current billing period. Annual subscribers are entitled to a refund within 14 days of purchase if they have not used the service.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Card, Apple Pay, and Google Pay. Payments are processed securely via Stripe.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes — see our Refund Policy for full details. Annual Pro subscribers are entitled to a refund within 14 days of purchase if they have not used the service.',
  },
]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .pricing-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1020px;
    margin: 40px auto 0;
  }
  @media (max-width: 767px) {
    .pricing-cards-grid { grid-template-columns: 1fr; }
  }
  @media (min-width: 768px) and (max-width: 959px) {
    .pricing-cards-grid {
      grid-template-columns: 1fr 1fr;
    }
    .pricing-card-annual { grid-column: 1 / -1; max-width: 480px; margin: 0 auto; width: 100%; }
  }
  .pricing-svc-row { transition: background 140ms ease; }
  .pricing-svc-row:hover { background: rgba(30,58,95,0.03); }
`

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {children}
    </p>
  )
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId    = useId()
  const triggerId  = useId()
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(30,58,95,0.08)', overflow: 'hidden',
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
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '500', color: '#1E3A5F' }}>
          {question}
        </span>
        <ChevronDown
          size={18} color="#6B7280" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
        />
      </button>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.7, paddingTop: '16px' }}>
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
  const [mode, setMode] = useState('standard')    // 'trial' | 'standard'
  const [tab,  setTab]  = useState('foundation')  // 'foundation' | 'elevation'

  const isTrial = mode === 'trial'

  return (
    <>
      <Helmet>
        <title>Pricing | UniBlueprint</title>
        <meta name="description" content="Simple transparent pricing. Free to join. Pro from €6.99/month. All services 50% off during September trial." />
        <meta property="og:title" content="Pricing | UniBlueprint" />
        <meta property="og:description" content="Simple transparent pricing. Free to join. Pro from €6.99/month. All services 50% off during September trial." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '100px 24px 72px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Transparent pricing</SectionLabel>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 56px)',
            color: '#F5F0E8', lineHeight: 1.08,
            marginTop: '12px', letterSpacing: '-0.01em',
          }}>
            Simple. Honest. No surprises.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', maxWidth: '500px', margin: '16px auto 0', lineHeight: 1.65,
          }}>
            Free to join. Pay only for the services you use. Every service at 50% off during the September Trial.
          </p>

          {/* Trial badge */}
          <div style={{ marginTop: '28px' }}>
            <span style={{
              display: 'inline-block',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '100px', padding: '8px 22px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', fontWeight: '700', letterSpacing: '0.01em',
            }}>
              🎓 September Trial: 50% off all services
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — TIER CARDS ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex',
            background: '#F5F0E8', borderRadius: '10px',
            padding: '4px', gap: '4px',
          }}>
            {[
              ['trial',    'September Trial'],
              ['standard', 'Standard'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '600',
                  background: mode === val ? '#1E3A5F' : 'transparent',
                  color: mode === val ? '#F5F0E8' : '#6B7280',
                  transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {label}
                {val === 'trial' && mode === 'standard' && (
                  <span style={{
                    background: 'rgba(22,163,74,0.15)', color: '#16A34A',
                    borderRadius: '4px', padding: '1px 6px',
                    fontSize: '10px', fontWeight: '700',
                  }}>
                    50% off
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="pricing-cards-grid">

          {/* Free */}
          <div style={{
            background: '#FFFFFF', borderRadius: '16px',
            border: '2px solid #1E3A5F',
            padding: '32px 28px',
            display: 'flex', flexDirection: 'column',
          }}>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: '#1E3A5F' }}>
              Free
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '16px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '44px', fontWeight: '700', color: '#1E3A5F', lineHeight: 1 }}>
                €0
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
                forever
              </span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              No credit card required
            </p>

            <ul style={{ marginTop: '24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {FREE_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                  <Check size={15} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/sign-up"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '46px', marginTop: '24px',
                background: 'none', border: '1.5px solid #1E3A5F',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                color: '#1E3A5F', textDecoration: 'none',
              }}
            >
              Sign up free
            </Link>
          </div>

          {/* Pro Monthly */}
          <div style={{
            background: '#FFFFFF', borderRadius: '16px',
            border: '2px solid #B8860B',
            padding: '32px 28px',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 8px 40px rgba(184,134,11,0.10)',
          }}>
            <span style={{
              position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
              background: '#B8860B', color: '#FFFFFF',
              borderRadius: '100px', padding: '4px 16px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              Most Popular
            </span>

            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: '#1E3A5F' }}>
              Pro
            </p>

            <div style={{ marginTop: '16px' }}>
              {isTrial ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#9CA3AF', textDecoration: 'line-through' }}>€6.99</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '44px', fontWeight: '700', color: '#1E3A5F', lineHeight: 1 }}>€3.50</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>/month</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '44px', fontWeight: '700', color: '#1E3A5F', lineHeight: 1 }}>€6.99</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>/month</span>
                </div>
              )}
              {isTrial && (
                <span style={{
                  display: 'inline-block', marginTop: '6px',
                  background: 'rgba(22,163,74,0.10)', color: '#16A34A',
                  borderRadius: '4px', padding: '2px 8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                }}>
                  September trial price
                </span>
              )}
            </div>

            <ul style={{ marginTop: '24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {PRO_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                  <Check size={15} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/sign-up"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '46px', marginTop: '24px',
                background: '#1E3A5F', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                color: '#F5F0E8', textDecoration: 'none',
              }}
            >
              Get Pro
            </Link>
          </div>

          {/* Pro Annual */}
          <div
            className="pricing-card-annual"
            style={{
              background: '#1E3A5F', borderRadius: '16px',
              border: '2px solid #1E3A5F',
              padding: '32px 28px',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '100px', padding: '4px 16px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              Best Value
            </span>

            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: '#F5F0E8' }}>
              Pro Annual
            </p>

            <div style={{ marginTop: '16px' }}>
              {isTrial ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.4)', textDecoration: 'line-through' }}>€49.99</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '44px', fontWeight: '700', color: '#F5F0E8', lineHeight: 1 }}>€24.99</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.55)' }}>/year</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '44px', fontWeight: '700', color: '#F5F0E8', lineHeight: 1 }}>€49.99</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.55)' }}>/year</span>
                </div>
              )}
              <span style={{
                display: 'inline-block', marginTop: '6px',
                background: 'rgba(245,240,232,0.12)', color: 'rgba(245,240,232,0.75)',
                borderRadius: '4px', padding: '2px 8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
              }}>
                Less than €1 a week
              </span>
            </div>

            <ul style={{ marginTop: '24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {PRO_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.8)' }}>
                  <Check size={15} color="rgba(245,240,232,0.55)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/sign-up"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '46px', marginTop: '24px',
                background: '#F5F0E8', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                color: '#1E3A5F', textDecoration: 'none',
              }}
            >
              Get Pro Annual
            </Link>
          </div>

        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: '20px' }}>
          All prices include VAT where applicable.
        </p>
      </section>

      {/* ── SECTION 3 — SERVICES PRICING ─────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel>Service pricing</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#1E3A5F', marginTop: '10px',
          }}>
            Every service. Every price.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '10px', lineHeight: 1.6 }}>
            {isTrial
              ? 'September trial prices are active. Standard prices resume 1 October 2026.'
              : 'Standard pricing. Switch to September Trial above to see 50% off prices.'}
          </p>
        </div>

        {/* Blueprint tab switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.65)', borderRadius: '10px',
            padding: '4px', gap: '4px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            {[
              ['foundation', 'Foundation Blueprint'],
              ['elevation',  'Elevation Blueprint'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '600',
                  background: tab === val ? '#1E3A5F' : 'transparent',
                  color: tab === val ? '#F5F0E8' : '#6B7280',
                  transition: 'all 150ms ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Service table */}
        <div style={{
          maxWidth: '820px', margin: '28px auto 0',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: '520px' }}>

              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 100px 88px',
                gap: '8px', padding: '14px 24px',
                borderBottom: '1px solid rgba(30,58,95,0.08)',
                background: 'rgba(30,58,95,0.04)',
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Service
                </span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                  color: isTrial ? '#9CA3AF' : '#1E3A5F',
                  textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
                }}>
                  Standard
                </span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                  color: isTrial ? '#16A34A' : '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
                }}>
                  Trial
                </span>
                <span />
              </div>

              {/* Rows */}
              {PRICING_ROWS[tab].map((row, i) => (
                <div
                  key={row.name}
                  className="pricing-svc-row"
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 88px',
                    gap: '8px', padding: '13px 24px', alignItems: 'center',
                    borderBottom: i < PRICING_ROWS[tab].length - 1 ? '1px solid rgba(30,58,95,0.06)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                    {row.name}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', textAlign: 'center',
                    color: isTrial ? '#9CA3AF' : '#1E3A5F',
                    fontWeight: isTrial ? '400' : '600',
                    textDecoration: isTrial ? 'line-through' : 'none',
                  }}>
                    {row.std}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', textAlign: 'center',
                    color: isTrial ? '#16A34A' : '#6B7280',
                    fontWeight: isTrial ? '700' : '400',
                  }}>
                    {row.trial}
                  </span>
                  <Link
                    to="/sign-up"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: '6px 12px',
                      background: '#1E3A5F', color: '#F5F0E8',
                      borderRadius: '6px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    Get started
                  </Link>
                </div>
              ))}

              {/* Premium note */}
              <div style={{ padding: '12px 24px', background: 'rgba(30,58,95,0.03)', borderTop: '1px solid rgba(30,58,95,0.06)' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', lineHeight: 1.55 }}>
                  <strong style={{ color: '#6B7280' }}>Premium tier (same-day delivery)</strong> is available in the app at Standard +50%.
                  {isTrial ? ' September trial pricing applies to Premium too.' : ''}
                </p>
              </div>

            </div>
          </div>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: '16px' }}>
          September trial prices apply throughout September 2026. Standard pricing resumes from 1 October 2026.
        </p>
      </section>

      {/* ── SECTION 4 — FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(28px, 3.5vw, 36px)',
          color: '#1E3A5F', textAlign: 'center',
        }}>
          Pricing questions
        </h2>

        <AccordionGroup>
          <div style={{ maxWidth: '700px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} question={q} answer={a} />
            ))}
          </div>
        </AccordionGroup>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            to="/faqs"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#1E3A5F', textDecoration: 'none' }}
          >
            See all FAQs →
          </Link>
        </div>
      </section>

      {/* ── SECTION 5 — CTA ──────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(28px, 4vw, 44px)',
          color: '#F5F0E8', lineHeight: 1.12,
        }}>
          Get started free. Upgrade when you're ready.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.6)', marginTop: '12px' }}>
          No credit card required. September trial — 50% off everything.
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
              border: '1.5px solid rgba(245,240,232,0.4)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Sign up on web
          </Link>
        </div>
      </section>
    </>
  )
}
