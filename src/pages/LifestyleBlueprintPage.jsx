import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Heart, UtensilsCrossed, Dumbbell, ShoppingBag, Plane, Ticket,
  Lock, Phone, ExternalLink, Megaphone, ArrowRight,
} from 'lucide-react'
import whipWizardzLogo from '../assets/whip-wizardz-logo.png.png'
import jmcFitnessLogo from '../assets/jmc-fitness-logo.png.jpeg'
import energieFitnessLogo from '../assets/energie-fitness-logo.png.jpeg'
import nyz3ditzLogo from '../assets/nyz3ditz-logo.png.jpeg'

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

const PARTNER_DEALS = [
  {
    name: 'Whip Wizardz',
    logo: whipWizardzLogo,
    category: 'Automotive & Transport',
    description: 'Exclusive student rates on car sales and sourcing from Whip Wizardz. Show your UniBlueprint Pro badge to redeem.',
    deal: 'Student Deal — contact to redeem',
  },
  {
    name: 'The Nail Nurse',
    tnn: true,
    category: 'Beauty & Wellness',
    description: 'Exclusive student discount on professional nail services from The Nail Nurse. Show your UniBlueprint Pro badge to redeem.',
    deal: 'Student Deal — badge required',
  },
  {
    name: 'JMC Fitness',
    logo: jmcFitnessLogo,
    category: 'Fitness & Wellbeing',
    description: 'Student membership rates and exclusive coaching offers for UniBlueprint Pro subscribers from JMC Fitness.',
    deal: 'Student Rate — badge required',
  },
  {
    name: 'NYZ3DITZ Studio',
    logo: nyz3ditzLogo,
    category: 'Creative & Media',
    description: 'Student rates on professional video editing and photography from NYZ3DITZ Studio. Perfect for content creators and personal projects.',
    deal: 'Student Rate — contact to redeem',
  },
  {
    name: 'Energie Fitness',
    logo: energieFitnessLogo,
    category: 'Fitness & Wellbeing',
    description: 'Reduced student membership rates at Energie Fitness gyms. Stay active throughout the academic year without the full-price cost.',
    deal: 'Reduced Membership — badge required',
  },
  {
    name: 'Emmanuel Fasanmi Grinds',
    initials: 'EF',
    category: 'Education & Coaching',
    description: 'Junior and Leaving Cert grinds and academic coaching from Emmanuel Fasanmi. One-to-one sessions, exam prep, and structured study support.',
    deal: 'Student Rate — book through app',
  },
]

const COMING_SOON_CATEGORIES = [
  { icon: UtensilsCrossed, name: 'Food & Drink' },
  { icon: Dumbbell, name: 'Fitness' },
  { icon: ShoppingBag, name: 'Shopping' },
  { icon: Plane, name: 'Travel' },
  { icon: Ticket, name: 'Entertainment' },
]

const COMING_SOON_SLOTS = COMING_SOON_CATEGORIES.flatMap(c => [
  { ...c, slot: 1 },
  { ...c, slot: 2 },
])

