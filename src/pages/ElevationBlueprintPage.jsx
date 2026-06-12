import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles, Network, Layout, Users, Presentation, BookOpen,
  UserCheck, Send, Bot,
  Check, X as XIcon,
  Award,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const ELEVATION_SERVICES = [
  {
    name: 'Personal Branding Support',
    description: 'A full personal brand audit and strategy — positioning, messaging, and online presence built for your goals.',
    icon: Sparkles,
    originalStandard: '€40', trialStandard: '€20',
    originalPremium: '€55', trialPremium: '€28',
  },
  {
    name: 'Network Assistance',
    description: 'Targeted outreach strategy, LinkedIn connection templates, and guidance on building your professional network.',
    icon: Network,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€46', trialPremium: '€23',
  },
  {
    name: 'Portfolio Building',
    description: 'Structure, content strategy, and review for your professional or creative portfolio.',
    icon: Layout,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€46', trialPremium: '€23',
  },
  {
    name: 'Mentorship Matching',
    description: 'Matched to a Uni Coach relevant to your goals. Matching is always free — pay only for sessions.',
    icon: Users,
    originalStandard: '€20', trialStandard: '€10',
    originalPremium: '€36', trialPremium: '€18',
    matchingFree: true,
  },
  {
    name: 'Pitch & Presentation Coaching',
    description: 'Coaching on structure, delivery, and confidence — written feedback or live coaching session.',
    icon: Presentation,
    originalStandard: '€25', trialStandard: '€13',
    originalPremium: '€45', trialPremium: '€18',
    priceNote: 'Written · Live session at Premium',
  },
  {
    name: 'Personal Statement & Postgrad',
    description: 'Expert review of postgraduate, scholarship, or professional programme personal statements.',
    icon: BookOpen,
    originalStandard: '€30', trialStandard: '€15',
    originalPremium: '€52', trialPremium: '€26',
  },
]

const COMPARISON_ROWS = [
  {
    feature: 'Delivery model',
    standard: 'Session + written deliverable',
    premium: 'Session + follow-up review or notes',
    type: 'text',
  },
  {
    feature: 'Uni Coach assigned',
    standard: true,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Priority Coach assignment',
    standard: false,
    premium: true,
    type: 'bool',
  },
  {
    feature: 'Follow-up review included',
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
    feature: 'Turnaround',
    standard: 'Agreed at booking',
    premium: 'Priority scheduling',
    type: 'text',
  },
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

function ServiceCard({ name, description, icon: Icon, originalStandard, trialStandard, matchingFree, priceNote }) {
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

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '6px', lineHeight: 1.55,
      }}>
        {description}
      </p>

      {/* Matching free badge */}
      {matchingFree && (
        <span style={{
          display: 'inline-block', marginTop: '8px',
          background: 'rgba(22,163,74,0.1)', color: '#16A34A',
          borderRadius: '4px', padding: '2px 8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '600',
        }}>
          Matching: Always Free
        </span>
      )}

      {/* Prices */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
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
      {priceNote
        ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
            {priceNote}
          </p>
        )
        : (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
            September trial price
          </p>
        )
      }
    </div>
  )
}

function BoolCell({ value }) {
  return value
    ? <Check size={18} color="#16A34A" style={{ margin: '0 auto', display: 'block' }} />
    : <XIcon size={18} color="#9CA3AF" style={{ margin: '0 auto', display: 'block' }} />
}

// ─── ElevationBlueprintPage ────────────────────────────────────────────────────

export default function ElevationBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Elevation Blueprint | Uniblueprint</title>
        <meta
          name="description"
          content="Expert personal branding, mentorship, portfolio building, pitch coaching, and postgrad support — delivered by specialist Uni Coaches."
        />
        <meta property="og:title" content="Elevation Blueprint | Uniblueprint" />
        <meta property="og:description" content="Expert personal branding, mentorship, portfolio building, pitch coaching, and postgrad support — delivered by specialist Uni Coaches." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Elevation Blueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Expert coaching and strategy — delivered by specialist Uni Coaches
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
            Everything you need to level up
          </h2>

          <div className="services-grid" style={{ marginTop: '40px' }}>
            {ELEVATION_SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — UNI COACH ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
        }}>
          Delivered by Uni Coaches
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '16px auto 0', maxWidth: '640px', lineHeight: 1.7,
        }}>
          Uni Coaches are specialists — professionals, postgraduates, and experienced practitioners in their field. Each Coach is vetted, onboarded, and assigned based on the specific service and your goals.
        </p>

        {/* Engagement callout */}
        <div style={{
          maxWidth: '640px', margin: '32px auto 0',
          background: '#F5F0E8',
          borderLeft: '3px solid #1E3A5F',
          borderRadius: '12px',
          padding: '20px 24px',
          textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px', color: '#1E3A5F',
            fontStyle: 'italic',
          }}>
            "Coaches work with you over a defined engagement — not a one-off transaction"
          </p>
        </div>

        {/* Engagement model cards */}
        <div className="hiw-blueprints-grid" style={{ maxWidth: '700px', margin: '32px auto 0' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px', textAlign: 'left', flex: 1,
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#1E3A5F',
            }}>
              Standard
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              marginTop: '12px', lineHeight: 1.65,
            }}>
              One coaching session or deliverable engagement with your assigned Uni Coach. Includes one revision or follow-up question.
            </p>
          </div>

          <div style={{
            background: '#1E3A5F', borderRadius: '12px',
            padding: '28px', textAlign: 'left', flex: 1,
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '20px', color: '#F5F0E8',
            }}>
              Premium
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: 'rgba(245,240,232,0.75)',
              marginTop: '12px', lineHeight: 1.65,
            }}>
              Session plus a follow-up review or written notes. Priority Coach assignment and two revision requests included.
            </p>
          </div>
        </div>

        {/* Three step process */}
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
              You submit your brief
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Goals, materials, and service selected
            </p>
          </div>

          <div style={{ color: 'rgba(30,58,95,0.3)', flexShrink: 0, fontSize: '24px', alignSelf: 'center' }} className="hiw-quality-arrow">→</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Award size={32} color="#1E3A5F" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500', marginTop: '12px' }}>
              Uni Coach assigned
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Matched to a Coach in your area
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
              Engagement delivered
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px', maxWidth: '140px', lineHeight: 1.5 }}>
              Session, deliverable, or both
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
                <th style={{ padding: '16px 24px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                  Feature
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                  Standard
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
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
                  <td style={{ padding: '14px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F' }}>
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
                {ELEVATION_SERVICES.map((s, i) => (
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
                      {s.matchingFree && (
                        <span style={{
                          display: 'inline-block', marginLeft: '8px',
                          background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                          borderRadius: '4px', padding: '1px 6px',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
                        }}>
                          Matching free
                        </span>
                      )}
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
            * September trial prices apply throughout September 2026 only. Standard prices resume from 1 October 2026. Mentorship matching is always free regardless of trial period.
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
          Start your Elevation Blueprint
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
