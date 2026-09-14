import { useEffect, useState } from 'react'
import { View, Image } from 'react-native'
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
import { colors } from './src/constants/theme'

// Keep the native splash (a plain image, no custom fonts involved) on
// screen until the brand fonts have actually finished loading — without
// this, Expo auto-hides it as soon as the first JS frame paints, which can
// land before useFonts() below resolves. That gap used to be covered by a
// live <UBPLogo> here, but UBPLogo hardcodes fontFamily: 'DMSerifDisplay...'
// unconditionally, and text set to a fontFamily that hasn't registered yet
// renders in the platform's fallback font — a real, if brief, flash of the
// wrong typeface right at cold start. Rendering the exported splash PNG
// instead (same navy background, same lockup, baked into pixels) closes
// that gap completely: there is no code path left where the wordmark can
// paint before its font is ready.
SplashScreen.preventAutoHideAsync().catch(() => {})

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

  // `useFonts` resolving `true` means the JS promise for font registration
  // has settled — on a genuine cold start (nothing cached yet), that can
  // land a frame or two before the native text renderer actually has the
  // face available for the very first paint, which is the well-known
  // "flashes fallback font on cold load, fine on reload" pattern: a reload
  // benefits from the OS having already resolved/cached the font faces, so
  // the same race doesn't reopen. Rendering already waits for `fontsReady`
  // before mounting any real UI (see below), so this isn't a missing gate —
  // it's tightening the gate itself: two requestAnimationFrame ticks after
  // `fontsReady` flips give native the extra time it needs to finish
  // registering the faces before `appReady` (and therefore the first real
  // paint) flips, at the cost of two frames of the same splash image that
  // was already showing.
  const [appReady, setAppReady] = useState(false)
  useEffect(() => {
    if (!fontsReady) return
    let raf2
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAppReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [fontsReady])

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {})
  }, [appReady])

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.navy }}>
        <Image
          source={require('./assets/splash.png')}
          style={{ width: 240, height: 149 }}
          resizeMode="contain"
        />
      </View>
    )
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
