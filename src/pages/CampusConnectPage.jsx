import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Home, ShoppingCart, Car, Calendar, BookOpen, Search } from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = '#7C3500'
const ACCENT_ALPHA = 'rgba(124,53,0,0.10)'
const ACCENT_BORDER = 'rgba(124,53,0,0.14)'

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
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#1E3A5F' }}>
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

const CAT_ICONS = [
  { label: 'Rooms',    Icon: Home },
  { label: 'Market',  Icon: ShoppingCart },
  { label: 'Carpool', Icon: Car },
  { label: 'Events',  Icon: Calendar },
  { label: 'Study',   Icon: BookOpen },
]

const AVATAR_COLORS = ['#3b5fa8', '#7C3500', '#145A3E', '#4C1D95', '#1B4B5A']

function CampusScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #1a0f00 0%, #0d1a2b 100%)',
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
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(200,100,30,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>
        Campus Connect
      </p>
      <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#F5F0E8', margin: '0 0 10px' }}>
        Your campus
      </p>

      {/* Category icon row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {CAT_ICONS.map(({ label, Icon }, i) => (
          <div key={label} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            background: i === 3 ? 'rgba(124,53,0,0.3)' : 'rgba(245,240,232,0.05)',
            border: `1px solid ${i === 3 ? 'rgba(124,53,0,0.5)' : 'rgba(245,240,232,0.08)'}`,
            borderRadius: '8px', padding: '6px 2px',
          }}>
            <Icon size={12} color={i === 3 ? '#f97316' : 'rgba(245,240,232,0.35)'} strokeWidth={1.8} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '7px', color: i === 3 ? '#f97316' : 'rgba(245,240,232,0.3)', fontWeight: 600, textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Post previews */}
      {[
        { name: 'Mairead', time: '1h ago',  text: "DCU Freshers Ball — tickets on sale Thursday 12pm. €25 each.", color: AVATAR_COLORS[0] },
        { name: 'Billy',   time: '3h ago',  text: 'ATU Galway Careers Fair next Tuesday. 40+ employers attending.', color: AVATAR_COLORS[2] },
        { name: 'Roisin',  time: '1d ago',  text: 'Beach clean this Saturday, 10am main gate. All welcome.', color: AVATAR_COLORS[3] },
      ].map((p, i) => (
        <div key={i} style={{
          background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.08)',
          borderRadius: '8px', padding: '7px 9px', marginBottom: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: p.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '8px', color: '#fff' }}>{p.name[0]}</span>
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(245,240,232,0.6)' }}>{p.name}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: 'rgba(245,240,232,0.3)', marginLeft: 'auto' }}>{p.time}</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: 'rgba(245,240,232,0.4)', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {p.text}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Home,        title: 'Accommodation',  desc: 'Rooms, houseshares, and student accommodation near your campus.' },
  { Icon: ShoppingCart, title: 'Marketplace',  desc: 'Buy and sell textbooks, equipment, and everyday items.' },
  { Icon: Car,         title: 'Carpooling',     desc: 'Find or offer lifts between campuses and home towns.' },
  { Icon: Calendar,    title: 'Events',         desc: 'Society nights, careers fairs, open days, and more.' },
  { Icon: BookOpen,    title: 'Study Groups',   desc: 'Find or form study groups by module, level, or subject.' },
  { Icon: Search,      title: 'Lost and Found', desc: 'Report lost items and reunite people with their belongings.' },
]

const BOARDS = {
  'Accommodation': [
    { author: 'Aoife',   color: AVATAR_COLORS[0], meta: '€450/mo',  time: '2h ago',  title: 'Room to rent near UCC, bills included' },
    { author: 'Seamus',  color: AVATAR_COLORS[2], meta: '€480/mo',  time: '5h ago',  title: 'Student apartment, 2 rooms available' },
    { author: 'Priya',   color: AVATAR_COLORS[3], meta: 'Looking',   time: '1d ago',  title: 'Looking for housemates, NUIG area' },
  ],
  'Marketplace': [
    { author: 'Harry',   color: AVATAR_COLORS[1], meta: '€20 each', time: '1h ago',  title: 'Business Law textbooks, good condition' },
    { author: 'Sinead',  color: AVATAR_COLORS[4], meta: '€15',      time: '3h ago',  title: 'Scientific calculator, barely used' },
    { author: 'Kofi',    color: AVATAR_COLORS[2], meta: 'Free',      time: '6h ago',  title: 'Desk lamp, free to collect on campus' },
  ],
  'Carpooling': [
    { author: 'Abdullah', color: AVATAR_COLORS[0], meta: '3 seats', time: '1h ago',  title: 'Dublin to Galway every Monday' },
    { author: 'Eman',     color: AVATAR_COLORS[3], meta: 'Looking', time: '4h ago',  title: 'Cork to Limerick, Friday evening' },
    { author: 'Ethan',    color: AVATAR_COLORS[1], meta: '1 seat',  time: '1d ago',  title: 'Lift to Shannon Airport on Sunday' },
  ],
  'Events': [
    { author: 'Mairead', color: AVATAR_COLORS[0], meta: '€25',     time: '1h ago',  title: 'Freshers week social, Thursday 7pm SU Bar' },
    { author: 'Billy',   color: AVATAR_COLORS[2], meta: 'Free',    time: '3h ago',  title: 'Career fair, Friday 10am to 4pm' },
    { author: 'Roisin',  color: AVATAR_COLORS[4], meta: 'Free',    time: '1d ago',  title: 'Study group forming for FIN301 module' },
  ],
  'Study Groups': [
    { author: 'Fiza',    color: AVATAR_COLORS[3], meta: '4 members', time: '30m ago', title: 'FIN301 exam prep group, meet Thursdays' },
    { author: 'Zafir',   color: AVATAR_COLORS[0], meta: 'Online',    time: '2h ago',  title: 'Coding bootcamp group, DIT students' },
    { author: 'Emily',   color: AVATAR_COLORS[1], meta: 'Forming',   time: '5h ago',  title: 'Marketing strategy group, UCC and DCU' },
  ],
}

const STEPS = [
  { n: 1, title: 'Download and sign up',          desc: 'Free for every user from day one.' },
  { n: 2, title: 'Find your institution\'s board', desc: 'Browse boards specific to your campus.' },
  { n: 3, title: 'Post, browse, and connect',      desc: 'Join conversations, offer lifts, find rooms.' },
]

const PAGE_STYLES = `
  .ccp-hero { display: flex; align-items: center; gap: 48px; max-width: 1040px; margin: 0 auto; position: relative; z-index: 1; }
  .ccp-phone { flex-shrink: 0; }
  .ccp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .ccp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  @media (max-width: 860px) {
    .ccp-hero { flex-direction: column; }
    .ccp-phone { display: none; }
  }
  @media (max-width: 720px) { .ccp-feat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .ccp-feat-grid { grid-template-columns: 1fr; } .ccp-steps-grid { grid-template-columns: 1fr; } }
`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CampusConnectPage() {
  const [activeBoard, setActiveBoard] = useState('Events')

  const posts = BOARDS[activeBoard]

  return (
    <>
      <Helmet>
        <title>Campus Connect | UniBlueprint</title>
        <meta name="description" content="Community boards for every aspect of campus life: accommodation, carpooling, events, study groups, and more. 100+ institutions across Ireland." />
        <meta property="og:title" content="Campus Connect | UniBlueprint" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: ['linear-gradient(rgba(245,240,232,0.025) 1px,transparent 1px)', 'linear-gradient(90deg,rgba(245,240,232,0.025) 1px,transparent 1px)'].join(','),
          backgroundSize: '56px 56px',
        }} />

        <div className="ccp-hero">

          {/* Phone mockup */}
          <div className="ccp-phone">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }}>
              <CampusScreen />
            </PhoneMockup>
          </div>

          {/* Glass box */}
          <div style={{
            flex: 1, minWidth: 0,
            background: 'rgba(245,240,232,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)', borderRadius: '20px', padding: '48px 40px',
          }}>
            <SectionLabel light>Campus Connect</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.6vw, 46px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Your Campus. Your Community.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.65)', marginTop: '14px', lineHeight: 1.7 }}>
              Community boards for every aspect of campus life: accommodation, carpooling, events, study groups, and more.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {[
                'Boards for every need, from accommodation to events',
                '100+ institutions across Ireland',
                'Free for every user',
                'Your college community, in your pocket',
              ].map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: '7px', opacity: 0.85 }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55, margin: 0 }}>{pt}</p>
                </div>
              ))}
            </div>

            <Link to="/download" style={{
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

      {/* ── SECTION 2 — FEATURES GRID ────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '96px 24px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>What's inside</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Every board your campus needs
            </h2>
          </div>

          <div className="ccp-feat-grid">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderTop: `3px solid ${ACCENT}`,
                borderRadius: '16px', padding: '28px 26px 24px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: ACCENT_ALPHA, border: `1px solid ${ACCENT_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={ACCENT} strokeWidth={1.8} />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#1E3A5F', marginTop: '14px', marginBottom: 0 }}>{title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — COMMUNITY BOARD PREVIEW ─────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <SectionLabel>Community Board Preview</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              See what your campus looks like
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', marginTop: '10px', lineHeight: 1.6 }}>
              Sample posts illustrating how each board works. Real content is created by young people at your institution.
            </p>
          </div>

          {/* Board tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
            {Object.keys(BOARDS).map(board => (
              <button
                key={board}
                onClick={() => setActiveBoard(board)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                  padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: activeBoard === board ? ACCENT : 'rgba(30,58,95,0.12)',
                  background: activeBoard === board ? ACCENT : 'transparent',
                  color: activeBoard === board ? '#fff' : '#6B7280',
                  transition: 'all 160ms ease',
                }}
              >
                {board}
              </button>
            ))}
          </div>

          {/* Post cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {posts.map((p, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid rgba(30,58,95,0.08)',
                borderRadius: '12px', padding: '16px 18px',
                display: 'flex', alignItems: 'flex-start', gap: '14px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: p.color, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '15px', color: '#fff', lineHeight: 1 }}>
                    {p.author[0]}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1E3A5F' }}>{p.author}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{p.time}</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.55 }}>
                    {p.title}
                  </p>
                </div>

                {/* Meta pill */}
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700,
                  padding: '4px 10px', borderRadius: '12px',
                  background: ACCENT_ALPHA, color: ACCENT,
                  border: `1px solid ${ACCENT_BORDER}`,
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {p.meta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              On your campus in minutes
            </h2>
          </div>

          <div className="ccp-steps-grid">
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

      {/* ── SECTION 5 — CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: ['linear-gradient(rgba(245,240,232,0.025) 1px,transparent 1px)', 'linear-gradient(90deg,rgba(245,240,232,0.025) 1px,transparent 1px)'].join(','),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Get the app</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 46px)', color: '#F5F0E8', marginTop: '10px', lineHeight: 1.12 }}>
            Join your campus community
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.6)', margin: '16px auto 0', maxWidth: '380px', lineHeight: 1.65 }}>
            Free for every user. September trial offers 50% off everything across UniBlueprint.
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
