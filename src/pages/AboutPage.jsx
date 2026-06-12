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
    description: 'Growing awareness across Irish campuses and positioning the Uniblueprint brand.',
  },
  {
    title: 'Outreach',
    description: 'Connecting with students, universities, and partners on the ground.',
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
    description: 'Building relationships with businesses and institutions that benefit our students.',
  },
]

// TODO: Replace milestone dates and descriptions with real launch history
const MILESTONES = [
  {
    date: 'TODO: Date',
    title: 'Idea conceived',
    description: 'TODO: Insert founding story milestone — where the idea came from.',
  },
  {
    date: 'TODO: Date',
    title: 'Team assembled',
    description: 'TODO: Insert milestone — first team members and initial planning phase.',
  },
  {
    date: 'TODO: Date',
    title: 'Platform build begins',
    description: 'TODO: Insert milestone — development kickoff and first prototype.',
  },
  {
    date: 'TODO: Date',
    title: 'Beta testing',
    description: 'TODO: Insert milestone — closed beta with early student testers.',
  },
  {
    date: 'September 2026',
    title: 'Public launch',
    description: 'Launching across Irish universities and colleges during freshers week.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
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
    </div>
  )
}

function TimelineNode({ date, title, description, isLast }) {
  return (
    <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
      {/* Left column: node + connector line */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flexShrink: 0, width: '20px',
      }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          background: '#1E3A5F', flexShrink: 0, marginTop: '4px',
        }} />
        {!isLast && (
          <div style={{
            flex: 1, width: '1px',
            background: 'rgba(30,58,95,0.2)',
            marginTop: '6px',
          }} />
        )}
      </div>

      {/* Right column: text */}
      <div style={{ paddingBottom: isLast ? 0 : '32px' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
        }}>
          {date}
        </p>
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '16px', color: '#1E3A5F', marginTop: '4px',
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#6B7280',
          marginTop: '4px', lineHeight: 1.6,
        }}>
          {description}
        </p>
      </div>
    </div>
  )
}

// ─── AboutPage ─────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About | Uniblueprint</title>
        <meta
          name="description"
          content="Uniblueprint — built for Irish students and young people. Our mission, our story, and the team behind the Blueprint."
        />
        <meta property="og:title" content="About | Uniblueprint" />
        <meta property="og:description" content="Uniblueprint — built for Irish students and young people. Our mission, our story, and the team behind the Blueprint." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#FFFFFF',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          About Uniblueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          marginTop: '12px', maxWidth: '560px',
          margin: '12px auto 0', lineHeight: 1.6,
        }}>
          Built for Irish students. By people who understand the journey.
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
              The structure behind your success — for every young person in Ireland
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '16px', lineHeight: 1.8,
            }}>
              {/* TODO: Replace with real mission statement copy */}
              TODO: Insert mission statement — 3–4 sentences describing why Uniblueprint exists, what problem it solves for Irish students, and what the long-term vision looks like.
            </p>
          </div>

          {/* Right: pull quote */}
          <div style={{
            background: '#F5F0E8',
            borderLeft: '3px solid #1E3A5F',
            borderRadius: '12px',
            padding: '28px',
            alignSelf: 'start',
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '22px', color: '#1E3A5F',
              fontStyle: 'italic', lineHeight: 1.45,
            }}>
              {/* TODO: Replace with real founder quote */}
              "TODO: Insert founder quote here"
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#9CA3AF',
              marginTop: '12px',
            }}>
              {/* TODO: Replace with founder name and title */}
              TODO: Founder name, Co-founder &amp; CEO
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
      </section>

      {/* ── SECTION 5 — LAUNCH TIMELINE ──────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          The Journey
        </h2>

        <div style={{ maxWidth: '700px', margin: '40px auto 0', padding: '0 24px' }}>
          {MILESTONES.map((m, i) => (
            <TimelineNode
              key={m.title}
              date={m.date}
              title={m.title}
              description={m.description}
              isLast={i === MILESTONES.length - 1}
            />
          ))}
        </div>
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
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
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
