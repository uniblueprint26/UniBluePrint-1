import { useState, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronDown } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    title: 'Download and sign up',
    description:
      'Create your free account in under two minutes. No payment needed, no credit card. Available on iOS, Android, and web.',
    screenTitle: 'Create account',
    screenItems: ['Your name', 'Email address', 'Password'],
    screenCta: 'Get started free',
    screenNote: 'Free forever',
  },
  {
    n: 2,
    title: 'Choose your service',
    description:
      'Browse Foundation or Elevation Blueprint. Select your service, choose Standard (48hr) or Premium (same-day), and submit your brief.',
    screenTitle: 'Foundation Blueprint',
    screenItems: ['CV Optimisation', 'LinkedIn Profile', 'Cover Letter', 'Interview Prep'],
    screenCta: 'Select',
    screenNote: 'From €8 in September',
  },
  {
    n: 3,
    title: 'Reviewed by a real person',
    description:
      'Your submission goes to a trained Campus Handler (Foundation) or a verified Uni Coach (Elevation). They review, build, and quality-check before delivery.',
    screenTitle: 'Campus Handler',
    screenItems: ['Reviewing your CV...', 'Quality check', 'Feedback ready'],
    screenCta: null,
    screenNote: 'Est. delivery: 24 hrs',
  },
  {
    n: 4,
    title: 'Delivered to you',
    description:
      'Your finished output arrives in-app and by email. Standard: 48 hours. Premium: same day.',
    screenTitle: 'Your CV is ready',
    screenItems: ['Review in-app', 'Email delivered', 'Download PDF'],
    screenCta: 'Download',
    screenNote: 'Delivered in 47 hrs',
  },
]

const QUALITY_CARDS = [
  {
    icon: '👤',
    heading: 'Every output reviewed by a real person',
    body: 'Campus Handlers check every Foundation Blueprint submission against a quality checklist before it reaches you.',
  },
  {
    icon: '⏱',
    heading: '48-hour standard delivery',
    body: 'Standard turnaround is 48 hours. Same-day Premium delivery is available at booking. Clear timelines, every time.',
  },
  {
    icon: '🆓',
    heading: 'Free to join, always',
    body: 'No credit card, no commitment. Join for free and use Campus Connect, Course Connect, and wellbeing resources at no cost.',
  },
]

