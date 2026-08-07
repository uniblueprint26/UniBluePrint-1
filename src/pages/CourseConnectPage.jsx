import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, BookOpen, FileText, Users, MessageSquare, Globe, Archive, Search } from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = '#4C1D95'
const ACCENT_ALPHA = 'rgba(76,29,149,0.10)'
const ACCENT_BORDER = 'rgba(76,29,149,0.14)'

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

function CourseScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #1a0044 0%, #080020 100%)',
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
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(139,92,246,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>
        Course Connect
      </p>
      <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: '#F5F0E8', margin: '0 0 10px' }}>
        Find your course
      </p>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(245,240,232,0.07)', border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: '8px', padding: '6px 10px', marginBottom: '12px',
      }}>
        <Search size={10} color="rgba(139,92,246,0.7)" strokeWidth={2} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(245,240,232,0.55)' }}>
          Business Analytics L8
        </span>
        <span style={{ marginLeft: 'auto', width: '1px', height: '12px', background: 'rgba(139,92,246,0.7)', borderRadius: '1px', animation: 'blink 1s step-end infinite' }} />
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '12px' }}>
        {[
          { val: '847',    sub: 'Members' },
          { val: '4',      sub: 'Notes this wk' },
          { val: 'Thu 6pm', sub: 'Study group' },
        ].map((tile, i) => (
          <div key={i} style={{
            background: 'rgba(76,29,149,0.2)', border: '1px solid rgba(76,29,149,0.3)',
            borderRadius: '7px', padding: '6px 4px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '11px', color: '#F5F0E8', margin: 0, lineHeight: 1 }}>{tile.val}</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '7px', color: 'rgba(245,240,232,0.4)', margin: '2px 0 0', lineHeight: 1.2 }}>{tile.sub}</p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
        Recent activity
      </p>
      {[
        { name: 'Emma',   color: '#3b5fa8', time: '1h ago',  text: 'Uploaded Data Visualisation notes for semester 1.' },
        { name: 'Ciarán', color: '#145A3E', time: '3h ago',  text: 'Study group forming, Thursday 6pm. Message to join.' },
        { name: 'Fiza',   color: '#7C3500', time: '5h ago',  text: 'Anyone have the 2024 past paper for Fin Analytics?' },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: '6px', paddingBottom: '7px',
          borderBottom: i < 2 ? '1px solid rgba(245,240,232,0.06)' : 'none',
          marginBottom: i < 2 ? '7px' : 0,
        }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: item.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '8px', color: '#fff' }}>{item.name[0]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(245,240,232,0.6)' }}>{item.name}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: 'rgba(245,240,232,0.25)' }}>{item.time}</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: 'rgba(245,240,232,0.35)', margin: '2px 0 0', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {item.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: BookOpen,     title: 'Course Boards',              desc: 'Discussion boards for every course in Ireland.' },
  { Icon: FileText,     title: 'Shared Notes',               desc: 'Upload and access notes shared by your course.' },
  { Icon: Users,        title: 'Study Groups',               desc: 'Form study groups in minutes, online or in person.' },
  { Icon: MessageSquare, title: 'Module Q&A',                desc: 'Ask questions about modules that stay with the course.' },
  { Icon: Globe,        title: 'Cross-Ireland Collaboration', desc: 'Connect with people on the same course at other institutions.' },
  { Icon: Archive,      title: 'Resource Library',           desc: 'Organised past papers, notes, and summaries by module.' },
]

const COURSE_DATA = {
  'Business Analytics': {
    institutions: 24,
    members: 847,
    activity: [
      { name: 'Emma',    color: '#3b5fa8', time: '1h ago',  text: 'Uploaded my Data Visualisation notes for semester 1.' },
      { name: 'Ciarán',  color: '#145A3E', time: '3h ago',  text: 'Study group forming for the stats exam, Thursday 6pm. Message to join.' },
      { name: 'Fiza',    color: '#7C3500', time: '5h ago',  text: 'Anyone have the 2024 past paper for Financial Analytics?' },
    ],
  },
  'Computer Science': {
    institutions: 18,
    members: 1204,
    activity: [
      { name: 'Zafir',  color: '#4C1D95', time: '30m ago', text: 'Algorithms study group in DCU library, Monday 4pm. 3 spots left.' },
      { name: 'Sam',    color: '#1B4B5A', time: '2h ago',  text: 'Uploaded OS notes from this semester, should cover most topics.' },
      { name: 'Luca',   color: '#145A3E', time: '4h ago',  text: 'Need a partner for the embedded systems project, TU Dublin students.' },
    ],
  },
  'Law': {
    institutions: 10,
    members: 632,
    activity: [
      { name: 'Gigi',   color: '#7C3500', time: '2h ago',  text: 'Contract law moot court prep group forming for UCD students.' },
      { name: 'Harry',  color: '#1E3A5F', time: '6h ago',  text: 'Full summary for Constitutional Law module, 3rd year, now uploaded.' },
      { name: 'Sofia',  color: '#4C1D95', time: '1d ago',  text: 'Anyone know which cases to focus on for the Tort exam this year?' },
    ],
  },
  'Nursing': {
    institutions: 15,
    members: 978,
    activity: [
      { name: 'Nicole', color: '#145A3E', time: '1h ago',  text: 'Placement at Galway University Hospital next week. Anyone else on this rotation?' },
      { name: 'Sienna', color: '#1B4B5A', time: '4h ago',  text: 'Anatomy flashcards for the pharmacology module now uploaded.' },
      { name: 'Fatima', color: '#3b5fa8', time: '8h ago',  text: 'OSCE practical study group, every Wednesday 5pm in the skills lab.' },
    ],
  },
  'Engineering': {
    institutions: 20,
    members: 1089,
    activity: [
      { name: 'Eman',   color: '#3b5fa8', time: '45m ago', text: 'Fluid Mechanics tutorial group, Friday 2pm on campus. DM to confirm.' },
      { name: 'James',  color: '#7C3500', time: '3h ago',  text: 'Anyone have Thermodynamics past papers from 2023 for finals prep?' },
      { name: 'Ahmed',  color: '#145A3E', time: '7h ago',  text: 'Signal processing notes now uploaded. Covers the full semester.' },
    ],
  },
  'Marketing': {
    institutions: 16,
    members: 724,
    activity: [
      { name: 'Kofi',      color: '#4C1D95', time: '2h ago',  text: 'Looking for 2 more people for the group marketing strategy assignment.' },
      { name: 'Alex',      color: '#1B4B5A', time: '5h ago',  text: 'Uploaded a brand audit template for the Digital Marketing module.' },
      { name: 'Mohammed',  color: '#7C3500', time: '1d ago',  text: 'Consumer Behaviour study group starting next week. First session online.' },
    ],
  },
}

const COURSE_PILLS = Object.keys(COURSE_DATA)

const STEPS = [
  { n: 1, title: 'Search for your course in the app', desc: 'Find your exact course across all Irish institutions.' },
  { n: 2, title: 'Join the board and connect',         desc: 'See who is studying the same course across Ireland.' },
  { n: 3, title: 'Share notes, form groups, ask questions', desc: 'Collaborate with your course from day one.' },
]

const PAGE_STYLES = `
  .crp-hero { display: flex; align-items: center; gap: 48px; max-width: 1040px; margin: 0 auto; position: relative; z-index: 1; }
  .crp-phone { flex-shrink: 0; }
  .crp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .crp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  @media (max-width: 860px) {
    .crp-hero { flex-direction: column; }
    .crp-phone { display: none; }
  }
  @media (max-width: 720px) { .crp-feat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .crp-feat-grid { grid-template-columns: 1fr; } .crp-steps-grid { grid-template-columns: 1fr; } }
`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CourseConnectPage() {
  const [activeCourse, setActiveCourse] = useState('Business Analytics')
  const [fading, setFading] = useState(false)

  function switchCourse(course) {
    if (course === activeCourse) return
    setFading(true)
    setTimeout(() => {
      setActiveCourse(course)
      setFading(false)
    }, 180)
  }

  const course = COURSE_DATA[activeCourse]

  return (
    <>
      <Helmet>
        <title>Course Connect | UniBlueprint</title>
        <meta name="description" content="Course-specific boards, shared notes, and study groups. Collaborate with people on the same course across Ireland." />
        <meta property="og:title" content="Course Connect | UniBlueprint" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: ['linear-gradient(rgba(245,240,232,0.025) 1px,transparent 1px)', 'linear-gradient(90deg,rgba(245,240,232,0.025) 1px,transparent 1px)'].join(','),
          backgroundSize: '56px 56px',
        }} />

        <div className="crp-hero">

          {/* Phone mockup */}
          <div className="crp-phone">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }}>
              <CourseScreen />
            </PhoneMockup>
          </div>

          {/* Glass box */}
          <div style={{
            flex: 1, minWidth: 0,
            background: 'rgba(245,240,232,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)', borderRadius: '20px', padding: '48px 40px',
          }}>
            <SectionLabel light>Course Connect</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.6vw, 46px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Study Smarter. Together.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.65)', marginTop: '14px', lineHeight: 1.7 }}>
              Course-specific boards, shared notes, and study groups. Collaborate with people on the same course across Ireland.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {[
                'Boards for every course in Ireland',
                'Share notes and resources with your course',
                'Form study groups in minutes',
                'Module Q&A that stays with the course',
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
            <SectionLabel>What you get</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Everything your course needs
            </h2>
          </div>

          <div className="crp-feat-grid">
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

      {/* ── SECTION 3 — COURSE SEARCH ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <SectionLabel>Course Search</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Find your course board
            </h2>
          </div>

          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#F5F0E8', border: `1.5px solid ${ACCENT_BORDER}`,
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          }}>
            <Search size={16} color="#9CA3AF" strokeWidth={2} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF' }}>
              Search for your course...
            </span>
          </div>

          {/* Course pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
            {COURSE_PILLS.map(name => (
              <button
                key={name}
                onClick={() => switchCourse(name)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                  padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: activeCourse === name ? ACCENT : 'rgba(30,58,95,0.12)',
                  background: activeCourse === name ? ACCENT : 'transparent',
                  color: activeCourse === name ? '#fff' : '#6B7280',
                  transition: 'all 160ms ease',
                }}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Course card */}
          <div style={{
            background: '#FFFFFF', border: `1px solid ${ACCENT_BORDER}`,
            borderTop: `3px solid ${ACCENT}`,
            borderRadius: '16px', padding: '28px 26px',
            opacity: fading ? 0 : 1,
            transition: 'opacity 180ms ease',
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#1E3A5F', margin: 0 }}>
                  {activeCourse}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                  Offered at {course.institutions} institutions across Ireland
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: ACCENT, margin: 0, lineHeight: 1 }}>
                  {course.members.toLocaleString()}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                  Members
                </p>
              </div>
            </div>

            {/* Activity feed */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
              Recent activity
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {course.activity.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  paddingTop: i > 0 ? '12px' : 0, paddingBottom: i < 2 ? '12px' : 0,
                  borderBottom: i < 2 ? '1px solid rgba(30,58,95,0.06)' : 'none',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: item.color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                  }}>
                    <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '11px', color: '#fff' }}>{item.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#1E3A5F' }}>{item.name}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{item.time}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.55 }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(30,58,95,0.07)', textAlign: 'center' }}>
              <Link to="/download" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '44px', padding: '0 24px',
                background: ACCENT, color: '#fff', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                textDecoration: 'none',
              }}>
                Join in the app <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F', marginTop: '10px', lineHeight: 1.12 }}>
              Three steps to your course board
            </h2>
          </div>

          <div className="crp-steps-grid">
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
            Connect with your course today
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.6)', margin: '16px auto 0', maxWidth: '380px', lineHeight: 1.65 }}>
            Free to join. September trial offers 50% off everything across UniBlueprint.
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
