import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles, Network, Layout, Users, Presentation, BookOpen,
  UserCheck, Send, Bot,
  Check, X as XIcon,
  Award, Dumbbell,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const ELEVATION_SERVICES = [
  {
    name: 'Personal Branding Support',
    tagline: 'Know who you are professionally. Make sure everyone else does too.',
    description: 'Your personal brand is what people say about you when you are not in the room — and right now, most students do not have one. UniBlueprint works with you through a Uni Coach to define your professional identity, sharpen your positioning, and ensure every touchpoint — LinkedIn, CV, online presence — tells a consistent, compelling story about who you are and where you are going.',
    standardBullets: [
      'Personal brand audit across all touchpoints',
      'Brand positioning statement — who you are, what you offer, who you serve',
      'LinkedIn headline and about section aligned to your positioning',
      'Visual identity guidance — photo, consistency, tone',
    ],
    premiumBullets: [
      'Full personal brand strategy document',
      '30-day implementation plan',
      'Follow-up review session with your Uni Coach',
    ],
    icon: Sparkles,
    originalStandard: '€40', trialStandard: '€20',
    originalPremium: '€55', trialPremium: '€28',
  },
  {
    name: 'Network Assistance and Strategic Linking',
    tagline: 'Build the connections that build your career',
    description: 'Who you know matters — but only if you know how to build and use your network strategically. A Uni Coach helps you identify the right people to connect with, craft outreach messages that actually get responses, and turn cold connections into warm relationships that open doors.',
    standardBullets: [
      'Network audit — who you know and who you need to know',
      'Target connection list — specific people and companies to reach',
      'Outreach message templates tailored to your goals',
      'LinkedIn connection and engagement strategy',
    ],
    premiumBullets: [
      'Full network strategy document',
      'Personalised outreach sequence for top 10 target connections',
      'Follow-up session with your Uni Coach after first outreach results',
    ],
    icon: Network,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€46', trialPremium: '€23',
  },
  {
    name: 'Portfolio Building',
    tagline: 'Show your work. Show your thinking. Get noticed.',
    description: 'For students in creative, tech, business, and other portfolio-relevant fields, your work needs to be visible and presented correctly. A Uni Coach guides you through choosing the right platform for your field, structuring your projects as compelling case studies, and building a portfolio that employers and clients actually engage with.',
    standardBullets: [
      'Platform recommendation for your specific field and audience',
      'Portfolio structure and content strategy',
      'Case study framework — how to present each project',
      'Hero section and contact optimisation',
    ],
    premiumBullets: [
      'Portfolio review session after you build — Coach reviews and gives specific feedback',
      'Improvement recommendations before you share with employers or clients',
    ],
    icon: Layout,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€46', trialPremium: '€23',
  },
  {
    name: 'Mentorship Matching',
    tagline: 'One conversation with the right person changes everything',
    description: 'UniBlueprint matches you with a professional or alumni from our curated mentorship network — someone who has navigated where you are trying to go. Matching is always free. You pay only for the session itself. A Uni Coach prepares you before the session so you get the most from every minute.',
    bullets: [
      'Personalised mentor match from the UniBlueprint network',
      'Session preparation guide — specific questions, session structure, etiquette',
      'One-to-one mentorship session by video call or in person',
    ],
    premiumBullets: [
      'Structured follow-up notes from your Uni Coach after the session',
      'Action items and next steps documented',
    ],
    icon: Users,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€36', trialPremium: '€18',
    matchingFree: true,
  },
  {
    name: 'Pitch and Presentation Coaching',
    tagline: 'Perform under pressure. Every time.',
    description: 'Whether you are preparing for a pitch competition, a university presentation, an internship interview, or a graduate scheme assessment centre — UniBlueprint prepares you to perform when it matters. A Uni Coach reviews your materials, gives specific written feedback, and coaches you on delivery, structure, and Q&A handling. Premium includes a live rehearsal session.',
    standardBullets: [
      'Written feedback on your slides, script, or deck — slide by slide',
      'Delivery coaching on the three skills that separate strong from weak presenters',
      'Q&A preparation with predicted questions and how to handle them',
      'Practice schedule based on days until your event',
    ],
    premiumBullets: [
      'Live rehearsal session with your Uni Coach as the audience or panel',
      'Scored across five dimensions with readiness rating',
      'Targeted re-run on your lowest scoring area',
    ],
    icon: Presentation,
    originalStandard: '€25', trialStandard: '€13',
    originalPremium: '€45', trialPremium: '€18',
  },
  {
    name: 'Personal Statement and Postgrad Support',
    tagline: 'Your postgraduate application — built to stand out',
    description: 'Applying for a Masters, PhD, or professional postgraduate programme is a different game from undergraduate applications. UniBlueprint generates a strong personal statement foundation — programme-specific, academically written, and built around your genuine strengths — which a Uni Coach then refines, adding specificity and ensuring it speaks directly to what the admissions committee is looking for.',
    standardBullets: [
      'Programme-specific personal statement draft — not a generic template',
      'Coach refinement session — specificity, narrative, programme alignment',
      'Delivered within 48 hours',
    ],
    premiumBullets: [
      'Same day delivery',
      'Follow-up revision round after your Coach session',
      "Second pass incorporating your voice and the Coach's refinements",
    ],
    note: 'Covers Masters, PhD, MBA, law conversion, clinical programmes, and other professional postgraduate programmes.',
    icon: BookOpen,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€52', trialPremium: '€26',
  },
]

