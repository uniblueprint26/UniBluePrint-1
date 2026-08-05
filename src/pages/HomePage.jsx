import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FileText, TrendingUp, Tag, Users, Globe, DollarSign,
  UserCheck, Award, ArrowRight, Info,
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
    { value: time.days,    label: 'Days' },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Mins' },
    { value: time.seconds, label: 'Secs' },
  ]

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '40px' }}>
      {units.map(({ value, label }) => (
        <div key={label} style={{
          background: 'rgba(245,240,232,0.08)',
          border: '1px solid rgba(245,240,232,0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(245,240,232,0.08)',
          borderRadius: '12px', padding: '18px 24px', minWidth: '80px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '38px', color: '#F5F0E8', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', color: 'rgba(245,240,232,0.45)', marginTop: '6px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────────

const HERO_STATS = [
  { n: '35+',  label: 'Students signed up' },
  { n: '10+',  label: 'Irish universities' },
  { n: '6',    label: 'Partner businesses' },
  { n: 'Free', label: 'To join, always' },
]

const HIW_STEPS = [
  { n: '1', title: 'Create your free account', desc: 'Sign up in under a minute. No payment required.' },
  { n: '2', title: 'Choose your service',      desc: 'Select what you need and share your brief or materials.' },
  { n: '3', title: 'Reviewed by a real person', desc: 'A Campus Handler or Uni Coach prepares your output.' },
  { n: '4', title: 'Delivered, ready to use',  desc: 'Receive your finished output within your timeframe.' },
]

const PILLARS = [
  {
    name: 'Foundation Blueprint',
    description: 'CV building, LinkedIn, cover letters, interview prep, and CAO support. Every output reviewed by a trained Campus Handler.',
    href: '/foundation-blueprint',
    icon: FileText,
    link: 'Explore services →',
    bg: '#EFF6FF',
  },
  {
    name: 'Elevation Blueprint',
    description: 'Personal branding, network strategy, pitch coaching, and postgrad support. Delivered by verified Uni Coaches.',
    href: '/elevation-blueprint',
    icon: TrendingUp,
    link: 'Meet the coaches →',
    bg: '#F0FDF4',
  },
  {
    name: 'Campus Connect',
    description: 'Boards for your campus — accommodation, marketplace, carpooling, events, and community. All inside the app.',
    href: '/campus-connect',
    icon: Users,
    link: "See what's on →",
    bg: '#FFF7ED',
  },
  {
    name: 'Lifestyle Blueprint',
    description: 'Exclusive student discounts from verified Irish partners, mental health resources, and a built-in budgeting tool.',
    href: '/lifestyle-blueprint',
    icon: Tag,
    link: 'Browse deals →',
    bg: '#FDF4FF',
  },
  {
    name: 'Course Connect',
    description: 'Discussion boards, shared notes, study groups, and module Q&A — across Ireland, by subject.',
    href: '/course-connect',
    icon: Globe,
    link: 'Find your course →',
    bg: '#F0F9FF',
  },
  {
    name: 'Budgeting Tool',
    description: 'Track income and expenses, set savings goals, and understand your SUSI entitlement. Built for student life.',
    href: '/coming-soon',
    icon: DollarSign,
    link: null,
    bg: '#FFFBEB',
    comingSoon: true,
  },
]

const AD_POSTS = [
  { initial: 'A', color: '#1E3A5F', name: 'Aoife',  uni: 'University of Galway', title: 'Piano & Music Lessons',    desc: '1-to-1 lessons from a 3rd year Music student. All levels welcome. Online or in person.',          tag: 'Lessons',  price: 'From €20/hr' },
  { initial: 'L', color: '#15803D', name: 'Luca',   uni: 'UCD',                  title: 'Graphic Design Services',  desc: 'Logos, social media content, and branding for student projects and small businesses.',           tag: 'Design',   price: 'From €50'    },
  { initial: 'Z', color: '#0369A1', name: 'Zafir',  uni: 'DCU',                  title: 'Maths & Stats Grinds',     desc: 'Leaving Cert and 1st year college maths. Past papers and exam prep included.',                  tag: 'Grinds',   price: '€25/hr'      },
  { initial: 'F', color: '#7C3AED', name: 'Fatima', uni: 'TCD',                  title: 'Photography & Content',    desc: 'Events, portraits, and content creation for social media. Fast turnaround available.',           tag: 'Creative', price: 'From €60'    },
  { initial: 'E', color: '#C2410C', name: 'Emma',   uni: 'UL',                   title: 'Essay Proofreading',       desc: 'Academic proofreading and feedback from an English graduate. 24hr turnaround available.',        tag: 'Academic', price: 'From €15'    },
]

const PROOF_CARDS = [
  { initial: 'A', color: '#1E3A5F', name: 'Abdullah', uni: 'ATU Galway', course: 'Business',                badge: 'CAO: AU601' },
  { initial: 'E', color: '#15803D', name: 'Emily',    uni: 'DCU',        course: 'Accounting and Finance',  badge: 'CAO: DC115' },
  { initial: 'C', color: '#7C3AED', name: 'Ciarán',   uni: 'UL',         course: 'Computer Science',        badge: 'CAO: LM121' },
]

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

function PillarCard({ name, description, href, icon: Icon, link, bg, comingSoon }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        borderRadius: '14px', padding: '26px',
        border: '1px solid rgba(30,58,95,0.07)',
        textDecoration: 'none', color: 'inherit',
        display: 'flex', flexDirection: 'column',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 28px rgba(30,58,95,0.12)' : '0 2px 8px rgba(30,58,95,0.05)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '11px',
        background: 'rgba(255,255,255,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(30,58,95,0.1)',
      }}>
        <Icon size={22} color="#1E3A5F" strokeWidth={1.9} />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: '18px', color: '#1E3A5F', marginTop: '18px', lineHeight: 1.2,
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6, flex: 1,
      }}>
        {description}
      </p>
      {comingSoon ? (
        <span style={{
          display: 'inline-block', marginTop: '18px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#9CA3AF',
          border: '1px solid rgba(30,58,95,0.12)', borderRadius: '4px', padding: '3px 8px',
        }}>
          Coming Sept
        </span>
      ) : (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700', color: '#1E3A5F',
          marginTop: '18px', opacity: hovered ? 1 : 0.55,
          letterSpacing: '0.01em', transition: 'opacity 150ms',
        }}>
          {link}
        </p>
      )}
    </Link>
  )
}

