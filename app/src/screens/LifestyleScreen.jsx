import { useEffect, useRef } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ShoppingBag, Map as MapIcon, Heart, PiggyBank, Phone,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import FeatureCard from '../components/ui/FeatureCard'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../data/lifestylePartners'

// Re-exported so existing imports elsewhere in the app (FounderPortalScreen,
// PartnerMap) keep working — the actual data lives in one shared module so
// this screen and the map component don't import each other.
export { PARTNERS, MYSTERY_MAP_COUNTIES }

const LIVE_PARTNER_COUNT = PARTNERS.filter(p => p.status === 'live').length

// ─── Lifestyle hub — Round: restructured from one long scroll (Grid/Map
// toggle + a buried Mental Health list + a Budgeting section) into 4
// standalone destinations, each its own pushed screen. This hub is now just
// the landing page: a hero, a "need to talk now" safety strip that never
// makes crisis support wait behind a tap into Wellbeing, and one FeatureCard
// per destination — same building block Campus Connect and Course Connect
// use for their own "hub of standalone screens" layout, so this reads as
// the same family of pattern rather than a bespoke one-off.
const FEATURES = [
  {
    key: 'featured', label: 'THE COLLECTION', Icon: ShoppingBag, color: '#FDF1DD',
    headline: 'Curated by UniBlueprint',
    sub: 'Real products from real partners: apparel, beauty sets, prints, and bakes, curated into one collection. No checkout, just a direct line to claim it.',
    count: 'New', isNew: true,
    screen: 'LifestyleFeaturedDeals',
  },
  {
    key: 'explore', label: 'EXPLORE', Icon: MapIcon, color: '#EFF6FF',
    headline: 'Every partner, on the map',
    sub: "Browse the full roster by category, or find who's near you on the Ireland map. Every confirmed deal and everyone still launching.",
    count: `${LIVE_PARTNER_COUNT} live partners`,
    screen: 'LifestylePartners',
  },
  {
    key: 'wellbeing', label: 'WELLBEING', Icon: Heart, color: '#FEF2F2',
    headline: 'Support when you need it',
    sub: 'Crisis lines, counselling, student supports, and more, organised into real categories you can actually scan, not one long list.',
    count: 'Always free',
    screen: 'LifestyleWellbeing',
  },
  {
    key: 'budgeting', label: 'BUDGETING', Icon: PiggyBank, color: '#F0FDF4',
    headline: 'Know where you stand',
    sub: 'A quick snapshot of your balance and goals, plus a straight line into the full Budgeting tool when you need to go deeper.',
    count: 'Live now',
    screen: 'LifestyleBudgetingPreview',
  },
]

export default function LifestyleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()

  // A highlight arriving from a deep link (e.g. Elevation Blueprint's
  // cross-links to Camila/LEVA's partner listing) used to open straight to
  // that partner's full listing on this same screen's own grid. That grid
  // now lives on the standalone Explore page, so this hub just forwards the
  // param there instead of duplicating the grid + detail sheet here too.
  // Ref-guarded so it only fires once per param, not every re-render.
  const forwardedHighlight = useRef(null)
  useEffect(() => {
    const id = route?.params?.highlightId
    if (id && forwardedHighlight.current !== id) {
      forwardedHighlight.current = id
      navigation.navigate('LifestylePartners', { highlightId: id })
    }
  }, [route?.params?.highlightId])

  return (
    <View style={styles.screen}>
      {/* ── Scrollable content — header scrolls with the page, same pattern
          as Foundation/Elevation/Campus Connect/Course Connect use whenever
          they're pushed from Home, not the persistent Home-style TopBar
          (logo left, bell+avatar right) this screen used to render. */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Integrated header + hero (single navy block) ── */}
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Home</Text>
            </TouchableOpacity>
            <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
            <View style={{ width: 70 }} />
          </View>

          <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
          <Text style={styles.heroTitle}>Lifestyle Blueprint</Text>
          <Text style={styles.heroSub}>
            Partner deals, wellbeing support, and money tools, built around what life actually costs.
          </Text>
        </View>

        <View style={styles.content}>

          {/* Crisis support never waits behind a tap into Wellbeing — a
              slim, always-visible strip right at the top of the hub. */}
          <TouchableOpacity
            style={styles.crisisStrip}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('tel:116123')}
          >
            <View style={styles.crisisIconWrap}>
              <Phone size={14} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.crisisTitle}>Need to talk right now?</Text>
              <Text style={styles.crisisSub}>Samaritans · 116 123 · free, 24/7</Text>
            </View>
            <Text
              style={styles.crisisLink}
              onPress={() => navigation.navigate('LifestyleWellbeing')}
            >
              More support →
            </Text>
          </TouchableOpacity>

          <View style={{ gap: 14, marginTop: spacing.lg }}>
            {FEATURES.map(f => (
              <FeatureCard key={f.key} feature={f} onPress={() => navigation.navigate(f.screen)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Integrated header + hero
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView
  // reliably fills the space below the fixed navy header on every platform.
  scrollView: { flex: 1 },
  scroll:   {},
  content:  { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  crisisStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#DC2626', borderRadius: radius.button,
    padding: 12, ...shadows.card,
  },
  crisisIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  crisisTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.white },
  crisisSub:   { fontFamily: fonts.sans, fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  crisisLink:  { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.white, textDecorationLine: 'underline' },
})
