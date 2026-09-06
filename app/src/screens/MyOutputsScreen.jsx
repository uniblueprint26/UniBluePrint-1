import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { ChevronLeft, CheckCircle, FileText } from 'lucide-react-native'
import Card from '../components/ui/Card'
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

  return (
    <View style={styles.screen}>
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
        <Text style={styles.heroEyebrow}>MY OUTPUTS</Text>
        <Text style={styles.heroTitle}>Your Completed Documents</Text>
        <Text style={styles.heroSub}>
          {deliveredCount > 0
            ? `${deliveredCount} document${deliveredCount !== 1 ? 's' : ''} delivered so far.`
            : 'Every service you order and everything a Campus Handler delivers back to you shows up here.'}
        </Text>
      </View>

      <ScrollView
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
          <Card style={{ padding: 0 }}>
            {rows.map((row, i) => (
              <OutputRow key={row.id} row={row} isLast={i === rows.length - 1} />
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginBottom: 8 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.72)', lineHeight: 19 },

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
