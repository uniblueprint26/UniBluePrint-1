import { Component } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { colors, fonts, radius, spacing } from '../constants/theme'

/**
 * Top-level error boundary — there was previously none anywhere in the app,
 * so any render exception (a bad prop, a null a screen didn't guard against,
 * a third-party library throwing) white-screened the whole app with no way
 * back short of force-quitting. Wrapped around <RootNavigator/> in App.jsx,
 * above the navigator, so a crash on any single screen is caught here
 * instead of taking down the whole tree.
 *
 * "Reload" can't call a native app-restart API — expo-updates (the usual
 * way to do that) isn't installed, and this fix intentionally avoids
 * pulling in a new dependency for it. Instead it resets this boundary's own
 * state and bumps `resetKey`, which is passed down as the navigator's
 * `key` — changing a component's `key` makes React unmount and remount it
 * fresh, discarding whatever state caused the crash. That recovers from the
 * overwhelming majority of render crashes (a bad value in one screen's
 * local state, a stale navigation param) without needing a real process
 * restart. A future #31 Sentry integration should log the error from
 * `componentDidCatch` below.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, resetKey: 0 }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught a render error:', error, info?.componentStack)
  }

  handleReload = () => {
    this.setState(s => ({ hasError: false, resetKey: s.resetKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.screen}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={28} color={colors.cream} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            UniBlueprint ran into a problem and couldn't show this screen. Reloading usually
            fixes it — your data is safe.
          </Text>
          <TouchableOpacity style={styles.reloadBtn} activeOpacity={0.85} onPress={this.handleReload}>
            <Text style={styles.reloadBtnText}>Reload</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children(this.state.resetKey)
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(245,240,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.16)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.cream,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)',
    textAlign: 'center', lineHeight: 21, marginTop: 10, maxWidth: 300,
  },
  reloadBtn: {
    marginTop: 26,
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    paddingHorizontal: 32,
    paddingVertical: 13,
  },
  reloadBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
})
