import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles, ArrowRight,
  FileText, TrendingUp, Tag, Users, Globe, Megaphone, PiggyBank,
  UserCheck, Award,
} from 'lucide-react'

// ─── Countdown ─────────────────────────────────────────────────────────────────

const TRIAL_END = new Date('2026-09-30T22:59:59Z')

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
    { value: time.days,    label: 'Days'  },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Mins'  },
    { value: time.seconds, label: 'Secs'  },
  ]
  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '36px' }}>
      {units.map(({ value, label }) => (
        <div key={label} style={{
          background: 'rgba(245,240,232,0.09)',
          border: '1px solid rgba(245,240,232,0.14)',
          borderRadius: '12px', padding: '16px 22px', minWidth: '76px', textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '36px', color: '#F5F0E8', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
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

// ─── PhoneMockup ───────────────────────────────────────────────────────────────
// Clean bezel frame — no dynamic island overlay so nothing is cut off.

function PhoneMockup({ src, alt, width = 250, style = {} }) {
  const screenW = width - 16
  const screenH = Math.round(screenW * (852 / 393))
  return (
    <div style={{
      width,
      borderRadius: '44px',
      background: '#0c1520',
      padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0,
      position: 'relative',
      ...style,
    }}>
      {/* Side buttons */}
      <div style={{ position: 'absolute', right: '-3px', top: '96px',  width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left:  '-3px', top: '76px',  width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left:  '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      {/* Screen — screenshot fills cleanly, no overlay cutting content */}
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: screenW, height: screenH, background: '#F5F0E8' }}>
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
      </div>
      {/* Home indicator */}
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

// ─── SectionLabel ──────────────────────────────────────────────────────────────

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

// ─── PillarCard ────────────────────────────────────────────────────────────────
// Glass card with hover peek panel — slides up to reveal live-style activity dots.

function PillarCard({ name, slogan, description, href, icon: Icon, accent, accentRgb, peek }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: hovered ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.85)',
        borderTop: `3px solid ${accent}`,
        padding: '28px 26px 24px',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 52px rgba(${accentRgb},0.13), 0 4px 16px rgba(0,0,0,0.07)`
          : '0 2px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
        transition: 'all 220ms ease',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: `rgba(${accentRgb},0.10)`,
        border: `1px solid rgba(${accentRgb},0.14)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={accent} strokeWidth={1.8} />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: '19px', color: '#1E3A5F',
        marginTop: '16px', lineHeight: 1.2,
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', fontWeight: '700', color: accent,
        marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {slogan}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '10px', lineHeight: 1.65, flex: 1,
      }}>
        {description}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', fontWeight: '700', color: accent,
        marginTop: '16px', letterSpacing: '0.01em',
        opacity: hovered ? 0 : 0.45,
        transition: 'opacity 160ms',
      }}>
        Explore →
      </p>

      {/* Peek panel — slides up on hover */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '32px 26px 22px',
        background: `linear-gradient(to top, rgba(255,255,255,0.99) 60%, transparent)`,
        transform: hovered ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 260ms cubic-bezier(.4,0,.2,1)',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
          {peek.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: accent, flexShrink: 0,
              }} />
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: `rgba(${accentRgb},0.8)`, lineHeight: 1.4,
              }}>
                {item}
              </p>
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700', color: accent,
          letterSpacing: '0.01em',
        }}>
          Explore {name} →
        </p>
      </div>
    </Link>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────────

const STATS = [
  { n: 'Open',  label: 'Available to every young person' },
  { n: 'IE',    label: 'Across Ireland'                  },
  { n: 'Free',  label: 'To join, always'                 },
]

