import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Minimal local-only draft persistence for the Foundation Blueprint intake
// flows (QuestionFlow-based builders can run up to 15 steps deep). Not a
// sync system — just enough to survive an accidental swipe-down or Android
// back: the in-progress answers are written to AsyncStorage under `key`
// (callers key it by builder type + user id, e.g.
// `foundation_draft:cv:${user.id}`), restored into `values` once on mount if
// present, and cleared by calling `clearDraft()` after a successful submit.
//
// `key` may be null/undefined (e.g. while `user` hasn't loaded yet) — the
// hook then does nothing, so nothing is saved under a shared/anonymous key.
export function useDraftAutosave(key, values, setValues) {
  const loadedKeyRef = useRef(null)

  useEffect(() => {
    loadedKeyRef.current = null
    if (!key) return
    let active = true
    AsyncStorage.getItem(key)
      .then(raw => {
        if (!active || !raw) return
        try {
          const draft = JSON.parse(raw)
          if (draft && typeof draft === 'object') {
            setValues(prev => ({ ...prev, ...draft }))
          }
        } catch (e) {
          console.error('[useDraftAutosave] could not parse saved draft', e)
        }
      })
      .catch(e => console.error('[useDraftAutosave] could not read saved draft', e))
      .finally(() => { if (active) loadedKeyRef.current = key })
    return () => { active = false }
    // Only re-run the load when the key itself changes (e.g. user id resolves).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    // Skip the very first save until the load above has actually run for
    // this key — otherwise a freshly-mounted screen would overwrite a real
    // saved draft with its own blank default values before the load wins.
    if (!key || loadedKeyRef.current !== key) return
    AsyncStorage.setItem(key, JSON.stringify(values)).catch(e => {
      console.error('[useDraftAutosave] could not save draft', e)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, values])

  async function clearDraft() {
    if (!key) return
    try {
      await AsyncStorage.removeItem(key)
    } catch (e) {
      console.error('[useDraftAutosave] could not clear draft', e)
    }
  }

  return { clearDraft }
}