// ─── HomePage ──────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes ubp-pulse-dot {
    0%, 100% { opacity: 1 }
    50%       { opacity: 0.35 }
  }
  .ubp-badge-dot {
    animation: ubp-pulse-dot 2.4s ease infinite;
  }
  .ubp-pillar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 52px;
  }
  .ubp-adboard-scroll {
    display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px;
    margin-top: 32px; scroll-snap-type: x mandatory;
    scrollbar-width: thin; scrollbar-color: rgba(30,58,95,0.15) transparent;
  }
  .ubp-adboard-scroll::-webkit-scrollbar { height: 4px }
  .ubp-adboard-scroll::-webkit-scrollbar-track { background: transparent }
  .ubp-adboard-scroll::-webkit-scrollbar-thumb { background: rgba(30,58,95,0.15); border-radius: 4px }
  .ubp-quality-link { opacity: 0.55; transition: opacity 150ms; }
  .ubp-quality-link:hover { opacity: 1; }
  .ubp-store-btn {
    background: none; border: 1px solid rgba(245,240,232,0.18); border-radius: 8px;
    padding: 10px 22px; font-family: inherit; font-size: 12px; color: rgba(245,240,232,0.45);
    cursor: pointer; transition: border-color 150ms, color 150ms;
  }
  .ubp-store-btn:hover { border-color: rgba(245,240,232,0.35); color: rgba(245,240,232,0.7) }
  @media (max-width: 800px) {
    .ubp-pillar-grid { grid-template-columns: repeat(2, 1fr) !important }
    .ubp-hiw-connector { display: none !important }
    .ubp-hiw-steps { flex-wrap: wrap !important; gap: 32px !important }
    .ubp-hiw-step { flex: 0 0 calc(50% - 16px) !important; min-width: 0 !important }
  }
  @media (max-width: 600px) {
    .ubp-pillar-grid { grid-template-columns: 1fr !important }
    .ubp-quality-grid { grid-template-columns: 1fr !important }
    .ubp-proof-grid { grid-template-columns: 1fr !important }
    .ubp-hero-stats { flex-direction: column !important; align-items: center !important }
    .ubp-hero-stat + .ubp-hero-stat { border-left: none !important; border-top: 1px solid rgba(30,58,95,0.1) !important; padding-top: 20px !important }
    .ubp-hiw-step { flex: 0 0 100% !important }
    .ubp-hero-ctas { flex-direction: column !important; width: 100% !important }
    .ubp-hero-ctas a { width: 100% !important; box-sizing: border-box !important }
  }
