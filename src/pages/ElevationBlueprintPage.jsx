import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles, Network, Layout, Users, Presentation, BookOpen,
  ArrowRight, Check,
} from 'lucide-react'

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .ebp-hero-inner {
    display: flex; align-items: center; gap: 48px;
    max-width: 1040px; margin: 0 auto;
  }
  .ebp-services-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 48px;
  }
  .ebp-steps-row {
    display: flex; align-items: flex-start;
    gap: 0; max-width: 720px; margin: 48px auto 0;
    position: relative;
  }
  .ebp-steps-line {
    position: absolute; top: 22px; left: 80px; right: 80px;
    height: 1px; background: rgba(30,58,95,0.15);
    pointer-events: none;
  }
  @media (max-width: 860px) {
    .ebp-hero-inner { flex-direction: column; }
    .ebp-hero-phone { display: none; }
    .ebp-services-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .ebp-services-grid { grid-template-columns: 1fr; }
    .ebp-steps-row { flex-direction: column; align-items: center; gap: 32px; }
    .ebp-steps-line { display: none; }
  }
  @keyframes ebp-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ebp-tab-content { animation: ebp-fade 200ms ease; }
`

// ─── Accent colour ─────────────────────────────────────────────────────────────
// Elevation Blueprint uses a slightly deeper blue to distinguish from Foundation.

const ACCENT = '#2D4B8E'

// ─── Services grid data ────────────────────────────────────────────────────────

const ELEVATION_SERVICES = [
  {
    name: 'Personal Branding',
    icon: Sparkles,
    description: 'Define your professional identity and make every touchpoint tell the same compelling story, from LinkedIn to your cover letter.',
    bullets: [
      'Personal brand audit across all channels',
      'Positioning statement and LinkedIn alignment',
      'Visual identity and tone guidance',
    ],
    price: '€40', trialPrice: '€20',
  },
  {
    name: 'Network Assistance',
    icon: Network,
    description: 'Build and activate the connections that actually open doors. A Uni Coach helps you reach the right people with the right message.',
    bullets: [
      'Network audit: who you know, who you need',
      'Outreach message templates tailored to your goals',
      'LinkedIn connection and engagement strategy',
    ],
    price: '€30', trialPrice: '€15',
  },
  {
    name: 'Portfolio Building',
    icon: Layout,
    description: 'Show your work in a way that gets you noticed. Platform recommendation, project structuring, and presentation guidance for your field.',
    bullets: [
      'Platform recommendation for your field and audience',
      'Portfolio structure and case study framework',
      'Hero section and contact optimisation',
    ],
    price: '€30', trialPrice: '€15',
  },
  {
    name: 'Mentorship Matching',
    icon: Users,
    description: 'One conversation with the right person changes everything. Matching is always free. You pay only for the session itself.',
    bullets: [
      'Personalised mentor match from the UniBlueprint network',
      'Session prep guide: questions, structure, and etiquette',
      'One-to-one session by video or in person',
    ],
    price: '€20', trialPrice: '€10',
    matchingFree: true,
  },
  {
    name: 'Pitch and Presentation Coaching',
    icon: Presentation,
    description: 'Perform under pressure, in front of panels, clients, or investors. Written feedback on your deck, delivery coaching, and Q&A prep.',
    bullets: [
      'Slide-by-slide feedback on your deck or script',
      'Delivery coaching on the three skills that separate good from great',
      'Q&A prep with predicted questions',
    ],
    price: '€25', trialPrice: '€13',
  },
  {
    name: 'Postgrad Support',
    icon: BookOpen,
    description: 'Your Masters, PhD, or professional postgraduate application built to stand out. Programme-specific, not a template.',
    bullets: [
      'Programme-specific personal statement draft',
      'Coach refinement session for specificity and alignment',
      'Delivered within 48 hours',
    ],
    price: '€30', trialPrice: '€15',
  },
]

// ─── Find Your Service tab data ────────────────────────────────────────────────

const SERVICE_TABS = [
  {
    id: 'branding',
    label: 'Personal Branding',
    icon: Sparkles,
    description: 'Your personal brand is what people say about you when you are not in the room. A Uni Coach helps you define your professional identity, sharpen your positioning, and ensure every channel tells a consistent story.',
    bullets: [
      'Personal brand audit across LinkedIn, CV, and online presence',
      'Brand positioning statement: who you are and what you offer',
      'A 30-day implementation plan with your Coach',
    ],
    price: '€40', trialPrice: '€20',
  },
  {
    id: 'network',
    label: 'Network',
    icon: Network,
    description: 'Who you know matters, but only if you know how to build and use your network strategically. A Uni Coach identifies the right people to reach and helps you craft outreach that gets responses.',
    bullets: [
      'Network audit and target connection list',
      'Personalised outreach message templates',
      'Follow-up strategy after first results',
    ],
    price: '€30', trialPrice: '€15',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Layout,
    description: 'For young people in creative, tech, business, and other portfolio-relevant fields, your work needs to be visible and presented correctly. A Uni Coach guides you through the structure and platform that fits your audience.',
    bullets: [
      'Platform recommendation for your specific field',
      'Case study framework: how to present each project',
      'Portfolio review session after you build',
    ],
    price: '€30', trialPrice: '€15',
  },
  {
    id: 'pitch',
    label: 'Pitch Coaching',
    icon: Presentation,
    description: 'Whether you are preparing for a pitch competition, a university presentation, or an assessment centre, a Uni Coach reviews your materials and coaches you on delivery, structure, and Q&A handling.',
    bullets: [
      'Slide-by-slide written feedback on your deck or script',
      'Delivery coaching: structure, presence, and timing',
      'Premium: live rehearsal session with real-time scoring',
    ],
    price: '€25', trialPrice: '€13',
  },
  {
    id: 'mentorship',
    label: 'Mentorship',
    icon: Users,
    description: 'UniBlueprint matches you with a professional or alumnus from our curated network: someone who has navigated where you are trying to go. Matching is always free.',
    bullets: [
      'Personalised mentor match from the UniBlueprint network',
      'Session preparation guide so you get the most from every minute',
      'One-to-one session by video call or in person',
    ],
    price: '€20', trialPrice: '€10',
    note: 'Matching is always free. You pay only for the session.',
  },
  {
    id: 'postgrad',
    label: 'Postgrad Support',
    icon: BookOpen,
    description: 'Applying for a Masters, PhD, or professional postgraduate programme is a different game from undergraduate applications. UniBlueprint generates a strong foundation, which a Uni Coach refines with specificity and programme alignment.',
    bullets: [
      'Programme-specific personal statement draft',
      'Coach refinement session for narrative and fit',
      'Covers Masters, PhD, MBA, law conversion, and clinical programmes',
    ],
    price: '€30', trialPrice: '€15',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {children}
    </p>
  )
}

function PhoneMockup({ children, style = {} }) {
  return (
    <div style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative', ...style,
    }}>
      <div style={{ position: 'absolute', right: '-3px', top: '96px', width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '76px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#1E3A5F' }}>
        {children}
      </div>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

function ServiceCard({ name, icon: Icon, description, bullets, price, trialPrice, matchingFree }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.85)',
      borderTop: `3px solid ${ACCENT}`,
      borderRadius: '16px',
      padding: '28px 26px 24px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: 'rgba(45,75,142,0.08)',
        border: '1px solid rgba(45,75,142,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={ACCENT} strokeWidth={1.8} />
      </div>
      <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#1E3A5F', marginTop: '14px' }}>
        {name}
      </p>
      {matchingFree && (
        <span style={{
          display: 'inline-block', marginTop: '6px',
          background: 'rgba(22,163,74,0.1)', color: '#16A34A',
          borderRadius: '4px', padding: '2px 8px',
          fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
        }}>
          Matching: Always Free
        </span>
      )}
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '10px', lineHeight: 1.6 }}>
        {description}
      </p>
      <ul style={{ marginTop: '12px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
            <Check size={13} color={ACCENT} style={{ flexShrink: 0, marginTop: '2px' }} />
            {b}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '18px' }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through' }}>
          {price}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '17px', color: ACCENT, fontWeight: '700' }}>
          {trialPrice}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
          September trial
        </span>
      </div>
    </div>
  )
}

// ─── Find Your Service interactive ────────────────────────────────────────────

function FindYourService() {
  const [activeId, setActiveId] = useState('branding')
  const active = SERVICE_TABS.find(t => t.id === activeId)

  return (
    <div>
      {/* Tab pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '36px' }}>
        {SERVICE_TABS.map(tab => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              style={{
                padding: '9px 18px', borderRadius: '24px',
                border: isActive ? `1.5px solid ${ACCENT}` : '1.5px solid rgba(30,58,95,0.18)',
                background: isActive ? ACCENT : 'transparent',
                color: isActive ? '#F5F0E8' : '#1E3A5F',
                fontFamily: "'DM Sans',sans-serif",
                fontSize: '13px', fontWeight: isActive ? '600' : '400',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 160ms ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div
        key={activeId}
        className="ebp-tab-content"
        style={{
          display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap',
          background: '#F5F0E8', borderRadius: '16px', padding: '36px',
        }}
      >
        {/* Icon + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '80px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '14px',
            background: 'rgba(45,75,142,0.1)',
            border: '1px solid rgba(45,75,142,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <active.icon size={30} color={ACCENT} strokeWidth={1.6} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>
              {active.price}
            </span>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: ACCENT }}>
              {active.trialPrice}
            </span>
          </div>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>
            September trial
          </span>
        </div>

        {/* Description + bullets */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '22px', color: '#1E3A5F', lineHeight: 1.2 }}>
            {active.label}
          </p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '10px', lineHeight: 1.7 }}>
            {active.description}
          </p>
          <ul style={{ marginTop: '16px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {active.bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#1E3A5F', lineHeight: 1.55 }}>
                <Check size={14} color={ACCENT} style={{ flexShrink: 0, marginTop: '2px' }} />
                {b}
              </li>
            ))}
          </ul>
          {active.note && (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '14px', fontStyle: 'italic' }}>
              {active.note}
            </p>
          )}
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            marginTop: '20px', height: '42px', padding: '0 20px',
            background: ACCENT, color: '#F5F0E8', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600',
            textDecoration: 'none',
          }}>
            Book in the app <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── ElevationBlueprintPage ────────────────────────────────────────────────────

export default function ElevationBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Elevation Blueprint | UniBlueprint</title>
        <meta name="description" content="Personal branding, mentorship, portfolio building, pitch coaching, and postgrad support delivered by verified Uni Coaches." />
        <meta property="og:title" content="Elevation Blueprint | UniBlueprint" />
        <meta property="og:description" content="Personal branding, mentorship, portfolio building, pitch coaching, and postgrad support delivered by verified Uni Coaches." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="ebp-hero-inner" style={{ position: 'relative', zIndex: 1 }}>

          {/* Phone mockup */}
          <div className="ebp-hero-phone">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }}>
              <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}>
                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif" }}>9:41</span>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ width: '3px', height: `${4 + i * 2}px`, background: i === 3 ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.6)', borderRadius: '1px' }} />
                    ))}
                  </div>
                </div>
                {/* Header */}
                <div>
                  <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elevation Blueprint</p>
                  <p style={{ color: '#F5F0E8', fontSize: '16px', fontFamily: "'DM Serif Display',serif", marginTop: '3px', lineHeight: 1.2 }}>Your Coach<br />Session</p>
                </div>
                {/* Coach card */}
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(245,240,232,0.14)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,240,232,0.3),rgba(245,240,232,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Serif Display',serif" }}>N</span>
                    </div>
                    <div>
                      <p style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Nikola J.</p>
                      <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>Uni Coach, Personal Branding</p>
                    </div>
                  </div>
                </div>
                {/* Session info */}
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.08)' }}>
                  <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next session</p>
                  <p style={{ color: '#F5F0E8', fontSize: '13px', fontFamily: "'DM Serif Display',serif", marginTop: '3px' }}>Tomorrow, 2:00 PM</p>
                  <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", marginTop: '2px' }}>Personal Branding Strategy</p>
                </div>
                {/* Activity items */}
                {[
                  { label: 'Brand audit complete', color: '#16A34A' },
                  { label: 'LinkedIn updated: +38%', color: '#3B82F6' },
                  { label: 'Network: +14 this month', color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', background: 'rgba(245,240,232,0.04)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(245,240,232,0.55)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>{item.label}</span>
                  </div>
                ))}
                {/* Download CTA */}
                <div style={{ marginTop: 'auto', padding: '8px 10px', borderRadius: '8px', background: '#F5F0E8', textAlign: 'center' }}>
                  <span style={{ color: '#1E3A5F', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Book your Coach</span>
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Glass box */}
          <div style={{
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
            flex: 1,
          }}>
            <SectionLabel light>Elevation Blueprint</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,46px)',
              color: '#F5F0E8',
              marginTop: '10px',
              lineHeight: 1.12,
            }}>
              Go beyond the degree.<br />Build something that lasts.
            </h1>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              Expert coaching from verified Uni Coaches. Booked directly in the app, delivered to your schedule.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              {[
                'Personal branding across LinkedIn and beyond',
                'Network strategy and outreach that gets responses',
                'Portfolio and pitch coaching for your field',
                'Mentorship matching and postgrad application support',
              ].map(point => (
                <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, marginTop: '8px', opacity: 0.55 }} />
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '30px', height: '46px', padding: '0 24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the app <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: SERVICES GRID ────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '96px 24px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ maxWidth: '1040px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>Services</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Everything you need to level up
            </h2>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '12px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Six coaching services, each delivered by a verified Uni Coach matched to your goals.
            </p>
          </div>
          <div className="ebp-services-grid">
            {ELEVATION_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FIND YOUR SERVICE ────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <SectionLabel>Find your service</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              What do you need most right now?
            </h2>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '12px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Select a service to see what is included and what it costs.
            </p>
          </div>
          <FindYourService />
        </div>
      </section>

      {/* ── SECTION 4: HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            Browse, book, and get coached
          </h2>
          <div className="ebp-steps-row">
            <div className="ebp-steps-line" />
            {[
              { n: '1', title: 'Browse and book your Coach in the app', desc: 'Find a Uni Coach for your service and book directly in the app.' },
              { n: '2', title: 'Your Uni Coach prepares your service', desc: 'Your assigned Coach reviews your brief and prepares everything before your engagement.' },
              { n: '3', title: 'Delivered or delivered live', desc: 'Receive a written deliverable, attend a live session, or both, depending on your service.' },
            ].map(step => (
              <div key={step.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#F5F0E8' }}>{step.n}</span>
                </div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '17px', color: '#1E3A5F', marginTop: '16px', lineHeight: 1.3 }}>{step.title}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '100px 24px', textAlign: 'center' }}>
        <SectionLabel light>Get started</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: 'clamp(28px,4vw,44px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.12,
          maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Get the app. Get your Blueprint.
        </h2>
        <p style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '15px', color: 'rgba(245,240,232,0.6)',
          marginTop: '14px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
        }}>
          Free to join. September trial, 50% off everything.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            height: '52px', padding: '0 32px',
            background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Download the app <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" style={{
            display: 'inline-flex', alignItems: 'center',
            height: '52px', padding: '0 28px',
            background: 'transparent', color: 'rgba(245,240,232,0.75)',
            border: '1px solid rgba(245,240,232,0.2)', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            See pricing
          </Link>
        </div>
      </section>
    </>
  )
}
