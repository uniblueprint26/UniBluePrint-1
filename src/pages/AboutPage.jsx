import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UserCheck, MapPin, Heart, ArrowRight } from 'lucide-react'

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .about-story-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: start;
    max-width: 1040px;
    margin: 0 auto;
  }
  .about-diff-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1000px;
    margin: 40px auto 0;
  }
  .about-team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 900px;
    margin: 40px auto 0;
  }
  @media (max-width: 860px) {
    .about-story-grid { grid-template-columns: 1fr; gap: 40px; }
    .about-diff-grid  { grid-template-columns: repeat(2, 1fr); }
    .about-team-grid  { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 520px) {
    .about-diff-grid  { gap: 12px; }
    .about-team-grid  { gap: 12px; }
  }
`

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
    title: 'A free tier that genuinely delivers',
    description:
      'The free plan is not a watered-down teaser. It gives real access to campus community, course boards, and core tools from day one.',
  },
]

// The leadership team running UniBlueprint into September — real names,
// real roles, spellings confirmed with Desmond.
const LEADERSHIP = [
  { name: 'Desmond',       role: 'Founder',                              description: 'Started it all after a conversation at a birthday dinner in Belfast. Leads the vision and the whole team.' },
  { name: 'Wami',          role: 'Finance Team Leader',                  description: 'Heads up all company finances, payments, and financial planning.' },
  { name: 'Basmali',       role: 'Legal Team Leader',                    description: 'Owns all compliance, agreements, and regulatory requirements ahead of launch.' },
  { name: 'Tayyab',        role: 'Technology & Dev Leader',              description: 'Running the entire platform build end to end.' },
  { name: 'Bene Matundu',  role: 'Marketing Lead — Creative & Ads',      description: 'Leads on paid ads, visual creativity, and creator partnerships.' },
  { name: 'Elizabeth',     role: 'Marketing Lead — Content & Social',    description: 'Drives content and social presence across the platform.' },
  { name: 'Emmanuel',      role: 'Technology & Strategy Lead',           description: 'Drives platform strategy and supports the full tech build.' },
  { name: 'Fabz',          role: 'Campus Growth Lead',                   description: 'Owns campus expansion and influencer partnerships.' },
  { name: 'Daniel',        role: 'Commercial Operations Lead',           description: 'Heads up commercial relationships, partner activity, and operations.' },
  { name: 'Aidan',         role: 'Product & Outreach Lead',              description: 'Drives product direction and outreach across campuses.' },
  { name: 'Sienna',        role: 'Personal Outreach & Community Lead',   description: 'Leads personal outreach and community building across the network.' },
  { name: 'Zafir',         role: 'Platform & Development Lead',          description: 'Supports the full platform build and development operations.' },
  { name: 'Ethan',         role: 'Marketing & Outreach Lead',            description: 'Drives marketing activity and outreach across the board.' },
  { name: 'Alex',          role: 'Digital Marketing Lead',               description: 'Drives digital marketing activity across the platform.' },
  { name: 'Rachel',        role: 'Legal Team Lead',                      description: 'Supports compliance and agreements alongside the legal team.' },
]

// Behind The Blueprint — real titles and dates from the VSCO series.
// To add a real photo: set photo: '/images/btb-001.jpg' (or a full URL).
// The label is shown as the blue VSCO-style tag on the polaroid.
const BTB = [
  { label: '#001', date: 'Feb 28, 2026',   title: 'Pilot',              photo: '/images/btb/btb-001.jpg' },
  { label: '#002', date: 'Feb 28, 2026',   title: 'Cakes and Candles',  photo: '/images/btb/btb-002.jpg' },
  { label: '#003', date: 'Mar — Apr 2026', title: 'Finding the Pieces', photo: '/images/btb/btb-003.jpg' },
  { label: '#025', date: 'Apr 10, 2026',   title: 'First Look',         photo: '/images/btb/btb-025.jpg' },
  { label: '#027', date: 'Apr 14, 2026',   title: "We're Online",        photo: '/images/btb/btb-027.jpg' },
  { label: '#031', date: '2026',           title: 'Course Compass',    photo: '/images/btb/btb-031.jpg' },
  { label: '#036', date: 'May 5, 2026',    title: 'Ballyhaunis CS',     photo: '/images/btb/btb-036.jpg' },
  { label: '#037', date: 'May 7, 2026',    title: 'ATU Galway',         photo: '/images/btb/btb-037.jpg' },
  { label: '#038', date: 'May 8, 2026',    title: 'UCD',                photo: '/images/btb/btb-038.jpg' },
  { label: '#039', date: 'May 9, 2026',    title: 'Maynooth',           photo: '/images/btb/btb-039.jpg' },
  { label: '#040', date: 'May 13, 2026',   title: 'Preparations Pt. 1', photo: '/images/btb/btb-040.jpg' },
  { label: '#041', date: 'May 13, 2026',   title: 'Preparations Pt. 2', photo: '/images/btb/btb-041.jpg' },
  { label: '#042', date: 'May 14, 2026',   title: 'Showtime',           photo: '/images/btb/btb-042.jpg' },
  { label: '#043', date: 'May 16, 2026',   title: 'Cafe Conversations', photo: '/images/btb/btb-043.jpg' },
  { label: '',     date: 'September 2026', title: 'Launch',             photo: null },
]

const ROTATIONS = [-2.8, 1.8, -1.4, 2.6, -2.2, 1.4, -3, 2, -1.8, 3.2, -2, 1.6, -2.5, 1]

// ─── ClothesLine ──────────────────────────────────────────────────────────────

function ClothesLine({ items }) {
  const trackRef    = useRef(null)
  const [drag, setDrag] = useState(false)
  const startX      = useRef(0)
  const scrollLeft  = useRef(0)

  const onMouseDown = e => {
    setDrag(true)
    startX.current    = e.pageX - trackRef.current.offsetLeft
    scrollLeft.current = trackRef.current.scrollLeft
  }
  const onMouseMove = e => {
    if (!drag) return
    e.preventDefault()
    const x = e.pageX - trackRef.current.offsetLeft
    trackRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.2
  }
  const onMouseUp = () => setDrag(false)

  const onTouchStart = e => {
    startX.current     = e.touches[0].pageX - trackRef.current.offsetLeft
    scrollLeft.current  = trackRef.current.scrollLeft
  }
  const onTouchMove = e => {
    const x = e.touches[0].pageX - trackRef.current.offsetLeft
    trackRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.2
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Rope */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '48px', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(to right, transparent, rgba(30,58,95,0.2) 6%, rgba(30,58,95,0.2) 94%, transparent)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      {/* Fade edges */}
      {['left','right'].map(side => (
        <div key={side} aria-hidden="true" style={{
          position: 'absolute', top: 0, [side]: 0, bottom: 0, width: '60px',
          background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, #EDE8DF, transparent)`,
          zIndex: 5, pointerEvents: 'none',
        }} />
      ))}

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove}
        style={{
          display: 'flex', gap: '24px',
          overflowX: 'auto', overflowY: 'visible',
          padding: '28px 80px 56px',
          cursor: drag ? 'grabbing' : 'grab',
          userSelect: 'none', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((item, i) => {
          const rot = ROTATIONS[i % ROTATIONS.length]

          // Real BTB photos are already finished polaroid graphics — their own
          // tag, caption, and date are baked into the image itself (that's
          // the actual VSCO post design). Re-wrapping those in another hand-
          // drawn polaroid frame below would double up the caption. So a real
          // photo just hangs on the line as-is; only the still-missing
          // "Launch" placeholder gets the hand-drawn frame + text look.
          if (item.photo) {
            return (
              <div
                key={item.title + i}
                style={{ flexShrink: 0, paddingTop: '24px', position: 'relative' }}
              >
                <div style={{
                  position: 'absolute', top: '10px', left: '50%',
                  transform: 'translateX(-50%)', zIndex: 3,
                }}>
                  <svg width="14" height="30" viewBox="0 0 14 30" fill="none" aria-hidden="true">
                    <rect x="5" y="0" width="4" height="16" rx="2" fill="#8B7355" />
                    <ellipse cx="7" cy="22" rx="6" ry="7" fill="#9E8060" />
                    <rect x="6" y="14" width="2" height="8" fill="#7A6345" />
                  </svg>
                </div>
                <div style={{
                  width: '160px',
                  boxShadow: '0 6px 28px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.07)',
                  transform: `rotate(${rot}deg)`,
                  marginTop: '12px',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <img
                    src={item.photo}
                    alt={`Behind The Blueprint ${item.label.replace('#', '')} — "${item.title}"`}
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            )
          }

          return (
            <div
              key={item.title + i}
              style={{ flexShrink: 0, paddingTop: '24px', position: 'relative' }}
            >
              {/* Wooden peg */}
              <div style={{
                position: 'absolute', top: '10px', left: '50%',
                transform: 'translateX(-50%)', zIndex: 3,
              }}>
                <svg width="14" height="30" viewBox="0 0 14 30" fill="none" aria-hidden="true">
                  <rect x="5" y="0" width="4" height="16" rx="2" fill="#8B7355" />
                  <ellipse cx="7" cy="22" rx="6" ry="7" fill="#9E8060" />
                  <rect x="6" y="14" width="2" height="8" fill="#7A6345" />
                </svg>
              </div>

              {/* Hand-drawn placeholder polaroid (used only for entries with no photo yet) */}
              <div style={{
                width: '160px',
                background: '#FFFFFF',
                padding: '8px 8px 28px',
                boxShadow: '0 6px 28px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.07)',
                transform: `rotate(${rot}deg)`,
                marginTop: '12px',
                borderRadius: '2px',
                position: 'relative',
              }}>
                {item.label && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: '#1B2CC1',
                    padding: '2px 7px',
                    zIndex: 2,
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '10px', fontWeight: '700',
                      color: '#FFFFFF', letterSpacing: '0.04em',
                    }}>
                      {item.label}
                    </span>
                  </div>
                )}

                <div style={{
                  width: '100%', paddingBottom: '100%', position: 'relative',
                  background: 'linear-gradient(135deg, #ddd8cf 0%, #c8c3ba 100%)',
                  overflow: 'hidden', borderRadius: '1px',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#D4CFc6',
                  }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9E9990', letterSpacing: '0.04em' }}>
                      photo
                    </span>
                  </div>
                </div>

                <div style={{ paddingTop: '10px', textAlign: 'center' }}>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '11px', color: '#1B2CC1',
                    lineHeight: 1.3, margin: 0,
                  }}>
                    {item.label ? `Behind The Blueprint ${item.label.replace('#', '')}` : 'Launch Day'}
                  </p>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '12px', color: '#1E3A5F',
                    lineHeight: 1.3, margin: '3px 0 0',
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{item.title}&rdquo;
                  </p>
                  <div style={{ height: '1px', background: '#1B2CC1', margin: '5px auto', width: '40px' }} />
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '10px', color: '#1B2CC1',
                    margin: 0,
                  }}>
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', color: '#9CA3AF',
        marginTop: '-24px',
      }}>
        Drag to explore
      </p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Eyebrow({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
    }}>
      {children}
    </p>
  )
}

