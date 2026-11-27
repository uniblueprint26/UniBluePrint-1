import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Map as MapIcon, Heart, PiggyBank, Phone, ChevronRight, Search, X, Navigation,
} from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { PILLARS } from '../constants/pillars'
import { PartnerDetailSheet, PartnerExpandCard, FILTERS } from '../components/lifestyle/PartnerCards'
import PartnerWallet, { PartnerSpotlightStrip } from '../components/lifestyle/wallet/PartnerWallet'
import OpenCard from '../components/lifestyle/wallet/OpenCard'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import { useComingSoonEnabled } from '../constants/comingSoon'
import { useWallet } from '../lib/walletStore'
import { usePartnerUpdates } from '../hooks/usePartnerUpdates'
import { getCardConfig } from '../data/partnerCards'
import { pillarTint } from '../constants/pillarTints'
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


// How many grid tiles (beyond the hero) the hub shows inline before handing
// off to the full "see all" screen — "shouldn't have to open [the shop],
// should just be there" (founder), so the real products live here, not
// behind a single summary tile. Capped rather than showing the whole
// 19-item roster inline: a 2-up grid of 4 (2 rows) plus the hero reads as
// a generous taste of the shop without turning the hub itself into the
// full storefront — LifestyleFeaturedDealsScreen stays the place for that.
const LIVE_PARTNERS = PARTNERS.filter(p => p.status === 'live')
const SHELL_PARTNERS = PARTNERS.filter(p => p.status === 'shell')

