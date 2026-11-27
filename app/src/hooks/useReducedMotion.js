import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

// True when the person has asked their device for less motion. Cards, tilt,
// shake, confetti and flips fall back to simple fades when this is true.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    let alive = true
    try {
      AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduced(!!v) }).catch(() => {})
      const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => { if (alive) setReduced(!!v) })
      return () => { alive = false; sub?.remove?.() }
    } catch {
      return () => { alive = false }
    }
  }, [])
  return reduced
}
