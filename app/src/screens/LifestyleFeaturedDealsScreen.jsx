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
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ShoppingBag, Sparkles, UtensilsCrossed, Wrench, Camera as CameraIcon, ChevronRight,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import SectionHeader from '../components/ui/SectionHeader'
import {
  CATEGORY_META, PartnerDetailSheet, PartnerExpandCard,
} from '../components/lifestyle/PartnerCards'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { PARTNERS } from '../data/lifestylePartners'

// ─── Curated roster ───────────────────────────────────────────────────────────
// id -> productLabel (a display name for what's being shown; the partner's
// own `category`/`deal` fields are pulled straight from lifestylePartners.js,
// nothing duplicated here). First entry is the hero spot.
const FEATURED_DEALS = [
  { id: 'zvisionapparel',    productLabel: 'Custom Embroidered Hoodie' },
  { id: 'saiemsent',         productLabel: 'Signature Streetwear Drop' },
  { id: 'elect',             productLabel: 'Faith-Led Streetwear' },
  { id: 'eabakeditt',        productLabel: 'Loaded Brownie Box' },
  { id: 'nailnurse',         productLabel: 'Signature Nail Set' },
  { id: 'veeslash',          productLabel: 'Signature Lash Set' },
  { id: 'claras',            productLabel: 'Gel Extension Set' },
  { id: 'lashessteph',       productLabel: 'Mega Volume Lash Set' },
  { id: 'ilashedbydiya',     productLabel: 'Classic Lash Set' },
  { id: 'cutbyire',          productLabel: 'Signature Cut & Lineup' },
  { id: 'royaltyproductions', productLabel: 'Portrait & Event Sessions' },
  { id: 'coded69studios',    productLabel: 'Prints & Studio Rental' },
  { id: 'poiemadexigns',     productLabel: 'Brand & Web Package' },
  { id: 'kelan',             productLabel: 'Photo & Video Package' },
]
  .map(d => ({ ...d, partner: PARTNERS.find(p => p.id === d.id) }))
  .filter(d => d.partner) // defensive — never render a tile for an id that moved/was removed

const HERO = FEATURED_DEALS[0]
const GRID = FEATURED_DEALS.slice(1)

const CATEGORY_ICON_FALLBACK = { fitness: ShoppingBag, beauty: Sparkles, fashion: ShoppingBag, food: UtensilsCrossed, services: Wrench }

// ─── Branded placeholder tile — structurally ready for a real photo: pass
// `partner.productImage` (a Storage URL, once one exists) and this renders
// that Image instead, with the exact same caption layout around it. Until
// then it's a deliberate, honest "no photo yet" treatment — a soft
// blueprint-sketch texture in the category's accent colour, the category
// icon, and the partner's monogram — never a fake stock photo standing in. ──
function ProductPlaceholder({ partner, hero }) {
  const accent = CATEGORY_META[partner.filterKey]?.accent || colors.navy
  const Icon = CATEGORY_META[partner.filterKey]?.Icon || CATEGORY_ICON_FALLBACK[partner.filterKey] || ShoppingBag

  if (partner.productImage) {
    return (
      <Animated.Image
        source={{ uri: partner.productImage }}
        style={[styles.placeholderBase, hero ? styles.placeholderHero : styles.placeholderGrid]}
        resizeMode="cover"
      />
    )
  }

  return (
    <View style={[
      styles.placeholderBase, hero ? styles.placeholderHero : styles.placeholderGrid,
      { backgroundColor: `${accent}14` },
    ]}>
      <View style={styles.placeholderLinesWrap} pointerEvents="none">
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.placeholderLine, { backgroundColor: accent, top: `${22 + i * 26}%` }]} />
        ))}
      </View>
      <View style={[styles.placeholderIconWrap, { borderColor: accent }, hero && styles.placeholderIconWrapHero]}>
        <Icon size={hero ? 30 : 20} color={accent} strokeWidth={1.6} />
      </View>
      <Text style={[styles.placeholderMonogram, { color: accent }, hero && styles.placeholderMonogramHero]} numberOfLines={1}>
        {partner.initials}
      </Text>
      <View style={styles.placeholderTag}>
        <CameraIcon size={9} color={colors.muted} />
        <Text style={styles.placeholderTagText}>Photo coming soon</Text>
      </View>
    </View>
  )
}

