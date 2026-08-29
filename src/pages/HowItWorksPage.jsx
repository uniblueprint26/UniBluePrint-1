import { useState, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronDown, FileText, Compass, Building2, Heart, Globe, PiggyBank, Newspaper } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

// The five pillars — same content as the app's onboarding tutorial ("The
// Blueprint Tour"), adapted for the website. Kept in sync manually; if the
// tutorial's copy changes, update both.
const PILLARS = [
  {
    icon: FileText, tint: '#EFF6FF', accent: '#2563EB',
    title: 'Foundation Blueprint', tagline: 'Your Profile Builders',
    description: 'Every career document you need: CV, cover letter, LinkedIn, portfolio, application answers, interview prep, personal statements. Built with you, then reviewed by a real trained Campus Handler before it ever reaches you. Not AI output. Real, human review.',
    chips: [
      'CV Builder', 'Cover Letter Builder', 'Portfolio Builder', 'LinkedIn Builder',
      'Application Form Builder', 'Personal Statement', 'Interview Prep', 'Job Search Support',
    ],
    features: [
      ['CV Builder', 'Structured, ATS-formatted, worded to get past the first screen.'],
      ['Cover Letter Builder', 'Tailored per role, adds to your CV instead of repeating it.'],
      ['LinkedIn Builder', 'Headline, about, experience and skills, optimised to get found.'],
      ['Portfolio Builder', 'Shows your actual work, not just a list of skills.'],
      ['Application Form Builder', 'STAR-method answers for competency and situational questions.'],
      ['Personal Statement', 'Your own words, structured to actually land: CAO, postgrad, or scholarship.'],
      ['Interview Prep', 'Predicted questions, model answers, and a live mock interview on Premium.'],
      ['Job Search Support', 'A personalised search strategy, not blind applying.'],
      ['Turnaround', 'Standard: 48 hours. Premium: 24 hours and first in the queue.'],
    ],
  },
  {
    icon: Compass, tint: '#F0FDF4', accent: '#16A34A',
    title: 'Elevation Blueprint', tagline: 'Verified coaches, one enquiry away',
    description: 'Browse real, verified coaches: fitness, academic grinds, trading, marketing, creative, sports and more. See their profile, message them to enquire. Pricing and booking happen directly between you and them.',
    chips: ['Fitness', 'Academic Grinds', 'Trading', 'Marketing', 'Creative', 'Sports', 'Yoga'],
    features: [
      ['Browse by category', 'Filter the full coach directory to find the right fit.'],
      ['Verified profiles', 'Every coach is checked before they’re listed, real bios, real services.'],
      ['Enquire, not book', 'You message the coach directly. UniBlueprint doesn’t process the booking or payment.'],
    ],
  },
  {
    icon: Heart, tint: '#FDF4FF', accent: '#A21CAF',
    title: 'Lifestyle Blueprint', tagline: 'Student life, sorted',
    description: 'Real discounts from verified local partners, a mental health and wellbeing support directory, and the money tools most students never get taught.',
    chips: ['Health & Fitness', 'Beauty & Grooming', 'Fashion', 'Food & Drink', 'Creative & Services'],
    features: [
      ['Partner deals', 'Verified local businesses, real student discounts, filter by category.'],
      ['Support directory', 'Categorised mental health and wellbeing resources, Irish and verified.'],
      ['Budget Calculator', 'Plan rent, food, transport and more against what you actually have.'],
      ['Grants & Schemes', 'SUSI plus every other real Irish student grant worth knowing, with eligibility and how to apply.'],
    ],
  },
  {
    icon: Building2, tint: '#FFF7ED', accent: '#C2660B',
    title: 'Campus Connect', tagline: 'Your own college, in one place',
    description: 'Everything happening at your own college specifically, organised into boards, plus carpooling, campus events, and finding people on your course to work on projects with.',
    chips: ['Campus Boards', 'Carpooling', 'Campus Events', 'Project Collaboration'],
    features: [
      ['Accommodation', 'Rooms, sublets and housing posted by other students at your college.'],
      ['Carpooling', 'Post or find a route, with real safety terms you accept before you post.'],
      ['Events', 'What’s on, on and around campus.'],
      ['Lost & Found', 'Report or claim something that went missing.'],
      ['Societies', 'Find and connect with student societies.'],
      ['Opportunities', 'Part-time roles, internships, one-off gigs.'],
      ['College Reviews', 'Rate and read reviews of your own college, from students who’ve actually been there.'],
    ],
  },
  {
    icon: Globe, tint: '#F0F9FF', accent: '#0369A1',
    title: 'Course Connect', tagline: 'Cross-Ireland student network',
    description: 'A networking board that spans every Irish college and university, not just your own. Connect with students and grads anywhere in the country, read honest college reviews, and tap into the shared academic resources that go with it: notes, study groups, and module-specific help.',
    chips: ['Graduate Network', 'College Reviews', 'Notes Exchange', 'Study Groups'],
    features: [
      ['Graduate Network', 'Connect with students and graduates across every Irish institution, not just yours.'],
      ['College Reviews', 'Honest reviews from students who’ve actually been there, any college, any course.'],
      ['Notes Exchange', 'Shared notes by module code, see views and saves before you commit.'],
      ['Study Groups', 'Find or start a group for your module.'],
      ['Module Q&A', 'Ask something specific, get an answer from someone who’s done it.'],
      ['Exam Resources', 'Past papers, summaries, and revision material.'],
    ],
  },
]

