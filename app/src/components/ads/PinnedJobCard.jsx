import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Briefcase } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { useAdTokens } from './adTheme'
import { UbpTag, Chip } from './OriginTag'

// One pinned UniBlueprint placement on the Jobs basket: the Placement chip and
// "Posted by UBP", the title, what you would do, and an Apply button.
export default function PinnedJobCard({ item, onApply }) {
  const t = useAdTokens()
  const { colors } = t
  const v = t.visual(item.visual)
  return (
    <View style={[s.card, { backgroundColor: colors.surface }, t.isDark ? t.cardBorder : shadows.card]}>
      <View style={s.head}>
        <View style={[s.tile, { backgroundColor: v.bg }]}>
          <Briefcase size={22} color={v.fg} strokeWidth={1.8} />
        </View>
        <View style={s.headText}>
          <View style={s.tags}>
            <Chip label={item.typeLabel} />
            <UbpTag label={item.tagLabel} />
          </View>
          <Text style={[s.title, { color: colors.textPrimary }]}>{item.title}</Text>
        </View>
      </View>
      <Text style={[s.summary, { color: colors.textSecondary }]}>{item.summary}</Text>
      <TouchableOpacity
        onPress={() => onApply(item)}
        activeOpacity={0.85}
        style={[s.apply, { backgroundColor: t.accent }]}
        accessibilityRole="button"
        accessibilityLabel={`Apply for the ${item.team} placement`}
      >
        <Text style={[s.applyText, { color: t.accentInk }]}>Apply</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 20, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  tile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, minWidth: 0 },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 21, marginTop: 6 },
  summary: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, marginTop: 12 },
  apply: { alignSelf: 'flex-start', marginTop: 14, height: 38, paddingHorizontal: 22, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
})
