import { View, Text, StyleSheet } from 'react-native'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

// The one shared "stat tile" design, promoted from EvidenceBankScreen's
// icon-chip tiles (the most visually complete of the three different stat-tile
// designs the app had — Founder/Partner Portal each had their own plainer,
// slightly-drifted version). Used for any "N of something" summary row:
// portal dashboards, MyOutputsScreen's status counts, etc.

export function StatTileRow({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>
}

export default function StatTile({ icon: Icon, iconBg, iconColor = colors.navy, value, label, border = false }) {
  return (
    <View style={[styles.item, border && styles.itemBorder]}>
      {!!Icon && (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={14} color={iconColor} strokeWidth={2} />
        </View>
      )}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  itemBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, lineHeight: 26 },
  label: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 3, textAlign: 'center', lineHeight: 13 },
})
