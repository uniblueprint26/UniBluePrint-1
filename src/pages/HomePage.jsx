import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  FileText, TrendingUp, Tag, Users, Globe, PiggyBank,
  UserCheck, Award, ArrowRight,
} from 'lucide-react'

// ─── Countdown ─────────────────────────────────────────────────────────────────

const TRIAL_END = new Date('2026-09-30T22:59:59Z')

function calcTimeLeft() {
  const diff = Math.max(0, TRIAL_END.getTime() - Date.now())
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  }
}

function CountdownTimer() {
  const [prefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [time, setTime] = useState(calcTimeLeft)

  useEffect(() => {
    if (prefersReduced) return
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [prefersReduced])

  const units = [
    { value: time.days,    label: 'Days' },
    { value: time.hours,   label: 'Hours' },
    { value: time.minutes, label: 'Mins' },
    { value: time.seconds, label: 'Secs' },
  ]

  return (
    <div style={{
      display: 'flex', gap: '10px', justifyContent: 'center',
      flexWrap: 'wrap', marginTop: '28px',
    }}>
      {units.map(({ value, label }) => (
        <div key={label} className="countdown-card" style={{
          background: 'rgba(245,240,232,0.12)',
          border: '1px solid rgba(245,240,232,0.18)',
          borderRadius: '10px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p className="countdown-value" style={{
            fontFamily: "'DM Serif Display', serif",
            color: '#F5F0E8', lineHeight: 1,
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: 'rgba(245,240,232,0.6)', marginTop: '4px',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────────

const STATS = [
  { n: '35+',  label: 'Students signed up' },
  { n: '10+',  label: 'Irish universities' },
  { n: '6',    label: 'Partner businesses' },
  { n: 'Free', label: 'To join, always' },
]

const STEPS = [
  {
    n: 1,
    title: 'Create your free account',
    description: 'Sign up in under a minute. No payment required.',
  },
  {
    n: 2,
    title: 'Choose your service',
    description: 'Select what you need and share your materials or brief.',
  },
  {
    n: 3,
    title: 'Reviewed by a real person',
    description: 'A Campus Handler or Uni Coach prepares your output.',
  },
  {
    n: 4,
    title: 'Delivered within your timeframe',
    description: 'Receive your finished output ready to use.',
  },
]

const PILLARS = [
  {
    name: 'Foundation Blueprint',
    description: 'CV building, LinkedIn optimisation, cover letters, interview prep, and CAO support — every output reviewed by a trained Campus Handler before delivery.',
    href: '/foundation-blueprint',
    icon: FileText,
    link: 'Explore services →',
    bg: '#EFF6FF',
  },
  {
    name: 'Elevation Blueprint',
    description: 'Personal branding, network strategy, portfolio building, mentorship, pitch coaching, and postgrad support — delivered by specialist Uni Coaches.',
    href: '/elevation-blueprint',
    icon: TrendingUp,
    link: 'Meet the coaches →',
    bg: '#F0FDF4',
  },
  {
    name: 'Campus Connect',
    description: 'Community boards to connect with students on your campus — accommodation, marketplace, events, carpooling, and more.',
    href: '/campus-connect',
    icon: Users,
    link: 'See what\'s on →',
    bg: '#FFF7ED',
  },
  {
    name: 'Lifestyle Blueprint',
    description: 'Exclusive student discounts, mental health support resources, and budgeting tools — all curated for Irish campus life.',
    href: '/lifestyle-blueprint',
    icon: Tag,
    link: 'Browse deals →',
    bg: '#FDF4FF',
  },
  {
    name: 'Course Connect',
    description: 'Course-specific discussion boards, notes sharing, study groups, and module Q&A — collaborate with students studying the same subjects.',
    href: '/course-connect',
    icon: Globe,
    link: 'Find your course →',
    bg: '#F0F9FF',
  },
  {
    name: 'Budgeting Tool',
    description: 'A simple budgeting tool built for student life — track income, expenses, and savings goals. Coming this September.',
    href: '/coming-soon',
    icon: PiggyBank,
    link: 'Coming soon →',
    bg: '#FFFBEB',
  },
]

const STUDENTS = [
  { name: 'Abdullah', course: 'Business',              university: 'ATU Galway',           cao: 'AU601' },
  { name: 'Eman',     course: 'Engineering',            university: 'UCD',                  cao: 'DN150' },
  { name: 'Emily',    course: 'Accounting and Finance', university: 'DCU',                  cao: 'DC115' },
  { name: 'Siofra',   course: 'Arts',                   university: 'UCC',                  cao: 'CK111' },
  { name: 'Ciarán',   course: 'Computer Science',       university: 'UL',                   cao: 'LM121' },
  { name: 'Nicole',   course: 'Nursing',                university: 'Maynooth University',  cao: 'MH701' },
  { name: 'Sienna',   course: 'Nursing',                university: 'SETU Waterford',       cao: 'SE915' },
  { name: 'Basmali',  course: 'Computing',              university: 'MTU',                  cao: 'MT803' },
  { name: 'Ethan',    course: 'Sports Science',         university: 'TU Dublin',            cao: 'TU936' },
]

const AD_BOARD_POSTS = [
  { name: 'Aoife', university: 'University of Galway', title: 'Piano & Music Lessons', description: '1-to-1 lessons from a 3rd year Music student. All levels welcome.', tag: 'Lessons', price: 'From €20/hr' },
  { name: 'Luca',  university: 'UCD',                  title: 'Graphic Design Services', description: 'Logos, social media content, and branding for student projects.', tag: 'Design', price: 'From €50' },
  { name: 'Zafir', university: 'DCU',                  title: 'Maths & Stats Grinds', description: 'Leaving Cert and 1st year college maths. Past papers and exam prep.', tag: 'Grinds', price: '€25/hr' },
  { name: 'Sam',   university: 'TU Dublin',            title: 'Car Washing & Detailing', description: 'Full exterior wash, interior clean, and polish. Sligo & Dublin.', tag: 'Service', price: 'From €40' },
  { name: 'Emma',  university: 'UL',                   title: 'Essay Proofreading', description: 'Academic proofreading and feedback. 24hr turnaround available.', tag: 'Academic', price: 'From €15' },
  { name: 'Kofi',  university: 'DCU',                  title: 'Social Media Management', description: 'Instagram and TikTok strategy, posting, and growth for small businesses.', tag: 'Marketing', price: 'From €80/mo' },
  { name: 'Fatima', university: 'TCD',                 title: 'Photography & Content', description: 'Events, portraits, and content creation for social media.', tag: 'Creative', price: 'From €60' },
]

// ─── StudentCard ───────────────────────────────────────────────────────────────

function StudentCard({ name, course, university, cao }) {
  const INITIALS_COLORS = ['#1E3A5F', '#15803D', '#0369A1', '#7C3AED', '#C2410C', '#B8860B', '#0F766E', '#9D174D']
  const colorIdx = name.charCodeAt(0) % INITIALS_COLORS.length
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.07)',
      padding: '20px', textAlign: 'left',
      border: '1px solid rgba(30,58,95,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: INITIALS_COLORS[colorIdx],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px', color: '#FFFFFF', lineHeight: 1,
          }}>
            {name.charAt(0)}
          </span>
        </div>
        <div>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '16px', color: '#1E3A5F', margin: 0,
          }}>
            {name}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF', marginTop: '2px',
          }}>
            {university}
          </p>
        </div>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
      }}>
        {course}
      </p>
      <div style={{
        display: 'inline-block', marginTop: '10px',
        background: '#F5F0E8', borderRadius: '6px',
        padding: '3px 10px',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#1E3A5F', fontWeight: '600',
        }}>
          CAO: {cao}
        </p>
      </div>
    </div>
  )
}

