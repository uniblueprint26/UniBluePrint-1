import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, UtensilsCrossed, Dumbbell, ShoppingBag, Heart, Camera, TrendingUp, Car, Scissors, Palette, Trophy, Sparkles, Leaf } from 'lucide-react'
import PartnerMap from '../components/PartnerMap'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = '#145A3E'
const ACCENT_ALPHA = 'rgba(20,90,62,0.10)'
const ACCENT_BORDER = 'rgba(20,90,62,0.14)'

// ─── Shared components ─────────────────────────────────────────────────────────

function PhoneMockup({ children, style = {} }) {
  return (
    <div style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative', ...style,
    }}>
      <div style={{ position: 'absolute', right: '-3px', top: '96px', width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '76px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#0d2b1c' }}>
        {children}
      </div>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
    }}>
      {children}
    </p>
  )
}

// ─── Phone screen illustration ─────────────────────────────────────────────────

function LifestyleScreen() {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#0d2b1c',
      display: 'flex', flexDirection: 'column', padding: '18px 12px 14px', boxSizing: 'border-box',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(245,240,232,0.5)', fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[4, 3, 2].map(h => (
            <div key={h} style={{ width: '3px', height: `${h}px`, background: 'rgba(245,240,232,0.4)', borderRadius: '1px' }} />
          ))}
          <div style={{ width: '14px', height: '7px', border: '1px solid rgba(245,240,232,0.35)', borderRadius: '2px', marginLeft: '3px', padding: '1.5px', boxSizing: 'border-box' }}>
            <div style={{ width: '60%', height: '100%', background: 'rgba(245,240,232,0.55)', borderRadius: '1px' }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(20,160,80,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>
        Lifestyle Blueprint
      </p>
      <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#F5F0E8', margin: '0 0 10px' }}>
        Your deals
      </p>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        {['Fitness', 'Automotive', 'Creative'].map((c, i) => (
          <span key={c} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600,
            padding: '3px 8px', borderRadius: '20px', flexShrink: 0,
            background: i === 0 ? ACCENT : 'rgba(245,240,232,0.08)',
            color: i === 0 ? '#fff' : 'rgba(245,240,232,0.4)',
          }}>{c}</span>
        ))}
      </div>

      {/* Deal cards, the same 6 headline deals shown elsewhere on this page */}
      {HEADLINE_DEALS.map((d, i) => {
        const masked = d.name === '???' || d.name === '??????' || d.name === '????'
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: masked ? 'rgba(245,240,232,0.04)' : 'rgba(20,90,62,0.25)',
            border: `1px solid ${masked ? 'rgba(245,240,232,0.08)' : 'rgba(20,90,62,0.5)'}`,
            borderRadius: '7px', padding: '5px 7px', marginBottom: '4px',
          }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: d.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '10px', color: '#F5F0E8' }}>
                {masked ? '?' : d.name.charAt(0)}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: masked ? 'rgba(245,240,232,0.45)' : '#F5F0E8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.name}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: 'rgba(245,240,232,0.3)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.deal}
              </p>
            </div>
          </div>
        )
      })}

      {/* Mental health strip */}
      <div style={{ marginTop: 'auto', background: 'rgba(22,163,74,0.1)', borderRadius: '8px', padding: '7px 10px', border: '1px solid rgba(22,163,74,0.22)' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: '#4ade80', margin: 0 }}>
          Mental Health
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: 'rgba(245,240,232,0.4)', margin: '1px 0 0' }}>
          Free for every user
        </p>
      </div>
    </div>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: UtensilsCrossed, title: 'Food & Drink',    desc: 'Discounts at restaurants and cafes across Ireland.' },
  { Icon: Dumbbell,        title: 'Fitness',          desc: 'Reduced gym memberships and class passes.' },
  { Icon: ShoppingBag,     title: 'Shopping',         desc: 'Discounts at clothing and lifestyle brands.' },
  { Icon: Car,             title: 'Automotive',       desc: 'Exclusive vehicle and driving deals through Whip Wizards.' },
  { Icon: Palette,         title: 'Creative & Media', desc: 'Exclusive deals from photographers, videographers, digital marketers and creative professionals.' },
  { Icon: Heart,           title: 'Mental Health',    desc: 'Free resources, helplines, and wellbeing tools.', free: true },
]