// Two standalone features, not pillars in their own right, same framing as
// the app's onboarding tutorial ("five tools, two standalone features").
const STANDALONE_FEATURES = [
  {
    icon: PiggyBank, tint: '#FFFBEB', accent: '#B45309',
    title: 'Budgeting Tool', tagline: 'Your financial companion, not a Blueprint',
    description: 'Track spending, calculate a realistic student budget, and navigate SUSI and every other real Irish grant, all in one place, all free.',
    chips: ['Budget Calculator', 'SUSI Guide', 'Grants & Schemes', 'Spending Tracker'],
    features: [
      ['Budget Calculator', 'Plan rent, food, transport and more against what you actually have coming in.'],
      ['SUSI Guide', 'Eligibility, how to apply, and what to expect, explained properly.'],
      ['Grants & Schemes', 'Every real Irish student grant worth knowing about, not just SUSI, with niche and lesser-known ones included.'],
      ['Spending Tracker', 'Log spending as it happens and see where it actually goes.'],
    ],
  },
  {
    icon: Newspaper, tint: '#F5F3FF', accent: '#4C1D95',
    title: 'The Weekly Blueprint', tagline: 'Your weekly issue, not one of the five pillars',
    description: 'A new issue every week, built into the Ad Board tab and read like a real magazine: deals, coach advice, campus events, student stories, and a marketplace to buy, sell, and offer your skills.',
    chips: ['Deals & Discounts', 'Coach Spotlights', 'Campus Events', 'Marketplace'],
    features: [
      ['Deals & Discounts', 'This week\'s Lifestyle Partner offers, plus what\'s in the Deal Room for Pro.'],
      ['Coach Spotlights', 'A different Uni Coach featured every week, with real advice from their field.'],
      ['Campus Connect', 'What\'s happening on campuses across Ireland this week.'],
      ['Marketplace', 'Offer a skill or find one: photography, tutoring, design, freelancing, and more.'],
      ['Ad Board', 'Partner ads and student businesses, curated in one clean noticeboard.'],
    ],
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Download and sign up',
    description:
      'Create your free account in under two minutes. No payment needed, no credit card. Available on iOS, Android, and web.',
    screenTitle: 'Create account',
    screenItems: ['Your name', 'Email address', 'Password'],
    screenCta: 'Get started free',
    screenNote: 'Free forever',
  },
  {
    n: 2,
    title: 'Choose your service',
    description:
      'Browse Foundation or Elevation Blueprint. Select your service, choose Standard (48hr) or Premium (same-day), and submit your brief.',
    screenTitle: 'Foundation Blueprint',
    screenItems: ['CV Optimisation', 'LinkedIn Profile', 'Cover Letter', 'Interview Prep'],
    screenCta: 'Select',
    screenNote: 'From €10 in September',
  },
  {
    n: 3,
    title: 'Reviewed by a real person',
    description:
      'Your submission goes to a trained Campus Handler (Foundation) or a verified Uni Coach (Elevation). They review, build, and quality-check before delivery.',
    screenTitle: 'Campus Handler',
    screenItems: ['Reviewing your CV...', 'Quality check', 'Feedback ready'],
    screenCta: null,
    screenNote: 'Est. delivery: 48 hrs',
  },
  {
    n: 4,
    title: 'Delivered to you',
    description:
      'Your finished output arrives in-app and by email. Standard: 48 hours. Premium: same day.',
    screenTitle: 'Your CV is ready',
    screenItems: ['Review in-app', 'Email delivered', 'Download PDF'],
    screenCta: 'Download',
    screenNote: 'Delivered in 47 hrs',
  },
]

