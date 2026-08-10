import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

const PORTAL_ROLES = ['handler', 'coach', 'business', 'operations', 'founder', 'admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [portalMode, setPortalMode] = useState('personal') // 'personal' | 'studio' — dual-portal switcher state
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

  // Realtime watch on this user's own subscription row so Pro access updates
  // the instant it changes server-side, not at next app open. Per the spec:
  // "Session tokens must refresh at the point of subscription status change".
  // We force a session refresh on change rather than waiting for the token's
  // normal refresh cycle, and update local state immediately from the payload
  // so the UI reflects it before the refresh round-trip even completes.
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
        setPortalMode('personal')
        watchSubscriptionChanges(null)
      }
    })

    return () => {
      authSub.unsubscribe()
      if (subChannelRef.current) supabase.removeChannel(subChannelRef.current)
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, metadata) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  async function resendVerification(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  }

  function hasRole(role) {
    return roles.includes(role)
  }

  const isPro = !!subscription && subscription.status === 'active' && (
    !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()
  )

  const isHandler = hasRole('handler')
  const isCoach = hasRole('coach')
  const isStudioEligible = isHandler || isCoach
  const studioLabel = isHandler ? 'The Blueprint Studio' : isCoach ? 'The Elevation Studio' : 'The Studio'
  const portalRole = roles.find(r => PORTAL_ROLES.includes(r)) || null

  return (
    <AuthContext.Provider value={{
      user, loading, roles, hasRole, portalRole,
      subscription, isPro, isComplimentaryPro: !!subscription?.is_complimentary,
      signIn, signUp, signOut, resetPassword, resendVerification,
      isHandler, isCoach, isStudioEligible, studioLabel,
      portalMode, setPortalMode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
