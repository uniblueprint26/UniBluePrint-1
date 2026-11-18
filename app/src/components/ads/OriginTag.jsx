import { View, Text, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// Small pills that say who a listing is from. Seeded content UBP wrote carries
// "From UBP" (or "Posted by UBP" on the UBP basket); real student content
// never does.
export function UbpTag({ label = 'FROM UBP' }) {
  const t = useAdTokens()
  return (
    <View style={[s.pill, { backgroundColor: t.accentTint }]}>
      <Text style={[s.pillText, { color: t.accentText }]}>{label}</Text>
    </View>
  )
}

// Quiet, neutral pill: "Posted by a student".
export function QuietTag({ label }) {
  const t = useAdTokens()
  return (
    <View style={[s.pill, { backgroundColor: t.colors.tabFill }]}>
      <Text style={[s.pillText, { color: t.colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

// Obvious but calm: used on example cards that are not real listings.
export function ExampleTag({ label }) {
  const t = useAdTokens()
  return (
    <View style={[s.pill, s.exampleBorder, { borderColor: t.colors.textSecondary }]}>
      <Text style={[s.pillText, { color: t.colors.textPrimary }]}>{label}</Text>
    </View>
  )
}

// A plain chip: an industry, or a type such as "Placement".
export function Chip({ label }) {
  const t = useAdTokens()
  return (
    <View style={[s.chip, { backgroundColor: t.colors.tabFill }]}>
      <Text style={[s.chipText, { color: t.colors.textPrimary }]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

export function ReviewedMark() {
  const t = useAdTokens()
  return (
    <View style={s.reviewed}>
      <Check size={12} color={t.reviewed} strokeWidth={2.6} />
      <Text style={[s.reviewedText, { color: t.reviewed }]}>Reviewed</Text>
    </View>
  )
}

const s = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  pillText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9, maxWidth: '100%' },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  exampleBorder: { borderWidth: 1, borderStyle: 'dashed' },
  reviewed: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewedText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
})
