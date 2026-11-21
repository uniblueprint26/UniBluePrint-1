import { View, Text, StyleSheet } from 'react-native'
import { WifiOff, AlertCircle, SearchX, Lock } from 'lucide-react-native'
import { fonts, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useOnline } from '../../lib/connectivity'
import Button from './Button'

// The one error state. `kind` picks the words and icon:
//   error     something went wrong loading (default; becomes "offline" when the phone has no connection)
//   offline   no connection
//   notfound  the thing is gone or the link is old
//   denied    the person is not allowed to see it
const COPY = {
  error: { Icon: AlertCircle, title: 'Something went wrong', body: 'We could not load this. Check your connection and try again.' },
  offline: { Icon: WifiOff, title: 'You are offline', body: 'Connect to Wi-Fi or mobile data and try again.' },
  notfound: { Icon: SearchX, title: 'We cannot find that', body: 'It may have been removed, or the link is out of date.' },
  denied: { Icon: Lock, title: 'This is not available to you', body: 'You may need to be a member of the group, or sign in again.' },
}

export default function ErrorState({ kind = 'error', title, body, onRetry, retryLabel = 'Try again', style }) {
  const { colors, isDark } = useTheme()
  const online = useOnline()
  const key = kind === 'error' && !online ? 'offline' : kind
  const c = COPY[key] || COPY.error
  const Icon = c.Icon
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.box, { backgroundColor: colors.surface }, isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card]}>
        <Icon size={34} color={colors.textPrimary} strokeWidth={1.4} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title || c.title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body || c.body}</Text>
      {!!onRetry && key !== 'notfound' && key !== 'denied' && (
        <View style={styles.cta}><Button label={retryLabel} onPress={onRetry} variant="primary" /></View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  box: { width: 76, height: 76, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontFamily: fonts.serif, fontSize: 22, textAlign: 'center' },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  cta: { marginTop: 22, alignSelf: 'stretch' },
})
