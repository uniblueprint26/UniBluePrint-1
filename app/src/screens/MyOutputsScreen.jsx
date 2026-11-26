import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CheckCircle, FileText, Inbox, Clock, UserCheck, ChevronRight, Archive } from 'lucide-react-native'
import Card from '../components/ui/Card'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { envelopePaper } from '../components/foundation/envelopePaper'
import Button from '../components/ui/Button'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useFoundationOrdering } from '../hooks/useAppFlags'

// "My Outputs" — a student's own submission history and completed
// documents. A delivered row opens OutputDetailScreen for the generated
// text + a native share sheet (see VIEWABLE_DOCUMENT_TABLES below) — no
// PDF/rich formatting, that's a separate, deliberately out-of-scope piece
// of work. Everything else stays a status tracker: what you've submitted
// and where it is in the queue.

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

// Output-wallet storage note for a delivered, not-yet-expired row (see
// 20261015130000_output_wallet_retention.sql) — null expires_at means Pro
// made it permanent (either at delivery or by a later upgrade), otherwise
// it's the free-tier 6-month window started at delivered_at. A nice-to-have
// alongside the submitted/delivered dates already in this row, not shown
// for an expired row (that gets its own badge instead, below).
function storageNote(row) {
  if (!row.expires_at) return 'Stored permanently'
  return `Storage until ${formatDate(row.expires_at)}`
}

// Document tables that actually hold a generate-* function's output (every
// Foundation Blueprint service except Job Search Support, which is an
// advisory session — its deliverable column is student_strategy, not
// generated). Kept here as the one place OutputDetailScreen's navigation
// param needs to agree with, rather than trusting an arbitrary string.
const VIEWABLE_DOCUMENT_TABLES = new Set([
  'cv_documents', 'cover_letters', 'application_forms', 'interview_prep_packs',
  'linkedin_documents', 'personal_statements', 'portfolio_plans', 'job_search_sessions',
])

// Muted grey pill for an expired row — distinct from every real STAGE_COLOR
// (which are all warm/blue/green) so "Expired" never reads as just another
// stage on the way to delivery.
const EXPIRED_COLOR = { fg: '#6B7280', bg: 'rgba(107,114,128,0.12)' }

function OutputRow({ row, onPress }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors)
  const paper = envelopePaper(isDark)
  const delivered = row.stage === 'delivered'
  // wallet_scrubbed_at is only set once the wallet content was cleared.
  const expired = delivered && !!row.wallet_scrubbed_at
  const canOpen = delivered && !expired && VIEWABLE_DOCUMENT_TABLES.has(row.document_table)
  const Wrapper = canOpen ? TouchableOpacity : View
  const stageText = expired ? 'Expired' : (STAGE_LABEL[row.stage] || row.stage)
  const dotColor = expired ? colors.light : delivered ? (isDark ? '#7FD6A3' : '#2E8F5B') : row.stage === 'in_review' ? (isDark ? '#8FB0E8' : '#3B6BC4') : colors.light
  const sealed = row.stage === 'in_review' || row.stage === 'assigned'
  return (
    <Wrapper
      style={[styles.card, { backgroundColor: paper.body, borderColor: paper.edge }, expired && styles.rowExpired]}
      {...(canOpen ? { onPress, activeOpacity: 0.8, accessibilityRole: 'button', accessibilityLabel: `Open ${row.services?.name || 'your document'}` } : {})}
    >
      <View style={styles.glyph}>
        <View style={[styles.glyphBody, { backgroundColor: paper.flap, borderColor: paper.edge }]}>
          {delivered && !expired && <View style={[styles.glyphLetter, { backgroundColor: paper.letter, borderColor: paper.edge }]} />}
          {sealed && <View style={[styles.glyphSeal, { backgroundColor: paper.sealBg }]} />}
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowTitle, expired && styles.rowTitleExpired]} numberOfLines={2}>{row.services?.name || 'Service'}</Text>
        <Text style={styles.rowMeta}>
          {delivered ? `Delivered ${formatDate(row.delivered_at)}` : `Submitted ${formatDate(row.submitted_at)}`}
          {row.tier === 'premium' ? ' (Premium)' : ''}
        </Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,58,95,0.07)' }]}>
            <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
            <Text style={styles.chipText}>{stageText}</Text>
          </View>
        </View>
        {delivered && !expired && <Text style={styles.rowNote}>{storageNote(row)}</Text>}
        {expired && <Text style={styles.rowNote}>Wallet storage expired, content cleared</Text>}
      </View>
      {canOpen && <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />}
    </Wrapper>
  )
}

