import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  BookOpen, MessageSquare, Upload, Users, Bell, FileText,
  UserPlus, Briefcase, Globe, Award, Sparkles,
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
  { name: 'Abdullah', course: 'Business',               university: 'ATU Galway',           cao: 'AU601' },
  { name: 'Eman',     course: 'Engineering',             university: 'UCD',                  cao: 'DN150' },
  { name: 'Emily',    course: 'Accounting and Finance',  university: 'DCU',                  cao: 'DC115' },
  { name: 'Siofra',   course: 'Arts',                    university: 'UCC',                  cao: 'CK111' },
  { name: 'Ciarán',   course: 'Computer Science',        university: 'UL',                   cao: 'LM121' },
  { name: 'Nicole',   course: 'Nursing',                 university: 'Maynooth University',  cao: 'MH701' },
  { name: 'Sienna',   course: 'Nursing',                 university: 'SETU Waterford',       cao: 'SE915' },
  { name: 'Basmali',  course: 'Computing',               university: 'MTU',                  cao: 'MT803' },
  { name: 'Ethan',    course: 'Sports Science',          university: 'TU Dublin',            cao: 'TU936' },
  { name: 'Alex',     course: 'Digital Marketing',       university: 'TUS Athlone',          cao: 'US844' },
  { name: 'Fiza',     course: 'Psychology',              university: 'University of Galway', cao: 'GY104' },
  { name: 'Gigi',     course: 'Law',                     university: 'UCD',                  cao: 'DN030' },
  { name: 'Wami',     course: 'Medicine',                university: 'RCSI',                 cao: 'RC850' },
  { name: 'Daniel',   course: 'Architecture',            university: 'UCD',                  cao: 'DN060' },
  { name: 'Sam',      course: 'Civil Engineering',       university: 'TU Dublin',            cao: 'TU001' },
  { name: 'Harry',    course: 'Business and Law',        university: 'UCD',                  cao: 'DN700' },
  { name: 'Elizabeth',course: 'Pharmacy',                university: 'TCD',                  cao: 'TR073' },
  { name: 'Zafir',    course: 'Computer Science',        university: 'DCU',                  cao: 'DC182' },
  { name: 'Sean',     course: 'Agricultural Science',    university: 'UCD',                  cao: 'DN200' },
  { name: 'Seamus',   course: 'Early Childhood Education', university: 'ATU Galway',         cao: 'AU511' },
  { name: 'Sinead',   course: 'Social Work',             university: 'UCC',                  cao: 'CK320' },
  { name: 'Mairead',  course: 'Film and Television',     university: 'DCU',                  cao: 'DC231' },
  { name: 'Emma',     course: 'Psychology',              university: 'UL',                   cao: 'LM120' },
  { name: 'Mohammed', course: 'International Business',  university: 'DCU',                  cao: 'DC217' },
  { name: 'Ahmed',    course: 'Electronic Engineering',  university: 'UL',                   cao: 'LM043' },
  { name: 'Billy',    course: 'Sports Science',          university: 'ATU Galway',           cao: 'AU801' },
  { name: 'Fatima',   course: 'Radiography',             university: 'TCD',                  cao: 'TR058' },
  { name: 'Aoife',    course: 'Music',                   university: 'University of Galway', cao: 'GY200' },
  { name: 'Roisin',   course: 'Environmental Science',   university: 'UCC',                  cao: 'CK723' },
  { name: 'Kofi',     course: 'Marketing',               university: 'DCU',                  cao: 'DC222' },
  { name: 'Amara',    course: 'Criminology',             university: 'UCC',                  cao: 'CK590' },
  { name: 'James',    course: 'Mechanical Engineering',  university: 'TU Dublin',            cao: 'TU003' },
  { name: 'Priya',    course: 'Dentistry',               university: 'TCD',                  cao: 'TR005' },
  { name: 'Luca',     course: 'Software Engineering',    university: 'UCD',                  cao: 'DN206' },
  { name: 'Sofia',    course: 'International Relations', university: 'DCU',                  cao: 'DC203' },
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

        {/* Mock content banner */}
        <div style={{
          maxWidth: '1000px', margin: '32px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          borderLeft: '3px solid #1E3A5F',
          padding: '20px',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#F5F0E8', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="#1E3A5F" />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>
              You are looking at example content
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
              These student profiles are a mix of real verified users and sample accounts to show how Course Connect looks in the app. Real profiles are created by students who sign up.
            </p>
          </div>
        </div>

        <div className="testimonials-grid" style={{ maxWidth: '1000px', margin: '32px auto 0' }}>
          {STUDENT_PROFILES.slice(0, 12).map(p => (
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
                marginTop: '12px',
              }}>
                CAO Code: {p.cao}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3.5 — MOCK CONTENT TABS ─────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600', color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center',
          }}>
            Inside the app
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            What Course Connect looks like
          </h2>

          {/* Mock content banner */}
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            borderLeft: '3px solid #1E3A5F',
            padding: '20px', margin: '32px 0',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#F5F0E8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#1E3A5F" />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>
                You are looking at example content
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
                These sample posts and threads show what Course Connect looks like in the app. Real content is created by students on the platform.
              </p>
            </div>
          </div>

          {/* Mock discussion threads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Discussions board */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <MessageSquare size={20} color="#1E3A5F" />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', margin: 0 }}>Discussions</p>
              </div>
              {[
                { author: 'Fiza', course: 'Psychology · GY104', time: '1h ago', text: 'Anyone find the cognitive bias chapter confusing? Happy to share my summary notes for the exam.', replies: 4 },
                { author: 'Ciarán', course: 'Computer Science · LM121', time: '3h ago', text: 'Has anyone done the algorithms assignment already? Struggling with the complexity analysis section.', replies: 7 },
                { author: 'Emily', course: 'Accounting & Finance · DC115', time: '5h ago', text: 'Revision notes for financial reporting are up in the Resources tab. Should cover everything on the paper.', replies: 12 },
              ].map((t, i) => (
                <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(30,58,95,0.08)' : 'none', paddingTop: i > 0 ? '14px' : 0, marginTop: i > 0 ? '14px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '12px', color: '#FFFFFF' }}>{t.author.charAt(0)}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', fontWeight: '600' }}>{t.author}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{t.course}</span>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{t.time}</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: '8px 0 0' }}>{t.text}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>{t.replies} replies</p>
                </div>
              ))}
            </div>

            {/* Resources board */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FileText size={20} color="#1E3A5F" />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', margin: 0 }}>Resources</p>
              </div>
              {[
                { author: 'Emily', tag: 'Notes', title: 'Financial Reporting — Full Summary Notes', desc: 'Covers all lecture content + past paper answers. 28 pages.' },
                { author: 'Zafir', tag: 'Past Paper', title: 'Algorithms Exam 2023 — Worked Solutions', desc: 'Full solutions with complexity analysis for every question.' },
                { author: 'Fiza', tag: 'Mind Map', title: 'Cognitive Psychology — Chapter 3 Mind Map', desc: 'Visual breakdown of cognitive biases and memory models.' },
              ].map((r, i) => (
                <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(30,58,95,0.08)' : 'none', paddingTop: i > 0 ? '14px' : 0, marginTop: i > 0 ? '14px' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ background: '#F5F0E8', color: '#1E3A5F', borderRadius: '4px', padding: '2px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600' }}>{r.tag}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>by {r.author}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600', margin: 0 }}>{r.title}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{r.desc}</p>
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', fontWeight: '600', whiteSpace: 'nowrap' }}>View →</span>
                </div>
              ))}
            </div>

            {/* Mentorship board */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <UserPlus size={20} color="#1E3A5F" />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', margin: 0 }}>Mentorship</p>
              </div>
              {[
                { author: 'Gigi', course: 'Law · UCD', text: 'Looking for a 3rd or 4th year Law student to chat through module choices and what to expect in second year. Any help appreciated.', time: '2h ago' },
                { author: 'Eman', course: 'Engineering · UCD', text: 'Happy to mentor any 1st year Engineering students. I remember how overwhelming the first semester is. Drop me a message.', time: '1d ago' },
              ].map((m, i) => (
                <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(30,58,95,0.08)' : 'none', paddingTop: i > 0 ? '14px' : 0, marginTop: i > 0 ? '14px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '12px', color: '#FFFFFF' }}>{m.author.charAt(0)}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', fontWeight: '600' }}>{m.author}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{m.course}</span>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{m.time}</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: '8px 0 0' }}>{m.text}</p>
                </div>
              ))}
            </div>

          </div>
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
