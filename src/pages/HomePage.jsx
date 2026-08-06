import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles, ArrowRight,
  FileText, TrendingUp, Tag, Users, Globe,
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

// ─── PillarRow ─────────────────────────────────────────────────────────────────

function PillarRow({ name, description, href, icon: Icon, link }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '28px',
        padding: '34px 0',
        borderTop: '1px solid rgba(30,58,95,0.09)',
        textDecoration: 'none', color: 'inherit',
        transition: 'opacity 150ms',
      }}
    >
      <div style={{
        width: '52px', height: '52px', flexShrink: 0, borderRadius: '12px',
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 6px rgba(30,58,95,0.1)', marginTop: '2px',
        transition: 'box-shadow 150ms',
        ...(hovered ? { boxShadow: '0 4px 14px rgba(30,58,95,0.18)' } : {}),
      }}>
        <Icon size={24} color="#1E3A5F" strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '21px', color: '#1E3A5F', lineHeight: 1.2,
        }}>
          {name}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#6B7280',
          marginTop: '8px', lineHeight: 1.6, maxWidth: '600px',
        }}>
          {description}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: '700', color: '#1E3A5F',
          marginTop: '14px',
          opacity: hovered ? 1 : 0.45,
          transition: 'opacity 150ms',
        }}>
          {link}
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
    description: 'CV building, LinkedIn optimisation, cover letters, personal statements, interview prep, and CAO support — every output reviewed by a trained Campus Handler before delivery.',
    href: '/foundation-blueprint',
    icon: FileText,
    link: 'Explore services →',
  },
  {
    name: 'Elevation Blueprint',
    description: 'Personal branding, network strategy, portfolio building, pitch coaching, and postgrad support — delivered by specialist Uni Coaches. Book a coach, work with them directly in the app.',
    href: '/elevation-blueprint',
    icon: TrendingUp,
    link: 'Meet the coaches →',
  },
  {
    name: 'Campus Connect',
    description: 'Community boards for your campus — accommodation, marketplace, carpooling, events, and more. The student community layer that lives inside the same app.',
    href: '/campus-connect',
    icon: Users,
    link: "See what's on →",
  },
  {
    name: 'Lifestyle Blueprint',
    description: 'Exclusive student discounts from verified Irish partners, mental health support resources, and a built-in budgeting tool — all curated for campus life.',
    href: '/lifestyle-blueprint',
    icon: Tag,
    link: 'Browse deals →',
  },
  {
    name: 'Course Connect',
    description: 'Course-specific discussion boards, shared notes, study groups, and module Q&A — collaborate with young people studying the same subjects across Ireland.',
    href: '/course-connect',
    icon: Globe,
    link: 'Find your course →',
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

  /* Pillars */
  .ubp-quality-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; max-width: 820px; margin: 52px auto 0;
  }

  @media (max-width: 860px) {
    .ubp-glass-inner  { flex-direction: column; text-align: center }
    .ubp-glass-text   { text-align: center }
    .ubp-glass-phone  { display: none }
    .ubp-glass-phone.ubp-right { display: block }
  }
  @media (max-width: 600px) {
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

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────────── */}
      <section style={{
        background: '#F5F0E8',
        minHeight: '92dvh',
        padding: '80px 24px 80px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '5px 13px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em',
        }}>
          <span className="ubp-badge-dot" aria-hidden="true" style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4ade80', flexShrink: 0,
          }} />
          September Trial &middot; 50% off every service
        </div>

        {/* Headline */}
        <h1 className="ubp-hero-headline">
          The Structure Behind Your Success
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px', color: '#6B7280',
          marginTop: '18px', maxWidth: '520px', lineHeight: 1.65,
        }}>
          The all-in-one app for students, apprentices, and young people across Ireland — CV support, coaching, campus community, and lifestyle deals.
        </p>

        {/* CTAs */}
        <div className="ubp-cta-row">
          <Link to="/sign-up" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            height: '52px', padding: '0 32px',
            background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Get started free <ArrowRight size={16} />
          </Link>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 28px',
            background: 'transparent', color: '#1E3A5F',
            border: '1.5px solid rgba(30,58,95,0.25)', borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Download the app
          </Link>
        </div>

      </section>

      {/* ── SECTION 2 — GLASS BOX: THE APP ──────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '96px 24px',
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
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.5vw, 42px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.15,
              textWrap: 'balance',
            }}>
              The structure behind your success
            </h2>
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

      {/* ── SECTION 3 — PILLARS (interactive) ───────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <SectionLabel>Everything in one place</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(30px, 4vw, 42px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.15,
            }}>
              Five pillars. One platform.
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '14px', maxWidth: '480px',
              marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Everything a young person in Ireland needs, from a polished CV to finding your study group, in a single app.
            </p>
          </div>

          <div>
            {PILLARS_DATA.map(p => <PillarRow key={p.name} {...p} />)}
            <div style={{ borderTop: '1px solid rgba(30,58,95,0.09)' }} />
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
