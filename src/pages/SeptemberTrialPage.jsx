import { useState, useEffect, useId, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormField, FormInput, FormCheckbox, SubmitButton, SuccessCard, ErrorBanner,
  getUTM, parseDbError,
} from '../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table early_access_signups (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    email text unique not null,
    age_confirmed boolean not null default false,
    source text,
    utm_source text,
    utm_medium text,
    utm_campaign text
  );
  alter table early_access_signups enable row level security;
  create policy "anon_insert" on early_access_signups for insert to anon with check (true);
*/

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
    { value: time.days,    label: 'Days' },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <div
      aria-label="Countdown to end of September trial"
      aria-live="off"
      role="timer"
      style={{
        display: 'flex', gap: '8px', justifyContent: 'center',
        flexWrap: 'wrap', marginTop: '32px',
      }}
    >
      {units.map(({ value, label }) => (
        <div key={label} className="countdown-card" style={{
          background: '#FFFFFF', borderRadius: '8px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p
            aria-label={`${value} ${label}`}
            className="countdown-value"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: '#1E3A5F', lineHeight: 1,
            }}
          >
            <span aria-hidden="true">{String(value).padStart(2, '0')}</span>
          </p>
          <p aria-hidden="true" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: '#6B7280', marginTop: '4px',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Early Access Signup ───────────────────────────────────────────────────────

function EarlyAccessForm() {
  const [email, setEmail]             = useState('')
  const [honeypot, setHoneypot]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState(null)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [ageError, setAgeError]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    if (!ageConfirmed) { setAgeError(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('early_access_signups').insert([{
      email,
      age_confirmed: ageConfirmed,
      source:       'september_trial',
      utm_source:   utm_source   || null,
      utm_medium:   utm_medium   || null,
      utm_campaign: utm_campaign || null,
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <SuccessCard
        title="You're on the list"
        subtitle="We'll let you know as soon as the September trial goes live."
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text" name="website" value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
      />
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
      <FormCheckbox
        id="age-confirm-early"
        checked={ageConfirmed}
        onChange={e => { setAgeConfirmed(e.target.checked); setAgeError(false) }}
        label="I confirm I am 16 or over, or have parental consent"
        required
      />
      {ageError && (
        <p role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#DC2626' }}>
          Please confirm your age before submitting.
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <FormField style={{ flex: 1, minWidth: '240px' }}>
          <FormInput
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.ie"
            required
          />
        </FormField>
        <div style={{ flexShrink: 0, minWidth: '160px' }}>
          <SubmitButton loading={loading} label="Notify me" />
        </div>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', color: 'rgba(245,240,232,0.5)',
        textAlign: 'center',
      }}>
        No spam. Unsubscribe any time.
      </p>
    </form>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const FOUNDATION_SERVICES = [
  { name: 'CV Optimisation',             orig: '€20', trial: '€10' },
  { name: 'LinkedIn Optimisation',        orig: '€20', trial: '€10' },
  { name: 'Cover Letter Assistance',      orig: '€20', trial: '€10' },
  { name: 'Application Form Assistance',  orig: 'From €20', trial: 'From €10' },
  { name: 'Interview Preparation',        orig: 'From €20', trial: 'From €10' },
  { name: 'Job Search Support',           orig: '€15', trial: '€8' },
  { name: 'CAO Personal Statement',       orig: '€20', trial: '€10' },
  { name: 'College Interview Prep',       orig: '€20', trial: '€10' },
  { name: 'Scholarship & Grants',         orig: '€20', trial: '€10' },
  { name: 'Course Selection Guidance',    orig: '€15', trial: '€8' },
]

const ELEVATION_SERVICES = [
  { name: 'Personal Branding Support',       orig: '€40', trial: '€20' },
  { name: 'Network Assistance',              orig: '€30', trial: '€15' },
  { name: 'Portfolio Building',              orig: '€30', trial: '€15' },
  { name: 'Mentorship Matching',             orig: '€20', trial: '€10' },
  { name: 'Pitch & Presentation Coaching',   orig: '€25', trial: '€13' },
  { name: 'Personal Statement & Postgrad',   orig: '€30', trial: '€15' },
]

const HOW_STEPS = [
  {
    n: 1,
    title: 'Download the app',
    description: 'Available on iOS, Android, and web. Free — no payment required.',
  },
  {
    n: 2,
    title: 'Create your account',
    description: 'Sign up in under two minutes. No credit card, no commitment.',
  },
  {
    n: 3,
    title: 'Use any service',
    description: 'Choose what you need from the Foundation or Elevation Blueprint. The discount is automatic.',
  },
]

const FAQS = [
  {
    q: 'When does the September trial end?',
    a: 'The trial ends on 30 September 2026 at midnight Irish time. A 7-day grace period runs until 7 October 2026. Standard pricing applies from 1 October 2026.',
  },
  {
    q: 'Does the 50% discount apply to the Pro subscription?',
    a: 'Yes — Pro is available at 50% off throughout September 2026. After 30 September, standard pricing of €6.99 per month or €49.99 per year applies.',
  },
  {
    q: 'Does it apply to all services?',
    a: 'Yes — every Foundation Blueprint and Elevation Blueprint service is 50% off throughout September 2026, along with the Pro subscription itself. Mentorship matching remains free, as it always is.',
  },
  {
    q: 'What happens after September?',
    a: 'Standard pricing resumes from 1 October 2026, following a 7-day grace period ending 7 October 2026. If you subscribed to Pro during the trial, your next billing will be at the standard Pro price unless you cancel first.',
  },
  {
    q: 'Can I cancel Pro after the trial month?',
    a: 'Yes — cancel any time before your next billing date. You keep Pro access until the end of the billing period.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function ServiceRow({ name, orig, trial }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(30,58,95,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '4px', padding: '2px 6px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '9px', fontWeight: '700',
          letterSpacing: '0.02em', flexShrink: 0,
        }}>
          50% OFF
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#1E3A5F',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textDecoration: 'line-through',
        }}>
          {orig}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#1E3A5F', fontWeight: '700',
        }}>
          {trial}
        </span>
      </div>
    </div>
  )
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId   = useId()
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

// ─── SeptemberTrialPage ────────────────────────────────────────────────────────

export default function SeptemberTrialPage() {
  return (
    <>
      <Helmet>
        <title>50% Off — September Trial | UniBlueprint</title>
        <meta
          name="description"
          content="Every UniBlueprint service at 50% off. The whole of September. Your Blueprint. Half the price."
        />
        <meta property="og:title" content="50% Off — September Trial | UniBlueprint" />
        <meta property="og:description" content="Every UniBlueprint service at 50% off. The whole of September. Your Blueprint. Half the price." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100dvh',
        background: '#F5F0E8',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h1
          className="sept-hero-heading"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#1E3A5F', lineHeight: 1 }}
        >
          50% OFF
        </h1>

        <h2
          className="sept-hero-sub"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#1E3A5F', marginTop: '8px' }}
        >
          The whole of September
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '20px', color: '#6B7280',
          marginTop: '12px', lineHeight: 1.5,
        }}>
          Every service. Every pillar. Half the price.
        </p>

        <CountdownTimer />

        <Link
          to="/sign-up"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '56px', padding: '0 40px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '600',
            textDecoration: 'none', marginTop: '24px',
          }}
        >
          Get started free — no card required
        </Link>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          marginTop: '12px',
        }}>
          Trial ends 30 September 2026 at midnight Irish time
        </p>
      </section>

      {/* ── SECTION 2 — WHAT IS INCLUDED ─────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#1E3A5F',
        }}>
          Everything. Half the price.
        </h2>

        <div className="sept-services-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          {/* Foundation Blueprint */}
          <div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F',
              marginBottom: '16px',
            }}>
              Foundation Blueprint
            </h3>
            {FOUNDATION_SERVICES.map(s => <ServiceRow key={s.name} {...s} />)}
          </div>

          {/* Elevation Blueprint */}
          <div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F',
              marginBottom: '16px',
            }}>
              Elevation Blueprint
            </h3>
            {ELEVATION_SERVICES.map(s => <ServiceRow key={s.name} {...s} />)}
          </div>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          marginTop: '24px',
        }}>
          Pro subscription also 50% off — €6.99/month (normally €13.98) throughout September.
        </p>
      </section>

      {/* ── SECTION 3 — WHY WE ARE DOING THIS ───────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: '800px', width: '100%',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '28px',
        }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '32px', color: '#1E3A5F',
          }}>
            Why 50% off?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            marginTop: '16px', lineHeight: 1.8,
          }}>
            {/* TODO: Replace with real founder message */}
            TODO: Insert founder message — why the September trial exists, what the goal is, what it means for students launching in September 2026, and the commitment to making the platform genuinely accessible.
          </p>
        </div>
      </section>

      {/* ── SECTION 4 — HOW TO GET IT ─────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          How to get it
        </h2>

        <div className="steps-row" style={{ maxWidth: '800px', margin: '40px auto 0' }}>
          {HOW_STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flex: '1 0 0', maxWidth: '220px', minWidth: '140px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '22px', color: '#F5F0E8',
                  }}>
                    {step.n}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '18px', color: '#1E3A5F',
                  marginTop: '12px', textAlign: 'center', lineHeight: 1.3,
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', textAlign: 'center', lineHeight: 1.5,
                }}>
                  {step.description}
                </p>
              </div>
              {i < HOW_STEPS.length - 1 && (
                <div
                  className="step-connector"
                  style={{
                    flex: '1 0 16px',
                    borderTop: '1px dashed rgba(30,58,95,0.2)',
                    marginTop: '24px',
                  }}
                />
              )}
            </Fragment>
          ))}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#9CA3AF',
          marginTop: '32px',
        }}>
          The discount is automatic — no code needed
        </p>
      </section>

      {/* ── SECTION 5 — FAQ ───────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          September trial questions
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
      </section>

      {/* ── SECTION 6 — EARLY ACCESS SIGNUP ──────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px', color: '#F5F0E8',
        }}>
          Not ready yet? Join the waitlist.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '8px',
        }}>
          We'll notify you when the September trial goes live.
        </p>
        <div style={{ maxWidth: '480px', margin: '32px auto 0' }}>
          <EarlyAccessForm />
        </div>
      </section>

      {/* ── SECTION 7 — FINAL CTA ─────────────────────────────────────────── */}
      <section style={{
        background: '#F5F0E8',
        padding: '100px 24px',
        textAlign: 'center',
      }}>
        <h2
          className="sept-cta-heading"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#1E3A5F' }}
        >
          Your Blueprint starts now
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          marginTop: '12px',
        }}>
          50% off everything — until 30 September
        </p>
        <Link
          to="/sign-up"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '60px', padding: '0 48px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: '700',
            textDecoration: 'none', marginTop: '32px',
          }}
        >
          Get started free
        </Link>
      </section>
    </>
  )
}