// ─── PillarCard ────────────────────────────────────────────────────────────────

function PillarCard({ name, description, href, icon: Icon, link, bg }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: bg,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: hovered
          ? '0px 4px 20px rgba(30,58,95,0.12)'
          : '0px 2px 8px rgba(30,58,95,0.05)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        textDecoration: 'none',
        border: '1px solid rgba(30,58,95,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <div style={{
          width: '46px', height: '46px',
          background: '#FFFFFF', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0px 1px 4px rgba(30,58,95,0.1)',
        }}>
          <Icon size={22} color="#1E3A5F" />
        </div>
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '17px', color: '#1E3A5F', lineHeight: 1.25,
        }}>
          {name}
        </p>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        lineHeight: 1.55, flex: 1,
      }}>
        {description}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F', fontWeight: '600',
        marginTop: '16px',
      }}>
        {link}
      </p>
    </Link>
  )
}

// ─── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '600',
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      {children}
    </p>
  )
}

// ─── HomePage ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>UniBlueprint — The Structure Behind Your Success</title>
        <meta name="description" content="The all-in-one platform for students, apprentices, and young people across Ireland. CV support, career coaching, campus community, and lifestyle deals. Launching September 2026." />
        <meta property="og:title" content="UniBlueprint — The Structure Behind Your Success" />
        <meta property="og:description" content="The all-in-one platform for students, apprentices, and young people across Ireland. CV support, career coaching, campus community, and lifestyle deals. Launching September 2026." />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'UniBlueprint',
          url: 'https://uniblueprint.com',
          description: 'The all-in-one platform for students, apprentices, and young people across Ireland.',
          sameAs: [
            'https://www.instagram.com/uniblueprint26',
            'https://www.tiktok.com/@uniblueprint26',
          ],
          address: { '@type': 'PostalAddress', addressCountry: 'IE' },
        })}</script>
      </Helmet>

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '90dvh',
        background: '#F5F0E8',
        padding: '80px 24px 72px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Launch badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '6px 14px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700',
          letterSpacing: '0.02em',
        }}>
          <Sparkles size={13} />
          50% OFF · September Trial
        </div>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontFamily: "'DM Serif Display', serif",
            color: '#1E3A5F', textAlign: 'center',
            marginTop: '20px', maxWidth: '740px',
          }}
        >
          The Structure Behind Your Success
        </h1>

        {/* Subheadline */}
        <p
          className="hero-subheadline"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#6B7280', textAlign: 'center',
            marginTop: '18px', maxWidth: '560px', lineHeight: 1.65,
          }}
        >
          The all-in-one platform for students, apprentices, and young people across Ireland — CV support, career coaching, campus community, and lifestyle deals.
        </p>

        {/* CTAs */}
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link
            to="/download"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '52px', minWidth: '180px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Download the App
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/how-it-works"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', minWidth: '180px', padding: '0 28px',
              background: 'transparent', color: '#1E3A5F',
              border: '1.5px solid rgba(30,58,95,0.35)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            See How It Works
          </Link>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', gap: '40px', justifyContent: 'center',
          marginTop: '56px', flexWrap: 'wrap',
          paddingTop: '32px',
          borderTop: '1px solid rgba(30,58,95,0.1)',
          width: '100%', maxWidth: '680px',
        }}>
          {STATS.map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '26px', color: '#1E3A5F',
              }}>{n}</p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#9CA3AF', marginTop: '4px',
              }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2 — SEPTEMBER TRIAL BANNER ────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '72px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '600', color: 'rgba(245,240,232,0.55)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          September Trial
        </p>

        <h2
          className="trial-heading"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#F5F0E8', marginTop: '6px' }}
        >
          50% Off. Every service.
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: 'rgba(245,240,232,0.72)',
          marginTop: '10px', maxWidth: '480px', margin: '10px auto 0', lineHeight: 1.6,
        }}>
          The whole of September. CVs, LinkedIn, cover letters, coaching — all at half price.
        </p>

        <CountdownTimer />

        <Link
          to="/sign-up"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            height: '52px', padding: '0 36px', minWidth: '200px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '28px',
          }}
        >
          Get started free
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>How It Works</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '38px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Your Blueprint in four steps
        </h2>

        <div className="steps-row">
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flex: '1 0 0', maxWidth: '220px', minWidth: '140px',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '22px', color: '#F5F0E8',
                  }}>
                    {step.n}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '17px', color: '#1E3A5F',
                  marginTop: '14px', textAlign: 'center', lineHeight: 1.3,
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', textAlign: 'center', lineHeight: 1.55,
                }}>
                  {step.description}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className="step-connector"
                  style={{
                    flex: '1 0 16px',
                    borderTop: '1.5px dashed rgba(30,58,95,0.15)',
                    marginTop: '26px',
                  }}
                />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — PILLARS GRID ───────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>Everything in one place</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '38px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Five pillars. One platform.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          marginTop: '12px', maxWidth: '520px',
          marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6,
        }}>
          Everything an Irish student needs — from a polished CV to finding your study group — in a single app.
        </p>

        <div className="pillars-grid">
          {PILLARS.map(p => <PillarCard key={p.name} {...p} />)}
        </div>
      </section>

      {/* ── SECTION 5 — SOCIAL PROOF ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>Who's using UniBlueprint</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '38px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Built for students across Ireland
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          marginTop: '12px', maxWidth: '480px',
          marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6,
        }}>
          From UCD to ATU, from Business to Nursing — UniBlueprint is open to every student in Ireland.
        </p>

        <div className="testimonials-grid">
          {STUDENTS.map(s => <StudentCard key={s.name} {...s} />)}
        </div>

        {/* Partners strip */}
        <div style={{ marginTop: '56px', paddingTop: '40px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <SectionLabel>Our Partners</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: '32px',
            marginTop: '20px',
          }}>
            {['CourseCompass', 'Whip Wizardz', 'JMC Fitness', 'Nyz3ditz', 'Énergie Fitness', 'The Nail Nurse'].map(name => (
              <span key={name} style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600', color: 'rgba(30,58,95,0.35)',
                letterSpacing: '0.01em',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5.5 — ADVERTISEMENT BOARD PREVIEW ─────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>Advertisement Board</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '38px', color: '#1E3A5F',
              marginTop: '8px',
            }}>
              Students helping students
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.65,
            }}>
              The Advertisement Board lets students post services, gigs, and opportunities — from grinds to graphic design. Free to post.
            </p>
          </div>

          {/* Sample content notice */}
          <div style={{
            background: '#FFFFFF', borderRadius: '10px',
            borderLeft: '3px solid #1E3A5F',
            padding: '16px 20px', margin: '32px 0 0',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <Sparkles size={18} color="#1E3A5F" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#1E3A5F', margin: 0 }}>
                Example content
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                These are sample posts. Real posts are created by students after launch.
              </p>
            </div>
          </div>

          {/* Ad cards */}
          <div style={{
            display: 'flex', gap: '14px',
            overflowX: 'auto', paddingBottom: '8px',
            marginTop: '20px', scrollbarWidth: 'thin',
          }}>
            {AD_BOARD_POSTS.map(ad => (
              <div key={ad.title} style={{
                flexShrink: 0, width: '272px',
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 10px rgba(30,58,95,0.07)',
                padding: '20px',
                display: 'flex', flexDirection: 'column',
                border: '1px solid rgba(30,58,95,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#1E3A5F', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#FFFFFF' }}>
                      {ad.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600', margin: 0 }}>{ad.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{ad.university}</p>
                  </div>
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#1E3A5F', margin: 0 }}>{ad.title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.45, flex: 1 }}>{ad.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{
                    background: '#F5F0E8', color: '#1E3A5F',
                    borderRadius: '6px', padding: '3px 10px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
                  }}>
                    {ad.tag}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600' }}>
                    {ad.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — HANDLER AND COACH CALLOUT ─────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>Quality you can count on</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '38px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Reviewed by real people. Every time.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '14px auto 0', maxWidth: '580px', lineHeight: 1.65,
        }}>
          Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Every Elevation service is delivered by a specialist Uni Coach.
        </p>

        <div className="handler-coach-grid">
          {/* Campus Handler */}
          <div style={{
            background: '#F5F0E8', borderRadius: '12px',
            padding: '32px 28px', textAlign: 'center', flex: 1,
            border: '1px solid rgba(30,58,95,0.08)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#1E3A5F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <UserCheck size={30} color="#F5F0E8" />
            </div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '22px', color: '#1E3A5F', marginTop: '18px',
            }}>
              Campus Handler
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '10px', lineHeight: 1.6,
            }}>
              Campus Handlers are trained students who review Foundation Blueprint submissions — CVs, essays, and applications — ensuring every output meets our quality standard.
            </p>
            <Link
              to="/join#handler-form"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
                textDecoration: 'none',
              }}
            >
              Join the team →
            </Link>
          </div>

          {/* Uni Coach */}
          <div style={{
            background: '#F5F0E8', borderRadius: '12px',
            padding: '32px 28px', textAlign: 'center', flex: 1,
            border: '1px solid rgba(30,58,95,0.08)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#1E3A5F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <Award size={30} color="#F5F0E8" />
            </div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '22px', color: '#1E3A5F', marginTop: '18px',
            }}>
              Uni Coach
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '10px', lineHeight: 1.6,
            }}>
              Uni Coaches are specialists who deliver Elevation Blueprint services — career coaching, interview preparation, and LinkedIn optimisation — for students ready to level up.
            </p>
            <Link
              to="/join#coach-form"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
                textDecoration: 'none',
              }}
            >
              Join as a Coach →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — FINAL CTA ──────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '100px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '600', color: 'rgba(245,240,232,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Get started today
        </p>

        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#F5F0E8', marginTop: '8px',
        }}>
          Your Blueprint starts here
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '14px',
          maxWidth: '440px', margin: '14px auto 0', lineHeight: 1.6,
        }}>
          Free to join. No credit card required. September trial — 50% off everything.
        </p>

        <Link
          to="/download"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            height: '52px', padding: '0 36px', minWidth: '200px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '28px',
          }}
        >
          Download the App
          <ArrowRight size={16} />
        </Link>

        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px',
        }}>
          <button style={{
            background: 'none',
            border: '1px solid rgba(245,240,232,0.2)',
            borderRadius: '8px', padding: '10px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.5)', cursor: 'pointer',
          }}>
            App Store
          </button>
          <button style={{
            background: 'none',
            border: '1px solid rgba(245,240,232,0.2)',
            borderRadius: '8px', padding: '10px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.5)', cursor: 'pointer',
          }}>
            Google Play
          </button>
        </div>
      </section>
    </>
  )
}
