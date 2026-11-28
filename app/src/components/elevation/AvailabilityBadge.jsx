import { View, Text, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { coachAvailability } from '../../lib/coachDisplay'

// "Taking clients" (green dot) or "Nearly full" (amber dot). The words are always
// shown, so the status never relies on colour alone. Nothing renders when the coach
// has no `availability`. No gold: the amber is an orange amber, a status colour only.
//   variant 'photo'    small dark pill for use on top of a photo (swipe card)
//   variant 'profile'  themed pill for the profile header chip row
const DOT = {
  taking: { light: '#15803D', dark: '#4ADE80', photo: '#4ADE80' },
  nearly_full: { light: '#C2410C', dark: '#FB923C', photo: '#FDBA74' },
}

export default function AvailabilityBadge({ coach, variant = 'profile', style }) {
  const { colors, isDark } = useTheme()
  const a = coachAvailability(coach)
  if (!a) return null
  const photo = variant === 'photo'
  const dot = photo ? DOT[a.key].photo : isDark ? DOT[a.key].dark : DOT[a.key].light
  return (
    <View
      accessible
      accessibilityLabel={a.label}
      style={[
        styles.pill,
        photo
          ? { backgroundColor: 'rgba(0,0,0,0.58)', borderColor: 'rgba(255,255,255,0.28)' }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text
        style={{ fontFamily: fonts.sansSemiBold, fontSize: photo ? 11 : 12.5, color: photo ? '#FFFFFF' : colors.textPrimary }}
        numberOfLines={1}
      >{a.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
})
