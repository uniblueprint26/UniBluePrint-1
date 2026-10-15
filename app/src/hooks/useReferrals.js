/**
 * useReferrals — the "share with friends" hook.
 *
 * Standalone (reads Supabase directly, like ProfileScreen's own avatar_url
 * and activity_events queries) rather than threaded through AuthContext —
 * this is a narrow, self-contained concern (one column, one count), not a
 * shared concept other screens need, so it doesn't need a place in the
 * central profile cache.
 *
 * Backed by the 20261015120000_referral_tracking migration:
 *   - profiles.referral_code — a short, permanent code generated for every
 *     user at signup.
 *   - referrals — one row per person who signed up using that code.
 * Attribution only. There is no reward for using a code — see that
 * migration's header comment — so this hook never reports or implies one.
 *
 * import { useReferrals } from '../hooks/useReferrals'
 * const { code, shareLink, count, loading } = useReferrals()
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SITE_URL } from '../constants/site'

export function useReferrals() {
  const { user } = useAuth()
  const [code, setCode]       = useState('')
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [profileRes, referralsRes] = await Promise.all([
        supabase.from('profiles').select('referral_code').eq('id', user.id).single(),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
      ])
      if (cancelled) return
      if (profileRes.data?.referral_code) setCode(profileRes.data.referral_code)
      if (typeof referralsRes.count === 'number') setCount(referralsRes.count)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  return {
    code,
    shareLink: code ? `${SITE_URL}/sign-up?ref=${code}` : '',
    count,
    loading,
  }
}
