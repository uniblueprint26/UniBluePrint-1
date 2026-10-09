import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TrendingUp, Eye, Tag } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PartnerPortalScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [stats, setStats]     = useState(null) // row from get_my_partner_stats()
  const [linked, setLinked]   = useState(true) // false if no partner_users row exists yet

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
            <View style={styles.metricRow}>
              <View style={styles.metricTile}>
                <Eye size={14} color={colors.muted} />
                <Text style={styles.metricValue}>{stats.views ?? 0}</Text>
                <Text style={styles.metricLabel}>Deal Views</Text>
              </View>
              <View style={[styles.metricTile, styles.metricTileBorder]}>
                <Tag size={14} color={colors.muted} />
                <Text style={styles.metricValue}>{stats.claims ?? 0}</Text>
                <Text style={styles.metricLabel}>Deal Claims</Text>
              </View>
            </View>

            <Card style={styles.engagedCard}>
              <Text style={styles.engagedValue}>{stats.unique_engaged_users ?? 0}</Text>
              <Text style={styles.engagedLabel}>Unique users engaged with your deals</Text>
            </Card>

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },

  metricRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.card, padding: 16, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)' },
  metricTile: { flex: 1, gap: 4 },
  metricTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14, marginLeft: 4 },
  metricValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy },
  metricLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  engagedCard: { alignItems: 'center', marginTop: 12, paddingVertical: 20 },
  engagedValue: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy },
  engagedLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 4, textAlign: 'center' },

  footnote: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 14, lineHeight: 16, fontStyle: 'italic' },

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
