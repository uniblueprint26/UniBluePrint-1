import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight } from 'lucide-react-native'
import UBPLogo from '../ui/UBPLogo'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// The Weekly Blueprint magazine, as the first thing on the Ad Board. It reads as
// a book on a shelf: a stitched spine on the left, a framed cover, two sheets
// peeking out underneath, the issue number, the title and the issue theme.
// The cover is always navy with cream type, in light and dark.
export default function WeeklyHero({ issue, onPress }) {
  const t = useAdTokens()
  const grad = t.isDark ? ['#0B1B30', '#14294A', '#1E3F66'] : ['#0F2240', '#1B3659', '#2A4D76']
  const badge = issue?.number != null ? `ISSUE ${issue.number}` : 'ISSUE 1'
  const theme = issue?.theme || 'The structure behind your success.'

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open this week's issue of The Weekly Blueprint"
    >
      <View style={s.stack2} />
      <View style={s.stack1} />
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, t.isDark && s.cardDark]}>
        <View style={s.spine} pointerEvents="none">
          {[0, 1, 2].map(i => <View key={i} style={s.stitch} />)}
        </View>
        <View style={s.frame} pointerEvents="none" />
        <View style={s.inner}>
          <View style={s.topRow}>
            <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>
            <UBPLogo height={22} color="#F5F0E8" />
          </View>
          <Text style={s.kicker}>YOUR WEEK, IN ONE ISSUE</Text>
          <Text style={s.title}>The Weekly{'\n'}Blueprint</Text>
          <View style={s.rule} />
          <Text style={s.theme} numberOfLines={2}>{theme}</Text>
          <View style={s.footer}>
            <View style={s.cta}>
              <Text style={s.ctaText}>Open the issue</Text>
              <ChevronRight size={16} color="#1E3A5F" strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  stack1: { position: 'absolute', left: 12, right: 8, bottom: -6, height: 24, borderRadius: 14, backgroundColor: 'rgba(30,58,95,0.30)' },
  stack2: { position: 'absolute', left: 22, right: 14, bottom: -12, height: 24, borderRadius: 14, backgroundColor: 'rgba(30,58,95,0.16)' },
  card: { borderRadius: 18, overflow: 'hidden', minHeight: 300, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  cardDark: { borderWidth: 1, borderColor: 'rgba(245,240,232,0.16)' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, backgroundColor: 'rgba(0,0,0,0.24)', justifyContent: 'space-evenly', alignItems: 'center' },
  stitch: { width: 1.5, height: 40, backgroundColor: 'rgba(245,240,232,0.28)' },
  frame: { position: 'absolute', left: 36, right: 12, top: 12, bottom: 12, borderWidth: 1, borderColor: 'rgba(245,240,232,0.2)', borderRadius: 8 },
  inner: { paddingLeft: 50, paddingRight: 26, paddingTop: 28, paddingBottom: 26 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: 'rgba(245,240,232,0.14)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.9, color: '#F5F0E8' },
  kicker: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: 'rgba(245,240,232,0.6)', marginTop: 26 },
  title: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, color: '#F5F0E8', marginTop: 8 },
  rule: { width: 40, height: 2, borderRadius: 1, backgroundColor: 'rgba(245,240,232,0.5)', marginTop: 16, marginBottom: 14 },
  theme: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: 'rgba(245,240,232,0.86)' },
  footer: { flexDirection: 'row', marginTop: 24 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F0E8', borderRadius: 24, height: 46, paddingLeft: 20, paddingRight: 14 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: '#1E3A5F' },
})
