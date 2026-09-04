import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// allow: array of roles permitted to view this route. Omit to allow any authenticated user.
export default function RoleRoute({ allow, children }) {
  const { user, loading, profile, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || (user && profileLoading)) return (
    <div style={{
      padding: '80px 20px',
      textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
      color: '#6B7280',
    }}>
      Loading...
    </div>
  )

  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />

  const role = profile?.role || 'contributor'
  if (allow && !allow.includes(role)) {
    return <Navigate to={role === 'operations' ? '/operations' : '/dashboard'} replace />
  }

  return children
}
