import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Zap, Star, BookOpen, PiggyBank } from 'lucide-react'
import { supabase } from '../lib/supabase'

const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'UniBlueprint',
  description: 'The all-in-one platform for young people in Ireland, across every pathway',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EducationApplication',
}

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: 'Foundation Blueprint',
    desc: 'CV, cover letters, and career documents — reviewed by a trained Campus Handler before delivery.',
  },
  {
    icon: Star,
    title: 'Campus Connect',
    desc: 'Community boards for your institution. Accommodation, marketplace, events, and more.',
  },
  {
    icon: BookOpen,
    title: 'Course Connect',
    desc: 'Find course mates, share notes, form study groups, and search by module code.',
  },
  {
    icon: PiggyBank,
    title: 'Budgeting Tool',
    desc: 'Track spending, set budgets, and navigate SUSI grants — with built-in eligibility guidance.',
  },
]

// ─── Page styles ──────────────────────────────────────────────────────────────

const DL_STYLES = `
  .dl-hero-inner {
    display: flex;
    align-items: center;
    gap: 56px;
    max-width: 1040px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .dl-phone-col { flex-shrink: 0; }
  .dl-glass-col {
    flex: 1;
    min-width: 0;
  }
  .dl-feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 860px;
    margin: 40px auto 0;
  }
  @media (max-width: 860px) {
    .dl-hero-inner { flex-direction: column; text-align: center; }
    .dl-phone-col { display: none; }
  }
  @media (max-width: 580px) {
    .dl-feature-grid { gap: 12px !important; }
  }
  .dl-notify-row {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  @media (max-width: 480px) {
    .dl-notify-row { flex-direction: column; }
    .dl-notify-row input,
    .dl-notify-row button { width: 100%; box-sizing: border-box; }
  }
`

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: 0,
    }}>
      {children}
    </p>
  )
}

// ─── PhoneMockup (div-based illustrated) ─────────────────────────────────────

function PhoneScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#1E3A5F',
      padding: '18px 14px',
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: 'rgba(245,240,232,0.5)' }}>
          9:41
        </span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
          {[5, 7, 9, 11].map((h, i) => (
            <div key={i} style={{ width: '3px', height: `${h}px`, background: i < 3 ? 'rgba(245,240,232,0.7)' : 'rgba(245,240,232,0.3)', borderRadius: '1px' }} />
          ))}
        </div>
      </div>

      {/* UBP wordmark */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <svg height="18" viewBox="0 0 260 80" fill="none" style={{ display: 'inline-block' }}>
          <text x="130" y="60" textAnchor="middle" fontFamily="Georgia,serif" fontSize="60" fill="#F5F0E8">UBP</text>
        </svg>
      </div>

      {/* Tagline */}
      <p style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: '10px', color: 'rgba(245,240,232,0.7)',
        textAlign: 'center', marginBottom: '18px',
      }}>
        Your Blueprint
      </p>

      {/* Feature cards */}
      {[
        { name: 'Foundation', sub: 'CV and career docs' },
        { name: 'Campus Connect', sub: 'Your campus community' },
        { name: 'Elevation', sub: 'Coaching and strategy' },
      ].map((f, i) => (
        <div key={i} style={{
          background: 'rgba(245,240,232,0.07)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '7px',
          border: '1px solid rgba(245,240,232,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'rgba(245,240,232,0.5)', flexShrink: 0,
          }} />
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: '#F5F0E8', margin: 0 }}>
              {f.name}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: 'rgba(245,240,232,0.45)', margin: 0, marginTop: '2px' }}>
              {f.sub}
            </p>
          </div>
        </div>
      ))}

      {/* Live activity row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        justifyContent: 'center', marginTop: 'auto', paddingTop: '12px',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#16A34A',
          animation: 'dl-live-pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '8px', color: 'rgba(245,240,232,0.55)',
        }}>
          Download available soon
        </span>
      </div>
    </div>
  )
}

function PhoneMockup({ style = {} }) {
  return (
    <div style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative', ...style,
    }}>
      <div style={{ position: 'absolute', right: '-3px', top: '96px', width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '76px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#1E3A5F' }}>
        <PhoneScreen />
      </div>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

// ─── Store button (grayed out + tooltip) ──────────────────────────────────────

function StoreButton({ label }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        disabled
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '48px', padding: '0 22px',
          background: 'rgba(245,240,232,0.12)',
          color: 'rgba(245,240,232,0.3)',
          border: '1px solid rgba(245,240,232,0.15)',
          borderRadius: '10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
          cursor: 'not-allowed', whiteSpace: 'nowrap',
          transition: 'opacity 150ms',
        }}
      >
        {label}
      </button>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,25,40,0.95)',
          color: 'rgba(245,240,232,0.85)',
          fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 500,
          padding: '5px 10px', borderRadius: '6px',
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
          border: '1px solid rgba(245,240,232,0.1)',
        }}>
          Coming soon
        </div>
      )}
    </div>
  )
}

// ─── Notify form ──────────────────────────────────────────────────────────────

function NotifyForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true); setError(null)
    const { error: dbError } = await supabase
      .from('early_access_signups')
      .insert([{ email, source: 'download_page' }])
    if (dbError) { setError(dbError.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        marginTop: '20px', padding: '12px 18px',
        background: 'rgba(22,163,74,0.15)',
        border: '1px solid rgba(22,163,74,0.3)',
        borderRadius: '10px',
      }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F5F0E8' }}>
          You're on the list.
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="dl-notify-row">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1, minWidth: '200px',
            height: '48px', padding: '0 16px',
            background: 'rgba(245,240,232,0.08)',
            border: '1px solid rgba(245,240,232,0.18)',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
            color: '#F5F0E8',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            height: '48px', padding: '0 24px',
            background: '#F5F0E8', color: '#1E3A5F',
            border: 'none', borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
            cursor: loading ? 'default' : 'pointer',
            whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Sending...' : 'Notify me'}
        </button>
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#FCA5A5', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </form>
  )
}

// ─── DownloadPage ─────────────────────────────────────────────────────────────

export default function DownloadPage() {
  return (
    <>
      <Helmet>
        <title>Download | UniBlueprint</title>
        <meta name="description" content="Download the UniBlueprint app for iOS and Android — the all-in-one platform for young people across Ireland, launching September 2026." />
        <script type="application/ld+json">{JSON.stringify(APP_JSON_LD)}</script>
        <style>{DL_STYLES}</style>
        <style>{`
          @keyframes dl-live-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
            50%       { opacity: 0.8; box-shadow: 0 0 0 5px rgba(22,163,74,0); }
          }
        `}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '120px 24px 96px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div className="dl-hero-inner">
          {/* Phone mockup */}
          <div className="dl-phone-col">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }} />
          </div>

          {/* Glass box */}
          <div className="dl-glass-col" style={{
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
          }}>
            <SectionLabel light>Coming to iOS and Android</SectionLabel>

            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.8vw, 46px)',
              color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              UniBlueprint. In your pocket.
            </h1>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              The app is coming soon. Drop your email and we'll let you know the moment it's live.
            </p>

            <NotifyForm />

            {/* Store buttons — grayed out */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              <StoreButton label="App Store" />
              <StoreButton label="Google Play" />
            </div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px',
              color: 'rgba(245,240,232,0.5)', marginTop: '20px', lineHeight: 1.6,
            }}>
              Already testing UniBlueprint? You already have it — sign in there with the same email
              and password you use on the website. No separate account, no reinstalling.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — FEATURES ───────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid so glass cards read */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(30,58,95,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>What to expect on launch</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.15,
            }}>
              Everything in one app.
            </h2>
          </div>

          <div className="dl-feature-grid">
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(30,58,95,0.08)',
                borderRadius: '16px',
                padding: '28px 26px 24px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <f.icon size={20} color="#F5F0E8" strokeWidth={1.8} />
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '17px', color: '#1E3A5F',
                  margin: 0,
                }}>
                  {f.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280',
                  marginTop: '6px', lineHeight: 1.65,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '24px',
            fontStyle: 'italic',
          }}>
            and more...
          </p>
        </div>
      </section>

      {/* ── SECTION 3 — WEB APP ────────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <SectionLabel>Available now on web</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.15,
          }}>
            Can't wait? Sign up on the web.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '14px', lineHeight: 1.7,
          }}>
            The full UniBlueprint platform is available at uniblueprint.ie right now. Same features, same quality. Download the app when it drops.
          </p>
          <a
            href="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '50px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', marginTop: '28px',
            }}
          >
            Sign up free
          </a>
        </div>
      </section>

      {/* ── SECTION 4 — CTA ────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>September 2026 Trial</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 4vw, 40px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            Be first. 50% off everything.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: 'rgba(245,240,232,0.6)',
            marginTop: '12px', maxWidth: '400px',
            margin: '12px auto 0', lineHeight: 1.65,
          }}>
            Sign up on the web now and be among the first on your campus when the app launches.
          </p>
          <div style={{ marginTop: '28px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/sign-up"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '50px', padding: '0 28px',
                background: '#F5F0E8', color: '#1E3A5F',
                borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Get started free
            </a>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.3)',
            marginTop: '14px',
          }}>
            No credit card required.
          </p>
        </div>
      </section>
    </>
  )
}
