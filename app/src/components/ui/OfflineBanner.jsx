import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WifiOff } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useOnline } from '../../lib/connectivity'

// A slim banner at the very top of the app while there is no connection.
// It floats over the screen so nothing shifts, and goes away on its own.
export default function OfflineBanner() {
  const online = useOnline()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  if (online) return null
  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[styles.wrap, { top: insets.top + 6 }]}
    >
      <View style={[styles.pill, { backgroundColor: colors.chromeBg }]}>
        <WifiOff size={16} color={colors.chromeFg} strokeWidth={1.9} />
        <Text style={[styles.text, { color: colors.chromeFg }]}>No connection. Showing what is saved.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
})