const COMPARISON_ROWS = [
  {
    feature: 'Delivery model',
    standard: 'Session + written deliverable',
    premium: 'Session + follow-up review or notes',
    type: 'text',
  },
  {
    feature: 'Uni Coach assigned',
    standard: true,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Priority Coach assignment',
    standard: false,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Follow-up review included',
    standard: false,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Revision requests',
    standard: '1 included',
    premium: '2 included',
    type: 'text',
  },
  {
    feature: 'Turnaround',
    standard: 'Agreed at booking',
    premium: 'Priority scheduling',
    type: 'text',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function TrialBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: '#1E3A5F', color: '#F5F0E8',
      borderRadius: '6px', padding: '6px 12px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '700',
    }}>
      <Sparkles size={13} />
      50% OFF — September Trial
    </div>
  )
}

function ServiceCard({ name, tagline, description, icon: Icon, bullets, standardBullets, premiumBullets, note, originalStandard, trialStandard, matchingFree, pricingTodo }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: hovered
          ? '0px 4px 20px rgba(30,58,95,0.14)'
          : '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '24px',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
      }}
    >
      {/* 50% OFF badge — shown only when pricing is confirmed */}
      {!pricingTodo && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '3px 7px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.02em',
        }}>
          50% OFF
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={26} color="#1E3A5F" />
      </div>

      {/* Name */}
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', marginTop: '10px',
      }}>
        {name}
      </p>

      {/* Tagline */}
      {tagline && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#1E3A5F', fontStyle: 'italic',
          marginTop: '3px',
        }}>
          {tagline}
        </p>
      )}

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '10px', lineHeight: 1.55,
      }}>
        {description}
      </p>

      {/* Flat bullets — "What you get" (Mentorship Matching) */}
      {bullets && bullets.length > 0 && (
        <ul style={{ marginTop: '10px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {bullets.map(b => (
            <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.45 }}>
              <span style={{ color: '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Standard / Premium bullet groups */}
      {standardBullets && (
        <>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '10px' }}>
            Standard includes
          </p>
          <ul style={{ marginTop: '4px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {standardBullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.45 }}>
                <span style={{ color: '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '8px' }}>
            Premium adds
          </p>
          <ul style={{ marginTop: '4px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {premiumBullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', lineHeight: 1.45 }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>+</span>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Premium adds when base is flat bullets (Mentorship Matching) */}
      {!standardBullets && premiumBullets && (
        <>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '8px' }}>
            Premium adds
          </p>
          <ul style={{ marginTop: '4px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {premiumBullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', lineHeight: 1.45 }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>+</span>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Note (Postgrad) */}
      {note && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic',
          marginTop: '10px', lineHeight: 1.5,
        }}>
          {note}
        </p>
      )}

      {/* Matching: Always Free badge */}
      {matchingFree && (
        <span style={{
          display: 'inline-block', marginTop: '10px',
          background: '#16A34A', color: '#FFFFFF',
          borderRadius: '4px', padding: '2px 8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700',
        }}>
          Matching: Always Free
        </span>
      )}

      {/* Prices */}
      {pricingTodo ? (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic',
          marginTop: '14px',
        }}>
          {/* TODO: confirm exact pricing for Fitness Coaching tier with Des before launch */}
          Pricing to be confirmed — check back soon.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', color: '#9CA3AF',
              textDecoration: 'line-through',
            }}>
              {originalStandard}
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#1E3A5F', fontWeight: '700',
            }}>
              {trialStandard}
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
            September trial price
          </p>
        </>
      )}
    </div>
  )
}

