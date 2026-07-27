import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FileText, Linkedin, Mail, ClipboardList, MessageSquare, Search,
  BookOpen, GraduationCap, Award, Compass,
  UserCheck, Send, Bot,
  Check, X as XIcon,
  Sparkles, ExternalLink,
  Lightbulb, Map, Wrench, Package,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const CAREER_SERVICES = [
  {
    name: 'CV Optimisation',
    tagline: 'A CV that opens doors — not one that gets ignored',
    description: 'Your CV is the first thing every employer sees. UniBlueprint builds you a professional, tailored CV from scratch or transforms what you already have — structured correctly, worded powerfully, and formatted to pass applicant tracking systems. Every output is reviewed by a trained Campus Handler before it reaches you.',
    bullets: [
      'Professionally structured CV tailored to your field and target role',
      'ATS-optimised formatting — gets past automated screening systems',
      'Powerful action-language rewrites on every bullet point',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    tierNote: {
      standard: 'Full CV build or complete transformation, 48 hour delivery',
      premium: 'Same day delivery plus cover letter ready formatting',
    },
    icon: FileText,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
    ctaHref: '/foundation/cv-builder', ctaLabel: 'Build my CV',
    secondaryCtaHref: '/foundation/cv-review', secondaryCtaLabel: 'or review a CV you already have',
  },
  {
    name: 'LinkedIn Optimisation',
    tagline: 'Turn your LinkedIn from invisible to irresistible',
    description: 'Recruiters search LinkedIn every day. UniBlueprint optimises your entire profile — headline, about section, experience, skills, and featured section — so you show up in searches and make the right impression when you do. Every output reviewed by a Campus Handler.',
    bullets: [
      'Keyword-optimised headline that appears in recruiter searches',
      'About section that tells your story and makes them want to know more',
      'Experience section rewritten with impact and action language',
      'Skills section optimised for your target industry',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: Linkedin,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
    ctaHref: '/foundation/linkedin-optimisation', ctaLabel: 'Optimise my profile',
  },
  {
    name: 'Cover Letter Assistance',
    tagline: 'A cover letter that actually gets read',
    description: 'Most cover letters are ignored because they are generic. UniBlueprint writes you a tailored, compelling cover letter for a specific role or company — one that adds to your CV rather than repeating it. Reviewed by a Campus Handler before delivery.',
    bullets: [
      'Tailored cover letter for a specific role and company',
      'Opening that grabs attention immediately',
      'Body that connects your experience to what they are looking for',
      'Close with a confident, specific call to action',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: Mail,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
    ctaHref: '/foundation/cover-letter', ctaLabel: 'Write my cover letter',
    secondaryCtaHref: '/foundation/cover-letter-review', secondaryCtaLabel: 'or review one you already have',
  },
  {
    name: 'Application Form Assistance',
    tagline: 'Answer every question with confidence and clarity',
    description: 'Competency questions, situational questions, motivation questions — application forms are where most candidates lose ground. UniBlueprint gives you structured, polished answers using the STAR method that demonstrate exactly what employers are looking for. Reviewed by a Campus Handler.',
    bullets: [
      'STAR-structured answers to competency and situational questions',
      'Motivation and fit answers tailored to the specific organisation',
      'Word count optimised — never too long, never too short',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: ClipboardList,
    originalStandard: 'From €20', trialStandard: 'From €10',
    originalPremium: 'From €30', trialPremium: 'From €15',
    ctaHref: '/foundation/application-form-assistance', ctaLabel: 'Answer my form',
  },
  {
    name: 'Interview Preparation',
    tagline: 'Walk in prepared. Walk out confident.',
    description: 'UniBlueprint prepares you for the exact interview you are facing — predicted questions, model answers using STAR, company and role research, and what to ask at the end. Premium includes a live mock interview with a Campus Handler so you can practise under real pressure before the real thing.',
    standardBullets: [
      'Predicted questions tailored to the role, company, and interview type',
      'Model STAR answers for every competency question',
      'Company and role research briefing',
      'What to ask your interviewer — questions that impress',
    ],
    premiumBullets: [
      'Live mock interview session with a Campus Handler',
      'Real-time feedback on answers, delivery, and presence',
      'Post-session improvement notes',
    ],
    icon: MessageSquare,
    originalStandard: 'From €20', trialStandard: 'From €10',
    originalPremium: 'From €30', trialPremium: 'From €15',
    ctaHref: '/foundation/interview-preparation', ctaLabel: 'Build my prep pack',
  },
  {
    name: 'Job Search Support',
    tagline: 'Stop applying blindly. Start searching strategically.',
    description: 'UniBlueprint builds you a personalised job search strategy — the right platforms, the right search terms, the right outreach approach, and a realistic action plan based on your field, year of study, and career goals. Less guessing, more results.',
    bullets: [
      'Personalised job search strategy for your field and goals',
      'Platform guide — where to search and what to look for',
      'LinkedIn outreach strategy for finding hidden opportunities',
      'Action plan with weekly milestones',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: Search,
    originalStandard: '€15', trialStandard: '€8',
    originalPremium: '€22', trialPremium: '€11',
    ctaHref: '/foundation/job-search-support', ctaLabel: 'Get my strategy',
  },
]

const CAO_SERVICES = [
  {
    name: 'CAO Personal Statement',
    tagline: 'Your story. Your voice. Your place.',
    description: 'Your CAO personal statement is your only chance to speak directly to admissions. UniBlueprint helps you craft a compelling, authentic statement that goes beyond your grades — telling the story of who you are, what drives you, and why you belong on this course. Reviewed by a Campus Handler before delivery.',
    bullets: [
      'Compelling personal statement drafted from your input',
      'Opens with impact — not the clichés admissions tutors have read a thousand times',
      'Tells a coherent story connecting your background to your chosen course',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: BookOpen,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
    ctaHref: '/foundation/personal-statement', ctaLabel: 'Write my statement',
  },
  {
    name: 'College Interview Preparation',
    tagline: 'Impress the panel. Secure your place.',
    description: 'College interviews — for medicine, dentistry, law, and other competitive programmes — require a different kind of preparation. UniBlueprint prepares you with predicted questions, structured model answers, and the confidence to perform under pressure. Premium includes a live mock interview.',
    standardBullets: [
      'Predicted interview questions for your specific programme',
      'Model answers structured for academic interview panels',
      'Key themes and topics to know for your course area',
    ],
    premiumBullets: [
      'Live mock interview with a Campus Handler',
      'Real-time feedback and post-session notes',
    ],
    icon: GraduationCap,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Scholarship & Grants Application',
    tagline: 'The funding is out there. We help you get it.',
    description: 'Scholarships and grants go unclaimed every year because applicants do not know how to present themselves effectively. UniBlueprint identifies relevant opportunities and helps you craft a strong, compelling application — personal statement, supporting evidence, and covering letter — reviewed by a Campus Handler before submission.',
    bullets: [
      'Scholarship and grant identification for your profile and field',
      'Compelling application personal statement',
      'Supporting evidence structure and presentation guidance',
      'Reviewed by a trained Campus Handler before delivery',
    ],
    icon: Award,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Course Selection Guidance',
    tagline: 'Find the course that fits you — not just the one with the highest points',
    description: "Choosing the right course is one of the most important decisions you will make. UniBlueprint combines personalised guidance with CourseCompass — Ireland's leading AI-powered CAO course matching platform — to help you find the course that matches your strengths, interests, and goals.",
    bullets: [
      'Personalised course matching using the CourseCompass platform',
      'Subject interest and learning style assessments',
      'PLC and apprenticeship pathway exploration if relevant',
      'Guidance session with a Campus Handler',
    ],
    icon: Compass,
    originalStandard: '€15', trialStandard: '€8',
    originalPremium: '€22', trialPremium: '€11',
    courseCompass: true,
  },
]

const COMPARISON_ROWS = [
  {
    feature: 'Turnaround time',
    standard: '48 hours',
    premium: 'Same day',
    type: 'text',
  },
  {
    feature: 'Output type',
    standard: 'Written document or guide',
    premium: 'Written document or guide',
    type: 'text',
  },
  {
    feature: 'Campus Handler review',
    standard: true,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Priority Handler assignment',
    standard: false,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Revision requests',
    standard: '1 included',
    premium: '2 included',
    type: 'text',
  },
  {
    feature: 'Same-day available',
    standard: false,
    premium: true,
    type: 'bool',
  },
]

const ALL_SERVICES = [
  ...CAREER_SERVICES.map(s => ({ ...s, category: 'Career' })),
  ...CAO_SERVICES.map(s => ({ ...s, category: 'CAO' })),
]

// CourseCompass tools — 4 pills for service card (Location 1)
const CC_CARD_TOOLS = [
  { name: 'Course Compass',      url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test', url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test', url: 'https://coursecompass.ie/learning-style-test' },
  { name: '5th & 6th Year Bundle', url: 'https://coursecompass.ie/bundles/senior-cycle' },
]

// CourseCompass tools — all 6 pills for callout cards (Location 4 etc.)
const CC_ALL_PILL_TOOLS = [
  { name: 'Course Compass',          url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test',   url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test',     url: 'https://coursecompass.ie/learning-style-test' },
  { name: 'PLC Compass',             url: 'https://coursecompass.ie/plc-compass-test' },
  { name: 'Apprenticeship Compass',  url: 'https://coursecompass.ie/apprentice-compass-test' },
  { name: '5th & 6th Year Bundle',   url: 'https://coursecompass.ie/bundles/senior-cycle' },
]

// CourseCompass tools — all 6 with icons for mini-card grid (Location 2)
const CC_ALL_TOOLS = [
  { name: 'Course Compass',         description: 'Find the right CAO course for you',         url: 'https://coursecompass.ie/course-compass',           icon: Compass },
  { name: 'Subject Interest Test',  description: 'Discover what subjects you excel in',        url: 'https://coursecompass.ie/subject-interest-test',    icon: Lightbulb },
  { name: 'Learning Style Test',    description: 'Understand how you learn best',              url: 'https://coursecompass.ie/learning-style-test',      icon: GraduationCap },
  { name: 'PLC Compass',            description: 'Explore PLC pathway options',                url: 'https://coursecompass.ie/plc-compass-test',         icon: Map },
  { name: 'Apprenticeship Compass', description: 'Find the right apprenticeship for you',     url: 'https://coursecompass.ie/apprentice-compass-test',  icon: Wrench },
  { name: '5th & 6th Year Bundle',  description: 'Full senior cycle guidance suite',          url: 'https://coursecompass.ie/bundles/senior-cycle',     icon: Package },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function CCPill({ name, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: '#FFFFFF',
        border: '1.5px solid #1E3A5F',
        borderRadius: '8px',
        padding: '7px 12px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F',
        textDecoration: 'none', whiteSpace: 'nowrap',
        transition: 'background 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F5F0E8')}
      onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
    >
      {name}
      <ExternalLink size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
    </a>
  )
}

function CCMiniCard({ name, description, url, icon: Icon }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '14px',
        textDecoration: 'none',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0px 4px 20px rgba(30,58,95,0.14)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)')}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: '#F5F0E8', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color="#1E3A5F" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#1E3A5F' }}>
          {name}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
          {description}
        </p>
      </div>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F',
        flexShrink: 0, alignSelf: 'center',
      }}>
        Open →
      </span>
    </a>
  )
}

function TrialBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: '#1E3A5F', color: '#F5F0E8',
      borderRadius: '6px', padding: '6px 12px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '700',
    }}>
      <Sparkles size={13} />
      50% OFF — September Trial
    </div>
  )
}

