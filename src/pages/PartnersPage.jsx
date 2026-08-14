import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, Handshake, Instagram, Phone, Mail, Link2, ArrowRight, Lock } from 'lucide-react'
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
  {
    id: 'leva',
    name: 'LEVA Impact',
    initials: 'LI',
    initBg: '#0369A1',
    category: 'Digital Marketing & Design',
    description: 'Freelance digital marketing and design service run by Alex, helping small businesses build their social media presence — content creation, UGC coordination, AI-generated video, graphic design, and paid ad campaigns. Based in Co. Mayo, available to work remotely nationwide.',
    deal: 'One week free social media trial',
    instagram: 'leva.impact',
    tiktok: 'leva.media',
    phone: '089 966 2635',
    website: 'https://alexleva.myportfolio.com/home-page',
    crossLinkHref: '/elevation-blueprint#coach-10',
    crossLinkLabel: "Also a UniBlueprint Uni Coach — see Alex's profile",
  },
  {
    id: 'henrysisters',
    name: 'Henry Sisters Co',
    initials: 'HS',
    initBg: '#92400E',
    category: 'Creative Content Creation',
    description: 'Creative content studio based in County Mayo. Photography, videography, social media content, Instagram Reels, event coverage, UGC, drone footage, and promotional content. A creative eye and professional finish for brands, businesses, and events.',
    deal: '10% off your first content creation booking',
    instagram: 'henrysistersco',
    email: 'henrysistersco@gmail.com',
  },
  {
    id: 'camila',
    name: 'Camila Aruk',
    initials: 'CA',
    initBg: '#B91C1C',
    category: 'Personal Training · Muay Thai · Yoga',
    description: 'Certified Personal Trainer and Sport Nutritionist Coach based in Dublin 8 — Muay Thai, yoga, and functional training alongside physique development, weight loss, and muscle building. Online and in person, built around realistic, sustainable routines.',
    deal: 'PT from €60/session',
    instagram: 'camilaaruk.coach',
    email: 'camila.coachfitness@gmail.com',
    phone: '0838602227',
  },
  {
    id: 'saiemsent',
    name: 'Saiemsent',
    initials: 'SS',
    initBg: '#0369A1',
    category: 'Clothing',
    description: 'Independent Irish clothing brand inspired by streetwear, graphic culture, and subcultures — bold graphics, unique silhouettes, and experimental details, building a visual identity for Irish fashion rooted in individuality and self-expression.',
    instagram: 'saiemsent',
    tiktok: 'saiemsent',
    website: 'https://saiemsent.ie',
  },
  {
    id: 'elect',
    name: 'Elect',
    initials: 'EL',
    initBg: '#111827',
    category: 'Clothing Brand',
    description: 'Irish Christian streetwear brand built around faith, purpose, and individuality — modern, high-quality clothing inspired by Scripture and Christian values, with a meaning behind every piece.',
    deal: '10% off with code ELECTXUNIBLUEPRINT',
    instagram: 'elect_co',
    tiktok: 'elect_co',
    email: 'electgodschosen@gmail.com',
  },
  {
    id: 'eabakeditt',
    name: 'Eabakeditt',
    initials: 'EB',
    initBg: '#B45309',
    category: 'Home Baking · Dublin 15',
    description: 'Home baking business in Mulhuddart, Dublin 15 — brownies, blondies, cookies, cupcakes, and fully customisable cakes made with love and care for every occasion. Every item on the menu is customisable, with pricing adjusted accordingly.',
    deal: '€5 off every item (cookie pouches to €1.50)',
    instagram: 'eabakeditt',
    tiktok: 'eabakedittt',
    phone: '0899485617',
    email: 'lizawakz@yahoo.com',
  },
  {
    id: 'ilashedbydiya',
    name: 'ilashedbydiya',
    initials: 'ID',
    initBg: '#9333EA',
    category: 'Lash Tech · Dundalk',
    description: 'Qualified beginner lash technician in Dundalk, Co. Louth, specialising in classic, hybrid, and volume lash extensions as well as lash lifts.',
    deal: '10% off first appointment',
    instagram: 'ilashedbydiya',
    tiktok: 'ilashedbydiya',
    phone: '0899428910',
    email: 'ilashedbydiya@gmail.com',
  },
  {
    id: 'roomy',
    name: 'Roomy.ie',
    initials: 'RM',
    initBg: '#0891B2',
    category: 'Housing Platform',
    description: 'Modern housing platform making it simpler, safer, and more transparent to find a room or home in Ireland — connecting room seekers with landlords and property listers nationwide. Built for students, young professionals, newcomers, and landlords alike.',
    deal: 'Free listings + €5 Priority Request',
    instagram: 'Roomy.ie',
    phone: '+353899809654',
    email: 'admin@roomy.ie',
    website: 'https://roomy.ie',
  },
  {
    id: 'royaltyproductions',
    name: 'Royalty Productions',
    initials: 'RP',
    initBg: '#78350F',
    category: 'Photography · Dublin',
    description: 'Dublin-based photography service capturing events, graduations, portraits, personal branding, and creative shoots with a natural, professional finish — imagery clients are genuinely excited to share and use.',
    deal: '10% off for verified UniBlueprint users',
    instagram: 'royalty.productions1',
    phone: '085 185 2451',
    email: 'chidoziemenyoazu1@gmail.com',
  },
  {
    id: 'veeslash',
    name: 'Vees Lash Studio',
    initials: 'VL',
    initBg: '#DB2777',
    category: 'Lash Tech · Galway',
    description: 'Lash technician based in Renmore, Galway, offering classic, hybrid, volume, and mega volume lash extensions.',
    deal: 'From €40',
    phone: '+3530852758798',
    email: 'vickylukau123@gmail.com',
  },
  {
    id: 'cutbyire',
    name: 'CutbyIre',
    initials: 'CI',
    initBg: '#374151',
    category: 'Barber · Sligo',
    description: 'Barber based in Sligo offering standard cuts, lineups, scissor cuts, kids cuts, and a home service for an extra fee depending on distance.',
    deal: 'From €15',
    instagram: 'cutbyire',
  },
  {
    id: 'poiemadexigns',
    name: 'Poiema Dexigns',
    initials: 'PD',
    initBg: '#1D4ED8',
    category: 'Web Design & Branding',
    description: 'Creative web design and branding studio building modern, user-friendly websites and cohesive visual identities for businesses, churches, and entrepreneurs — from full brand identities to logo design and website builds.',
    instagram: 'poiema_dexigns',
    email: 'oedesignns@gmail.com',
    phone: '+353834801235',
    website: 'https://www.olaoluwaesho.com/',
  },
  {
    id: 'madebykelan',
    name: 'Made By Kelan',
    initials: 'MK',
    initBg: '#1E3A5F',
    category: 'Photography & Video · Co. Mayo',
    description: 'Photography and videography from Co. Mayo — events, filming, and promotional content, including work with Machenry and the Dogroses folk band and promotional content for Cadell Bar in Galway City.',
    instagram: 'made_by_kelan',
    email: 'kelanhenry1@gmail.com',
    phone: '0830416835',
  },
  {
    id: 'clarasbeautyroom',
    name: "Clara's Beauty Room",
    initials: 'CB',
    initBg: '#EC4899',
    category: 'Nail Tech · Mayo',
    description: 'Nail technician based in Mayo offering gel extensions, gel overlay, BIAB, and shellac. Booking via Instagram DM.',
    deal: 'Gel extensions from €40',
    instagram: 'claras_beauty_room',
  },
  {
    id: 'lashesbysteph',
    name: 'Lashes By Steph',
    initials: 'LS',
    initBg: '#7C3AED',
    category: 'Lash Tech · Kildare',
    description: 'Lash technician based in Kildare offering classic, hybrid, Russian, and mega volume lash sets. Booking via Instagram DM.',
    deal: 'Classics from €35',
    instagram: 'lashedbystephhx',
  },
]

