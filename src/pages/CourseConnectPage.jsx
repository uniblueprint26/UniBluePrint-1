import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  BookOpen, MessageSquare, Upload, Users, Bell, FileText,
  UserPlus, Briefcase, Globe, Award, ExternalLink,
} from 'lucide-react'

const CC_TOOLS = [
  { name: 'Course Compass',         description: 'Find your ideal CAO course with AI matching.',     url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test',  description: 'Identify subjects that match your strengths.',     url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test',    description: 'Discover how you learn best.',                     url: 'https://coursecompass.ie/learning-style-test' },
  { name: 'PLC Compass',            description: 'Match with the right PLC course.',                 url: 'https://coursecompass.ie/plc-compass-test' },
  { name: 'Apprenticeship Compass', description: 'Find the right apprenticeship pathway.',            url: 'https://coursecompass.ie/apprentice-compass-test' },
  { name: '5th & 6th Year Bundle',  description: 'Senior cycle tools, bundled together.',             url: 'https://coursecompass.ie/bundles/senior-cycle' },
]

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
  {
    icon: UserPlus,
    name: 'Mentorship Requests',
    description: 'Post a request for informal peer mentorship — find a student two years ahead of you in your course who can share their experience.',
  },
  {
    icon: Briefcase,
    name: 'Internship & Placement Board',
    description: 'Students share internship and placement opportunities, application tips, and employer reviews across Ireland.',
  },
  {
    icon: Globe,
    name: 'Study Abroad Board',
    description: 'Connect with students who have studied abroad or are planning to. Share Erasmus experiences, partner universities, and advice.',
  },
  {
    icon: Award,
    name: 'Alumni Network',
    description: 'Connect with graduates from your course and university. Ask for advice, request informational interviews, and build your professional network early.',
    comingSoon: true,
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
  { city: 'Letterkenny', x: 150, y: 55,  unis: ['ATU Letterkenny'] },
  { city: 'Tralee',    x: 130, y: 360, unis: ['MTU Kerry'] },
  { city: 'Kilkenny',  x: 245, y: 320, unis: ['SETU Kilkenny'] },
]

const STUDENT_PROFILES = [
  { name: 'Abdullah', course: 'Business',                  university: 'ATU Galway',           cao: 'AU601' },
  { name: 'Eman',     course: 'Engineering',               university: 'UCD',                  cao: 'DN150' },
  { name: 'Emily',    course: 'Accounting and Finance',    university: 'DCU',                  cao: 'DC115' },
  { name: 'Siofra',   course: 'Arts',                      university: 'UCC',                  cao: 'CK111' },
  { name: 'Ciarán',   course: 'Computer Science',          university: 'UL',                   cao: 'LM121' },
  { name: 'Nicole',   course: 'Nursing',                   university: 'Maynooth University',  cao: 'MH701' },
  { name: 'Sienna',   course: 'Nursing',                   university: 'SETU Waterford',       cao: 'SE915' },
  { name: 'Basmali',  course: 'Computing',                 university: 'MTU',                  cao: 'MT803' },
  { name: 'Ethan',    course: 'Sports Science and Health', university: 'TU Dublin',            cao: 'TU936' },
  { name: 'Alex',     course: 'Digital Marketing',         university: 'TUS Athlone',          cao: 'US844' },
  { name: 'Fiza',     course: 'Psychology',                university: 'University of Galway', cao: 'GY104' },
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

        {/* University city dots — hover for city name */}
        {MAP_DOTS.map(dot => (
          <g key={dot.city} style={{ cursor: 'pointer' }}>
            <title>{dot.city}</title>
            <circle
              cx={dot.x}
              cy={dot.y}
              r="9"
              fill="#1E3A5F"
              opacity="0.12"
            />
            <circle
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill="#1E3A5F"
              opacity="0.85"
            />
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
                position: 'relative',
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                {f.comingSoon && (
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(156,163,175,0.15)', color: '#9CA3AF',
                    borderRadius: '4px', padding: '3px 8px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    Coming Soon
                  </span>
                )}
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

        <div className="services-grid" style={{ maxWidth: '1000px', margin: '40px auto 0' }}>
          {STUDENT_PROFILES.map(p => (
            <div key={p.name} style={{
              background: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
              padding: '24px', textAlign: 'left',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '20px', color: '#FFFFFF', lineHeight: 1,
                }}>
                  {p.name.charAt(0)}
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
                fontSize: '13px', color: '#6B7280', marginTop: '4px',
              }}>
                {p.course} · {p.university}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#1E3A5F', fontWeight: '600',
                marginTop: '4px',
              }}>
                CAO Code: {p.cao}
              </p>
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

      {/* ── SECTION 5 — COURSECOMPASS INTEGRATION ────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Powered in partnership with CourseCompass
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            textAlign: 'center', margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.65,
          }}>
            Ireland's AI-powered CAO course matching platform — helping students find the right course, pathway, and career direction.
          </p>

          <div className="partner-tools-grid" style={{ marginTop: '32px' }}>
            {CC_TOOLS.map(t => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: '#FFFFFF', borderRadius: '12px',
                  boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                  padding: '14px',
                  textDecoration: 'none',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#1E3A5F' }}>
                  {t.name}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: 1.5 }}>
                  {t.description}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', marginTop: '8px', textAlign: 'right' }}>
                  Open →
                </p>
              </a>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <a
              href="https://coursecompass.ie/course-compass"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '48px', padding: '0 24px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Visit CourseCompass →
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — IRELAND MAP ───────────────────────────────────────── */}
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

      {/* ── SECTION 7 — CTA ──────────────────────────────────────────────── */}
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
