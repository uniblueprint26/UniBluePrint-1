import { useEffect, useRef } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ShoppingBag, Map as MapIcon, Heart, PiggyBank, Phone,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import ScreenHeader from '../components/ui/ScreenHeader'
import FeatureCard from '../components/ui/FeatureCard'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { goToHome } from '../navigation/helpers'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../data/lifestylePartners'

// Re-exported so existing imports elsewhere in the app (FounderPortalScreen,
// PartnerMap) keep working — the actual data lives in one shared module so
// this screen and the map component don't import each other.
export { PARTNERS, MYSTERY_MAP_COUNTIES }

const LIVE_PARTNER_COUNT = PARTNERS.filter(p => p.status === 'live').length

// ─── Lifestyle hub ──────────────────────────────────────────────────────────
// "The Collection" (curated-by-UniBlueprint deals, LifestyleFeaturedDeals)
// is now the landing content — its own prominent card up top, not one of
// four equal tiles — with Explore/Wellbeing/Budgeting demoted to a slim nav
// row beneath it. Each still its own standalone pushed screen (same
// "hub of standalone screens" pattern Campus Connect/Course Connect use),
// not inlined here — avoids duplicating Explore's partner cards + gated
// contact-detail flow (hooks/usePartnerContact.js) in a second place.
const COLLECTION_FEATURE = {
  key: 'featured', label: 'THE COLLECTION', Icon: ShoppingBag, color: '#FDF1DD',
  headline: 'Curated by UniBlueprint',
  sub: 'Real products from real partners: apparel, beauty sets, prints, and bakes, curated into one collection. No checkout, just a direct line to claim it.',
  count: 'New', isNew: true,
  screen: 'LifestyleFeaturedDeals',
}

const SECONDARY_FEATURES = [
  {
    key: 'explore', label: 'Explore', Icon: MapIcon,
    sub: `${LIVE_PARTNER_COUNT} live partners`,
    screen: 'LifestylePartners',
  },
  {
    key: 'wellbeing', label: 'Wellbeing', Icon: Heart,
    sub: 'Always free',
    screen: 'LifestyleWellbeing',
  },
  {
    key: 'budgeting', label: 'Budgeting', Icon: PiggyBank,
    sub: 'Live now',
    screen: 'LifestyleBudgetingPreview',
  },
]

export default function LifestyleScreen({ navigation, route }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)

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
        <ScreenHeader
          variant="navy"
          onBack={safeGoBack}
          logoCenter={<UBPLogo height={33} color={colors.chromeFg} onPress={() => goToHome(navigation)} />}
          eyebrow="LIFESTYLE"
          title="Lifestyle Blueprint"
          subtitle="Partner deals, wellbeing support, and money tools, built around what life actually costs."
          style={styles.heroBlock}
          titleStyle={styles.heroTitle}
        />

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

          {/* Slim nav row — Explore / Wellbeing / Budgeting, demoted from
              equal-sized tiles to compact shortcuts above the Collection. */}
          <View style={styles.navRow}>
            {SECONDARY_FEATURES.map(f => (
              <TouchableOpacity
                key={f.key}
                style={styles.navRowItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(f.screen)}
              >
                <View style={styles.navRowIcon}>
                  <f.Icon size={16} color={colors.textPrimary} strokeWidth={1.8} />
                </View>
                <Text style={styles.navRowLabel}>{f.label}</Text>
                <Text style={styles.navRowSub}>{f.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* The Collection — landing content, its own prominent card. */}
          <View style={{ marginTop: spacing.md }}>
            <FeatureCard feature={COLLECTION_FEATURE} onPress={() => navigation.navigate(COLLECTION_FEATURE.screen)} />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Integrated header + hero
  heroBlock: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.chromeFg, marginTop: 6, marginBottom: 10 },

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

  // Slim nav row — Explore / Wellbeing / Budgeting
  navRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  navRowItem: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  navRowIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  navRowLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textPrimary },
  navRowSub:   { fontFamily: fonts.sans, fontSize: 9.5, color: colors.muted, marginTop: 1, textAlign: 'center' },
  })
}
