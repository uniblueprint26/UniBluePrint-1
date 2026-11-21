import { View, StyleSheet } from 'react-native'
import LoadingScreen from './LoadingScreen'
import { useSlowConnection } from '../../hooks/useSlowConnection'

// Drop this inside any screen's root view. While `loading` has lasted longer
// than a few seconds (a slow connection) it covers the screen with the UBP
// loading screen. Quick loads never show it.
export default function SlowLoad({ loading, delayMs = 3500 }) {
  const slow = useSlowConnection(!!loading, delayMs)
  if (!loading || !slow) return null
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto" accessibilityLabel="Loading">
      <LoadingScreen />
    </View>
  )
}