const FAQS = [
  {
    q: 'How long does delivery actually take?',
    a: 'Standard tier is delivered within 48 hours of submission. Premium tier is delivered the same day. Submissions made after 11pm on Saturday night are delivered by end of day Monday on the Premium tier.',
  },
  {
    q: 'What is the difference between a Campus Handler and a Uni Coach?',
    a: 'Campus Handlers are trained reviewers at your institution who check every Foundation Blueprint output before it reaches you. Uni Coaches are verified specialists who deliver Elevation Blueprint services — coaching, mentorship, and strategy — over a defined engagement.',
  },
  {
    q: 'Who is UniBlueprint for?',
    a: 'UniBlueprint is for young people across Ireland on every pathway — university, college, apprenticeship, PLC, 5th and 6th year, and those already in work. Whether you are applying to college, starting an apprenticeship, building your career, or looking for deals near your campus — UniBlueprint has something for you.',
  },
  {
    q: 'Is my information kept private?',
    a: 'Yes. All information you submit is treated as confidential. Campus Handlers see only the information needed to complete your specific ticket. Your data is stored securely in compliance with GDPR. See our Privacy Policy for full details.',
  },
  {
    q: 'What happens if I am not happy with the output?',
    a: 'Contact support through the app. Campus Handlers review outputs against a quality checklist before delivery so revision requests are uncommon — but we will always work with you to get it right.',
  },
]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .hiw-steps-outer {
    position: relative;
    max-width: 1080px;
    margin: 60px auto 0;
  }
  .hiw-connector-line {
    position: absolute;
    top: 92px;
    left: calc(12.5% + 16px);
    right: calc(12.5% + 16px);
    border-top: 2px dashed rgba(30,58,95,0.15);
    pointer-events: none;
  }
  .hiw-steps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .hiw-quality-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 960px;
    margin: 40px auto 0;
  }
  @media (max-width: 960px) {
    .hiw-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .hiw-connector-line { display: none; }
  }
  @media (max-width: 600px) {
    .hiw-steps-grid { grid-template-columns: 1fr; }
    .hiw-quality-cards { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .hiw-quality-cards { grid-template-columns: 1fr; }
  }
  .hiw-step-card {
    cursor: pointer;
    transition: all 200ms ease;
    border-radius: 16px;
    border: 2px solid transparent;
    background: #FFFFFF;
    padding: 24px 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 2px 12px rgba(30,58,95,0.07);
  }
  .hiw-step-card:hover {
    box-shadow: 0 8px 28px rgba(30,58,95,0.12);
    transform: translateY(-3px);
  }
  .hiw-step-card.active {
    border-color: #1E3A5F;
    box-shadow: 0 8px 32px rgba(30,58,95,0.16);
    transform: translateY(-4px);
  }
  .hiw-step-num {
    font-family: 'DM Serif Display', serif;
    font-size: 80px;
    color: #1E3A5F;
    opacity: 0.08;
    line-height: 1;
    user-select: none;
    pointer-events: none;
    position: absolute;
    top: 6px;
    left: 0;
    right: 0;
    text-align: center;
  }
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

/* Mini phone mockup with children screen content */
function MiniPhone({ children, style = {} }) {
  return (
    <div style={{
      width: 140, borderRadius: '30px',
      background: '#0c1520', padding: '6px',
      boxShadow: '0 20px 56px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative',
      ...style,
    }}>
      {/* Power button */}
      <div style={{ position: 'absolute', right: '-2px', top: '58px', width: '2px', height: '28px', background: '#1a2535', borderRadius: '0 2px 2px 0' }} />
      {/* Volume buttons */}
      <div style={{ position: 'absolute', left: '-2px', top: '46px', width: '2px', height: '20px', background: '#1a2535', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: '-2px', top: '74px', width: '2px', height: '20px', background: '#1a2535', borderRadius: '2px 0 0 2px' }} />
      {/* Screen */}
      <div style={{ borderRadius: '24px', overflow: 'hidden', width: 128, height: 276, background: '#F5F0E8' }}>
        {children}
      </div>
      {/* Home bar */}
      <div style={{ height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '52px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

function StepScreen({ step }) {
  const isReview   = step.n === 3
  const isDelivery = step.n === 4

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#F5F0E8',
      display: 'flex', flexDirection: 'column',
      padding: '14px 10px', gap: '7px',
    }}>
      {/* Screen top bar */}
      <div style={{
        background: '#1E3A5F', margin: '-14px -10px 0',
        padding: '8px 10px 6px',
      }}>
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '10px', color: '#F5F0E8',
          lineHeight: 1.2,
        }}>
          {step.screenTitle}
        </p>
      </div>

      {isReview ? (
        /* Review step: handler avatar */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#1E3A5F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#F5F0E8' }}>H</span>
          </div>
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '6px', padding: '5px 8px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: '#16A34A', fontWeight: '600' }}>Reviewing your CV</p>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: '#9CA3AF', textAlign: 'center' }}>{step.screenNote}</p>
        </div>
      ) : isDelivery ? (
        /* Delivery step: checkmark */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(22,163,74,0.1)',
            border: '2px solid rgba(22,163,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '20px', color: '#16A34A' }}>✓</span>
          </div>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '11px', color: '#1E3A5F', textAlign: 'center' }}>
            {step.screenTitle}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: '#9CA3AF', textAlign: 'center' }}>
            {step.screenNote}
          </p>
          <div style={{ width: '100%', background: '#1E3A5F', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <span style={{ color: '#F5F0E8', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: '600' }}>
              {step.screenCta}
            </span>
          </div>
        </div>
      ) : (
        /* Sign-up and service list steps */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '6px' }}>
          {step.screenItems.map((item, i) => (
            <div
              key={item}
              style={{
                background: i === 0 && step.n === 2 ? '#1E3A5F' : '#FFFFFF',
                borderRadius: '5px',
                padding: '5px 7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: step.n === 2 ? 'space-between' : 'flex-start',
                border: step.n === 1 ? '1px solid rgba(30,58,95,0.12)' : 'none',
              }}
            >
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '9px',
                color: step.n === 2 && i === 0 ? '#F5F0E8' : '#1E3A5F',
              }}>
                {item}
              </span>
              {step.n === 2 && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: i === 0 ? 'rgba(245,240,232,0.7)' : '#9CA3AF' }}>
                  €10
                </span>
              )}
            </div>
          ))}
          {step.screenCta && (
            <div style={{ marginTop: 'auto', background: '#1E3A5F', borderRadius: '5px', padding: '6px', textAlign: 'center' }}>
              <span style={{ color: '#F5F0E8', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: '600' }}>
                {step.screenCta}
              </span>
            </div>
          )}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: '#9CA3AF', textAlign: 'center', marginTop: '2px' }}>
            {step.screenNote}
          </p>
        </div>
      )}
    </div>
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