function DiffCard({ icon: Icon, title, description }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '14px',
      boxShadow: '0 2px 14px rgba(30,58,95,0.07)',
      padding: '28px 24px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(27,75,90,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Icon size={22} color="#1E3A5F" strokeWidth={1.7} />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', color: '#1E3A5F', margin: '0 0 8px',
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        lineHeight: 1.65, margin: 0,
      }}>
        {description}
      </p>
    </div>
  )
}

function LeaderCard({ name, role, description }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
      padding: '22px 20px', textAlign: 'left',
    }}>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', margin: '0 0 4px',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', fontWeight: '700', color: '#B08D57',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        margin: '0 0 10px',
      }}>
        {role}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        lineHeight: 1.6, margin: 0,
      }}>
        {description}
      </p>
    </div>
  )
}

// ─── AboutPage ─────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About | UniBlueprint</title>
        <meta name="description" content="A 19-year-old from Ballyhaunis, County Mayo. A conversation at a birthday dinner. The Blueprint was born. This is the story of UniBlueprint." />
        <meta property="og:title" content="About | UniBlueprint" />
        <meta property="og:description" content="A 19-year-old from Ballyhaunis, County Mayo. A conversation at a birthday dinner. The Blueprint was born." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '110px 24px 88px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.045) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Eyebrow light>Our story</Eyebrow>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(30px, 4.5vw, 50px)', color: '#F5F0E8',
            marginTop: '14px', lineHeight: 1.1,
            textWrap: 'balance',
          }}>
            Built from a birthday dinner in Belfast.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.62)',
            marginTop: '18px', lineHeight: 1.7,
          }}>
            A 19-year-old from Ballyhaunis, County Mayo. A conversation at a restaurant table
            that changed everything. This is how UniBlueprint started.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — FOUNDER STORY ─────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '88px 24px' }}>
        <div className="about-story-grid">

          {/* Left — narrative */}
          <div>
            <Eyebrow>Behind the Blueprint</Eyebrow>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(26px, 3.2vw, 38px)', color: '#1E3A5F',
              marginTop: '12px', lineHeight: 1.15, textWrap: 'balance',
            }}>
              Desmond. 19. Ballyhaunis, County Mayo.
            </h2>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#374151',
              marginTop: '20px', lineHeight: 1.8,
            }}>
              On February 28th, 2026, I flew to Belfast International for a friend's birthday.
              Little did I know the Blueprint was about to be born.
            </p>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#374151',
              marginTop: '14px', lineHeight: 1.8,
            }}>
              At the birthday dinner, a conversation about college life sparked the idea —
              and in that moment the foundation for this brand was created and set in motion.
              I flew home with a head full of plans and got to work.
            </p>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#374151',
              marginTop: '14px', lineHeight: 1.8,
            }}>
              What followed was weeks of brainstorming, long phone calls, voice messages,
              recruiting — the pieces forming one by one. By April the app had its first look.
              By May we were visiting campuses — ATU Galway, UCD, Maynooth, and back to
              Ballyhaunis Community School where it all began. September 2026 is launch.
            </p>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#374151',
              marginTop: '14px', lineHeight: 1.8,
            }}>
              Every step of it is documented. 43 posts and counting on the VSCO —
              Behind the Blueprint. From the pilot to launch day.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px', alignItems: 'flex-start' }}>
              <Link
                to="/behind-the-blueprint"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '700',
                  color: '#1E3A5F', textDecoration: 'none',
                }}
              >
                See more of the journey <ArrowRight size={13} />
              </Link>
              <a
                href="https://vsco.co/uniblueprint"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '600',
                  color: '#6B7280', textDecoration: 'none',
                }}
              >
                Follow the journey on VSCO <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Right — pull quote */}
          <div style={{ alignSelf: 'center' }}>
            <blockquote style={{
              margin: 0,
              padding: '32px 32px 32px 28px',
              background: '#1E3A5F',
              borderRadius: '14px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                background: '#F5F0E8', borderRadius: '14px 0 0 14px',
              }} />
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 'clamp(19px, 2.2vw, 24px)',
                color: '#F5F0E8', fontStyle: 'italic',
                lineHeight: 1.45, margin: 0,
                textWrap: 'balance',
              }}>
                &ldquo;Young people in Ireland were navigating some of the biggest decisions
                of their lives with almost no structured support. We decided to change that.&rdquo;
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: 'rgba(245,240,232,0.55)',
                marginTop: '20px', fontWeight: '600',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Desmond, Founder
              </p>
            </blockquote>
          </div>

        </div>
      </section>

      {/* ── SECTION 3 — BTB TIMELINE ──────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 0 40px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.035) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ textAlign: 'center', padding: '0 24px 0', position: 'relative', zIndex: 1 }}>
          <Eyebrow>Behind the Blueprint</Eyebrow>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            From idea to launch, documented.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#6B7280',
            marginTop: '10px', lineHeight: 1.65,
          }}>
            43 posts. 5 months. Every step of building UniBlueprint, in public.
          </p>
        </div>

        <div style={{ marginTop: '40px', position: 'relative', zIndex: 1 }}>
          <ClothesLine items={BTB} />
        </div>
      </section>

      {/* ── SECTION 4 — MISSION ───────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '88px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>
          <Eyebrow>Our mission</Eyebrow>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(26px, 3.2vw, 38px)', color: '#1E3A5F',
            marginTop: '12px', lineHeight: 1.15, textWrap: 'balance',
          }}>
            The structure behind your success, for every young person in Ireland.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#4B5563',
            marginTop: '20px', lineHeight: 1.8,
          }}>
            UniBlueprint exists because young people in Ireland have always deserved proper,
            structured support — across every pathway, not just university. Whether you are
            doing your Leaving Cert, heading into college, taking an apprenticeship, or
            already in work and looking for what comes next, the platform is built around you.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#4B5563',
            marginTop: '14px', lineHeight: 1.8,
          }}>
            We built it honestly. From a small town in Mayo, with a team assembled over
            voice messages and late-night calls. Real people reviewing every submission.
            Real coaches delivering every session. A free tier that actually gives you
            something. And every step of it documented so you can see exactly how it was built.
          </p>
        </div>
      </section>

      {/* ── SECTION 5 — WHAT MAKES US DIFFERENT ──────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <Eyebrow>What makes us different</Eyebrow>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(26px, 3.2vw, 38px)', color: '#1E3A5F',
          marginTop: '10px',
        }}>
          Built differently, on purpose.
        </h2>
        <div className="about-diff-grid">
          {DIFFERENTIATORS.map(d => <DiffCard key={d.title} {...d} />)}
        </div>
      </section>

      {/* ── SECTION 6 — TEAM ──────────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px', textAlign: 'center' }}>
        <Eyebrow>The team</Eyebrow>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(26px, 3.2vw, 38px)', color: '#1E3A5F',
          marginTop: '10px', textWrap: 'balance',
        }}>
          The people behind the Blueprint.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#4B5563',
          marginTop: '16px', lineHeight: 1.8,
          maxWidth: '640px', margin: '16px auto 0',
        }}>
          Every one of these people is still a student, or barely out of being one. That's not
          a gap we're working around — it's the whole point. This is built by the people who
          will actually use it, who get exactly what's missing because they're living it
          themselves. The structure behind our success is each other.
        </p>
        <div className="about-team-grid">
          {LEADERSHIP.map(t => <LeaderCard key={t.name} {...t} />)}
        </div>

        <div style={{
          background: '#1E3A5F', borderRadius: '14px',
          padding: '36px 32px',
          maxWidth: '760px', margin: '40px auto 0',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#F5F0E8',
            margin: 0,
          }}>
            Want to be part of the team building this?
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: 'rgba(245,240,232,0.62)',
            marginTop: '12px', lineHeight: 1.7,
          }}>
            We are building the founding team across every function — tech, marketing,
            outreach, finance, legal, and partnerships. If you care about what we are
            building, we want to hear from you.
          </p>
          <Link
            to="/join"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', padding: '0 28px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none', marginTop: '20px',
            }}
          >
            Join the Team
          </Link>
        </div>
      </section>

      {/* ── SECTION 7 — CTA ───────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '88px 24px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.022) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.022) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '52px 52px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', color: '#F5F0E8',
            lineHeight: 1.1, margin: 0,
          }}>
            Launching September 2026.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.58)',
            marginTop: '14px',
          }}>
            Across Irish universities and colleges during freshers week.
          </p>
          <Link
            to="/download"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              height: '50px', padding: '0 30px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none', marginTop: '28px',
            }}
          >
            Get early access <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  )
}
