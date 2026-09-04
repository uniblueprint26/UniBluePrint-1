import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const LOADING = (
  <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
    <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', color: '#1E3A5F' }} aria-hidden="true" />
  </div>
)

/**
 * Route guard for the internal portals (Founder Dashboard, Operations
 * Dashboard, Finance Dashboard, Partner Portal, Handler Queue). Sits on top
 * of the same auth state ProtectedRoute uses, adding a role check: signed in
 * is necessary but not sufficient here, the user's role must be allowed.
 *
 * This is a UX gate, not the security boundary — a user who guesses the URL
 * sees this redirect instantly, but the real protection is server-side:
 * every table and RPC the Handler pipeline touches re-checks has_role()
 * itself (see 20260726110000_handler_pipeline.sql), so even if this
 * component were bypassed entirely, RLS still denies the reads and writes.
 *
 * Takes either `allow` or `roles` (two names for the same prop grew up
 * independently across call sites — both are supported rather than forcing
 * every call site onto one name) as the list of roles permitted through.
 * Reads roles off AuthContext (already fetched once per session there)
 * rather than re-fetching via useUserRole, which stays available for
 * call sites that want the roles list itself, not just a gate.
 */
export default function RequireRole({ allow, roles: allowRoles, children }) {
  const allowed = allow || allowRoles || []
  const { user, loading, roles, rolesLoaded } = useAuth()
  const location = useLocation()

  if (loading) return LOADING
  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />
  // roles are fetched asynchronously after `loading` flips to false, so wait
  // for that fetch to actually finish before deciding on permission — otherwise
  // a fresh page load always sees roles as [] and bounces a real founder/admin
  // straight back home.
  if (!rolesLoaded) return LOADING

  const permitted = roles.some(r => allowed.includes(r))
  if (!permitted) return <Navigate to="/" replace />

  return children
}
