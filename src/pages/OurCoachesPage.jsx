import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

// ─── Coach data ────────────────────────────────────────────────────────────────
// Names: first name only on website. Full details in the app after sign-up.

const COACHES = [
  { id:  1, name: 'Emmanuel',           category: 'Academic Grinds',          location: 'Ireland', services: ['1-to-1 Grinds', 'Exam Prep', 'Junior & Leaving Cert'], accent: '#1E3A5F' },
  { id:  2, name: 'Daniel',             category: 'Trading & Finance',         location: 'Ireland', services: ['Trading Fundamentals', 'Portfolio Strategy', '1-to-1 Sessions'], accent: '#1B4B5A' },
  { id:  3, name: 'Ali',                category: 'Fitness Coaching',          location: 'Ireland', services: ['Personal Training', 'Training Plans', 'Form Coaching'], accent: '#145A3E' },
  { id:  4, name: 'Emmanuel T.',        category: 'Online Coaching',           location: 'Remote',  services: ['Online Coaching', 'Goal Setting', 'Weekly Check-ins'], accent: '#2D4B8E' },
  { id:  5, name: 'Nathan',             category: 'Videography & Photography', location: 'Ireland', services: ['1-to-1 Video Sessions', 'Photo Editing', 'Creative Direction'], accent: '#7C3500' },
  { id:  6, name: 'Shauna',             category: 'Fitness Coaching',          location: 'Ireland', services: ['Fitness Coaching', 'Training Plans', 'Lifestyle Support'], accent: '#145A3E' },
  { id:  7, name: 'Alex',               category: 'Digital Marketing',         location: 'Ireland', services: ['Social Media Strategy', 'Content Creation', 'Brand Building'], accent: '#4C1D95' },
  { id:  8, name: 'Ethan',              category: 'Guitar Lessons',            location: 'Ireland', services: ['Beginner Guitar', 'Music Theory', '1-to-1 Lessons'], accent: '#7C3500' },
  { id:  9, name: 'Nikola',             category: 'Personal Branding',         location: 'Ireland', services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'], accent: '#2D4B8E' },
  { id: 10, name: 'Fayed',              category: 'Network Assistance',        location: 'Ireland', services: ['Network Audit', 'Outreach Templates', 'Connection Strategy'], accent: '#1B4B5A' },
  { id: 11, name: 'Milan',              category: 'Fitness Coaching',          location: 'Ireland', services: ['Strength Programming', 'Powerlifting', 'Progressive Overload'], accent: '#145A3E' },
  { id: 12, name: 'Jayden',             category: 'Nutrition',                 location: 'Ireland', services: ['Nutrition Plans', 'Meal Prep Guidance', 'Sports Nutrition'], accent: '#134E4A' },
  { id: 13, name: 'Stephen | Course Compass', category: 'Career Guidance',     location: 'Ireland', services: ['Career Planning', 'Interview Prep', 'Graduate Pathways'], accent: '#1E3A5F' },
  { id: 14, name: 'JMC',               category: 'Sports Coaching',           location: 'Ireland', services: ['Online Coaching', 'Dietary Guidance', 'Football Coaching', 'Agent Connections', '1-to-1 Training'], accent: '#7C3500' },
  { id: 15, name: 'Luana',             category: 'Fitness Coaching',          location: 'Ireland', services: ['Personal Training', "Women's Fitness", 'Training Plans'], accent: '#145A3E' },
  { id: 16, name: 'Camila',            category: 'Fitness Coaching',          location: 'Ireland', services: ['Personal Training', "Women's Fitness", 'Lifestyle Support'], accent: '#145A3E' },
]

const FILTER_CATEGORIES = [
  'All',
  'Fitness Coaching',
  'Nutrition',
  'Academic Grinds',
  'Trading & Finance',
  'Personal Branding',
  'Digital Marketing',
  'Network Assistance',
  'Career Guidance',
  'Videography & Photography',
  'Guitar Lessons',
  'Sports Coaching',
  'Online Coaching',
]

// Coaches with a female identity get the softer avatar palette
const FEMALE_COACHES = ['Shauna', 'Luana', 'Camila']

// ─── CoachCard ─────────────────────────────────────────────────────────────────

function CoachCard({ name, category, location, services, accent }) {
  const [hovered, setHovered] = useState(false)
  const initial = name.charAt(0).toUpperCase()
  const isFemale = FEMALE_COACHES.includes(name)

  return (
    <div
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
      }}
    >
      {/* Avatar area */}
      <div style={{
        position: 'relative',
        height: '140px',
        background: isFemale
          ? 'linear-gradient(135deg, #F0EBE3 0%, #E8E0D8 100%)'
          : 'linear-gradient(135deg, #EAF0F8 0%, #D9E4F0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Monogram circle */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${accent}33`,
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '28px', color: '#F5F0E8', lineHeight: 1,
          }}>
            {initial}
          </span>
        </div>

        {/* Category badge */}
        <span style={{
          position: 'absolute', top: '10px', left: '12px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          color: accent,
          borderRadius: '6px', padding: '4px 10px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.03em',
          border: `1px solid ${accent}22`,
        }}>
          {category}
        </span>

        {/* Location badge */}
        <span style={{
          position: 'absolute', bottom: '10px', right: '12px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', color: '#9CA3AF',
        }}>
          {location}
        </span>
      </div>

      {/* Card content */}
      <div style={{ padding: '20px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name */}
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '20px', color: '#1E3A5F', margin: 0,
        }}>
          {name}
        </p>

        {/* Service pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px', flex: 1,
        }}>
          {services.map(s => (
            <span key={s} style={{
              background: `${accent}0D`,
              color: accent,
              borderRadius: '6px', padding: '4px 10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px', fontWeight: '500',
              border: `1px solid ${accent}1A`,
            }}>
              {s}
            </span>
          ))}
        </div>

        {/* CTA */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          marginTop: '18px', lineHeight: 1.4,
          borderTop: '1px solid rgba(30,58,95,0.07)',
          paddingTop: '14px',
        }}>
          Full profile and booking available in the app.
        </p>
      </div>
    </div>
  )
}

