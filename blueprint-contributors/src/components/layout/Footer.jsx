import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'
import UBPLogo from '../ui/UBPLogo'

function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.92a8.22 8.22 0 0 0 4.83 1.56V7.04a4.85 4.85 0 0 1-1.06-.35z" />
    </svg>
  )
}

const COLUMNS = [
  {
    title: 'Contributors',
    links: [
      { label: 'About', href: '/#about-contributors' },
      { label: 'Challenge', href: '/#challenge' },
      { label: 'Categories', href: '/#categories' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'UniBlueprint',
    links: [
      { label: 'Main site', href: 'https://uniblueprint.com' },
      { label: 'About UniBlueprint', href: 'https://uniblueprint.com/about' },
      { label: 'Terms', href: 'https://uniblueprint.com/terms' },
      { label: 'Privacy Policy', href: 'https://uniblueprint.com/privacy' },
    ],
  },
]

const colHeaderStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px', fontWeight: '600',
  color: 'rgba(245, 240, 232, 0.4)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '16px', display: 'block',
}

const colLinkStyle = {
  display: 'flex', alignItems: 'center', minHeight: '44px',
  fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
  color: 'rgba(245, 240, 232, 0.7)', textDecoration: 'none',
  transition: 'color 150ms',
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <span style={colHeaderStyle}>{title}</span>
      {links.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          style={colLinkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245, 240, 232, 0.7)')}
        >
          {label}
        </a>
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
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#F5F0E8', transition: 'background 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
    >
      {children}
    </a>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: '#1E3A5F', paddingTop: '64px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
        <div>
          <Link to="/" aria-label="Blueprint Contributors home" style={{ display: 'inline-block' }}>
            <UBPLogo height={40} color="#F5F0E8" />
          </Link>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.6)', marginTop: '8px' }}>
            Blueprint Contributors — help build Ireland's Student Success Library.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginTop: '40px', maxWidth: '480px' }}>
          {COLUMNS.map(col => <FooterColumn key={col.title} title={col.title} links={col.links} />)}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '40px', paddingTop: '24px',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
            &copy; 2026 UniBlueprint Ltd. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
