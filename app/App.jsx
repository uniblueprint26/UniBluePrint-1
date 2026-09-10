import { useEffect } from 'react'
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

  const ready = fontsLoaded || fontError

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) {
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