// Fisher-Yates. The wallet is shuffled every time the screen is opened.
function shuffled(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

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

  // Deal wallet: shuffled on every visit, favourites pinned first (see PartnerWallet).
  const { isDark } = useTheme()
  const { height: winH } = useWindowDimensions()
  const wallet = useWallet()
  const comingSoonOn = useComingSoonEnabled()
  const order = useMemo(() => shuffled(LIVE_PARTNERS), [])
  const cfgCache = useRef({})
  const getCfg = p => (cfgCache.current[p.id] ||= getCardConfig(p))
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [soonOpen, setSoonOpen] = useState(false)
  const [open, setOpen] = useState(null)   // { id, originY }
  const rootRef = useRef(null)
  const accent = pillarTint('lifestyle', isDark)
  const q = query.trim().toLowerCase()
  const visiblePartners = order.filter(p => (filter === 'all' || p.filterKey === filter) && (!q || p.brand.toLowerCase().includes(q)))
  const updates = usePartnerUpdates(LIVE_PARTNERS)
  const openPartner = open ? LIVE_PARTNERS.find(p => p.id === open.id) : null

  // Tapping a card: work out where it sits on the screen so the open card can rise from there.
  function openCard(partner, cardRef) {
    const fallback = () => setOpen({ id: partner.id, originY: Math.round(winH * 0.55) })
    if (!cardRef?.current || !rootRef.current?.measureInWindow) { fallback(); return }
    try {
      rootRef.current.measureInWindow((_rx, ry) => {
        cardRef.current.measureInWindow((_cx, cy) => {
          if (Number.isFinite(cy) && Number.isFinite(ry)) setOpen({ id: partner.id, originY: Math.round(cy - ry) })
          else fallback()
        })
      })
    } catch { fallback() }
  }

  // A highlight arriving from a deep link (a Home Spotlight card, a coach cross-link,
  // a partner profile's deal card) opens that partner's card in the wallet.
  // Ref-guarded so it only fires once per param, not every re-render.
  const forwardedHighlight = useRef(null)
  useEffect(() => {
    const id = route?.params?.highlightId
    if (id && forwardedHighlight.current !== id) {
      forwardedHighlight.current = id
      const p = LIVE_PARTNERS.find(x => x.id === id)
      if (p) openCard(p, null)
      else navigation.navigate('LifestylePartners', { highlightId: id })
    }
  }, [route?.params?.highlightId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.screen} ref={rootRef} collapsable={false}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        style={styles.scrollView}
        scrollEnabled={!open}
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

          {/* Crisis support never waits behind a tap. Kept slim. */}
          <TouchableOpacity
            style={styles.crisisStrip}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('tel:116123')}
            accessibilityRole="button"
            accessibilityLabel="Call Samaritans on 116 123"
          >
            <View style={styles.crisisIconWrap}>
              <Phone size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.crisisTitle} numberOfLines={1}>Need to talk? Samaritans 116 123</Text>
            </View>
            <Text style={styles.crisisLink} onPress={() => navigation.navigate('LifestyleWellbeing')} accessibilityRole="button" accessibilityLabel="More wellbeing support">More</Text>
          </TouchableOpacity>
        </View>

        {/* Deal wallet: category chips and a search box. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={{ flexGrow: 0 }}>
          {FILTERS.map(f => {
            const on = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.85}
                style={[styles.filterChip, on && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${f.label} partners`}
              >
                <Text style={[styles.filterLabel, on && { color: colors.accentFg }]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
          {comingSoonOn && (
            <TouchableOpacity onPress={() => setSoonOpen(true)} activeOpacity={0.85} style={styles.filterChip} accessibilityRole="button" accessibilityLabel="Near me, coming soon">
              <Navigation size={14} color={colors.textPrimary} strokeWidth={1.9} />
              <Text style={styles.filterLabel}>Near me</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={17} color={colors.textSecondary} strokeWidth={1.9} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search partners"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search partners by name"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clearBtn}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {comingSoonOn && (
            <TouchableOpacity onPress={() => setSoonOpen(true)} activeOpacity={0.85} style={styles.mapBtn} accessibilityRole="button" accessibilityLabel="Map, coming soon">
              <MapIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={styles.filterLabel}>Map</Text>
            </TouchableOpacity>
          )}
        </View>

        {comingSoonOn && (
          <TouchableOpacity onPress={() => setSoonOpen(true)} activeOpacity={0.9} style={styles.teaser} accessibilityRole="button" accessibilityLabel="Find partners near you. The map is coming soon.">
            <MapIcon size={20} color={accent} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={styles.teaserTitle}>Find partners near you.</Text>
              <Text style={styles.teaserSub}>The map is coming soon.</Text>
            </View>
          </TouchableOpacity>
        )}

        <PartnerSpotlightStrip updates={updates} getCfg={getCfg} onOpen={openCard} />

        {visiblePartners.length === 0 && comingSoonOn === false ? (
          <Text style={styles.empty}>No partners match. Try another word or category.</Text>
        ) : null}

        <PartnerWallet
          partners={visiblePartners}
          soon={comingSoonOn && filter === 'all' && !q ? SHELL_PARTNERS : []}
          getCfg={getCfg}
          wallet={wallet}
          hiddenId={open?.id}
          onOpen={openCard}
        />

        <View style={styles.content}>
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

      {openPartner && (
        <OpenCard
          key={openPartner.id}
          partner={openPartner}
          cfg={getCfg(openPartner)}
          originY={open.originY}
          onClose={() => setOpen(null)}
          onViewProfile={pid => { setOpen(null); navigation.navigate('PartnerProfile', { partnerId: pid }) }}
        />
      )}
      <ComingSoonSheet visible={soonOpen} onClose={() => setSoonOpen(false)} />

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
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.sm, marginBottom: spacing.xs,
    paddingVertical: 4, paddingHorizontal: 2, minHeight: 44,
  },
  crisisIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: pink, alignItems: 'center', justifyContent: 'center' },
  crisisTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
  crisisSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },

  filterRow: { paddingHorizontal: spacing.md, gap: 8, paddingBottom: 12, paddingTop: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, marginBottom: 16 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, paddingVertical: 8, outlineStyle: 'none' },
  clearBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 46, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  teaser: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.md, marginBottom: 16, padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 56,
  },
  teaserTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  teaserSub: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, marginTop: 1 },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, paddingHorizontal: spacing.md, marginBottom: 12 },
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
