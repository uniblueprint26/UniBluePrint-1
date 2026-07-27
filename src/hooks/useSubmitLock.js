import { useRef, useCallback } from 'react'

/**
 * Ref-based guard against double submission.
 *
 * `disabled={loading}` alone is not enough: setting state is asynchronous, so
 * between the first click and React re-rendering the disabled button there is a
 * real (if narrow) window where a second click still lands. On these pages that
 * would mean two rows inserted and two paid Claude calls for one intent.
 *
 * A ref updates synchronously, so the second call is rejected in the same tick.
 *
 *   const { runLocked } = useSubmitLock()
 *   const handleSubmit = (e) => runLocked(async () => { ... })
 */
export function useSubmitLock() {
  const locked = useRef(false)

  const runLocked = useCallback(async (fn) => {
    if (locked.current) return
    locked.current = true
    try {
      return await fn()
    } finally {
      locked.current = false
    }
  }, [])

  return { runLocked }
}
