import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ExternalLink, Handshake,
  UtensilsCrossed, Dumbbell, ShoppingBag, Plane, Ticket, Sparkles,
} from 'lucide-react'
import whipWizardzLogo from '../assets/whip-wizardz-logo.png.png'
import jmcFitnessLogo from '../assets/jmc-fitness-logo.png.jpeg'
import energieFitnessLogo from '../assets/energie-fitness-logo.png.jpeg'
import nyz3ditzLogo from '../assets/nyz3ditz-logo.png.jpeg'

const COURSECOMPASS_URL = 'https://coursecompass.ie/course-compass'

const CC_TOOLS = [
  { name: 'Course Compass',         description: 'Find your ideal CAO course with AI matching.',     url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test',  description: 'Identify subjects that match your strengths.',     url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test',    description: 'Discover how you learn best.',                     url: 'https://coursecompass.ie/learning-style-test' },
  { name: 'PLC Compass',            description: 'Match with the right PLC course.',                 url: 'https://coursecompass.ie/plc-compass-test' },
  { name: 'Apprenticeship Compass', description: 'Find the right apprenticeship pathway.',            url: 'https://coursecompass.ie/apprentice-compass-test' },
  { name: '5th & 6th Year Bundle',  description: 'Senior cycle tools, bundled together.',             url: 'https://coursecompass.ie/bundles/senior-cycle' },
]

const LIFESTYLE_PARTNERS = [
  {
    name: 'Whip Wizardz',
    logo: whipWizardzLogo,
    category: 'Automotive & Transport',
    description: 'Exclusive member rates on car sales and sourcing. Show your UniBlueprint Pro badge to redeem.',
  },
  {
    name: 'The Nail Nurse',
    tnn: true,
    category: 'Beauty & Wellness',
    description: 'Exclusive member discount on professional nail services for UniBlueprint Pro subscribers.',
  },
  {
    name: 'JMC Fitness',
    logo: jmcFitnessLogo,
    category: 'Fitness & Wellbeing',
    description: 'Exclusive membership rates and coaching offers for UniBlueprint Pro subscribers.',
  },
  {
    name: 'NYZ3DITZ Studio',
    logo: nyz3ditzLogo,
    category: 'Creative & Media',
    description: 'Member rates on professional video editing and photography for content creators and personal projects.',
  },
  {
    name: 'Energie Fitness',
    logo: energieFitnessLogo,
    category: 'Fitness & Wellbeing',
    description: 'Reduced membership rates at Energie Fitness gyms across Ireland.',
  },
  {
    name: 'Emmanuel Fasanmi Grinds',
    initials: 'EF',
    category: 'Education & Coaching',
    description: 'Junior and Leaving Cert grinds and academic coaching. One-to-one sessions, exam prep, and structured study support.',
  },
]

const COMING_SOON_ICONS = [UtensilsCrossed, Dumbbell, ShoppingBag, Plane, Ticket, Sparkles]

// ─── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '600', color: '#6B7280',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      textAlign: 'center',
    }}>
      {children}
    </p>
  )
}

// ─── ToolCard ──────────────────────────────────────────────────────────────────

function ToolCard({ name, description, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '14px',
        textDecoration: 'none',
        transition: 'opacity 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '14px', color: '#1E3A5F',
      }}>
        {name}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', color: '#6B7280',
        marginTop: '4px', lineHeight: 1.5,
      }}>
        {description}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px', fontWeight: '600', color: '#1E3A5F',
        marginTop: '8px', textAlign: 'right',
      }}>
        Open →
      </p>
    </a>
  )
}

// ─── LifestylePartnerCard ────────────────────────────────────────────────────

function LifestylePartnerCard({ name, initials, category, description, logo, tnn }) {
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
        width: '56px', height: '56px', borderRadius: '12px',
        background: tnn ? '#B8860B' : '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto',
        overflow: 'hidden',
      }}>
        {logo ? (
          <img src={logo} alt={name} style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        ) : tnn ? (
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#FFFFFF' }}>TNN</span>
        ) : (
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>{initials}</span>
        )}
      </div>

      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '20px', color: '#1E3A5F',
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

      <Link
        to="/lifestyle-blueprint"
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
      </Link>
    </div>
  )
}

