import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// One-way follows, backed by student_follows (follower_id, followed_id,
// created_at). A user can read rows where they are the follower or the
// followed, and insert/delete rows where they are the follower.
//
// Mutual follows are friends, which is what the "Friends only" post audience
// means. If the table cannot be read, everything reads as "not following"
// and the Follow button reverts if the write fails, so nothing crashes.
export function useFollows() {
  const { user } = useAuth()
  const userId = user?.id
  const [following, setFollowing] = useState(() => new Set())
  const [followers, setFollowers] = useState(() => new Set())
  const [pending, setPending] = useState(() => new Set())
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoaded(true); return }
    try {
      const { data, error } = await supabase
        .from('student_follows')
        .select('follower_id, followed_id')
        .or(`follower_id.eq.${userId},followed_id.eq.${userId}`)
      if (error) throw error
      const out = new Set()
      const inn = new Set()
      for (const row of data || []) {
        if (row.follower_id === userId) out.add(row.followed_id)
        if (row.followed_id === userId) inn.add(row.follower_id)
      }
      setFollowing(out)
      setFollowers(inn)
    } catch {
      setFollowing(new Set())
      setFollowers(new Set())
    } finally {
      setLoaded(true)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const isFollowing = useCallback(id => following.has(id), [following])
  const isFriend = useCallback(id => following.has(id) && followers.has(id), [following, followers])

  // Optimistic: flip immediately, undo if the write fails.
  const toggleFollow = useCallback(async id => {
    if (!userId || !id || id === userId || pending.has(id)) return
    const wasFollowing = following.has(id)
    const setTo = on => setFollowing(prev => {
      const next = new Set(prev)
      if (on) next.add(id); else next.delete(id)
      return next
    })
    setPending(prev => new Set(prev).add(id))
    setTo(!wasFollowing)
    try {
      const q = wasFollowing
        ? supabase.from('student_follows').delete().eq('follower_id', userId).eq('followed_id', id)
        : supabase.from('student_follows').insert({ follower_id: userId, followed_id: id })
      const { error } = await q
      if (error) throw error
    } catch {
      setTo(wasFollowing)
    } finally {
      setPending(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }, [userId, following, pending])

  return { following, followers, isFollowing, isFriend, toggleFollow, loaded, reload: load }
}
