import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FileText, Linkedin, Mail, MessageSquare, Search, BookOpen, Briefcase,
  ArrowRight, Check,
} from 'lucide-react'

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .fbp-hero-inner {
    display: flex; align-items: center; gap: 48px;
    max-width: 1040px; margin: 0 auto;
  }
  .fbp-services-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 48px;
  }
  .fbp-steps-row {
    display: flex; align-items: flex-start;
    gap: 0; max-width: 720px; margin: 48px auto 0;
    position: relative;
  }
  .fbp-steps-line {
    position: absolute; top: 22px; left: 80px; right: 80px;
    height: 1px; background: rgba(30,58,95,0.15);
    pointer-events: none;
  }
  @media (max-width: 860px) {
    .fbp-hero-inner { flex-direction: column; }
    .fbp-hero-phone { display: none; }
    .fbp-services-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .fbp-services-grid { grid-template-columns: 1fr; }
    .fbp-steps-row { flex-direction: column; align-items: center; gap: 32px; }
    .fbp-steps-line { display: none; }
    .fbp-hero-inner { padding: 0 !important; }
  }
  @keyframes fbp-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fbp-result { animation: fbp-fade 250ms ease; }
`

// ─── Data ──────────────────────────────────────────────────────────────────────

const FOUNDATION_SERVICES = [
  {
    name: 'CV Optimisation',
    icon: FileText,
    description: 'A professionally structured CV that gets past automated screening, built from scratch or transformed from what you already have. Reviewed by a trained Profile Builder.',
    bullets: [
      'ATS-optimised formatting and structure',
      'Action-language rewrites on every bullet point',
      'Reviewed by a Profile Builder before delivery',
    ],
    price: '€20', trialPrice: '€10',
  },
  {
    name: 'Portfolio Building',
    icon: Briefcase,
    description: 'Employers and clients want proof, not just a list of skills. A portfolio that showcases your projects, work samples, and results, structured clearly and built to make an impression.',
    bullets: [
      'Structured around your actual projects and results',
      'Built to make an impression, not just list skills',
      'Reviewed by a Profile Builder before delivery',
    ],
    price: '€20', trialPrice: '€10',
  },
  {
    name: 'LinkedIn Optimisation',
    icon: Linkedin,
    description: 'Recruiters search LinkedIn every day. Your headline, about section, experience, and skills, optimised so you show up and make the right impression.',
    bullets: [
      'Keyword-optimised headline for recruiter searches',
      'Story-driven about section',
      'Skills section for your target industry',
    ],
    price: '€20', trialPrice: '€10',
  },
  {
    name: 'Cover Letter',
    icon: Mail,
    description: 'A tailored cover letter for a specific role and company, one that adds to your CV rather than repeating it. Reviewed by a Profile Builder before delivery.',
    bullets: [
      'Tailored to the role and company',
      'Opens with impact, closes with confidence',
      'Reviewed before delivery',
    ],
    price: '€20', trialPrice: '€10',
  },
  {
    name: 'Interview Preparation',
    icon: MessageSquare,
    description: 'Predicted questions, STAR-structured model answers, company research, and what to ask at the end. Premium adds a live mock interview with a Profile Builder.',
    bullets: [
      'Questions tailored to the role and interview type',
      'Company and role research briefing',
      'Premium: live mock with real-time feedback',
    ],
    price: 'From €20', trialPrice: 'From €10',
  },
  {
    name: 'Job Search Support',
    icon: Search,
    description: 'A personalised job search strategy covering the right platforms, search terms, LinkedIn outreach approach, and a realistic action plan for your field and goals.',
    bullets: [
      'Platform guide for your field',
      'LinkedIn outreach strategy',
      'Weekly action plan with milestones',
    ],
    price: '€15', trialPrice: '€8',
  },
  {
    name: 'CAO and College Support',
    icon: BookOpen,
    description: 'Personal statements, college interview prep, scholarship applications, and course selection guidance. Everything a young person needs for CAO and college applications.',
    bullets: [
      'CAO Personal Statement: From €10 trial',
      'College Interview Prep: From €10 trial',
      'Scholarship Application: From €10 trial',
      'Course Selection Guidance: €8 trial',
    ],
    price: 'From €15', trialPrice: 'From €8',
  },
]

// ─── CV Health Check ───────────────────────────────────────────────────────────

const CV_QUESTIONS = [
  {
    id: 'q1',
    text: 'How up-to-date is your CV?',
    options: [
      { label: 'Not started yet', points: 0 },
      { label: 'Outdated or rough draft', points: 1 },
      { label: 'Recent but basic', points: 2 },
      { label: 'Strong and current', points: 3 },
    ],
  },
  {
    id: 'q2',
    text: 'Is it tailored to each role?',
    options: [
      { label: 'Never, one version for all', points: 0 },
      { label: 'Sometimes', points: 1 },
      { label: 'Always', points: 2 },
    ],
  },
  {
    id: 'q3',
    text: 'Have you had professional feedback?',
    options: [
      { label: 'Never', points: 0 },
      { label: 'Once, some time ago', points: 1 },
      { label: 'Regularly and recently', points: 2 },
    ],
  },
]

const MAX_SCORE = 7

function getResult(pct) {
  if (pct < 40) return { msg: 'Your CV needs work. Let\'s fix it.', color: '#DC2626' }
  if (pct < 70) return { msg: 'Solid foundation. A Profile Builder can make it stronger.', color: '#D97706' }
  return { msg: 'Good CV. Fine-tune it before your next application.', color: '#16A34A' }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {children}
    </p>
  )
}

function PhoneMockup({ children, style = {} }) {
  return (
    <div style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.07)',
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

function ServiceCard({ name, icon: Icon, description, bullets, price, trialPrice }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.85)',
      borderTop: '3px solid #1E3A5F',
      borderRadius: '16px',
      padding: '28px 26px 24px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: 'rgba(30,58,95,0.08)',
        border: '1px solid rgba(30,58,95,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color="#1E3A5F" strokeWidth={1.8} />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#1E3A5F', marginTop: '14px',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {description}
      </p>
      <ul style={{ marginTop: '12px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
            <Check size={13} color="#1E3A5F" style={{ flexShrink: 0, marginTop: '2px' }} />
            {b}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '18px' }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through' }}>
          {price}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '17px', color: '#1E3A5F', fontWeight: '700' }}>
          {trialPrice}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
          September trial
        </span>
      </div>
    </div>
  )
}

function CVHealthCheck() {
  const [answers, setAnswers] = useState({})
  const [barWidth, setBarWidth] = useState(0)

  const totalPoints = CV_QUESTIONS.reduce((sum, q) => {
    const sel = answers[q.id]
    return sel === undefined ? sum : sum + q.options[sel].points
  }, 0)

  const allAnswered = CV_QUESTIONS.every(q => answers[q.id] !== undefined)
  const pct = allAnswered ? Math.round((totalPoints / MAX_SCORE) * 100) : 0
  const result = allAnswered ? getResult(pct) : null

  useEffect(() => {
    if (allAnswered) {
      const t = setTimeout(() => setBarWidth(pct), 60)
      return () => clearTimeout(t)
    } else {
      setBarWidth(0)
    }
  }, [allAnswered, pct])

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {CV_QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom: '32px' }}>
          <p style={{
            fontFamily: "'DM Serif Display',serif", fontSize: '19px', color: '#1E3A5F', marginBottom: '14px',
          }}>
            {q.text}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i
              return (
                <button
                  key={opt.label}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                  style={{
                    padding: '9px 17px', borderRadius: '8px',
                    border: selected ? '1.5px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.18)',
                    background: selected ? '#1E3A5F' : 'transparent',
                    color: selected ? '#F5F0E8' : '#1E3A5F',
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: '13px', fontWeight: selected ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
            color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            CV Score
          </p>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '15px', color: '#1E3A5F' }}>
            {allAnswered ? `${pct}%` : '—'}
          </p>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(30,58,95,0.1)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            width: `${barWidth}%`,
            background: result ? result.color : '#1E3A5F',
            transition: 'width 700ms cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>

      {result && (
        <div className="fbp-result" style={{
          marginTop: '20px', padding: '18px 22px',
          borderRadius: '12px', background: '#F5F0E8',
          borderLeft: `3px solid ${result.color}`,
        }}>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#1E3A5F' }}>
            {result.msg}
          </p>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginTop: '12px', fontFamily: "'DM Sans',sans-serif",
            fontSize: '13px', fontWeight: '700', color: '#1E3A5F', textDecoration: 'none',
          }}>
            Download the app to get started <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── FoundationBlueprintPage ────────────────────────────────────────────────────

export default function FoundationBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Foundation Blueprint | UniBlueprint</title>
        <meta name="description" content="CV, LinkedIn, cover letters, interview prep, and CAO support. Reviewed by trained Profile Builders before delivery." />
        <meta property="og:title" content="Foundation Blueprint | UniBlueprint" />
        <meta property="og:description" content="CV, LinkedIn, cover letters, interview prep, and CAO support. Reviewed by trained Profile Builders before delivery." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="fbp-hero-inner" style={{ position: 'relative', zIndex: 1 }}>

          {/* Phone mockup */}
          <div className="fbp-hero-phone">
            <PhoneMockup style={{ transform: 'rotate(-2deg) translateY(8px)' }}>
              <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}>
                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif" }}>9:41</span>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ width: '3px', height: `${4 + i * 2}px`, background: i === 3 ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.6)', borderRadius: '1px' }} />
                    ))}
                  </div>
                </div>
                {/* Header */}
                <div>
                  <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foundation Blueprint</p>
                  <p style={{ color: '#F5F0E8', fontSize: '16px', fontFamily: "'DM Serif Display',serif", marginTop: '3px', lineHeight: 1.2 }}>Your career<br />documents</p>
                </div>
                {/* Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: 'rgba(245,240,232,0.4)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>Progress</span>
                    <span style={{ color: '#F5F0E8', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>3 / 5</span>
                  </div>
                  <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(245,240,232,0.12)' }}>
                    <div style={{ width: '60%', height: '100%', background: '#F5F0E8', borderRadius: '2px' }} />
                  </div>
                </div>
                {/* Items */}
                {[
                  { label: 'CV Optimisation', done: true },
                  { label: 'LinkedIn Profile', done: true },
                  { label: 'Cover Letter', done: true },
                  { label: 'Interview Prep', done: false },
                  { label: 'Job Search Plan', done: false },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 9px', borderRadius: '8px',
                    background: item.done ? 'rgba(245,240,232,0.1)' : 'rgba(245,240,232,0.03)',
                    border: '1px solid ' + (item.done ? 'rgba(245,240,232,0.14)' : 'rgba(245,240,232,0.05)'),
                  }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                      background: item.done ? '#F5F0E8' : 'transparent',
                      border: '1.5px solid ' + (item.done ? '#F5F0E8' : 'rgba(245,240,232,0.22)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.done && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1E3A5F' }} />}
                    </div>
                    <span style={{ color: item.done ? '#F5F0E8' : 'rgba(245,240,232,0.32)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
                {/* Handler badge */}
                <div style={{ marginTop: 'auto', padding: '7px 9px', borderRadius: '8px', background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(245,240,232,0.55)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>CV reviewed and delivered</span>
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Glass box */}
          <div style={{
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
            flex: 1,
          }}>
            <SectionLabel light>Foundation Blueprint</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,46px)',
              color: '#F5F0E8',
              marginTop: '10px',
              lineHeight: 1.12,
            }}>
              Build the foundation.<br />Get the opportunity.
            </h1>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              Every CV, cover letter, portfolio, and application document reviewed by a trained Profile Builder before it reaches you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              {[
                'CV and LinkedIn optimised for your target role',
                'Cover letters tailored to specific companies',
                'Interview prep with STAR-structured model answers',
                'CAO personal statements and college interview coaching',
              ].map(point => (
                <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, marginTop: '8px', opacity: 0.55 }} />
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '30px', height: '46px', padding: '0 24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the app <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: SERVICES GRID ────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '96px 24px', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ maxWidth: '1040px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel>Services</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Everything you need to launch your career
            </h2>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '12px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Six services, one platform. Every output reviewed before it reaches you.
            </p>
          </div>
          <div className="fbp-services-grid">
            {FOUNDATION_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CV HEALTH CHECK ──────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <SectionLabel>Interactive</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              CV Health Check
            </h2>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '12px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            }}>
              Three questions. Find out where your CV stands and what to do next.
            </p>
          </div>
          <CVHealthCheck />
        </div>
      </section>

      {/* ── SECTION 4: HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: 'clamp(28px,3.5vw,40px)', color: '#1E3A5F',
            marginTop: '10px', lineHeight: 1.12,
          }}>
            From brief to delivery in 48 hours
          </h2>
          <div className="fbp-steps-row">
            <div className="fbp-steps-line" />
            {[
              { n: '1', title: 'Submit your brief in the app', desc: 'Choose your service and tell us what you need. Takes under two minutes.' },
              { n: '2', title: 'Profile Builder reviews and builds', desc: 'A trained Profile Builder builds or refines your document and checks it meets our quality standard.' },
              { n: '3', title: 'Delivered to you in 48 hours', desc: 'Your output arrives in the app, reviewed and ready to use.' },
            ].map(step => (
              <div key={step.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: '#F5F0E8' }}>{step.n}</span>
                </div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '17px', color: '#1E3A5F', marginTop: '16px', lineHeight: 1.3 }}>{step.title}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '100px 24px', textAlign: 'center' }}>
        <SectionLabel light>Get started</SectionLabel>
        <h2 style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: 'clamp(28px,4vw,44px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.12,
          maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Get the app. Get your Blueprint.
        </h2>
        <p style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '15px', color: 'rgba(245,240,232,0.6)',
          marginTop: '14px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
        }}>
          Free to join. September trial, 50% off everything.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link to="/download" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            height: '52px', padding: '0 32px',
            background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Download the app <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" style={{
            display: 'inline-flex', alignItems: 'center',
            height: '52px', padding: '0 28px',
            background: 'transparent', color: 'rgba(245,240,232,0.75)',
            border: '1px solid rgba(245,240,232,0.2)', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            See pricing
          </Link>
        </div>
      </section>
    </>
  )
}
