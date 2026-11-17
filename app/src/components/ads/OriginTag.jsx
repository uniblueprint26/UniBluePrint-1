import { View, Text, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// The small "From UBP" pill.
export function UbpTag() {
  const t = useAdTokens()
  return (
    <View style={[s.pill, { backgroundColor: t.accentTint }]}>
      <Text style={[s.pillText, { color: t.accentText }]}>FROM UBP</Text>
    </View>
  )
}

// "Campus Connect" / "Course Connect" label with that pillar's icon and colour.
export function PillarLabel({ origin, extra }) {
  const t = useAdTokens()
  const p = t.pillar(origin)
  if (!p) return null
  const Icon = p.Icon
  return (
    <View style={s.pillar}>
      <Icon size={12} color={p.iconColor} strokeWidth={2} />
      <Text style={[s.pillarText, { color: p.textColor }]}>{p.label}</Text>
      {!!extra && <Text style={[s.dim, { color: t.colors.textSecondary }]}>{`· ${extra}`}</Text>}
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
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },
  pillar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillarText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  dim: { fontFamily: fonts.sans, fontSize: 12 },
  reviewed: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewedText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
})
