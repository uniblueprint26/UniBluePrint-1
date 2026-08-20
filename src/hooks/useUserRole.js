import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

/**
 * The current user's platform roles (handler / operations / coach / etc.).
 *
 * Reads user_roles directly — RLS already scopes it to "read your own roles
 * only" (20260410140346), so this is safe to call for any signed-in user.
 * Never trust this alone for access control: every RPC and RLS policy the
 * Handler pipeline touches re-checks has_role() server-side. This hook is for
 * deciding what to render and where to route — not the actual security
 * boundary, which lives in Postgres.
 */
export function useUserRole() {
  const { user } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        setRoles(error ? [] : (data || []).map((r) => r.role))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user])

  return {
    roles,
    loading,
    isHandler: roles.includes('handler'),
    isOperations: roles.includes('operations'),
  }
}
