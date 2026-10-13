import { View, Text, StyleSheet } from 'react-native'
import { Award } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// "Founding Partner" pill — timing-only badge, entirely decoupled from tier
// and payment option (docs/business/partner-tiering-framework.md: "join
// before public launch, keep it"). Same gated-boolean shape as
// VerifiedBadge: renders nothing when `founding` is false, and the caller
// must pass a real founding_badge value read from
// partner_tier_assignments/get_my_tier_status()/get_partner_tier_admin_list()
// — never a hardcoded true.

export default function FoundingPartnerBadge({ founding = false, compact = false, style }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  if (!founding) return null
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, style]}>
      <Award size={compact ? 11 : 13} color={colors.goldDeep} />
      <Text style={[styles.text, compact && styles.textCompact]}>Founding Partner</Text>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
  })
}
