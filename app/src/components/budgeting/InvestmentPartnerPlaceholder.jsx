import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { ExternalLink } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// PLACEHOLDER, WAITING FOR THE FOUNDER.
//
// The Budgeting Investment tab must only point to Zainab Ade for investment
// content. The founder has not yet confirmed which person, page or link that
// is, so this component renders NOTHING until the two values below are filled
// in. There is no invented link, name or claim here.
//
// To switch it on: set ZAINAB_ADE_LINK to the confirmed https link and check
// the name and line. Nothing else in the app needs to change.
//
// Never link to trading, copy trading, challenges, brokers or commission
// schemes from here. All of that was removed from the app and website.
export const ZAINAB_ADE_LINK = null // e.g. 'https://...', confirmed by the founder
const PARTNER_NAME = 'Zainab Ade'
const PARTNER_LINE = 'Personal finance and investing guidance.'

export default function InvestmentPartnerPlaceholder() {
  const { colors } = useTheme()
  if (!ZAINAB_ADE_LINK) return null
  return (
    <View style={s.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => Linking.openURL(ZAINAB_ADE_LINK).catch(() => {})}
        accessibilityRole="link"
        accessibilityLabel={`Open ${PARTNER_NAME}`}
        style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.name, { color: colors.textPrimary }]}>{PARTNER_NAME}</Text>
          <Text style={[s.line, { color: colors.textSecondary }]}>{PARTNER_LINE}</Text>
        </View>
        <ExternalLink size={16} color={colors.textPrimary} strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { marginTop: 24 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.card, borderWidth: 1 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  line: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
})
