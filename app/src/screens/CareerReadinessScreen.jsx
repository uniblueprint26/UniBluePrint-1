import { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import {
  FileText, Linkedin, Mail, PenLine, MessageSquare, Briefcase, Search, Award,
  CheckCircle2, Circle as CircleIcon, Sparkles,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { goToHome } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

// ─── Career Readiness ───────────────────────────────────────────────────────
// Tracks real progress across the 8 Foundation Blueprint builders (CV,
// Cover Letter, LinkedIn, Personal Statement, Interview Prep, Portfolio
// Plan, Job Search Support, Application Form) as a single gamified view:
// a per-builder progress ring, an overall readiness ring, and an XP bar.
//
// Deliberately NOT a leaderboard and NOT a streak. Everything here is
// personal and non-comparative (no other student's progress is ever
// visible), and nothing resets or punishes a gap in activity — a builder
// that's "not started" just sits at 0, it never goes backwards. That's a
// founder-accepted guardrail from the competitive audit that led to this
// feature (no comparison, no brittle streak), not an oversight.
//
// Real data only: every builder's status comes straight from `submissions`
// (document_table + stage), the exact table MyOutputsScreen already reads
// from. A builder is:
//   - "not started"  → no row in `submissions` for that document_table
//   - "in progress"  → a row exists, stage isn't 'delivered' yet
//   - "delivered"    → a row exists with stage === 'delivered'
// Nothing here is ever fabricated or simulated.

const BUILDERS = [
  { key: 'cv',                  label: 'CV',                 fullLabel: 'CV Optimisation',               table: 'cv_documents',        screen: 'CvBuilder',               icon: FileText },
  { key: 'cover_letter',         label: 'Cover Letter',       fullLabel: 'Cover Letter Assistance',       table: 'cover_letters',       screen: 'CoverLetterBuilder',       icon: Mail },
  { key: 'linkedin',             label: 'LinkedIn',           fullLabel: 'LinkedIn Optimisation',         table: 'linkedin_documents',  screen: 'LinkedinBuilder',          icon: Linkedin },
  { key: 'personal_statement',   label: 'Personal Statement', fullLabel: 'Personal Statement',            table: 'personal_statements', screen: 'PersonalStatementBuilder', icon: PenLine },
  { key: 'interview_prep',       label: 'Interview Prep',     fullLabel: 'Interview Preparation',         table: 'interview_prep_packs',screen: 'InterviewPrepBuilder',     icon: MessageSquare },
  { key: 'portfolio_plan',       label: 'Portfolio',          fullLabel: 'Portfolio Building',            table: 'portfolio_plans',     screen: 'PortfolioPlanBuilder',     icon: Briefcase },
  { key: 'job_search',           label: 'Job Search',         fullLabel: 'Job Search Support',            table: 'job_search_sessions', screen: 'JobSearchSupportBuilder',  icon: Search },
  { key: 'application_form',     label: 'Application Form',   fullLabel: 'Application Form Assistance',   table: 'application_forms',   screen: 'ApplicationFormBuilder',   icon: Award },
]
const DOCUMENT_TABLES = BUILDERS.map(b => b.table)

// Same stage vocabulary as MyOutputsScreen/CondensedDashboard — duplicated
// locally rather than imported because neither of those exports it (the
// app's existing convention for this small map; see CondensedDashboard.jsx).
const STAGE_LABEL = {
  submitted: 'Submitted', in_queue: 'In queue', assigned: 'Assigned',
  in_review: 'In review', delivered: 'Delivered',
}

// Ring colors — validated for mark-vs-surface contrast (dataviz skill,
// scripts/validate_palette.js): goldDeep vs white = 3.19:1, '#15803D' vs
// white/cream well clears 3:1. Plain `colors.gold`/`colors.success` were
// rejected here — gold vs cream only reaches ~2.1:1 and success vs cream
// ~2.9:1, under the mark floor — goldDeep and the darker MyOutputsScreen
// green ('#15803D', already used there for "Delivered") are used instead.
// Every ring is also always paired with a text label, never color alone.
const DELIVERED_COLOR = '#15803D'
function getStatusColors(colors) {
  return { inProgress: colors.goldDeep, notStarted: colors.border }
}

const XP_PER_STATUS = { not_started: 0, in_progress: 40, delivered: 100 }
const MAX_XP = BUILDERS.length * XP_PER_STATUS.delivered // 800

// On-brand level ladder — purely a framing device for the XP total, not a
// comparison against anyone else. No level can ever go down.
const LEVELS = [
  { min: 0,   title: 'Getting Started' },
  { min: 120, title: 'Blueprint Builder' },
  { min: 320, title: 'Blueprint Architect' },
  { min: 520, title: 'Blueprint Specialist' },
  { min: 720, title: 'Readiness Pro' },
  { min: MAX_XP, title: 'Fully Blueprinted' },
]

function levelFor(xp) {
  let current = LEVELS[0]
  let next = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) current = LEVELS[i]
    else { next = LEVELS[i]; break }
  }
  return { current, next }
}

