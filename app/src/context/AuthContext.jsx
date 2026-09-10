import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../lib/supabase'
import { DEFAULT_USER_TYPE, isValidUserType } from '../constants/userTypes'
import { isValidJourneyStage } from '../constants/journeyStages'

const AuthContext = createContext({})

const PORTAL_ROLES = ['handler', 'coach', 'business', 'operations', 'founder', 'admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [portalMode, setPortalMode] = useState('personal') // 'personal' | 'studio', dual-portal switcher state
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
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

  // Loads the profiles row backing useUserType() and any other profile-wide
  // reads. Kept separate from loadRolesAndSubscription so a failure here
  // (or a slower query) never blocks role/subscription-gated UI.
  const loadProfile = useCallback(async userId => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_type, journey_stage')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data || null)
    setProfileLoading(false)
  }, [])

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
        loadProfile(session.user.id)
        watchSubscriptionChanges(session.user.id)
      } else {
        setProfileLoading(false)
      }
    })

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadRolesAndSubscription(session.user.id)
        loadProfile(session.user.id)
        watchSubscriptionChanges(session.user.id)
      } else {
        setRoles([])
        setSubscription(null)
        setPortalMode('personal')
        setProfile(null)
        setProfileLoading(false)
        watchSubscriptionChanges(null)
      }
    })

    // Verifying an email happens in the device's browser, outside this app
    // instance, so nothing here fires automatically when it happens. Without
    // this, a just-verified user would keep seeing the "unverified" banner
    // until something else happened to refresh the session (a token refresh,
    // a fresh app launch). Re-checking on foreground closes that gap: verify
    // in the browser, switch back to the app, banner clears within moments.
    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        // refreshSession (not getSession) — this needs a real round trip to
        // Supabase to pick up email_confirmed_at set by the server after the
        // user clicked the link; getSession only reads what's cached locally.
        supabase.auth.refreshSession().then(({ data: { session } }) => {
          if (session?.user) setUser(session.user)
        }).catch(() => {})
      }
    })

    return () => {
      authSub.unsubscribe()
      appStateSub.remove()
      if (subChannelRef.current) supabase.removeChannel(subChannelRef.current)
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
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

  // Writes the general user_type concept (see constants/userTypes.js) to
  // this user's profile row and updates it locally so every screen reading
  // useUserType() sees the change immediately — no refetch/reload needed.
  // Backing store for both the signup step and the Settings editor.
  const updateUserType = useCallback(async nextType => {
    if (!user?.id || !isValidUserType(nextType)) return { error: new Error('Invalid user type') }
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: nextType })
      .eq('id', user.id)
    if (!error) setProfile(prev => ({ ...(prev || { id: user.id }), user_type: nextType }))
    return { error }
  }, [user?.id])

  // Writes the journey_stage concept (see constants/journeyStages.js) —
  // shared life stage, deliberately separate from user_type. Same
  // immediate-local-update pattern as updateUserType above.
  const updateJourneyStage = useCallback(async nextStage => {
    if (!user?.id || !isValidJourneyStage(nextStage)) return { error: new Error('Invalid journey stage') }
    const { error } = await supabase
      .from('profiles')
      .update({ journey_stage: nextStage })
      .eq('id', user.id)
    if (!error) setProfile(prev => ({ ...(prev || { id: user.id }), journey_stage: nextStage }))
    return { error }
  }, [user?.id])

  function hasRole(role) {
    return roles.includes(role)
  }

  const isPro = !!subscription && subscription.status === 'active' && (
    !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()
  )

  const isHandler = hasRole('handler')
  const isCoach = hasRole('coach')
  const isFounder = hasRole('founder')
  const isOperations = hasRole('operations')
  const isBusiness = hasRole('business')
  const isStudioEligible = isHandler || isCoach
  // Any of the five internal-team roles that get a second, professional-side
  // interface in addition to their personal "My Blueprint" experience.
  const isAnyPortalEligible = isHandler || isCoach || isFounder || isOperations || isBusiness
  const studioLabel = isHandler ? 'The Blueprint Studio'
    : isCoach ? 'The Elevation Studio'
    : isFounder ? 'Founder Dashboard'
    : isOperations ? 'Operations Dashboard'
    : isBusiness ? 'Partner Portal'
    : 'The Studio'
  const portalRole = roles.find(r => PORTAL_ROLES.includes(r)) || null

  // The general user_type concept (Student / Apprentice / Gap Year /
  // Worker) — falls back to the default while the profile is still loading
  // or for a user with no profile row yet, so every consumer always gets a
  // valid key. Prefer the useUserType() hook over reading these directly.
  const userType = (profile?.user_type && isValidUserType(profile.user_type))
    ? profile.user_type
    : DEFAULT_USER_TYPE

  // The journey_stage concept (Finding Your Feet / In the Thick of It /
  // At a Crossroads / Wrapping Up) — unlike userType, has no fallback
  // default: null means the person hasn't said yet, and consumers (Course
  // Connect) should prompt for it rather than silently assuming one.
  const journeyStage = (profile?.journey_stage && isValidJourneyStage(profile.journey_stage))
    ? profile.journey_stage
    : null

  return (
    <AuthContext.Provider value={{
      user, loading, roles, hasRole, portalRole,
      subscription, isPro, isComplimentaryPro: !!subscription?.is_complimentary,
      signIn, signUp, signOut, resetPassword, resendVerification,
      isHandler, isCoach, isFounder, isOperations, isBusiness,
      isStudioEligible, isAnyPortalEligible, studioLabel,
      portalMode, setPortalMode,
      profile, profileLoading, userType, updateUserType,
      journeyStage, updateJourneyStage,
      refreshProfile: () => loadProfile(user?.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
