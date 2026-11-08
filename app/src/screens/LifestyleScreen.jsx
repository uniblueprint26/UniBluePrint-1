import { useEffect, useRef, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Map as MapIcon, Heart, PiggyBank, Phone, ChevronRight,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import ScreenHeader from '../components/ui/ScreenHeader'
import SectionHeader from '../components/ui/SectionHeader'
import { PartnerDetailSheet, PartnerExpandCard } from '../components/lifestyle/PartnerCards'
import {
  FEATURED_DEALS, HERO, GRID, DealTile, ProductPlaceholder, getCollectionStyles,
} from '../components/lifestyle/CollectionTiles'
import RedemptionCodeSheet from '../components/lifestyle/RedemptionCodeSheet'
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

// How many grid tiles (beyond the hero) the hub shows inline before handing
// off to the full "see all" screen — "shouldn't have to open [the shop],
// should just be there" (founder), so the real products live here, not
// behind a single summary tile. Capped rather than showing the whole
// 19-item roster inline: a 2-up grid of 4 (2 rows) plus the hero reads as
// a generous taste of the shop without turning the hub itself into the
// full storefront — LifestyleFeaturedDealsScreen stays the place for that.
const PREVIEW_COUNT = 4
const PREVIEW_ITEMS = GRID.slice(0, PREVIEW_COUNT)
const PREVIEW_ROWS = PREVIEW_ITEMS.reduce((rows, item, i) => {
  if (i % 2 === 0) rows.push([item])
  else rows[rows.length - 1].push(item)
  return rows
}, [])

// ─── Lifestyle hub ──────────────────────────────────────────────────────────
// "The Collection" (curated-by-UniBlueprint deals) is the landing content —
// its real hero + grid tiles rendered directly here, not a single FeatureCard
// summary tile pointing at the standalone LifestyleFeaturedDealsScreen — with
// Explore/Wellbeing/Budgeting demoted to a slim nav row above it. Those three
// stay standalone pushed screens (same "hub of standalone screens" pattern
// Campus Connect/Course Connect use) — Explore's own partner cards + gated
// contact-detail flow (hooks/usePartnerContact.js) aren't duplicated here,
// only The Collection's product tiles are, via the shared
// components/lifestyle/CollectionTiles module both this hub and
// LifestyleFeaturedDealsScreen render from — same roster, same cards, same
// tap-to-expand flow, never a second copy of either.
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
  const collectionStyles = getCollectionStyles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)

  // Same click-to-expand → full-listing flow The Collection's own standalone
  // screen uses (PartnerExpandCard → PartnerDetailSheet → RedemptionCodeSheet,
  // all shared components — see components/lifestyle/PartnerCards.jsx and
  // CollectionTiles.jsx), wired here too so tapping a product on the hub
  // doesn't need a trip to that screen just to see what it is.
  const [expandPartnerId, setExpandPartnerId] = useState(null)
  const [detailPartnerId, setDetailPartnerId] = useState(null)
  const [codePartnerId, setCodePartnerId] = useState(null)
  const expandPartner = PARTNERS.find(p => p.id === expandPartnerId) || null
  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null
  const codePartner = PARTNERS.find(p => p.id === codePartnerId) || null

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

          {/* The Collection — landing content: the real hero product + a
              preview of the grid, right here, not a single tile pointing
              elsewhere. "No checkout, just a direct line to claim it" —
              tapping any tile opens the same quick-peek → full-listing flow
              as the standalone screen; "See the full Collection" below is
              the only thing that still navigates away. */}
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader eyebrow="Curated by UniBlueprint" title="The Collection" />
            <Text style={styles.collectionSub}>
              Real products from real partners: apparel, beauty sets, prints, and bakes. No checkout,
              just a direct line to claim it.
            </Text>

            <TouchableOpacity activeOpacity={0.9} onPress={() => setExpandPartnerId(HERO.id)}>
              <View style={collectionStyles.heroCard}>
                <ProductPlaceholder partner={HERO.partner} hero />
                <View style={collectionStyles.heroCaption}>
                  <Text style={collectionStyles.heroFeaturedTag}>THIS WEEK'S FEATURE</Text>
                  <Text style={collectionStyles.heroBrand}>{HERO.partner.brand}</Text>
                  <Text style={collectionStyles.heroProduct}>{HERO.productLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.previewGrid}>
              {PREVIEW_ROWS.map((row, i) => (
                <View key={i} style={styles.previewRow}>
                  {row.map(item => (
                    <DealTile
                      key={item.id}
                      item={item}
                      revealed
                      onPress={() => setExpandPartnerId(item.id)}
                    />
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.seeAllBtn}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('LifestyleFeaturedDeals')}
            >
              <Text style={styles.seeAllText}>See all {FEATURED_DEALS.length} items in the Collection</Text>
              <ChevronRight size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PartnerExpandCard
        partner={expandPartner}
        visible={!!expandPartner}
        onClose={() => setExpandPartnerId(null)}
        onViewFull={id => setDetailPartnerId(id)}
      />
      <PartnerDetailSheet
        partner={detailPartner}
        visible={!!detailPartner}
        onClose={() => setDetailPartnerId(null)}
        navigation={navigation}
        onShowCode={id => setCodePartnerId(id)}
      />
      <RedemptionCodeSheet
        partner={codePartner}
        visible={!!codePartner}
        onClose={() => setCodePartnerId(null)}
      />
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

  // The Collection preview — hero + grid tile styles themselves live in
  // CollectionTiles.getCollectionStyles (shared with the full "see all"
  // screen); only this hub's own section copy, grid wrapper, and
  // "See all" link stay local.
  collectionSub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 19, marginTop: -6, marginBottom: spacing.md,
  },
  previewGrid: { marginTop: spacing.md },
  previewRow:  { flexDirection: 'row', gap: 10 },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 4, paddingVertical: 12, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  seeAllText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  })
}