const QUALITY_CARDS = [
  {
    icon: '👤',
    heading: 'Every output reviewed by a real person',
    body: 'Campus Handlers check every Foundation Blueprint submission against a quality checklist before it reaches you.',
  },
  {
    icon: '⏱',
    heading: '48-hour standard delivery',
    body: 'Standard turnaround is 48 hours. Same-day Premium delivery is available at booking. Clear timelines, every time.',
  },
  {
    icon: '🆓',
    heading: 'Free to join, always',
    body: 'No credit card, no commitment. Join for free and use Campus Connect, Course Connect, and wellbeing resources at no cost.',
  },
]

const FAQS = [
  {
    q: 'How long does delivery actually take?',
    a: 'Standard tier is delivered within 48 hours of submission. Premium tier is delivered the same day. Submissions made after 11pm on Saturday night are delivered by end of day Monday on the Premium tier.',
  },
  {
    q: 'What is the difference between a Campus Handler and a Uni Coach?',
    a: 'Campus Handlers are trained reviewers at your institution who check every Foundation Blueprint output before it reaches you. Uni Coaches are verified specialists who deliver Elevation Blueprint services: coaching, mentorship, and strategy, over a defined engagement.',
  },
  {
    q: 'Who is UniBlueprint for?',
    a: 'UniBlueprint is for young people across Ireland on every pathway: university, college, apprenticeship, PLC, 5th and 6th year, and those already in work. Whether you are applying to college, starting an apprenticeship, building your career, or looking for deals near your campus, UniBlueprint has something for you.',
  },
  {
    q: 'Is my information kept private?',
    a: 'Yes. All information you submit is treated as confidential. Campus Handlers see only the information needed to complete your specific ticket. Your data is stored securely in compliance with GDPR. See our Privacy Policy for full details.',
  },
  {
    q: 'What happens if I am not happy with the output?',
    a: 'Contact support through the app. Campus Handlers review outputs against a quality checklist before delivery so revision requests are uncommon, but we will always work with you to get it right.',
  },
]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .hiw-steps-outer {
    position: relative;
    max-width: 1080px;
    margin: 60px auto 0;
  }
  .hiw-connector-line {
    position: absolute;
    top: 92px;
    left: calc(12.5% + 16px);
    right: calc(12.5% + 16px);
    border-top: 2px dashed rgba(30,58,95,0.15);
    pointer-events: none;
  }
  .hiw-steps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .hiw-quality-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 960px;
    margin: 40px auto 0;
  }
  @media (max-width: 960px) {
    .hiw-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .hiw-connector-line { display: none; }
  }
  @media (max-width: 600px) {
    .hiw-steps-grid { grid-template-columns: 1fr; }
    .hiw-quality-cards { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .hiw-quality-cards { grid-template-columns: 1fr; }
  }
  .hiw-step-card {
    cursor: pointer;
    transition: all 200ms ease;
    border-radius: 16px;
    border: 2px solid transparent;
    background: #FFFFFF;
    padding: 24px 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 2px 12px rgba(30,58,95,0.07);
  }
  .hiw-step-card:hover {
    box-shadow: 0 8px 28px rgba(30,58,95,0.12);
    transform: translateY(-3px);
  }
  .hiw-step-card.active {
    border-color: #1E3A5F;
    box-shadow: 0 8px 32px rgba(30,58,95,0.16);
    transform: translateY(-4px);
  }
  .hiw-step-num {
    font-family: 'DM Serif Display', serif;
    font-size: 80px;
    color: #1E3A5F;
    opacity: 0.08;
    line-height: 1;
    user-select: none;
    pointer-events: none;
    position: absolute;
    top: 6px;
    left: 0;
    right: 0;
    text-align: center;
  }
`

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {children}
    </p>
  )
}

/* Mini phone mockup with children screen content */
function MiniPhone({ children, style = {} }) {
  return (
    <div style={{
      width: 140, borderRadius: '30px',
      background: '#0c1520', padding: '6px',
      boxShadow: '0 20px 56px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative',
      ...style,
    }}>
      {/* Power button */}
      <div style={{ position: 'absolute', right: '-2px', top: '58px', width: '2px', height: '28px', background: '#1a2535', borderRadius: '0 2px 2px 0' }} />
      {/* Volume buttons */}
      <div style={{ position: 'absolute', left: '-2px', top: '46px', width: '2px', height: '20px', background: '#1a2535', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: '-2px', top: '74px', width: '2px', height: '20px', background: '#1a2535', borderRadius: '2px 0 0 2px' }} />
      {/* Screen */}
      <div style={{ borderRadius: '24px', overflow: 'hidden', width: 128, height: 276, background: '#F5F0E8' }}>
        {children}
      </div>
      {/* Home bar */}
      <div style={{ height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '52px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

function StepScreen({ step }) {
  const isReview   = step.n === 3
  const isDelivery = step.n === 4

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#F5F0E8',
      display: 'flex', flexDirection: 'column',
      padding: '14px 10px', gap: '7px',
    }}>
      {/* Screen top bar */}
      <div style={{
        background: '#1E3A5F', margin: '-14px -10px 0',
        padding: '8px 10px 6px',
      }}>
        <p style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '10px', color: '#F5F0E8',
          lineHeight: 1.2,
        }}>
          {step.screenTitle}
        </p>
      </div>

      {isReview ? (
        /* Review step: handler avatar */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#1E3A5F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#F5F0E8' }}>H</span>
          </div>
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '6px', padding: '5px 8px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: '#16A34A', fontWeight: '600' }}>Reviewing your CV</p>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: '#9CA3AF', textAlign: 'center' }}>{step.screenNote}</p>
        </div>
      ) : isDelivery ? (
        /* Delivery step: checkmark */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(22,163,74,0.1)',
            border: '2px solid rgba(22,163,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '20px', color: '#16A34A' }}>✓</span>
          </div>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '11px', color: '#1E3A5F', textAlign: 'center' }}>
            {step.screenTitle}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', color: '#9CA3AF', textAlign: 'center' }}>
            {step.screenNote}
          </p>
          <div style={{ width: '100%', background: '#1E3A5F', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <span style={{ color: '#F5F0E8', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: '600' }}>
              {step.screenCta}
            </span>
          </div>
        </div>
      ) : (
        /* Sign-up and service list steps */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '6px' }}>
          {step.screenItems.map((item, i) => (
            <div
              key={item}
              style={{
                background: i === 0 && step.n === 2 ? '#1E3A5F' : '#FFFFFF',
                borderRadius: '5px',
                padding: '5px 7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: step.n === 2 ? 'space-between' : 'flex-start',
                border: step.n === 1 ? '1px solid rgba(30,58,95,0.12)' : 'none',
              }}
            >
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '9px',
                color: step.n === 2 && i === 0 ? '#F5F0E8' : '#1E3A5F',
              }}>
                {item}
              </span>
              {step.n === 2 && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: i === 0 ? 'rgba(245,240,232,0.7)' : '#9CA3AF' }}>
                  €10
                </span>
              )}
            </div>
          ))}
          {step.screenCta && (
            <div style={{ marginTop: 'auto', background: '#1E3A5F', borderRadius: '5px', padding: '6px', textAlign: 'center' }}>
              <span style={{ color: '#F5F0E8', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: '600' }}>
                {step.screenCta}
              </span>
            </div>
          )}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', color: '#9CA3AF', textAlign: 'center', marginTop: '2px' }}>
            {step.screenNote}
          </p>
        </div>
      )}
    </div>
  )
}

function PillarCard({ icon: Icon, tint, accent, title, tagline, description, chips, features }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '16px',
      boxShadow: '0 2px 14px rgba(30,58,95,0.07)',
      padding: '32px 28px',
    }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
          background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={24} color={accent} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: accent, margin: '4px 0 0' }}>
            {tagline}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#4B5563', lineHeight: 1.7, margin: '12px 0 0' }}>
            {description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
            {chips.map(c => (
              <span key={c} style={{
                fontSize: '11px', fontWeight: '600', color: '#1E3A5F',
                background: '#F5F0E8', border: '1px solid rgba(30,58,95,0.1)',
                borderRadius: '999px', padding: '5px 11px',
              }}>
                {c}
              </span>
            ))}
          </div>

          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '700',
              color: '#1E3A5F', padding: 0,
            }}
          >
            {open ? 'Show less' : 'See everything it covers'}
            <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>

          <div id={panelId} hidden={!open} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {features.map(([t, d]) => (
                <li key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6, display: 'flex', gap: '8px' }}>
                  <span aria-hidden="true" style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, marginTop: '7px', flexShrink: 0 }} />
                  <span><b style={{ color: '#1E3A5F', fontWeight: '600' }}>{t}.</b> {d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId    = useId()
  const triggerId  = useId()
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(30,58,95,0.08)', overflow: 'hidden',
    }}>
      <button
        id={triggerId}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-accordion-trigger
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px',
          padding: '20px 24px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '500', color: '#1E3A5F' }}>
          {question}
        </span>
        <ChevronDown
          size={18} color="#6B7280" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
        />
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

// ─── HowItWorksPage ────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0)

  function handleStepClick(i) {
    setActiveStep(prev => (prev === i ? -1 : i))
  }

  return (
    <>
      <Helmet>
        <title>How It Works | UniBlueprint</title>
        <meta name="description" content="From sign-up to delivery in under 48 hours. Four steps, explained." />
        <meta property="og:title" content="How It Works | UniBlueprint" />
        <meta property="og:description" content="From sign-up to delivery in under 48 hours. Four steps, explained." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to use UniBlueprint',
          description: 'From download to delivered, your Blueprint in four simple steps.',
          step: STEPS.map(s => ({
            '@type': 'HowToStep',
            position: s.n,
            name: s.title,
            text: s.description,
          })),
        })}</script>
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '100px 24px 80px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>How UniBlueprint works</SectionLabel>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#F5F0E8', lineHeight: 1.08,
            marginTop: '12px', letterSpacing: '-0.01em',
          }}>
            What's inside, and how it works.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.65)',
            marginTop: '16px', maxWidth: '480px', margin: '16px auto 0', lineHeight: 1.65,
          }}>
            The five pillars, explained properly, then exactly what happens from sign-up to delivery.
          </p>
        </div>
      </section>

      {/* ── SECTION 1B — THE FIVE PILLARS ────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <SectionLabel>What's actually inside</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F', marginTop: '10px',
          }}>
            Five pillars. One app.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '10px', maxWidth: '480px', margin: '10px auto 0', lineHeight: 1.65,
          }}>
            Everything UniBlueprint covers, explained properly, not just the ordering flow below.
          </p>
        </div>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {PILLARS.map(p => <PillarCard key={p.title} {...p} />)}
        </div>
      </section>

      {/* ── SECTION 1C — TWO STANDALONE FEATURES ────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <SectionLabel>Beyond the five pillars</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#1E3A5F', marginTop: '10px',
          }}>
            Two more, built right in
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '10px', maxWidth: '480px', margin: '10px auto 0', lineHeight: 1.65,
          }}>
            Not one of the five pillars, but built into the app all the same, and free for every user.
          </p>
        </div>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {STANDALONE_FEATURES.map(f => <PillarCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── SECTION 2 — STEPS ────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div className="hiw-steps-outer">
          {/* Desktop connecting line */}
          <div aria-hidden="true" className="hiw-connector-line" />

          <div className="hiw-steps-grid">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={`hiw-step-card${activeStep === i ? ' active' : ''}`}
                onClick={() => handleStepClick(i)}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === i}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStepClick(i)}
              >
                {/* Ghost number */}
                <div style={{ position: 'relative', width: '100%', height: '56px', marginBottom: '8px' }}>
                  <span className="hiw-step-num" aria-hidden="true">{step.n}</span>
                  {/* Active indicator dot */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: activeStep === i ? '#1E3A5F' : '#F5F0E8',
                    border: `2px solid ${activeStep === i ? '#1E3A5F' : 'rgba(30,58,95,0.18)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms ease',
                    zIndex: 1,
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '12px', fontWeight: '700',
                      color: activeStep === i ? '#F5F0E8' : '#1E3A5F',
                    }}>
                      {step.n}
                    </span>
                  </div>
                </div>

                {/* Mini phone */}
                <MiniPhone style={{ marginBottom: '20px' }}>
                  <StepScreen step={step} />
                </MiniPhone>

                {/* Text */}
                <h3 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '17px', color: '#1E3A5F',
                  lineHeight: 1.25,
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.65,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '32px',
        }}>
          Tap each step to highlight it.
        </p>
      </section>

      {/* ── SECTION 3 — QUALITY PROMISE ──────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel>Our promise</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#1E3A5F', marginTop: '10px',
          }}>
            Quality you can count on.
          </h2>
        </div>

        <div className="hiw-quality-cards">
          {QUALITY_CARDS.map(card => (
            <div
              key={card.heading}
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: '16px',
                padding: '32px 28px',
              }}
            >
              <span style={{ fontSize: '32px', lineHeight: 1, display: 'block', marginBottom: '16px' }}>
                {card.icon}
              </span>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F', lineHeight: 1.25,
              }}>
                {card.heading}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '10px', lineHeight: 1.65,
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(28px, 3.5vw, 36px)',
          color: '#1E3A5F', textAlign: 'center',
        }}>
          Common questions
        </h2>

        <AccordionGroup>
          <div style={{ maxWidth: '700px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} question={q} answer={a} />
            ))}
          </div>
        </AccordionGroup>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            to="/faqs"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#1E3A5F', textDecoration: 'none' }}
          >
            See all FAQs →
          </Link>
        </div>
      </section>

      {/* ── SECTION 5 — CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Ready to start</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#F5F0E8', lineHeight: 1.12, marginTop: '10px',
          }}>
            Ready to get started?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            marginTop: '12px',
          }}>
            Free to join. No credit card. September trial: 50% off everything.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
            <Link
              to="/download"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '52px', padding: '0 32px',
                background: '#F5F0E8', color: '#1E3A5F',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Download the App
            </Link>
            <Link
              to="/sign-up"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '52px', padding: '0 32px',
                background: 'transparent', color: '#F5F0E8',
                border: '1.5px solid rgba(245,240,232,0.4)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Sign up on web
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
