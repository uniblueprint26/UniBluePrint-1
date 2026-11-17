import { useEffect, useMemo, useState } from 'react'

// A Live window is open for 2 minutes after UBP sends a `live_open`
// notification. This hook drives everything off a simple local clock:
// it finds the newest live_open notification, counts down from its
// created_at, and reports { open, secondsLeft }. When nothing is open it
// does not tick at all.
//
//   const { open, secondsLeft } = useLiveWindow(notifications)
//
// `notifications` is the list the Notifications screen already holds
// (rows with `category` and `created_at`). Pass `{ openedAt }` as the
// second argument to force a window (a Date or ms timestamp), which is how
// the popup is tested before the Live feature lands.
export const LIVE_WINDOW_SECONDS = 120
export const LIVE_NOTIFICATION_TYPE = 'live_open'

function secondsLeftFrom(openedAtMs, durationSeconds, nowMs) {
  if (!openedAtMs || Number.isNaN(openedAtMs)) return 0
  const left = Math.ceil(durationSeconds - (nowMs - openedAtMs) / 1000)
  return Math.max(0, Math.min(durationSeconds, left))
}

export function useLiveWindow(notifications = [], { openedAt, durationSeconds = LIVE_WINDOW_SECONDS } = {}) {
  const openedAtMs = useMemo(() => {
    if (openedAt != null) return new Date(openedAt).getTime()
    let newest = 0
    for (const n of notifications || []) {
      if (n?.category !== LIVE_NOTIFICATION_TYPE) continue
      const t = new Date(n.created_at).getTime()
      if (t > newest) newest = t
    }
    return newest
  }, [notifications, openedAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    if (!openedAtMs || secondsLeftFrom(openedAtMs, durationSeconds, Date.now()) <= 0) return undefined
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (secondsLeftFrom(openedAtMs, durationSeconds, t) <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [openedAtMs, durationSeconds])

  const secondsLeft = secondsLeftFrom(openedAtMs, durationSeconds, now)
  return { open: secondsLeft > 0, secondsLeft, totalSeconds: durationSeconds }
}

export function formatClock(seconds) {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// Opens the Live capture screen if the app has registered one. Walks up the
// navigators looking for a 'LiveCapture' route; returns false when there is
// none (the Live feature has not landed), so the caller can show a
// "coming soon" sheet instead.
export function tryOpenLive(navigation) {
  let nav = navigation
  while (nav) {
    try {
      const names = nav.getState?.()?.routeNames
      if (names?.includes('LiveCapture')) { nav.navigate('LiveCapture'); return true }
    } catch { /* keep walking */ }
    nav = nav.getParent?.()
  }
  return false
}
