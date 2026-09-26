import { View, Text, StyleSheet } from 'react-native'
import { BadgeCheck } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'

// Small "✓ Verified" pill, shared across every place the app claims something
// is verified — Elevation coaches, Lifestyle partners, and anywhere else that
// makes the claim in copy. `verified` must be a real per-entity value sourced
// from coach_profiles.verified / partners.verified (see
// migration 20260926091500_verified_field.sql, not yet applied) — never
// assumed. The default is `false`: nothing has actually been vetted yet, so
// nothing gets the badge until the team explicitly sets that flag on a real
// row. ElevationScreen, CoachProfileScreen and PartnerCards all fetch that
// real column and pass it in explicitly; no caller should hand this a
// hardcoded `true`.

export default function VerifiedBadge({ verified = false, style, compact = false }) {
  if (!verified) return null
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, style]}>
      <BadgeCheck size={compact ? 11 : 13} color="#3B82F6" />
      <Text style={[styles.text, compact && styles.textCompact]}>Verified</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#EFF6FF',
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
    color: '#3B82F6',
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
})
