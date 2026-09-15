/**
 * LifestylePartnersScreen ("Explore") — one of the 4 standalone Lifestyle
 * destinations (see LifestyleScreen, the hub they're all reached from).
 * File/route name kept as LifestylePartners for continuity with existing
 * navigation registrations and deep links (Elevation's cross-links, the
 * hub's own highlightId forwarding) — the display name is "Explore".
 *
 * The Ireland map and the full partner roster used to be an either/or
 * Grid/Map toggle on the old combined Lifestyle screen, then a flat
 * filter-pill + grid layout. Now it's a collapsible category → list → card
 * pattern: each category (pulled straight from PartnerCards' shared
 * CATEGORY_META/FILTERS, never hardcoded here) is its own accordion section
 * — tap the header to expand/collapse it — and an expanded category reveals
 * a plain list of its live partners. Tapping a partner in that list opens
 * the same click-to-expand PartnerExpandCard The Collection uses (photo,
 * brand, social handle), which itself can drill into the full
 * PartnerDetailSheet for pricing/services/contact — one consistent
 * "list → card → full detail" path across both screens rather than a third
 * interaction variant.
 */
import { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Lock } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import SectionHeader from '../components/ui/SectionHeader'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import PartnerMap from '../components/ui/PartnerMap'
import {
  FILTERS, ComingSoonGridCard, CategoryAccordion, PartnerExpandCard, PartnerDetailSheet,
  styles as partnerStyles,
} from '../components/lifestyle/PartnerCards'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { PARTNERS } from '../data/lifestylePartners'

const CATEGORY_KEYS = FILTERS.filter(f => f.key !== 'all').map(f => f.key)

export default function LifestylePartnersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [expandPartnerId, setExpandPartnerId] = useState(null)
  const [detailPartnerId, setDetailPartnerId] = useState(route?.params?.highlightId || null)
  const [mapHighlightId, setMapHighlightId] = useState(null)
  const highlightId = mapHighlightId || route?.params?.highlightId

  // A category arriving already-highlighted (deep link, or the map's "view
  // full listing") should open expanded, not buried behind a collapsed
  // header the person then has to find and tap themselves.
  const initialExpanded = useMemo(() => {
    if (!highlightId) return new Set()
    const target = PARTNERS.find(p => p.id === highlightId)
    return target ? new Set([target.filterKey]) : new Set()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- deliberately one-time seed, see toggle/expand logic below
  const [expandedKeys, setExpandedKeys] = useState(initialExpanded)

  function toggleCategory(key) {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Live partners grouped dynamically by category — pulled straight from
  // lifestylePartners.js every render, nothing hardcoded here.
  const categoryGroups = CATEGORY_KEYS
    .map(key => ({ key, items: PARTNERS.filter(p => p.status === 'live' && p.filterKey === key) }))
    .filter(g => g.items.length > 0)
  const liveCount = categoryGroups.reduce((n, g) => n + g.items.length, 0)
  const soonVisible = PARTNERS.filter(p => p.status === 'shell')

  const expandPartner = PARTNERS.find(p => p.id === expandPartnerId) || null
  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null

  // Tapping "View full listing" on the map's info card jumps straight to
  // that partner's full detail sheet and expands its category, same
  // behaviour the old combined Grid/Map screen had.
  function handleViewListing(id) {
    const target = PARTNERS.find(p => p.id === id)
    setMapHighlightId(id)
    if (target) setExpandedKeys(prev => new Set(prev).add(target.filterKey))
    setDetailPartnerId(id)
  }

  return (
    <View style={styles.screen}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
        >
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

            <Text style={styles.heroEyebrow}>LIFESTYLE · EXPLORE</Text>
            <Text style={styles.heroTitle}>Explore</Text>
            <Text style={styles.heroSub}>
              Every confirmed Lifestyle Blueprint partner and deal, on the map and by category below.
            </Text>
          </View>

          <View style={styles.section}>
            {/* Map — always visible here, not behind a toggle. */}
            <View style={styles.mapSection}>
              <PartnerMap onViewListing={handleViewListing} />
            </View>

            <SectionHeader
              eyebrow={`${liveCount} live partners`}
              title="Browse by category"
              style={{ marginTop: spacing.xl }}
            />
            <Text style={styles.hint}>Tap a category to open it, then tap a partner for a quick look.</Text>

            {/* Categories, each a collapsible section → a plain list of its
                live partners → the click-to-expand card on tap. */}
            {categoryGroups.map(group => (
              <CategoryAccordion
                key={group.key}
                filterKey={group.key}
                items={group.items}
                expanded={expandedKeys.has(group.key)}
                onToggle={() => toggleCategory(group.key)}
                onPressPartner={setExpandPartnerId}
                highlightId={highlightId}
              />
            ))}

            {categoryGroups.length === 0 && soonVisible.length === 0 && (
              <Text style={partnerStyles.emptyText}>No partners yet.</Text>
            )}

            {/* Coming Soon — compact grid, separate from the live listings */}
            {soonVisible.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <View style={partnerStyles.soonHeaderRow}>
                  <Lock size={12} color={colors.muted} />
                  <Text style={partnerStyles.soonHeaderText}>Coming Soon · Locked Until Launch</Text>
                </View>
                <View style={partnerStyles.soonGrid}>
                  {soonVisible.map(p => (
                    <ComingSoonGridCard key={p.id} partner={p} onPress={() => setComingSoonOpen(true)} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <PartnerExpandCard
        partner={expandPartner}
        visible={!!expandPartner}
        onClose={() => setExpandPartnerId(null)}
        onViewFull={id => setDetailPartnerId(id)}
      />
      <PartnerDetailSheet
        partner={detailPartner}
        visible={!!detailPartner}
        onClose={() => { setDetailPartnerId(null); setMapHighlightId(null) }}
        navigation={navigation}
      />
      <ComingSoonSheet visible={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView
  // reliably fills the space below the fixed navy header on every platform —
  // same pattern as every other screen-root ScrollView in the app.
  scrollView: { flex: 1 },
  scroll: {},

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

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  mapSection: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: spacing.md,
  },
  hint: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    marginTop: -6, marginBottom: 14,
  },
})
