/**
 * LifestylePartnersScreen — the full, uncapped Lifestyle partner listing as
 * its own standalone screen (reached via the "Explore N more" button on
 * LifestyleScreen's own short preview grid, not an in-place accordion below
 * the fold). Same filter pills, category-grouped grid, Coming Soon grid, and
 * PartnerDetailSheet as the hub — all shared from components/lifestyle/
 * PartnerCards so a card looks and opens identically wherever it's tapped.
 * Route params: { filterKey? } — carries over whichever filter was active
 * on the hub when "Explore more" was tapped.
 */
import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Lock } from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import SectionHeader from '../components/ui/SectionHeader'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import {
  FILTERS, CategorySectionHeader, ComingSoonGridCard, PartnerGridCard, PartnerDetailSheet,
  styles as partnerStyles,
} from '../components/lifestyle/PartnerCards'
import { colors, fonts, spacing } from '../constants/theme'
import { PARTNERS } from '../data/lifestylePartners'

export default function LifestylePartnersScreen({ navigation, route }) {
  const [activeFilter, setActiveFilter] = useState(route?.params?.filterKey || 'all')
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [detailPartnerId, setDetailPartnerId] = useState(null)

  const liveVisible = PARTNERS.filter(p =>
    p.status === 'live' && (activeFilter === 'all' || p.filterKey === activeFilter))
  const soonVisible = PARTNERS.filter(p =>
    p.status === 'shell' && (activeFilter === 'all' || p.filterKey === activeFilter))

  // Grouped into sections when browsing everything; a single filter already
  // does the grouping for you, so headers would just repeat the filter pill.
  const showSectionHeaders = activeFilter === 'all'
  const liveGroups = showSectionHeaders
    ? FILTERS
        .filter(f => f.key !== 'all')
        .map(f => ({ key: f.key, items: liveVisible.filter(p => p.filterKey === f.key) }))
        .filter(g => g.items.length > 0)
    : [{ key: activeFilter, items: liveVisible }]

  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null

  return (
    <View style={styles.screen}>
      <TopBar navigation={navigation} showBack />

      {/* Wrapped in an extra plain View with flex:1 (not just the ScrollView's
          own style) as defensive hardening against a Fabric/New-Architecture
          initial-layout race documented in ef69ca81 — forces Yoga to resolve
          a concrete height for a plain View first, then lets the ScrollView
          fill that already-measured box, on top of the ScrollView's own
          explicit style={{flex:1}} below. */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
            <Text style={styles.heroTitle}>All Partners</Text>
            <Text style={styles.heroSub}>
              Every confirmed Lifestyle Blueprint partner and deal, plus who's launching soon.
            </Text>
          </View>

          <View style={styles.section}>
            <SectionHeader eyebrow="Confirmed Partners" title="Partner Listings" />

            {/* Filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={partnerStyles.filterScroll}
              contentContainerStyle={partnerStyles.filterContent}
            >
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[partnerStyles.filterPill, activeFilter === f.key && partnerStyles.filterPillActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[partnerStyles.filterPillText, activeFilter === f.key && partnerStyles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Live partners, grouped by category, as a real 2-up square
                grid — tapping a tile opens the full listing in a sheet
                rather than expanding in place, so the grid stays a grid. */}
            {liveGroups.map(group => (
              <View key={group.key} style={{ marginBottom: spacing.lg }}>
                {showSectionHeaders && <CategorySectionHeader filterKey={group.key} />}
                <View style={partnerStyles.partnerGrid}>
                  {group.items.map(p => (
                    <PartnerGridCard
                      key={p.id}
                      partner={p}
                      onPress={() => setDetailPartnerId(p.id)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {liveVisible.length === 0 && soonVisible.length === 0 && (
              <Text style={partnerStyles.emptyText}>No partners in this category yet.</Text>
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

      <PartnerDetailSheet
        partner={detailPartner}
        visible={!!detailPartner}
        onClose={() => setDetailPartnerId(null)}
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
  scroll: { paddingBottom: 56 },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
})
