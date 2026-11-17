import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CalendarDays } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { openInHomeStack } from '../../navigation/helpers'

// One calm row for the next thing in your day. Renders nothing when there is
// no event, so it never shows a made-up one.
//
// nextUp: { title: string, timeLabel?: string ("10:00"), inLabel?: string ("in 35 min") } | null
export default function NextUpRow({ nextUp, navigation, style }) {
  const { colors } = useTheme()
  const s = getStyles(colors)
  if (!nextUp || !nextUp.title) return null

  return (
    <TouchableOpacity
      style={[s.row, style]}
      activeOpacity={0.8}
      onPress={() => openInHomeStack(navigation, 'Calendar')}
      accessibilityRole="button"
      accessibilityLabel={`Next up: ${nextUp.title}${nextUp.timeLabel ? ` at ${nextUp.timeLabel}` : ''}${nextUp.inLabel ? `, ${nextUp.inLabel}` : ''}. Open Calendar`}
    >
      <View style={s.iconWrap}>
        <CalendarDays size={18} color={colors.textPrimary} strokeWidth={1.8} />
      </View>
      <Text style={s.text} numberOfLines={1}>
        <Text style={s.title}>{nextUp.title}</Text>
        {!!nextUp.timeLabel && <Text style={s.time}>{`  ${nextUp.timeLabel}`}</Text>}
      </Text>
      {!!nextUp.inLabel && <Text style={s.inLabel}>{nextUp.inLabel}</Text>}
    </TouchableOpacity>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: radius.card + 4,
      borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 14,
    },
    iconWrap: {
      width: 36, height: 36, borderRadius: 10, backgroundColor: colors.tabFill,
      alignItems: 'center', justifyContent: 'center',
    },
    text: { flex: 1, minWidth: 0 },
    title: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
    time: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary },
    inLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  })
}