const PILLARS_DATA = [
  {
    name: 'Foundation Blueprint',
    slogan: 'Build the CV. Own the room.',
    description: 'CV building, LinkedIn optimisation, cover letters, personal statements, interview prep, and CAO support — every output reviewed by a trained Campus Handler.',
    href: '/foundation-blueprint',
    icon: FileText,
    accent: '#1E3A5F',
    accentRgb: '30,58,95',
    peek: [
      'CV submitted and under review by your Campus Handler',
      'Cover letter completed and delivered',
      'Interview prep session confirmed',
      '3 of 4 Foundation milestones complete',
    ],
  },
  {
    name: 'Elevation Blueprint',
    slogan: 'Go beyond the degree.',
    description: 'Personal branding, network strategy, portfolio building, pitch coaching, and postgrad support — delivered by verified Uni Coaches, booked directly in the app.',
    href: '/elevation-blueprint',
    icon: TrendingUp,
    accent: '#2D4B8E',
    accentRgb: '45,75,142',
    peek: [
      'Coach session booked: tomorrow at 2:00 PM',
      'Personal brand score: 72%',
      'Network growth: +14 connections this month',
      'Portfolio: 3 new pieces added',
    ],
  },
  {
    name: 'Lifestyle Blueprint',
    slogan: 'Live smart. Spend less.',
    description: 'Exclusive discounts from verified Irish partners, mental health resources, and lifestyle deals curated for campus life across Ireland.',
    href: '/lifestyle-blueprint',
    icon: Tag,
    accent: '#145A3E',
    accentRgb: '20,90,62',
    peek: [
      '2 new partner discounts unlocked this week',
      'Career fair nearby: UCD, this Friday',
      'Featured partner: Headspace 40% off',
      'Mental wellbeing resources updated',
    ],
  },
  {
    name: 'Campus Connect',
    slogan: 'Your campus. Your community.',
    description: 'Community boards for your college — accommodation, marketplace, carpooling, events, study groups, and more. 100+ institutions across Ireland.',
    href: '/campus-connect',
    icon: Users,
    accent: '#7C3500',
    accentRgb: '124,53,0',
    peek: [
      '7 accommodation posts near your campus',
      '23 marketplace listings active right now',
      '4 carpool offers available this week',
      '2 study groups looking for members',
    ],
  },
  {
    name: 'Course Connect',
    slogan: 'Study smarter, together.',
    description: 'Course-specific discussion boards, shared notes, study groups, and module Q&A — collaborate with young people on the same course across Ireland.',
    href: '/course-connect',
    icon: Globe,
    accent: '#4C1D95',
    accentRgb: '76,29,149',
    peek: [
      '14 new posts in your course board today',
      '6 shared notes uploaded this week',
      'Module Q&A: 3 questions answered',
      'Study group forming for Thursday',
    ],
  },
  {
    name: 'Ad Board',
    slogan: 'Buy. Sell. Connect.',
    description: 'The student marketplace. Post services, sell items, find gigs, and connect with other young people across campuses and counties.',
    href: '/ad-board',
    icon: Megaphone,
    accent: '#1B4B5A',
    accentRgb: '27,75,90',
    peek: [
      'Photography services: 3 enquiries received',
      'Textbooks listed: 2 sold this week',
      'Gig posted: social media help wanted',
      'New listing alert in your area',
    ],
  },
  {
    name: 'Budgeting Tool',
    slogan: 'Know your money. Plan your future.',
    description: 'Track spending, set budgets, and navigate SUSI grants — with a built-in SUSI eligibility guide so you always know what support you can claim.',
    href: '/budgeting',
    icon: PiggyBank,
    accent: '#134E4A',
    accentRgb: '19,78,74',
    peek: [
      'Monthly budget: 68% remaining',
      'SUSI eligibility: you may qualify for full grant',
      'Biggest spend this week: groceries',
      'Tip: rent allowance deadline is Oct 1',
    ],
  },
]

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes ubp-pulse {
    0%, 100% { opacity: 1 }
    50%       { opacity: 0.3 }
  }
  .ubp-badge-dot { animation: ubp-pulse 2.4s ease infinite }

  /* Hero */
  .ubp-hero-headline {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(38px, 6vw, 68px);
    color: #1E3A5F; line-height: 1.08;
    letter-spacing: -0.02em;
    max-width: 680px; margin: 20px auto 0;
    text-wrap: balance;
  }
  .ubp-cta-row {
    display: flex; gap: 12px; justify-content: center;
    flex-wrap: wrap; margin-top: 32px;
  }

  /* Glass showcase */
  .ubp-glass-inner {
    display: flex; align-items: center; gap: 48px;
    max-width: 1040px; margin: 0 auto;
  }
  .ubp-glass-phone { flex-shrink: 0 }
  .ubp-glass-text  { flex: 1; min-width: 0; text-align: center }

  /* Pillars grid */
  .ubp-pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: stretch;
  }
  .ubp-pillars-grid > a {
    min-height: 280px;
  }
  /* Last item (7th) sits in col 2 of 3 — centred */
  .ubp-pillars-grid > *:last-child:nth-child(3n + 1) {
    grid-column: 2;
  }

  /* Quality grid */
  .ubp-quality-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; max-width: 820px; margin: 52px auto 0;
  }

  @media (max-width: 960px) {
    .ubp-pillars-grid { grid-template-columns: repeat(2, 1fr) }
    .ubp-pillars-grid > *:last-child:nth-child(3n + 1) { grid-column: auto }
  }
  @media (max-width: 860px) {
    .ubp-glass-inner  { flex-direction: column; text-align: center }
    .ubp-glass-text   { text-align: center }
    .ubp-glass-phone  { display: none }
    .ubp-glass-phone.ubp-right { display: block }
  }
  @media (max-width: 600px) {
    .ubp-pillars-grid { grid-template-columns: 1fr }
    .ubp-quality-grid { grid-template-columns: 1fr }
    .ubp-cta-row a    { width: 100%; box-sizing: border-box }
    .ubp-cta-row      { flex-direction: column !important }
  }
