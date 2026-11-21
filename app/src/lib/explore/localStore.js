import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'

// Small on-phone store for the Explore tools (calculators, exam slots, goals).
// Everything is kept per member on this phone only. Nothing is sent anywhere.
//   const [items, setItems, loaded] = useLocalList('exams')
// setItems takes a new array or a function from the old array to a new one.
export function useLocalList(name, initial = []) {
  const { user } = useAuth()
  const key = `ubp_explore_${name}_v1_${user?.id || 'local'}`
  const [items, setState] = useState(initial)
  const [loaded, setLoaded] = useState(false)
  const latest = useRef(initial)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    AsyncStorage.getItem(key)
      .then(raw => {
        if (cancelled) return
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) { latest.current = parsed; setState(parsed) }
          } catch { /* keep default */ }
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [key])

  const setItems = useCallback(next => {
    const value = typeof next === 'function' ? next(latest.current) : next
    latest.current = value
    setState(value)
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {})
  }, [key])

  return [items, setItems, loaded]
}

export function newId(prefix = 'x') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
