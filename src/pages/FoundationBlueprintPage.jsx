import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FileText, Linkedin, Mail, ClipboardList, MessageSquare, Search,
  BookOpen, GraduationCap, Award, Compass,
  UserCheck, Send, Bot,
  Check, X as XIcon,
  Sparkles, ExternalLink,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const CAREER_SERVICES = [
  {
    name: 'CV Optimisation',
    description: 'A full review and rewrite of your CV — formatted for the Irish and UK graduate market.',
    icon: FileText,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'LinkedIn Optimisation',
    description: 'Headline, about section, and experience rewrite to position you for roles and opportunities.',
    icon: Linkedin,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Cover Letter Assistance',
    description: 'A tailored cover letter written and reviewed for a specific role or employer.',
    icon: Mail,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Application Form Assistance',
    description: 'Handler-reviewed responses to competency and motivation questions on application forms.',
    icon: ClipboardList,
    originalStandard: 'From €20', trialStandard: 'From €10',
    originalPremium: 'From €30', trialPremium: 'From €15',
  },
  {
    name: 'Interview Preparation',
    description: 'Question bank, answer frameworks, and written feedback from a trained Campus Handler.',
    icon: MessageSquare,
    originalStandard: 'From €20', trialStandard: 'From €10',
    originalPremium: 'From €30', trialPremium: 'From €15',
  },
  {
    name: 'Job Search Support',
    description: 'A structured job search plan with target roles, platforms, and outreach strategy.',
    icon: Search,
    originalStandard: '€15', trialStandard: '€8',
    originalPremium: '€22', trialPremium: '€11',
  },
]

const CAO_SERVICES = [
  {
    name: 'CAO Personal Statement',
    description: 'Drafted and reviewed by a Campus Handler — structured, compelling, and tailored to your choices.',
    icon: BookOpen,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'College Interview Preparation',
    description: 'Preparation notes and practice questions for college admission interviews.',
    icon: GraduationCap,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Scholarship & Grants',
    description: 'Application reviewed and refined for Irish scholarship and grant schemes.',
    icon: Award,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€30', trialPremium: '€15',
  },
  {
    name: 'Course Selection Guidance',
    description: 'Structured guidance on CAO course choices matched to your interests and career goals.',
    icon: Compass,
    originalStandard: '€15', trialStandard: '€8',
    originalPremium: '€22', trialPremium: '€11',
    badge: 'CourseCompass',
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

// ─── Sub-components ────────────────────────────────────────────────────────────

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

function ServiceCard({ name, description, icon: Icon, originalStandard, trialStandard, badge, courseCompass }) {
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

      {/* CourseCompass small badge pill */}
      {badge && (
        <span style={{
          display: 'inline-block', marginTop: '6px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: '600', color: '#1E3A5F',
          background: 'rgba(30,58,95,0.07)',
          borderRadius: '4px', padding: '2px 7px',
          letterSpacing: '0.03em',
        }}>
          {badge}
        </span>
      )}

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '6px', lineHeight: 1.55,
      }}>
        {description}
      </p>

      {/* CourseCompass partnership line */}
      {courseCompass && (
        // TODO: Replace with live CourseCompass URL when provided by Stephen McKeon
        <a
          href="TODO: Insert CourseCompass URL"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            marginTop: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: '#6B7280',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          Powered in partnership with CourseCompass — Ireland's AI course matching platform
          <ExternalLink size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
        </a>
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

          <SubHeader>Career Services</SubHeader>
          <div className="services-grid">
            {CAREER_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>

          <SubHeader>CAO &amp; College Applications</SubHeader>
          <div className="services-grid">
            {CAO_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>

          {/* CourseCompass partnership callout */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '20px',
            borderLeft: '3px solid #1E3A5F',
            marginTop: '16px',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', color: '#6B7280',
              fontWeight: '600', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '6px',
            }}>
              In partnership with CourseCompass
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '16px', color: '#1E3A5F',
              marginBottom: '12px',
            }}>
              AI-powered CAO course matching for Irish students
            </p>
            {/* TODO: Replace with live CourseCompass URL when provided by Stephen McKeon */}
            <a
              href="TODO: Insert CourseCompass URL"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#1E3A5F',
                textDecoration: 'none', fontWeight: '500',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Find your perfect course →
              <ExternalLink size={14} aria-hidden="true" />
            </a>
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
