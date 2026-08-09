import { useState, useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronDown } from 'lucide-react'

// ─── Countdown ────────────────────────────────────────────────────────────────

const TRIAL_END = new Date('2026-09-30T22:59:59Z') // 23:59:59 Irish Standard Time

function calcTimeLeft() {
  const diff = Math.max(0, TRIAL_END.getTime() - Date.now())
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  }
}

function CountdownTimer() {
  const [prefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [time, setTime] = useState(calcTimeLeft)

  useEffect(() => {
    if (prefersReduced) return
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [prefersReduced])

  const units = [
    { value: time.days,    label: 'Days'    },
    { value: time.hours,   label: 'Hours'   },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <div
      aria-label="Countdown to end of September trial"
      aria-live="off"
      role="timer"
      style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '36px' }}
    >
      {units.map(({ value, label }) => (
        <div
          key={label}
          className="countdown-card"
          style={{
            background: 'rgba(245,240,232,0.09)',
            border: '1px solid rgba(245,240,232,0.14)',
            borderRadius: '12px', textAlign: 'center', flexShrink: 0,
          }}
        >
          <p
            aria-label={`${value} ${label}`}
            className="countdown-value"
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              color: '#F5F0E8', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span aria-hidden="true">{String(value).padStart(2, '0')}</span>
          </p>
          <p aria-hidden="true" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', color: 'rgba(245,240,232,0.45)', marginTop: '5px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CALCULATOR_SERVICES = [
  { name: 'CV Optimisation',     std: '€20', trial: '€10', stdNum: 20, trialNum: 10 },
  { name: 'LinkedIn Profile',    std: '€20', trial: '€10', stdNum: 20, trialNum: 10 },
  { name: 'Cover Letter',        std: '€20', trial: '€10', stdNum: 20, trialNum: 10 },
  { name: 'Personal Branding',   std: '€40', trial: '€20', stdNum: 40, trialNum: 20 },
  { name: 'Network Assistance',  std: '€30', trial: '€15', stdNum: 30, trialNum: 15 },
  { name: 'Interview Prep',      std: '€20', trial: '€10', stdNum: 20, trialNum: 10 },
]

const FREE_FEATURES = [
  {
    icon: '🏛',
    title: 'Campus Connect',
    body: 'Community boards for accommodation, carpooling, marketplace, events, and study groups at your college.',
  },
  {
    icon: '📚',
    title: 'Course Connect',
    body: 'Course-specific discussion boards, shared notes, and module Q&A — collaborate with young people on the same course.',
  },
  {
    icon: '💚',
    title: 'Mental Health Resources',
    body: 'A curated library of mental health and wellbeing resources — always free, always available in the app.',
  },
  {
    icon: '👤',
    title: 'Basic Profile',
    body: 'Your UniBlueprint profile: manage your account, track your activity, and access your Blueprint history.',
  },
]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .sept-trial-h1 { font-size: clamp(48px, 8vw, 80px); }
  .sept-calc-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
  .sept-free-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 800px;
    margin: 40px auto 0;
  }
  @media (max-width: 600px) {
    .sept-free-grid { grid-template-columns: 1fr; }
    .sept-trial-h1 { font-size: 52px; }
  }
  .sept-pill {
    padding: 10px 18px;
    border-radius: 100px;
    border: 1.5px solid rgba(30,58,95,0.15);
    background: #FFFFFF;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1E3A5F;
    cursor: pointer;
    transition: all 150ms ease;
    white-space: nowrap;
  }
  .sept-pill:hover {
    border-color: #1E3A5F;
    background: rgba(30,58,95,0.04);
  }
  .sept-pill.active {
    background: #1E3A5F;
    color: #F5F0E8;
    border-color: #1E3A5F;
  }
  @keyframes sept-price-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sept-price-anim {
    animation: sept-price-in 220ms ease forwards;
  }
  .sept-cta-heading {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(28px, 4vw, 44px);
    color: #F5F0E8;
    line-height: 1.1;
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

function ServiceCalculator() {
  const [selected,  setSelected]  = useState(0)
  const [animating, setAnimating] = useState(false)
  const [displayIdx, setDisplayIdx] = useState(0)

  function pickService(i) {
    if (i === selected) return
    setAnimating(true)
    setTimeout(() => {
      setSelected(i)
      setDisplayIdx(i)
      setAnimating(false)
    }, 160)
  }

  const svc = CALCULATOR_SERVICES[displayIdx]
  const saving = svc.stdNum - svc.trialNum

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Pills */}
      <div className="sept-calc-pills">
        {CALCULATOR_SERVICES.map((s, i) => (
          <button
            key={s.name}
            className={`sept-pill${selected === i ? ' active' : ''}`}
            onClick={() => pickService(i)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Price display */}
      <div
        key={displayIdx}
        className="sept-price-anim"
        style={{
          marginTop: '40px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: '20px',
          padding: '36px 32px',
          textAlign: 'center',
          opacity: animating ? 0 : 1,
          transition: 'opacity 160ms ease',
        }}
      >
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>
          {svc.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
          {/* Standard price */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
              Standard
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '36px', color: '#9CA3AF',
              textDecoration: 'line-through', lineHeight: 1,
            }}>
              {svc.std}
            </p>
          </div>

          {/* Arrow */}
          <div style={{ fontSize: '24px', color: '#16A34A', fontWeight: '700', flexShrink: 0 }}>
            →
          </div>

          {/* Trial price */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#16A34A', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              September Trial
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '52px', color: '#1E3A5F', lineHeight: 1,
              fontWeight: '700',
            }}>
              {svc.trial}
            </p>
          </div>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#16A34A',
          marginTop: '20px', fontWeight: '600',
        }}>
          That's €{saving} saved on this service alone.
        </p>

        <Link
          to="/download"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '46px', padding: '0 28px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
            textDecoration: 'none', marginTop: '24px',
          }}
        >
          Book this service in the app
        </Link>
      </div>
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

const FAQS = [
  {
    q: 'When does the September trial end?',
    a: 'The trial ends on 30 September 2026 at midnight Irish time. Standard pricing applies from 1 October 2026.',
  },
  {
    q: 'Does the 50% discount apply to the Pro subscription?',
    a: 'Yes — Pro is available at 50% off throughout September 2026. After 30 September, standard pricing of €6.99 per month or €49.99 per year applies.',
  },
  {
    q: 'Does it apply to all services?',
    a: 'Yes — every Foundation Blueprint and Elevation Blueprint service is 50% off throughout September 2026, along with the Pro subscription. Mentorship matching remains free, as it always is.',
  },
  {
    q: 'What happens after September?',
    a: 'Standard pricing resumes from 1 October 2026. If you subscribed to Pro during the trial, your next billing will be at the standard Pro price unless you cancel first.',
  },
  {
    q: 'Can I cancel Pro after the trial month?',
    a: 'Yes — cancel any time before your next billing date. You keep Pro access until the end of the billing period.',
  },
]

// ─── SeptemberTrialPage ────────────────────────────────────────────────────────

export default function SeptemberTrialPage() {
  return (
    <>
      <Helmet>
        <title>50% Off — September Trial | UniBlueprint</title>
        <meta name="description" content="Every UniBlueprint service at 50% off. The whole of September. Your Blueprint. Half the price." />
        <meta property="og:title" content="50% Off — September Trial | UniBlueprint" />
        <meta property="og:description" content="Every UniBlueprint service at 50% off. The whole of September. Your Blueprint. Half the price." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '120px 24px 96px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>September 2026 — Limited Time</SectionLabel>

          <h1
            className="sept-trial-h1"
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              color: '#F5F0E8', lineHeight: 1.0,
              marginTop: '12px', letterSpacing: '-0.02em',
            }}
          >
            50% off everything.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px', color: 'rgba(245,240,232,0.65)',
            marginTop: '20px', maxWidth: '440px',
            margin: '20px auto 0', lineHeight: 1.65,
          }}>
            Every service. All of September. No code needed — discount applied automatically.
          </p>

          <CountdownTimer />

          <div style={{ marginTop: '36px' }}>
            <Link
              to="/sign-up"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '56px', padding: '0 40px',
                background: '#F5F0E8', color: '#1E3A5F',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Get started free
            </Link>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.35)',
            marginTop: '14px',
          }}>
            No credit card required. Free to join.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — SERVICE PRICE CALCULATOR ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <SectionLabel>What's included</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#1E3A5F', marginTop: '10px',
          }}>
            Everything at half price.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            marginTop: '12px', maxWidth: '420px',
            margin: '12px auto 0', lineHeight: 1.65,
          }}>
            Select a service to see the September trial price.
          </p>
        </div>

        <ServiceCalculator />

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '24px',
        }}>
          Pro subscription also 50% off — €3.50/month in September (normally €6.99).
        </p>
      </section>

      {/* ── SECTION 3 — WHAT'S FREE ───────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel>Always free</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#1E3A5F', marginTop: '10px',
          }}>
            Four features. Zero cost.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '10px', lineHeight: 1.6,
          }}>
            No trial. No expiry. These features are free for every user, always.
          </p>
        </div>

        <div className="sept-free-grid">
          {FREE_FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: '16px',
                padding: '28px 24px',
                position: 'relative',
              }}
            >
              {/* Always Free badge */}
              <span style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(22,163,74,0.10)', color: '#16A34A',
                borderRadius: '100px', padding: '3px 10px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px', fontWeight: '700',
              }}>
                Always Free
              </span>

              <span style={{ fontSize: '28px', lineHeight: 1, display: 'block', marginBottom: '14px' }}>
                {f.icon}
              </span>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '19px', color: '#1E3A5F',
              }}>
                {f.title}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '8px', lineHeight: 1.65,
              }}>
                {f.body}
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
          September trial questions
        </h2>

        <AccordionGroup>
          <div style={{ maxWidth: '700px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} question={q} answer={a} />
            ))}
          </div>
        </AccordionGroup>
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
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2
            className="sept-cta-heading"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: '#F5F0E8', lineHeight: 1.1,
            }}
          >
            September won't last. Your Blueprint will.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            marginTop: '14px',
          }}>
            50% off everything until 30 September 2026.
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
              Sign up free
            </Link>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.3)',
            marginTop: '20px',
          }}>
            Trial ends 30 September 2026 at midnight Irish time. No credit card required.
          </p>
        </div>
      </section>
    </>
  )
}
