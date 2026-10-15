import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CheckCircle, FileText, Inbox, Clock, UserCheck, ChevronRight, Archive } from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import StatTile, { StatTileRow } from '../components/ui/StatTile'
import UBPLogo from '../components/ui/UBPLogo'
import Button from '../components/ui/Button'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { goToHome } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

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

function OutputRow({ row, isLast, onPress }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const delivered = row.stage === 'delivered'
  // wallet_scrubbed_at is only ever set once expire_wallet_outputs() has
  // actually cleared this row's document content (20261015130000_output_
  // wallet_retention.sql) — a delivered row with it set still exists here,
  // it just has nothing left to show, so this reads as its own state
  // rather than a blank "Delivered" row.
  const expired = delivered && !!row.wallet_scrubbed_at
  const stageColor = expired ? EXPIRED_COLOR : (STAGE_COLOR[row.stage] || STAGE_COLOR.submitted)
  const canOpen = delivered && VIEWABLE_DOCUMENT_TABLES.has(row.document_table)
  const Wrapper = canOpen ? TouchableOpacity : View
  return (
    <Wrapper
      style={[styles.row, !isLast && styles.rowDivider, expired && styles.rowExpired]}
      {...(canOpen ? { onPress, activeOpacity: 0.7, accessibilityRole: 'button', accessibilityLabel: `Open ${row.services?.name || 'your document'}` } : {})}
    >
      <View style={[styles.rowIcon, { backgroundColor: expired ? EXPIRED_COLOR.bg : (delivered ? '#F0FDF4' : '#EFF6FF') }]}>
        {expired
          ? <Archive size={16} color={EXPIRED_COLOR.fg} strokeWidth={1.8} />
          : delivered
            ? <CheckCircle size={16} color="#15803D" strokeWidth={1.8} />
            : <FileText size={16} color={colors.textPrimary} strokeWidth={1.8} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, expired && styles.rowTitleExpired]} numberOfLines={1}>{row.services?.name || 'Service'}</Text>
        <Text style={styles.rowMeta}>
          {row.tier === 'premium' ? 'Premium' : 'Standard'} · Submitted {formatDate(row.submitted_at)}
          {delivered ? ` · Delivered ${formatDate(row.delivered_at)}` : ''}
          {delivered && !expired ? ` · ${storageNote(row)}` : ''}
        </Text>
        {delivered && (
          expired ? (
            <View style={styles.reviewBadge}>
              <Archive size={10} color={EXPIRED_COLOR.fg} strokeWidth={2.2} />
              <Text style={[styles.reviewBadgeText, { color: EXPIRED_COLOR.fg }]}>Wallet storage expired — content cleared</Text>
            </View>
          ) : (
            <View style={styles.reviewBadge}>
              <UserCheck size={10} color={colors.textPrimary} strokeWidth={2.2} />
              <Text style={styles.reviewBadgeText}>Reviewed by your Campus Handler</Text>
            </View>
          )
        )}
      </View>
      <View style={styles.rowTrailing}>
        <View style={[styles.stagePill, { backgroundColor: stageColor.bg }]}>
          <Text style={[styles.stagePillText, { color: stageColor.fg }]}>{expired ? 'Expired' : (STAGE_LABEL[row.stage] || row.stage)}</Text>
        </View>
        {canOpen && <ChevronRight size={16} color={colors.light} strokeWidth={2} />}
      </View>
    </Wrapper>
  )
}

export default function MyOutputsScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
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

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        backLabel="Home"
        logoCenter={<UBPLogo height={33} color={colors.chromeFg} onPress={() => goToHome(navigation)} />}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
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
            <Button
              label="Go to Foundation Blueprint"
              onPress={() => navigation.navigate('Foundation')}
              variant="primary"
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          <>
            {/* MyOutputs is the one screen most students will treat as their
                own dashboard — give it the same stat-tile authority the
                portal dashboards have, not just a flat list. */}
            <StatTileRow style={{ marginBottom: spacing.md }}>
              <StatTile icon={Inbox} iconBg="#EFF6FF" iconColor={colors.textPrimary} value={queuedCount} label="Queued" border />
              <StatTile icon={Clock} iconBg="#FEF9C3" iconColor={colors.goldDeep} value={inReviewCount} label="In Review" border />
              <StatTile icon={CheckCircle} iconBg="#F0FDF4" iconColor={colors.success} value={deliveredCount} label="Delivered" />
            </StatTileRow>
            <Card style={{ padding: 0 }}>
              {rows.map((row, i) => (
                <OutputRow
                  key={row.id}
                  row={row}
                  isLast={i === rows.length - 1}
                  onPress={() => navigation.navigate('OutputDetail', {
                    documentTable: row.document_table,
                    documentId: row.document_id,
                    serviceName: row.services?.name || 'Your document',
                    deliveredAt: row.delivered_at,
                    expiresAt: row.expires_at,
                    walletScrubbedAt: row.wallet_scrubbed_at,
                  })}
                />
              ))}
            </Card>
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
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  loadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 40 },

  emptyCard: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary, marginTop: 6 },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  emptyBtn: { marginTop: 10, ...shadows.card },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  // Muted whole-row treatment for an expired output — content cleared, not
  // just another "delivered" row (see EXPIRED_COLOR / storageNote above).
  rowExpired: { opacity: 0.6 },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  rowTitleExpired: { color: colors.muted },
  rowMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  reviewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reviewBadgeText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.textPrimary },
  rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  stagePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  stagePillText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },
  })
}
