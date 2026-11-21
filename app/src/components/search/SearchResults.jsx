import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronRight, Search } from 'lucide-react-native'
import { PILLARS } from '../../constants/pillars'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Google like results: the name of the thing, the path to it under the name
// (Foundation Blueprint, then CV Optimisation) and one short line about it.
// `compact` is the tighter version used inside the side menu.
export default function SearchResults({ query, results, onOpen, compact = false }) {
  const { colors } = useTheme()
  if (!query.trim()) return null
  if (results.length === 0) {
    return (
      <View style={s.none}>
        <Search size={26} color={colors.textTertiary} strokeWidth={1.5} />
        <Text style={[s.noneTitle, { color: colors.textPrimary }]}>Nothing found for "{query.trim()}"</Text>
        <Text style={[s.noneBody, { color: colors.textSecondary }]}>Try a shorter word, like CV, rent or coach.</Text>
      </View>
    )
  }
  return (
    <View>
      {results.map((r, i) => {
        const accent = (r.pillar && PILLARS[r.pillar]?.color) || colors.textPrimary
        const Icon = (r.pillar && PILLARS[r.pillar]?.Icon) || Search
        return (
          <TouchableOpacity
            key={r.id}
            activeOpacity={0.75}
            onPress={() => onOpen(r)}
            accessibilityRole="button"
            accessibilityLabel={`${r.title}. ${r.trail.join(', ')}`}
            style={[s.row, compact && s.rowCompact, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}
          >
            <View style={[s.icon, { backgroundColor: colors.tabFill }]}>
              <Icon size={18} color={accent} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.path, { color: colors.textSecondary }]} numberOfLines={1}>
                {(r.path.length === 1 ? ['UniBlueprint', ...r.path] : r.path).join('  ›  ')}
              </Text>
              <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>{r.title}</Text>
              {!compact && !!r.about && <Text style={[s.about, { color: colors.textSecondary }]} numberOfLines={2}>{r.about}</Text>}
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  rowCompact: { paddingVertical: 11, paddingHorizontal: 4, gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  path: { fontFamily: fonts.sans, fontSize: 12.5, marginBottom: 2 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16.5, lineHeight: 22 },
  about: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  none: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  noneTitle: { fontFamily: fonts.serif, fontSize: 20, textAlign: 'center' },
  noneBody: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center' },
})
