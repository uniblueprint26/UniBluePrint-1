import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// The member's own notification choices (public.notification_preferences,
// see supabase/migrations/20261120700000_pillar_notifications.sql).
// No row means the defaults below. Budget nudges are opt in.

export const DEFAULT_PREFS = {
  pillar_alerts: true,
  interest_alerts: true,
  trending_alerts: true,
  following_alerts: true,
  budget_nudges: false,
  quiet_enabled: true,
  quiet_start: 22,
  quiet_end: 8,
  night_out_days: [4, 5, 6],
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatHour(h) {
  const hour = ((Number(h) % 24) + 24) % 24
  const suffix = hour >= 12 ? 'pm' : 'am'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}${suffix}`
}

export function useNotificationPrefs(userId) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!userId) { setLoaded(true); return }
    let cancelled = false
    supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setFailed(true)
        else if (data) setPrefs({ ...DEFAULT_PREFS, ...data })
        setLoaded(true)
      })
      .catch(() => { if (!cancelled) { setFailed(true); setLoaded(true) } })
    return () => { cancelled = true }
  }, [userId])

  // Saves one change at once. Returns true when it was saved.
  const save = useCallback(async patch => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    if (!userId) return false
    const row = {
      user_id: userId,
      pillar_alerts: next.pillar_alerts, interest_alerts: next.interest_alerts,
      trending_alerts: next.trending_alerts, following_alerts: next.following_alerts,
      budget_nudges: next.budget_nudges, quiet_enabled: next.quiet_enabled,
      quiet_start: next.quiet_start, quiet_end: next.quiet_end,
      night_out_days: next.night_out_days, updated_at: new Date().toISOString(),
    }
    try {
      const { error } = await supabase.from('notification_preferences').upsert(row, { onConflict: 'user_id' })
      if (error) throw error
      setFailed(false)
      return true
    } catch {
      setFailed(true)
      return false
    }
  }, [prefs, userId])

  return { prefs, save, loaded, failed }
}
