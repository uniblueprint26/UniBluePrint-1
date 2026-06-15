import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu, X, ChevronDown, LogIn, UserCircle,
  FileText, Mail, Award, BookOpen, Star, Pen,
  Target, Mic, TrendingUp, Briefcase, Users, Calendar,
  Instagram, Search,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import UBPLogo from '../ui/UBPLogo'

// ─── Nav data ─────────────────────────────────────────────────────────────────

const FOUNDATION_SERVICES = [
  { label: 'Assignments & Essays', icon: FileText, href: '/foundation-blueprint' },
  { label: 'CV & Resumé', icon: Star, href: '/foundation-blueprint' },
  { label: 'Cover Letters', icon: Mail, href: '/foundation-blueprint' },
  { label: 'College Applications', icon: BookOpen, href: '/foundation-blueprint' },
  { label: 'Scholarship Support', icon: Award, href: '/foundation-blueprint' },
  { label: 'Personal Statements', icon: Pen, href: '/foundation-blueprint' },
]

const ELEVATION_SERVICES = [
  { label: 'Career Coaching', icon: Target, href: '/elevation-blueprint' },
  { label: 'Interview Preparation', icon: Mic, href: '/elevation-blueprint' },
  { label: 'LinkedIn & Personal Brand', icon: TrendingUp, href: '/elevation-blueprint' },
  { label: 'Internship Applications', icon: Briefcase, href: '/elevation-blueprint' },
  { label: 'Career Planning', icon: Calendar, href: '/elevation-blueprint' },
  { label: 'Mentorship', icon: Users, href: '/elevation-blueprint' },
]

const JOIN_LINKS = [
  { label: 'Campus Handler', href: '/join-handler' },
  { label: 'Uni Coach', href: '/join-coach' },
  { label: 'Ambassador', href: '/ambassadors' },
]

const MOBILE_SERVICE_LINKS = [
  { label: 'Foundation Blueprint', href: '/foundation-blueprint' },
  { label: 'Elevation Blueprint', href: '/elevation-blueprint' },
  { label: 'Lifestyle Blueprint', href: '/lifestyle-blueprint' },
  { label: 'Campus Connect', href: '/campus-connect' },
  { label: 'Course Connect', href: '/course-connect' },
]

// ─── Small reusable pieces ─────────────────────────────────────────────────────

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        color: '#1E3A5F',
        textDecoration: 'none',
        transition: 'opacity 150ms',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '44px',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </Link>
  )
}

