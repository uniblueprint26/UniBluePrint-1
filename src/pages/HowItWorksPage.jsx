import { useState, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FileText, TrendingUp,
  Bot, UserCheck, Send, ArrowRight,
  ChevronDown,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    title: 'Download and sign up',
    description:
      'Create your free account in under two minutes — no payment required, no credit card, no commitment. Available on iOS, Android, and web.',
    visual: 'Download the app or open on web → enter your name and email → confirm your address → you\'re in.',
  },
  {
    n: 2,
    title: 'Choose your service',
    description:
      'Browse the Foundation Blueprint or Elevation Blueprint. Select the specific service you need, choose Standard or Premium tier, and submit your materials or brief. Use Course Selection Guidance — powered by our CourseCompass partnership — to find the right CAO course or apprenticeship for you.',
    visual: 'Foundation Blueprint (academic) or Elevation Blueprint (career) → Standard 48hr or Premium same-day → submit your details.',
    link: { label: 'Explore CourseCompass →', url: 'https://coursecompass.ie/course-compass' },
  },
  {
    n: 3,
    title: 'Reviewed and refined',
    description:
      'Your submission goes to a real person — a trained Campus Handler for Foundation services, or a specialist Uni Coach for Elevation services. They review, refine, and quality-check every output before it leaves.',
    visual: 'Campus Handler reviews Foundation outputs against a quality checklist. Uni Coach prepares Elevation outputs to professional standard.',
  },
  {
    n: 4,
    title: 'Delivered to you',
    description:
      'Your finished output arrives by email and in-app notification within your chosen turnaround time. Standard is 48 hours. Premium is same day.',
    visual: 'Delivered to your inbox and in-app. Standard: within 48 hours. Premium: same day.',
  },
]

const FOUNDATION_SERVICES = [
  'CV Optimisation',
  'LinkedIn Optimisation',
  'Cover Letter Assistance',
  'Application Form Assistance',
  'Interview Preparation',
  'Job Search Support',
  'CAO Personal Statement',
  'College Interview Preparation',
  'Scholarship & Grants Application',
  'Course Selection Guidance',
]

const ELEVATION_SERVICES = [
  'Personal Branding Support',
  'Network Assistance and Strategic Linking',
  'Portfolio Building',
  'Mentorship Matching',
  'Pitch and Presentation Coaching',
  'Personal Statement and Postgrad Support',
]

const FAQS = [
  {
    q: 'How long does delivery actually take?',
    a: 'TODO: Insert answer — Standard 48hr, Premium same day, explain what happens if a Handler is unavailable.',
  },
  {
    q: 'What is the difference between a Campus Handler and a Uni Coach?',
    a: 'TODO: Insert answer — Campus Handlers are trained students who review Foundation outputs. Uni Coaches are specialists who deliver Elevation services.',
  },
  {
    q: 'Can I use UniBlueprint if I am not a student?',
    a: 'TODO: Insert answer — platform is designed for students and young people in or recently out of education.',
  },
  {
    q: 'Is my information kept private?',
    a: 'TODO: Insert answer — data handling, GDPR compliance, how submitted documents are stored and deleted.',
  },
  {
    q: 'What happens if I am not happy with the output?',
    a: 'TODO: Insert answer — revision policy, refund policy, how to raise a concern.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepBlock({ step, reverse }) {
  return (
    <div className={`hiw-step-block${reverse ? ' hiw-step-reverse' : ''}`}>
      {/* Content */}
      <div style={{ position: 'relative', paddingTop: '16px' }}>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '80px', color: '#1E3A5F',
          opacity: 0.08, lineHeight: 1,
          position: 'absolute', top: 0, left: 0,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {step.n}
        </span>
        <div style={{ position: 'relative', paddingLeft: '48px' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '28px', color: '#1E3A5F',
          }}>
            {step.title}
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            marginTop: '12px', lineHeight: 1.7,
            maxWidth: '500px',
          }}>
            {step.description}
          </p>
          {step.link && (
            <a
              href={step.link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#1E3A5F', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              {step.link.label}
            </a>
          )}
        </div>
      </div>

      {/* Visual placeholder */}
      <div style={{
        background: '#F5F0E8', borderRadius: '12px',
        minHeight: '240px', padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#9CA3AF',
          textAlign: 'center', lineHeight: 1.6,
          maxWidth: '280px',
        }}>
          {step.visual}
        </p>
      </div>
    </div>
  )
}

function BlueprintCard({ icon: Icon, name, tagline, deliveredBy, turnaround, services, linkLabel, linkHref }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      borderTop: '3px solid #1E3A5F',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '28px', flex: 1,
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={28} color="#1E3A5F" />
      </div>

      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '22px', color: '#1E3A5F', marginTop: '16px',
      }}>
        {name}
      </h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', color: '#6B7280', marginTop: '6px',
      }}>
        {tagline}
      </p>

      <div style={{ marginTop: '20px' }}>
        <Detail label="Delivered by" value={deliveredBy} />
        <Detail label="Turnaround" value={turnaround} />
      </div>

      <ul style={{
        marginTop: '16px', paddingLeft: '0', listStyle: 'none', display: 'flex',
        flexDirection: 'column', gap: '8px',
      }}>
        {services.map(s => (
          <li key={s} style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#6B7280',
          }}>
            <span style={{ color: '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>—</span>
            {s}
          </li>
        ))}
      </ul>

      <Link
        to={linkHref}
        style={{
          display: 'inline-block', marginTop: '20px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
          textDecoration: 'none',
        }}
      >
        {linkLabel}
      </Link>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', color: '#9CA3AF',
        fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '0.06em', flexShrink: 0, paddingTop: '1px',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F',
      }}>
        {value}
      </span>
    </div>
  )
}

