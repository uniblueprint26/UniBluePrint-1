import { View, Text, StyleSheet } from 'react-native'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The one shared "stat tile" design, promoted from EvidenceBankScreen's
// icon-chip tiles (the most visually complete of the three different stat-tile
// designs the app had — Founder/Partner Portal each had their own plainer,
// slightly-drifted version). Used for any "N of something" summary row:
// portal dashboards, MyOutputsScreen's status counts, etc.

export function StatTileRow({ children, style }) {
  const { colors, isDark } = useTheme()
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...(isDark ? null : shadows.card),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export default function StatTile({ icon: Icon, iconBg, iconColor, value, label, border = false }) {
  const { colors } = useTheme()
  const resolvedIconColor = iconColor || colors.textPrimary
  return (
    <View style={[styles.item, border && { borderRightWidth: 1, borderRightColor: colors.border }]}>
      {!!Icon && (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={14} color={resolvedIconColor} strokeWidth={2} />
        </View>
      )}
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.card,
    borderWidth: 1,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 26 },
  label: { fontFamily: fonts.sans, fontSize: 10, marginTop: 3, textAlign: 'center', lineHeight: 13 },
})
