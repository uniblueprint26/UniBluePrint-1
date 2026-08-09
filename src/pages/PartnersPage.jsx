import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, Handshake, Instagram, Phone } from 'lucide-react'
import whipWizardzLogo from '../assets/whip-wizardz-logo.png.png'
import jmcFitnessLogo from '../assets/jmc-fitness-logo.png.jpeg'
import energieFitnessLogo from '../assets/energie-fitness-logo.png.jpeg'
import nyz3ditzLogo from '../assets/nyz3ditz-logo.png.jpeg'

const COURSECOMPASS_URL = 'https://coursecompass.ie/course-compass'

const CC_TOOLS = [
  { name: 'Course Compass',         description: 'Find your ideal CAO course with AI matching.',  url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test',  description: 'Identify subjects that match your strengths.',  url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test',    description: 'Discover how you learn best.',                  url: 'https://coursecompass.ie/learning-style-test' },
  { name: 'PLC Compass',            description: 'Match with the right PLC course.',              url: 'https://coursecompass.ie/plc-compass-test' },
  { name: 'Apprenticeship Compass', description: 'Find the right apprenticeship pathway.',        url: 'https://coursecompass.ie/apprentice-compass-test' },
  { name: '5th & 6th Year Bundle',  description: 'Senior cycle tools, bundled together.',         url: 'https://coursecompass.ie/bundles/senior-cycle' },
]

// ─── Live partners: full cards ──────────────────────────────────────────────────
const LIVE_PARTNERS = [
  {
    id: 'mpfitness',
    name: 'MPFitness',
    initials: 'MP',
    initBg: '#15803D',
    category: 'Personal Training',
    description: 'Certified Personal Trainer and Advanced Nutrition Coach. Full client packages built around your goals, lifestyle, and schedule — combining personalised training with nutrition coaching. Competition athlete mindset for every client.',
    deal: 'Full package from €150/month',
    instagram: 'milanpir_fitness',
  },
  {
    id: 'energie',
    name: 'Energie Fitness',
    logo: energieFitnessLogo,
    category: 'Gym Membership',
    description: 'Full gym access at an exclusive member rate — €37.99/month versus the standard €39.99–€44.99. Joining fee reduced to €15 (normally €30). Set up in person at any Energie Fitness location. Open Monday to Friday 6am–10pm, weekends 9am–5pm.',
    deal: 'From €37.99/month',
  },
  {
    id: 'jmc',
    name: 'JMC Fitness',
    logo: jmcFitnessLogo,
    category: 'Sports Coaching',
    description: 'Elite sports coaching with fully personalised programmes. Online coaching, in-person training on North Dublin 4G astro, dietary guidance, specialist football coaching, and connections to professional agents.',
    deal: 'From €50/hr',
  },
  {
    id: 'nyz3ditz',
    name: 'Nyz3ditz',
    logo: nyz3ditzLogo,
    category: 'Photography & Video',
    description: 'Professional photography and videography mentorship from Nathan Yanzo. Monthly subscriptions include Zoom mentorship calls and editing guidance. One-to-one shoot sessions also available for those building their creative portfolio.',
    deal: 'From €55/month',
    instagram: 'Nyz3ditz',
    phone: '+353857272875',
  },
  {
    id: 'whipwizardz',
    name: 'Whip Wizardz',
    logo: whipWizardzLogo,
    category: 'Automotive',
    description: 'Appointment-based automotive specialists based in Jonesborough, near Dundalk. Vehicle sales and sourcing, inspections, repairs, bodywork, detailing, import services, and consignment — all with student-friendly pricing.',
    deal: 'Student-friendly pricing',
  },
  {
    id: 'nailnurse',
    name: 'The Nail Nurse',
    initials: 'NN',
    initBg: '#BE185D',
    category: 'Nail Tech · Galway',
    description: 'Professional nail technician based in Galway. Full range of nail treatments at student-friendly prices: acrylic sets from €25, gel polish from €20, basic manicure €15, nail art from €3.50 per nail. Student discount with valid ID.',
    deal: 'Student discount with valid ID',
    instagram: 'theenailnurse__',
  },
  {
    id: 'efgrinds',
    name: 'Emmanuel Fasanmi Grinds',
    initials: 'EF',
    initBg: '#1E3A5F',
    category: 'Education & Coaching',
    description: 'Junior and Leaving Cert grinds and one-to-one academic coaching. Structured sessions covering exam prep, subject strategy, and study support across all levels. Pro member rates available.',
    deal: 'Pro member rates',
  },
]