// ─── Coming Soon: everyone else — confirmed and onboarding, locked until launch
const COMING_SOON_PARTNERS = [
  { name: 'Manni The Barber',            category: 'Barber · Dundalk' },
  { name: 'MM Cutz',                     category: 'Barber · Dublin' },
  { name: 'Cut by Alind',                category: 'Barber · Mayo' },
  { name: 'Hair by Lucy Staunton Kelly', category: 'Hair' },
  { name: 'Angelic Touch',               category: 'Hair' },
  { name: 'Ocean1',                      category: 'Clothing' },
  { name: 'Archangel',                   category: 'Clothing Brand' },
  { name: 'Pouvoirs Gallery',            category: 'Clothing' },
  { name: 'Fortesce',                    category: 'Clothing' },
  { name: 'Street Clothing',             category: 'Clothing' },
  { name: 'Timing',                      category: 'Clothing' },
  { name: 'Lume',                        category: 'Food & Drink' },
  { name: 'N-joy',                       category: 'Food & Drink' },
  { name: 'Tuck Inn',                    category: 'Food & Drink' },
  { name: 'The Coffee Spot',             category: 'Food & Drink' },
  { name: 'Island Sips',                 category: 'Food & Drink' },
  { name: 'JoyofFoods',                  category: 'Food & Drink' },
  { name: 'The Drogheda Foodie',         category: 'Food & Drink' },
  { name: 'Hardluck Club',               category: 'Food & Drink' },
  { name: 'Purple Brunch',               category: 'Food & Drink' },
  { name: 'Chloe May House',             category: 'Lash Tech' },
  { name: 'Lash Lux Dublin',             category: 'Lash Tech' },
  { name: 'Dolled by M',                 category: 'Nail Tech' },
  { name: 'Eve Burac',                   category: 'Nail Tech' },
  { name: 'Erin Burke Makeup',           category: 'Makeup' },
  { name: 'Nicole',                      category: 'Makeup' },
  { name: 'Wzorek',                      category: 'Makeup' },
  { name: 'Makeup By Kasia',             category: 'Makeup' },
  { name: 'Carolynes Beauty Studio',     category: 'Beauty Studio' },
  { name: 'The PK Glam',                 category: 'Beauty' },
  { name: 'Dylan Power',                 category: 'Sports Photographer · Cork' },
]

