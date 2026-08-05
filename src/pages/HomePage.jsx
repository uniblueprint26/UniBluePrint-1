import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  FileText, TrendingUp, Tag, Users, Globe,
  UserCheck, Award, ArrowRight,
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
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '36px' }}>
      {units.map(({ value, label }) => (
        <div key={label} style={{
          background: 'rgba(245,240,232,0.1)',
          border: '1px solid rgba(245,240,232,0.15)',
          borderRadius: '10px', padding: '16px 20px', minWidth: '72px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#F5F0E8', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', color: 'rgba(245,240,232,0.5)', marginTop: '5px',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────────

const STATS = [
  { n: '35+',  label: 'Students signed up' },
  { n: '10+',  label: 'Irish universities' },
  { n: 'Free', label: 'To join, always' },
]

const PILLARS = [
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
    description: 'Course-specific discussion boards, shared notes, study groups, and module Q&A — collaborate with students studying the same subjects across Ireland.',
    href: '/course-connect',
    icon: Globe,
    link: 'Find your course →',
  },
]

// ─── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.5)' : '#9CA3AF',
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
        borderTop: '1px solid rgba(30,58,95,0.1)',
        textDecoration: 'none', color: 'inherit',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '52px', height: '52px', flexShrink: 0, borderRadius: '12px',
        background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 6px rgba(30,58,95,0.1)', marginTop: '2px',
      }}>
        <Icon size={24} color="#1E3A5F" strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Serif Display', serif",
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
          marginTop: '14px', letterSpacing: '0.01em',
          opacity: hovered ? 1 : 0.55,
          transition: 'opacity 150ms',
        }}>
          {link}
        </p>
      </div>
    </Link>
  )
}

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

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92dvh',
        background: '#F5F0E8',
        padding: '80px 24px 72px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        {/* Launch badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '5px 13px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em',
        }}>
          <Sparkles size={13} />
          September Trial &middot; 50% off every service
        </div>

        {/* Headline */}
        <h1 className="hero-headline" style={{
          fontFamily: "'DM Serif Display', serif",
          color: '#1E3A5F', textAlign: 'center',
          marginTop: '20px', maxWidth: '700px',
        }}>
          The Structure Behind Your Success
        </h1>

        {/* Subheadline */}
        <p className="hero-subheadline" style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#6B7280', textAlign: 'center',
          marginTop: '18px', maxWidth: '540px', lineHeight: 1.65,
          fontSize: '17px',
        }}>
          The all-in-one platform for students, apprentices, and young people across Ireland — CV support, career coaching, campus community, and lifestyle deals.
        </p>

        {/* CTAs */}
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link to="/sign-up" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            height: '52px', minWidth: '180px', padding: '0 32px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Get started free
            <ArrowRight size={16} />
          </Link>
          <Link to="/how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', minWidth: '160px', padding: '0 28px',
            background: 'transparent', color: '#1E3A5F',
            border: '1.5px solid rgba(30,58,95,0.25)',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            See how it works
          </Link>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          marginTop: '48px', letterSpacing: '0.04em',
        }}>
          Launching September 2026
        </p>
      </section>

      {/* ── SECTION 2 — STATS ──────────────────────────────────────────────── */}
      <section style={{
        background: '#FFFFFF',
        borderTop: '1px solid rgba(30,58,95,0.1)',
        borderBottom: '1px solid rgba(30,58,95,0.1)',
        padding: '56px 24px',
      }}>
        <div style={{
          maxWidth: '1040px', margin: '0 auto',
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {STATS.map(({ n, label }, i) => (
            <div key={label} style={{
              flex: '1', minWidth: '160px', maxWidth: '240px',
              textAlign: 'center', padding: '0 32px',
              borderLeft: i > 0 ? '1px solid rgba(30,58,95,0.1)' : 'none',
            }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '40px', color: '#1E3A5F', lineHeight: 1,
              }}>
                {n}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#9CA3AF', marginTop: '6px', fontWeight: '500',
              }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3 — PILLARS ────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <SectionLabel>Everything in one place</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(30px, 4vw, 42px)',
              color: '#1E3A5F', marginTop: '10px', lineHeight: 1.15,
            }}>
              Five pillars. One platform.
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '14px', maxWidth: '480px',
              marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Everything an Irish student needs — from a polished CV to finding your study group — in a single app.
            </p>
          </div>

          {/* Pillar rows */}
          <div>
            {PILLARS.map(p => <PillarRow key={p.name} {...p} />)}
            {/* Closing border */}
            <div style={{ borderTop: '1px solid rgba(30,58,95,0.1)' }} />
          </div>

        </div>
      </section>

      {/* ── SECTION 4 — QUALITY / PEOPLE ───────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <SectionLabel>Quality you can count on</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
            maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Reviewed by real people. Every time.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '14px auto 0', maxWidth: '520px', lineHeight: 1.65,
          }}>
            Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Every Elevation service is delivered by a verified Uni Coach. No automation, no shortcuts.
          </p>

          <div className="handler-coach-grid" style={{ marginTop: '52px' }}>
            {/* Campus Handler */}
            <div style={{
              background: '#F5F0E8', borderRadius: '14px',
              padding: '36px 32px', textAlign: 'center', flex: 1,
              border: '1px solid rgba(30,58,95,0.08)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <UserCheck size={30} color="#F5F0E8" strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '22px', color: '#1E3A5F', marginTop: '20px',
              }}>
                Campus Handler
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '12px', lineHeight: 1.65,
              }}>
                Trained students who review every Foundation Blueprint submission — CVs, essays, and applications — before it reaches you.
              </p>
              <Link to="/join#handler-form" style={{
                display: 'inline-block', marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '700', color: '#1E3A5F',
                textDecoration: 'none', opacity: 0.6,
              }}>
                Become a Handler →
              </Link>
            </div>

            {/* Uni Coach */}
            <div style={{
              background: '#F5F0E8', borderRadius: '14px',
              padding: '36px 32px', textAlign: 'center', flex: 1,
              border: '1px solid rgba(30,58,95,0.08)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <Award size={30} color="#F5F0E8" strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '22px', color: '#1E3A5F', marginTop: '20px',
              }}>
                Uni Coach
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '12px', lineHeight: 1.65,
              }}>
                Verified specialists delivering Elevation Blueprint services — career coaching, personal branding, and postgrad strategy.
              </p>
              <Link to="/join#coach-form" style={{
                display: 'inline-block', marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '700', color: '#1E3A5F',
                textDecoration: 'none', opacity: 0.6,
              }}>
                Apply as a Coach →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — TRIAL + CTA (combined) ────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <SectionLabel light>September 2026 &mdash; Limited Time</SectionLabel>

          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
            maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            50% off everything.<br />All of September.
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.65)',
            margin: '16px auto 0', maxWidth: '440px', lineHeight: 1.6,
          }}>
            CVs, LinkedIn profiles, cover letters, career coaching — every service at half price for the entire month. Free to join.
          </p>

          <CountdownTimer />

          <div style={{ marginTop: '36px' }}>
            <Link to="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', padding: '0 36px', minWidth: '200px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Get started free
              <ArrowRight size={16} />
            </Link>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.4)', marginTop: '16px',
          }}>
            No credit card required. Free forever to join.
          </p>
        </div>
      </section>
    </>
  )
}
