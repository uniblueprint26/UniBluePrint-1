import { useState, useEffect, useId, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ChevronDown, Trophy, Medal, Sparkles, CheckCircle2, GraduationCap,
  Library, Users, Briefcase,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { CONTRIBUTOR_CATEGORIES, CATEGORY_GROUPS } from '../../data/contributorCategories'

// ─── Deadline countdown ─────────────────────────────────────────────────────────

const CHALLENGE_DEADLINE = new Date('2026-08-31T22:59:59Z') // 31 Aug 2026, 23:59 Irish Summer Time

function calcTimeLeft() {
  const diff = Math.max(0, CHALLENGE_DEADLINE.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
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
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <div
      aria-label="Countdown to Blueprint Contributors Challenge deadline"
      aria-live="off"
      role="timer"
      style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}
    >
      {units.map(({ value, label }) => (
        <div key={label} className="countdown-card" style={{ background: '#F5F0E8', borderRadius: '8px', textAlign: 'center', flexShrink: 0 }}>
          <p aria-label={`${value} ${label}`} className="countdown-value" style={{ fontFamily: "'DM Serif Display', serif", color: '#1E3A5F', lineHeight: 1 }}>
            <span aria-hidden="true">{String(value).padStart(2, '0')}</span>
          </p>
          <p aria-hidden="true" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const JUDGING_CRITERIA = [
  { icon: Sparkles, title: 'Quality & accuracy', description: 'Well-researched, correct, genuinely useful content beats volume every time.' },
  { icon: CheckCircle2, title: 'Originality & variety', description: 'A range of contribution types across categories shows real breadth of impact.' },
  { icon: Trophy, title: 'Overall impact', description: 'How much your contributions help the students who use them after launch.' },
]

const GROUP_ICONS = {
  'leaving-cert': GraduationCap,
  'notes-course': Library,
  'campus': Users,
  'careers': Briefcase,
}

const HOW_IT_WORKS_STEPS = [
  { n: 1, title: 'Create your account', description: 'Sign up free and set up your Blueprint Contributor profile in under two minutes.' },
  { n: 2, title: 'Upload valuable content', description: 'Choose a category in the Upload Centre and submit notes, reviews, resources or opportunities.' },
  { n: 3, title: 'UniBlueprint reviews it', description: 'Our team checks every submission for quality, accuracy and usefulness before it goes live.' },
  { n: 4, title: 'It goes live at launch', description: 'Approved content appears on UniBlueprint from day one — built by students, for students.' },
]

const FAQS = [
  {
    q: 'Who can become a Blueprint Contributor?',
    a: 'Any student in Ireland — university, 5th year, 6th year, apprentice, or young worker — can become a Blueprint Contributor. Create a free account and start contributing.',
  },
  {
    q: 'How do I contribute?',
    a: 'Sign up, then head to the Upload Centre in your Contributor Dashboard. Choose a category — from Leaving Cert Notes to Course Reviews to Careers & Opportunities — and fill in the structured form.',
  },
  {
    q: 'How is the €100 winner chosen?',
    a: 'Judging is based on quality, usefulness, accuracy, originality, variety, and overall impact — not purely on quantity. A small number of highly valuable contributions can outweigh hundreds of low-quality uploads.',
  },
  {
    q: 'What content is accepted?',
    a: 'Notes, resources, reviews, experiences, events, opportunities and more — across the Leaving Cert Hub, Course Connect, Campus Life, and Careers categories. Every submission is reviewed before it goes live.',
  },
  {
    q: 'Can I upload anonymously?',
    a: 'Your submissions are linked to your Contributor account for review and competition tracking, but your name is never published alongside content without your permission.',
  },
  {
    q: 'When does the competition end?',
    a: 'The Blueprint Contributors Challenge closes on 31 August 2026 at 11:59 PM. Only approved submissions made before launch are eligible for the prize and Top 10 recognition.',
  },
  {
    q: 'What happens after approval?',
    a: 'Approved content is added to the UniBlueprint content library so it is ready for students to use from launch day in September 2026.',
  },
]

// ─── Small pieces ───────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </p>
  )
}

function CategoryCard({ category, uploadHref }) {
  const Icon = category.icon
  return (
    <Link
      to={uploadHref}
      style={{
        display: 'block',
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '24px', textDecoration: 'none',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0px 4px 20px rgba(30,58,95,0.14)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)')}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color="#1E3A5F" aria-hidden="true" />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginTop: '12px' }}>
        {category.label}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>
        {category.description}
      </p>
    </Link>
  )
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerId = useId()
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', overflow: 'hidden' }}>
      <button
        id={triggerId}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-accordion-trigger
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '500', color: '#1E3A5F' }}>
          {question}
        </span>
        <ChevronDown size={18} color="#6B7280" aria-hidden="true" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
      </button>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.7, paddingTop: '16px' }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function AccordionGroup({ children }) {
  const groupRef = useRef(null)
  function handleKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const triggers = Array.from(groupRef.current?.querySelectorAll('[data-accordion-trigger]') || [])
    const idx = triggers.indexOf(document.activeElement)
    if (idx === -1) return
    e.preventDefault()
    if (e.key === 'ArrowDown') triggers[(idx + 1) % triggers.length]?.focus()
    else triggers[(idx - 1 + triggers.length) % triggers.length]?.focus()
  }
  return <div ref={groupRef} onKeyDown={handleKeyDown}>{children}</div>
}

// ─── ContributorsLandingPage ────────────────────────────────────────────────────

export default function ContributorsLandingPage() {
  const { user } = useAuth()
  const primaryHref = user ? '/contributors/dashboard' : '/sign-up'
  const uploadHref = user ? '/contributors/upload' : '/sign-up'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }

  return (
    <>
      <Helmet>
        <title>Blueprint Contributors | UniBlueprint</title>
        <meta
          name="description"
          content="Become a Blueprint Contributor and help build Ireland's Student Success Library. Submit Leaving Cert notes, course reviews, campus knowledge and more before the September 2026 launch. €100 cash prize and Top 10 national recognition."
        />
        <meta property="og:title" content="Blueprint Contributors | UniBlueprint" />
        <meta property="og:description" content="Help build Ireland's Student Success Library. Become a Blueprint Contributor before launch." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>Blueprint Contributors</SectionLabel>
        <h1 className="hero-headline" style={{ fontFamily: "'DM Serif Display', serif", color: '#1E3A5F', marginTop: '12px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' }}>
          Help Build Ireland's Student Success Library
        </h1>
        <p className="hero-subheadline" style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B7280', margin: '16px auto 0', maxWidth: '620px', lineHeight: 1.7 }}>
          Become a Blueprint Contributor and help thousands of students access real notes, resources, reviews, opportunities and campus knowledge from day one.
        </p>
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link
            to={primaryHref}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px', minWidth: '240px',
              background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600', textDecoration: 'none',
            }}
          >
            Become a Blueprint Contributor
          </Link>
          <a
            href="#about-contributors"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px',
              background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '500', textDecoration: 'none',
            }}
          >
            Learn More
          </a>
        </div>
      </section>

      {/* ── SECTION 2 — ABOUT ────────────────────────────────────────────── */}
      <section id="about-contributors" style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="about-mission-grid">
            <div>
              <SectionLabel>What is a Blueprint Contributor?</SectionLabel>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '8px' }}>
                A mission, not a task list
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '16px', lineHeight: 1.8 }}>
                Blueprint Contributors are students who share real knowledge — Leaving Cert notes, course reviews, campus tips, career opportunities — before UniBlueprint officially launches in September 2026.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '12px', lineHeight: 1.8 }}>
                Every contribution helps build a content library that supports students from Leaving Certificate through CAO decisions, college, apprenticeships and careers — so the next student who joins UniBlueprint has real, useful, student-made resources from the very first day.
              </p>
            </div>
            <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '32px' }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
                Why it matters
              </h3>
              <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none' }}>
                {[
                  'Students launching in September see real value immediately — not an empty platform.',
                  'Your notes, reviews and advice genuinely help the next student behind you.',
                  'You get recognised for the impact you make, not just the amount you upload.',
                ].map(text => (
                  <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} color="#16A34A" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', lineHeight: 1.6 }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — CHALLENGE ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>The competition</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '8px' }}>
            Blueprint Contributors Challenge
          </h2>

          {/* Prize card */}
          <div style={{
            marginTop: '40px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto',
            background: '#1E3A5F', borderRadius: '16px', padding: '48px 32px',
          }}>
            <Trophy size={40} color="#F5F0E8" aria-hidden="true" style={{ margin: '0 auto', display: 'block' }} />
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#F5F0E8', marginTop: '16px' }}>
              €100 Cash Prize
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(245,240,232,0.75)', marginTop: '8px', lineHeight: 1.7, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              Awarded to the Blueprint Contributor who creates the biggest impact before launch. Not based purely on quantity — a small number of highly valuable contributions can outweigh hundreds of low-quality uploads.
            </p>
            <CountdownTimer />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(245,240,232,0.6)', marginTop: '16px' }}>
              Deadline: 31 August 2026, 11:59 PM
            </p>
          </div>

          {/* Judging criteria */}
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginTop: '56px' }}>
            How the winner is chosen
          </h3>
          <div className="about-diff-grid" style={{ maxWidth: '1000px', margin: '32px auto 0' }}>
            {JUDGING_CRITERIA.map(({ icon: Icon, title, description }) => (
              <div key={title} style={{ background: '#F5F0E8', borderRadius: '12px', padding: '24px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Icon size={20} color="#1E3A5F" aria-hidden="true" />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginTop: '12px' }}>{title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>

          {/* Top 10 */}
          <div style={{
            marginTop: '40px', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto',
            background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px', display: 'flex', alignItems: 'flex-start', gap: '16px', textAlign: 'left',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Medal size={22} color="#1E3A5F" aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
                Top 10 Blueprint Contributors across Ireland
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.7 }}>
                Recognised at launch for their contribution and impact in helping build UniBlueprint before release — judged on the same criteria as the cash prize.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — CONTENT CATEGORIES ───────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>What you can submit</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '8px' }}>
              Content categories
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.7 }}>
              From Leaving Cert revision to career opportunities — every category supports a different stage of the student journey.
            </p>
          </div>

          {CATEGORY_GROUPS.map(group => {
            const GroupIcon = GROUP_ICONS[group.id]
            const categories = CONTRIBUTOR_CATEGORIES.filter(c => c.group === group.id)
            return (
              <div key={group.id} style={{ marginTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <GroupIcon size={20} color="#1E3A5F" aria-hidden="true" />
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>
                    {group.label}
                  </h3>
                </div>
                <div className="services-grid">
                  {categories.map(category => (
                    <CategoryCard key={category.id} category={category} uploadHref={`${uploadHref}${user ? `?category=${category.id}` : ''}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── SECTION 5 — HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <SectionLabel>How it works</SectionLabel>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '8px' }}>
          From submission to launch in four steps
        </h2>

        <div className="steps-row">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 0', maxWidth: '220px', minWidth: '140px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#F5F0E8' }}>{step.n}</span>
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', marginTop: '12px', textAlign: 'center', lineHeight: 1.3 }}>
                  {step.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', textAlign: 'center', lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="step-connector" style={{ flex: '1 0 16px', borderTop: '1px dashed rgba(30,58,95,0.2)', marginTop: '24px' }} />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* ── SECTION 6 — FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <AccordionGroup>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
              {FAQS.map(({ q, a }) => (
                <AccordionItem key={q} question={q} answer={a} />
              ))}
            </div>
          </AccordionGroup>
        </div>
      </section>

      {/* ── SECTION 7 — CTA ──────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Ready to help build the Blueprint?
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Join the Blueprint Contributors before 31 August 2026 and help launch UniBlueprint with a library already full of real student knowledge.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            to={primaryHref}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600', textDecoration: 'none',
            }}
          >
            Become a Blueprint Contributor
          </Link>
        </div>
      </section>
    </>
  )
}
