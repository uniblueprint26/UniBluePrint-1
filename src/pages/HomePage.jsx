import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, UserCheck, Award } from 'lucide-react'

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
          boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(245,240,232,0.08)',
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

function PhoneMockup({ src, alt, width = 270 }) {
  const aspectRatio = 852 / 393
  const screenW = width - 16
  const screenH = Math.round(screenW * aspectRatio)
  return (
    <div style={{
      width,
      borderRadius: '46px',
      background: '#0c1520',
      padding: '8px',
      boxShadow: '0 48px 96px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Side button accents */}
      <div style={{
        position: 'absolute', right: '-3px', top: '100px',
        width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0',
      }} />
      <div style={{
        position: 'absolute', left: '-3px', top: '80px',
        width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute', left: '-3px', top: '124px',
        width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px',
      }} />
      {/* Screen */}
      <div style={{
        borderRadius: '38px', overflow: 'hidden',
        width: screenW, height: screenH,
        background: '#F5F0E8',
        position: 'relative',
      }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
          width: '90px', height: '26px', background: '#0c1520',
          borderRadius: '20px', zIndex: 10,
        }} />
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top',
            display: 'block',
          }}
        />
      </div>
      {/* Home indicator */}
      <div style={{
        height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '80px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.18)',
        }} />
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

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes ubp-pulse {
    0%, 100% { opacity: 1 }
    50%       { opacity: 0.3 }
  }
  .ubp-badge-dot { animation: ubp-pulse 2.4s ease infinite }

  .ubp-hero {
    display: flex; align-items: center; justify-content: space-between;
    gap: 48px; max-width: 1080px; margin: 0 auto;
  }
  .ubp-hero-text { flex: 1; min-width: 0 }
  .ubp-hero-phone { flex-shrink: 0 }

  .ubp-screens-row {
    display: flex; gap: 24px; justify-content: center;
    align-items: flex-end; flex-wrap: wrap; margin-top: 56px;
  }

  .ubp-hiw-steps {
    display: flex; align-items: flex-start; gap: 0;
    max-width: 860px; margin: 56px auto 0; flex-wrap: nowrap;
  }
  .ubp-hiw-step { flex: 1; text-align: center; padding: 0 16px; min-width: 0 }
  .ubp-hiw-connector {
    flex-shrink: 0; width: 80px; align-self: flex-start;
    border-top: 1.5px dashed rgba(30,58,95,0.18); margin-top: 26px;
  }

  .ubp-quality-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; max-width: 820px; margin: 52px auto 0;
  }
  .ubp-quality-link { opacity: 0.55; transition: opacity 150ms }
  .ubp-quality-link:hover { opacity: 1 }

  .ubp-store-btn {
    background: none; border: 1px solid rgba(245,240,232,0.18); border-radius: 8px;
    padding: 10px 24px; font-family: inherit; font-size: 12px;
    color: rgba(245,240,232,0.45); cursor: pointer;
    transition: border-color 150ms, color 150ms;
  }
  .ubp-store-btn:hover { border-color: rgba(245,240,232,0.4); color: rgba(245,240,232,0.75) }

  @media (max-width: 860px) {
    .ubp-hero { flex-direction: column; align-items: center; text-align: center }
    .ubp-hero-text { text-align: center }
    .ubp-hero-ctas { justify-content: center !important }
    .ubp-hero-stats { justify-content: center !important }
    .ubp-hero-phone { order: -1 }
    .ubp-hiw-connector { display: none }
    .ubp-hiw-steps { flex-wrap: wrap; gap: 32px }
    .ubp-hiw-step { flex: 0 0 calc(50% - 16px) }
  }
  @media (max-width: 600px) {
    .ubp-quality-grid { grid-template-columns: 1fr }
    .ubp-hiw-step { flex: 0 0 100% }
    .ubp-hero-ctas a { width: 100%; box-sizing: border-box }
    .ubp-hero-ctas { flex-direction: column !important }
    .ubp-screens-row { gap: 14px }
  }