const MENTAL_HEALTH_SERVICES = [
  {
    name: 'Samaritans Ireland',
    description: 'Free, confidential support for anyone struggling emotionally or having thoughts of suicide. Available 24 hours a day, 7 days a week.',
    phone: { href: 'tel:116123', display: '116 123' },
    website: 'https://www.samaritans.org/ireland',
    badge: 'Free · 24/7',
  },
  {
    name: 'Pieta House',
    description: 'Specialist support for people experiencing suicidal ideation, self-harm, and emotional distress. Therapy appointments and crisis support available.',
    phone: { href: 'tel:116123', display: '116 123 (Freephone)' },
    text: 'Text HELP to 51444',
    website: 'https://www.pieta.ie',
    badge: 'Free · Crisis Support',
  },
  {
    name: 'Jigsaw',
    description: 'Free mental health support for young people aged 12 to 25 across Ireland. Online and in-person support from trained professionals.',
    website: 'https://www.jigsaw.ie',
    badge: 'Free · Ages 12–25',
  },
  {
    name: 'Turn2Me',
    description: 'Free online mental health support including peer support groups, self-help tools, and professional counselling sessions for people in Ireland.',
    website: 'https://www.turn2me.ie',
    badge: 'Free · Online',
  },
  {
    name: 'SpunOut',
    description: "Ireland's youth information platform covering mental health, relationships, money, and wellbeing — written by young people for young people.",
    website: 'https://spunout.ie',
    badge: 'Free · Information',
  },
  {
    name: 'Niteline',
    description: 'Free confidential listening service run by students for students. Available during term time, late night hours when other services may be closed.',
    website: 'https://www.nightline.ie',
    badge: 'Free · Student Run',
  },
  {
    name: 'Student Counselling Services',
    description: 'Every Irish university offers free counselling to enrolled students. Contact your college student services office to access support on campus.',
    informational: true,
    badge: 'Free · On Campus',
  },
  {
    name: 'MyMind',
    description: 'Affordable online counselling and psychotherapy for people across Ireland. Sliding scale pricing based on income.',
    website: 'https://mymind.com',
    badge: 'Low Cost · Online',
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

function PartnerDealCard({ name, initials, category, description, deal, logo, tnn }) {
  return (
    <div style={{
      position: 'relative',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px',
      textAlign: 'center',
    }}>
      <span style={{
        position: 'absolute', top: '12px', right: '12px',
        background: '#1E3A5F', color: '#F5F0E8',
        borderRadius: '4px', padding: '3px 8px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '10px', fontWeight: '700',
      }}>
        Pro Deal
      </span>

      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: tnn ? '#B8860B' : logo ? '#F5F0E8' : '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto',
        overflow: 'hidden',
      }}>
        {logo ? (
          <img src={logo} alt={name} style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '50%' }} />
        ) : tnn ? (
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#FFFFFF' }}>TNN</span>
        ) : (
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>{initials}</span>
        )}
      </div>

      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', color: '#1E3A5F',
        marginTop: '14px',
      }}>
        {name}
      </p>

      <span style={{
        display: 'inline-block', marginTop: '8px',
        background: '#F5F0E8', color: '#1E3A5F',
        borderRadius: '6px', padding: '3px 10px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px',
      }}>
        {category}
      </span>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        marginTop: '12px', lineHeight: 1.6,
      }}>
        {description}
      </p>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', color: '#9CA3AF',
        marginTop: '10px',
      }}>
        {deal}
      </p>

      <a
        href="#"
        // TODO: Link to deal detail page when available
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '40px', padding: '0 20px', marginTop: '16px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: '600',
          textDecoration: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        View Deal →
      </a>
    </div>
  )
}

function ComingSoonCard({ icon: Icon }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      border: '1.5px dashed rgba(30,58,95,0.3)',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto',
      }}>
        <Icon size={28} color="#9CA3AF" aria-hidden="true" />
      </div>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '16px', color: '#9CA3AF',
        marginTop: '12px',
      }}>
        Coming Soon
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#9CA3AF',
        marginTop: '6px',
      }}>
        A new partner deal is on the way
      </p>
      <Link
        to="/for-businesses"
        style={{
          display: 'block', marginTop: '12px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#1E3A5F',
          textDecoration: 'none',
        }}
      >
        Are you a business?
      </Link>
    </div>
  )
}

