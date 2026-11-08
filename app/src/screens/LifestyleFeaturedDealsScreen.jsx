/**
 * LifestyleFeaturedDealsScreen — "The Collection", the Lifestyle Blueprint's
 * curated storefront: one of the 4 standalone Lifestyle destinations (see
 * LifestyleScreen, the hub they're all reached from). File/route name kept
 * as LifestyleFeaturedDeals for continuity with existing navigation
 * registrations and deep links — the display name is "The Collection".
 *
 * Curated, not comprehensive: only partners who genuinely sell something
 * showcase-able — a physical product (Z Vision Apparel's embroidery,
 * Saiemsent/Elect's clothing, Eabakeditt's bakes), an itemised "look" menu
 * (nail/lash sets, a signature cut), or a tangible creative deliverable
 * (prints, brand/web packages, photo & video work) — appear here.
 * Ongoing coaching/training/retainer relationships (MPFitness, Energie,
 * JMC, Camila's PT, LEVA's marketing retainer, Whip Wizardz' automotive
 * services, Roomy's housing platform, Nyz3ditz's mentorship subscription)
 * are deliberately left out: there's no single "item" to put in a hero
 * spot or a grid tile for a membership or a monthly retainer, and this is
 * what actually separates a Collection item from the full Explore roster.
 *
 * No real product photography exists yet for every partner, so a tile
 * without one renders a clean, branded placeholder (blueprint-sketch
 * texture + category icon + brand monogram) rather than a fake stock photo
 * — see ProductPlaceholder below. It already branches on
 * `partner.productImage`, so dropping in a real photo later needs no
 * structural change here, only that field being set.
 *
 * Tapping any tile — hero or grid — opens the click-to-expand
 * PartnerExpandCard (photo, brand, social handle — the same quick-peek
 * pattern Explore's list rows use), which itself can drill into the full
 * PartnerDetailSheet for pricing/services/contact, ending in the same
 * contact/claim flow either way. No in-app checkout anywhere on this
 * screen, by design.
 */
import { useRef, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import SectionHeader from '../components/ui/SectionHeader'
import {
  PartnerDetailSheet, PartnerExpandCard,
} from '../components/lifestyle/PartnerCards'
import {
  HERO, GRID, DealTile, ProductPlaceholder, getCollectionStyles,
} from '../components/lifestyle/CollectionTiles'
import RedemptionCodeSheet from '../components/lifestyle/RedemptionCodeSheet'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { goToHome } from '../navigation/helpers'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { PARTNERS } from '../data/lifestylePartners'

export default function LifestyleFeaturedDealsScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const collectionStyles = getCollectionStyles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)
  const [detailPartnerId, setDetailPartnerId] = useState(null)
  const [expandPartnerId, setExpandPartnerId] = useState(null)
  const [codePartnerId, setCodePartnerId] = useState(null)
  const [revealedKeys, setRevealedKeys] = useState(() => new Set())

  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null
  const expandPartner = PARTNERS.find(p => p.id === expandPartnerId) || null
  const codePartner = PARTNERS.find(p => p.id === codePartnerId) || null

  // FlatList calls this with whichever rows just crossed the visibility
  // threshold — merge their keys into the revealed set so each tile's own
  // entrance animation (in DealTile above) fires once, the first time it's
  // actually scrolled into view, not all at once on mount.
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setRevealedKeys(prev => {
      let changed = false
      const next = new Set(prev)
      viewableItems.forEach(v => {
        if (v.item && !next.has(v.item.id)) { next.add(v.item.id); changed = true }
      })
      return changed ? next : prev
    })
  }).current
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15, minimumViewTime: 0 }).current

  const renderItem = useCallback(({ item }) => (
    <DealTile item={item} revealed={revealedKeys.has(item.id)} onPress={() => setExpandPartnerId(item.id)} />
  ), [revealedKeys])

  return (
    <View style={styles.screen}>
      {/* Explicit flex:1 on the FlatList itself (not just contentContainerStyle)
          — the same fix every screen-root ScrollView in this app needs, and
          FlatList wraps one internally, so it needs it too. */}
      <FlatList
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        data={GRID}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Integrated header + hero ── */}
            <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={safeGoBack}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ChevronLeft size={20} color={colors.chromeFg} strokeWidth={2} />
                  <Text style={styles.backBtnText}>Home</Text>
                </TouchableOpacity>
                <UBPLogo height={33} color={colors.chromeFg} onPress={() => goToHome(navigation)} />
                <View style={{ width: 70 }} />
              </View>

              <Text style={styles.heroEyebrow}>LIFESTYLE · THE COLLECTION</Text>
              <Text style={styles.heroTitle}>The Collection</Text>
              <Text style={styles.heroTagline}>Curated by UniBlueprint</Text>
              <Text style={styles.heroSub}>
                Real products from real partners, curated into one collection. No checkout here, every
                item ends with a direct message to the person behind it.
              </Text>
            </View>

            <View style={styles.content}>
              {/* Hero product spot */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => setExpandPartnerId(HERO.id)}>
                <View style={collectionStyles.heroCard}>
                  <ProductPlaceholder partner={HERO.partner} hero />
                  <View style={collectionStyles.heroCaption}>
                    <Text style={collectionStyles.heroFeaturedTag}>THIS WEEK'S FEATURE</Text>
                    <Text style={collectionStyles.heroBrand}>{HERO.partner.brand}</Text>
                    <Text style={collectionStyles.heroProduct}>{HERO.productLabel}</Text>
                    <View style={collectionStyles.heroCtaRow}>
                      <Text style={collectionStyles.heroCtaText}>View the full listing</Text>
                      <ChevronRight size={14} color={colors.textPrimary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <SectionHeader eyebrow="Shop the edit" title="More from the collection" style={{ marginTop: spacing.xl }} />
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.content}>
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Tap any item for a quick look, then view the full listing for credentials, pricing,
                and how to book, the same detail sheet you'd see on Explore. Nothing is purchased in-app.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exploreMoreBtn}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('LifestylePartners')}
            >
              <Text style={styles.exploreMoreText}>Browse every partner on Explore</Text>
              <ChevronRight size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

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
  list:   { flex: 1 },

  heroBlock: {
    backgroundColor: colors.chromeBg,
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
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.chromeFg },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.chromeFg, marginBottom: 6 },
  heroTagline: {
    fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.gold,
    letterSpacing: 0.6, marginBottom: 10,
  },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Grid — tile/placeholder/hero-card styles themselves live in
  // CollectionTiles.getCollectionStyles, shared with LifestyleScreen's
  // preview; only this screen's FlatList column layout stays local.
  columnWrapper: { gap: 10, paddingHorizontal: spacing.md },

  footerNote: {
    backgroundColor: 'rgba(30,58,95,0.05)', borderRadius: radius.button,
    padding: 14, marginTop: spacing.md,
  },
  footerNoteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center' },

  exploreMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 12, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  exploreMoreText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  })
}
