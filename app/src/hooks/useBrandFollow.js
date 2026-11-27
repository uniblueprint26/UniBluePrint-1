import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useAppFlag } from './useAppFlags'

// Follow a partner or a coach (public.partner_coach_follows, see
// supabase/migrations/20261127100000_partner_coach_follows.sql).
// The Follow button only shows while the remote flag `partner_follow_enabled` is on
// (default off). Behaviour is optimistic: the button flips at once and rolls back
// if the save fails.
//   enabled     the flag is on and this person is signed in
//   following   this person follows the target
//   count       total followers, or null (the database only gives out totals)
//   toggle()    follow or unfollow
export function useBrandFollow(targetType, targetId) {
  const { user } = useAuth()
  const flag = useAppFlag('partner_follow_enabled').value
  const enabled = !!flag && !!targetId
  const [following, setFollowing] = useState(false)
  const [count, setCount] = useState(null)
  const busy = useRef(false)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    ;(async () => {
      try {
        if (user?.id) {
          const { data } = await supabase.from('partner_coach_follows').select('target_id')
            .eq('user_id', user.id).eq('target_type', targetType).eq('target_id', String(targetId)).maybeSingle()
          if (!cancelled) setFollowing(!!data)
        }
        const { data: total } = await supabase.rpc('get_follow_count', { _target_type: targetType, _target_id: String(targetId) })
        if (!cancelled && typeof total === 'number') setCount(total)
      } catch { /* leave defaults */ }
    })()
    return () => { cancelled = true }
  }, [enabled, user?.id, targetType, targetId])

  const toggle = useCallback(async () => {
    if (!user?.id || busy.current) return
    busy.current = true
    const next = !following
    setFollowing(next)
    setCount(c => (c == null ? c : Math.max(0, c + (next ? 1 : -1))))
    try {
      const q = supabase.from('partner_coach_follows')
      const { error } = next
        ? await q.insert({ user_id: user.id, target_type: targetType, target_id: String(targetId) })
        : await q.delete().eq('user_id', user.id).eq('target_type', targetType).eq('target_id', String(targetId))
      if (error) throw error
    } catch {
      setFollowing(!next)
      setCount(c => (c == null ? c : Math.max(0, c + (next ? -1 : 1))))
    } finally {
      busy.current = false
    }
  }, [user?.id, following, targetType, targetId])

  return { enabled, following, count, toggle, signedIn: !!user?.id }
}
