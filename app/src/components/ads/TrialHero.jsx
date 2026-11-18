import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts } from '../../constants/theme'
import { TRIAL } from '../../constants/adBoardContent'
import { useAdTokens } from './adTheme'

// The biggest deal on the Ad Board: everything is free during the trial, and
// every service is half price. The standard prices are shown struck through.
export default function TrialHero() {
  const t = useAdTokens()
  const grad = t.isDark ? ['#9C6209', '#704205'] : ['#9C6209', '#7A4A07']
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.card}
      accessible
      accessibilityLabel={`${TRIAL.headline}. ${TRIAL.sub}. Standard price ${TRIAL.monthly} or ${TRIAL.annual}.`}
    >
      <View style={s.glow} pointerEvents="none" />
      <View style={s.tag}><Text style={s.tagText}>FROM UBP</Text></View>
      <Text style={s.title}>{TRIAL.headline}</Text>
      <Text style={s.sub}>{TRIAL.sub}</Text>
      <View style={s.prices}>
        <View style={s.priceBox}>
          <Text style={s.struck}>{TRIAL.monthly}</Text>
        </View>
        <View style={s.priceBox}>
          <Text style={s.struck}>{TRIAL.annual}</Text>
        </View>
      </View>
      <Text style={s.foot}>You do not pay these during the trial.</Text>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 24, padding: 22, overflow: 'hidden' },
  glow: { position: 'absolute', right: -50, bottom: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.10)' },
  tag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, marginBottom: 14 },
  tagText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6, color: '#FFFFFF' },
  title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 33, color: '#FFFFFF' },
  sub: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.95)', marginTop: 8 },
  prices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  priceBox: { backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  struck: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: 'rgba(255,255,255,0.92)', textDecorationLine: 'line-through', textDecorationColor: 'rgba(255,255,255,0.9)' },
  foot: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 12 },
})
