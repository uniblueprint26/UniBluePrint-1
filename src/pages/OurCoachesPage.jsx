import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { User, MapPin } from 'lucide-react'

const COACHES = [
  { id: 1,  name: 'Emmanuel Fasanmi', category: 'Academic Grinds',         location: 'Ireland', services: ['1-to-1 Grinds', 'Exam Prep', 'Junior & Leaving Cert'] },
  { id: 2,  name: 'Daniel Gough',     category: 'Trading & Finance',        location: 'Ireland', services: ['Trading Fundamentals', 'Portfolio Strategy', '1-to-1 Sessions'] },
  { id: 3,  name: 'Ali',              category: 'Fitness Coaching',         location: 'Ireland', services: ['Personal Training', 'Training Plans', 'Form Coaching'] },
  { id: 4,  name: 'Emmanuel Tolic',   category: 'Online Coaching',          location: 'Remote',  services: ['Online Coaching', 'Goal Setting', 'Weekly Check-ins'] },
  { id: 5,  name: 'Nathan Yanzo',     category: 'Videography & Photography',location: 'Ireland', services: ['1-to-1 Video Sessions', 'Photo Editing', 'Creative Direction'] },
  { id: 6,  name: 'Shauna Rogers',    category: 'Fitness Coaching',         location: 'Ireland', services: ['Fitness Coaching', 'Training Plans', 'Lifestyle Support'] },
  { id: 7,  name: 'Alex Leva',        category: 'Digital Marketing',        location: 'Ireland', services: ['Social Media Strategy', 'Content Creation', 'Brand Building'] },
  { id: 8,  name: 'Ethan Henry',      category: 'Guitar Lessons',           location: 'Ireland', services: ['Beginner Guitar', 'Music Theory', '1-to-1 Lessons'] },
  { id: 9,  name: 'Nikola Jurek',     category: 'Personal Branding',        location: 'Ireland', services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'] },
  { id: 10, name: 'Fayed',            category: 'Network Assistance',       location: 'Ireland', services: ['Network Audit', 'Outreach Templates', 'Connection Strategy'] },
  { id: 11, name: 'Milan',            category: 'Fitness Coaching',         location: 'Ireland', services: ['Strength Programming', 'Powerlifting', 'Progressive Overload'] },
  { id: 12, name: 'Jayden Reynolds',  category: 'Nutrition',                location: 'Ireland', services: ['Nutrition Plans', 'Meal Prep Guidance', 'Sports Nutrition'] },
  { id: 13, name: 'Stephen McKeown',  category: 'Career Guidance',          location: 'Ireland', services: ['Career Planning', 'Interview Prep', 'Graduate Pathways'] },
  { id: 14, name: 'JMC Fitness',      category: 'Sports Coaching',          location: 'Ireland', services: ['Online Coaching', 'Dietary Guidance', 'Football Coaching', 'Agent Connections', '1-to-1 Training', 'Analysis & Consultation'] },
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

const activePillStyle = {
  background: '#1E3A5F',
  color: '#F5F0E8',
  borderRadius: '20px',
  padding: '7px 16px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13px',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  border: 'none',
  transition: 'background 150ms, color 150ms',
}

const inactivePillStyle = {
  background: '#FFFFFF',
  color: '#6B7280',
  border: '1px solid rgba(30,58,95,0.15)',
  borderRadius: '20px',
  padding: '7px 16px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13px',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 150ms, color 150ms',
}

function CoachCard({ name, category, location, services }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: hovered
          ? '0px 8px 28px rgba(30,58,95,0.14)'
          : '0px 2px 12px rgba(30,58,95,0.08)',
        overflow: 'hidden',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
      }}
    >
      {/* Photo placeholder */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: '#F5F0E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User size={40} color="#9CA3AF" style={{ opacity: 0.5 }} />
        {/* Category badge */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: '#1E3A5F',
            color: '#F5F0E8',
            borderRadius: '6px',
            padding: '4px 10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.02em',
          }}
        >
          {category}
        </span>
      </div>

      {/* Card content */}
      <div style={{ padding: '20px' }}>
        {/* Coach name */}
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px',
            color: '#1E3A5F',
            margin: 0,
          }}
        >
          {name}
        </p>

        {/* Location row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '6px',
          }}
        >
          <MapPin size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            {location}
          </span>
        </div>

        {/* Bio — 3-line clamp */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#6B7280',
            lineHeight: 1.5,
            marginTop: '10px',
            marginBottom: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          Bio coming soon — this Coach&apos;s profile is being finalised.
        </p>

        {/* Service pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '12px',
          }}
        >
          {services.map(s => (
            <span
              key={s}
              style={{
                background: '#F5F0E8',
                color: '#1E3A5F',
                borderRadius: '6px',
                padding: '4px 10px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Price section */}
        <div
          style={{
            borderTop: '1px solid rgba(30,58,95,0.1)',
            marginTop: '16px',
            paddingTop: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#6B7280',
              }}
            >
              Standard
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#1E3A5F',
                fontWeight: '600',
              }}
            >
              TODO
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#6B7280',
              }}
            >
              Premium
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#1E3A5F',
                fontWeight: '600',
              }}
            >
              TODO
            </span>
          </div>
        </div>

        {/* CTA */}
        {/* TODO: Link to individual coach profile when coach onboarding is complete */}
        <button
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            height: '44px',
            borderRadius: '8px',
            background: 'none',
            border: '1.5px solid #1E3A5F',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: '600',
            color: '#1E3A5F',
            cursor: 'pointer',
          }}
        >
          View Profile
        </button>
      </div>
    </div>
  )
}

