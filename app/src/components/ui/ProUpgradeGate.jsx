import { View, Text, StyleSheet, Linking, Platform } from 'react-native'
import { Crown } from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { WEBSITE_LINKS } from '../../constants/site'
import Button from './Button'

// iOS: no purchase CTAs, prices or upgrade steering for a plan the user
// doesn't already have (App Store 3.1.1, task #56/D1 — same rule
// PricingScreen.jsx and WeeklyBlueprintScreen's Deal Room page already
// follow). Android and web get a real "Upgrade to Pro" button that opens
// uniblueprint.ie/pricing; iOS gets neutral status text only.
const IS_IOS = Platform.OS === 'ios'

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
      <Text style={styles.message}>{message}</Text>
      {!IS_IOS ? (
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
    fontFamily: fonts.serif, fontSize: 21, color: colors.navy,
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
