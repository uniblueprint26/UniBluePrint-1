import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UserCheck, MapPin, Heart } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const DIFFERENTIATORS = [
  {
    icon: UserCheck,
    title: 'Real people review every output',
    description:
      'Every Foundation Blueprint submission is reviewed by a trained Campus Handler before it reaches you. No automated outputs, no AI-only pipeline.',
  },
  {
    icon: MapPin,
    title: 'Built specifically for Ireland',
    description:
      'From CAO applications to Irish graduate schemes, everything we build is designed around the Irish education system and job market.',
  },
  {
    icon: Heart,
    title: 'Free tier that genuinely delivers value',
    description:
      'Our free plan is not a watered-down teaser. It gives real access to campus community, course boards, and core tools from day one.',
  },
]

const TEAM_AREAS = [
  {
    title: 'Tech & Development',
    description: 'Building and maintaining the platform, the app, and the infrastructure behind it.',
  },
  {
    title: 'Marketing',
    description: 'Growing awareness across Irish campuses and positioning the UniBlueprint brand.',
  },
  {
    title: 'Outreach',
    description: 'Connecting with young people, universities, and partners on the ground.',
  },
  {
    title: 'Finance',
    description: 'Keeping the business on solid footing and managing our resources responsibly.',
  },
  {
    title: 'Legal',
    description: 'Ensuring we operate safely, fairly, and in compliance with Irish and EU law.',
  },
  {
    title: 'Partners',
    description: 'Building relationships with businesses and institutions that benefit our users.',
  },
]

// TODO: Replace milestone dates, titles, and emoji with real content.
// The user will provide photos, dates, and titles for each polaroid.
// Set photo: '/path/to/image.jpg' on each item when ready.
const MILESTONES = [
  { date: 'TODO: Date',      title: 'The idea',              emoji: '💡', photo: null },
  { date: 'TODO: Date',      title: 'First meeting',         emoji: '🤝', photo: null },
  { date: 'TODO: Date',      title: 'Team assembled',        emoji: '👥', photo: null },
  { date: 'TODO: Date',      title: 'Build begins',          emoji: '🏗️', photo: null },
  { date: 'TODO: Date',      title: 'First prototype',       emoji: '📱', photo: null },
  { date: 'TODO: Date',      title: 'Beta testers join',     emoji: '🎉', photo: null },
  { date: 'TODO: Date',      title: 'Coaches on board',      emoji: '🏅', photo: null },
  { date: 'September 2026',  title: 'Public launch',         emoji: '🚀', photo: null },
]

// Deterministic rotations — alternate slightly so it reads natural on the rope
const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -3.5, 2]

// ─── Clothes Line ──────────────────────────────────────────────────────────────

function ClothesLine({ items }) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  // Mouse drag
  const onMouseDown = e => {
    setIsDragging(true)
    startXRef.current = e.pageX - trackRef.current.offsetLeft
    scrollLeftRef.current = trackRef.current.scrollLeft
  }
  const onMouseMove = e => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - trackRef.current.offsetLeft
    trackRef.current.scrollLeft = scrollLeftRef.current - (x - startXRef.current) * 1.2
  }
  const onMouseUp = () => setIsDragging(false)

  // Touch drag
  const onTouchStart = e => {
    startXRef.current = e.touches[0].pageX - trackRef.current.offsetLeft
    scrollLeftRef.current = trackRef.current.scrollLeft
  }
  const onTouchMove = e => {
    const x = e.touches[0].pageX - trackRef.current.offsetLeft
    trackRef.current.scrollLeft = scrollLeftRef.current - (x - startXRef.current) * 1.2
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>

      {/* Rope */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '36px', left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(to right, transparent, rgba(30,58,95,0.25) 8%, rgba(30,58,95,0.25) 92%, transparent)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Fade edges */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '48px',
        background: 'linear-gradient(to right, #F5F0E8, transparent)',
        zIndex: 5, pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '48px',
        background: 'linear-gradient(to left, #F5F0E8, transparent)',
        zIndex: 5, pointerEvents: 'none',
      }} />

      {/* Scrollable track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{
          display: 'flex',
          gap: '28px',
          overflowX: 'auto',
          overflowY: 'visible',
          padding: '22px 64px 48px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Hide scrollbar Webkit */}
        <style>{`.clothesline-track::-webkit-scrollbar{display:none}`}</style>

        {items.map((item, i) => {
          const rot = ROTATIONS[i % ROTATIONS.length]
          return (
            <div
              key={item.title + i}
              style={{
                flexShrink: 0,
                paddingTop: '20px',
                position: 'relative',
                transformOrigin: 'top center',
              }}
            >
              {/* Wooden peg SVG */}
              <div style={{
                position: 'absolute', top: '8px',
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 3,
              }}>
                <svg width="16" height="32" viewBox="0 0 16 32" fill="none" aria-hidden="true">
                  {/* Peg body */}
                  <rect x="6" y="0" width="4" height="18" rx="2" fill="#8B7355" />
                  {/* Peg head clip */}
                  <ellipse cx="8" cy="24" rx="7" ry="8" fill="#9E8060" />
                  {/* Slot */}
                  <rect x="7" y="15" width="2" height="9" fill="#7A6345" />
                  {/* Highlight */}
                  <rect x="7" y="0" width="1" height="16" rx="0.5" fill="rgba(255,255,255,0.3)" />
                </svg>
              </div>

              {/* Polaroid card */}
              <div style={{
                width: '168px',
                background: '#FFFFFF',
                padding: '10px 10px 30px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)',
                transform: `rotate(${rot}deg)`,
                marginTop: '10px',
                borderRadius: '2px',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}>
                {/* Photo area */}
                <div style={{
                  width: '100%',
                  paddingBottom: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #EDE8DF 0%, #DDD8CF 100%)',
                  overflow: 'hidden',
                  borderRadius: '1px',
                }}>
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.title}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '36px', opacity: 0.65 }} aria-hidden="true">
                        {item.emoji || '📸'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div style={{ paddingTop: '10px', textAlign: 'center' }}>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '12px', color: '#1E3A5F',
                    lineHeight: 1.3,
                    textWrap: 'balance',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '10px', color: '#9CA3AF',
                    marginTop: '4px',
                  }}>
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Drag hint */}
      <p style={{
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', color: '#9CA3AF',
        marginTop: '-20px',
      }}>
        Drag to explore
      </p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}>
      {children}
    </p>
  )
}

