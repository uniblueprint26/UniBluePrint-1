import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// The partner-deal hero at the top of Deals. Amber (the Ad Board accent)
// with white text, deep enough that the white clears contrast.
export default function FeaturedDealCard({ deal, onPress }) {
  const t = useAdTokens()
  const grad = t.isDark ? ['#A96C0C', '#7E4D06'] : ['#BC7A10', '#94600B']
  const sub = deal.meta.join(' · ')
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Featured deal: ${deal.title}`}
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.glow} pointerEvents="none" />
        <View style={s.left}>
          <View style={s.tagWrap}>
            {deal.origin === 'ubp' ? <View style={s.tagBg}><Text style={s.tagText}>FROM UBP</Text></View> : null}
          </View>
          <Text style={s.title} numberOfLines={2}>{deal.title}</Text>
          {!!sub && <Text style={s.sub} numberOfLines={2}>{sub}</Text>}
        </View>
        {!!deal.percent && (
          <View style={s.badge}>
            <Text style={s.badgePct}>{deal.percent}%</Text>
            <Text style={s.badgeOff}>OFF</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', minHeight: 112 },
  glow: { position: 'absolute', right: -40, bottom: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.10)' },
  left: { flex: 1, minWidth: 0 },
  tagWrap: { flexDirection: 'row', minHeight: 4 },
  tagBg: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, marginBottom: 8 },
  tagText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6, color: '#FFFFFF' },
  title: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 27, color: '#FFFFFF' },
  sub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(255,255,255,0.92)', marginTop: 4 },
  badge: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#FBF3E2', alignItems: 'center', justifyContent: 'center' },
  badgePct: { fontFamily: fonts.serif, fontSize: 22, color: '#6E4504', lineHeight: 25 },
  badgeOff: { fontFamily: fonts.sansBold, fontSize: 10, color: '#6E4504', letterSpacing: 0.8 },
})
