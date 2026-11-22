import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, Handshake, Dumbbell, Sparkles, Camera, UtensilsCrossed, Car, TrendingUp, Scissors, Shirt } from 'lucide-react'

// The website names no individual lifestyle partners or coaches. Their names,
// photos and deals live in the app, so this page never needs updating when
// one joins or leaves. Only platform partners (below) are named here.

const COURSECOMPASS_URL = 'https://coursecompass.ie/course-compass'

const CC_TOOLS = [
  { name: 'Course Compass',         description: 'Find your ideal CAO course with AI matching.',  url: 'https://coursecompass.ie/course-compass' },
  { name: 'Subject Interest Test',  description: 'Identify subjects that match your strengths.',  url: 'https://coursecompass.ie/subject-interest-test' },
  { name: 'Learning Style Test',    description: 'Discover how you learn best.',                  url: 'https://coursecompass.ie/learning-style-test' },
  { name: 'PLC Compass',            description: 'Match with the right PLC course.',              url: 'https://coursecompass.ie/plc-compass-test' },
  { name: 'Apprenticeship Compass', description: 'Find the right apprenticeship pathway.',        url: 'https://coursecompass.ie/apprentice-compass-test' },
  { name: '5th & 6th Year Bundle',  description: 'Senior cycle tools, bundled together.',         url: 'https://coursecompass.ie/bundles/senior-cycle' },
]


// Platform partners: products other teams build that sit alongside UBP.
const PLATFORM_PARTNERS = [
  {
    name: 'Roomy.ie',
    category: 'Housing',
    description: 'A housing platform that makes it simpler, safer and more transparent to find a room or home in Ireland. It connects room seekers with landlords nationwide.',
    href: 'https://roomy.ie',
    cta: 'Visit Roomy.ie',
  },
  {
    name: 'ScoutByRohi',
    category: 'Internships and graduate schemes',
    description: "An Irish internship and graduate scheme tracker. Listings come from employers' own careers pages and every one links to the official application. Live beta.",
    href: 'https://scoutbyrohi.com/tracker',
    cta: 'Visit ScoutByRohi',
  },
  {
    name: 'Kobo',
    category: 'Sending money home',
    description: 'An app to send euros from Ireland to family in Nigeria. Kobo is not a bank. It is in closed beta with test money only, and the waitlist is open.',
    href: 'https://kobopayments.com/waitlist',
    cta: 'Join the Kobo waitlist',
  },
  {
    name: 'Priority Events',
    category: 'Events',
    description: 'Nights out and live music across Ireland, for people aged 18 and over. Tickets are sold on this website.',
    to: '/priority',
    cta: 'See Priority events',
  },
]

const LIFESTYLE_CATEGORIES = [
  { label: 'Fitness and PT',    Icon: Dumbbell },
  { label: 'Beauty',            Icon: Sparkles },
  { label: 'Hair and styling',  Icon: Scissors },
  { label: 'Photography',       Icon: Camera },
  { label: 'Food and drink',    Icon: UtensilsCrossed },
  { label: 'Clothing',          Icon: Shirt },
  { label: 'Automotive',        Icon: Car },
  { label: 'Digital marketing', Icon: TrendingUp },
]

const HOW_IT_WORKS = [
  { n: 1, title: 'Local businesses join', desc: 'Businesses across Ireland offer a deal to UniBlueprint members.' },
  { n: 2, title: 'You find them in the app', desc: 'Browse by category and county. Each partner has their own profile and deal.' },
  { n: 3, title: 'Show your badge', desc: 'Unlock the deal in the app and show it to the partner to claim your saving.' },
]

const PAGE_STYLES = `
  .partner-tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .partner-platform-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: 32px auto 0; }
  .partner-cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 900px; margin: 32px auto 0; }
  .partner-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 40px auto 0; }
  @media (max-width: 900px) { .partner-cat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .partner-tools-grid { grid-template-columns: repeat(2, 1fr); }
    .partner-platform-grid { grid-template-columns: 1fr; }
    .partner-steps-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 440px) { .partner-tools-grid { gap: 8px; } .partner-cat-grid { gap: 8px; } }
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


function PlatformCard({ name, category, description, href, to, cta }) {
  const linkStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px',
    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', textDecoration: 'none',
  }
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '14px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '28px', textAlign: 'left', display: 'flex', flexDirection: 'column',
    }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
        {category}
      </p>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', margin: '8px 0 0' }}>{name}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: '10px 0 0', flex: 1 }}>{description}</p>
      {to ? (
        <Link to={to} style={linkStyle}>{cta} →</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {cta} <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
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

        {/* HERO */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F', lineHeight: 1.15 }}>
            Our Partners
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280', margin: '16px auto 0', maxWidth: '600px', lineHeight: 1.7 }}>
            The businesses, brands, and platforms that make UniBlueprint stronger for every young person across Ireland, whatever pathway they are on.
          </p>
        </section>

        {/* ── SECTION 2, TECHNOLOGY PARTNERS ───────────────────────────── */}
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
              Ireland's AI-powered CAO course matching platform, helping young people find the right course, pathway, and career direction.
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

        {/* PLATFORM PARTNERS */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <SectionLabel>Platform Partners</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', marginTop: '8px' }}>
            Built to work alongside us
          </h2>
          <div className="partner-platform-grid">
            {PLATFORM_PARTNERS.map(p => <PlatformCard key={p.name} {...p} />)}
          </div>
        </section>

        {/* LIFESTYLE PARTNERS */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <SectionLabel>Lifestyle Partners</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', marginTop: '8px' }}>
            Deals from local businesses
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.7 }}>
            Businesses across Ireland offer deals to UniBlueprint members. Meet them in the app, where every partner has their own profile.
          </p>
          <div className="partner-cat-grid">
            {LIFESTYLE_CATEGORIES.map(({ label, Icon }) => (
              <div key={label} style={{
                background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              }}>
                <Icon size={22} color="#1E3A5F" aria-hidden="true" />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="partner-steps-grid">
            {HOW_IT_WORKS.map(st => (
              <div key={st.n} style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F', margin: 0 }}>{st.n}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, color: '#1E3A5F', margin: '6px 0 0' }}>{st.title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '6px 0 0' }}>{st.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/lifestyle-blueprint" style={{
            display: 'inline-flex', alignItems: 'center', height: '48px', padding: '0 24px', marginTop: '36px',
            background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600,
          }}>
            See Lifestyle Blueprint
          </Link>
        </section>

        {/* ── SECTION 5, BECOME A PARTNER ───────────────────────────────── */}
        <section style={{ background: '#1E3A5F', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#F5F0E8' }}>
            Partner with UniBlueprint
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.7 }}>
            Reach young people across Ireland, college, apprenticeship, and every pathway in between. UniBlueprint Pro subscribers are actively looking for the right deals.
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
