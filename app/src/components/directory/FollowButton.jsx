import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Plus, Check } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// One-way follow toggle. "Follow" is the solid action, "Following" is quiet.
export default function FollowButton({ following, onPress, compact = false, name }) {
  const { colors } = useTheme()
  const fg = following ? colors.textPrimary : colors.accentFg
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!following }}
      accessibilityLabel={`${following ? 'Unfollow' : 'Follow'}${name ? ` ${name}` : ''}`}
      style={[
        s.btn,
        compact && s.compact,
        following
          ? { backgroundColor: colors.tabFill }
          : { backgroundColor: colors.accentBg },
      ]}
    >
      {following
        ? <Check size={compact ? 13 : 15} color={fg} strokeWidth={2.2} />
        : <Plus size={compact ? 13 : 15} color={fg} strokeWidth={2.2} />}
      <Text style={[s.label, compact && s.labelCompact, { color: fg }]}>{following ? 'Following' : 'Follow'}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, paddingHorizontal: 18, borderRadius: 20,
  },
  compact: { height: 34, paddingHorizontal: 14, alignSelf: 'stretch' },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  labelCompact: { fontSize: 13 },
})
