import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TrendingUp, Eye, Tag, Award, Percent } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import StatTile, { StatTileRow } from '../../components/ui/StatTile'
import PartnerTierBadge from '../../components/ui/PartnerTierBadge'
import FoundingPartnerBadge from '../../components/ui/FoundingPartnerBadge'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Option A/B payment-option labels — see docs/business/partner-tiering-framework.md.
// The actual rent/commission figures per tier are locked numbers in that doc,
// not something this screen hardcodes or recomputes; it only ever shows the
// stored payment_option value and, for Option B, the stored negotiated rate.
const PAYMENT_OPTION_LABEL = {
  fixed: 'Fixed (Option A)',
  negotiated: 'Negotiated (Option B)',
}

export default function PartnerPortalScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [stats, setStats]     = useState(null) // row from get_my_partner_stats()
  const [linked, setLinked]   = useState(true) // false if no partner_users row exists yet

  const [tierLoading, setTierLoading] = useState(true)
  const [tierError, setTierError]     = useState(null)
  const [tierStatus, setTierStatus]   = useState(null) // row from get_my_tier_status(), or null

  function backToMyBlueprint() {
    setPortalMode('personal')
    // React Navigation v7's navigate() pushes rather than pops, which would
    // grow the stack on every switch; popTo returns to the existing HomeMain.
    navigation.popTo('HomeMain')
  }

  function loadStats() {
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    supabase.rpc('get_my_partner_stats').then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        // Without this, a dropped connection left the spinner spinning
        // forever with no timeout, error, or retry path.
        setLoadError('Could not load your stats.')
      } else if (!data || data.length === 0) {
        setLinked(false)
      } else {
        setStats(data[0])
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }

  useEffect(loadStats, [user?.id])

  // Separate fetch/loading/error state from loadStats above — this is a
  // different RPC (get_my_tier_status()) with its own independent shape,
  // and a failure here must never hide the deal views/claims stats above
  // (or vice versa). Same "a user can be linked to more than one
  // partner/coach record" shape as get_my_partner_stats(); this screen is
  // the business-role Partner Portal, so only the first row is shown here.
  function loadTierStatus() {
    if (!user?.id) return
    let cancelled = false
    setTierLoading(true)
    setTierError(null)
    supabase.rpc('get_my_tier_status').then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setTierError('Could not load your tier and terms.')
      } else {
        setTierStatus((data && data[0]) || null)
      }
      setTierLoading(false)
    })
    return () => { cancelled = true }
  }

  useEffect(loadTierStatus, [user?.id])

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        eyebrow="PARTNER PORTAL"
        exitTo={{ label: 'My Blueprint', onPress: backToMyBlueprint }}
        title={stats?.partner_name || 'Your Performance'}
        style={styles.header}
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadStats} activeOpacity={0.7} style={styles.retryBtn} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !linked ? (
          <Card style={styles.unlinkedCard}>
            <Text style={styles.unlinkedText}>
              Your account isn't linked to a partner listing yet. Contact Operations to get your
              Partner Portal connected, once that's done your live deal views and claims will
              show here.
            </Text>
          </Card>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <TrendingUp size={14} color={colors.navy} />
              <Text style={styles.sectionEyebrow}>THIS PERIOD</Text>
            </View>
            <StatTileRow>
              <StatTile icon={Eye} iconBg="#EFF6FF" iconColor={colors.navy} value={stats.views ?? 0} label="Deal Views" border />
              <StatTile icon={Tag} iconBg="#FEF9C3" iconColor={colors.goldDeep} value={stats.claims ?? 0} label="Deal Claims" />
            </StatTileRow>

            <Card style={styles.engagedCard}>
              <Text style={styles.engagedValue}>{stats.unique_engaged_users ?? 0}</Text>
              <Text style={styles.engagedLabel}>Unique users engaged with your deals</Text>
            </Card>

            <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
              <Award size={14} color={colors.navy} />
              <Text style={styles.sectionEyebrow}>YOUR TIER & TERMS</Text>
            </View>
            {tierLoading ? (
              <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 8 }} />
            ) : tierError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{tierError}</Text>
                <TouchableOpacity onPress={loadTierStatus} activeOpacity={0.7} style={styles.retryBtn} accessibilityRole="button">
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Card style={styles.tierCard}>
                <View style={styles.tierBadgeRow}>
                  {tierStatus?.tier ? (
                    <PartnerTierBadge tier={tierStatus.tier} />
                  ) : (
                    <Text style={styles.tierUnsetText}>Not yet classified</Text>
                  )}
                  <FoundingPartnerBadge founding={!!tierStatus?.founding_badge} />
                </View>

                <View style={styles.tierRow}>
                  <Text style={styles.tierRowLabel}>Payment option</Text>
                  <Text style={styles.tierRowValue}>
                    {PAYMENT_OPTION_LABEL[tierStatus?.payment_option] || 'Not yet set'}
                  </Text>
                </View>

                {tierStatus?.payment_option === 'negotiated' && (
                  <View style={styles.negotiatedBox}>
                    <View style={styles.negotiatedHeaderRow}>
                      <Percent size={13} color={colors.goldDeep} />
                      <Text style={styles.negotiatedRate}>
                        {tierStatus?.negotiated_commission_pct != null
                          ? `${tierStatus.negotiated_commission_pct}% commission`
                          : 'Rate on file with Finance'}
                      </Text>
                    </View>
                    {!!tierStatus?.negotiated_rationale && (
                      <Text style={styles.negotiatedRationale}>“{tierStatus.negotiated_rationale}”</Text>
                    )}
                    {!!tierStatus?.negotiated_effective_from && (
                      <Text style={styles.negotiatedEffective}>
                        Effective from {new Date(tierStatus.negotiated_effective_from).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            )}

            <Text style={styles.footnote}>
              Category: {stats.category || 'Uncategorised'}. Figures update as members view and
              claim your deals in the Lifestyle Blueprint.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },

  engagedCard: { alignItems: 'center', marginTop: 12, paddingVertical: 20 },
  engagedValue: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy },
  engagedLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 4, textAlign: 'center' },

  footnote: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 14, lineHeight: 16, fontStyle: 'italic' },

  tierCard: {},
  tierBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tierUnsetText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  tierRowLabel: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted },
  tierRowValue: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy },
  negotiatedBox: {
    marginTop: 12, padding: 12, borderRadius: radius.button,
    backgroundColor: '#FFFBEB',
  },
  negotiatedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  negotiatedRate: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.goldDeep },
  negotiatedRationale: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, fontStyle: 'italic', marginTop: 6, lineHeight: 17 },
  negotiatedEffective: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 6 },

  unlinkedCard: { marginTop: 10 },
  unlinkedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },

  errorBox: {
    marginTop: 10, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  errorText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(220,38,38,0.1)' },
  retryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.destructive },
  })
}
