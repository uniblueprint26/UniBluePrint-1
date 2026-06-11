import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const { user } = useAuth()

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header style={{
      padding: '0 24px',
      height: '64px',
      background: '#F5F0E8',
      borderBottom: '1px solid rgba(30, 58, 95, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link
        to="/"
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '20px',
          color: '#1E3A5F',
          letterSpacing: '-0.3px',
        }}
      >
        Uniblueprint
      </Link>

      <nav aria-label="Main navigation">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              aria-label={`User avatar: ${user.user_metadata?.full_name ?? user.email}`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1E3A5F',
                color: '#F5F0E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: '1px solid rgba(30, 58, 95, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#1E3A5F',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/sign-in"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                color: '#1E3A5F',
                padding: '8px 16px',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                color: '#F5F0E8',
                background: '#1E3A5F',
                padding: '9px 18px',
                borderRadius: '8px',
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
