import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Grouped list rows shared by Profile and Settings (founder pick, round three:
// a rounded card of rows, each with a soft icon tile, a label, an optional
// value on the right and a chevron).
export function SectionLabel({ children }) {
  const { colors } = useTheme()
  return <Text style={[s.label, { color: colors.textSecondary }]}>{children}</Text>
}

export function RowGroup({ children, style }) {
  const { colors } = useTheme()
  return (
    <View style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  )
}

export function Row({ Icon, label, sub, value, onPress, last, danger, rightNode }) {
  const { colors } = useTheme()
  const ink = danger ? colors.destructive : colors.textPrimary
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[s.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}
    >
      {!!Icon && (
        <View style={[s.tile, { backgroundColor: colors.tabFill }]}>
          <Icon size={19} color={ink} strokeWidth={1.8} />
        </View>
      )}
      <View style={s.mid}>
        <Text style={[s.rowLabel, { color: ink }]}>{label}</Text>
        {!!sub && <Text style={[s.rowSub, { color: colors.textSecondary }]}>{sub}</Text>}
      </View>
      {!!value && <Text style={[s.value, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>}
      {rightNode || <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: 20, marginTop: 26, marginBottom: 10 },
  group: { marginHorizontal: 16, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14, minHeight: 64 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  rowSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2, lineHeight: 18 },
  value: { fontFamily: fonts.sans, fontSize: 14, maxWidth: '42%' },
})
