import { Helmet } from 'react-helmet-async'
import { ArrowRight, Compass, BookOpen, Briefcase, GraduationCap, MessageSquare, Award } from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = '#1B4B5A'

// TODO: Replace with the real Course Compass website URL when confirmed
const CC_URL = 'https://coursecompass.ie'

// ─── Compasses ────────────────────────────────────────────────────────────────

const COMPASSES = [
  {
    icon: Briefcase,
    name: 'Career Compass',
    description: 'Find your career direction. Explore industries, roles, and the paths real people took to get there.',
    href: CC_URL,
  },
  {
    icon: BookOpen,
    name: 'CAO Compass',
    description: 'Navigate the CAO with confidence. Points, preferences, personal statements, and key dates covered.',
    href: CC_URL,
  },
  {
    icon: Compass,
    name: 'Apprenticeship Compass',
    description: 'Explore professional and trade apprenticeships across Ireland. Earn while you learn.',
    href: CC_URL,
  },
  {
    icon: GraduationCap,
    name: 'Postgrad Compass',
    description: 'Masters, PhD, MBA, and professional qualifications. Find the right programme and how to apply.',
    href: CC_URL,
  },
  {
    icon: MessageSquare,
    name: 'Interview Compass',
    description: 'Prepare for graduate scheme interviews, assessment centres, and sector-specific selection processes.',
    href: CC_URL,
  },
  {
    icon: Award,
    name: 'Scholarship Compass',
    description: 'Find funding, grants, bursaries, and scholarships available to Irish students at home and abroad.',
    href: CC_URL,
  },
]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .cc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 52px;
  }
  @media (max-width: 960px) { .cc-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .cc-grid { grid-template-columns: 1fr; } }
`

// ─── CompassCard ──────────────────────────────────────────────────────────────

function CompassCard({ icon: Icon, name, description, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: '14px',
          padding: '30px 28px 26px',
          height: '100%',
          boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
          transition: 'box-shadow 200ms ease, transform 200ms ease',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 10px 32px rgba(27,75,90,0.16)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,58,95,0.07)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: `rgba(27,75,90,0.08)`,
          border: `1px solid rgba(27,75,90,0.12)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '18px',
        }}>
          <Icon size={22} color={ACCENT} strokeWidth={1.7} />
        </div>

        {/* Name */}
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '20px', color: '#1E3A5F',
          lineHeight: 1.15, marginBottom: '10px',
        }}>
          {name}
        </p>

        {/* Description */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#6B7280',
          lineHeight: 1.65, marginBottom: '20px',
        }}>
          {description}
        </p>

        {/* CTA */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700',
          color: ACCENT,
        }}>
          Visit Course Compass <ArrowRight size={12} />
        </div>
      </div>
    </a>
  )
}

// ─── CourseCompassPage ────────────────────────────────────────────────────────

export default function CourseCompassPage() {
  return (
    <>
      <Helmet>
        <title>Course Compass | UniBlueprint</title>
        <meta name="description" content="Career, CAO, apprenticeship, postgrad, interview, and scholarship guidance. Course Compass helps Irish students find their direction." />
        <meta property="og:title" content="Course Compass | UniBlueprint" />
        <meta property="og:description" content="Career, CAO, apprenticeship, postgrad, interview, and scholarship guidance for Irish students." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '120px 24px 96px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
            color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase',
            letterSpacing: '0.1em', margin: '0 0 12px',
          }}>
            A UniBlueprint Partner
          </p>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 4.5vw, 52px)', color: '#F5F0E8',
            lineHeight: 1.1,
          }}>
            Course Compass
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', lineHeight: 1.7,
          }}>
            Guidance for every direction. Six compasses covering the decisions
            Irish students face most — from CAO choices to career paths, postgrad
            programmes, and everything in between.
          </p>
          <a
            href={CC_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '32px', height: '48px', padding: '0 26px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Visit coursecompass.ie <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* ── COMPASSES GRID ────────────────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '96px 24px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ maxWidth: '1040px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
              color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
            }}>
              Six compasses
            </p>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Find your direction
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '12px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Each compass covers a distinct decision area. Click any card to
              go directly to Course Compass.
            </p>
          </div>

          <div className="cc-grid">
            {COMPASSES.map(c => <CompassCard key={c.name} {...c} />)}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '88px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
            color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px',
          }}>
            About
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(24px, 3vw, 36px)', color: '#1E3A5F',
            lineHeight: 1.15,
          }}>
            Built for Irish students, by someone who has been through it
          </h2>

          {/* Pull quote */}
          <blockquote style={{
            margin: '32px 0',
            padding: '24px 28px',
            background: '#F5F0E8',
            borderLeft: `4px solid ${ACCENT}`,
            borderRadius: '0 10px 10px 0',
            textAlign: 'left',
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(17px, 2vw, 21px)',
              color: '#1E3A5F',
              lineHeight: 1.45,
              margin: 0,
              fontStyle: 'italic',
            }}>
              "Every student deserves personalised career guidance that goes beyond test scores."
            </p>
          </blockquote>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#6B7280',
            marginTop: '16px', lineHeight: 1.7,
          }}>
            Course Compass is a guidance resource created to help young people in
            Ireland navigate the decisions that matter most: what to study, where
            to apply, how to get a foot in the door, and where to go next.
            Available through the UniBlueprint app and directly at coursecompass.ie.
          </p>
          <a
            href={CC_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '28px', height: '46px', padding: '0 24px',
              background: ACCENT, color: '#F5F0E8', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Go to Course Compass <ArrowRight size={14} />
          </a>
        </div>
      </section>
    </>
  )
}
