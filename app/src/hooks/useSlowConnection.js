import { useEffect, useState } from 'react'

// True once `active` (usually "this screen is still loading") has stayed true
// for longer than `delayMs`. A screen shows the UBP loading screen only when
// the connection is slow, so quick loads never flash a full screen.
export function useSlowConnection(active, delayMs = 3500) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!active) { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), delayMs)
    return () => clearTimeout(t)
  }, [active, delayMs])
  return slow
}
