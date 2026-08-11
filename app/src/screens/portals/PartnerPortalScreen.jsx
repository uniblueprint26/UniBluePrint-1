import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, TrendingUp, Eye, Tag } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PartnerPortalScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null) // row from get_my_partner_stats()
  const [linked, setLinked]   = useState(true) // false if no partner_users row exists yet

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase.rpc('get_my_partner_stats').then(({ data }) => {
      if (cancelled) return
      if (!data || data.length === 0) {
        setLinked(false)
      } else {
        setStats(data[0])
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerEyebrow}>PARTNER PORTAL</Text>
          <TouchableOpacity style={styles.backLink} activeOpacity={0.75} onPress={backToMyBlueprint}>
            <ArrowLeftRight size={12} color="rgba(245,240,232,0.6)" strokeWidth={2} />
            <Text style={styles.backLinkText}>My Blueprint</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{stats?.partner_name || 'Your Performance'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 40 }} />
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
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
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
})