// ─── Shell partners: name + category only ──────────────────────────────────────
const SHELL_PARTNERS = [
  { name: 'Leva Impact',                  category: 'Digital Marketing' },
  { name: 'madebykelan',                  category: 'Creative' },
  { name: 'Hair by Lucy Staunton Kelly',  category: 'Hair' },
  { name: 'Angelic Touch',                category: 'Hair' },
  { name: 'Ocean1',                       category: 'Clothing' },
  { name: 'Pouvoirs Gallery',             category: 'Clothing' },
  { name: 'Saiemsent',                    category: 'Clothing' },
  { name: 'Fortesce',                     category: 'Clothing' },
  { name: 'Street Clothing',              category: 'Clothing' },
  { name: 'Timing',                       category: 'Clothing' },
  { name: 'Lume',                         category: 'Food & Drink' },
  { name: 'N-joy',                        category: 'Food & Drink' },
  { name: 'Tuck Inn',                     category: 'Food & Drink' },
  { name: 'The Coffee Spot',              category: 'Food & Drink' },
  { name: 'Island Sips',                  category: 'Food & Drink' },
  { name: 'Chloe May House',              category: 'Lash Tech' },
  { name: 'Lash Lux Dublin',              category: 'Lash Tech' },
  { name: 'Dolled by M',                  category: 'Nail Tech' },
  { name: 'Eve Burac',                    category: 'Nail Tech' },
  { name: "Clara's Beauty Room",          category: 'Nail Tech' },
  { name: 'Erin Burke Makeup',            category: 'Makeup' },
  { name: 'Nicole',                       category: 'Makeup' },
  { name: 'Wzorek',                       category: 'Makeup' },
]

// ─── TBC partners: confirmed, amber badge ──────────────────────────────────────
const TBC_PARTNERS = [
  { name: 'Carolynes Beauty Studio', category: 'Beauty Studio' },
  { name: 'Makeup By Kasia',         category: 'Makeup' },
  { name: 'The PK Glam',             category: 'Beauty' },
  { name: 'Hardluck Club',           category: 'Food & Drink' },
  { name: 'Lashes By Steph',         category: 'Lash Tech' },
  { name: 'Purple Brunch',           category: 'Food & Drink' },
]

const PAGE_STYLES = `
  .partners-live-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1040px; margin: 32px auto 0; }
  .partners-shell-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 1040px; margin: 24px auto 0; }
  .partners-tbc-row { display: flex; flex-wrap: wrap; gap: 10px; max-width: 1040px; margin: 20px auto 0; justify-content: center; }
  .partner-tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  @media (max-width: 900px) { .partners-live-grid { grid-template-columns: repeat(2, 1fr); } .partners-shell-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) { .partners-live-grid { grid-template-columns: 1fr; } .partners-shell-grid { grid-template-columns: repeat(2, 1fr); } .partner-tools-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 440px) { .partners-shell-grid { grid-template-columns: 1fr; } .partner-tools-grid { grid-template-columns: 1fr; } }
`

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px', fontWeight: '600',
      color: light ? 'rgba(245,240,232,0.5)' : '#6B7280',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      textAlign: 'center',
    }}>
      {children}
    </p>
  )
}

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
        padding: '14px', textDecoration: 'none',
        transition: 'opacity 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#1E3A5F' }}>{name}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: 1.5 }}>{description}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#1E3A5F', marginTop: '8px', textAlign: 'right' }}>Open →</p>
    </a>
  )
}

function LivePartnerCard({ name, initials, initBg, category, description, deal, logo, instagram, phone }) {
  return (
    <div style={{
      position: 'relative',
      background: '#FFFFFF', borderRadius: '14px',
      boxShadow: '0px 2px 14px rgba(30,58,95,0.09)',
      padding: '24px 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Pro badge */}
      <span style={{
        position: 'absolute', top: '12px', right: '12px',
        background: '#1E3A5F', color: '#F5F0E8',
        borderRadius: '4px', padding: '3px 8px',
        fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700',
      }}>
        Pro Deal
      </span>

      {/* Logo / initials */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '12px',
        background: logo ? '#F5F0E8' : (initBg || '#F5F0E8'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {logo ? (
          <img src={logo} alt={name} style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#FFFFFF' }}>{initials}</span>
        )}
      </div>

      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F', marginTop: '14px' }}>{name}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
        <span style={{
          background: '#F5F0E8', color: '#1E3A5F', borderRadius: '6px', padding: '3px 10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
        }}>
          {category}
        </span>
        {deal && (
          <span style={{
            background: 'rgba(20,90,62,0.1)', color: '#145A3E', borderRadius: '6px', padding: '3px 10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
          }}>
            {deal}
          </span>
        )}
      </div>

      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280',
        marginTop: '12px', lineHeight: 1.65, flex: 1,
      }}>
        {description}
      </p>

      {/* Contact chips */}
      {(instagram || phone) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '20px',
                padding: '5px 12px', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
              }}
            >
              <Instagram size={12} />
              @{instagram}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '20px',
                padding: '5px 12px', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
              }}
            >
              <Phone size={12} />
              {phone}
            </a>
          )}
        </div>
      )}

      <Link
        to="/lifestyle-blueprint"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '40px', padding: '0 20px', marginTop: '16px',
          background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
          textDecoration: 'none', alignSelf: 'flex-start',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        View in Lifestyle Blueprint →
      </Link>
    </div>
  )
}

