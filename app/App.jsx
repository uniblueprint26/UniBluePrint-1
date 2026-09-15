import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { DMSerifDisplay_400Regular, DMSerifDisplay_400Regular_Italic } from '@expo-google-fonts/dm-serif-display'
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { useFonts } from 'expo-font'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation'
import { linking } from './src/navigation/linking'
import LoadingScreen from './src/components/ui/LoadingScreen'
import { colors } from './src/constants/theme'

// Keep the native splash (a plain image, no custom fonts involved) on
// screen until the brand fonts have actually finished loading — without
// this, Expo auto-hides it as soon as the first JS frame paints, which can
// land before useFonts() below resolves. That gap used to be covered by a
// live <UBPLogo> here, but UBPLogo hardcodes fontFamily: 'DMSerifDisplay...'
// unconditionally, and text set to a fontFamily that hasn't registered yet
// renders in the platform's fallback font — a real, if brief, flash of the
// wrong typeface. LoadingScreen (image + gradient only, no Text) closes
// that gap: there is no code path left where the wordmark can paint before
// its font is ready.
SplashScreen.preventAutoHideAsync().catch(() => {})

// ── Web font-readiness: the *actual* root cause of the "still happening on
// every load" flash ──────────────────────────────────────────────────────
//
// `useFonts()` resolving `true` was assumed to mean every requested face is
// genuinely paintable, and the previous fix (two rAF ticks below) only
// hardened against a native cold-start registration lag on that
// assumption. That assumption is false on web. expo-font's browser loader
// (node_modules/expo-font/build/ExpoFontLoader.web.js) injects the
// @font-face rule, then tries to *confirm* the face has actually finished
// downloading/rasterizing with the `fontfaceobserver` polyfill — but only
// after checking `isFontLoadingListenerSupported()`, which is hardcoded to
// return `false` for Safari, iOS and Edge ("WebKit is broken", per that
// file's own comment). On every one of those browsers `loadAsync()` skips
// the observer entirely and returns an already-resolved `Promise.resolve()`
// — so `fontsLoaded` flips `true` the instant the stylesheet is injected,
// not once the font is actually ready to paint. That gap exists on *every*
// load (it isn't a caching thing, so reloading doesn't fix it), which
// matches the reported symptom exactly, and it's untouched by the rAF
// hardening below, which only ever waits on `fontsLoaded` itself.
//
// `document.fonts.ready` is the browser's own primitive for "every
// requested face has settled (loaded or failed)" — unlike the vendored
// polyfill it isn't disabled per-browser, so gating on it (web only) closes
// the real gap. `document.fonts.load(...)` is also called explicitly per
// face first: `ready` only reflects faces the page has actually requested
// a load for, and relying solely on the CSS rule being present doesn't
// guarantee a fetch was ever kicked off before `ready` resolves trivially.
const WEB_FONT_SPECS = [
  '400 16px DMSerifDisplay_400Regular',
  'italic 400 16px DMSerifDisplay_400Regular_Italic',
  '400 16px DMSans_400Regular',
  '500 16px DMSans_500Medium',
  '600 16px DMSans_600SemiBold',
  '700 16px DMSans_700Bold',
]

function useWebFontsSettled(active) {
  const [settled, setSettled] = useState(Platform.OS !== 'web')
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || settled) return
    let cancelled = false
    const fontsApi = typeof document !== 'undefined' ? document.fonts : null
    if (!fontsApi?.ready) { setSettled(true); return }
    Promise.all([...WEB_FONT_SPECS.map(spec => fontsApi.load(spec).catch(() => {})), fontsApi.ready])
      .catch(() => {})
      .finally(() => { if (!cancelled) setSettled(true) })
    // Safety net — never block app open forever if a browser's Font Loading
    // API misbehaves; worst case we're back to the old (racy) behaviour.
    const timeout = setTimeout(() => { if (!cancelled) setSettled(true) }, 3000)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [active, settled])
  return settled
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  })

  const fontsReady = fontsLoaded || fontError
  const webFontsSettled = useWebFontsSettled(fontsReady)

  // On native, `fontsReady` is the reliable native-module signal (it only
  // resolves once the face is genuinely registered with the OS), so two rAF
  // ticks after it flips is still a reasonable, cheap safety margin for the
  // very first native paint. On web, `webFontsSettled` is now the gate that
  // actually matters (see above) — `fontsReady` alone is not trustworthy
  // there on Safari/iOS/Edge.
  const [appReady, setAppReady] = useState(false)
  useEffect(() => {
    if (!fontsReady || !webFontsSettled) return
    let raf2
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAppReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [fontsReady, webFontsSettled])

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {})
  }, [appReady])

  if (!appReady) {
    return <LoadingScreen />
  }

  return (
    // Required root for react-native-gesture-handler's Gesture API (used by
    // Quick Access's drag-to-reorder grid) — without it, gesture recognition
    // isn't reliably attached to the view tree, especially on Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={colors.navy} />
          <NavigationContainer linking={linking} fallback={null}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
