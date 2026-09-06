/**
 * PricingScreen — in-app mirror of the website's pricing page (three plans,
 * same feature lists and badge placement as src/pages/PricingPage.jsx),
 * reachable from Profile → Explore.
 *
 * "Get Pro" / "Get Premium" open uniblueprint.ie/pricing in the device's
 * default browser — a confirmed decision, not an in-app WebView, matching
 * how every other money/legal destination in this app already links out
 * (see constants/site.js). The user's real current plan (read from
 * `subscription` on AuthContext, backed by the `subscriptions` table) gets
 * a highlighted border and its button swapped for a "Current Plan" pill
 * instead of a duplicate purchase button.
 *
 * There is no reachable Sign-Up screen from inside the authenticated app —
 * SignUp lives in the separate, mutually-exclusive AuthStack RootNavigator
 * renders only while signed out (see navigation/index.jsx). Anyone who can
 * open this screen already has an account, so the Free card's CTA reflects
 * that instead of a dead link to a screen that isn't mounted.
 */
import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Linking, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Check, CheckCircle } from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { WEBSITE_LINKS } from '../constants/site'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = Math.min(320, SCREEN_W - 64)
const CARD_GAP = 14

const FREE_FEATURES = [
  'Campus Connect (all boards)',
  'Course Connect (all boards)',
  'Mental Health and Wellbeing resources',
  'Basic profile and account',
  'View Lifestyle Blueprint deals',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Foundation Blueprint (all services)',
  'Elevation Blueprint (all services)',
  'Lifestyle Blueprint deals access',
  'Priority Handler and Coach assignment',
  'Discount on service bundles',
]

function FeatureRow({ text, dim }) {
  return (
    <View style={styles.featureRow}>
      <Check size={15} color={dim ? 'rgba(245,240,232,0.55)' : colors.success} style={{ marginTop: 2, flexShrink: 0 }} />
      <Text style={[styles.featureText, dim && { color: 'rgba(245,240,232,0.8)' }]}>{text}</Text>
    </View>
  )
}

function CurrentPlanPill({ light }) {
  return (
    <View style={[styles.currentPill, light && { backgroundColor: 'rgba(245,240,232,0.15)' }]}>
      <CheckCircle size={14} color={light ? colors.cream : colors.navy} />
      <Text style={[styles.currentPillText, light && { color: colors.cream }]}>Your Current Plan</Text>
    </View>
  )
}