const PAGE_STYLES = `
  .partners-live-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1040px; margin: 32px auto 0; }
  .partners-soon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 1040px; margin: 24px auto 0; }
  .partner-tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  @media (max-width: 900px) { .partners-live-grid { grid-template-columns: repeat(2, 1fr); } .partners-soon-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) { .partners-live-grid { grid-template-columns: 1fr; } .partners-soon-grid { grid-template-columns: repeat(2, 1fr); } .partner-tools-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 440px) { .partners-soon-grid { grid-template-columns: 1fr; } .partner-tools-grid { grid-template-columns: 1fr; } }
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

function LivePartnerCard({ id, name, initials, initBg, category, description, deal, logo, instagram, tiktok, phone, email, website, crossLinkHref, crossLinkLabel }) {
  return (
    <div id={id} style={{
      position: 'relative',
      background: '#FFFFFF', borderRadius: '14px',
      boxShadow: '0px 2px 14px rgba(30,58,95,0.09)',
      padding: '24px 20px',
      display: 'flex', flexDirection: 'column',
      scrollMarginTop: '96px',
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
      {(instagram || tiktok || phone || email || website) && (
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
          {tiktok && (
            <a
              href={`https://www.tiktok.com/@${tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '20px',
                padding: '5px 12px', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
              }}
            >
              <Link2 size={12} />
              TikTok @{tiktok}
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
          {email && (
            <a
              href={`mailto:${email}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '20px',
                padding: '5px 12px', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
              }}
            >
              <Mail size={12} />
              Email
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#1E3A5F', color: '#F5F0E8', borderRadius: '20px',
                padding: '5px 12px', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
              }}
            >
              <Link2 size={12} />
              Website
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

      {crossLinkHref && (
        <Link
          to={crossLinkHref}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            marginTop: '10px', textDecoration: 'none',
          }}
        >
          <ArrowRight size={11} color="#1E3A5F" />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#1E3A5F', fontWeight: '600' }}>
            {crossLinkLabel}
          </span>
        </Link>
      )}
    </div>
  )
}

function ComingSoonCard({ name, category }) {
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
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#9CA3AF',
        }}>
          <Lock size={9} />
          Coming soon
        </span>
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

        {/* ── SECTION 4 — COMING SOON ─────────────────────────────────────── */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <SectionLabel>Coming Soon</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F', marginTop: '10px' }}>
            The rest of the network
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', margin: '8px auto 0', maxWidth: '480px', lineHeight: 1.65 }}>
            These partners are confirmed and onboarding — locked until their full listing and deal go live.
          </p>

          <div className="partners-soon-grid">
            {COMING_SOON_PARTNERS.map(p => <ComingSoonCard key={p.name} {...p} />)}
          </div>
        </section>

        {/* ── SECTION 5 — BECOME A PARTNER ───────────────────────────────── */}
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
