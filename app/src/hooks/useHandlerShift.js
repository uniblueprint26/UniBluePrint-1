/**
 * useHandlerShift — the single source of truth for a Handler's clock-in
 * status, backed by public.handler_shifts (20260810120100_portals_operations_schema).
 *
 * "Clocked in" / "Online" is not a flag anywhere — it is derived: a Handler
 * is clocked in exactly when they have a handler_shifts row with
 * checked_in_at set and clocked_out_at still null. Both StudioQueueScreen's
 * "Online" chip and AvailabilityScreen's "Clock In/Out" control read this
 * same hook against this same table, so they cannot drift out of sync with
 * each other — there is only one real row to disagree about, and both
 * screens refetch it on focus (see useFocusEffect in each screen).
 *
 * import { useHandlerShift } from '../../hooks/useHandlerShift'
 * const { loading, loadError, shift, clockedIn, busy, clockIn, clockOut, reload } =
 *   useHandlerShift(user?.id)
 *
 * Return shape:
 *   shift      — the open handler_shifts row, or null if not clocked in.
 *   clockedIn  — boolean convenience for !!shift.
 *   busy       — true while clockIn()/clockOut() is in flight (disable buttons).
 *   clockIn()  — async, opens a new shift (scheduled_start = checked_in_at = now).
 *                Resolves { error } (null on success), never throws.
 *   clockOut() — async, closes the open shift (clocked_out_at = now).
 *                Resolves { error }, never throws.
 *   reload()   — re-fetch the current shift from Supabase (call on focus).
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHandlerShift(userId) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [shift, setShift] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!userId) {
      setShift(null)
      setLoading(false)
      return
    }
    setLoadError(false)
    try {
      const { data, error } = await supabase
        .from('handler_shifts')
        .select('id, handler_id, scheduled_start, checked_in_at, clocked_out_at')
        .eq('handler_id', userId)
        .is('clocked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      setShift(data || null)
    } catch {
      setLoadError(true)
      setShift(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const clockIn = useCallback(async () => {
    if (!userId) return { error: new Error('Not signed in') }
    if (busy) return { error: null }
    setBusy(true)
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('handler_shifts')
        .insert({ handler_id: userId, scheduled_start: now, checked_in_at: now })
        .select('id, handler_id, scheduled_start, checked_in_at, clocked_out_at')
        .single()
      if (error) return { error }
      setShift(data)
      return { error: null }
    } finally {
      setBusy(false)
    }
  }, [userId, busy])

  const clockOut = useCallback(async () => {
    if (!shift?.id) return { error: new Error('No active shift to clock out of') }
    if (busy) return { error: null }
    setBusy(true)
    try {
      const { error } = await supabase
        .from('handler_shifts')
        .update({ clocked_out_at: new Date().toISOString() })
        .eq('id', shift.id)
      if (error) return { error }
      setShift(null)
      return { error: null }
    } finally {
      setBusy(false)
    }
  }, [shift, busy])

  return { loading, loadError, shift, clockedIn: !!shift, busy, clockIn, clockOut, reload: load }
}