function ShellPartnerCard({ name, category }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
    }}>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#1E3A5F', margin: 0 }}>{name}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          background: '#F5F0E8', color: '#6B7280', borderRadius: '4px', padding: '2px 8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '10px',
        }}>
          {category}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic',
        }}>
          Coming soon
        </span>
      </div>
    </div>
  )
}

function TbcChip({ name, category }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      background: '#FFFFFF', borderRadius: '8px',
      border: '1.5px solid #F59E0B',
      padding: '8px 14px',
    }}>
      <span style={{
        background: '#F59E0B', color: '#fff', borderRadius: '4px',
        padding: '2px 6px', fontFamily: "'DM Sans', sans-serif",
        fontSize: '9px', fontWeight: '700', flexShrink: 0,
      }}>
        TBC
      </span>
      <div>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '13px', color: '#1E3A5F', margin: 0 }}>{name}</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#9CA3AF', margin: '1px 0 0' }}>{category}</p>
      </div>
    </div>
  )
}

export default function PartnersPage() {
  return (
    <>
      <Helmet>
        <title>Our Partners | UniBlueprint</title>
        <meta name="description" content="The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on." />
        <meta property="og:title" content="Our Partners | UniBlueprint" />
        <meta property="og:description" content="The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: '#F5F0E8' }}>

        {/* ── SECTION 1 — HERO ───────────────────────────────────────────── */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F', lineHeight: 1.15 }}>
            Our Partners
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280', margin: '16px auto 0', maxWidth: '600px', lineHeight: 1.7 }}>
            The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on.
          </p>
        </section>

        {/* ── SECTION 2 — TECHNOLOGY PARTNERS ───────────────────────────── */}
        <section style={{ padding: '80px 24px', textAlign: 'center' }}>
          <SectionLabel>Technology Partners</SectionLabel>

          <div style={{
            background: '#FFFFFF', borderRadius: '14px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '32px',
            maxWidth: '800px', margin: '24px auto 0',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <Handshake size={28} color="#1E3A5F" aria-hidden="true" />
            </div>

            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F', marginTop: '12px' }}>
              CourseCompass
            </h2>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', maxWidth: '560px', margin: '8px auto 0', lineHeight: 1.6 }}>
              Ireland's AI-powered CAO course matching platform — helping young people find the right course, pathway, and career direction.
            </p>

            <span style={{
              display: 'inline-block', marginTop: '16px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '6px', padding: '4px 12px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
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
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none', transition: 'opacity 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Visit CourseCompass
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* ── SECTION 3 — LIVE LIFESTYLE PARTNERS ────────────────────────── */}
        <section style={{ padding: '0 24px 64px', textAlign: 'center' }}>
          <SectionLabel>Lifestyle Partners</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', marginTop: '10px' }}>
            Active partner deals
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', margin: '10px auto 0', maxWidth: '560px', lineHeight: 1.65 }}>
            UniBlueprint Pro subscribers get exclusive access to deals and discounts from our lifestyle partners across Ireland.
          </p>

          <div className="partners-live-grid">
            {LIVE_PARTNERS.map(p => <LivePartnerCard key={p.id} {...p} />)}
          </div>
        </section>

        {/* ── SECTION 4 — SHELL PARTNERS ─────────────────────────────────── */}
        <section style={{ padding: '0 24px 64px', textAlign: 'center' }}>
          <SectionLabel>More Partners</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F', marginTop: '10px' }}>
            Deals launching soon
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', margin: '8px auto 0', maxWidth: '480px', lineHeight: 1.65 }}>
            These partners are confirmed and onboarding. Their full listings will be live in the app at launch.
          </p>

          <div className="partners-shell-grid">
            {SHELL_PARTNERS.map(p => <ShellPartnerCard key={p.name} {...p} />)}
          </div>
        </section>

        {/* ── SECTION 5 — TBC PARTNERS ───────────────────────────────────── */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <SectionLabel>Confirmed Partners</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F', marginTop: '10px' }}>
            Details to follow
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', margin: '6px auto 0', maxWidth: '440px', lineHeight: 1.65 }}>
            These partners are confirmed with UniBlueprint. Full details and deal terms will be announced ahead of launch.
          </p>

          <div className="partners-tbc-row">
            {TBC_PARTNERS.map(p => <TbcChip key={p.name} {...p} />)}
          </div>
        </section>

        {/* ── SECTION 6 — BECOME A PARTNER ───────────────────────────────── */}
        <section style={{ background: '#1E3A5F', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#F5F0E8' }}>
            Partner with UniBlueprint
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.7 }}>
            Reach young people across Ireland — college, apprenticeship, and every pathway in between. UniBlueprint Pro subscribers are actively looking for the right deals.
          </p>
          <Link
            to="/for-businesses"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 32px', marginTop: '24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', transition: 'opacity 150ms',
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