function MentalHealthCard({ name, description, phone, text, website, badge, informational }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px',
      borderLeft: '3px solid #16A34A',
    }}>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', color: '#1E3A5F',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {description}
      </p>
      <span style={{
        display: 'inline-block', marginTop: '12px',
        background: '#16A34A', color: '#FFFFFF',
        borderRadius: '4px', padding: '2px 8px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', fontWeight: '700',
      }}>
        {badge}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
        {phone && (
          <a
            href={phone.href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#1E3A5F', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Phone size={14} color="#1E3A5F" aria-hidden="true" />
            {phone.display}
          </a>
        )}
        {text && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#1E3A5F', fontWeight: '600',
          }}>
            {text}
          </span>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#1E3A5F', fontWeight: '600',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Visit {name}
            <ExternalLink size={14} color="#1E3A5F" aria-hidden="true" />
          </a>
        )}
        {informational && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#1E3A5F', fontWeight: '600',
          }}>
            Find your campus counselling service
          </span>
        )}
      </div>
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
          content="Exclusive deals, discounts, and wellbeing resources — for students, apprentices, and young people across Ireland. Pro subscribers unlock the full Lifestyle Blueprint. Mental Health & Wellbeing is always free for everyone."
        />
        <meta property="og:title" content="Lifestyle Blueprint | UniBlueprint" />
        <meta property="og:description" content="Exclusive deals, discounts, and wellbeing resources — for students, apprentices, and young people across Ireland. Pro subscribers unlock the full Lifestyle Blueprint. Mental Health & Wellbeing is always free for everyone." />
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
          Exclusive deals and discounts curated for students, apprentices, and young people in Ireland. Pro subscribers only — from €6.99/month. Mental Health &amp; Wellbeing always free.
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

      {/* ── SECTION 3 — PARTNER DEALS ────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Live Now
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Featured partner deals
          </h2>

          <div className="partner-deals-grid">
            {PARTNER_DEALS.map(p => <PartnerDealCard key={p.name} {...p} />)}
          </div>

          <div style={{ marginTop: '64px' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', fontWeight: '600',
              color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
              textAlign: 'center',
            }}>
              Coming Soon
            </p>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '24px', color: '#1E3A5F',
              textAlign: 'center', marginTop: '8px',
            }}>
              More partners joining soon
            </h3>

            <div className="coming-soon-grid" style={{ marginTop: '32px' }}>
              {COMING_SOON_SLOTS.map((c, i) => (
                <ComingSoonCard key={`${c.name}-${c.slot}-${i}`} icon={c.icon} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — MENTAL HEALTH & WELLBEING ───────────────────────── */}
      <section style={{ background: '#FFFFFF' }}>

        {/* Crisis banner — full width */}
        <div style={{
          background: '#16A34A',
          padding: '12px 24px',
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#FFFFFF',
        }}>
          In crisis right now? Call Samaritans free on 116 123 — available 24 hours a day, 7 days a week
        </div>

        <div style={{ padding: '64px 24px' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '32px', color: '#1E3A5F',
            }}>
              Mental Health &amp; Wellbeing
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginTop: '8px',
            }}>
              <Heart size={24} color="#16A34A" aria-hidden="true" />
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '16px', color: '#16A34A', fontWeight: '600',
              }}>
                Always free. No subscription. No paywall. Ever.
              </p>
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#6B7280',
              marginTop: '8px', lineHeight: 1.6,
            }}>
              If you are struggling, these Irish services are here for you. Reaching out is the right move.
            </p>
          </div>

          {/* Cards grid */}
          <div className="mh-grid" style={{ maxWidth: '1000px', margin: '40px auto 0' }}>
            {MENTAL_HEALTH_SERVICES.map(s => <MentalHealthCard key={s.name} {...s} />)}
          </div>

          {/* Disclaimer */}
          <div style={{
            maxWidth: '800px', margin: '40px auto 0',
            background: '#FFFFFF',
            borderTop: '3px solid #16A34A',
            borderRadius: '8px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '16px 24px',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', color: '#6B7280',
            }}>
              UniBlueprint is not a counselling or crisis service. If you are in immediate danger, call 999 or go to your nearest emergency department.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — HOW IT WORKS FOR PARTNERS ────────────────────────── */}
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

        <div style={{
          maxWidth: '640px', margin: '40px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '20px', textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#F5F0E8', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={24} color="#1E3A5F" aria-hidden="true" />
          </div>
          <div>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '16px', color: '#1E3A5F',
            }}>
              Want to promote your business or service?
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '8px', lineHeight: 1.6,
            }}>
              The Advertisement Board is the place for student-run promotions, services, and opportunities. Free to post.
            </p>
            <a
              href="#"
              // TODO: Link to Advertisement Board deep link in app when available
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600', color: '#1E3A5F',
                textDecoration: 'none',
              }}
            >
              Visit the Advertisement Board
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
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

      {/* ── SECTION 6 — PRO CALCULATOR ───────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <ProCalculator />
      </section>

      {/* ── SECTION 7 — CTA ──────────────────────────────────────────────── */}
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
