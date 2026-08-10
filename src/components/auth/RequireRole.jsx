import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LOADING = (
  <div style={{
    padding: '80px 20px', textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif", color: '#6B7280',
  }}>
    Loading...
  </div>
)

/**
 * Route guard for the internal portals (Founder Dashboard, Operations
 * Dashboard, Partner Portal). Sits on top of the same auth state
 * ProtectedRoute uses, adding a role check: signed in is necessary but not
 * sufficient here, the user's role must be in `allow`.
 *
 * A user who is signed in but lacks the role is redirected home rather than
 * shown a 404 or an error, since the route existing at all isn't information
 * worth revealing to someone who shouldn't be there.
 */
export default function RequireRole({ allow, children }) {
  const { user, loading, roles } = useAuth()
  const location = useLocation()

  if (loading) return LOADING
  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />

  const permitted = roles.some(r => allow.includes(r))
  if (!permitted) return <Navigate to="/" replace />

  return children
}