`

// ─── HomePage ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>UniBlueprint — The Structure Behind Your Success</title>
        <meta name="description" content="The all-in-one platform for students, apprentices, and young people across Ireland. CV support, career coaching, campus community, and lifestyle deals. Launching September 2026." />
        <meta property="og:title" content="UniBlueprint — The Structure Behind Your Success" />
        <meta property="og:description" content="The all-in-one platform for students, apprentices, and young people across Ireland. CV support, career coaching, campus community, and lifestyle deals. Launching September 2026." />
        <meta name="twitter:card" content="summary_large_image" />
        <style>{PAGE_STYLES}</style>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'UniBlueprint',
          url: 'https://uniblueprint.com',
          description: 'The all-in-one platform for students, apprentices, and young people across Ireland.',
          sameAs: ['https://www.instagram.com/uniblueprint26', 'https://www.tiktok.com/@uniblueprint26'],
          address: { '@type': 'PostalAddress', addressCountry: 'IE' },
        })}</script>
      </Helmet>

      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#1E3A5F',
        borderBottom: '1px solid rgba(245,240,232,0.1)',
        padding: '10px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: '600',
          color: '#F5F0E8', letterSpacing: '0.02em',
        }}>
          <span style={{ opacity: 0.6, marginRight: '8px' }}>🎓</span>
          50% off all services during the September Trial.{' '}
          <Link to="/sign-up" style={{
            color: '#F5F0E8', textDecoration: 'underline',
            textUnderlineOffset: '3px', opacity: 0.85,
          }}>
            Get started free
          </Link>
        </p>
      </div>

      {/* ── SECTION 1 — GLASS BOX: THE APP ──────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '120px 24px 96px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div className="ubp-glass-inner" style={{ position: 'relative', zIndex: 1 }}>

          {/* Left phone */}
          <div className="ubp-glass-phone">
            <PhoneMockup
              src="/app-screens/home.png"
              alt="UniBlueprint home screen"
              width={230}
              style={{ transform: 'rotate(-3deg) translateY(10px)' }}
            />
          </div>

          {/* Centre text — glass card */}
          <div className="ubp-glass-text" style={{
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
          }}>
            <SectionLabel light>The App</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(30px, 3.8vw, 48px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
              textWrap: 'balance',
            }}>
              The Structure Behind Your Success
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              One app. Five pillars. Everything a young person in Ireland needs to build a CV, connect with their campus, find study groups, and land opportunities — all in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {[
                'CV and career documents, reviewed by real people',
                'Campus community boards for your college',
                'Lifestyle deals from verified Irish partners',
                'Course groups and shared notes',
              ].map(point => (
                <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, marginTop: '7px', opacity: 0.6 }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: 0, marginTop: '32px',
              borderTop: '1px solid rgba(245,240,232,0.12)', paddingTop: '24px',
            }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center',
                  paddingLeft: i > 0 ? '16px' : 0,
                  paddingRight: i < STATS.length - 1 ? '16px' : 0,
                  borderLeft: i > 0 ? '1px solid rgba(245,240,232,0.12)' : 'none',
                }}>
                  <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#F5F0E8', lineHeight: 1 }}>
                    {s.n}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(245,240,232,0.45)', marginTop: '4px', fontWeight: 500 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Pillar pills */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Foundation', 'Elevation', 'Lifestyle', 'Connect'].map(pillar => (
                <span key={pillar} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px', fontWeight: 600, color: 'rgba(245,240,232,0.7)',
                  border: '1px solid rgba(245,240,232,0.2)',
                  borderRadius: '20px', padding: '4px 12px',
                  letterSpacing: '0.04em',
                }}>
                  {pillar}
                </span>
              ))}
            </div>

            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '28px', height: '46px', padding: '0 24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the app <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right phone */}
          <div className="ubp-glass-phone ubp-right">
            <PhoneMockup
              src="/app-screens/messages.png"
              alt="UniBlueprint messages screen"
              width={230}
              style={{ transform: 'rotate(3deg) translateY(10px)' }}
            />
          </div>

        </div>
      </section>

      {/* ── SECTION 3 — PILLARS GRID ─────────────────────────────────────────── */}
      <section style={{
        background: '#EDE8DF',
        padding: '96px 24px',
        position: 'relative',
      }}>
        {/* Subtle dot grid — gives the glass cards something to blur against */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(30,58,95,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ maxWidth: '1080px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel>Everything in one place</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(30px, 4vw, 44px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Seven features. One app.
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '14px', maxWidth: '480px',
              marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Everything a young person in Ireland needs — from a polished CV to SUSI guidance — in a single app.
            </p>
          </div>

          <div className="ubp-pillars-grid">
            {PILLARS_DATA.map(p => <PillarCard key={p.name} {...p} />)}
          </div>

        </div>
      </section>

      {/* ── SECTION 4 — QUALITY / PEOPLE ────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <SectionLabel>Quality you can count on</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
            maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Reviewed by real people. Every time.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '14px auto 0', maxWidth: '480px', lineHeight: 1.65,
          }}>
            Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Every Elevation service is delivered by a verified Uni Coach. No automation, no shortcuts.
          </p>

          <div className="ubp-quality-grid">
            {[
              {
                Icon: UserCheck, title: 'Campus Handler',
                body: 'Trained students who review every Foundation Blueprint submission — CVs, essays, and applications — before it reaches you.',
                cta: 'Become a Handler →', href: '/join#handler-form',
              },
              {
                Icon: Award, title: 'Uni Coach',
                body: 'Verified specialists delivering Elevation Blueprint services — career coaching, personal branding, and postgrad strategy.',
                cta: 'Apply as a Coach →', href: '/join#coach-form',
              },
            ].map(({ Icon, title, body, cta, href }) => (
              <div key={title} style={{
                background: '#F5F0E8', borderRadius: '14px', padding: '36px 32px',
                border: '1px solid rgba(30,58,95,0.08)', textAlign: 'center',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                }}>
                  <Icon size={28} color="#F5F0E8" strokeWidth={1.8} />
                </div>
                <h3 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '22px', color: '#1E3A5F', marginTop: '20px',
                }}>
                  {title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280', marginTop: '12px', lineHeight: 1.65,
                }}>
                  {body}
                </p>
                <Link to={href} style={{
                  display: 'inline-block', marginTop: '20px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '700', color: '#1E3A5F',
                  textDecoration: 'none', opacity: 0.55,
                }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — SEPTEMBER TRIAL ─────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '96px 24px', textAlign: 'center',
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
          <SectionLabel light>September 2026 — Limited Time</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            50% off. Every service.<br />All of September.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            margin: '16px auto 0', maxWidth: '420px', lineHeight: 1.65,
          }}>
            CVs, LinkedIn profiles, cover letters, career coaching — every service at half price. Free to join.
          </p>
          <CountdownTimer />
          <div style={{ marginTop: '36px' }}>
            <Link to="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', padding: '0 32px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginTop: '14px',
          }}>
            No credit card required.
          </p>
        </div>
      </section>

      {/* ── SECTION 6 — FINAL CTA ────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '100px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(245,240,232,0.08)',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Get started today</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
            maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Your Blueprint starts here
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            margin: '16px auto 0', maxWidth: '400px', lineHeight: 1.6,
          }}>
            Free to join. No credit card. September trial — 50% off everything.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginTop: '36px', flexWrap: 'wrap',
          }}>
            <Link to="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', padding: '0 28px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 24px',
              background: 'transparent', color: 'rgba(245,240,232,0.75)',
              border: '1px solid rgba(245,240,232,0.2)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the app
            </Link>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.3)', marginTop: '18px',
          }}>
            No credit card required. Free forever to join.
          </p>
        </div>
      </section>
    </>
  )
}
