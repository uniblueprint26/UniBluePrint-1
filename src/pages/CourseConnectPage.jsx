import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  BookOpen, MessageSquare, Upload, Users, Bell, FileText,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    name: 'Course Boards',
    description: 'Discussion boards for every module — ask questions, share notes, and learn from your cohort.',
  },
  {
    icon: MessageSquare,
    name: 'Q&A Threads',
    description: 'Post questions on past exam papers, assignments, and lectures. Upvote the best answers.',
  },
  {
    icon: Upload,
    name: 'Resource Sharing',
    description: 'Share summaries, mind maps, and helpful links with students on the same course.',
  },
  {
    icon: Users,
    name: 'Study Groups',
    description: 'Find study partners for your course — online or in-person, across campuses.',
  },
  {
    icon: Bell,
    name: 'Course Alerts',
    description: 'Get notified when something new is posted on your module board.',
  },
  {
    icon: FileText,
    name: 'Past Papers & Notes',
    description: 'A growing library of student-submitted notes and past exam papers, organised by course.',
  },
]

// University city coordinates on the SVG map (Ireland, approx 400×480 viewBox)
const MAP_DOTS = [
  { city: 'Dublin',    x: 310, y: 195, unis: ['UCD', 'TCD', 'DCU', 'TUD'] },
  { city: 'Cork',      x: 215, y: 390, unis: ['UCC'] },
  { city: 'Galway',    x: 105, y: 220, unis: ['University of Galway'] },
  { city: 'Limerick',  x: 160, y: 295, unis: ['UL'] },
  { city: 'Waterford', x: 270, y: 355, unis: ['SETU Waterford'] },
  { city: 'Athlone',   x: 185, y: 200, unis: ['ATU Athlone'] },
  { city: 'Maynooth',  x: 285, y: 185, unis: ['MU'] },
  { city: 'Sligo',     x: 130, y: 120, unis: ['ATU Sligo'] },
]

const MOCK_PROFILES = [
  {
    initials: 'SR',
    name: 'Siobhán R.',
    course: 'Business & Finance',
    uni: 'UCD',
    modules: ['FIN2020', 'ECO2010', 'MGT3010'],
  },
  {
    initials: 'CO',
    name: 'Ciarán O.',
    course: 'Computer Science',
    uni: 'TCD',
    modules: ['CS3012', 'CS3021', 'CS2010'],
  },
  {
    initials: 'AM',
    name: 'Aoife M.',
    course: 'Medicine',
    uni: 'UCC',
    modules: ['MED2001', 'MED2002', 'PHY2010'],
  },
]

const COLLAB_POINTS = [
  { title: 'Cross-campus study groups', description: 'Find students studying the same subject at other Irish universities — different campus, same module content.' },
  { title: 'Shared notes library', description: 'Student-created resources are tagged by course and module, making it easy to find what you need.' },
  { title: 'Peer learning built in', description: 'Course Connect is designed to foster genuine peer learning — not just content dumping.' },
]

// ─── Ireland SVG Map ───────────────────────────────────────────────────────────

function IrelandMap() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox="0 0 400 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Map of Ireland showing university cities"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Ireland island outline — simplified polygon */}
        <path
          d="
            M 200 20
            C 230 18, 270 25, 295 45
            C 330 65, 355 90, 365 120
            C 375 150, 372 180, 368 200
            C 362 225, 355 245, 358 268
            C 362 295, 370 315, 360 340
            C 350 365, 330 385, 310 400
            C 285 418, 260 430, 235 438
            C 210 446, 185 445, 162 438
            C 138 430, 115 415, 98 398
            C 78 378, 65 355, 58 330
            C 50 303, 52 278, 48 252
            C 44 228, 35 208, 38 182
            C 42 155, 55 130, 72 110
            C 90 88, 115 72, 140 58
            C 162 45, 180 22, 200 20
            Z
          "
          fill="rgba(30,58,95,0.06)"
          stroke="rgba(30,58,95,0.2)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* University city dots */}
        {MAP_DOTS.map(dot => (
          <g key={dot.city}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r="7"
              fill="#1E3A5F"
              opacity="0.85"
            />
            <circle
              cx={dot.x}
              cy={dot.y}
              r="13"
              fill="#1E3A5F"
              opacity="0.12"
            />
            <text
              x={dot.x + 16}
              y={dot.y + 5}
              fontFamily="'DM Sans', sans-serif"
              fontSize="12"
              fill="#1E3A5F"
              opacity="0.8"
            >
              {dot.city}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── CourseConnectPage ─────────────────────────────────────────────────────────

export default function CourseConnectPage() {
  return (
    <>
      <Helmet>
        <title>Course Connect | UniBlueprint</title>
        <meta
          name="description"
          content="Connect with students studying the same course across Irish universities. Course boards, study groups, resource sharing, and Q&A — free for all users."
        />
        <meta property="og:title" content="Course Connect | UniBlueprint" />
        <meta property="og:description" content="Connect with students studying the same course across Irish universities. Course boards, study groups, resource sharing, and Q&A — free for all users." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Course Connect
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.6,
        }}>
          Connect across the Emerald Isle
        </p>
        <div style={{ marginTop: '16px' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(22,163,74,0.1)', color: '#16A34A',
            borderRadius: '6px', padding: '5px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: '700',
          }}>
            Free for all users
          </span>
        </div>
      </section>

      {/* ── SECTION 2 — FEATURE CARDS ────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            What's included
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Your course, connected
          </h2>

          <div className="services-grid" style={{ marginTop: '40px' }}>
            {FEATURES.map(f => (
              <div key={f.name} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={24} color="#1E3A5F" />
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '17px', color: '#1E3A5F', marginTop: '12px',
                }}>
                  {f.name}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280',
                  marginTop: '6px', lineHeight: 1.6,
                }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — STUDENT PROFILES PREVIEW ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Students already studying like this
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          textAlign: 'center', margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.7,
        }}>
          Connect with students on the same course — across campuses, across Ireland.
        </p>

        <div className="about-diff-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          {MOCK_PROFILES.map(p => (
            <div key={p.name} style={{
              background: '#F5F0E8', borderRadius: '12px',
              padding: '24px',
            }}>
              {/* Avatar */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px', fontWeight: '700', color: '#F5F0E8',
                }}>
                  {p.initials}
                </span>
              </div>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '17px', color: '#1E3A5F', marginTop: '10px',
              }}>
                {p.name}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#6B7280', marginTop: '2px',
              }}>
                {p.course} · {p.uni}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {p.modules.map(m => (
                  <span key={m} style={{
                    background: 'rgba(30,58,95,0.08)',
                    borderRadius: '4px', padding: '3px 8px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px', color: '#1E3A5F', fontWeight: '500',
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — COLLABORATION ────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center',
          }}>
            Collaboration built in
          </h2>

          <div className="about-diff-grid" style={{ marginTop: '40px' }}>
            {COLLAB_POINTS.map(c => (
              <div key={c.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '18px', color: '#1E3A5F',
                }}>
                  {c.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.65,
                }}>
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — IRELAND MAP ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <IrelandMap />
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '28px', color: '#1E3A5F',
          textAlign: 'center', marginTop: '32px',
        }}>
          One platform. Every campus. All of Ireland.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '8px',
        }}>
          Launching September 2026 across Irish universities and institutes of technology.
        </p>
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
          Connect with your course
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '12px',
        }}>
          Free for every UniBlueprint user. No upgrade required.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            to="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Sign up free
          </Link>
        </div>
      </section>
    </>
  )
}