// Category slots without a specific real partner yet stay honestly generic
// rather than inventing a brand name. Percentages are masked with "?",
// per Desmond: enough to show a real deal exists without giving the exact
// number away on web, that's the reason to open the app.
const DEALS = {
  'Food & Drink': [
    { brand: 'Food & Drink Partner', deal: 'Up to ?% off all orders',   locked: true },
    { brand: 'Cafe Partner',         deal: 'Up to ?% off hot drinks',   locked: true },
    { brand: 'Healthy Bowl Partner', deal: 'Free delivery over €15',     locked: true },
  ],
  'Fitness': [
    { brand: 'MPFitness',           deal: 'Up to ?% off membership',   locked: true },
    { brand: 'Energie Fitness',     deal: 'First session free',         locked: true },
    { brand: 'JMC Fitness',         deal: '???',                        locked: true },
  ],
  'Shopping': [
    { brand: 'Saiemsent',           deal: 'Up to ?% off clothing',      locked: true },
    { brand: 'Elect',               deal: 'Up to ?% off clothing',      locked: true },
    { brand: 'Tech Retailer',       deal: '?% off laptops and devices', locked: true },
  ],
  'Automotive': [
    { brand: 'Whip Wizards',        deal: 'Up to ?% off car detailing', locked: true },
    { brand: 'Whip Wizards',        deal: 'Up to ?% off driving lessons', locked: true },
    { brand: 'Whip Wizards',        deal: 'Up to ?% off car servicing', locked: true },
  ],
  'Creative & Media': [
    { brand: 'Creative Partner',    deal: 'Up to ?% off photography',   locked: true },
    { brand: 'Video Partner',       deal: 'Up to ?% off videography',   locked: true },
    { brand: 'Marketing Partner',   deal: 'Up to ?% off design work',   locked: true },
    { brand: 'LEVA Impact',         deal: 'Free marketing for a week',  locked: true },
    { brand: 'Henry Sisters',       deal: '10% off',                    locked: true },
    { brand: 'Royalty Productions', deal: '10% off',                    locked: true },
  ],
  'Mental Health': [
    { brand: 'Samaritans Ireland', deal: 'Free. Call 116 123. Available 24 hours.',     locked: false },
    { brand: 'Pieta House',        deal: 'Free. Call 1800 247 247. Crisis support.',    locked: false },
    { brand: 'Niteline',           deal: 'Free. Peer support for college students.',    locked: false },
    { brand: 'SpunOut',            deal: 'Free. Youth mental health platform.',         locked: false },
    { brand: 'Jigsaw',             deal: 'Free. Support for young people aged 12-25.',  locked: false },
    { brand: 'Turn2Me',            deal: 'Free. Online support and peer groups.',       locked: false },
    { brand: 'MyMind',             deal: 'Low-cost counselling from €40 per session.', locked: false },
    { brand: 'Student Counselling', deal: 'Free through your college. Check your college website.', locked: false },
  ],
}

// The 6 headline deals, cycled in a slideshow and repeated beside the map's
// service categories below. Three name a real partner outright (Energie
// Fitness, LEVA Impact, Roomie); the other three mask the partner name with
// "???" while keeping the real deal, matching the mystery-marketing style
// used across this page.
const HEADLINE_DEALS = [
  { name: 'Energie Fitness', category: 'Gym Membership',      deal: 'Gym membership',                          accent: '#166534' },
  { name: 'LEVA Impact',     category: 'Digital Marketing',   deal: 'Free marketing from a digital marketing company', accent: '#4C1D95' },
  { name: 'Roomie',          category: 'Housing Listings',    deal: 'Free listings',                            accent: '#0369A1' },
  { name: '???',             category: 'Clothing',            deal: '10% off clothes',                          accent: '#1D4ED8' },
  { name: '??????',          category: 'Photography',         deal: '10% off photography',                      accent: '#C2410C' },
  { name: '????',            category: 'Nails, student ID required', deal: 'Nails discount',                    accent: '#BE185D' },
]

function PartnerSlideshow() {
  const [index, setIndex] = useState(0)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setIndex(i => (i + 1) % HEADLINE_DEALS.length), 3200)
    return () => clearInterval(id)
  }, [reduceMotion])

  const slide = HEADLINE_DEALS[index]

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '18px',
      boxShadow: '0 4px 24px rgba(30,58,95,0.08)',
      padding: '28px 32px', maxWidth: '520px', margin: '0 auto',
      display: 'flex', alignItems: 'center', gap: '18px',
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
        background: slide.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 300ms ease',
      }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#F5F0E8' }}>
          {slide.name === '???' || slide.name === '??????' || slide.name === '????' ? '?' : slide.name.charAt(0)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', margin: 0 }}>
          {slide.name}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF', margin: '2px 0 0' }}>
          {slide.category}
        </p>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
        background: ACCENT_ALPHA, border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: '999px', padding: '7px 14px', maxWidth: '160px',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: ACCENT, lineHeight: 1.3 }}>
          {slide.deal}
        </span>
      </div>
    </div>
  )
}

