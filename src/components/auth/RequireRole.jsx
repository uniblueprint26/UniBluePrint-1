import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'

/**
 * A route guard genuinely locked to role, not just hidden from nav.
 *
 * Layers on top of ProtectedRoute's "must be signed in" check with "must hold
 * one of `roles`". This is a UX gate, not the security boundary — a
 * non-handler who guesses the URL sees this redirect instantly, but the real
 * protection is server-side: every table and RPC the Handler pipeline touches
 * re-checks has_role() itself (see 20260726110000_handler_pipeline.sql), so
 * even if this component were bypassed entirely, RLS still denies the reads
 * and writes.
 */
export default function RequireRole({ roles, children }) {
  const { user, loading: authLoading } = useAuth()
  const { roles: userRoles, loading: rolesLoading } = useUserRole()
  const location = useLocation()

  if (authLoading || (user && rolesLoading)) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', color: '#1E3A5F' }} aria-hidden="true" />
      </div>
    )
  }

  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />

  const authorised = roles.some((r) => userRoles.includes(r))
  if (!authorised) return <Navigate to="/" replace />

  return children
}
