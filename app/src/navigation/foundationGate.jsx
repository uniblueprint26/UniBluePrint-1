import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useFoundationEnabled } from '../hooks/useAppFlags'

// Foundation is closed in the iOS and Android apps until the app_flags row
// `foundation_enabled` is switched on (see hooks/useAppFlags.js). Every
// Foundation screen is wrapped with this, so a deep link, a notification tap
// or an old shortcut can never land on one. When the flag is off the person is
// sent to Home, which always exists. Nothing is shown in between, and there is
// no "coming soon" screen.
//
// Web is unchanged: useFoundationEnabled() is always true there.
export function foundationGated(Screen) {
  function FoundationGated(props) {
    const { enabled, loading } = useFoundationEnabled()
    const { navigation } = props
    const blocked = !enabled && !loading

    useEffect(() => {
      if (!blocked) return
      // A short wait: on a cold deep link this runs while the navigator is still
      // setting up its first state, and a reset sent that early is dropped.
      const timer = setTimeout(() => {
        try {
          navigation.reset({ index: 0, routes: [{ name: 'HomeMain' }] })
        } catch {
          try { navigation.goBack() } catch {}
        }
      }, 120)
      return () => clearTimeout(timer)
    }, [blocked, navigation])

    if (loading) return <GateWait />
    if (blocked) return <GateWait />
    return <Screen {...props} />
  }
  FoundationGated.displayName = `FoundationGated(${Screen.displayName || Screen.name || 'Screen'})`
  return FoundationGated
}

function GateWait() {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.textSecondary} />
    </View>
  )
}