`

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
          sameAs: [
            'https://www.instagram.com/uniblueprint26',
            'https://www.tiktok.com/@uniblueprint26',
          ],
          address: { '@type': 'PostalAddress', addressCountry: 'IE' },
        })}</script>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#F5F0E8',
        padding: '88px 24px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', minHeight: '94dvh', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Radial depth glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(30,58,95,0.07) 0%, transparent 70%)',
        }} />

        {/* UBP lockup */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '28px', textAlign: 'left' }}>
          <p style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '42px', lineHeight: 1, color: '#1E3A5F', letterSpacing: '-0.01em',
          }}>
            UBP
          </p>
          <div style={{ height: '2px', background: '#1E3A5F', marginTop: '6px' }} />
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#1E3A5F', letterSpacing: '2px',
            marginTop: '7px', opacity: 0.7, fontWeight: 500,
          }}>
            UniBlueprint
          </p>
        </div>

        {/* Pulsing launch badge */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '5px 13px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          <span className="ubp-badge-dot" aria-hidden="true" style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4ade80', flexShrink: 0,
          }} />
          September Trial &middot; 50% off every service
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 'clamp(38px, 5.5vw, 60px)', lineHeight: 1.1, color: '#1E3A5F',
          marginTop: '22px', maxWidth: '720px', letterSpacing: '-0.02em',
          position: 'relative', zIndex: 1,
        }}>
          The Structure Behind Your Success
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px', color: '#6B7280',
          marginTop: '18px', maxWidth: '540px', lineHeight: 1.7,
          position: 'relative', zIndex: 1,
        }}>
          The all-in-one platform for students, apprentices, and young people across Ireland — CV support, career coaching, campus community, and lifestyle deals.
        </p>

        {/* CTAs */}
        <div className="ubp-hero-ctas" style={{
          display: 'flex', gap: '12px', marginTop: '32px',
          flexWrap: 'wrap', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <Link to="/sign-up" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            height: '52px', padding: '0 30px', background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Get started free
            <ArrowRight size={16} />
          </Link>
          <Link to="/how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 28px', background: 'transparent', color: '#1E3A5F',
            border: '1.5px solid rgba(30,58,95,0.25)', borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            See how it works
          </Link>
        </div>

        {/* Stats strip */}
        <div className="ubp-hero-stats" style={{
          position: 'relative', zIndex: 1,
          display: 'flex', marginTop: '64px', flexWrap: 'wrap', justifyContent: 'center',
          borderTop: '1px solid rgba(30,58,95,0.12)', paddingTop: '40px',
          width: '100%', maxWidth: '720px',
        }}>
          {HERO_STATS.map((s, i) => (
            <div key={s.label} className="ubp-hero-stat" style={{
              flex: 1, minWidth: '120px', textAlign: 'center', padding: '0 28px',
              borderLeft: i > 0 ? '1px solid rgba(30,58,95,0.1)' : 'none',
            }}>
              <p style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '30px', color: '#1E3A5F', lineHeight: 1,
              }}>
                {s.n}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#9CA3AF', marginTop: '5px', fontWeight: 500,
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2 — HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
          }}>
            Your Blueprint in four steps
          </h2>

          <div className="ubp-hiw-steps" style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', maxWidth: '860px', margin: '56px auto 0',
          }}>
            {HIW_STEPS.map((step, i) => (
              <Fragment key={step.n}>
                <div className="ubp-hiw-step" style={{ flex: 1, textAlign: 'center', padding: '0 16px', minWidth: 0 }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: '#1E3A5F', color: '#F5F0E8',
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto', flexShrink: 0,
                  }}>
                    {step.n}
                  </div>
                  <p style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '16px', color: '#1E3A5F', marginTop: '16px', lineHeight: 1.3,
                  }}>
                    {step.title}
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.55,
                  }}>
                    {step.desc}
                  </p>
                </div>
                {i < HIW_STEPS.length - 1 && (
                  <div className="ubp-hiw-connector" style={{
                    flexShrink: 0, width: '80px',
                    borderTop: '1.5px dashed rgba(30,58,95,0.18)',
                    marginTop: '26px', alignSelf: 'flex-start',
                  }} />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — FIVE PILLARS ─────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>Everything in one place</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
          }}>
            Five pillars. One platform.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '14px auto 0', maxWidth: '480px', lineHeight: 1.65,
          }}>
            Everything a student needs — from a polished CV to finding your study group — in a single app.
          </p>

          <div className="ubp-pillar-grid">
            {PILLARS.map(p => <PillarCard key={p.name} {...p} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — SEPTEMBER TRIAL ─────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '88px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.03) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.03) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>September 2026 &mdash; Limited Time</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            50% Off.<br />Every service. All month.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.65)',
            margin: '16px auto 0', maxWidth: '440px', lineHeight: 1.65,
          }}>
            CVs, LinkedIn profiles, cover letters, career coaching — every service at half price for the entire month. Free to join, no card needed.
          </p>

          <CountdownTimer />

          <div style={{ marginTop: '40px' }}>
            <Link to="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', padding: '0 30px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Get started free
              <ArrowRight size={16} />
            </Link>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.38)', marginTop: '14px',
          }}>
            No credit card required.
          </p>
        </div>
      </section>

      {/* ── SECTION 5 — AD BOARD PREVIEW ────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>Advertisement Board</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.2,
            }}>
              Students helping students
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              margin: '14px auto 0', maxWidth: '500px', lineHeight: 1.65,
            }}>
              Students can post services, gigs, and opportunities — from grinds to graphic design. Free to post. Visible across Ireland.
            </p>
          </div>

          <div className="ubp-adboard-scroll">
            {AD_POSTS.map(post => (
              <div key={post.name} style={{
                flexShrink: 0, width: '268px', background: '#FFFFFF', borderRadius: '14px',
                boxShadow: '0 2px 12px rgba(30,58,95,0.08)', padding: '20px',
                display: 'flex', flexDirection: 'column', scrollSnapAlign: 'start',
                border: '1px solid rgba(30,58,95,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: post.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '14px', color: '#F5F0E8' }}>
                      {post.initial}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                      {post.name}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
                      {post.uni}
                    </p>
                  </div>
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '15px', color: '#1E3A5F', lineHeight: 1.3,
                }}>
                  {post.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5, flex: 1,
                }}>
                  {post.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{
                    background: '#F5F0E8', color: '#1E3A5F', borderRadius: '5px',
                    padding: '3px 9px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                  }}>
                    {post.tag}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#1E3A5F',
                  }}>
                    {post.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: '#FFFFFF', borderRadius: '10px', borderLeft: '3px solid #1E3A5F',
            padding: '14px 18px', marginTop: '32px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', maxWidth: '500px',
          }}>
            <Info size={16} color="#1E3A5F" strokeWidth={2} style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#1E3A5F' }}>Example content.</strong>{' '}
              These are sample posts. Real posts are created by students after launch in September.
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — WHO'S USING IT ──────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>Who's using UniBlueprint</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
          }}>
            Built for students across Ireland
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '14px auto 0', maxWidth: '460px', lineHeight: 1.65,
          }}>
            From UCD to ATU, from Business to Nursing — UniBlueprint is open to every student in Ireland.
          </p>

          <div className="ubp-proof-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '48px',
          }}>
            {PROOF_CARDS.map(card => (
              <div key={card.name} style={{
                background: '#F5F0E8', borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(30,58,95,0.07)',
                padding: '20px', border: '1px solid rgba(30,58,95,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '18px', color: '#fff' }}>
                      {card.initial}
                    </span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '15px', color: '#1E3A5F' }}>
                      {card.name}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      {card.uni}
                    </p>
                  </div>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '10px' }}>
                  {card.course}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '10px',
                  background: '#FFFFFF', borderRadius: '5px', padding: '3px 10px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '700', color: '#1E3A5F',
                }}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — QUALITY / PEOPLE ────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '88px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <SectionLabel>Quality you can count on</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
            maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Reviewed by real people.<br />Every time.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '14px auto 0', maxWidth: '500px', lineHeight: 1.65,
          }}>
            Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Every Elevation service is delivered by a verified Uni Coach. No automation, no shortcuts.
          </p>

          <div className="ubp-quality-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
            maxWidth: '820px', margin: '52px auto 0',
          }}>
            {/* Campus Handler */}
            <div style={{
              background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px',
              border: '1px solid rgba(30,58,95,0.08)', textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              }}>
                <UserCheck size={30} color="#F5F0E8" strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '22px', color: '#1E3A5F', marginTop: '20px',
              }}>
                Campus Handler
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280', marginTop: '12px', lineHeight: 1.65,
              }}>
                Trained students who review every Foundation Blueprint submission — CVs, essays, and applications — before it reaches you.
              </p>
              <Link to="/join#handler-form" className="ubp-quality-link" style={{
                display: 'inline-block', marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '700', color: '#1E3A5F', textDecoration: 'none',
              }}>
                Become a Handler →
              </Link>
            </div>

            {/* Uni Coach */}
            <div style={{
              background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px',
              border: '1px solid rgba(30,58,95,0.08)', textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              }}>
                <Award size={30} color="#F5F0E8" strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '22px', color: '#1E3A5F', marginTop: '20px',
              }}>
                Uni Coach
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280', marginTop: '12px', lineHeight: 1.65,
              }}>
                Verified specialists delivering Elevation Blueprint services — career coaching, personal branding, and postgrad strategy.
              </p>
              <Link to="/join#coach-form" className="ubp-quality-link" style={{
                display: 'inline-block', marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '700', color: '#1E3A5F', textDecoration: 'none',
              }}>
                Apply as a Coach →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 8 — FINAL CTA ────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '100px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.03) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.03) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Get started today</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
            maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Your Blueprint starts here
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            margin: '16px auto 0', maxWidth: '420px', lineHeight: 1.6,
          }}>
            Free to join. No credit card. September trial — 50% off everything.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginTop: '36px', flexWrap: 'wrap',
          }}>
            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', padding: '0 30px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the App
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
            <button className="ubp-store-btn">App Store</button>
            <button className="ubp-store-btn">Google Play</button>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginTop: '18px',
          }}>
            No credit card required. Free forever to join.
          </p>
        </div>
      </section>
    </>
  )
}
