import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  FileText, TrendingUp, Tag, Users, Globe, PiggyBank,
  UserCheck, Award,
} from 'lucide-react'

// ─── Countdown ─────────────────────────────────────────────────────────────────

// 30 Sept 2026 23:59:59 Irish Standard Time = 22:59:59 UTC
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
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <div style={{
      display: 'flex', gap: '8px', justifyContent: 'center',
      flexWrap: 'wrap', marginTop: '32px',
    }}>
      {units.map(({ value, label }) => (
        <div key={label} className="countdown-card" style={{
          background: '#FFFFFF', borderRadius: '8px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p className="countdown-value" style={{
            fontFamily: "'DM Serif Display', serif",
            color: '#1E3A5F', lineHeight: 1,
          }}>
            {String(value).padStart(2, '0')}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: '#6B7280', marginTop: '4px',
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    title: 'Download and create your free account',
    description: 'Sign up in under a minute. No payment required at any stage.',
  },
  {
    n: 2,
    title: 'Choose your service and submit your details',
    description: 'Select what you need and share your materials or brief.',
  },
  {
    n: 3,
    title: 'Reviewed by a Campus Handler or Uni Coach',
    description: 'A real person reviews your submission and prepares your output.',
  },
  {
    n: 4,
    title: 'Delivered to your inbox within your chosen timeframe',
    description: 'Receive your finished output ready to use.',
  },
]

const PILLARS = [
  {
    name: 'Foundation Blueprint',
    description: 'CV building, LinkedIn optimisation, cover letters, interview prep, and CAO support — every output reviewed by a trained Campus Handler before delivery.',
    href: '/foundation-blueprint',
    icon: FileText,
    link: 'Learn more →',
  },
  {
    name: 'Elevation Blueprint',
    description: 'Personal branding, network strategy, portfolio building, mentorship, pitch coaching, and postgrad support — delivered by specialist Uni Coaches.',
    href: '/elevation-blueprint',
    icon: TrendingUp,
    link: 'Learn more →',
  },
  {
    name: 'Lifestyle Blueprint',
    description: 'Exclusive student discounts and lifestyle deals curated for Irish campus life.',
    href: '/lifestyle-blueprint',
    icon: Tag,
    link: 'Learn more →',
  },
  {
    name: 'Campus Connect',
    description: 'Community boards to connect with students on your campus, share notes, and find study partners.',
    href: '/campus-connect',
    icon: Users,
    link: 'Learn more →',
  },
  {
    name: 'Course Connect',
    description: 'Course-specific discussion boards to collaborate with students studying the same subjects.',
    href: '/course-connect',
    icon: Globe,
    link: 'Learn more →',
  },
  {
    name: 'Budgeting Tool',
    description: 'A simple budgeting tool built for student life — track income, expenses, and savings goals.',
    href: '/coming-soon',
    icon: PiggyBank,
    link: 'Coming soon →',
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
  { name: 'Alex',     course: 'Digital Marketing',      university: 'TUS Athlone',          cao: 'US844' },
  { name: 'Fiza',     course: 'Psychology',             university: 'University of Galway', cao: 'GY104' },
  { name: 'Gigi',     course: 'Law',                    university: 'UCD',                  cao: 'DN030' },
  { name: 'Wami',     course: 'Medicine',               university: 'RCSI',                 cao: 'RC850' },
  { name: 'Daniel',   course: 'Architecture',           university: 'UCD',                  cao: 'DN060' },
  { name: 'Sam',      course: 'Civil Engineering',      university: 'TU Dublin',            cao: 'TU001' },
  { name: 'Harry',    course: 'Business and Law',       university: 'UCD',                  cao: 'DN700' },
  { name: 'Elizabeth',course: 'Pharmacy',               university: 'TCD',                  cao: 'TR073' },
  { name: 'Zafir',    course: 'Computer Science',       university: 'DCU',                  cao: 'DC182' },
  { name: 'Sean',     course: 'Agricultural Science',   university: 'UCD',                  cao: 'DN200' },
  { name: 'Seamus',   course: 'Early Childhood Education', university: 'ATU Galway',        cao: 'AU511' },
  { name: 'Sinead',   course: 'Social Work',            university: 'UCC',                  cao: 'CK320' },
  { name: 'Mairead',  course: 'Film and Television',    university: 'DCU',                  cao: 'DC231' },
  { name: 'Emma',     course: 'Psychology',             university: 'UL',                   cao: 'LM120' },
  { name: 'Mohammed', course: 'International Business', university: 'DCU',                  cao: 'DC217' },
  { name: 'Ahmed',    course: 'Electronic Engineering', university: 'UL',                   cao: 'LM043' },
  { name: 'Billy',    course: 'Sports Science',         university: 'ATU Galway',           cao: 'AU801' },
  { name: 'Fatima',   course: 'Radiography',            university: 'TCD',                  cao: 'TR058' },
  { name: 'Aoife',    course: 'Music',                  university: 'University of Galway', cao: 'GY200' },
  { name: 'Roisin',   course: 'Environmental Science',  university: 'UCC',                  cao: 'CK723' },
  { name: 'Kofi',     course: 'Marketing',              university: 'DCU',                  cao: 'DC222' },
  { name: 'Amara',    course: 'Criminology',            university: 'UCC',                  cao: 'CK590' },
  { name: 'James',    course: 'Mechanical Engineering', university: 'TU Dublin',            cao: 'TU003' },
  { name: 'Priya',    course: 'Dentistry',              university: 'TCD',                  cao: 'TR005' },
  { name: 'Luca',     course: 'Software Engineering',   university: 'UCD',                  cao: 'DN206' },
  { name: 'Sofia',    course: 'International Relations', university: 'DCU',                 cao: 'DC203' },
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
  return (
    <div style={{
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
          {name.charAt(0)}
        </span>
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', marginTop: '10px',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280', marginTop: '4px',
      }}>
        {course} · {university}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F', fontWeight: '600',
        marginTop: '12px',
      }}>
        CAO Code: {cao}
      </p>
    </div>
  )
}