const STEPS = [
  { n: 1, title: 'Download and sign up free',     desc: 'Create your account in minutes, no credit card needed.' },
  { n: 2, title: 'Browse deals in your category', desc: 'Filter by Food, Fitness, Shopping, Automotive, Creative & Media, and more.' },
  { n: 3, title: 'Unlock and redeem in the app',  desc: 'Pro membership unlocks deals, show your deal badge to the partner to claim your saving.' },
]

// ─── Reach section data ───────────────────────────────────────────────────────

const DEAL_CATEGORIES = [
  { label: 'Fitness & PT',      Icon: Dumbbell        },
  { label: 'Beauty',            Icon: Sparkles        },
  { label: 'Photography',       Icon: Camera          },
  { label: 'Food & Drink',      Icon: UtensilsCrossed },
  { label: 'Automotive',        Icon: Car             },
  { label: 'Digital Marketing', Icon: TrendingUp      },
  { label: 'Hair & Styling',    Icon: Scissors        },
  { label: 'Creative',          Icon: Palette         },
  { label: 'Sports Coaching',   Icon: Trophy          },
  { label: 'Clothing',          Icon: ShoppingBag     },
  { label: 'Nail Tech',         Icon: Sparkles        },
  { label: 'Wellness',          Icon: Leaf            },
]

