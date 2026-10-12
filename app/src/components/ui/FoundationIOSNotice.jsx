import { View, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UserCheck } from 'lucide-react-native'
import ScreenHeader from './ScreenHeader'
import { colors, fonts, spacing, radius } from '../../constants/theme'

// iOS only (App Store 3.1.1, D1 — the same decision PricingScreen already
// applies to the Pro/Premium subscription): every Foundation Blueprint
// service is a pay-per-service digital document, so none of its 8 builder
// screens render their intake/submit flow on iOS. This is the shared
// fallback they render instead — one screen, reused 8 times, rather than
// duplicating the same neutral copy in every builder file. Deliberately no
// tappable Linking.openURL out to the website here, matching PricingScreen's
// conservative, text-only "Manage your plan on uniblueprint.ie" treatment
// for the same reason: this would otherwise be an external purchase link
// surfaced from inside what Apple reads as the purchase flow itself.
//
// Elevation Blueprint takes the opposite approach on iOS (an actual
// Linking.openURL out to a website checkout/booking page) because coaching
// sessions are a real-world service exempt under 3.1.3(e) — see
// CoachProfileScreen.jsx and constants/site.js's coachBookingUrl(). Those
// two are not inconsistent; they're the same rule applied to two different
// kinds of service.
export const IS_IOS = Platform.OS === 'ios'

export default function FoundationIOSNotice({ navigation, serviceTitle }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={() => navigation.goBack()}
        eyebrow="FOUNDATION BLUEPRINT"
        title={serviceTitle}
        style={styles.header}
        titleStyle={styles.headerTitle}
      />
      <View style={[styles.body, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.message}>
          {serviceTitle} is ordered and paid for on uniblueprint.ie, not in the app.
        </Text>
        <View style={styles.badge}>
          <UserCheck size={14} color={colors.navy} strokeWidth={2} />
          <Text style={styles.badgeText}>Reviewed by a real Campus Handler, never AI-only</Text>
        </View>
        <Text style={styles.sub}>
          Visit uniblueprint.ie on your phone or computer to order {serviceTitle} and track it from there.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  headerTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  message: { fontFamily: fonts.sans, fontSize: 15, color: colors.navy, textAlign: 'center', lineHeight: 22 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 18,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  badgeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 16, lineHeight: 19 },
})
