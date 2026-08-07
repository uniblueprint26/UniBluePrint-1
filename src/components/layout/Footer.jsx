import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'
import UBPLogo from '../ui/UBPLogo'

// ─── TikTok SVG (not in lucide-react) ─────────────────────────────────────────
function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.92a8.22 8.22 0 0 0 4.83 1.56V7.04a4.85 4.85 0 0 1-1.06-.35z" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: 'Services',
    links: [
      { label: 'Foundation Blueprint', href: '/foundation-blueprint' },
      { label: 'Elevation Blueprint',  href: '/elevation-blueprint' },
      { label: 'Lifestyle Blueprint',  href: '/lifestyle-blueprint' },
      { label: 'Campus Connect',       href: '/campus-connect' },
      { label: 'Course Connect',       href: '/course-connect' },
      { label: 'Budgeting Tool',       href: '/budgeting' },
      { label: 'Ad Board',             href: '/ad-board' },
      { label: 'Pricing',              href: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',            href: '/about' },
      { label: 'How It Works',     href: '/how-it-works' },
      { label: 'Blog',             href: '/blog' },
      { label: 'Partners',         href: '/partners' },
      { label: 'For Universities', href: '/for-universities' },
      { label: 'For Businesses',   href: '/for-businesses' },
    ],
  },
  {
    title: 'Join',
    links: [
      { label: 'Campus Handler', href: '/join#handler-form' },
      { label: 'Uni Coach',      href: '/join#coach-form' },
      { label: 'Ambassador',     href: '/join#ambassador-form' },
      { label: 'Contact',        href: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQs',           href: '/faqs' },
      { label: 'Help Centre',    href: '/help' },
      { label: 'Accessibility',  href: '/accessibility' },
      { label: 'Terms',          href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy',  href: '/cookies' },
      { label: 'Refund Policy',  href: '/refund-policy' },
    ],
  },
]

const colHeaderStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(245, 240, 232, 0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '16px',
  display: 'block',
}

const colLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '44px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  color: 'rgba(245, 240, 232, 0.7)',
  textDecoration: 'none',
  transition: 'color 150ms',
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <span style={colHeaderStyle}>{title}</span>
      {links.map(({ label, href }) => (
        <Link
          key={label}
          to={href}
          style={colLinkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245, 240, 232, 0.7)')}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

function SocialButton({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: '44px', height: '44px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#F5F0E8',
        transition: 'background 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
    >
      {children}
    </a>
  )
}

function AppButton({ label }) {
  return (
    /* TODO: replace href with real store link */
    <button
      style={{
        background: 'none',
        border: '1px solid rgba(245,240,232,0.4)',
        borderRadius: '8px',
        padding: '10px 18px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: '#F5F0E8',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer style={{ background: '#1E3A5F', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>

        {/* Logo + tagline */}
        <div>
          <Link to="/" aria-label="UniBlueprint home" style={{ display: 'inline-block' }}>
            <UBPLogo height={40} color="#F5F0E8" />
          </Link>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: 'rgba(245,240,232,0.6)',
            marginTop: '8px',
          }}>
            The Structure Behind Your Success
          </p>
        </div>

        {/* 4-column grid */}
        <div className="footer-grid">
          {COLUMNS.map(col => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        {/* Social row */}
        <div style={{
          marginTop: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: 'rgba(245,240,232,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Follow us
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SocialButton href="https://www.instagram.com/uniblueprint26" label="UniBlueprint on Instagram">
              <Instagram size={18} />
            </SocialButton>
            <SocialButton href="https://www.tiktok.com/@uniblueprint26" label="UniBlueprint on TikTok">
              <TikTokIcon size={18} />
            </SocialButton>
          </div>
        </div>

        {/* Download row */}
        <div style={{
          marginTop: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(245,240,232,0.6)',
          }}>
            Download the app
          </span>
          <AppButton label="App Store" />
          <AppButton label="Google Play" />
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '40px',
          paddingTop: '24px',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        }}>
          <div className="footer-bottom">
            {/* Left — copyright */}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
              &copy; 2026 UniBlueprint Ltd. All rights reserved.
            </span>

            {/* Centre — registered territory only */}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
              {/* TODO: Insert company registration number when incorporated */}
              Registered in Ireland — [TODO: Insert company registration number when incorporated]
            </span>

            {/* Right — VAT + address stacked */}
            <div className="footer-legal-right">
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
                {/* TODO: Insert VAT number when registered */}
                VAT: [TODO: Insert VAT number when registered]
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
                {/* TODO: Insert registered address */}
                [TODO: Insert registered address]
              </span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