// ─── HowItWorksPage ────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0)

  function handleStepClick(i) {
    setActiveStep(prev => (prev === i ? -1 : i))
  }

  return (
    <>
      <Helmet>
        <title>How It Works | UniBlueprint</title>
        <meta name="description" content="From sign-up to delivery in under 48 hours. Four steps, explained." />
        <meta property="og:title" content="How It Works | UniBlueprint" />
        <meta property="og:description" content="From sign-up to delivery in under 48 hours. Four steps, explained." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to use UniBlueprint',
          description: 'From download to delivered — your Blueprint in four simple steps.',
          step: STEPS.map(s => ({
            '@type': 'HowToStep',
            position: s.n,
            name: s.title,
            text: s.description,
          })),
        })}</script>
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '100px 24px 80px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>How UniBlueprint works</SectionLabel>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#F5F0E8', lineHeight: 1.08,
            marginTop: '12px', letterSpacing: '-0.01em',
          }}>
            Four steps. Your Blueprint.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', maxWidth: '460px', margin: '16px auto 0', lineHeight: 1.65,
          }}>
            From sign-up to delivery in under 48 hours. Here's exactly what happens.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — STEPS ────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div className="hiw-steps-outer">
          {/* Desktop connecting line */}
          <div aria-hidden="true" className="hiw-connector-line" />

          <div className="hiw-steps-grid">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={`hiw-step-card${activeStep === i ? ' active' : ''}`}
                onClick={() => handleStepClick(i)}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === i}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStepClick(i)}
              >
                {/* Ghost number */}
                <div style={{ position: 'relative', width: '100%', height: '56px', marginBottom: '8px' }}>
                  <span className="hiw-step-num" aria-hidden="true">{step.n}</span>
                  {/* Active indicator dot */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: activeStep === i ? '#1E3A5F' : '#F5F0E8',
                    border: `2px solid ${activeStep === i ? '#1E3A5F' : 'rgba(30,58,95,0.18)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms ease',
                    zIndex: 1,
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '12px', fontWeight: '700',
                      color: activeStep === i ? '#F5F0E8' : '#1E3A5F',
                    }}>
                      {step.n}
                    </span>
                  </div>
                </div>

                {/* Mini phone */}
                <MiniPhone style={{ marginBottom: '20px' }}>
                  <StepScreen step={step} />
                </MiniPhone>

                {/* Text */}
                <h3 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '17px', color: '#1E3A5F',
                  lineHeight: 1.25,
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.65,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '32px',
        }}>
          Tap each step to highlight it.
        </p>
      </section>

      {/* ── SECTION 3 — QUALITY PROMISE ──────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel>Our promise</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#1E3A5F', marginTop: '10px',
          }}>
            Quality you can count on.
          </h2>
        </div>

        <div className="hiw-quality-cards">
          {QUALITY_CARDS.map(card => (
            <div
              key={card.heading}
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: '16px',
                padding: '32px 28px',
              }}
            >
              <span style={{ fontSize: '32px', lineHeight: 1, display: 'block', marginBottom: '16px' }}>
                {card.icon}
              </span>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F', lineHeight: 1.25,
              }}>
                {card.heading}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '10px', lineHeight: 1.65,
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(28px, 3.5vw, 36px)',
          color: '#1E3A5F', textAlign: 'center',
        }}>
          Common questions
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
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Ready to start</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#F5F0E8', lineHeight: 1.12, marginTop: '10px',
          }}>
            Ready to get started?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            marginTop: '12px',
          }}>
            Free to join. No credit card. September trial — 50% off everything.
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
        </div>
      </section>
    </>
  )
}
