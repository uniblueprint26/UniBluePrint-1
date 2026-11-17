import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Three-way switch under the page title. `tabs`: [{ key, label, badge? }].
export default function SegmentedControl({ tabs, value, onChange }) {
  const { colors, isDark } = useTheme()
  return (
    <View style={[s.track, { backgroundColor: isDark ? colors.surfaceSunk : colors.surfaceSunk }]} accessibilityRole="tablist">
      {tabs.map(t => {
        const active = t.key === value
        return (
          <TouchableOpacity
            key={t.key}
            style={[s.seg, active && { backgroundColor: colors.surface }, active && !isDark && s.activeShadow]}
            activeOpacity={0.8}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.label, { color: active ? colors.textPrimary : colors.textSecondary, fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium }]}>
              {t.label}
            </Text>
            {t.badge > 0 && (
              <View style={[s.badge, { backgroundColor: colors.accentBg }]}>
                <Text style={[s.badgeText, { color: colors.accentFg }]}>{t.badge > 9 ? '9+' : t.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 16, padding: 4, marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 12 },
  activeShadow: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  label: { fontSize: 14 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11 },
})
