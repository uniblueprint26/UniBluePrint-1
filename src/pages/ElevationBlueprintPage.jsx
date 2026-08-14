import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, ExternalLink } from 'lucide-react'

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .ebp-coaches-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 1023px) { .ebp-coaches-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 639px)  { .ebp-coaches-grid { grid-template-columns: 1fr; } }
  .ebp-hero-inner {
    display: flex; align-items: center; gap: 48px;
    max-width: 1040px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  @media (max-width: 860px) {
    .ebp-hero-inner { flex-direction: column; }
    .ebp-hero-phone { display: none; }
  }
  .ebp-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 36px; }
`

// ─── Coaches (aligned to app ElevationScreen) ─────────────────────────────────

const COACHES = [
  { id: 1,  name: '500+ with Eman', category: 'Academic Grinds',      location: 'Dublin',        filter: 'Academic Grinds',  services: ['LC Maths', 'LC Biology', 'LC Physics'], accent: '#1E3A5F' },
  { id: 2,  name: 'JMC Fitness', category: 'Sports Coaching',      location: 'North Dublin',  filter: 'Sports',           services: ['In-Person Training', 'Football Coaching', 'Agent Connections'],    accent: '#166534' },
  { id: 3,  name: 'Nathan',      category: 'Photography and Video', location: 'Ireland',      filter: 'Creative',         services: ['Monthly Mentorship', '1-1 Shoot Sessions', 'Creative Direction'], accent: '#C2410C' },
  { id: 4,  name: 'DG Trading',  category: 'Trading and Finance',  location: 'Ireland',       filter: 'Trading',          services: ['NQ & MNQ Futures', 'ICT-Based Concepts', 'New York Pre-Market'], accent: '#1B4B5A' },
  { id: 6,  name: 'Emanuel T.',  category: 'Personal Training',    location: 'Ireland',       filter: 'Fitness',          services: ['Online Workout Plans', 'Nutrition Plans', 'Calisthenics Coaching'], accent: '#2D4B8E' },
  { id: 7,  name: 'Tadgh',       category: 'Physique Development', location: 'Dublin',        filter: 'Fitness',          services: ['Custom Training Plans', 'Nutrition Coaching', 'Weekly Check-ins'], accent: '#145A3E' },
  { id: 8,  name: 'Milan',       category: 'Personal Training',    location: 'Ireland',       filter: 'Fitness',          services: ['Physique Development', 'Fat Loss and Muscle Gain', 'Nutrition Coaching'], accent: '#15803D' },
  { id: 9,  name: 'Kevin',       category: 'Personal Training',    location: 'Dublin',        filter: 'Fitness',          services: ['1-to-1 PT Sessions', 'Beginner Gym Coaching', 'Accountability Coaching'], accent: '#145A3E' },
  { id: 10, name: 'Alex',        category: 'Digital Marketing',    location: 'Co. Mayo',      filter: 'Marketing',        services: ['Social Media Management', 'Content & Graphics', 'Creator Coordination', 'Client Reporting'], accent: '#4C1D95', badge: 'Student Mentor Listing', crossLinkHref: '/partners#leva', crossLinkLabel: 'See LEVA Impact on Partners' },
  { id: 12, name: 'Jayden',      category: 'Health and Fitness',   location: 'County Sligo',  filter: 'Fitness',          services: ['1-1 Online Coaching', 'Fitness Plans', 'Nutritional Guidance'],  accent: '#134E4A' },
  { id: 13, name: 'Stephen',      category: 'Course Compass',       location: 'Ireland',       filter: 'Career',           services: ['Career Planning', 'Graduate Pathways', 'Interview Prep', 'CAO Guidance'], accent: '#1B4B5A', href: '/course-compass' },
  { id: 14, name: 'Camila',      category: 'Personal Training · Muay Thai · Yoga', location: 'Dublin 8', filter: 'Fitness', services: ['Physique Development', 'Muay Thai Fitness', 'Nutrition Coaching'], accent: '#145A3E', crossLinkHref: '/partners#camila', crossLinkLabel: "See Camila's Lifestyle listing" },
  { id: 15, name: 'Aoife',       category: 'Yoga',                 location: 'Dublin',        filter: 'Yoga',             services: ['Beginner Friendly Yoga', '1-to-1 Sessions', 'Meditation Classes'], accent: '#145A3E' },
  { id: 17, name: 'Dinero Trading Group', category: 'Trading & Investment Education', location: 'Ireland', filter: 'Trading', services: ['Low-Risk Copier', '10X Challenge', '1-to-1 Mentorship'],   accent: '#1B4B5A' },
  { id: 18, name: 'Zainab Ade',  category: 'Investing and Finance Coach', location: 'Ireland', filter: 'Trading',          services: ['Coming soon'],                                                  accent: '#1B4B5A', shell: true },
  { id: 19, name: 'Luana',       category: 'Personal Training',    location: 'Ireland',       filter: 'Fitness',          services: ['Coming soon'],                                                  accent: '#145A3E', shell: true },
]

const COACH_FILTERS = ['All', 'Fitness', 'Sports', 'Academic Grinds', 'Trading', 'Marketing', 'Creative', 'Yoga', 'Career']

// ─── PhoneMockup ──────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="ebp-hero-phone" style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative',
      transform: 'rotate(-2deg) translateY(8px)',
    }}>
      <div style={{ position: 'absolute', right: '-3px', top: '96px', width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '76px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#1E3A5F' }}>
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
                <span style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Serif Display',serif" }}>M</span>
              </div>
              <div>
                <p style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Milan</p>
                <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>Uni Coach, Personal Training</p>
              </div>
            </div>
          </div>
          {/* Session info */}
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.08)' }}>
            <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next session</p>
            <p style={{ color: '#F5F0E8', fontSize: '13px', fontFamily: "'DM Serif Display',serif", marginTop: '3px' }}>Tomorrow, 7:00 AM</p>
            <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", marginTop: '2px' }}>Physique Development</p>
          </div>
          {/* Stats */}
          {[
            { label: 'Training plan: week 3 of 12', color: '#16A34A' },
            { label: 'Nutrition check-in today',    color: '#3B82F6' },
            { label: 'Progress: on track',           color: '#F59E0B' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', background: 'rgba(245,240,232,0.04)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(245,240,232,0.55)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>{item.label}</span>
            </div>
          ))}
          {/* CTA */}
          <div style={{ marginTop: 'auto', padding: '8px 10px', borderRadius: '8px', background: '#F5F0E8', textAlign: 'center' }}>
            <span style={{ color: '#1E3A5F', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Book your Coach</span>
          </div>
        </div>
      </div>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

// ─── CoachCard ────────────────────────────────────────────────────────────────

function CoachCard({ id, name, category, location, services, accent, shell, href, badge, crossLinkHref, crossLinkLabel }) {
  const [hovered, setHovered] = useState(false)
  const initial = name.charAt(0).toUpperCase()

  const inner = (
    <div
      id={`coach-${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: hovered
          ? '0 12px 36px rgba(30,58,95,0.14), 0 2px 8px rgba(30,58,95,0.06)'
          : '0 2px 12px rgba(30,58,95,0.07)',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        borderTop: `3px solid ${accent}`,
        display: 'flex',
        flexDirection: 'column',
        opacity: shell ? 0.72 : 1,
        cursor: href ? 'pointer' : 'default',
        height: '100%',
      }}
    >
      {/* Avatar area */}
      <div style={{
        position: 'relative', height: '132px',
        background: 'linear-gradient(135deg, #EAF0F8 0%, #D9E4F0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '68px', height: '68px', borderRadius: '50%',
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${accent}44`,
        }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '26px', color: '#F5F0E8', lineHeight: 1 }}>
            {initial}
          </span>
        </div>
        <span style={{
          position: 'absolute', top: '10px', left: '12px',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          color: accent, borderRadius: '6px', padding: '4px 10px',
          fontFamily: "'DM Sans',sans-serif", fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.03em', border: `1px solid ${accent}22`,
        }}>
          {category}
        </span>
        <span style={{
          position: 'absolute', bottom: '10px', right: '12px',
          fontFamily: "'DM Sans',sans-serif", fontSize: '10px', color: '#9CA3AF',
        }}>
          {location}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '19px', color: '#1E3A5F', margin: 0 }}>
          {name}
        </p>
        {badge && (
          <span style={{
            display: 'inline-block', marginTop: '8px', alignSelf: 'flex-start',
            background: '#F0FDF4', color: '#15803D', borderRadius: '20px',
            padding: '3px 10px', fontFamily: "'DM Sans',sans-serif",
            fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em',
            textTransform: 'uppercase', width: 'fit-content',
          }}>
            {badge}
          </span>
        )}
        {shell ? (
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '10px', fontStyle: 'italic' }}>
            Full profile coming soon.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', flex: 1 }}>
            {services.map(s => (
              <span key={s} style={{
                background: `${accent}0D`, color: accent,
                borderRadius: '6px', padding: '4px 10px',
                fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '500',
                border: `1px solid ${accent}1A`,
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
        <div style={{
          marginTop: '14px', borderTop: '1px solid rgba(30,58,95,0.07)', paddingTop: '12px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          {href ? (
            <>
              <ExternalLink size={11} color={accent} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: accent, fontWeight: '600' }}>
                Visit Course Compass
              </span>
            </>
          ) : (
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
              Full profile and booking in the app.
            </span>
          )}
        </div>
        {crossLinkHref && (
          <Link
            to={crossLinkHref}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', textDecoration: 'none' }}
          >
            <ArrowRight size={11} color={accent} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: accent, fontWeight: '600' }}>
              {crossLinkLabel}
            </span>
          </Link>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link to={href} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    )
  }
  return inner
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ElevationBlueprintPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const visible = activeFilter === 'All'
    ? COACHES
    : COACHES.filter(c => c.filter === activeFilter)

  return (
    <>
      <Helmet>
        <title>Meet Our Coaches | UniBlueprint</title>
        <meta name="description" content="Verified Uni Coaches delivering personal training, career coaching, trading, creative skills, and more across Ireland. Book directly in the app." />
        <meta property="og:title" content="Meet Our Coaches | UniBlueprint" />
        <meta property="og:description" content="Verified Uni Coaches delivering personal training, career coaching, trading, creative skills, and more across Ireland." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="ebp-hero-inner">
          <PhoneMockup />

          {/* Text block */}
          <div style={{
            flex: 1,
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
          }}>
            <p style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
              color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
            }}>
              Elevation Blueprint
            </p>
            <h1 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,46px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Meet Our Coaches
            </h1>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              {COACHES.length} verified coaches across fitness, career, trading, creative skills, and more.
              Find your coach and book directly in the app.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              {[
                'Personal training, physique coaching, and online fitness plans',
                'Trading, digital marketing, and personal branding',
                'Photography, videography, and creative mentorship',
                'Academic grinds, career counselling, and sports coaching',
              ].map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, marginTop: '8px', opacity: 0.55 }} />
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55, margin: 0 }}>
                    {pt}
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

      {/* ── COACHES GRID ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Filter bar */}
          <div className="ebp-filter-bar">
            {COACH_FILTERS.map(f => {
              const active = f === activeFilter
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                    border: `1.5px solid ${active ? '#1E3A5F' : 'rgba(30,58,95,0.15)'}`,
                    background: active ? '#1E3A5F' : '#FFFFFF',
                    color: active ? '#F5F0E8' : '#6B7280',
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: '13px', fontWeight: active ? '600' : '400',
                    transition: 'all 160ms ease', whiteSpace: 'nowrap',
                  }}
                >
                  {f}
                </button>
              )
            })}
          </div>

          {/* Grid */}
          {visible.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '15px', color: '#9CA3AF', textAlign: 'center', padding: '48px 0' }}>
              No coaches in this category yet.
            </p>
          ) : (
            <div className="ebp-coaches-grid">
              {visible.map(c => <CoachCard key={c.id} {...c} />)}
            </div>
          )}

          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '40px', lineHeight: 1.6,
          }}>
            Full profiles, bios, pricing, and booking are inside the UniBlueprint app.
          </p>
        </div>
      </section>

      {/* ── BECOME A COACH CTA ───────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '88px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
          color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>
          Join the team
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: 'clamp(28px,4vw,42px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.12,
        }}>
          Want to be featured here?
        </h2>
        <p style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '15px', color: 'rgba(245,240,232,0.6)',
          marginTop: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
        }}>
          Apply to become a Uni Coach and build your client base through UniBlueprint.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link to="/join#coach-form" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            height: '50px', padding: '0 30px',
            background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Apply as a Coach <ArrowRight size={15} />
          </Link>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center',
            height: '50px', padding: '0 28px',
            background: 'transparent', color: 'rgba(245,240,232,0.75)',
            border: '1px solid rgba(245,240,232,0.2)', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Download the app
          </Link>
        </div>
      </section>
    </>
  )
}
