import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getColors, fonts } from '../constants/theme'

// ── Dark mode (#82) ─────────────────────────────────────────────────────────
//
// The product decision: default to the device's system light/dark setting,
// with a manual "System / Light / Dark" override the person can set in
// Settings (ProfileScreen's Appearance row). This context is the single
// place that resolves those two things into one `mode` ('light' | 'dark')
// every screen renders from.
//
//   import { useTheme } from '../context/ThemeContext'
//   const { colors, mode, isDark, preference, setPreference } = useTheme()
//
// `preference` is the raw three-way setting ('system' | 'light' | 'dark'),
// persisted to AsyncStorage so it survives app restarts — same storage
// mechanism the rest of the app already uses for user prefs (see
// BlueprintTourScreen's TOUR_SEEN_KEY_PREFIX, lib/supabase.js's session
// storage). `mode` is always a concrete 'light' | 'dark': when preference is
// 'system' it tracks Appearance.getColorScheme() live via
// Appearance.addChangeListener, re-rendering every consumer the instant the
// OS setting changes (no app restart needed) — same as any other context
// value change. `colors` is the resolved token object for that mode (see
// constants/theme.js's lightColors/darkColors) — screens read colors.* from
// here instead of importing the static `colors` export once they're
// migrated; unmigrated screens are unaffected (they keep importing the
// static light-only `colors` export and simply don't respond to this yet).

const THEME_PREFERENCE_KEY = 'ubp_theme_preference'
const VALID_PREFERENCES = ['system', 'light', 'dark']

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  preference: 'system',
  colors: getColors('light'),
  fonts,
  setPreference: () => {},
  ready: false,
})

export function ThemeProvider({ children }) {
  // Starts from whatever the OS reports synchronously (Appearance.
  // getColorScheme() is available immediately, unlike the AsyncStorage
  // read below) so the very first paint already matches the system
  // instead of flashing light-then-dark once storage resolves.
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || 'light')
  const [preference, setPreferenceState] = useState('system')
  const [ready, setReady] = useState(false)

  // Load the persisted manual override, if any, once on mount.
  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then(stored => {
        if (cancelled) return
        if (stored && VALID_PREFERENCES.includes(stored)) setPreferenceState(stored)
      })
      .catch(() => { /* fall back to 'system' — matches the default state */ })
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  // Track OS appearance changes live so a "System" preference updates the
  // whole app immediately if the person flips their device's setting (or
  // their OS auto-switches at sunset) while the app is open.
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light')
    })
    return () => {
      // RN >=0.65 returns a subscription object with .remove(); older/alt
      // runtimes returned nothing and expected Appearance.removeChangeListener.
      // Guard both so this doesn't throw depending on the RN version in use.
      if (subscription && typeof subscription.remove === 'function') subscription.remove()
      else if (typeof Appearance.removeChangeListener === 'function') {
        Appearance.removeChangeListener('change', setSystemScheme)
      }
    }
  }, [])

  const setPreference = useCallback(nextPreference => {
    if (!VALID_PREFERENCES.includes(nextPreference)) return
    setPreferenceState(nextPreference)
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference).catch(() => {
      // Best-effort persistence — the in-memory state above still applies
      // for the rest of this app session even if the write fails.
    })
  }, [])

  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference
  const isDark = mode === 'dark'

  const value = useMemo(() => ({
    mode,
    isDark,
    preference,
    colors: getColors(mode),
    fonts,
    setPreference,
    ready,
  }), [mode, isDark, preference, setPreference, ready])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