function BoolCell({ value }) {
  return value
    ? <Check size={18} color="#16A34A" style={{ margin: '0 auto', display: 'block' }} />
    : <XIcon size={18} color="#9CA3AF" style={{ margin: '0 auto', display: 'block' }} />
}

// ─── ElevationBlueprintPage ────────────────────────────────────────────────────

export default function ElevationBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Elevation Blueprint | UniBlueprint</title>
        <meta
          name="description"
          content="Expert personal branding, mentorship, portfolio building, pitch coaching, and postgrad support — delivered by specialist Uni Coaches."
        />
        <meta property="og:title" content="Elevation Blueprint | UniBlueprint" />
        <meta property="og:description" content="Expert personal branding, mentorship, portfolio building, pitch coaching, and postgrad support — delivered by specialist Uni Coaches." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Elevation Blueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Expert coaching and strategy — delivered by specialist Uni Coaches
        </p>
        <div style={{ marginTop: '20px' }}>
          <TrialBadge />
        </div>
      </section>

      {/* ── SECTION 1.5 — FITNESS COACHING (NEW) ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '24px', color: '#1E3A5F', margin: 0,
            }}>
              Fitness Coaching
            </h2>
            <span style={{
              background: '#16A34A', color: '#FFFFFF',
              borderRadius: '6px', padding: '3px 9px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px', fontWeight: '700',
              letterSpacing: '0.03em',
            }}>
              New
            </span>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#1E3A5F', fontStyle: 'italic',
            textAlign: 'center', marginTop: '6px',
          }}>
            Train smarter. Perform better. Build the habits that last.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            textAlign: 'center', maxWidth: '620px',
            margin: '12px auto 0', lineHeight: 1.65,
          }}>
            UniBlueprint connects you with verified Uni Coaches specialising in fitness, strength, and conditioning — built around your schedule as a student, apprentice, or young professional.
          </p>

          <div style={{ maxWidth: '480px', margin: '40px auto 0' }}>
            <ServiceCard
              icon={Dumbbell}
              name="Fitness Coaching"
              standardBullets={[
                'Personalised training plan built around your schedule and goals',
                'Form and technique guidance session',
                'Nutrition basics aligned to your training',
                'Weekly check-in structure',
              ]}
              premiumBullets={[
                'Live coaching session with your Uni Coach',
                'Progress review and plan adjustment',
                'Direct access to your Coach for questions between sessions',
              ]}
              pricingTodo
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — SERVICES GRID ────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Available Services
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Everything you need to level up
          </h2>

          <div className="services-grid" style={{ marginTop: '40px' }}>
            {ELEVATION_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — UNI COACH ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Delivered by Uni Coaches
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '16px auto 0', maxWidth: '640px', lineHeight: 1.7,
        }}>
          Uni Coaches are specialists — professionals, postgraduates, and experienced practitioners in their field. Each Coach is vetted, onboarded, and assigned based on the specific service and your goals.
        </p>

        {/* Engagement callout */}
        <div style={{
          maxWidth: '640px', margin: '32px auto 0',
          background: '#F5F0E8',
          borderLeft: '3px solid #1E3A5F',
          borderRadius: '12px',
          padding: '20px 24px',
          textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px', color: '#1E3A5F',
            fontStyle: 'italic',
          }}>
            "Coaches work with you over a defined engagement — not a one-off transaction"
          </p>
        </div>

        {/* Engagement model cards */}
        <div className="hiw-blueprints-grid" style={{ maxWidth: '700px', margin: '32px auto 0' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px', textAlign: 'left', flex: 1,
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F',
            }}>
              Standard
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '12px', lineHeight: 1.65,
            }}>
              One coaching session or deliverable engagement with your assigned Uni Coach. Includes one revision or follow-up question.
            </p>
          </div>

          <div style={{
            background: '#1E3A5F', borderRadius: '12px',
            padding: '28px', textAlign: 'left', flex: 1,
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#F5F0E8',
            }}>
              Premium
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: 'rgba(245,240,232,0.75)',
              marginTop: '12px', lineHeight: 1.65,
            }}>
              Session plus a follow-up review or written notes. Priority Coach assignment and two revision requests included.
            </p>
          </div>
        </div>

        {/* Three step process */}
        <div className="hiw-quality-row" style={{ maxWidth: '700px', margin: '40px auto 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              You submit your brief
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Goals, materials, and service selected
            </p>
          </div>

          <div style={{ color: 'rgba(30,58,95,0.3)', flexShrink: 0, fontSize: '24px', alignSelf: 'center' }} className="hiw-quality-arrow">→</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Award size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              Uni Coach assigned
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Matched to a Coach in your area
            </p>
          </div>

          <div style={{ color: 'rgba(30,58,95,0.3)', flexShrink: 0, fontSize: '24px', alignSelf: 'center' }} className="hiw-quality-arrow">→</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              Engagement delivered
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Session, deliverable, or both
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — STANDARD VS PREMIUM TABLE ────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Standard vs Premium
        </h2>

        <div style={{
          maxWidth: '900px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F0E8' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                  Feature
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                  Standard
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  style={{ borderTop: '1px solid rgba(30,58,95,0.06)', background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)' }}
                >
                  <td style={{ padding: '14px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    {row.type === 'bool'
                      ? <BoolCell value={row.standard} />
                      : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>{row.standard}</span>
                    }
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    {row.type === 'bool'
                      ? <BoolCell value={row.premium} />
                      : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>{row.premium}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION 5 — FULL PRICING TABLE ───────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Full pricing
        </h2>

        <div style={{
          maxWidth: '900px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Service
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Standard
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Standard Trial
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Premium
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Premium Trial
                  </th>
                </tr>
              </thead>
              <tbody>
                {ELEVATION_SERVICES.map((s, i) => (
                  <tr
                    key={s.name}
                    style={{
                      borderTop: '1px solid rgba(30,58,95,0.06)',
                      background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)',
                    }}
                  >
                    <td style={{ padding: '13px 24px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                        {s.name}
                      </span>
                      {s.matchingFree && (
                        <span style={{
                          display: 'inline-block', marginLeft: '8px',
                          background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                          borderRadius: '4px', padding: '1px 6px',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
                        }}>
                          Matching free
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {s.originalStandard}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>
                      {s.trialStandard}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {s.originalPremium}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>
                      {s.trialPremium}
                    </td>
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
            * September trial prices apply throughout September 2026 only. Standard prices resume from 1 October 2026. Mentorship matching is always free regardless of trial period.
          </p>
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
          Start your Elevation Blueprint
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
