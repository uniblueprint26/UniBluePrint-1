import { useEffect, useState } from 'react'
import { Platform, AppState } from 'react-native'

// A small online or offline signal with no native dependency. On the web it
// listens to the browser. On a phone it checks the backend health address
// when the app comes to the front and every 20 seconds while it is thought to
// be offline. Two misses in a row count as offline, so one slow reply does
// not flash a banner.
const HEALTH_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL || ''}/auth/v1/health`

let online = true
let misses = 0
const listeners = new Set()

function set(next) {
  if (next === online) return
  online = next
  listeners.forEach(fn => { try { fn(online) } catch {} })
}

async function ping() {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) return
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = ctl ? setTimeout(() => ctl.abort(), 6000) : null
    await fetch(HEALTH_URL, { method: 'GET', signal: ctl?.signal })
    if (timer) clearTimeout(timer)
    misses = 0
    set(true)
  } catch {
    misses += 1
    if (misses >= 2) set(false)
  }
}

let started = false
function start() {
  if (started) return
  started = true
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return
    online = typeof navigator === 'undefined' ? true : navigator.onLine !== false
    window.addEventListener('online', () => set(true))
    window.addEventListener('offline', () => set(false))
    return
  }
  AppState.addEventListener('change', s => { if (s === 'active') ping() })
  setInterval(() => { if (!online || misses > 0) ping() }, 20000)
  ping()
}

export function useOnline() {
  const [value, setValue] = useState(online)
  useEffect(() => {
    start()
    setValue(online)
    listeners.add(setValue)
    return () => { listeners.delete(setValue) }
  }, [])
  return value
}

// Lets a screen say "my request failed for a network reason" so the banner
// appears sooner than the next check.
export function reportNetworkFailure() { misses += 1; if (misses >= 2) set(false) }
