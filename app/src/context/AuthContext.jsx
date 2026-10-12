import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../lib/supabase'
import { DEFAULT_USER_TYPE, isValidUserType } from '../constants/userTypes'
import { MAX_INTERESTS, MAX_CUSTOM_INTEREST_LENGTH } from '../data/interests'
import { SITE_URL } from '../constants/site'
import {
  STATUS_OPTIONS, SOCIAL_LINK_FIELDS, MAX_BIO_LENGTH, MAX_SOCIAL_LINK_LENGTH,
} from '../constants/directory'

const AuthContext = createContext({})

const PORTAL_ROLES = ['handler', 'coach', 'business', 'operations', 'founder', 'finance', 'admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [subscription, setSubscription] = useState(null)
  // Separate from `loading` (session resolution only) — tracks whether the
  // subscriptions-table fetch itself has completed, so Pro-gated UI (see
  // hooks/useProAccess.js) can tell "we don't know yet" from "confirmed
  // free tier" and never flash a paywall at a real Pro user during the one
  // extra round trip this fetch takes after sign-in. Starts true (unknown)
  // and only ever flips to false once a fetch has actually resolved —
  // mirrors the website's rolesLoaded (src/context/AuthContext.jsx).
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [portalMode, setPortalMode] = useState('personal') // 'personal' | 'studio', dual-portal switcher state
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const subChannelRef = useRef(null)

  async function loadRolesAndSubscription(userId) {
    if (!userId) {
      setRoles([])
      setSubscription(null)
      setSubscriptionLoading(false)
      return
    }
    const [{ data: roleRows, error: rolesError }, { data: subRow, error: subError }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    ])
    // On a transient failure, keep whatever was already loaded rather than
    // overwriting good data with null/[] — matches the website's same
    // fail-safe (src/context/AuthContext.jsx) — but subscriptionLoading
    // still clears either way, since useProAccess must fail closed on a
    // genuine query error rather than spin forever.
    if (!rolesError) setRoles((roleRows || []).map(r => r.role))
    if (!subError) setSubscription(subRow || null)
    setSubscriptionLoading(false)
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
      .select(`
        id, full_name, avatar_url, user_type, interests, date_of_birth,
        discoverable, course, year_of_study, institution, statuses, bio, social_links
      `)
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
        setSubscriptionLoading(false)
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
        setSubscriptionLoading(false)
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
    // Without redirectTo, the reset email links to the site root, but the
    // website only handles the recovery flow at /reset-password — a user
    // resetting from the app couldn't finish the reset.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    })
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

  // Writes the shared interest-tag concept (see data/interests.js and
  // hooks/useInterests.js) — a flat array mixing predefined picks and
  // freely-typed custom labels, replaced in full on each write (the
  // dedupe/cap logic lives in useInterests(), this is the raw write).
  // Same immediate-local-update pattern as updateUserType above. Validated
  // here too (not just in the hook) since this is the actual write boundary
  // — trims/caps each label and enforces the combined count cap so a bad
  // array can't reach the database however it got constructed.
  const updateInterests = useCallback(async nextInterests => {
    if (!user?.id) return { error: new Error('Not signed in') }
    if (!Array.isArray(nextInterests)) return { error: new Error('Invalid interests') }
    const cleaned = [...new Set(
      nextInterests
        .map(label => String(label || '').trim().replace(/\s+/g, ' ').slice(0, MAX_CUSTOM_INTEREST_LENGTH))
        .filter(Boolean)
    )]
    if (cleaned.length > MAX_INTERESTS) return { error: new Error(`You can have up to ${MAX_INTERESTS} interests.`) }
    const { error } = await supabase
      .from('profiles')
      .update({ interests: cleaned })
      .eq('id', user.id)
    if (!error) setProfile(prev => ({ ...(prev || { id: user.id }), interests: cleaned }))
    return { error }
  }, [user?.id])

  // Writes the Directory-discovery self-service fields in one call: the
  // public/private toggle (discoverable), the free-text bio, the "what are
  // you open to" statuses (see constants/directory.js' STATUS_OPTIONS —
  // the same concept SignUpScreen.jsx collects at sign-up), and the fixed
  // set of self-reported social links. This is the write boundary the
  // Directory Profile settings modal (ProfileScreen.jsx) uses — validated
  // here, not just in the UI, so a bad payload can't reach the database
  // however it got constructed. Each field is optional in `fields`; only
  // the keys actually passed are validated and written.
  const updateDirectoryProfile = useCallback(async fields => {
    if (!user?.id) return { error: new Error('Not signed in') }
    const updates = {}

    if ('discoverable' in fields) {
      updates.discoverable = !!fields.discoverable
    }
    if ('bio' in fields) {
      updates.bio = String(fields.bio || '').trim().slice(0, MAX_BIO_LENGTH) || null
    }
    if ('statuses' in fields) {
      if (!Array.isArray(fields.statuses)) return { error: new Error('Invalid statuses') }
      const validKeys = new Set(STATUS_OPTIONS.map(s => s.key))
      updates.statuses = [...new Set(fields.statuses.filter(k => validKeys.has(k)))]
    }
    if ('socialLinks' in fields) {
      if (fields.socialLinks !== null && typeof fields.socialLinks !== 'object') {
        return { error: new Error('Invalid social links') }
      }
      const allowedKeys = new Set(SOCIAL_LINK_FIELDS.map(f => f.key))
      const cleaned = {}
      for (const [key, value] of Object.entries(fields.socialLinks || {})) {
        if (!allowedKeys.has(key)) continue
        const trimmed = String(value || '').trim().slice(0, MAX_SOCIAL_LINK_LENGTH)
        if (trimmed) cleaned[key] = trimmed
      }
      updates.social_links = cleaned
    }

    if (Object.keys(updates).length === 0) return { error: null }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (!error) {
      setProfile(prev => ({
        ...(prev || { id: user.id }),
        ...('discoverable' in updates ? { discoverable: updates.discoverable } : {}),
        ...('bio' in updates ? { bio: updates.bio } : {}),
        ...('statuses' in updates ? { statuses: updates.statuses } : {}),
        ...('social_links' in updates ? { social_links: updates.social_links } : {}),
      }))
    }
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
  // Finance now has its own portal/route (FinancePortalScreen, PORTAL_ROLES
  // above includes 'finance') — this flag also still gates the
  // negotiated-rate tooling that's finance/founder-only on the backend
  // (record_negotiated_rate / get_negotiation_history), on the screens
  // Finance reaches (Founder/Operations/Finance). See
  // partner-tiering-framework.md open item #3 on negotiation authority.
  const isFinance = hasRole('finance')
  const isStudioEligible = isHandler || isCoach
  // Any of the six internal-team roles that get a second, professional-side
  // interface in addition to their personal "My Blueprint" experience.
  const isAnyPortalEligible = isHandler || isCoach || isFounder || isOperations || isBusiness || isFinance
  const studioLabel = isHandler ? 'The Blueprint Studio'
    : isCoach ? 'The Elevation Studio'
    : isFounder ? 'Founder Dashboard'
    : isOperations ? 'Operations Dashboard'
    : isBusiness ? 'Partner Portal'
    : isFinance ? 'Finance Dashboard'
    : 'The Studio'
  const portalRole = roles.find(r => PORTAL_ROLES.includes(r)) || null

  // The general user_type concept (Student / Apprentice / Gap Year /
  // Worker) — falls back to the default while the profile is still loading
  // or for a user with no profile row yet, so every consumer always gets a
  // valid key. Prefer the useUserType() hook over reading these directly.
  const userType = (profile?.user_type && isValidUserType(profile.user_type))
    ? profile.user_type
    : DEFAULT_USER_TYPE

  // The shared interest-tag concept — always an array, never null/undefined,
  // so every consumer (useInterests()) can read it directly without a guard.
  // Empty means the person hasn't set any yet.
  const interests = Array.isArray(profile?.interests) ? profile.interests : []

  // Date of birth, collected at sign-up (SignUpScreen) and enforced 16+ at
  // the database level (profiles_date_of_birth_age_gate migration). null
  // for any existing user created before this field existed, or anyone
  // who hasn't supplied one yet — prefer useInvestmentAccess() over reading
  // this directly, so "unknown" always fails closed rather than being
  // treated as any particular age.
  const dateOfBirth = profile?.date_of_birth ?? null

  // Directory-discovery fields — see updateDirectoryProfile() above for the
  // write side. discoverable defaults to true (matches the column's own
  // database default) so a profile row that hasn't loaded yet, or predates
  // this feature, reads as "public" rather than silently hiding someone who
  // never made an explicit choice.
  const discoverable = profile?.discoverable ?? true
  const bio = profile?.bio ?? null
  const statuses = Array.isArray(profile?.statuses) ? profile.statuses : []
  const socialLinks = (profile?.social_links && typeof profile.social_links === 'object') ? profile.social_links : {}

  return (
    <AuthContext.Provider value={{
      user, loading, roles, hasRole, portalRole,
      subscription, subscriptionLoading, isPro, isComplimentaryPro: !!subscription?.is_complimentary,
      signIn, signUp, signOut, resetPassword, resendVerification,
      isHandler, isCoach, isFounder, isOperations, isBusiness, isFinance,
      isStudioEligible, isAnyPortalEligible, studioLabel,
      portalMode, setPortalMode,
      profile, profileLoading, userType, updateUserType,
      interests, updateInterests,
      dateOfBirth,
      discoverable, bio, statuses, socialLinks, updateDirectoryProfile,
      refreshProfile: () => loadProfile(user?.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
