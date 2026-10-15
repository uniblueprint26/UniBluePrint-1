/**
 * usePartnerFollow — "Follow this partner" toggle backing the Lifestyle
 * Blueprint deal-following feature (founder decision, Oct 2026 — see
 * supabase/migrations/20261015140000_partner_follows.sql and
 * 20261015140500_partner_follow_notifications.sql).
 *
 * public.partner_follows is keyed by partners(id) (a real uuid), not the
 * partner_slug string the static PARTNERS listing in
 * data/lifestylePartners.js uses as its own `id` field — same slug->uuid
 * resolution PartnerCards.jsx's useVerifiedPartner()/fetchVerifiedPartnerSlugs()
 * and lib/partnerEvents.js's resolvePartnerId() already do for the same
 * reason, duplicated here rather than shared since each caller needs a
 * slightly different shape (a map vs. a single id) and the table it's
 * actually resolving against (`partners`) is tiny and rarely refetched.
 *
 * Once followed, `partner_follow_notifications`'s trigger notifies this
 * user the next time that partner's deal changes (a real `deals` insert
 * with auto_created = false) — this hook only owns the follow/unfollow
 * state, never the notification itself.
 *
 * Returns { following, loading, toggle }:
 *   - following: true once this user's own partner_follows row exists
 *   - loading: true while the initial follow-state check is in flight
 *   - toggle(): inserts/deletes this user's own row; optimistic, rolls
 *     back on failure
 *
 * `enabled` (default true) matches usePartnerContact's own pattern — defer
 * the fetch until a sheet showing this partner is actually open.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const partnerIdCache = new Map()

async function resolvePartnerId(partnerSlug) {
  if (partnerIdCache.has(partnerSlug)) return partnerIdCache.get(partnerSlug)
  const { data } = await supabase
    .from('partners')
    .select('id')
    .eq('partner_slug', partnerSlug)
    .maybeSingle()
  if (data?.id) partnerIdCache.set(partnerSlug, data.id)
  return data?.id || null
}

export function usePartnerFollow(partnerSlug, { enabled = true } = {}) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const partnerIdRef = useRef(null)

  useEffect(() => {
    if (!enabled || !partnerSlug || !user?.id) {
      setFollowing(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    resolvePartnerId(partnerSlug).then(async partnerId => {
      if (cancelled) return
      partnerIdRef.current = partnerId
      if (!partnerId) {
        setFollowing(false)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('partner_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('partner_id', partnerId)
        .maybeSingle()
      if (!cancelled) {
        setFollowing(!!data)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [partnerSlug, enabled, user?.id])

  const toggle = useCallback(async () => {
    if (!user?.id || !partnerSlug) return
    const partnerId = partnerIdRef.current || await resolvePartnerId(partnerSlug)
    partnerIdRef.current = partnerId
    if (!partnerId) return

    const wasFollowing = following
    setFollowing(!wasFollowing) // optimistic

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('partner_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('partner_id', partnerId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('partner_follows')
          .insert({ user_id: user.id, partner_id: partnerId })
        if (error) throw error
      }
    } catch {
      setFollowing(wasFollowing) // roll back on failure
    }
  }, [user?.id, partnerSlug, following])

  return { following, loading, toggle }
}
