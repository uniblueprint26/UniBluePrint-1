import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight } from 'lucide-react-native'
import UBPLogo from '../ui/UBPLogo'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// The Weekly Blueprint magazine, as the first thing on the Ad Board. Same
// headline as before: the issue badge, "The Weekly Blueprint", the issue theme
// (or "The structure behind your success."), and "Open This Week's Issue".
// The cover is always navy with cream type, in light and dark.
export default function WeeklyHero({ issue, onPress }) {
  const t = useAdTokens()
  const grad = t.isDark ? ['#0E2038', '#16304F', '#21436C'] : ['#14294A', '#1E3A5F', '#2E5282']
  const badge = issue?.number != null ? `ISSUE ${issue.number}` : 'THIS WEEK'
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
        <View style={s.glow} pointerEvents="none" />
        <View style={s.topRow}>
          <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>
          <UBPLogo height={24} color="#F5F0E8" />
        </View>
        <Text style={s.title}>The Weekly Blueprint</Text>
        <View style={s.rule} />
        <Text style={s.theme} numberOfLines={2}>{theme}</Text>
        <View style={s.footer}>
          <View style={s.cta}>
            <Text style={s.ctaText}>Open This Week's Issue</Text>
            <ChevronRight size={16} color="#1E3A5F" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={s.note}>This week's 26-page drop + a note from the team</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  // Two thin sheets peeking out underneath, so it reads as a magazine.
  stack1: { position: 'absolute', left: 10, right: 10, bottom: -6, height: 24, borderRadius: 18, backgroundColor: 'rgba(30,58,95,0.30)' },
  stack2: { position: 'absolute', left: 22, right: 22, bottom: -12, height: 24, borderRadius: 18, backgroundColor: 'rgba(30,58,95,0.16)' },
  card: { borderRadius: 24, padding: 22, overflow: 'hidden', minHeight: 232 },
  cardDark: { borderWidth: 1, borderColor: 'rgba(245,240,232,0.16)' },
  glow: { position: 'absolute', right: -60, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(245,240,232,0.07)' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: 'rgba(245,240,232,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.9, color: '#F5F0E8' },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: '#F5F0E8', marginTop: 22 },
  rule: { width: 40, height: 2, borderRadius: 1, backgroundColor: 'rgba(245,240,232,0.5)', marginTop: 14, marginBottom: 12 },
  theme: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: 'rgba(245,240,232,0.86)' },
  footer: { flexDirection: 'row', marginTop: 22 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F0E8', borderRadius: 24, height: 46, paddingLeft: 20, paddingRight: 14 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: '#1E3A5F' },
  note: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.62)', marginTop: 14 },
})
