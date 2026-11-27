import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { IS_NATIVE } from '../constants/platformPolicy'

// Remote switches, read from the public.app_flags table (key text, value jsonb).
// They let the founder change a feature without a new store release.
//
// Every flag FAILS TO ITS SAFE DEFAULT (the value in FLAG_DEFAULTS below). The
// default is used until the table has answered, and again if the table is
// missing, the network is down or the stored value is the wrong type. A good
// answer is cached for 10 minutes and a failed one is retried after a minute.
//
//   foundation_visible           true   Foundation shows everywhere in the app.
//   foundation_ordering_enabled  false  Foundation orders are open on the WEB build.
//                                       The iOS and Android apps never order, so they
//                                       ignore it (see useFoundationOrdering). While it
//                                       is false the web shows "Ordering opens in January"
//                                       and every builder saves answers to the Blueprint.
//   coming_soon_tiles            false  Coming soon tiles, sheets and labels
//                                       are hidden while this is false.
//   partner_follow_enabled       false  The Follow button on partner and coach profiles
//                                       shows. Turn on once the partner_coach_follows
//                                       migration has been applied.
//   priority_enabled             false  Priority events tiles and screens show. Turn on
//                                       when the Priority tables, checkout function and
//                                       Stripe Connect account are live.
//   awards_voting_opens          iso    UBP Awards voting opens (ISO timestamp). Missing means closed.
//   awards_voting_closes         iso    UBP Awards voting closes (ISO timestamp). Missing means closed.
//   awards_results_visible       false  Results are for founder and operations only until true.
//   pro_free_until               date   Every signed in account counts as Pro
//                                       up to the end of this day (YYYY-MM-DD).

export const PRO_FREE_UNTIL_DEFAULT = '2027-01-31'

const FLAG_DEFAULTS = {
  foundation_visible: true,
  foundation_ordering_enabled: false,
  coming_soon_tiles: false,
  partner_follow_enabled: false,
  priority_enabled: false,
  awards_results_visible: false,
  pro_free_until: PRO_FREE_UNTIL_DEFAULT,
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
      // Give up after 5 seconds so a slow connection never leaves a gate spinning. The safe defaults apply.
      const { data, error } = await Promise.race([
        supabase.from('app_flags').select('key, value'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
      if (!error && Array.isArray(data)) {
        ok = true
        data.forEach(row => { if (row && typeof row.key === 'string') values[row.key] = row.value })
      }
    } catch { /* fall back to the defaults */ }
    publish({ status: 'ready', values, expiresAt: Date.now() + (ok ? TTL_MS : RETRY_AFTER_FAIL_MS) })
    return values
  })().finally(() => { inflight = null })
  return inflight
}

// Current value of a yes or no flag, right now, from the cache. For code that
// is not a React component (notification routing, link handling). Only a real
// boolean from the table overrides the default.
export function getAppFlag(key) {
  const fallback = FLAG_DEFAULTS[key] === true
  const v = cache.values[key]
  return typeof v === 'boolean' ? v : fallback
}

// { value, loading } for one flag. `loading` is true until the first answer
// (or failure) has come back. `value` is the safe default meanwhile.
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

// Is Foundation visible to this person? Defaults to true. On iOS and Android
// the row `foundation_visible` can switch it off remotely. Web always shows it.
// `loading` is always false: the default is "visible", so nothing needs to wait.
// Are Priority events switched on? False until the founder turns the flag on.
export function usePriorityEnabled() {
  return useAppFlag('priority_enabled').value
}

export function useFoundationEnabled() {
  const { value } = useAppFlag('foundation_visible')
  if (!IS_NATIVE) return { enabled: true, loading: false }
  return { enabled: value, loading: false }
}

// Same answer without React, from whatever the cache holds right now.
export function isFoundationEnabledNow() {
  return IS_NATIVE ? getAppFlag('foundation_visible') : true
}

// Can Foundation be ordered yet? Defaults to false until the table says true.
//
// iOS and Android NEVER order and never show an order or purchase action, a
// price or a website link for Foundation, whatever this flag says. The app takes
// no payment. On native the flag only matters to the website. So:
//   enabled   true only on the web build and only when the flag is true.
//   saveMode  true whenever the app does not order (always on native, and on
//             web while the flag is false). In save mode every builder ends by
//             saving the answers to the member's Blueprint.
//   teaser    "Ordering opens in January", for the web build only while the
//             flag is false. Always null on iOS and Android.
export const FOUNDATION_ORDERING_LINE = 'Ordering opens in January'

export function useFoundationOrdering() {
  const { value, loading } = useAppFlag('foundation_ordering_enabled')
  const enabled = !IS_NATIVE && value
  return { enabled, loading, saveMode: !enabled, teaser: !IS_NATIVE && !value ? FOUNDATION_ORDERING_LINE : null }
}

export function isFoundationOrderingEnabledNow() {
  return !IS_NATIVE && getAppFlag('foundation_ordering_enabled')
}

// Pro is free for every signed in account until this day (inclusive, UTC).
function parseDay(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const t = Date.parse(`${v}T23:59:59.999Z`)
  return Number.isNaN(t) ? null : { day: v, endsAt: t }
}

export function getProFreeUntilNow() {
  return parseDay(cache.values.pro_free_until) || parseDay(FLAG_DEFAULTS.pro_free_until)
}

export function isProFreeNow() {
  const u = getProFreeUntilNow()
  return !!u && Date.now() <= u.endsAt
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// { active, until, label, labelShort } for the free Pro period. `label` reads
// "31 January 2027". Re-renders when the flag arrives.
export function useProFree() {
  useAppFlag('pro_free_until')
  const u = getProFreeUntilNow()
  const [y, m, d] = u.day.split('-').map(Number)
  return {
    active: Date.now() <= u.endsAt,
    until: u.day,
    label: `${d} ${MONTHS[m - 1]} ${y}`,
    labelShort: `${d} ${MONTHS[m - 1]}`,
  }
}

// UBP Awards voting window, read from two ISO timestamp flags. Either one
// missing or not a valid date gives null, and the screen treats that as closed
// (the database function makes the same choice). Re-renders when the flags arrive.
function parseIso(v) {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function useAwardsWindow() {
  useAppFlag('awards_results_visible')
  return {
    opens: parseIso(cache.values.awards_voting_opens),
    closes: parseIso(cache.values.awards_voting_closes),
    loading: cache.status !== 'ready',
  }
}
