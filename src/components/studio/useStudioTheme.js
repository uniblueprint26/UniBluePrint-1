import { useCallback, useEffect, useState } from 'react'
import { setStudioThemeMode } from './theme'

// Studio Phase 12 -- light/dark toggle for the Studio hubs. Same MECHANISM
// the mobile app's app/src/context/ThemeContext.jsx already uses (a
// persisted preference that can be 'system' | 'light' | 'dark', defaulting
// to the OS/browser's own color-scheme until the person picks one
// explicitly, read back on every load) -- implemented here as a hook
// StudioShell calls directly, rather than a React Context, since every
// Studio hub is already a single standalone page rendered through
// StudioShell and nothing else on the page needs to read the mode
// independently. A future second consumer can still import this same hook.
//
// Persisted under its own key (not the mobile app's 'ubp_theme_preference'
// -- different platform/storage, a shared key would be meaningless) so a
// person's choice survives reloads of the Studio hubs specifically.

const STORAGE_KEY = 'ubp_studio_theme_preference'

function systemPrefersDark() {
  try {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  } catch {
    return false
  }
}

function readStoredPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function useStudioTheme() {
  const [preference, setPreference] = useState(readStoredPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Track OS/browser scheme changes live, same as the mobile app's
  // Appearance.addChangeListener -- only matters while preference is
  // 'system', but harmless to keep listening regardless.
  useEffect(() => {
    let mql
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return undefined
    }
    const handler = e => setSystemDark(e.matches)
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else if (mql.addListener) mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else if (mql.removeListener) mql.removeListener(handler)
    }
  }, [])

  const mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  // Synchronous, every render, BEFORE any descendant of StudioShell renders
  // in this same pass -- see theme.js's getStatusColor() for why this needs
  // to happen here rather than in a useEffect (StatusDot/TaskBoard/
  // RequestPanel read the module-level mode flag directly during render).
  setStudioThemeMode(mode)

  const toggle = useCallback(() => {
    setPreference(prev => {
      const current = prev === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : prev
      const next = current === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* best-effort persistence only */ }
      return next
    })
  }, [])

  return { mode, isDark: mode === 'dark', toggle }
}
