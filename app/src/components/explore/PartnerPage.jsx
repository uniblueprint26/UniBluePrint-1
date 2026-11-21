import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { ExternalLink } from 'lucide-react-native'
import { ToolScreen, Card, openLink } from './ToolBits'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// One page layout for a partner, drawn in that partner's own colours: a brand
// hero (logo, name, one line), what it is in their words, a few plain facts,
// then one main button that opens the partner's site in the browser.
//
// brand: { bg, fg, accent, button, buttonText, heading, body, bodyMedium }
export default function PartnerPage({
  navigation, brand, logo, logoBg, tag, eyebrow, title, tagline, credit,
  what, facts = [], primary, secondary, note,
}) {
  const { colors } = useTheme()
  return (
    <ToolScreen navigation={navigation}>
      <View style={[s.hero, { backgroundColor: brand.bg }]}>
        <View style={s.heroTop}>
          {!!logo && (
            logoBg ? (
              <View style={[s.logoTile, { backgroundColor: logoBg }]}>
                <Image source={logo} style={s.logoIn} resizeMode="contain" accessibilityLabel={`${title} logo`} />
              </View>
            ) : (
              <Image source={logo} style={s.logo} resizeMode="contain" accessibilityLabel={`${title} logo`} />
            )
          )}
          {!!tag && (
            <View style={[s.tag, { backgroundColor: brand.accent }]}>
              <Text style={[s.tagText, { color: brand.bg, fontFamily: brand.bodySemi || fonts.sansSemiBold }]}>{tag}</Text>
            </View>
          )}
        </View>
        {!!eyebrow && <Text style={[s.eyebrow, { color: brand.accent, fontFamily: brand.bodySemi || fonts.sansSemiBold }]}>{eyebrow}</Text>}
        <Text style={[s.heroTitle, { color: brand.fg, fontFamily: brand.heading }]}>{title}</Text>
        {!!tagline && <Text style={[s.heroLine, { color: brand.fg, fontFamily: brand.body }]}>{tagline}</Text>}
        {!!credit && <Text style={[s.credit, { color: brand.fg, fontFamily: brand.body }]}>{credit}</Text>}
      </View>

      {!!what && (
        <View style={s.block}>
          <Text style={[s.h2, { color: colors.textPrimary }]}>What it is</Text>
          <Text style={[s.body, { color: colors.textPrimary }]}>{what}</Text>
        </View>
      )}

      {facts.length > 0 && (
        <Card style={s.facts}>
          {facts.map((f, i) => (
            <View key={f.label} style={[s.fact, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[s.factLabel, { color: colors.textSecondary }]}>{f.label}</Text>
              <Text style={[s.factText, { color: colors.textPrimary }]}>{f.text}</Text>
            </View>
          ))}
        </Card>
      )}

      {!!primary && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => openLink(primary.url)}
          accessibilityRole="link"
          accessibilityLabel={primary.label}
          style={[s.btn, { backgroundColor: brand.button }]}
        >
          <Text style={[s.btnText, { color: brand.buttonText, fontFamily: brand.bodySemi || fonts.sansSemiBold }]}>{primary.label}</Text>
          <ExternalLink size={16} color={brand.buttonText} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
      {!!secondary && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openLink(secondary.url)}
          accessibilityRole="link"
          accessibilityLabel={secondary.label}
          style={[s.btn2, { borderColor: colors.border }]}
        >
          <Text style={[s.btn2Text, { color: colors.textPrimary }]}>{secondary.label}</Text>
          <ExternalLink size={15} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      )}
      {!!note && <Text style={[s.note, { color: colors.textSecondary }]}>{note}</Text>}
    </ToolScreen>
  )
}

const s = StyleSheet.create({
  hero: { borderRadius: 22, padding: 22, paddingBottom: 26 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  logo: { width: 64, height: 64 },
  logoTile: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoIn: { width: 54, height: 54 },
  tag: { paddingHorizontal: 12, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tagText: { fontSize: 12 },
  eyebrow: { fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontSize: 36, lineHeight: 42 },
  heroLine: { fontSize: 16, lineHeight: 24, marginTop: 8, opacity: 0.9 },
  credit: { fontSize: 13, marginTop: 14, opacity: 0.7 },
  block: { marginTop: 28 },
  h2: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, marginTop: 8 },
  facts: { marginTop: 24, padding: 0 },
  fact: { paddingVertical: 16, paddingHorizontal: 18 },
  factLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase' },
  factText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: 16, marginTop: 24 },
  btnText: { fontSize: 16 },
  btn2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 16, borderWidth: 1, marginTop: 12 },
  btn2Text: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  note: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 16, textAlign: 'center', paddingHorizontal: 8 },
})
