import { useEffect, useRef, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Map as MapIcon, Heart, PiggyBank, Phone, ChevronRight,
} from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import PartnerPicture, { hasPicture } from '../components/lifestyle/PartnerPicture'
import { PILLARS } from '../constants/pillars'
import { PartnerDetailSheet, PartnerExpandCard } from '../components/lifestyle/PartnerCards'
import {
  FEATURED_DEALS, HERO, GRID, DealTile, ProductPlaceholder, getCollectionStyles,
} from '../components/lifestyle/CollectionTiles'
import RedemptionCodeSheet from '../components/lifestyle/RedemptionCodeSheet'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
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
// Live partners for the swipe rail: those with a picture first, in roster order.
const LIVE_PARTNERS = PARTNERS.filter(p => p.status === 'live')
const PARTNER_RAIL = [...LIVE_PARTNERS.filter(hasPicture), ...LIVE_PARTNERS.filter(p => !hasPicture(p))].slice(0, 14)

const PREVIEW_COUNT = 2
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
    
    screen: 'LifestylePartners',
  },
  {
    key: 'wellbeing', label: 'Wellbeing', Icon: Heart,
    screen: 'LifestyleWellbeing',
  },
  {
    key: 'budgeting', label: 'Budgeting', Icon: PiggyBank,
    screen: 'LifestyleBudgetingPreview',
  },
]

export default function LifestyleScreen({ navigation, route }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const collectionStyles = getCollectionStyles(colors)
  const insets = useSafeAreaInsets()

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
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          title="Lifestyle"
          subtitle="Our partners, local discounts and wellbeing support."
          right={<View style={[styles.pillarMark, { backgroundColor: PILLARS.lifestyle.color + '22' }]}><Heart size={22} color={PILLARS.lifestyle.color} strokeWidth={1.8} /></View>}
        />

        <View style={styles.content}>
          <View style={styles.chipRow}>
            {SECONDARY_FEATURES.map(f => (
              <TouchableOpacity
                key={f.key}
                style={styles.chip}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(f.screen)}
                accessibilityRole="button"
                accessibilityLabel={f.label}
              >
                <f.Icon size={16} color={colors.textPrimary} strokeWidth={1.8} />
                <Text style={styles.chipLabel} numberOfLines={1}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Crisis support never waits behind a tap. */}
          <TouchableOpacity
            style={styles.crisisStrip}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('tel:116123')}
            accessibilityRole="button"
            accessibilityLabel="Call Samaritans on 116 123"
          >
            <View style={styles.crisisIconWrap}>
              <Phone size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.crisisTitle}>Need to talk right now?</Text>
              <Text style={styles.crisisSub}>Samaritans, 116 123, free 24 hours</Text>
            </View>
            <Text style={styles.crisisLink} onPress={() => navigation.navigate('LifestyleWellbeing')}>More</Text>
          </TouchableOpacity>

          {/* Our real partners, with pictures of their places and work. */}
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Our partners</Text>
              <Text style={styles.sectionSub}>{LIVE_PARTNER_COUNT} real partners, many with local discounts.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('LifestylePartners')} accessibilityRole="button" accessibilityLabel="See all partners" style={styles.seeAllLink}>
              <Text style={styles.seeAllLinkText}>See all</Text>
              <ChevronRight size={16} color={PILLARS.lifestyle.color} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerRail}>
            {PARTNER_RAIL.map(p => (
              <TouchableOpacity key={p.id} style={styles.partnerCard} activeOpacity={0.88} onPress={() => setDetailPartnerId(p.id)} accessibilityRole="button" accessibilityLabel={`${p.brand}, ${p.category}`}>
                <PartnerPicture partner={p} height={104} />
                <View style={styles.partnerCaption}>
                  <Text style={styles.partnerName} numberOfLines={1}>{p.brand}</Text>
                  <Text style={styles.partnerCat} numberOfLines={1}>{p.category}</Text>
                  {!!p.deal && <Text style={styles.partnerDeal} numberOfLines={2}>{p.deal}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* The Collection */}
          <View style={[styles.sectionHead, { marginTop: spacing.xl }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>The Collection</Text>
              <Text style={styles.sectionSub}>Real products from our partners. No checkout, just a direct line to claim it.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('LifestyleFeaturedDeals')} accessibilityRole="button" accessibilityLabel="See all in the Collection" style={styles.seeAllLink}>
              <Text style={styles.seeAllLinkText}>See all</Text>
              <ChevronRight size={16} color={PILLARS.lifestyle.color} />
            </TouchableOpacity>
          </View>

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
                  <DealTile key={item.id} item={item} revealed onPress={() => setExpandPartnerId(item.id)} />
                ))}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.75} onPress={() => navigation.navigate('LifestyleFeaturedDeals')}>
            <Text style={styles.seeAllText}>See all {FEATURED_DEALS.length} items in the Collection</Text>
            <ChevronRight size={14} color={colors.textPrimary} />
          </TouchableOpacity>
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
  const pink = PILLARS.lifestyle.color
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  pillarMark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary },

  crisisStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 14,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  crisisIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: pink, alignItems: 'center', justifyContent: 'center' },
  crisisTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  crisisSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  crisisLink: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.textPrimary, paddingHorizontal: 6, paddingVertical: 8 },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
  sectionSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 2 },
  seeAllLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  seeAllLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: pink },

  partnerRail: { gap: 12, paddingRight: spacing.md },
  partnerCard: {
    width: 154, borderRadius: radius.card, overflow: 'hidden',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  partnerCaption: { padding: 12, gap: 2 },
  partnerName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  partnerCat: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary },
  partnerDeal: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.goldText, marginTop: 6, lineHeight: 17 },

  previewGrid: { marginTop: spacing.md },
  previewRow: { flexDirection: 'row', gap: 10 },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 4, paddingVertical: 14, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  seeAllText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  })
}
