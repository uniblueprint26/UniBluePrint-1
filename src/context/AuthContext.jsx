import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Roles that unlock a portal beyond the standard consumer experience.
// 'user' is the default/no-op role and is never treated as a portal role.
const PORTAL_ROLES = ['handler', 'coach', 'business', 'operations', 'founder', 'admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [subscription, setSubscription] = useState(null)
  const subChannelRef = useRef(null)

  async function loadRolesAndSubscription(userId) {
    if (!userId) {
      setRoles([])
      setSubscription(null)
      return
    }
    const [{ data: roleRows }, { data: subRow }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    ])
    setRoles((roleRows || []).map(r => r.role))
    setSubscription(subRow || null)
  }

  // Subscribe to realtime changes on this user's own subscription row so
  // access level updates the moment it changes server-side (webhook cancels,
  // Active Member Pro Access reverts, etc), not at next login. Per the spec:
  // "Session tokens must refresh at the point of subscription status change,
  // not at the next login." We can't literally mint a new JWT client-side on
  // demand, so the practical equivalent is: force a session refresh (which
  // re-runs Supabase's token flow) and re-fetch subscription state instantly
  // on the realtime event, rather than waiting for the JWT's normal refresh
  // cycle or the next page load.
  function watchSubscriptionChanges(userId) {
    if (subChannelRef.current) {
      supabase.removeChannel(subChannelRef.current)
      subChannelRef.current = null
    }
    if (!userId) return
    subChannelRef.current = supabase
      .channel(`subscription-changes-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}`,
      }, async payload => {
        setSubscription(payload.new ?? null)
        try { await supabase.auth.refreshSession() } catch { /* best effort */ }
      })
      .subscribe()
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadRolesAndSubscription(session.user.id)
        watchSubscriptionChanges(session.user.id)
      }
    })

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadRolesAndSubscription(session.user.id)
        watchSubscriptionChanges(session.user.id)
      } else {
        setRoles([])
        setSubscription(null)
        watchSubscriptionChanges(null)
      }
    })

    return () => {
      authSub.unsubscribe()
      if (subChannelRef.current) supabase.removeChannel(subChannelRef.current)
    }
  }, [])

  function hasRole(role) {
    return roles.includes(role)
  }

  // Active if paid-and-current OR a still-live Active Member Pro Access grant
  // (complimentary access retains up to 60 days after it's paused before it
  // reverts to free tier, per the Active Member Pro Access spec).
  const isPro = !!subscription && subscription.status === 'active' && (
    !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()
  )

  const portalRole = roles.find(r => PORTAL_ROLES.includes(r)) || null

  return (
    <AuthContext.Provider value={{
      user, loading, roles, hasRole, portalRole,
      subscription, isPro, isComplimentaryPro: !!subscription?.is_complimentary,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