export default function MyOutputsScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { enabled: orderingOpen, teaser } = useFoundationOrdering()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, stage, tier, submitted_at, delivered_at, expires_at, wallet_scrubbed_at, document_table, document_id, services(name)')
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

  const paper = envelopePaper(isDark)
  const onItsWay = rows.filter(r => r.stage !== 'delivered')
  const ready = rows.filter(r => r.stage === 'delivered')
  const openRow = row => navigation.navigate('OutputDetail', {
    documentTable: row.document_table,
    documentId: row.document_id,
    serviceName: row.services?.name || 'Your document',
    deliveredAt: row.delivered_at,
    expiresAt: row.expires_at,
    walletScrubbedAt: row.wallet_scrubbed_at,
  })

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
      >
        <PageTitle title="Outputs" subtitle="Your finished documents, checked by a real person." style={{ paddingHorizontal: 0 }} />

        {loading ? (
          <Text style={styles.loadingText}>Loading your outputs...</Text>
        ) : rows.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={36} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nothing here yet.</Text>
            <Text style={styles.emptySub}>
              {orderingOpen
                ? 'Order a CV, cover letter, or any other Foundation service and it will be tracked here from submission to delivery.'
                : `${teaser ? `${teaser}. ` : ''}You can start your answers in Foundation now. They are saved to your Blueprint.`}
            </Text>
            <Button
              label="Go to Foundation"
              onPress={() => navigation.navigate('Foundation')}
              variant="primary"
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          <>
            <View style={[styles.counts, { backgroundColor: paper.body, borderColor: paper.edge }]}>
              {[[queuedCount, 'In queue'], [inReviewCount, 'In review'], [deliveredCount, 'Delivered']].map(([n, label], i) => (
                <View key={label} style={[styles.countCell, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: paper.edge }]}>
                  <Text style={styles.countNum}>{n}</Text>
                  <Text style={styles.countLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {onItsWay.length > 0 && (
              <>
                <Text style={styles.groupLabel}>{`ON ITS WAY  ${onItsWay.length}`}</Text>
                <View style={{ gap: 12 }}>
                  {onItsWay.map(row => <OutputRow key={row.id} row={row} onPress={() => openRow(row)} />)}
                </View>
              </>
            )}
            {ready.length > 0 && (
              <>
                <Text style={styles.groupLabel}>{`READY TO READ  ${ready.length}`}</Text>
                <View style={{ gap: 12 }}>
                  {ready.map(row => <OutputRow key={row.id} row={row} onPress={() => openRow(row)} />)}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  heroBlock: { backgroundColor: colors.chromeBg, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.chromeFg, marginTop: 6, marginBottom: 8 },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: 0 },
  loadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 40 },

  emptyCard: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary, marginTop: 6 },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  emptyBtn: { marginTop: 10, ...shadows.card },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1 },
  rowExpired: { opacity: 0.6 },
  glyph: { width: 54, alignItems: 'center' },
  glyphBody: { width: 50, height: 36, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  glyphLetter: { position: 'absolute', top: -7, width: 32, height: 14, borderRadius: 3, borderWidth: 1 },
  glyphSeal: { width: 14, height: 14, borderRadius: 7, marginTop: 6 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.textPrimary },
  rowTitleExpired: { color: colors.textSecondary },
  rowMeta: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, marginTop: 3 },
  chipRow: { flexDirection: 'row', marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  rowNote: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 8 },
  counts: { flexDirection: 'row', borderRadius: 22, borderWidth: 1, paddingVertical: 20, marginTop: 6 },
  countCell: { flex: 1, alignItems: 'center' },
  countNum: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: colors.textPrimary },
  countLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  groupLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary, marginTop: 26, marginBottom: 12 },
  })
}
