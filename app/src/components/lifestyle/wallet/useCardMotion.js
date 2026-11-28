import { useEffect, useRef } from 'react'
import { Animated, Platform } from 'react-native'

// Tilt and shake for the open card, from the phone's accelerometer (expo-sensors,
// part of Expo Go). Does nothing on web, and nothing when reduced motion is on.
//   tilt      an Animated.Value from -1 to 1 (left to right) that moves the sheen
//   onTiltFar fires (at most every 4 seconds) when the phone is tilted a long way
//   onShake   fires on a firm shake (at most every 1.5 seconds)
// Tilt and shake are switched off until they have been tested on a real phone.
// Set this to true to bring them back.
const SENSORS_ON = false

export function useCardMotion({ enabled, onTiltFar, onShake }) {
  const tilt = useRef(new Animated.Value(0)).current
  const handlers = useRef({ onTiltFar, onShake })
  handlers.current = { onTiltFar, onShake }

  useEffect(() => {
    if (!SENSORS_ON || !enabled || Platform.OS === 'web') return undefined
    let sub = null
    let alive = true
    let lastFar = 0
    let lastShake = 0
    ;(async () => {
      try {
        const { Accelerometer } = require('expo-sensors')
        if (!(await Accelerometer.isAvailableAsync())) return
        Accelerometer.setUpdateInterval(60)
        if (!alive) return
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const now = Date.now()
          tilt.setValue(Math.max(-1, Math.min(1, x * 1.4)))
          if (Math.abs(x) > 0.62 && now - lastFar > 4000) { lastFar = now; handlers.current.onTiltFar?.() }
          const g = Math.sqrt(x * x + y * y + z * z)
          if (g > 2.3 && now - lastShake > 1500) { lastShake = now; handlers.current.onShake?.() }
        })
      } catch { /* no sensor, no effect */ }
    })()
    return () => { alive = false; try { sub?.remove?.() } catch {} }
  }, [enabled, tilt])

  return { tilt }
}
