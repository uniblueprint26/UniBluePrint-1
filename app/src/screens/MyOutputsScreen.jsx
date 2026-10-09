import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CheckCircle, FileText, Inbox, Clock } from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import StatTile, { StatTileRow } from '../components/ui/StatTile'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// "My Outputs" — a student's own submission history and completed
// documents. There's no in-app document viewer/download yet (delivery is a
// notification + off-app handoff, see GenerationSubmittedScreen), so this is
// a status tracker: what you've submitted, where it is, and what's ready.

const STAGE_LABEL = {
  submitted:  'Submitted',
  in_queue:   'In Queue',
  assigned:   'Assigned',
  in_review:  'In Review',
  delivered:  'Delivered',
}
const STAGE_COLOR = {
  submitted:  { fg: '#B45309', bg: '#FEF3C7' },
  in_queue:   { fg: '#B45309', bg: '#FEF3C7' },
  assigned:   { fg: '#1d4ed8', bg: '#EFF6FF' },
  in_review:  { fg: '#1d4ed8', bg: '#EFF6FF' },
  delivered:  { fg: '#15803D', bg: '#F0FDF4' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OutputRow({ row, isLast }) {
  const stageColor = STAGE_COLOR[row.stage] || STAGE_COLOR.submitted
  const delivered = row.stage === 'delivered'
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.rowIcon, { backgroundColor: delivered ? '#F0FDF4' : '#EFF6FF' }]}>
        {delivered
          ? <CheckCircle size={16} color="#15803D" strokeWidth={1.8} />
          : <FileText size={16} color={colors.navy} strokeWidth={1.8} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{row.services?.name || 'Service'}</Text>
        <Text style={styles.rowMeta}>
          {row.tier === 'premium' ? 'Premium' : 'Standard'} · Submitted {formatDate(row.submitted_at)}
          {delivered ? ` · Delivered ${formatDate(row.delivered_at)}` : ''}
        </Text>
      </View>
      <View style={[styles.stagePill, { backgroundColor: stageColor.bg }]}>
        <Text style={[styles.stagePillText, { color: stageColor.fg }]}>{STAGE_LABEL[row.stage] || row.stage}</Text>
      </View>
    </View>
  )
}

export default function MyOutputsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, stage, tier, submitted_at, delivered_at, services(name)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
      if (!error && data) setRows(data)
    } catch {
      /* best effort — leave whatever we already had */
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function onRefresh() {
    setRefreshing(true)
    await load()
  }

  const deliveredCount = rows.filter(r => r.stage === 'delivered').length
  const queuedCount = rows.filter(r => ['submitted', 'in_queue', 'assigned'].includes(r.stage)).length
  const inReviewCount = rows.filter(r => r.stage === 'in_review').length

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={() => navigation.goBack()}
        backLabel="Home"
        logoCenter={<UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />}
        eyebrow="MY OUTPUTS"
        title="Your Completed Documents"
        subtitle={deliveredCount > 0
          ? `${deliveredCount} document${deliveredCount !== 1 ? 's' : ''} delivered so far.`
          : 'Every service you order and everything a Campus Handler delivers back to you shows up here.'}
        style={styles.heroBlock}
        titleStyle={styles.heroTitle}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading your outputs...</Text>
        ) : rows.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={36} color="rgba(30,58,95,0.2)" />
            <Text style={styles.emptyTitle}>Nothing here yet.</Text>
            <Text style={styles.emptySub}>
              Order a CV, cover letter, or any other Foundation Blueprint service and it'll be tracked here from submission to delivery.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Foundation')}
            >
              <Text style={styles.emptyBtnText}>Go to Foundation Blueprint</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            {/* MyOutputs is the one screen most students will treat as their
                own dashboard — give it the same stat-tile authority the
                portal dashboards have, not just a flat list. */}
            <StatTileRow style={{ marginBottom: spacing.md }}>
              <StatTile icon={Inbox} iconBg="#EFF6FF" iconColor={colors.navy} value={queuedCount} label="Queued" border />
              <StatTile icon={Clock} iconBg="#FEF9C3" iconColor={colors.goldDeep} value={inReviewCount} label="In Review" border />
              <StatTile icon={CheckCircle} iconBg="#F0FDF4" iconColor={colors.success} value={deliveredCount} label="Delivered" />
            </StatTileRow>
            <Card style={{ padding: 0 }}>
              {rows.map((row, i) => (
                <OutputRow key={row.id} row={row} isLast={i === rows.length - 1} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginTop: 6, marginBottom: 8 },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  loadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 40 },

  emptyCard: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, marginTop: 6 },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  emptyBtn: { marginTop: 10, backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 20, paddingVertical: 12, ...shadows.card },
  emptyBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  rowMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  stagePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  stagePillText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },
})