// ─── ComingSoonCard ──────────────────────────────────────────────────────────

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

// ─── PartnersPage ──────────────────────────────────────────────────────────────

export default function PartnersPage() {
  return (
    <>
      <Helmet>
        <title>Our Partners | UniBlueprint</title>
        <meta
          name="description"
          content="The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on."
        />
        <meta property="og:title" content="Our Partners | UniBlueprint" />
        <meta property="og:description" content="The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on." />
      </Helmet>

      <div style={{ background: '#F5F0E8' }}>

        {/* ── SECTION 1 — HERO ───────────────────────────────────────────── */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '48px', color: '#1E3A5F',
            lineHeight: 1.15,
          }}>
            Our Partners
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px', color: '#6B7280',
            margin: '16px auto 0', maxWidth: '600px', lineHeight: 1.7,
          }}>
            The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on.
          </p>
        </section>

        {/* ── SECTION 2 — TECHNOLOGY PARTNERS ───────────────────────────── */}
        <section style={{ padding: '80px 24px', textAlign: 'center' }}>
          <SectionLabel>Technology Partners</SectionLabel>

          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '28px',
            maxWidth: '800px', margin: '24px auto 0',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              {/* TODO: Replace with actual CourseCompass logo image */}
              <Handshake size={28} color="#1E3A5F" aria-hidden="true" />
            </div>

            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '22px', color: '#1E3A5F',
              marginTop: '12px',
            }}>
              CourseCompass
            </h2>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '8px', maxWidth: '560px', margin: '8px auto 0',
              lineHeight: 1.6,
            }}>
              Ireland's AI-powered CAO course matching platform — helping young people find the right course, pathway, and career direction.
            </p>

            <span style={{
              display: 'inline-block', marginTop: '16px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '6px', padding: '4px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', fontWeight: '600',
            }}>
              Powered by CourseCompass
            </span>

            <div className="partner-tools-grid" style={{ marginTop: '24px' }}>
              {CC_TOOLS.map(tool => <ToolCard key={tool.name} {...tool} />)}
            </div>

            <a
              href={COURSECOMPASS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '48px', padding: '0 24px', marginTop: '28px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Visit CourseCompass
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* ── SECTION 3 — LIFESTYLE PARTNERS ─────────────────────────────── */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <SectionLabel>Lifestyle Partners</SectionLabel>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            margin: '16px auto 0', maxWidth: '600px', lineHeight: 1.7,
          }}>
            UniBlueprint Pro subscribers get exclusive access to deals and discounts from our lifestyle partners across Ireland.
          </p>

          <Link
            to="/for-businesses"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '44px', padding: '0 24px', marginTop: '12px',
              background: 'transparent', color: '#1E3A5F',
              border: '1.5px solid #1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Become a partner →
          </Link>

          <div className="services-grid" style={{ maxWidth: '1000px', margin: '32px auto 0' }}>
            {LIFESTYLE_PARTNERS.map(p => <LifestylePartnerCard key={p.name} {...p} />)}
            {COMING_SOON_ICONS.map((icon, i) => (
              <ComingSoonCard key={i} icon={icon} />
            ))}
          </div>
        </section>

        {/* ── SECTION 4 — BECOME A PARTNER ───────────────────────────────── */}
        <section style={{ background: '#1E3A5F', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#F5F0E8',
          }}>
            Partner with UniBlueprint
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.7)',
            margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.7,
          }}>
            Reach young people across Ireland — college, apprenticeship, and every pathway in between. UniBlueprint Pro subscribers are actively looking for the right deals.
          </p>
          <Link
            to="/for-businesses"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px', marginTop: '24px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Get in touch →
          </Link>
        </section>

      </div>
    </>
  )
}