function ServiceCard({ name, tagline, description, icon: Icon, bullets, standardBullets, premiumBullets, tierNote, originalStandard, trialStandard, courseCompass, ctaHref, ctaLabel, secondaryCtaHref, secondaryCtaLabel }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: hovered
          ? '0px 4px 20px rgba(30,58,95,0.14)'
          : '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '24px',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
      }}
    >
      {/* 50% OFF badge */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        background: '#1E3A5F', color: '#F5F0E8',
        borderRadius: '6px', padding: '3px 7px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '10px', fontWeight: '700',
        letterSpacing: '0.02em',
      }}>
        50% OFF
      </div>

      {/* Icon */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={26} color="#1E3A5F" />
      </div>

      {/* Name */}
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', marginTop: '10px',
      }}>
        {name}
      </p>

      {/* Tagline */}
      {tagline && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#1E3A5F', fontStyle: 'italic',
          marginTop: '3px',
        }}>
          {tagline}
        </p>
      )}

      {/* CourseCompass badge */}
      {courseCompass && (
        <a
          href="https://coursecompass.ie/course-compass"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            marginTop: '6px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: '#6B7280',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          Powered by CourseCompass
          <ExternalLink size={10} aria-hidden="true" style={{ flexShrink: 0 }} />
        </a>
      )}

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '10px', lineHeight: 1.55,
      }}>
        {description}
      </p>

      {/* Flat bullets */}
      {bullets && bullets.length > 0 && (
        <ul style={{ marginTop: '10px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {bullets.map(b => (
            <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.45 }}>
              <span style={{ color: '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Standard / Premium bullet groups (Interview-type services) */}
      {standardBullets && (
        <>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '10px' }}>
            Standard includes
          </p>
          <ul style={{ marginTop: '4px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {standardBullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.45 }}>
                <span style={{ color: '#1E3A5F', flexShrink: 0, marginTop: '1px' }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '8px' }}>
            Premium adds
          </p>
          <ul style={{ marginTop: '4px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {premiumBullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', lineHeight: 1.45 }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>+</span>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Tier note (CV Optimisation) */}
      {tierNote && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
            <span style={{ fontWeight: '600' }}>Standard: </span>{tierNote.standard}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
            <span style={{ fontWeight: '600' }}>Premium: </span>{tierNote.premium}
          </p>
        </div>
      )}

      {/* CourseCompass tools section — Location 1 */}
      {courseCompass && (
        <div style={{ marginTop: '14px' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600', color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>
            CourseCompass Tools
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CC_CARD_TOOLS.map(t => <CCPill key={t.name} {...t} />)}
          </div>
        </div>
      )}

      {/* Prices */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textDecoration: 'line-through',
        }}>
          {originalStandard}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#1E3A5F', fontWeight: '700',
        }}>
          {trialStandard}
        </span>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', color: '#9CA3AF', marginTop: '2px',
      }}>
        September trial price
      </p>

      {ctaHref && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '14px' }}>
          <Link
            to={ctaHref}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', fontWeight: '600', color: '#1E3A5F',
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
          >
            {ctaLabel || 'Try it now'} →
          </Link>
          {secondaryCtaHref && (
            <Link
              to={secondaryCtaHref}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#6B7280',
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              {secondaryCtaLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function SubHeader({ children }) {
  return (
    <h3 style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '16px',
      marginTop: '40px',
    }}>
      {children}
    </h3>
  )
}

function BoolCell({ value }) {
  return value
    ? <Check size={18} color="#16A34A" style={{ margin: '0 auto', display: 'block' }} />
    : <XIcon size={18} color="#9CA3AF" style={{ margin: '0 auto', display: 'block' }} />
}

// ─── FoundationBlueprintPage ────────────────────────────────────────────────────

export default function FoundationBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Foundation Blueprint | UniBlueprint</title>
        <meta
          name="description"
          content="Professional CV, LinkedIn, cover letter, interview prep, and CAO support — reviewed by trained Campus Handlers before delivery."
        />
        <meta property="og:title" content="Foundation Blueprint | UniBlueprint" />
        <meta property="og:description" content="Professional CV, LinkedIn, cover letter, interview prep, and CAO support — reviewed by trained Campus Handlers before delivery." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Foundation Blueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Professional career support — reviewed by real students before delivery
        </p>
        <div style={{ marginTop: '20px' }}>
          <TrialBadge />
        </div>
      </section>

      {/* ── SECTION 2 — SERVICES GRID ────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Available Services
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Everything you need to launch your career
          </h2>

          <p style={{ textAlign: 'center', marginTop: '14px' }}>
            <Link
              to="/foundation/my-documents"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                fontWeight: '600', color: '#1E3A5F',
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              View everything you've already started →
            </Link>
          </p>

          <SubHeader>Career Services</SubHeader>
          <div className="services-grid">
            {CAREER_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>

          <SubHeader>CAO &amp; College Applications</SubHeader>
          <div className="services-grid">
            {CAO_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>

          {/* Location 4 — CAO discovery callout */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            borderLeft: '3px solid #1E3A5F',
            padding: '20px',
            marginTop: '16px',
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '18px', color: '#1E3A5F',
              marginBottom: '8px',
            }}>
              Not sure which course to apply for?
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginBottom: '14px', lineHeight: 1.6,
            }}>
              Use CourseCompass to find the right match before you write your personal statement.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CC_ALL_PILL_TOOLS.map(t => <CCPill key={t.name} {...t} />)}
            </div>
          </div>

          {/* Location 2 — CourseCompass partnership callout with mini-card grid */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '20px',
            borderLeft: '3px solid #1E3A5F',
            marginTop: '12px',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', color: '#6B7280',
              fontWeight: '600', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '8px',
            }}>
              Powered in partnership with CourseCompass
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '16px', color: '#1E3A5F',
              marginBottom: '16px',
            }}>
              AI-powered CAO course matching for Irish students
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}>
              {CC_ALL_TOOLS.map(t => <CCMiniCard key={t.name} {...t} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW HANDLERS WORK ────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Reviewed by Campus Handlers
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '16px auto 0', maxWidth: '640px', lineHeight: 1.7,
        }}>
          Every Foundation Blueprint output is reviewed by a trained Campus Handler — a student who knows the Irish market, the CAO process, and what employers actually look for. No output leaves without passing their quality check.
        </p>

        <div className="hiw-quality-row" style={{ maxWidth: '700px', margin: '40px auto 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              You submit your details
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Brief, CV draft, or application materials
            </p>
          </div>

          <div style={{ color: 'rgba(30,58,95,0.3)', flexShrink: 0, fontSize: '24px', alignSelf: 'center' }} className="hiw-quality-arrow">→</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCheck size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              Handler reviews &amp; refines
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Checks against a quality standard before delivery
            </p>
          </div>

          <div style={{ color: 'rgba(30,58,95,0.3)', flexShrink: 0, fontSize: '24px', alignSelf: 'center' }} className="hiw-quality-arrow">→</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              Delivered to you
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              48hr Standard · Same day Premium
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — STANDARD VS PREMIUM TABLE ────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Standard vs Premium
        </h2>

        <div style={{
          maxWidth: '900px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F0E8' }}>
                <th style={{
                  padding: '16px 24px', textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                  fontWeight: '600', color: '#1E3A5F',
                }}>
                  Feature
                </th>
                <th style={{
                  padding: '16px 24px', textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                  fontWeight: '600', color: '#1E3A5F',
                }}>
                  Standard
                </th>
                <th style={{
                  padding: '16px 24px', textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                  fontWeight: '600', color: '#1E3A5F',
                }}>
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  style={{ borderTop: '1px solid rgba(30,58,95,0.06)', background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)' }}
                >
                  <td style={{
                    padding: '14px 24px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F',
                  }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    {row.type === 'bool'
                      ? <BoolCell value={row.standard} />
                      : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>{row.standard}</span>
                    }
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    {row.type === 'bool'
                      ? <BoolCell value={row.premium} />
                      : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>{row.premium}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION 5 — FULL PRICING TABLE ───────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Full pricing
        </h2>

        <div style={{
          maxWidth: '900px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: '#F5F0E8' }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Service
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Standard
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Standard Trial
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Premium
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    Premium Trial
                  </th>
                </tr>
              </thead>
              <tbody>
                {ALL_SERVICES.map((s, i) => (
                  <tr
                    key={s.name}
                    style={{
                      borderTop: '1px solid rgba(30,58,95,0.06)',
                      background: i % 2 === 0 ? '#FFFFFF' : 'rgba(245,240,232,0.3)',
                    }}
                  >
                    <td style={{ padding: '13px 24px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
                        {s.name}
                      </span>
                      <span style={{
                        display: 'inline-block', marginLeft: '8px',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
                        color: '#9CA3AF',
                      }}>
                        {s.category}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {s.originalStandard}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>
                      {s.trialStandard}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {s.originalPremium}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '600' }}>
                      {s.trialPremium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#9CA3AF',
            padding: '14px 24px',
            borderTop: '1px solid rgba(30,58,95,0.06)',
          }}>
            * September trial prices apply throughout September 2026 only. Standard prices resume from 1 October 2026.
          </p>
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
          Start your Foundation Blueprint
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '12px',
        }}>
          Free to join. September trial — 50% off everything.
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
              border: '1.5px solid rgba(245,240,232,0.5)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Sign up free
          </Link>
        </div>
      </section>
    </>
  )
}