// ─── OurCoachesPage ────────────────────────────────────────────────────────────

export default function OurCoachesPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const visible = activeFilter === 'All'
    ? COACHES
    : COACHES.filter(c => c.category === activeFilter)

  return (
    <>
      <Helmet>
        <title>Our Uni Coaches | UniBlueprint</title>
        <meta name="description" content="Meet the verified Uni Coaches delivering Elevation Blueprint services across UniBlueprint." />
        <meta property="og:title" content="Our Uni Coaches | UniBlueprint" />
        <meta property="og:description" content="Meet the verified Uni Coaches delivering Elevation Blueprint services across UniBlueprint." />
      </Helmet>

      <style>{`
        .coaches-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1023px) { .coaches-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 639px)  { .coaches-grid { grid-template-columns: 1fr; } }
        .coaches-filter-bar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '96px 24px 80px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)',
        }}>
          Elevation Blueprint
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.1,
        }}>
          Our Uni Coaches
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px', color: 'rgba(245,240,232,0.65)',
          marginTop: '16px', maxWidth: '480px',
          margin: '16px auto 0', lineHeight: 1.65,
        }}>
          Verified specialists delivering career coaching, fitness, creative skills, and more across Ireland.
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: 'rgba(245,240,232,0.4)',
          marginTop: '12px',
        }}>
          {COACHES.length} coaches active
        </p>
      </section>

      {/* ── FILTER BAR ───────────────────────────────────────────────────── */}
      <div style={{ background: '#F5F0E8', borderBottom: '1px solid rgba(30,58,95,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div
          className="coaches-filter-bar"
          style={{
            maxWidth: '1100px', margin: '0 auto',
            overflowX: 'auto', display: 'flex', gap: '8px',
            padding: '16px 24px', scrollbarWidth: 'none',
          }}
        >
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                flexShrink: 0,
                background: cat === activeFilter ? '#1E3A5F' : '#FFFFFF',
                color: cat === activeFilter ? '#F5F0E8' : '#6B7280',
                border: cat === activeFilter ? 'none' : '1px solid rgba(30,58,95,0.15)',
                borderRadius: '20px', padding: '7px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '500',
                whiteSpace: 'nowrap', cursor: 'pointer',
                transition: 'background 140ms, color 140ms',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── COACHES GRID ─────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '40px 24px 96px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {visible.length === 0 && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#9CA3AF',
              textAlign: 'center', padding: '64px 0',
            }}>
              No coaches found in this category.
            </p>
          )}

          <div className="coaches-grid">
            {visible.map(c => <CoachCard key={c.id} {...c} />)}
          </div>

          {/* Note */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '40px', lineHeight: 1.6,
          }}>
            Coach profiles, full bios, and booking are available inside the UniBlueprint app. Download to access.
          </p>
        </div>
      </section>

      {/* ── BECOME A COACH CTA ───────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#F5F0E8', margin: 0,
        }}>
          Want to be featured here?
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.65)',
          marginTop: '12px', maxWidth: '440px', margin: '12px auto 0', lineHeight: 1.65,
        }}>
          Apply to become a Uni Coach and build your practice through the UniBlueprint Elevation Blueprint.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            to="/join#coach-form"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Apply as a Coach
          </Link>
        </div>
      </section>
    </>
  )
}
