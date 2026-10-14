import { View, Text, StyleSheet } from 'react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Access / Plus / Signature tier pill — see
// docs/business/partner-tiering-framework.md and migration
// 20261012100000_partner_tiering_framework.sql. Same shared-pill shape as
// VerifiedBadge/ActiveMemberBadge: renders nothing when there's no real
// value to show (`tier` is null until a Founder/Finance/Operations admin
// has actually classified this partner/coach via set_partner_tier() — this
// component never guesses or defaults to a tier itself).
//
// The three colour treatments are a purely visual distinction (so Access /
// Plus / Signature read as different at a glance) — they encode no ranking
// logic and no thresholds; the tier value itself is always a human judgment
// call stored verbatim from the database, never computed here.
const TIER_LABEL = { access: 'Access', plus: 'Plus', signature: 'Signature' }
function getTierStyle(colors) {
  return {
    access:    { bg: 'rgba(30,58,95,0.08)',   fg: colors.textPrimary },
    plus:      { bg: '#FEF9C3',               fg: colors.goldDeep },
    signature: { bg: 'rgba(124,58,237,0.1)',  fg: colors.newBadge },
  }
}

export default function PartnerTierBadge({ tier, compact = false, style }) {
  const { colors } = useTheme()
  const TIER_STYLE = getTierStyle(colors)
  const label = TIER_LABEL[tier]
  if (!label) return null
  const tone = TIER_STYLE[tier]
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, compact && styles.badgeCompact, style]}>
      <Text style={[styles.text, { color: tone.fg }, compact && styles.textCompact]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
})