function DropdownTrigger({ id, controls, label, isOpen, onClick, onFocus, onMouseEnter, onMouseLeave }) {
  return (
    <button
      id={id}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-controls={controls}
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        color: '#1E3A5F',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: 0,
        transition: 'opacity 150ms',
        whiteSpace: 'nowrap',
        opacity: isOpen ? 0.7 : 1,
      }}
    >
      {label}
      <ChevronDown
        size={14} aria-hidden="true"
        style={{
          transition: 'transform 150ms',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Navbar({ onSearchOpen }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const [mobileJoinOpen, setMobileJoinOpen] = useState(false)

  const servicesTimer = useRef(null)
  const joinTimer = useRef(null)
  const menuRef = useRef(null)
  const userRef = useRef(null)
  const servicesRef = useRef(null)
  const joinRef = useRef(null)

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  // Services hover
  const onServicesEnter = () => { clearTimeout(servicesTimer.current); setIsServicesOpen(true) }
  const onServicesLeave = () => { servicesTimer.current = setTimeout(() => setIsServicesOpen(false), 200) }

  // Join hover
  const onJoinEnter = () => { clearTimeout(joinTimer.current); setIsJoinOpen(true) }
  const onJoinLeave = () => { joinTimer.current = setTimeout(() => setIsJoinOpen(false), 200) }

  // Click-outside user dropdown
  useEffect(() => {
    if (!isUserOpen) return
    const handler = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setIsUserOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isUserOpen])

  // Keyboard trap + body lock for mobile menu
  useEffect(() => {
    if (!isMenuOpen) return

    document.body.style.overflow = 'hidden'

    const handleKey = (e) => {
      if (e.key === 'Escape') { setIsMenuOpen(false); return }
      if (e.key !== 'Tab' || !menuRef.current) return
      const focusable = Array.from(
        menuRef.current.querySelectorAll('a[href], button:not([disabled])')
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKey)
    setTimeout(() => menuRef.current?.querySelector('button')?.focus(), 50)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsUserOpen(false)
    setIsMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsMenuOpen(false)

  // ─── Auth buttons (desktop) ─────────────────────────────────────────────────
  const desktopAuthSection = user ? (
    <div ref={userRef} style={{ position: 'relative', marginLeft: '8px' }}>
      <button
        onClick={() => setIsUserOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={isUserOpen}
        style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: '#1E3A5F',
          color: '#F5F0E8',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {initials}
      </button>

      {isUserOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0px 4px 20px rgba(30,58,95,0.14)',
          minWidth: '160px',
          overflow: 'hidden',
          zIndex: 99,
        }}>
          <Link
            to="/subscription-management"
            onClick={() => setIsUserOpen(false)}
            style={{ display: 'block', padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', borderBottom: '1px solid rgba(30,58,95,0.08)' }}
          >
            My Account
          </Link>
          <button
            onClick={handleSignOut}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
      <Link
        to="/sign-in"
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500',
          color: '#1E3A5F',
          border: '1px solid #1E3A5F', borderRadius: '8px',
          height: '36px', padding: '0 20px',
          display: 'inline-flex', alignItems: 'center',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Sign In
      </Link>
      <Link
        to="/sign-up"
        style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500',
          color: '#F5F0E8',
          background: '#1E3A5F', borderRadius: '8px',
          height: '36px', padding: '0 20px',
          display: 'inline-flex', alignItems: 'center',
          textDecoration: 'none',
          marginLeft: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        Sign Up
      </Link>
    </div>
  )

  // ─── DESKTOP NAVBAR ─────────────────────────────────────────────────────────
  const desktopNav = (
    <header
      className="desktop-nav-only"
      style={{
        background: '#ffffff',
        boxShadow: '0px 1px 4px rgba(30,58,95,0.06)',
        minHeight: '72px',
        position: 'sticky', top: 0, zIndex: 100,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '32px', paddingRight: '32px',
        paddingBottom: '0',
        gap: '24px',
      }}
    >
      {/* Logo */}
      <Link to="/" aria-label="UniBlueprint home" style={{ flexShrink: 0 }}>
        <UBPLogo height={36} />
      </Link>

      {/* Centre nav */}
      <nav
        aria-label="Main navigation"
        style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'center' }}
      >
        <NavLink to="/">Home</NavLink>
        <NavLink to="/how-it-works">How It Works</NavLink>

        {/* Services mega dropdown */}
        <div
          ref={servicesRef}
          style={{ position: 'relative' }}
          onMouseEnter={onServicesEnter}
          onMouseLeave={onServicesLeave}
          onBlur={(e) => {
            if (!servicesRef.current?.contains(e.relatedTarget)) setIsServicesOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsServicesOpen(false)
              document.getElementById('nav-services-trigger')?.focus()
              return
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const links = Array.from(servicesRef.current?.querySelectorAll('a.dropdown-link') || [])
              if (!links.length) return
              const idx = links.indexOf(document.activeElement)
              if (e.key === 'ArrowDown') links[idx < 0 ? 0 : (idx + 1) % links.length]?.focus()
              else links[idx < 0 ? links.length - 1 : (idx - 1 + links.length) % links.length]?.focus()
            }
          }}
        >
          <DropdownTrigger
            id="nav-services-trigger"
            controls="nav-services-dropdown"
            label="Services"
            isOpen={isServicesOpen}
            onClick={() => setIsServicesOpen(v => !v)}
            onFocus={onServicesEnter}
            onMouseEnter={onServicesEnter}
            onMouseLeave={onServicesLeave}
          />

          {isServicesOpen && (
            <div
              id="nav-services-dropdown"
              role="navigation"
              aria-label="Services menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 20px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0px 4px 20px rgba(30,58,95,0.14)',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0 24px',
                zIndex: 99,
              }}
            >
              {/* Foundation column */}
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Foundation Blueprint
                </p>
                {FOUNDATION_SERVICES.map(({ label, icon: Icon, href }) => (
                  <Link key={label} to={href} className="dropdown-link" onClick={() => setIsServicesOpen(false)}>
                    <Icon size={16} color="#1E3A5F" aria-hidden="true" style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Elevation column */}
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Elevation Blueprint
                </p>
                {ELEVATION_SERVICES.map(({ label, icon: Icon, href }) => (
                  <Link key={label} to={href} className="dropdown-link" onClick={() => setIsServicesOpen(false)}>
                    <Icon size={16} color="#1E3A5F" aria-hidden="true" style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        {/* Search */}
        <button
          onClick={onSearchOpen}
          aria-label="Search"
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9CA3AF',
            transition: 'color 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
        >
          <Search size={20} aria-hidden="true" />
        </button>

        <Link
          to="/for-universities"
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
            color: '#6B7280', textDecoration: 'none',
            transition: 'color 150ms', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          For Universities
        </Link>

        {/* Join the Team dropdown */}
        <div
          ref={joinRef}
          style={{ position: 'relative' }}
          onMouseEnter={onJoinEnter}
          onMouseLeave={onJoinLeave}
          onBlur={(e) => {
            if (!joinRef.current?.contains(e.relatedTarget)) setIsJoinOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsJoinOpen(false)
              document.getElementById('nav-join-trigger')?.focus()
              return
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const links = Array.from(joinRef.current?.querySelectorAll('a.dropdown-link') || [])
              if (!links.length) return
              const idx = links.indexOf(document.activeElement)
              if (e.key === 'ArrowDown') links[idx < 0 ? 0 : (idx + 1) % links.length]?.focus()
              else links[idx < 0 ? links.length - 1 : (idx - 1 + links.length) % links.length]?.focus()
            }
          }}
        >
          <DropdownTrigger
            id="nav-join-trigger"
            controls="nav-join-dropdown"
            label="Join the Team"
            isOpen={isJoinOpen}
            onClick={() => setIsJoinOpen(v => !v)}
            onFocus={onJoinEnter}
            onMouseEnter={onJoinEnter}
            onMouseLeave={onJoinLeave}
          />

          {isJoinOpen && (
            <div
              id="nav-join-dropdown"
              role="navigation"
              aria-label="Join the Team menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 20px)',
                right: 0,
                background: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0px 4px 20px rgba(30,58,95,0.14)',
                padding: '8px',
                minWidth: '180px',
                zIndex: 99,
              }}
            >
              {JOIN_LINKS.map(({ label, href }) => (
                <Link key={label} to={href} className="dropdown-link" onClick={() => setIsJoinOpen(false)}>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Auth */}
        {desktopAuthSection}
      </div>
    </header>
  )

  // ─── MOBILE NAVBAR ──────────────────────────────────────────────────────────
  const mobileNav = (
    <header
      className="mobile-nav-only"
      style={{
        background: '#ffffff',
        boxShadow: '0px 1px 4px rgba(30,58,95,0.06)',
        minHeight: '56px',
        position: 'sticky', top: 0, zIndex: 100,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px', paddingRight: '16px',
        paddingBottom: '0',
      }}
    >
      <Link to="/" aria-label="UniBlueprint home">
        <UBPLogo height={32} />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Collapsed auth icon */}
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
          <Link
            to="/sign-in"
            aria-label="Sign in"
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A5F' }}
          >
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

  // ─── MOBILE MENU ────────────────────────────────────────────────────────────
  const mobileSubLinkStyle = {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    color: '#1E3A5F',
    padding: '10px 24px 10px 32px',
    textDecoration: 'none',
    opacity: 0.8,
  }

  const mobilePrimaryLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'DM Serif Display', serif",
    fontSize: '24px',
    color: '#1E3A5F',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(30,58,95,0.08)',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  }

  const mobileMenu = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeMenu}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 199,
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? 'auto' : 'none',
          transition: 'opacity 300ms',
        }}
      />

      {/* Menu panel */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%',
          background: '#F5F0E8',
          zIndex: 200,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isMenuOpen ? 'transform 300ms ease-out' : 'transform 250ms ease-in',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px 16px 0' }}>
          <Link to="/" onClick={closeMenu} aria-label="UniBlueprint home">
            <UBPLogo height={48} />
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

        {/* Links */}
        <nav aria-label="Mobile navigation" style={{ marginTop: '16px', flex: 1 }}>
          <Link to="/" onClick={closeMenu} style={{ ...mobilePrimaryLinkStyle, borderBottom: '1px solid rgba(30,58,95,0.08)' }}>Home</Link>
          <Link to="/how-it-works" onClick={closeMenu} style={{ ...mobilePrimaryLinkStyle, borderBottom: '1px solid rgba(30,58,95,0.08)' }}>How It Works</Link>

          {/* Services expandable */}
          <div>
            <button
              onClick={() => setMobileServicesOpen(v => !v)}
              aria-expanded={mobileServicesOpen}
              aria-controls="mobile-services-panel"
              style={{ ...mobilePrimaryLinkStyle, borderBottom: mobileServicesOpen ? 'none' : '1px solid rgba(30,58,95,0.08)' }}
            >
              Services
              <ChevronDown size={20} aria-hidden="true" style={{ transition: 'transform 200ms', transform: mobileServicesOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>
            <div id="mobile-services-panel" hidden={!mobileServicesOpen}>
              <div style={{ borderBottom: '1px solid rgba(30,58,95,0.08)', paddingBottom: '8px' }}>
                {MOBILE_SERVICE_LINKS.map(({ label, href }) => (
                  <Link key={label} to={href} onClick={closeMenu} style={mobileSubLinkStyle}>{label}</Link>
                ))}
              </div>
            </div>
          </div>

          <Link to="/pricing" onClick={closeMenu} style={{ ...mobilePrimaryLinkStyle, borderBottom: '1px solid rgba(30,58,95,0.08)' }}>Pricing</Link>
          <Link to="/about" onClick={closeMenu} style={{ ...mobilePrimaryLinkStyle, borderBottom: '1px solid rgba(30,58,95,0.08)' }}>About</Link>
          <Link to="/for-universities" onClick={closeMenu} style={{ ...mobilePrimaryLinkStyle, borderBottom: '1px solid rgba(30,58,95,0.08)' }}>For Universities</Link>

          {/* Join the Team expandable */}
          <div>
            <button
              onClick={() => setMobileJoinOpen(v => !v)}
              aria-expanded={mobileJoinOpen}
              aria-controls="mobile-join-panel"
              style={{ ...mobilePrimaryLinkStyle, borderBottom: mobileJoinOpen ? 'none' : '1px solid rgba(30,58,95,0.08)' }}
            >
              Join the Team
              <ChevronDown size={20} aria-hidden="true" style={{ transition: 'transform 200ms', transform: mobileJoinOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>
            <div id="mobile-join-panel" hidden={!mobileJoinOpen}>
              <div style={{ borderBottom: '1px solid rgba(30,58,95,0.08)', paddingBottom: '8px' }}>
                {JOIN_LINKS.map(({ label, href }) => (
                  <Link key={label} to={href} onClick={closeMenu} style={mobileSubLinkStyle}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom auth buttons */}
        <div style={{ padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {user ? (
            <>
              <Link
                to="/subscription-management"
                onClick={closeMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '52px', borderRadius: '8px',
                  border: '1px solid #1E3A5F',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  color: '#1E3A5F', textDecoration: 'none',
                }}
              >
                My Account
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  height: '52px', borderRadius: '8px',
                  background: '#1E3A5F', border: 'none',
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
                  height: '52px', borderRadius: '8px',
                  border: '1px solid #1E3A5F',
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
                  height: '52px', borderRadius: '8px',
                  background: '#1E3A5F', border: 'none',
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
