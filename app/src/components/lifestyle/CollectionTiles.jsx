/**
 * CollectionTiles — "The Collection" building blocks shared between
 * LifestyleScreen (the hub, showing an inline preview) and
 * LifestyleFeaturedDealsScreen (the standalone "see all" screen), so the
 * curated roster, the branded placeholder art, and the grid tile look and
 * behave identically wherever The Collection is rendered. Extracted out of
 * LifestyleFeaturedDealsScreen so the two screens don't duplicate this data
 * + markup — same split PartnerCards.jsx already does for Explore's partner
 * cards.
 *
 * Curated, not comprehensive: only partners who genuinely sell something
 * showcase-able — a physical product (Z Vision Apparel's embroidery,
 * Saiemsent/Elect's clothing, Eabakeditt's bakes), an itemised "look" menu
 * (nail/lash sets, a signature cut), or a tangible creative deliverable
 * (prints, brand/web packages, photo & video work) — appear here. Ongoing
 * coaching/training/retainer relationships (MPFitness, Energie, JMC,
 * Camila's PT, LEVA's marketing retainer, Whip Wizardz' automotive
 * services, Roomy's housing platform, Nyz3ditz's mentorship subscription)
 * are deliberately left out: there's no single "item" to put in a hero
 * spot or a grid tile for a membership or a monthly retainer, and this is
 * what actually separates a Collection item from the full Explore roster.
 */
import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native'
import {
  ShoppingBag, Sparkles, UtensilsCrossed, Wrench, Camera as CameraIcon,
} from 'lucide-react-native'
import { CATEGORY_META } from './PartnerCards'
import { fonts, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PARTNERS } from '../../data/lifestylePartners'

// ─── Curated roster ───────────────────────────────────────────────────────────
// id -> productLabel (a display name for what's being shown; the partner's
// own `category`/`deal` fields are pulled straight from lifestylePartners.js,
// nothing duplicated here). First entry is the hero spot.
export const FEATURED_DEALS = [
  { id: 'zvisionapparel',    productLabel: 'Custom Embroidered Hoodie' },
  { id: 'saiemsent',         productLabel: 'Signature Streetwear Drop' },
  { id: 'elect',             productLabel: 'Faith-Led Streetwear' },
  { id: 'pouvoirs',          productLabel: 'Gallery Pieces & Prints' },
  { id: 'secondnature',      productLabel: 'Signature Clothing Piece' },
  { id: 'njoy',              productLabel: 'Bar & Drinks Menu' },
  { id: 'styledbybene',      productLabel: 'Personal Styling Session' },
  { id: 'islandsips',        productLabel: 'Tropical Drinks Menu' },
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

export const HERO = FEATURED_DEALS[0]
export const GRID = FEATURED_DEALS.slice(1)

const CATEGORY_ICON_FALLBACK = { fitness: ShoppingBag, beauty: Sparkles, fashion: ShoppingBag, food: UtensilsCrossed, services: Wrench }

// ─── Branded placeholder tile — structurally ready for a real photo: pass
// `partner.productImage` (a Storage URL, once one exists) and this renders
// that Image instead, with the exact same caption layout around it. Until
// then, falls back to the partner's real bundled `hero`/`logo` photo
// (letterboxed, never cropped — same rule as PartnerHeroImage elsewhere)
// when one exists. Only partners with neither get the honest "no photo
// yet" sketch treatment — a soft blueprint-sketch texture in the
// category's accent colour, the category icon, and the partner's
// monogram — never a fake stock photo standing in. ─────────────────────────
export function ProductPlaceholder({ partner, hero }) {
  const { colors } = useTheme()
  const styles = getCollectionStyles(colors)
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

  const bundledPhoto = partner.hero || partner.logo
  if (bundledPhoto) {
    return (
      <View style={[
        styles.placeholderBase, hero ? styles.placeholderHero : styles.placeholderGrid,
        { backgroundColor: `${accent}0D` },
      ]}>
        <Image source={bundledPhoto} style={styles.placeholderPhoto} resizeMode="contain" />
      </View>
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

// ─── Grid tile — fades + scales in the first time it's revealed (driven by
// a FlatList's viewability callback on the full "see all" screen, or just
// passed `revealed` straight away for a short, already-on-screen preview
// like the hub's), then stays put. ──────────────────────────────────────────
export function DealTile({ item, revealed, onPress }) {
  const { colors } = useTheme()
  const styles = getCollectionStyles(colors)
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

// ─── Hero product card — the "this week's feature" spot, shared between
// the hub's preview and the full "see all" screen's own hero. ──────────────
export function CollectionHeroCard({ item, onPress }) {
  const { colors } = useTheme()
  const styles = getCollectionStyles(colors)
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.heroCard}>
        <ProductPlaceholder partner={item.partner} hero />
        <View style={styles.heroCaption}>
          <Text style={styles.heroFeaturedTag}>THIS WEEK'S FEATURE</Text>
          <Text style={styles.heroBrand}>{item.partner.brand}</Text>
          <Text style={styles.heroProduct}>{item.productLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles shared by the hero card, grid tile, and branded placeholder
// above — both screens that render Collection items pull from here so they
// stay pixel-identical. ──────────────────────────────────────────────────────
export function getCollectionStyles(colors) {
  return StyleSheet.create({
  // Hero product card
  heroCard: {
    backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', ...shadows.elevated,
  },
  heroCaption: { padding: 16 },
  heroFeaturedTag: {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.gold,
    letterSpacing: 1, marginBottom: 6,
  },
  heroBrand:   { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  heroProduct: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted, marginTop: 3 },
  heroCtaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  heroCtaText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.textPrimary, borderBottomWidth: 1.5, borderBottomColor: colors.gold, paddingBottom: 1 },

  // Grid tile
  tileWrap: { flex: 1, marginBottom: 10 },
  tileCaption: {
    backgroundColor: colors.surface, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card,
    padding: 10, ...shadows.card,
  },
  tileBrand:    { fontFamily: fonts.serif, fontSize: 13.5, color: colors.textPrimary },
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
  placeholderPhoto: { width: '100%', height: '100%' },
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
  })
}
