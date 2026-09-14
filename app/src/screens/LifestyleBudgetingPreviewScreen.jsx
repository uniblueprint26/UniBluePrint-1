/**
 * LifestyleBudgetingPreviewScreen — one of the 4 standalone Lifestyle
 * destinations (see LifestyleScreen, the hub they're all reached from).
 *
 * A condensed preview of the full Budgeting tool (BudgetingScreen, its own
 * bottom-tab-reachable screen), not a duplicate of it: reads the same
 * stored numbers (AsyncStorage's BUDGET_STORAGE_KEY for income/expenses,
 * the budget_goals Supabase table for goals — same keys/table, same
 * balance formula as BudgetTab there) but renders them read-only, as a
 * quick snapshot, with no income/expense entry rows and no goal-creation
 * form here. Every path to actually change a number goes through the "Open
 * full Budgeting Tool" button, which pushes the real screen.
 */
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ChevronLeft, ChevronRight, PiggyBank, Tag, ShoppingBag,
  Target, ShieldCheck, Plane, GraduationCap, Heart, Home as HomeIcon, Laptop, ArrowRight,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { formatNumber } from '../utils/formatNumber'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Same key BudgetingScreen's BudgetTab reads/writes — this preview is a
// read-only view of that exact same saved data, never its own copy.
const BUDGET_STORAGE_KEY = 'ub_budget_v1'

const GOAL_ICONS = { Target, ShieldCheck, PiggyBank, Plane, GraduationCap, Heart, Home: HomeIcon, Laptop }

const SHORTCUTS = [
  { title: 'Budget Calculator', sub: 'Plan rent, food, transport and more', Icon: PiggyBank, params: { tab: 'budget' } },
  { title: 'Grants & Schemes',  sub: 'SUSI and every other Irish student grant worth knowing', Icon: Tag, params: { tab: 'susi' } },
]

export default function LifestyleBudgetingPreviewScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [loaded, setLoaded] = useState(false)
  const [period, setPeriod] = useState('week')
  const [income, setIncome] = useState([])
  const [expenses, setExpenses] = useState([])
  const [goals, setGoals] = useState([])
  const [goalsLoaded, setGoalsLoaded] = useState(false)

  // Reload every time this screen gains focus — the real tool is one tap
  // away and any change made there should show up back here immediately,
  // not only on a fresh mount.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      AsyncStorage.getItem(BUDGET_STORAGE_KEY).then(raw => {
        if (cancelled) return
        if (raw) {
          try {
            const saved = JSON.parse(raw)
            setPeriod(saved.period || 'week')
            setIncome(saved.income || [])
            setExpenses(saved.expenses || [])
          } catch { /* ignore corrupt/old-shape saved data */ }
        }
        setLoaded(true)
      }).catch(() => setLoaded(true))
      return () => { cancelled = true }
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      async function loadGoals() {
        if (!user?.id) { if (!cancelled) { setGoals([]); setGoalsLoaded(true) }; return }
        const { data, error } = await supabase
          .from('budget_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        if (cancelled) return
        setGoals(error ? [] : (data || []))
        setGoalsLoaded(true)
      }
      loadGoals()
      return () => { cancelled = true }
    }, [user?.id])
  )

  const totalIncome   = income.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalExpenses = expenses.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalGoalContributions = goals.reduce((s, g) => s + (parseFloat(g.current_amount) || 0), 0)
  const balance    = totalIncome - totalExpenses - totalGoalContributions
  const hasAnyData = totalIncome > 0 || totalExpenses > 0
  const balanceColor = balance > 0 ? colors.success : balance < 0 ? colors.destructive : colors.navy
  const periodLabel = period === 'week' ? 'week' : period === 'month' ? 'month' : 'term'
  const topGoal = goals[0] || null
  const TopGoalIcon = topGoal ? (GOAL_ICONS[topGoal.icon] || Target) : Target

  function openTool(params) {
    navigation.navigate('Budgeting', params)
  }

  return (
    <View style={styles.screen}>
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

          <Text style={styles.heroEyebrow}>LIFESTYLE · BUDGETING</Text>
          <Text style={styles.heroTitle}>Budgeting</Text>
          <Text style={styles.heroSub}>
            A quick look at where you stand, straight from your saved budget. Open the full tool to
            edit anything below.
          </Text>
        </View>

        <View style={styles.content}>

          {!loaded ? null : !hasAnyData ? (
            /* Empty state — nothing saved yet on this device */
            <Card style={styles.emptyCard}>
              <PiggyBank size={26} color={colors.navy} strokeWidth={1.6} />
              <Text style={styles.emptyTitle}>You haven't set up your budget yet</Text>
              <Text style={styles.emptySub}>
                Add your income and expenses in the full Budgeting tool, then come back here for a
                quick snapshot any time.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => openTool({ tab: 'budget' })}>
                <Text style={styles.primaryBtnText}>Start Budgeting</Text>
                <ArrowRight size={15} color={colors.cream} />
              </TouchableOpacity>
            </Card>
          ) : (
            <>
              {/* Balance snapshot */}
              <Card style={[styles.balanceCard, { borderLeftColor: balanceColor }]}>
                <Text style={styles.balanceLabel}>{balance >= 0 ? 'You have' : 'You are'}</Text>
                <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                  {balance < 0 ? '-' : ''}€{formatNumber(Math.abs(balance), { decimals: 2 })}
                </Text>
                <Text style={styles.balanceLabel}>
                  {balance >= 0 ? `left over this ${periodLabel}` : `over budget this ${periodLabel}`}
                </Text>
                <View style={styles.balanceMetaRow}>
                  <View style={styles.balanceMetaItem}>
                    <Text style={styles.balanceMetaLabel}>Income</Text>
                    <Text style={styles.balanceMetaValue}>€{formatNumber(totalIncome, { decimals: 0 })}</Text>
                  </View>
                  <View style={styles.balanceMetaDivider} />
                  <View style={styles.balanceMetaItem}>
                    <Text style={styles.balanceMetaLabel}>Expenses</Text>
                    <Text style={styles.balanceMetaValue}>€{formatNumber(totalExpenses, { decimals: 0 })}</Text>
                  </View>
                </View>
              </Card>

              {/* Top goal snippet */}
              {goalsLoaded && topGoal && (
                <Card style={styles.goalCard}>
                  <View style={styles.goalHeaderRow}>
                    <TopGoalIcon size={15} color={colors.navy} />
                    <Text style={styles.goalName} numberOfLines={1}>{topGoal.name}</Text>
                    {goals.length > 1 && <Text style={styles.goalMoreTag}>+{goals.length - 1} more</Text>}
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(100, Math.round(((parseFloat(topGoal.current_amount) || 0) / (parseFloat(topGoal.target_amount) || 1)) * 100))}%`,
                    }]} />
                  </View>
                  <Text style={styles.goalAmounts}>
                    €{formatNumber(topGoal.current_amount || 0, { decimals: 0 })} of €{formatNumber(topGoal.target_amount || 0, { decimals: 0 })}
                  </Text>
                </Card>
              )}

              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => openTool({ tab: 'budget' })}>
                <Text style={styles.primaryBtnText}>Open Full Budgeting Tool</Text>
                <ArrowRight size={15} color={colors.cream} />
              </TouchableOpacity>
            </>
          )}

          {/* Quick links */}
          <SectionHeader eyebrow="Money & Finance" title="Quick Links" style={{ marginTop: spacing.xl }} />
          <View style={{ gap: 10 }}>
            {SHORTCUTS.map(({ title, sub, Icon, params }) => (
              <TouchableOpacity key={title} activeOpacity={0.8} onPress={() => openTool(params)}>
                <Card style={styles.shortcutCard}>
                  <View style={styles.shortcutIconWrap}>
                    <Icon size={20} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shortcutTitle}>{title}</Text>
                    <Text style={styles.shortcutSub}>{sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.getParent()?.navigate('AdBoard', { screen: 'AdBoardMain' })}>
              <Card style={styles.shortcutCard}>
                <View style={styles.shortcutIconWrap}>
                  <ShoppingBag size={20} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shortcutTitle}>Part-Time Work Finder</Text>
                  <Text style={styles.shortcutSub}>Flexible roles near your campus</Text>
                </View>
                <ChevronRight size={16} color={colors.light} />
              </Card>
            </TouchableOpacity>
          </View>

          <Card style={styles.tipCard}>
            <Text style={styles.tipEyebrow}>MONEY TIP OF THE WEEK</Text>
            <Text style={styles.tipText}>
              Cook in bulk on Sundays. Young people who meal prep spend significantly less on food per week than those who don't.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

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

  scrollView: { flex: 1 },
  scroll: {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  emptyCard: { alignItems: 'center', textAlign: 'center', paddingVertical: 28 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, marginTop: 12, textAlign: 'center' },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 19 },

  balanceCard: { borderLeftWidth: 4, alignItems: 'center', paddingVertical: 24 },
  balanceLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  balanceAmount: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 46, marginVertical: 2 },
  balanceMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 20 },
  balanceMetaItem: { alignItems: 'center' },
  balanceMetaLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  balanceMetaValue: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.navy, marginTop: 2 },
  balanceMetaDivider: { width: 1, height: 28, backgroundColor: colors.border },

  goalCard: { marginTop: 12 },
  goalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  goalName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, flex: 1 },
  goalMoreTag: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cream, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.navy },
  goalAmounts: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 8 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 14, marginTop: 14,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  shortcutCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  shortcutIconWrap: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  shortcutTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  shortcutSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  tipCard: { marginTop: spacing.md, backgroundColor: colors.navy, padding: 18 },
  tipEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1 },
  tipText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream, lineHeight: 21, marginTop: 8 },
})