function DifferentiatorCard({ icon: Icon, title, description }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '24px', flex: 1,
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={28} color="#1E3A5F" />
      </div>
      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', color: '#1E3A5F', marginTop: '16px',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {description}
      </p>
    </div>
  )
}

function TeamCard({ title, description }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px',
    }}>
      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '16px', color: '#1E3A5F',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {description}
      </p>
      <Link
        to="/join"
        style={{
          display: 'block', textAlign: 'center',
          marginTop: '16px', height: '36px',
          lineHeight: '36px',
          background: 'none', color: '#1E3A5F',
          border: '1.5px solid #1E3A5F',
          borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Join Now
      </Link>
    </div>
  )
}

// ─── AboutPage ─────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About | UniBlueprint</title>
        <meta
          name="description"
          content="UniBlueprint — built for young people across Ireland. Our mission, our story, and the team behind the Blueprint."
        />
        <meta property="og:title" content="About | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint — built for young people across Ireland. Our mission, our story, and the team behind the Blueprint." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '96px 24px 80px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)',
        }}>
          Our story
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.1,
        }}>
          About UniBlueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px', color: 'rgba(245,240,232,0.6)',
          marginTop: '16px', maxWidth: '480px',
          margin: '16px auto 0', lineHeight: 1.65,
        }}>
          Built for young people in Ireland. By people who understand the journey.
        </p>
      </section>

      {/* ── SECTION 2 — MISSION ──────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div className="about-mission-grid" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Left */}
          <div>
            <SectionLabel>Our Mission</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '36px', color: '#1E3A5F',
              marginTop: '8px', lineHeight: 1.2,
            }}>
              The structure behind your success, for every young person in Ireland
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '16px', lineHeight: 1.8,
            }}>
              {/* TODO: Replace with real mission statement copy */}
              TODO: Insert mission statement — 3 to 4 sentences describing why UniBlueprint exists, what problem it solves for young people in Ireland, and what the long-term vision looks like.
            </p>
          </div>

          {/* Right: pull quote */}
          <div style={{
            background: '#FFFFFF',
            borderLeft: '3px solid #1E3A5F',
            borderRadius: '12px',
            padding: '28px',
            alignSelf: 'start',
            boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '22px', color: '#1E3A5F',
              fontStyle: 'italic', lineHeight: 1.45,
            }}>
              {/* TODO: Replace with real founder quote */}
              &ldquo;TODO: Insert founder quote here&rdquo;
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#9CA3AF',
              marginTop: '12px',
            }}>
              {/* TODO: Replace with founder name and title */}
              TODO: Founder name, Co-founder
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — WHAT MAKES US DIFFERENT ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>What makes us different</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Built differently, on purpose
        </h2>

        <div className="about-diff-grid" style={{ marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0' }}>
          {DIFFERENTIATORS.map(d => (
            <DifferentiatorCard key={d.title} {...d} />
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — TEAM STRUCTURE ───────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          The team behind the Blueprint
        </h2>

        <div className="about-team-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          {TEAM_AREAS.map(t => (
            <TeamCard key={t.title} {...t} />
          ))}
        </div>

        <div style={{
          background: '#FFFFFF',
          borderLeft: '3px solid #1E3A5F',
          borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '28px',
          maxWidth: '800px', margin: '40px auto 0',
        }}>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '24px', color: '#1E3A5F',
          }}>
            Want to be part of the team behind the Blueprint?
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '12px', lineHeight: 1.6,
          }}>
            UniBlueprint is building its founding team across all functions. Whether you want to work in tech, outreach, marketing, or operations — we want people who care about what we are building.
          </p>
          <Link
            to="/join"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', marginTop: '16px',
            }}
          >
            Join the Team
          </Link>
        </div>
      </section>

      {/* ── SECTION 5 — POLAROID CLOTHES LINE TIMELINE ───────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 24px' }}>
          <SectionLabel>The journey</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            marginTop: '8px',
          }}>
            From idea to launch
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#9CA3AF',
            marginTop: '8px',
          }}>
            Every milestone on the path to September 2026.
          </p>
        </div>

        <ClothesLine items={MILESTONES} />
      </section>

      {/* ── SECTION 6 — CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#F5F0E8',
        }}>
          Launching September 2026
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.6)',
          marginTop: '12px',
        }}>
          Across Irish universities and colleges during freshers week
        </p>
        <Link
          to="/download"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 36px', minWidth: '180px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '32px',
          }}
        >
          Get early access
        </Link>
      </section>
    </>
  )
}