`

// ─── HIW data ──────────────────────────────────────────────────────────────────

const HIW_STEPS = [
  { n: '1', title: 'Create your free account', desc: 'Sign up in under a minute. No payment required.' },
  { n: '2', title: 'Choose your service',       desc: 'Pick what you need and share your brief or materials.' },
  { n: '3', title: 'Reviewed by a real person', desc: 'A Campus Handler or Uni Coach prepares your output.' },
  { n: '4', title: 'Delivered, ready to use',   desc: 'Receive your finished output within your timeframe.' },
]

const SCREENS = [
  { src: '/app-screens/directory.png', alt: 'Student Directory screen', label: 'Student Directory',  caption: 'Find and connect with students across Ireland' },
  { src: '/app-screens/adboard.png',   alt: 'Ad Board screen',          label: 'Ad Board',           caption: 'Student-run services, gigs, and opportunities' },
  { src: '/app-screens/messages.png',  alt: 'Messages screen',          label: 'Messages',           caption: 'Community chat rooms by campus and course' },
]

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

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#F5F0E8',
        padding: '80px 24px 88px',
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="ubp-hero">

          {/* Left — text */}
          <div className="ubp-hero-text">
            {/* UBP lockup */}
            <div style={{ marginBottom: '28px', display: 'inline-block', textAlign: 'left' }}>
              <p style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '40px', lineHeight: 1, color: '#1E3A5F', letterSpacing: '-0.01em',
              }}>
                UBP
              </p>
              <div style={{ height: '2px', background: '#1E3A5F', marginTop: '5px' }} />
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#1E3A5F', letterSpacing: '2px',
                marginTop: '6px', opacity: 0.65, fontWeight: 500,
              }}>
                UniBlueprint
              </p>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '6px', padding: '5px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                <span className="ubp-badge-dot" aria-hidden="true" style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#4ade80', flexShrink: 0,
                }} />
                September Trial &middot; 50% off every service
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.1, color: '#1E3A5F',
              maxWidth: '560px', letterSpacing: '-0.02em',
            }}>
              The Structure Behind Your Success
            </h1>

            {/* Sub */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '17px', color: '#6B7280',
              marginTop: '18px', maxWidth: '480px', lineHeight: 1.7,
            }}>
              The all-in-one app for students, apprentices, and young people across Ireland — CV support, coaching, campus community, and lifestyle deals.
            </p>

            {/* CTAs */}
            <div className="ubp-hero-ctas" style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
              <Link to="/sign-up" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '52px', padding: '0 28px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Get started free <ArrowRight size={16} />
              </Link>
              <Link to="/download" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '52px', padding: '0 24px',
                background: 'transparent', color: '#1E3A5F',
                border: '1.5px solid rgba(30,58,95,0.25)', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Download the app
              </Link>
            </div>

            {/* Stats */}
            <div className="ubp-hero-stats" style={{
              display: 'flex', gap: '0', marginTop: '48px', flexWrap: 'wrap',
              borderTop: '1px solid rgba(30,58,95,0.12)', paddingTop: '32px', maxWidth: '480px',
            }}>
              {[
                { n: 'Open',  label: 'Available to every young person' },
                { n: 'IE',    label: 'Across Ireland'                  },
                { n: 'Free',  label: 'To join, always'                 },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, minWidth: '100px', textAlign: 'left', padding: i > 0 ? '0 0 0 24px' : '0 24px 0 0',
                  borderLeft: i > 0 ? '1px solid rgba(30,58,95,0.1)' : 'none',
                }}>
                  <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '26px', color: '#1E3A5F', lineHeight: 1 }}>
                    {s.n}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', marginTop: '4px', fontWeight: 500 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Pillars */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
              {['Foundation', 'Elevation', 'Lifestyle', 'Connect'].map(pillar => (
                <span key={pillar} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px', fontWeight: 600,
                  color: '#1E3A5F',
                  border: '1.5px solid rgba(30,58,95,0.22)',
                  borderRadius: '20px',
                  padding: '4px 13px',
                  letterSpacing: '0.04em',
                }}>
                  {pillar}
                </span>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="ubp-hero-phone">
            <PhoneMockup src="/app-screens/home.png" alt="UniBlueprint home screen" width={270} />
          </div>

        </div>
      </section>

      {/* ── SECTION 2 — APP SCREENSHOTS ─────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '88px 24px 96px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel light>The App</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 42px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.15, maxWidth: '560px',
            marginLeft: 'auto', marginRight: 'auto',
          }}>
            Every corner of student life, in one place
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            margin: '14px auto 0', maxWidth: '460px', lineHeight: 1.65,
          }}>
            From your campus community to your career documents — it all lives inside UniBlueprint.
          </p>

          <div className="ubp-screens-row">
            {SCREENS.map(({ src, alt, label, caption }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <PhoneMockup src={src} alt={alt} width={210} />
                <p style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '15px', color: '#F5F0E8',
                  marginTop: '20px',
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px', color: 'rgba(245,240,232,0.5)',
                  marginTop: '4px', maxWidth: '180px', margin: '6px auto 0', lineHeight: 1.5,
                }}>
                  {caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '88px 24px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.2,
          }}>
            Your Blueprint in four steps
          </h2>

          <div className="ubp-hiw-steps">
            {HIW_STEPS.map((step, i) => (
              <Fragment key={step.n}>
                <div className="ubp-hiw-step">
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: '#1E3A5F', color: '#F5F0E8',
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
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
                {i < HIW_STEPS.length - 1 && <div className="ubp-hiw-connector" />}
              </Fragment>
            ))}
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
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
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

      {/* ── SECTION 5 — QUALITY / PEOPLE ────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '88px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
                background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px',
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
                <Link to={href} className="ubp-quality-link" style={{
                  display: 'inline-block', marginTop: '20px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '700', color: '#1E3A5F', textDecoration: 'none',
                }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — FINAL CTA ────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '100px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
            <button className="ubp-store-btn">App Store</button>
            <button className="ubp-store-btn">Google Play</button>
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
