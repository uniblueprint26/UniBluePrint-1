import { useState, useEffect } from 'react'

/**
 * From 11pm Saturday to 8am Monday (Irish time), Premium service page copy
 * must show Monday delivery instead of same-day, since the Blueprint Team
 * does not process Sunday. Reverts automatically at 8am Monday.
 *
 * Computed against Europe/Dublin, not the visitor's local time, since the
 * copy reflects when the team is actually open, not where the visitor is
 * browsing from. Re-checks every minute so the copy flips live for anyone
 * with the page open across the 11pm/8am boundary.
 */
function isWeekendDeliveryWindow() {
  const now = new Date()
  const dublinParts = new Intl.DateTimeFormat('en-IE', {
    timeZone: 'Europe/Dublin',
    weekday: 'short', hour: 'numeric', hour12: false,
  }).formatToParts(now)

  const weekday = dublinParts.find(p => p.type === 'weekday')?.value
  const hour = parseInt(dublinParts.find(p => p.type === 'hour')?.value ?? '0', 10)

  if (weekday === 'Sat' && hour >= 23) return true
  if (weekday === 'Sun') return true
  if (weekday === 'Mon' && hour < 8) return true
  return false
}

export function useWeekendDeliveryCopy() {
  const [isWeekendWindow, setIsWeekendWindow] = useState(isWeekendDeliveryWindow)

  useEffect(() => {
    const id = setInterval(() => setIsWeekendWindow(isWeekendDeliveryWindow()), 60000)
    return () => clearInterval(id)
  }, [])

  return {
    isWeekendWindow,
    premiumDeliveryLabel: isWeekendWindow
      ? 'Premium, priority delivery. Submitted tonight, delivered by end of day Monday.'
      : 'Premium, priority delivery. Same-day.',
  }
}
