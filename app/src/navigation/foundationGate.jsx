import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useFoundationEnabled } from '../hooks/useAppFlags'

// Foundation is visible everywhere by default. The app_flags row
// `foundation_visible` (default true, see hooks/useAppFlags.js) is only a
// remote kill switch. Every Foundation screen is wrapped with this, so if the
// founder ever switches it off, a deep link, a notification tap or an old
// shortcut cannot land on one: the person is sent to Home, which always
// exists. Ordering is a separate switch (foundation_ordering_enabled) and is
// handled inside each screen, not here.
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
