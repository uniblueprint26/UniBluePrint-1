import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import UBPLogo from '../ui/UBPLogo'

const NAV_LINKS = [
  { label: 'About', href: '/#about-contributors' },
  { label: 'Challenge', href: '/#challenge' },
  { label: 'Categories', href: '/#categories' },
  { label: 'FAQ', href: '/#faq' },
]

function NavLink({ to, children }) {
  return (
    <a
      href={to}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', fontWeight: '500', color: '#1E3A5F',
        textDecoration: 'none', transition: 'opacity 150ms',
        whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', minHeight: '44px',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </a>
  )
}

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isOperations = profile?.role === 'operations'
  const homeHref = isOperations ? '/operations' : '/dashboard'
  const homeLabel = isOperations ? 'Operations' : 'Dashboard'

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  useEffect(() => {
    if (!isMenuOpen) return
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false) }
    document.addEventListener('keydown', handleKey)
    setTimeout(() => menuRef.current?.querySelector('a, button')?.focus(), 50)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsMenuOpen(false)

  const desktopAuthSection = user ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
      <Link
        to={homeHref}
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500',
          color: '#1E3A5F', border: '1px solid #1E3A5F', borderRadius: '8px',
          height: '36px', padding: '0 20px',
          display: 'inline-flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        {homeLabel}
      </Link>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#1E3A5F', color: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
        flexShrink: 0,
      }}>
        {initials}
      </div>
      <button
        onClick={handleSignOut}
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500',
          color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        Sign Out
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
      <Link
        to="/sign-in"
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500',
          color: '#1E3A5F', border: '1px solid #1E3A5F', borderRadius: '8px',
          height: '36px', padding: '0 20px',
          display: 'inline-flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        Sign In
      </Link>
      <Link
        to="/sign-up"
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500',
          color: '#F5F0E8', background: '#1E3A5F', borderRadius: '8px',
          height: '36px', padding: '0 20px',
          display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
          marginLeft: '8px', whiteSpace: 'nowrap',
        }}
      >
        Sign Up
      </Link>
    </div>
  )

  const desktopNav = (
    <header
      className="desktop-nav-only"
      style={{
        background: '#ffffff',
        boxShadow: '0px 1px 4px rgba(30,58,95,0.06)',
        minHeight: '72px',
        position: 'sticky', top: 0, zIndex: 100,
        alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: '32px', paddingRight: '32px', paddingBottom: '0',
        gap: '24px',
      }}
    >
      <Link to="/" aria-label="Blueprint Contributors home" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UBPLogo height={32} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '1px solid rgba(30,58,95,0.15)', paddingLeft: '10px' }}>
          Contributors
        </span>
      </Link>

      <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'center' }}>
        {NAV_LINKS.map(({ label, href }) => <NavLink key={label} to={href}>{label}</NavLink>)}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {desktopAuthSection}
      </div>
    </header>
  )

  const mobileNav = (
    <header
      className="mobile-nav-only"
      style={{
        background: '#ffffff',
        boxShadow: '0px 1px 4px rgba(30,58,95,0.06)',
        minHeight: '56px',
        position: 'sticky', top: 0, zIndex: 100,
        alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: '16px', paddingRight: '16px', paddingBottom: '0',
      }}
    >
      <Link to="/" aria-label="Blueprint Contributors home">
        <UBPLogo height={30} />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {user ? (
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open account menu"
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#1E3A5F', color: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
            }}>
              {initials}
            </div>
          </button>
        ) : (
          <Link to="/sign-in" aria-label="Sign in" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A5F' }}>
            <LogIn size={22} />
          </Link>
        )}
        <button
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A5F' }}
        >
          <Menu size={24} aria-hidden="true" />
        </button>
      </div>
    </header>
  )

  const mobilePrimaryLinkStyle = {
    display: 'block',
    fontFamily: "'DM Serif Display', serif",
    fontSize: '22px', color: '#1E3A5F',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(30,58,95,0.08)',
    textDecoration: 'none',
  }

  const mobileMenu = (
    <>
      <div
        aria-hidden="true"
        onClick={closeMenu}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199,
          opacity: isMenuOpen ? 1 : 0, pointerEvents: isMenuOpen ? 'auto' : 'none',
          transition: 'opacity 300ms',
        }}
      />
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%',
          background: '#F5F0E8', zIndex: 200,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isMenuOpen ? 'transform 300ms ease-out' : 'transform 250ms ease-in',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px 16px 0' }}>
          <Link to="/" onClick={closeMenu} aria-label="Blueprint Contributors home">
            <UBPLogo height={44} />
          </Link>
          <button
            onClick={closeMenu}
            aria-label="Close navigation menu"
            style={{
              position: 'absolute', right: '4px', top: '8px',
              width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A5F',
            }}
          >
            <X size={28} />
          </button>
        </div>

        <nav aria-label="Mobile navigation" style={{ marginTop: '16px', flex: 1 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={closeMenu} style={mobilePrimaryLinkStyle}>{label}</a>
          ))}
        </nav>

        <div style={{ padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {user ? (
            <>
              <Link
                to={homeHref}
                onClick={closeMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '52px', borderRadius: '8px', border: '1px solid #1E3A5F',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  color: '#1E3A5F', textDecoration: 'none',
                }}
              >
                {homeLabel}
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  height: '52px', borderRadius: '8px', background: '#1E3A5F', border: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  color: '#F5F0E8', cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/sign-in"
                onClick={closeMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '52px', borderRadius: '8px', border: '1px solid #1E3A5F',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  color: '#1E3A5F', textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                onClick={closeMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '52px', borderRadius: '8px', background: '#1E3A5F', border: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  color: '#F5F0E8', textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {desktopNav}
      {mobileNav}
      {mobileMenu}
    </>
  )
}