function TierCard({ name, price, delivery, features, highlighted }) {
  return (
    <div style={{
      background: highlighted ? '#1E3A5F' : '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '28px', flex: 1,
    }}>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '22px',
        color: highlighted ? '#F5F0E8' : '#1E3A5F',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: highlighted ? 'rgba(245,240,232,0.6)' : '#9CA3AF',
        marginTop: '4px',
      }}>
        {delivery}
      </p>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '32px',
        color: highlighted ? '#F5F0E8' : '#1E3A5F',
        marginTop: '16px',
      }}>
        {price}
      </p>
      <ul style={{
        marginTop: '20px', paddingLeft: 0, listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {features.map(f => (
          <li key={f} style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: highlighted ? 'rgba(245,240,232,0.8)' : '#6B7280',
          }}>
            <span style={{ color: highlighted ? '#F5F0E8' : '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

function QualityStep({ icon: Icon, label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', flex: 1,
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={32} color="#1E3A5F" />
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#1E3A5F',
        marginTop: '12px', fontWeight: '500', lineHeight: 1.4,
        maxWidth: '160px',
      }}>
        {label}
      </p>
    </div>
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
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
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

// ─── HowItWorksPage ────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How It Works | UniBlueprint</title>
        <meta
          name="description"
          content="From download to delivered — your Blueprint in four simple steps. Foundation Blueprint and Elevation Blueprint explained."
        />
        <meta property="og:title" content="How It Works | UniBlueprint" />
        <meta property="og:description" content="From download to delivered — your Blueprint in four simple steps. Foundation Blueprint and Elevation Blueprint explained." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to use UniBlueprint',
          description: 'From download to delivered — your Blueprint in four simple steps.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Download and sign up',
              text: 'Create your free account in under two minutes — no payment required, no credit card, no commitment.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Choose your service',
              text: 'Browse the Foundation Blueprint or Elevation Blueprint. Select the specific service you need, choose Standard or Premium tier, and submit your materials.',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Reviewed and refined',
              text: 'Your submission goes to a real person — a trained Campus Handler or specialist Uni Coach — who reviews and quality-checks every output.',
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Delivered to you',
              text: 'Your finished output arrives by email and in-app notification. Standard: within 48 hours. Premium: same day.',
            },
          ],
        })}</script>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          How It Works
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          marginTop: '12px',
        }}>
          From download to delivered — your Blueprint in four steps
        </p>
      </section>

      {/* ── SECTION 2 — FOUR STEPS ───────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {STEPS.map((step, i) => (
            <StepBlock key={step.n} step={step} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ── SECTION 3 — FOUNDATION VS ELEVATION ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Two Blueprints. One platform.
        </h2>

        <div className="hiw-blueprints-grid">
          <BlueprintCard
            icon={FileText}
            name="Foundation Blueprint"
            tagline="CV, LinkedIn, cover letters, interview prep, CAO support, and more — every output reviewed by a trained Campus Handler before delivery."
            deliveredBy="Campus Handler"
            turnaround="48hr Standard · Same day Premium"
            services={FOUNDATION_SERVICES}
            linkLabel="Explore Foundation →"
            linkHref="/foundation-blueprint"
          />
          <BlueprintCard
            icon={TrendingUp}
            name="Elevation Blueprint"
            tagline="Personal branding, network strategy, portfolio building, mentorship, pitch coaching, and postgrad support — delivered by specialist Uni Coaches."
            deliveredBy="Uni Coach"
            turnaround="Agreed at booking"
            services={ELEVATION_SERVICES}
            linkLabel="Explore Elevation →"
            linkHref="/elevation-blueprint"
          />
        </div>
      </section>

      {/* ── SECTION 4 — STANDARD VS PREMIUM ─────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Choose your tier
        </h2>

        <div className="hiw-tiers-grid">
          <TierCard
            name="Standard"
            price="From €8"
            delivery="Delivered within 48 hours"
            features={[
              'Full service output reviewed by a real person',
              'Delivered by email and in-app',
              '48-hour turnaround',
              'One revision request included',
            ]}
            highlighted={false}
          />
          <TierCard
            name="Premium"
            price="From €13"
            delivery="Same-day delivery"
            features={[
              'Everything in Standard',
              'Same-day turnaround',
              'Priority Handler or Coach assignment',
              'Two revision requests included',
            ]}
            highlighted={true}
          />
        </div>
      </section>

      {/* ── SECTION 5 — QUALITY CONTROL ──────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Quality you can trust
        </h2>

        <div className="hiw-quality-row" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          <QualityStep icon={Bot}       label="AI generates the foundation" />
          <ArrowRight size={24} color="#1E3A5F" style={{ opacity: 0.3, flexShrink: 0, alignSelf: 'center', marginTop: '0' }} className="hiw-quality-arrow" />
          <QualityStep icon={UserCheck} label="Campus Handler reviews against quality checklist" />
          <ArrowRight size={24} color="#1E3A5F" style={{ opacity: 0.3, flexShrink: 0, alignSelf: 'center' }} className="hiw-quality-arrow" />
          <QualityStep icon={Send}      label="Delivered to you" />
        </div>
      </section>

      {/* ── SECTION 6 — FAQ SNIPPET ───────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Common questions
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
    </>
  )
}