export default function OurCoachesPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const visible =
    activeFilter === 'All'
      ? COACHES
      : COACHES.filter(c => c.category === activeFilter)

  return (
    <>
      <Helmet>
        <title>Our Uni Coaches | UniBlueprint</title>
        <meta
          name="description"
          content="Meet the verified Uni Coaches delivering Elevation Blueprint services across UniBlueprint."
        />
        <meta property="og:title" content="Our Uni Coaches | UniBlueprint" />
        <meta
          property="og:description"
          content="Meet the verified Uni Coaches delivering Elevation Blueprint services across UniBlueprint."
        />
      </Helmet>

      <style>{`
        .coaches-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1023px) { .coaches-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 767px)  { .coaches-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* HERO */}
      <section
        style={{
          background: '#FFFFFF',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '48px',
            color: '#1E3A5F',
            margin: 0,
          }}
        >
          Our Uni Coaches
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            color: '#6B7280',
            margin: '16px auto 0',
            maxWidth: '560px',
            lineHeight: 1.6,
          }}
        >
          Verified specialists delivering Elevation Blueprint services across Ireland.
        </p>
      </section>

      {/* FILTER */}
      <section
        style={{
          background: '#F5F0E8',
          padding: '32px 24px 0',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            overflowX: 'auto',
            display: 'flex',
            gap: '8px',
            paddingBottom: '4px',
          }}
        >
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={cat === activeFilter ? activePillStyle : inactivePillStyle}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section
        style={{
          background: '#F5F0E8',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="coaches-grid">
            {visible.map(c => (
              <CoachCard key={c.id} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* BECOME A COACH CTA */}
      <section
        style={{
          background: '#1E3A5F',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '32px',
            color: '#F5F0E8',
            margin: 0,
          }}
        >
          Want to be featured here?
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px',
            color: 'rgba(245,240,232,0.7)',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          Apply to become a Uni Coach and build your coaching practice with UniBlueprint.
        </p>
        <div style={{ marginTop: '28px' }}>
          <Link
            to="/join#coach-form"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '52px',
              padding: '0 36px',
              background: '#F5F0E8',
              color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Apply as a Coach →
          </Link>
        </div>
      </section>
    </>
  )
}
