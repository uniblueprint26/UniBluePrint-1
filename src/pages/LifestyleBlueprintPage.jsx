import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Heart, UtensilsCrossed, Dumbbell, ShoppingBag, Plane, Ticket,
  Lock,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    icon: UtensilsCrossed,
    name: 'Food & Drink',
    description: 'Discounts at restaurants, cafés, and food delivery platforms popular on Irish campuses.',
    locked: true,
  },
  {
    icon: Dumbbell,
    name: 'Fitness',
    description: 'Reduced gym memberships, class passes, and sports club deals across Ireland.',
    locked: true,
  },
  {
    icon: ShoppingBag,
    name: 'Shopping',
    description: 'Student discounts at clothing, tech, and lifestyle brands available in Ireland.',
    locked: true,
  },
  {
    icon: Plane,
    name: 'Travel',
    description: 'Deals on buses, trains, flights, and student travel cards for getting around Ireland.',
    locked: true,
  },
  {
    icon: Ticket,
    name: 'Entertainment',
    description: 'Cinema, events, concerts, and experiences at reduced student prices.',
    locked: true,
  },
  {
    icon: Heart,
    name: 'Mental Health',
    description: 'Free resources, helplines, and wellbeing tools — available to every UniBlueprint user.',
    locked: false,
    green: true,
  },
]

const PARTNERS_STEPS = [
  {
    n: 1,
    title: 'Partner applies',
    description: 'Businesses apply to become a Lifestyle Blueprint partner through our partner portal.',
  },
  {
    n: 2,
    title: 'Deal reviewed and verified',
    description: 'Our team reviews every deal before it goes live — only genuine value makes the cut.',
  },
  {
    n: 3,
    title: 'Exclusive access for Pro users',
    description: 'Verified deals go live in the Lifestyle Blueprint for all Pro subscribers.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryCard({ icon: Icon, name, description, locked, green }) {
  const borderColor = green ? '#16A34A' : 'transparent'
  const iconBg = green ? 'rgba(22,163,74,0.08)' : '#F5F0E8'
  const iconColor = green ? '#16A34A' : '#1E3A5F'

  return (
    <div style={{
      position: 'relative',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '24px',
      border: green ? `1.5px solid ${borderColor}` : 'none',
    }}>
      {/* Badge */}
      {green ? (
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(22,163,74,0.1)', color: '#16A34A',
          borderRadius: '4px', padding: '3px 8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px', fontWeight: '700',
        }}>
          Always Free
        </span>
      ) : (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          color: '#9CA3AF',
        }}>
          <Lock size={14} />
        </div>
      )}

      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={iconColor} />
      </div>

      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', marginTop: '10px',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#6B7280',
        marginTop: '6px', lineHeight: 1.6,
      }}>
        {description}
      </p>

      {locked && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          marginTop: '12px',
        }}>
          Pro subscribers only
        </p>
      )}
    </div>
  )
}

function ProCalculator() {
  const [dealsPerMonth, setDealsPerMonth] = useState(3)
  const avgSaving = 8
  const proCost = 6.99
  const totalSaving = dealsPerMonth * avgSaving
  const netSaving = Math.max(0, totalSaving - proCost).toFixed(2)

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '32px', maxWidth: '540px', margin: '0 auto',
    }}>
      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '28px', color: '#1E3A5F',
        textAlign: 'center',
      }}>
        How much could you save with Pro?
      </h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        textAlign: 'center', marginTop: '8px',
      }}>
        Move the slider to see your estimated monthly saving
      </p>

      <div style={{ marginTop: '28px' }}>
        <label style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#1E3A5F', fontWeight: '500',
          display: 'flex', justifyContent: 'space-between', marginBottom: '12px',
        }}>
          <span>Deals you'd use per month</span>
          <span style={{ fontWeight: '700' }}>{dealsPerMonth}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={dealsPerMonth}
          onChange={e => setDealsPerMonth(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#1E3A5F', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>1</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>10</span>
        </div>
      </div>

      <div style={{
        marginTop: '28px',
        background: '#F5F0E8', borderRadius: '10px',
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
            Estimated savings ({dealsPerMonth} deals × avg €{avgSaving})
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#1E3A5F', fontWeight: '700' }}>
            €{totalSaving}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
            Pro subscription cost
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280' }}>
            −€{proCost}
          </span>
        </div>
        <div style={{
          borderTop: '1px solid rgba(30,58,95,0.1)', paddingTop: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
            Net monthly saving
          </span>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '28px', color: '#16A34A',
          }}>
            €{netSaving}
          </span>
        </div>
      </div>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', color: '#9CA3AF',
        textAlign: 'center', marginTop: '12px',
      }}>
        Estimate based on average deal saving of €8. Actual savings vary by deal.
      </p>
    </div>
  )
}

