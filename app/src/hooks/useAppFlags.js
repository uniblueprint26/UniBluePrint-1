import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { IS_NATIVE } from '../constants/platformPolicy'

// Remote switches, read from the public.app_flags table (key text, value jsonb).
// They let the founder turn a feature on without a new store release.
//
// Every flag FAILS CLOSED: its value is the default below until the table has
// answered with the literal boolean true. A missing table, a network error or
// any other value keeps the feature off.

// Foundation orders do not open on iOS and Android until January. This is the
// default, and it stays false until the app_flags row `foundation_enabled` says
// otherwise. Web keeps showing Foundation as it does today (see
// useFoundationEnabled).
export const FOUNDATION_ENABLED = false

const FLAG_DEFAULTS = {
  foundation_enabled: FOUNDATION_ENABLED,
}

const TTL_MS = 10 * 60 * 1000        // a good answer is reused for 10 minutes
const RETRY_AFTER_FAIL_MS = 60 * 1000 // after a failure, try again in a minute

// status: 'idle' | 'ready'. `values` only ever holds flags the table actually
// returned.
let cache = { status: 'idle', values: {}, expiresAt: 0 }
let inflight = null
const listeners = new Set()

function publish(next) {
  cache = next
  listeners.forEach(fn => { try { fn() } catch {} })
}

// Loads the flags (once, then every 10 minutes at most). Never throws.
export function refreshAppFlags({ force = false } = {}) {
  if (!force && cache.status === 'ready' && Date.now() < cache.expiresAt) return Promise.resolve(cache.values)
  if (inflight) return inflight
  inflight = (async () => {
    const values = {}
    let ok = false
    try {
      const { data, error } = await supabase.from('app_flags').select('key, value')
      if (!error && Array.isArray(data)) {
        ok = true
        data.forEach(row => { if (row && typeof row.key === 'string') values[row.key] = row.value })
      }
    } catch { /* fail closed */ }
    publish({ status: 'ready', values, expiresAt: Date.now() + (ok ? TTL_MS : RETRY_AFTER_FAIL_MS) })
    return values
  })().finally(() => { inflight = null })
  return inflight
}

// Current value of a flag, right now, from the cache. For code that is not a
// React component (notification routing, link handling).
export function getAppFlag(key) {
  const fallback = FLAG_DEFAULTS[key] === true
  const v = cache.values[key]
  return typeof v === 'boolean' ? v : fallback
}

// { value, loading } for one flag. `loading` is true until the first answer
// (or failure) has come back. `value` is the fail-closed default meanwhile.
export function useAppFlag(key) {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force(n => n + 1)
    listeners.add(fn)
    refreshAppFlags()
    return () => { listeners.delete(fn) }
  }, [])
  return { value: getAppFlag(key), loading: cache.status !== 'ready' }
}

// Is Foundation open to this person? Always true on web (unchanged). On iOS
// and Android it is true only when app_flags.foundation_enabled is true.
// `enabled` is false while loading, so nothing flashes on screen first.
export function useFoundationEnabled() {
  const { value, loading } = useAppFlag('foundation_enabled')
  if (!IS_NATIVE) return { enabled: true, loading: false }
  return { enabled: value, loading }
}

// Same answer without React, from whatever the cache holds right now.
export function isFoundationEnabledNow() {
  return IS_NATIVE ? getAppFlag('foundation_enabled') : true
}