// ─── Grid tile — fades + scales in the first time it scrolls into view
// (tracked by the FlatList's own viewability callback below, not a
// per-tile scroll listener), then stays put. ───────────────────────────────
function DealTile({ item, revealed, onPress }) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current
  const played = useRef(false)

  useEffect(() => {
    if (!revealed || played.current) return
    played.current = true
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start()
  }, [revealed])

  return (
    <Animated.View style={[styles.tileWrap, { opacity, transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <ProductPlaceholder partner={item.partner} />
        <View style={styles.tileCaption}>
          <Text style={styles.tileBrand} numberOfLines={1}>{item.partner.brand}</Text>
          <Text style={styles.tileProduct} numberOfLines={2}>{item.productLabel}</Text>
          {item.partner.deal ? (
            <Text style={styles.tileDeal} numberOfLines={1}>{item.partner.deal}</Text>
          ) : (
            <Text style={styles.tileCategory} numberOfLines={1}>{item.partner.category}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function LifestyleFeaturedDealsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [detailPartnerId, setDetailPartnerId] = useState(null)
  const [expandPartnerId, setExpandPartnerId] = useState(null)
  const [revealedKeys, setRevealedKeys] = useState(() => new Set())

  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null
  const expandPartner = PARTNERS.find(p => p.id === expandPartnerId) || null

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
                <View style={styles.heroCard}>
                  <ProductPlaceholder partner={HERO.partner} hero />
                  <View style={styles.heroCaption}>
                    <Text style={styles.heroFeaturedTag}>THIS WEEK'S FEATURE</Text>
                    <Text style={styles.heroBrand}>{HERO.partner.brand}</Text>
                    <Text style={styles.heroProduct}>{HERO.productLabel}</Text>
                    <View style={styles.heroCtaRow}>
                      <Text style={styles.heroCtaText}>View the full listing</Text>
                      <ChevronRight size={14} color={colors.navy} />
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
              <ChevronRight size={14} color={colors.navy} />
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
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list:   { flex: 1 },

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
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginBottom: 6 },
  heroTagline: {
    fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.gold,
    letterSpacing: 0.6, marginBottom: 10,
  },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Hero product card
  heroCard: {
    backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.elevated,
  },
  heroCaption: { padding: 16 },
  heroFeaturedTag: {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.gold,
    letterSpacing: 1, marginBottom: 6,
  },
  heroBrand:   { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  heroProduct: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted, marginTop: 3 },
  heroCtaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  heroCtaText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.navy, borderBottomWidth: 1.5, borderBottomColor: colors.gold, paddingBottom: 1 },

  // Grid
  columnWrapper: { gap: 10, paddingHorizontal: spacing.md },
  tileWrap: { flex: 1, marginBottom: 10 },
  tileCaption: {
    backgroundColor: colors.white, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card,
    padding: 10, ...shadows.card,
  },
  tileBrand:    { fontFamily: fonts.serif, fontSize: 13.5, color: colors.navy },
  tileProduct:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 14 },
  tileDeal:     { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#145A3E', marginTop: 4 },
  tileCategory: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.light, marginTop: 4 },

  // Branded placeholder — hero and grid share the same recipe at two sizes.
  placeholderBase: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card,
  },
  placeholderHero: { height: 180 },
  placeholderGrid: { height: 118, borderRadius: 0 },
  placeholderLinesWrap: { ...StyleSheet.absoluteFillObject },
  placeholderLine: { position: 'absolute', left: '-15%', right: '-15%', height: 1, opacity: 0.14, transform: [{ rotate: '-8deg' }] },
  placeholderIconWrap: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.3, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  placeholderIconWrapHero: { width: 56, height: 56, borderRadius: 28 },
  placeholderMonogram: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.2, marginTop: 8, opacity: 0.85 },
  placeholderMonogramHero: { fontSize: 13, marginTop: 10 },
  placeholderTag: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.badge,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  placeholderTagText: { fontFamily: fonts.sansMedium, fontSize: 8.5, color: colors.muted },

  footerNote: {
    backgroundColor: 'rgba(30,58,95,0.05)', borderRadius: radius.button,
    padding: 14, marginTop: spacing.md,
  },
  footerNoteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center' },

  exploreMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 12, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  exploreMoreText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
})