// ─── LifestyleBlueprintPage ────────────────────────────────────────────────────

export default function LifestyleBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Lifestyle Blueprint | UniBlueprint</title>
        <meta
          name="description"
          content="Exclusive deals and discounts for students and young people in Ireland — Pro subscribers only. Mental health and wellbeing resources always free."
        />
        <meta property="og:title" content="Lifestyle Blueprint | UniBlueprint" />
        <meta property="og:description" content="Exclusive deals and discounts for students and young people in Ireland — Pro subscribers only. Mental health and wellbeing resources always free." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Lifestyle Blueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.6,
        }}>
          Exclusive deals and discounts for students and young people in Ireland — Pro subscribers only
        </p>

        {/* Mental Health callout */}
        <div style={{
          maxWidth: '560px', margin: '32px auto 0',
          background: '#FFFFFF',
          borderLeft: '3px solid #16A34A',
          borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '20px 24px',
          textAlign: 'left',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(22,163,74,0.1)', color: '#16A34A',
            borderRadius: '4px', padding: '3px 8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', fontWeight: '700',
          }}>
            Always Free
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Heart size={22} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F',
              }}>
                Mental Health &amp; Wellbeing — Always Free
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '6px', lineHeight: 1.6,
              }}>
                Access to mental health resources, helplines, and wellbeing tools is available to every UniBlueprint user — no subscription required, no paywall, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — CATEGORY CARDS ───────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Deal Categories
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Deals built for student life
          </h2>

          <div className="services-grid" style={{ marginTop: '40px' }}>
            {CATEGORIES.map(c => <CategoryCard key={c.name} {...c} />)}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS FOR PARTNERS ────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '600',
          color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          For Partners
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F', marginTop: '8px',
        }}>
          How deals get listed
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.7,
        }}>
          We partner with businesses and brands that want to reach Irish students. Every deal is reviewed before going live — only genuine value is listed.
        </p>

        <div className="steps-row" style={{ maxWidth: '800px', margin: '40px auto 0' }}>
          {PARTNERS_STEPS.map((step, i) => (
            <div key={step.n} style={{ display: 'flex', flex: 1, alignItems: 'flex-start', gap: i < PARTNERS_STEPS.length - 1 ? 0 : undefined }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flex: '1 0 0', maxWidth: '240px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#1E3A5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#F5F0E8' }}>
                    {step.n}
                  </span>
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginTop: '12px', textAlign: 'center' }}>
                  {step.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', textAlign: 'center', lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
              {i < PARTNERS_STEPS.length - 1 && (
                <div className="step-connector" style={{ flex: '1 0 16px', borderTop: '1px dashed rgba(30,58,95,0.2)', marginTop: '24px' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px' }}>
          <Link
            to="/for-businesses"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
              textDecoration: 'none',
            }}
          >
            Become a Lifestyle Blueprint partner →
          </Link>
        </div>
      </section>

      {/* ── SECTION 4 — PRO CALCULATOR ───────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <ProCalculator />
      </section>

      {/* ── SECTION 5 — CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#F5F0E8',
        }}>
          Unlock your Lifestyle Blueprint
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '12px',
        }}>
          Join UniBlueprint free. Upgrade to Pro when you're ready.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link
            to="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Sign up free
          </Link>
          <Link
            to="/pricing"
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
            View pricing
          </Link>
        </div>
      </section>
    </>
  )
}
