import { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { setStatusBarStyle } from 'expo-status-bar'

// App.jsx sets a single global `<StatusBar style="light" />` for the whole
// app, tuned for the navy-header screens that make up most of the app. A
// handful of screens have a cream (or otherwise light) surface right under
// the status bar instead — AdBoard, Blog, Marketplace, Article, Messages,
// Pricing, WeeklyBlueprint, Welcome, VerifyEmail — where light icons on a
// light background are invisible (clock/battery disappear). Those screens
// call this hook to swap to dark icons while they're focused, and it swaps
// back to the app's light default the moment they lose focus (backgrounded,
// navigated away from, or unmounted), so every other screen is unaffected.
export function useLightBackgroundStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark')
      return () => setStatusBarStyle('light')
    }, [])
  )
}