function builderStatus(row) {
  if (!row) return 'not_started'
  return row.stage === 'delivered' ? 'delivered' : 'in_progress'
}

// ── Small, local SVG progress ring — no web SVG/CSS, react-native-svg only.
// Mark spec per the dataviz skill's meter guidance: thin ring (stroke-width
// scaled to size), rounded data-end, track = a lighter/neutral step so state
// still reads with the fill removed. Rotated -90° so progress starts at 12
// o'clock instead of react-native-svg's default 3 o'clock start.
function ProgressRing({ size, strokeWidth, progress, color, trackColor, children }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  const dashOffset = circumference * (1 - clamped)
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 && (
          <SvgCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      {children}
    </View>
  )
}

export default function CareerReadinessScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const { inProgress: IN_PROGRESS_COLOR, notStarted: NOT_STARTED_COLOR } = getStatusColors(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation, 'Foundation')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('document_table, document_id, stage, submitted_at, delivered_at')
        .eq('user_id', user.id)
        .in('document_table', DOCUMENT_TABLES)
        .order('submitted_at', { ascending: false })
      if (!error && data) setRows(data)
    } catch {
      /* best effort — leave whatever we already had */
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  // Reload every time this tab gains focus — same pattern as MyOutputsScreen
  // — so finishing a builder and tapping back into this tab shows the new
  // ring state immediately, not a stale one from the last visit.
  useFocusEffect(useCallback(() => { load() }, [load]))

  async function onRefresh() {
    setRefreshing(true)
    await load()
  }

  // One row per document_table — rows are already ordered most-recent-first,
  // so the first one seen per table is that builder's latest submission;
  // upgraded to a `delivered` row if an earlier submission for the same
  // builder was actually delivered (delivered never regresses to "still in
  // progress" just because a newer, still-pending resubmission exists).
  const latestByTable = useMemo(() => {
    const map = {}
    for (const row of rows) {
      const existing = map[row.document_table]
      if (!existing) { map[row.document_table] = row; continue }
      if (row.stage === 'delivered' && existing.stage !== 'delivered') map[row.document_table] = row
    }
    return map
  }, [rows])

  const builderStates = useMemo(() => BUILDERS.map(b => {
    const row = latestByTable[b.table] || null
    return { ...b, row, status: builderStatus(row) }
  }), [latestByTable])

  const startedCount = builderStates.filter(b => b.status !== 'not_started').length
  const deliveredCount = builderStates.filter(b => b.status === 'delivered').length

  const readinessFraction = builderStates.reduce((sum, b) => (
    sum + (b.status === 'delivered' ? 1 : b.status === 'in_progress' ? 0.5 : 0)
  ), 0) / BUILDERS.length
  const readinessPct = Math.round(readinessFraction * 100)

  const totalXp = builderStates.reduce((sum, b) => sum + XP_PER_STATUS[b.status], 0)
  const { current: level, next: nextLevel } = levelFor(totalXp)
  const levelProgress = nextLevel ? (totalXp - level.min) / (nextLevel.min - level.min) : 1

  // Personal milestones — checklist only, never a streak and never shown
  // alongside anyone else's numbers.
  const milestones = [
    { id: 'first_started',   label: 'First document started',   achieved: startedCount >= 1,   detail: 'You began your first Foundation Blueprint builder.' },
    { id: 'first_delivered', label: 'First document delivered', achieved: deliveredCount >= 1, detail: 'A Campus Handler reviewed and delivered your first document.' },
    { id: 'halfway',         label: 'Halfway there',            achieved: startedCount >= 4,   detail: 'Started at least 4 of your 8 builders.' },
    { id: 'all_started',     label: 'Every builder started',    achieved: startedCount === 8,  detail: 'All 8 Foundation Blueprint builders underway.' },
    { id: 'fully_delivered', label: 'Full career readiness',    achieved: deliveredCount === 8, detail: 'All 8 documents reviewed and delivered.' },
  ]

  // This screen is pushed inside HomeStack (same stack as every builder,
  // MyOutputs and OutputDetail — see navigation/index.jsx), so these are
  // plain same-stack navigations, not a cross-tab jump.
  function openBuilder(b) {
    if (b.status === 'not_started') {
      navigation.navigate(b.screen)
      return
    }
    if (b.status === 'delivered' && b.row) {
      navigation.navigate('OutputDetail', {
        documentTable: b.table,
        documentId: b.row.document_id,
        serviceName: b.fullLabel,
        deliveredAt: b.row.delivered_at,
      })
      return
    }
    // In progress / under review — MyOutputsScreen already owns detailed
    // status tracking for a pending submission, so send there rather than
    // duplicating it.
    navigation.navigate('MyOutputs')
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        backLabel="Foundation"
        logoCenter={<UBPLogo height={33} color={colors.chromeFg} onPress={() => goToHome(navigation)} />}
        eyebrow="CAREER READINESS"
        title="Your Blueprint Progress"
        subtitle="Your progress across all 8 Foundation Blueprint builders, in one place — no leaderboard, nothing comparing you to anyone else."
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
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Overall readiness ring + XP bar */}
            <Card style={styles.overallCard}>
              <View style={styles.overallTop}>
                <ProgressRing size={128} strokeWidth={12} progress={readinessFraction} color={colors.goldDeep} trackColor={colors.border}>
                  <Text style={styles.overallPct}>{readinessPct}%</Text>
                  <Text style={styles.overallPctLabel}>Ready</Text>
                </ProgressRing>
                <View style={styles.overallStats}>
                  <View style={styles.overallStatRow}>
                    <View style={[styles.overallDot, { backgroundColor: IN_PROGRESS_COLOR }]} />
                    <Text style={styles.overallStatText}>{startedCount} of 8 builders started</Text>
                  </View>
                  <View style={styles.overallStatRow}>
                    <View style={[styles.overallDot, { backgroundColor: DELIVERED_COLOR }]} />
                    <Text style={styles.overallStatText}>{deliveredCount} of 8 delivered</Text>
                  </View>
                  <Text style={styles.overallHint}>
                    Readiness blends what's started with what's already reviewed and delivered.
                  </Text>
                </View>
              </View>

              <View style={styles.xpBlock}>
                <View style={styles.xpHeaderRow}>
                  <Text style={styles.xpLevelTitle}>{level.title}</Text>
                  <Text style={styles.xpCount}>{totalXp} / {MAX_XP} XP</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${Math.max(0, Math.min(100, Math.round(levelProgress * 100)))}%` }]} />
                </View>
                <Text style={styles.xpNextLabel}>
                  {nextLevel ? `${nextLevel.min - totalXp} XP to ${nextLevel.title}` : 'Maximum level reached'}
                </Text>
              </View>
            </Card>

            {/* Milestones — a personal checklist, no streaks, no comparison */}
            <Text style={styles.sectionLabel}>Milestones</Text>
            <Card style={styles.milestonesCard}>
              {milestones.map((m, i) => (
                <View key={m.id} style={[styles.milestoneRow, i > 0 && styles.milestoneRowBorder]}>
                  {m.achieved
                    ? <CheckCircle2 size={20} color={DELIVERED_COLOR} strokeWidth={2} />
                    : <CircleIcon size={20} color={colors.light} strokeWidth={1.6} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneLabel, m.achieved && styles.milestoneLabelAchieved]}>{m.label}</Text>
                    <Text style={styles.milestoneDetail}>{m.detail}</Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Per-builder rings */}
            <Text style={styles.sectionLabel}>Your Foundation Builders</Text>
            <View style={styles.grid}>
              {builderStates.map(b => {
                const Icon = b.icon
                const ringColor = b.status === 'delivered' ? DELIVERED_COLOR : b.status === 'in_progress' ? IN_PROGRESS_COLOR : NOT_STARTED_COLOR
                const progress = b.status === 'delivered' ? 1 : b.status === 'in_progress' ? 0.55 : 0
                const statusColor = b.status === 'delivered' ? DELIVERED_COLOR : b.status === 'in_progress' ? IN_PROGRESS_COLOR : colors.light
                const statusText = b.status === 'delivered'
                  ? 'Delivered'
                  : b.status === 'in_progress'
                    ? (STAGE_LABEL[b.row?.stage] || 'In progress')
                    : 'Not started'
                return (
                  <TouchableOpacity
                    key={b.key}
                    style={styles.builderTile}
                    activeOpacity={0.85}
                    onPress={() => openBuilder(b)}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.fullLabel}: ${statusText}`}
                  >
                    <ProgressRing size={60} strokeWidth={5} progress={progress} color={ringColor} trackColor={colors.border}>
                      <Icon size={20} color={b.status === 'not_started' ? colors.light : colors.textPrimary} strokeWidth={1.8} />
                    </ProgressRing>
                    <Text style={styles.builderLabel} numberOfLines={2}>{b.label}</Text>
                    <Text style={[styles.builderStatus, { color: statusColor }]} numberOfLines={1}>{statusText}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {startedCount === 0 && (
              <View style={styles.emptyNudge}>
                <Sparkles size={18} color={colors.goldDeep} />
                <Text style={styles.emptyNudgeText}>
                  Start any builder above to begin filling in your rings and earning XP.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  heroBlock: { backgroundColor: colors.chromeBg, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.chromeFg, marginTop: 6, marginBottom: 8 },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  overallCard: { padding: 18 },
  overallTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  overallPct: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, textAlign: 'center' },
  overallPctLabel: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.muted, textAlign: 'center', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  overallStats: { flex: 1, gap: 8 },
  overallStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overallDot: { width: 9, height: 9, borderRadius: 4.5 },
  overallStatText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  overallHint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, lineHeight: 16, marginTop: 2 },

  xpBlock: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  xpHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpLevelTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  xpCount: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
  xpTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.goldDeep },
  xpNextLabel: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 6 },

  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 10 },

  milestonesCard: { padding: 4 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  milestoneRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  milestoneLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.muted },
  milestoneLabelAchieved: { color: colors.textPrimary },
  milestoneDetail: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  builderTile: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 8, ...shadows.card,
  },
  builderLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary, textAlign: 'center', marginTop: 10, lineHeight: 16 },
  builderStatus: { fontFamily: fonts.sansMedium, fontSize: 10.5, textAlign: 'center', marginTop: 3 },

  emptyNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, marginTop: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyNudgeText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 17 },
  })
}
