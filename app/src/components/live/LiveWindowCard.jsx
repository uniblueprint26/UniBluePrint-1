import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import LiveCountdownRing from './LiveCountdownRing'
import { formatClock } from './useLiveWindow'

// The single prominent card at the top of Notifications while a Live window
// is open. Navy and cream in both modes: it is meant to stand out. Render it
// only when useLiveWindow() says `open`.
export default function LiveWindowCard({ secondsLeft, totalSeconds = 120, onGoLive, style }) {
  const { colors, isDark } = useTheme()
  const brandNavy = colors.navy
  return (
    <View style={[s.wrap, isDark ? { borderWidth: 1, borderColor: 'rgba(245,240,232,0.28)' } : shadows.glow, style]}>
      <LinearGradient
        colors={['#1E3A5F', '#2E5486']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}
      >
        <LiveCountdownRing
          size={60} stroke={5}
          secondsLeft={secondsLeft} totalSeconds={totalSeconds}
          color={colors.cream} track="rgba(245,240,232,0.22)"
        >
          <Text style={[s.clock, { color: colors.cream }]}>{formatClock(secondsLeft)}</Text>
        </LiveCountdownRing>
        <View style={s.text}>
          <Text style={[s.title, { color: colors.cream }]}>Live is open</Text>
          <Text style={[s.title, { color: colors.cream }]}>for 2 minutes</Text>
          <Text style={s.sub}>No gallery, just now.</Text>
        </View>
        <TouchableOpacity
          onPress={onGoLive}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go Live"
          style={[s.btn, { backgroundColor: colors.cream }]}
        >
          <Text style={[s.btnText, { color: brandNavy }]}>Go Live</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { borderRadius: 20 },
  card: { borderRadius: 20, paddingVertical: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  clock: { fontFamily: fonts.sansBold, fontSize: 14 },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 23 },
  sub: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(245,240,232,0.72)', marginTop: 4 },
  btn: { paddingHorizontal: 18, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14 },
})
