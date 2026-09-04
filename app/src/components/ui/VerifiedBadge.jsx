import { View, Text, StyleSheet } from 'react-native'
import { BadgeCheck } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'

// Small "✓ Verified" pill, shared across every place the app claims something
// is verified — Elevation coaches, Lifestyle partners, and anywhere else that
// makes the claim in copy. Before this, "verified" was only ever a blanket
// marketing line ("every coach is checked before they're listed") with no
// per-entity data behind it anywhere. This makes it a real, per-item field
// instead: pass `verified={false}` to withhold it from something that hasn't
// actually been checked yet. Every existing coach/partner entry already went
// through the team's own curation before being added, so the default is
// `true` — entries don't need to be touched individually, only ones that
// genuinely aren't vetted need `verified={false}` set explicitly.

export default function VerifiedBadge({ verified = true, style, compact = false }) {
  if (!verified) return null
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, style]}>
      <BadgeCheck size={compact ? 11 : 13} color="#1D4ED8" />
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
    color: '#1D4ED8',
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
})
