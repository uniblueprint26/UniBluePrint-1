import { View, Text, StyleSheet, Linking, Platform } from 'react-native'
import { Crown } from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { WEBSITE_LINKS } from '../../constants/site'
import { NATIVE_NEUTRAL_BILLING } from '../../constants/platformPolicy'
import Button from './Button'

// iOS and Android (neutral billing, see constants/platformPolicy.js): no
// purchase CTAs, prices or upgrade steering for a plan the user doesn't already
// have (App Store 3.1.1 and Google Play Billing). The web build gets a real
// "Upgrade to Pro" button that opens uniblueprint.ie/pricing; native gets
// neutral status text only, and any sentence that says "upgrade" is dropped
// from the message.
const NEUTRAL = NATIVE_NEUTRAL_BILLING

// Keeps the sentences that do not tell the person to upgrade or buy.
function neutralMessage(message) {
  const kept = String(message || '')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => !/upgrade|get pro|buy|subscribe/i.test(sentence))
    .join(' ')
    .trim()
  return kept || 'This is part of UniBlueprint Pro.'
}

/**
 * ProUpgradeGate — the shared "this is a Pro feature" paywall card, used
 * wherever a screen needs to block a Free-tier user from a Pro-only
 * surface (see docs/business/subscription-pricing-model.md and task
 * #56/D2 — "Gate it behind isPro"). Pair with hooks/useProAccess.js:
 *
 *   const { canAccess, loading } = useProAccess()
 *   if (loading) return null // or a small spinner — never flash this at a Pro user
 *   if (!canAccess) return <ProUpgradeGate title="..." message="..." />
 *
 * `variant="screen"` fills the available space (for gating an entire
 * screen's content, e.g. ElevationScreen); `variant="inline"` (default)
 * renders as a standalone card to drop into an existing scroll view
 * alongside other content (e.g. CoachProfileScreen's CTA area).
 */
export default function ProUpgradeGate({
  title = 'This is a Pro feature',
  message = 'Upgrade to Pro to unlock this.',
  ctaLabel = 'Upgrade to Pro',
  variant = 'inline',
  style,
}) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  return (
    <View style={[styles.card, variant === 'screen' && styles.cardScreen, style]}>
      <View style={styles.iconBox}>
        <Crown size={30} color={colors.gold} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{NEUTRAL ? neutralMessage(message) : message}</Text>
      {!NEUTRAL ? (
        <Button
          label={ctaLabel}
          onPress={() => Linking.openURL(WEBSITE_LINKS.pricing)}
          variant="primary"
          style={styles.cta}
        />
      ) : (
        <Text style={styles.iosNote}>Manage your plan on uniblueprint.ie</Text>
      )}
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.25)',
    ...shadows.card,
  },
  cardScreen: {
    flex: 1,
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(201,162,75,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 21, color: colors.textPrimary,
    textAlign: 'center', marginBottom: 10,
  },
  message: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    textAlign: 'center', lineHeight: 21, marginBottom: 22,
  },
  cta: { paddingHorizontal: 36 },
  iosNote: {
    fontFamily: fonts.sans, fontSize: 12.5, color: colors.light,
    textAlign: 'center',
  },
  })
}