// ─── PillarCard ────────────────────────────────────────────────────────────────

function PillarCard({ name, description, href, icon: Icon, link }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: hovered
          ? '0px 4px 20px rgba(30,58,95,0.14)'
          : '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '28px',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
        textDecoration: 'none',
      }}
    >
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={32} color="#1E3A5F" />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', color: '#1E3A5F', marginTop: '12px',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        marginTop: '8px', maxWidth: '260px', lineHeight: 1.5,
      }}>
        {description}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F', fontWeight: '600',
        marginTop: '12px',
      }}>
        {link}
      </p>
    </Link>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────

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
          logo: 'https://uniblueprint.com/og-image.png',
          description: 'The all-in-one platform for students, apprentices, and young people across Ireland.',
          sameAs: [
            'https://www.instagram.com/uniblueprint26',
            'https://www.tiktok.com/@uniblueprint26',
          ],
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'IE',
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'UniBlueprint',
          url: 'https://uniblueprint.com',
          description: 'The Structure Behind Your Success',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://uniblueprint.com/?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        })}</script>
      </Helmet>

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '90dvh',
        background: '#F5F0E8',
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '6px', padding: '6px 12px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '700',
        }}>
          <Sparkles size={14} />
          50% OFF — September Trial
        </div>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontFamily: "'DM Serif Display', serif",
            color: '#1E3A5F', textAlign: 'center',
            marginTop: '16px', maxWidth: '720px',
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
            marginTop: '16px', maxWidth: '560px', lineHeight: 1.65,
          }}
        >
          The all-in-one platform for students, apprentices, and young people across Ireland — CV support, career coaching, campus community, and lifestyle deals. Built for you.
        </p>

        {/* CTAs */}
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link
            to="/download"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', minWidth: '180px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Download the App
          </Link>
          <Link
            to="/how-it-works"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', minWidth: '180px', padding: '0 28px',
              background: 'transparent', color: '#1E3A5F',
              border: '1.5px solid #1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            See How It Works
          </Link>
        </div>

        {/* Social proof text */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '24px',
        }}>
          Launching September 2026 across Irish campuses
        </p>

      </section>

      {/* ── SECTION 2 — SEPTEMBER TRIAL BANNER ────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <h2
          className="trial-heading"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#F5F0E8' }}
        >
          50% OFF
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '20px', color: 'rgba(245,240,232,0.8)',
          marginTop: '12px',
        }}>
          The whole of September. Every service. Half the price.
        </p>

        <CountdownTimer />

        <Link
          to="/sign-up"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 36px', minWidth: '200px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '24px',
          }}
        >
          Get started free
        </Link>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>How It Works</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#1E3A5F', marginTop: '8px',
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
                {/* Number circle */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
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
                  fontSize: '18px', color: '#1E3A5F',
                  marginTop: '12px', textAlign: 'center', lineHeight: 1.3,
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', textAlign: 'center', lineHeight: 1.5,
                }}>
                  {step.description}
                </p>
              </div>

              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className="step-connector"
                  style={{
                    flex: '1 0 16px',
                    borderTop: '1px dashed rgba(30,58,95,0.2)',
                    marginTop: '24px',
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
          fontSize: '40px', color: '#1E3A5F', marginTop: '8px',
        }}>
          Five pillars. One platform.
        </h2>

        <div className="pillars-grid">
          {PILLARS.map(p => <PillarCard key={p.name} {...p} />)}
        </div>
      </section>

      {/* ── SECTION 5 — SOCIAL PROOF ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#1E3A5F',
        }}>
          Built for students, apprentices, and young people across Ireland
        </h2>

        <div className="testimonials-grid">
          {STUDENTS.slice(0, 6).map(s => <StudentCard key={s.name} {...s} />)}
        </div>

        {/* Partners strip */}
        <div style={{ marginTop: '56px' }}>
          <SectionLabel>Our Partners</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: '32px',
            marginTop: '20px', filter: 'grayscale(1)', opacity: 0.6,
          }}>
            {['CourseCompass', 'Whip Wizards', 'JMC Fitness', 'Nyz3ditz'].map(name => (
              <span key={name} style={{
                display: 'inline-flex', alignItems: 'center',
                height: '36px',
                fontFamily: "'DM Serif Display', serif",
                fontSize: '16px', color: '#1E3A5F',
              }}>
                {name}
              </span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '36px' }}>
              {[1,2,3].map(i => (
                <span key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#9CA3AF', display: 'inline-block',
                }} />
              ))}
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF',
            marginTop: '8px',
          }}>
            And more coming
          </p>
        </div>
      </section>

      {/* ── SECTION 5.5 — ADVERTISEMENT BOARD PREVIEW ─────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600', color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Advertisement Board
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Students helping students
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            textAlign: 'center', margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.65,
          }}>
            The Advertisement Board lets students post services, gigs, and opportunities — from grinds to graphic design. Free to post.
          </p>

          {/* Mock content banner */}
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            borderLeft: '3px solid #1E3A5F',
            padding: '20px', margin: '32px 0 0',
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
                These are sample posts to show what the Advertisement Board looks like in the app. Real posts are created by students.
              </p>
            </div>
          </div>

          {/* Ad cards — horizontal scroll */}
          <div style={{
            display: 'flex', gap: '16px',
            overflowX: 'auto', paddingBottom: '8px',
            marginTop: '24px',
            scrollbarWidth: 'thin',
          }}>
            {AD_BOARD_POSTS.map(ad => (
              <div key={ad.title} style={{
                flexShrink: 0, width: '280px', minHeight: '200px',
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '20px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#1E3A5F', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#FFFFFF' }}>
                        {ad.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600', margin: 0 }}>{ad.name}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{ad.university}</p>
                    </div>
                  </div>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>{ad.title}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.45 }}>{ad.description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{
                    background: '#F5F0E8', color: '#1E3A5F',
                    borderRadius: '6px', padding: '3px 10px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
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
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#1E3A5F',
        }}>
          Reviewed by real people. Every time.
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '16px auto 0', maxWidth: '640px', lineHeight: 1.65,
        }}>
          Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Every Elevation service is delivered by a specialist Uni Coach.
        </p>

        <div className="handler-coach-grid">
          {/* Campus Handler */}
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px', textAlign: 'center', flex: 1,
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <UserCheck size={32} color="#1E3A5F" />
            </div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F', marginTop: '16px',
            }}>
              Campus Handler
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '10px', lineHeight: 1.55,
            }}>
              Campus Handlers are trained students who review Foundation Blueprint submissions — essays, CVs, and applications — ensuring every output meets our quality standard.
            </p>
            <Link
              to="/join#handler-form"
              style={{
                display: 'inline-block', marginTop: '16px',
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
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px', textAlign: 'center', flex: 1,
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <Award size={32} color="#1E3A5F" />
            </div>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F', marginTop: '16px',
            }}>
              Uni Coach
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '10px', lineHeight: 1.55,
            }}>
              Uni Coaches are specialists who deliver Elevation Blueprint services — career coaching, interview preparation, and LinkedIn optimisation — for students ready to level up.
            </p>
            <Link
              to="/join#coach-form"
              style={{
                display: 'inline-block', marginTop: '16px',
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
        background: '#F5F0E8',
        padding: '100px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Your Blueprint starts here
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280', marginTop: '12px',
        }}>
          Free to join. No credit card required. September trial — 50% off everything.
        </p>

        <Link
          to="/download"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 36px', minWidth: '200px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '24px',
          }}
        >
          Download the App
        </Link>

        {/* TODO: Replace with real store links */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px',
        }}>
          <button style={{
            background: 'none',
            border: '1px solid rgba(30,58,95,0.2)',
            borderRadius: '8px', padding: '10px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF', cursor: 'pointer',
          }}>
            App Store
          </button>
          <button style={{
            background: 'none',
            border: '1px solid rgba(30,58,95,0.2)',
            borderRadius: '8px', padding: '10px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF', cursor: 'pointer',
          }}>
            Google Play
          </button>
        </div>
      </section>
    </>
  )
}