const PAGE_STYLES = `
  .lbp-hero { display: flex; align-items: center; gap: 48px; max-width: 1040px; margin: 0 auto; position: relative; z-index: 1; }
  .lbp-phone { flex-shrink: 0; }
  .lbp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .lbp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  .lbp-reach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  @media (max-width: 860px) {
    .lbp-hero { flex-direction: column; }
    .lbp-phone { display: none; }
    .lbp-reach-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) { .lbp-feat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .lbp-feat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } .lbp-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LifestyleBlueprintPage() {
  const [activeCategory, setActiveCategory] = useState('Fitness')

  const deals = DEALS[activeCategory]
  const isMH  = activeCategory === 'Mental Health'

  return (
    <>
      <Helmet>
        <title>Lifestyle Blueprint | UniBlueprint</title>
        <meta name="description" content="Exclusive deals from Irish partners, mental health resources, and lifestyle tools. All in the UniBlueprint app." />
        <meta property="og:title" content="Lifestyle Blueprint | UniBlueprint" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1, HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: ['linear-gradient(rgba(245,240,232,0.025) 1px,transparent 1px)', 'linear-gradient(90deg,rgba(245,240,232,0.025) 1px,transparent 1px)'].join(','),
          backgroundSize: '56px 56px',
        }} />

        <div className="lbp-hero">

          {/* Phone mockup */}
          <div className="lbp-phone">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }}>
              <LifestyleScreen />
            </PhoneMockup>
          </div>

          {/* Glass box */}
          <div style={{
            flex: 1, minWidth: 0,
            background: 'rgba(245,240,232,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)', borderRadius: '20px', padding: '48px 40px',
          }}>
            <SectionLabel light>Lifestyle Blueprint</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.6vw, 46px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Live Smart. Spend Less.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.65)', marginTop: '14px', lineHeight: 1.7 }}>
              Exclusive deals from Irish partners, mental health resources, and lifestyle tools. All in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {[
                'Verified partner discounts across Ireland',
                'Mental health resources, free to all users',
                'New deals added weekly',
                'Unlock deals directly in the app',
              ].map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: '7px', opacity: 0.85 }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55, margin: 0 }}>{pt}</p>
                </div>
              ))}
            </div>

            <Link to="/coming-soon" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '32px', height: '46px', padding: '0 24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Get the app <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2, FEATURES GRID ────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '96px 24px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>What you get</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Six categories. Real savings.
            </h2>
          </div>

          <div className="lbp-feat-grid">
            {FEATURES.map(({ Icon, title, desc, free }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderTop: `3px solid ${free ? '#16A34A' : ACCENT}`,
                borderRadius: '16px', padding: '28px 26px 24px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: free ? 'rgba(22,163,74,0.1)' : ACCENT_ALPHA,
                  border: `1px solid ${free ? 'rgba(22,163,74,0.14)' : ACCENT_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={free ? '#16A34A' : ACCENT} strokeWidth={1.8} />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#1E3A5F', marginTop: '14px', marginBottom: 0 }}>{title}</p>
                {free && (
                  <span style={{
                    display: 'inline-block', marginTop: '5px',
                    background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                    borderRadius: '4px', padding: '2px 8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700,
                  }}>Always Free</span>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2B, PARTNER SLIDESHOW ───────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <SectionLabel>Real partners, real deals</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(22px, 2.8vw, 30px)', color: '#1E3A5F', marginTop: '8px' }}>
            One of many, right now.
          </h2>
        </div>
        <PartnerSlideshow />
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '18px',
        }}>
          The exact discount unlocks in the app.
        </p>
      </section>

      {/* ── SECTION 3, DEALS EXPLORER ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <SectionLabel>Deals Explorer</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Browse by category
            </h2>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
            {Object.keys(DEALS).map(cat => {
              const active = activeCategory === cat
              const isMHcat = cat === 'Mental Health'
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                    padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: active ? (isMHcat ? '#16A34A' : ACCENT) : 'rgba(30,58,95,0.12)',
                    background: active ? (isMHcat ? '#16A34A' : ACCENT) : 'transparent',
                    color: active ? '#fff' : '#6B7280',
                    transition: 'all 160ms ease',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Deal cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deals.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: d.locked ? '#FFFFFF' : 'rgba(22,163,74,0.04)',
                border: `1px solid ${d.locked ? 'rgba(30,58,95,0.08)' : 'rgba(22,163,74,0.2)'}`,
                borderRadius: '12px', padding: '14px 18px',
              }}>
                {/* Brand colour block */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: d.locked ? '#EDE8DF' : 'rgba(22,163,74,0.1)',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>{d.brand}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: isMH ? '#16A34A' : '#6B7280', margin: '3px 0 0', fontWeight: isMH ? 600 : 400 }}>{d.deal}</p>
                </div>
                {d.locked ? (
                  <button style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700,
                    padding: '7px 14px', borderRadius: '20px',
                    background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    Unlock in the app
                  </button>
                ) : (
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700,
                    padding: '6px 12px', borderRadius: '20px',
                    background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                    border: '1px solid rgba(22,163,74,0.2)', whiteSpace: 'nowrap',
                  }}>
                    Free access
                  </span>
                )}
              </div>
            ))}
          </div>

          {isMH && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
              Mental health resources are free to every UniBlueprint user. No subscription required.
            </p>
          )}
        </div>
      </section>

      {/* ── SECTION 4, INTERACTIVE PARTNER MAP ──────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <SectionLabel light>Where we are</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#F5F0E8', marginTop: '10px', lineHeight: 1.12 }}>
              Every county. Every category.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.5)', marginTop: '12px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
              Lifestyle Blueprint covers the full range, fitness, beauty, photography, food, and more. Tap a pin to see who's live and who's on the way.
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700,
              color: '#C9A24B', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              55+ live partners across every county
            </p>
          </div>

          {/* The map itself, the centrepiece, not a thumbnail */}
          <div style={{ marginTop: 48 }}>
            <PartnerMap />
          </div>

          {/* Phone mockup + category chips, secondary row underneath */}
          <div className="lbp-reach-grid" style={{ marginTop: 72 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                <LifestyleScreen />
              </PhoneMockup>
            </div>

            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700,
                color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '18px',
              }}>
                Service categories
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {DEAL_CATEGORIES.map(({ label, Icon }) => (
                  <div key={label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    padding: '9px 14px', borderRadius: '24px',
                    background: 'rgba(245,240,232,0.07)',
                    border: '1px solid rgba(245,240,232,0.11)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500,
                    color: 'rgba(245,240,232,0.7)',
                  }}>
                    <Icon size={13} strokeWidth={1.8} color="rgba(245,240,232,0.5)" />
                    {label}
                  </div>
                ))}
              </div>

              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700,
                color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em',
                margin: '28px 0 18px',
              }}>
                Headline deals
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {HEADLINE_DEALS.map(d => (
                  <div key={`${d.name}-${d.category}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    padding: '9px 14px', borderRadius: '24px',
                    background: 'rgba(245,240,232,0.07)',
                    border: '1px solid rgba(245,240,232,0.11)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500,
                    color: 'rgba(245,240,232,0.7)',
                  }}>
                    <strong style={{ color: 'rgba(245,240,232,0.9)', fontWeight: 700 }}>{d.name}</strong>
                    {d.deal}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5, HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Three steps to your first deal
            </h2>
          </div>

          <div className="lbp-steps-grid">
            {STEPS.map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto',
                }}>
                  <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#F5F0E8', lineHeight: 1 }}>{s.n}</span>
                </div>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#1E3A5F', marginTop: '16px' }}>{s.title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6, CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: ['linear-gradient(rgba(245,240,232,0.025) 1px,transparent 1px)', 'linear-gradient(90deg,rgba(245,240,232,0.025) 1px,transparent 1px)'].join(','),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Get the app</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 46px)', color: '#F5F0E8', marginTop: '10px', lineHeight: 1.12 }}>
            Start saving today
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.6)', margin: '16px auto 0', maxWidth: '380px', lineHeight: 1.65 }}>
            Free to join. Free trial offers 50% off everything. Mental health resources always free.
          </p>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            marginTop: '32px', height: '50px', padding: '0 28px',
            background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none',
          }}>
            Download the app <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