export default function PricingScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { subscription } = useAuth()
  const scrollRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [pageIndex, setPageIndex] = useState(0)

  const isActiveSub = !!subscription && subscription.status === 'active' && (
    !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()
  )
  const currentPlan = !isActiveSub ? 'free' : subscription.tier === 'pro_annual' ? 'premium' : 'pro'

  function openWebsitePricing() {
    Linking.openURL(WEBSITE_LINKS.pricing)
  }

  function jumpTo(i) {
    scrollRef.current?.scrollTo({ x: i * (CARD_W + CARD_GAP), animated: true })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.heroBlock}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroEyebrow}>TRANSPARENT PRICING</Text>
        <Text style={styles.heroTitle}>Simple. Honest. No surprises.</Text>
        <Text style={styles.heroSub}>Free to join. Upgrade only when you're ready.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_W + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg, gap: CARD_GAP }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false, listener: e => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP))) },
          )}
          scrollEventThrottle={16}
        >
          {/* Free */}
          <View style={[styles.card, { width: CARD_W }, currentPlan === 'free' && styles.cardHighlightNavy]}>
            <Text style={styles.planName}>Free</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBig}>€0</Text>
              <Text style={styles.priceSub}>forever</Text>
            </View>
            <Text style={styles.priceNote}>No credit card required</Text>

            <View style={{ marginTop: 20, gap: 10, flex: 1 }}>
              {FREE_FEATURES.map(f => <FeatureRow key={f} text={f} />)}
            </View>

            {currentPlan === 'free' ? (
              <CurrentPlanPill />
            ) : (
              <View style={styles.includedNote}>
                <Text style={styles.includedNoteText}>Included with every plan</Text>
              </View>
            )}
          </View>

          {/* Pro (monthly) */}
          <View style={[styles.card, { width: CARD_W }, styles.cardGoldBorder, currentPlan === 'pro' && styles.cardHighlightNavy]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Most Popular</Text>
            </View>
            <Text style={styles.planName}>UniBlueprint Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBig}>€6.99</Text>
              <Text style={styles.priceSub}>/month</Text>
            </View>
            <Text style={styles.priceNote}>Cancel any time</Text>

            <View style={{ marginTop: 20, gap: 10, flex: 1 }}>
              {PRO_FEATURES.map(f => <FeatureRow key={f} text={f} />)}
            </View>

            {currentPlan === 'pro' ? (
              <CurrentPlanPill />
            ) : (
              <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={openWebsitePricing}>
                <Text style={styles.ctaBtnText}>Get Pro</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Premium (annual) */}
          <View style={[styles.card, styles.cardNavy, { width: CARD_W }, currentPlan === 'premium' && styles.cardHighlightGold]}>
            <View style={styles.badgeLight}>
              <Text style={styles.badgeLightText}>Best Value</Text>
            </View>
            <Text style={styles.planNameLight}>UniBlueprint Premium</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBigLight}>€49.99</Text>
              <Text style={styles.priceSubLight}>/year</Text>
            </View>
            <Text style={styles.priceNoteLight}>Less than €1 a week</Text>

            <View style={{ marginTop: 20, gap: 10, flex: 1 }}>
              {PRO_FEATURES.map(f => <FeatureRow key={f} text={f} dim />)}
            </View>

            {currentPlan === 'premium' ? (
              <CurrentPlanPill light />
            ) : (
              <TouchableOpacity style={styles.ctaBtnLight} activeOpacity={0.85} onPress={openWebsitePricing}>
                <Text style={styles.ctaBtnLightText}>Get Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.ScrollView>

        {/* Page dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} onPress={() => jumpTo(i)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
              <View style={[styles.dot, pageIndex === i && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footNote}>All prices include VAT where applicable. Pro and Premium purchases are completed on uniblueprint.ie.</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginTop: 6, lineHeight: 34 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 8, lineHeight: 20 },

  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 2, borderColor: colors.border,
    padding: 22, ...shadows.card,
  },
  cardGoldBorder: { borderColor: colors.gold },
  cardNavy: { backgroundColor: colors.navy, borderColor: colors.navy },
  cardHighlightNavy: { borderColor: colors.navy, borderWidth: 3 },
  cardHighlightGold: { borderColor: colors.gold, borderWidth: 3 },

  badge: {
    position: 'absolute', top: -12, alignSelf: 'center',
    backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 5,
  },
  badgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.white },
  badgeLight: {
    position: 'absolute', top: -12, alignSelf: 'center',
    backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 5,
  },
  badgeLightText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy },

  planName: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginTop: 6 },
  planNameLight: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream, marginTop: 6 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 14 },
  priceBig: { fontFamily: fonts.sansBold, fontSize: 36, color: colors.navy },
  priceBigLight: { fontFamily: fonts.sansBold, fontSize: 36, color: colors.cream },
  priceSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  priceSubLight: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.6)' },
  priceNote: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.light, marginTop: 4 },
  priceNoteLight: { fontFamily: fonts.sans, fontSize: 11.5, color: 'rgba(245,240,232,0.55)', marginTop: 4 },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.navy, flex: 1, lineHeight: 19 },

  ctaBtn: { backgroundColor: colors.navy, borderRadius: radius.button, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.cream },
  ctaBtnLight: { backgroundColor: colors.cream, borderRadius: radius.button, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  ctaBtnLightText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.navy },

  includedNote: { marginTop: 22, paddingVertical: 13, alignItems: 'center', borderRadius: radius.button, backgroundColor: colors.cream },
  includedNoteText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.muted },

  currentPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 22, paddingVertical: 13, borderRadius: radius.button, backgroundColor: 'rgba(30,58,95,0.08)',
  },
  currentPillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: spacing.lg },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(30,58,95,0.2)' },
  dotActive: { backgroundColor: colors.navy, width: 20 },

  footNote: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.light, textAlign: 'center', marginTop: spacing.lg, marginHorizontal: spacing.lg, lineHeight: 17 },
})
