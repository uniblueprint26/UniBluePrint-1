import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// A basket: a tidy folder tile, the same idea as the envelopes and files in
// Foundation. A small tab sits on the top left, then an icon, a name, one short
// line and (on the Ad Board) how many items are inside.
//
//   wide     spans the full row (the From UBP basket)
//   compact  smaller type and padding (the Post a listing sheet)
export default function BasketShape({ visual, Icon: IconOverride, title, line, count, wide, compact, onPress, accessibilityLabel }) {
  const t = useAdTokens()
  const { colors } = t
  const f = t.folder(visual)
  const Icon = IconOverride || f.Icon
  const edge = { borderColor: f.edge }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (count ? `${title}, ${count}` : title)}
      style={wide ? s.wrapWide : s.wrap}
    >
      <View style={[s.tab, edge, { backgroundColor: f.fill, width: compact ? 46 : 56 }]} />
      <View style={[s.bodyBase, edge, { backgroundColor: f.fill }, wide ? s.bodyWide : s.body, compact && s.bodyCompact]}>
        <View style={[s.icon, { backgroundColor: colors.surface }, compact && s.iconCompact]}>
          <Icon size={compact ? 20 : 22} color={f.fg} strokeWidth={1.8} />
        </View>
        <View style={wide ? s.textWide : s.text}>
          <Text style={[s.title, { color: colors.textPrimary }, compact && s.titleCompact]} numberOfLines={1}>{title}</Text>
          {!!line && <Text style={[s.line, { color: colors.textSecondary }]} numberOfLines={compact ? 3 : 2}>{line}</Text>}
        </View>
        {!!count && (
          <View style={[s.count, { backgroundColor: f.chip }]}>
            <Text style={[s.countText, { color: colors.textPrimary }]}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrap: { paddingTop: 11, flexGrow: 1 },
  wrapWide: { paddingTop: 11 },
  tab: {
    position: 'absolute', top: 0, left: 16, height: 14, zIndex: 2,
    borderTopLeftRadius: 9, borderTopRightRadius: 9,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
  },
  bodyBase: { borderWidth: 1, borderRadius: 18, borderTopLeftRadius: 4, padding: 16 },
  body: { flexGrow: 1, minHeight: 150, justifyContent: 'space-between' },
  bodyCompact: { minHeight: 136, padding: 14 },
  bodyWide: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconCompact: { width: 40, height: 40, borderRadius: 12 },
  text: { marginTop: 14 },
  textWide: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 17 },
  titleCompact: { fontSize: 16 },
  line: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 3 },
  count: { position: 'absolute', top: 14, right: 14, minWidth: 28, height: 24, paddingHorizontal: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
})
