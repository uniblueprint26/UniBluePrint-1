/**
 * BudgetingScreen — UniBlueprint financial companion
 *
 * SUSI FIGURES: Rates are the published 2026/27 full-time undergraduate figures
 * from susi.ie. Thresholds adjust per additional dependant as listed per band.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Linking, Modal, Alert, ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  TrendingUp, TrendingDown, Wallet, Target, Plus, Minus,
  ChevronDown, ChevronUp, ChevronRight, ExternalLink,
  CheckCircle, Circle, Info, Save, TrendingUp as InvestIcon, GraduationCap,
  X, PiggyBank, Plane, Heart, ShoppingBag, Home as HomeIcon, Laptop, ShieldCheck,
  ShieldAlert, Scale, Clock as ClockIcon, Lock, Receipt,
} from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import EmptyState from '../components/ui/EmptyState'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { formatNumber } from '../utils/formatNumber'
import { useAuth } from '../context/AuthContext'
import { useUserType } from '../hooks/useUserType'
import { useInvestmentAccess } from '../hooks/useInvestmentAccess'
import { supabase } from '../lib/supabase'
import InvestmentPartnerPlaceholder from '../components/budgeting/InvestmentPartnerPlaceholder'

// Keyed per-user (not a flat device-wide key) — otherwise the next person
// to sign in on a shared phone would load, and silently overwrite, the
// previous account's income/expenses. Matches the pattern already used for
// GOALS_SEEDED_KEY_PREFIX below.
const BUDGET_STORAGE_KEY_PREFIX = 'ub_budget_v1_'

// ─── Goal icons — chosen at creation in the Add Goal form, stored as a key
// string on the row and mapped back to a Lucide icon here for rendering.
const GOAL_ICONS = {
  Target, ShieldCheck, PiggyBank, Plane, GraduationCap, Heart, ShoppingBag, Home: HomeIcon, Laptop,
}
const GOAL_ICON_KEYS = Object.keys(GOAL_ICONS)

// ─── Income categories per account-wide user type ────────────────────────────
// Sourced from useUserType() (Student / Apprentice / Gap Year / Worker —
// see constants/userTypes.js), set at signup and changeable any time in
// Settings > Account Type. Template rows use ids 1-9 so a type switch can
// swap just these out while leaving anything the person added themselves
// (via "Add Income Source", ids 100+) alone. Amounts always start blank —
// switching type changes what the categories *mean*, so carrying over a
// number entered against a different category would be misleading.
const INCOME_TEMPLATES = {
  student: [
    { id: 1, label: 'Part-time work' },
    { id: 2, label: 'SUSI Grant' },
    { id: 3, label: 'Family support' },
    { id: 4, label: 'Scholarship / Bursary' },
  ],
  apprentice: [
    { id: 1, label: 'Apprenticeship wage' },
    { id: 2, label: 'Family support' },
    { id: 3, label: 'Other income' },
  ],
  gap_year: [
    { id: 1, label: 'Savings' },
    { id: 2, label: 'Family support' },
    { id: 3, label: 'Casual / seasonal work' },
    { id: 4, label: 'Other income' },
  ],
  worker: [
    { id: 1, label: 'Full wage' },
    { id: 2, label: 'Other income' },
  ],
}

function defaultIncomeForType(userType) {
  const template = INCOME_TEMPLATES[userType] || INCOME_TEMPLATES.student
  return template.map(row => ({ ...row, amount: '' }))
}

// ─── SUSI 2026/27 full-time undergraduate rates — source: susi.ie ────────────
// Thresholds shown are for households with fewer than 4 dependant children.
// Each band adds perDep per additional dependant above the base count.
const SUSI_BANDS = [
  { band: 'Special',  threshold: 28600, nonadj: 7936, adj: 3230, perDep: 4950 },
  { band: 'Band 1',   threshold: 47010, nonadj: 4722, adj: 1774, perDep: 4950 },
  { band: 'Band 2',   threshold: 48270, nonadj: 3532, adj: 1343, perDep: 4785 },
  { band: 'Band 3',   threshold: 51040, nonadj: 2702, adj:  975, perDep: 4785 },
  { band: 'Band 4',   threshold: 58470, nonadj: 1866, adj:  612, perDep: 4785 },
]
const SUSI_FEE_THRESHOLD = 120000  // Fee contribution only (no maintenance) up to €120,000
const SUSI_FEE_PER_DEP   =   4785  // Additional dependant allowance for fee-only bands

const SUSI_TERMS = [
  {
    term: 'Reckonable Income',
    plain: 'The total gross income of everyone in your household (parents, guardians, or your own income if you\'re classed as independent), assessed from the previous tax year. This is what SUSI uses to work out your eligibility.',
  },
  {
    term: 'Adjacent vs. Non-Adjacent',
    plain: 'Adjacent means you live within 30km of your college, so SUSI assumes you can commute and the grant is lower. Non-adjacent means you live 30km or more from college and need to rent nearby. The non-adjacent rate is significantly higher.',
  },
  {
    term: 'Special Rate',
    plain: 'The highest level of SUSI maintenance support. Available to households with reckonable income below the special rate threshold. Designed to support students from the lowest-income backgrounds.',
  },
  {
    term: 'Standard Rate',
    plain: 'A partial maintenance grant for households above the special rate threshold but below the standard threshold. Still worth applying for, it can make a real difference to term spending.',
  },
  {
    term: 'Fee Contribution Grant',
    plain: 'A separate element of the SUSI award that contributes toward your Student Contribution Charge (the €3,000 annual registration fee). Can cover part or all of it, depending on your household income.',
  },
  {
    term: 'Means Testing',
    plain: 'SUSI\'s process of assessing your household\'s income against eligibility thresholds. They\'ll ask for tax records, P60s, and other income evidence to make sure they have the full picture.',
  },
]

// Real, established Irish student financial supports beyond SUSI. Kept
// deliberately general — who it's for and what it broadly covers — rather
// than citing specific euro amounts, thresholds, or deadlines the way the
// SUSI section above does. Those figures change yearly per scheme and we
// don't have a maintained, verified source for each one the way we do for
// SUSI's own published rates — better to send someone to the real page
// than publish a number that might be wrong.
const OTHER_SCHEMES = [
  {
    name: 'Student Assistance Fund',
    forWho: 'Any student facing financial hardship',
    description: 'A discretionary fund every publicly funded college holds, for students struggling to cover rent, childcare, transport, or other costs of attending, regardless of whether you already get SUSI. Doesn\'t need to be paid back. Apply through your own college\'s Student Assistance Fund or access office, not centrally.',
    link: 'hea.ie',
  },
  {
    name: '1916 Bursary Fund',
    forWho: 'Students from groups significantly under-represented in higher education',
    description: 'Extra financial and practical support on top of SUSI, for students who are the first in their family to attend college, from a socio-economically disadvantaged background, or from other under-represented groups. Administered through your college\'s access office.',
    link: 'hea.ie',
  },
  {
    name: 'Fund for Students with Disabilities',
    forWho: 'Students with a physical, sensory, or mental health disability, or a specific learning difficulty',
    description: 'Covers costs SUSI doesn\'t: things like note-takers, assistive technology, or transport related to your disability. Separate from SUSI, and can be claimed alongside it. Apply through your college\'s disability support service.',
    link: 'hea.ie',
  },
  {
    name: 'Back to Education Allowance',
    forWho: 'Mature students or anyone coming from certain social welfare payments',
    description: 'A weekly payment from the Department of Social Protection for people returning to education from jobseeker\'s or other qualifying payments, so you can study without losing your income support. A different route from SUSI, not a top-up to it, check which one actually applies to your situation.',
    link: 'gov.ie',
  },
  {
    name: 'Erasmus+ Grant',
    forWho: 'Anyone doing part of their course abroad',
    description: 'EU funding toward the real cost of studying or working abroad as part of your degree: travel, accommodation, the higher cost of living in some destinations. Administered in Ireland by Léargas, arranged through your college\'s international office.',
    link: 'leargas.ie',
  },
  {
    name: 'Springboard+',
    forWho: 'Anyone unemployed, returning to the workforce, or looking to upskill, not just current students',
    description: 'State-funded higher education courses, free or heavily subsidised, in areas the economy actually needs people in. Not a grant toward a course you\'re already doing: it funds the course itself. Worth checking even if you\'re not currently in college.',
    link: 'springboardcourses.ie',
  },
  {
    name: 'HEAR Scheme',
    forWho: 'School leavers from socio-economically disadvantaged backgrounds',
    description: 'The Higher Education Access Route offers reduced CAO points places and extra college supports to school leavers who meet the financial and social indicators. Applied for alongside your CAO application, with supporting documents submitted separately. Can be combined with SUSI.',
    link: 'accesscollege.ie',
  },
  {
    name: 'DARE Scheme',
    forWho: 'School leavers with a physical, sensory, mental health, or specific learning difficulty',
    description: 'The Disability Access Route to Education offers reduced CAO points places and dedicated college supports to school leavers whose disability has had a negative impact on their education. Also applied for alongside your CAO application. Can be combined with SUSI.',
    link: 'accesscollege.ie',
  },
  {
    name: 'Technological Universities Student Support Fund',
    forWho: 'Students at a Technological University facing financial hardship',
    description: 'A discretionary support fund specific to Ireland\'s Technological Universities, on top of what\'s available through the general Student Assistance Fund. Covers costs like rent, transport, and equipment. Apply through your own TU\'s student services or access office.',
    link: 'hea.ie',
  },
  {
    name: 'Skillnet Ireland',
    forWho: 'Anyone looking to build workplace skills, students and graduates included',
    description: 'A state-backed network of enterprise-led training groups offering subsidised, often free, professional and technical training across every sector. Not a maintenance grant, it funds the course or programme itself. Worth checking alongside your studies, not just after you graduate.',
    link: 'skillnetireland.ie',
  },
  {
    name: 'Local Authority Grants',
    forWho: 'Students from a specific county or city, criteria vary by area',
    description: 'Some county and city councils run their own scholarships or bursaries for local students heading into further or higher education, separate from SUSI and often less well known. What\'s available and who qualifies varies significantly by local authority, so check your own county or city council\'s website directly.',
    link: 'gov.ie',
  },
  {
    name: 'ETB Bursaries',
    forWho: 'Students on a PLC or further education course with an Education and Training Board',
    description: 'Education and Training Boards run their own bursary and hardship support for students on PLC and further education courses, separate from the mainstream SUSI system. Availability and amounts vary by ETB, apply through your own college\'s ETB office.',
    link: 'etbi.ie',
  },
]

// Common investing vocabulary for the Investment tab's glossary. The Irish
// tax-specific terms (exit tax, deemed disposal, DIRT) are deliberately
// included, not generic filler, because they're real gaps most beginner
// guides skip, and and the investment partner linked from this tab
// (see InvestmentPartnerPlaceholder) covers exactly these rules.
const INVEST_TERMS = [
  {
    term: 'Diversification',
    plain: 'Spreading your money across different investments, companies, sectors, asset types, instead of putting it all in one place, so one bad outcome does not wipe out everything you have.',
  },
  {
    term: 'Compounding',
    plain: 'Earning returns not just on the money you put in, but on the returns that money already earned. It is the main reason starting early matters more than starting with a large amount, see "Why Starting Early Matters" above.',
  },
  {
    term: 'ETF (Exchange-Traded Fund)',
    plain: 'A single investment that holds a basket of many shares or bonds, bought and sold like an ordinary share. A common way for beginners to get instant diversification without picking individual companies.',
  },
  {
    term: 'Risk Tolerance',
    plain: 'How much loss you can actually handle, financially and emotionally, without panic-selling at the worst possible time. It is personal: two people the same age can reasonably have very different answers.',
  },
  {
    term: 'Exit Tax & Deemed Disposal',
    plain: 'Many EU-domiciled funds and ETFs are taxed in Ireland under a separate "exit tax" regime rather than standard Capital Gains Tax, and can trigger a taxable event every 8 years even if you never sold ("deemed disposal"). Rates and rules change, always confirm the current position on revenue.ie before investing. This is one of the specific things Zainab covers in her sessions below.',
  },
  {
    term: 'DIRT',
    plain: 'Deposit Interest Retention Tax, deducted automatically from interest earned in Irish bank and credit union savings accounts. It applies to savings interest, not investment growth, but the two are often mixed up.',
  },
]

function SchemeCard({ item }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <Card style={styles.schemeCard}>
      <Text style={styles.schemeName}>{item.name}</Text>
      <Text style={styles.schemeForWho}>{item.forWho}</Text>
      <Text style={styles.schemeDesc}>{item.description}</Text>
      <TouchableOpacity
        style={styles.schemeLinkRow}
        activeOpacity={0.7}
        onPress={() => Linking.openURL(`https://${item.link}`)}
      >
        <Text style={styles.schemeLinkText}>{item.link}</Text>
        <ExternalLink size={12} color={colors.textPrimary} />
      </TouchableOpacity>
    </Card>
  )
}

const APPLICATION_STEPS = [
  'Apply online at susi.ie (opens April/May each year)',
  'Have all household PPS numbers ready before you start',
  'Gather household income evidence: P60s, Form 11, or Revenue records from the relevant tax year',
  'Have your CAO/college offer letter or student ID ready to confirm your course',
  'Submit your application and supporting documents through the online portal',
  'Monitor your application status: SUSI will contact you if more documents are needed',
  'Decisions typically arrive within 4 to 8 weeks of submitting all documents',
]

// ─── Line Item (editable row for income / expense entries) ───────────────────
function LineItem({ item, onChangeAmount, onRemove, tint }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={styles.lineItem}>
      <View style={[styles.lineItemDot, { backgroundColor: tint }]} />
      <Text style={styles.lineItemLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.lineItemAmountCol}>
        <Text style={styles.lineItemCurrency}>€</Text>
        <TextInput
          style={styles.lineItemAmount}
          value={item.amount}
          onChangeText={val => onChangeAmount(item.id, val.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.light}
        />
      </View>
      {onRemove && (
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.label}`}
        >
          <Minus size={14} color={colors.light} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Goal Card — Supabase-backed savings goal. Progress bar (current vs
// target), an "Add to [Goal]" button that opens a bottom sheet, and a
// celebration state (green card, CheckCircle, "Goal reached") once the
// target is met. ─────────────────────────────────────────────────────────
function GoalCard({ goal, onAddPress, onRemove }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const target  = parseFloat(goal.target_amount)  || 0
  const current = parseFloat(goal.current_amount) || 0
  const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const reached = target > 0 && current >= target
  const GoalIcon = GOAL_ICONS[goal.icon] || Target

  return (
    <Card style={[styles.goalCard, reached && styles.goalCardReached]}>
      <View style={styles.goalHeader}>
        {reached
          ? <CheckCircle size={18} color={colors.success} style={{ flexShrink: 0 }} />
          : <GoalIcon size={16} color={colors.textPrimary} style={{ flexShrink: 0 }} />}
        <Text style={styles.goalLabel} numberOfLines={1}>{goal.name}</Text>
        {reached && (
          <View style={styles.goalDoneBadge}>
            <Text style={styles.goalDoneText}>Goal reached</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onRemove(goal)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove goal ${goal.name}`}
        >
          <Minus size={14} color={colors.light} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${pct}%`,
          backgroundColor: reached ? colors.success : colors.accentBg,
        }]} />
      </View>
      <View style={styles.goalAmountsRow}>
        <Text style={styles.goalPct}>€{formatNumber(current, { decimals: 0 })} of €{formatNumber(target, { decimals: 0 })}</Text>
        <Text style={styles.goalPct}>{pct}%</Text>
      </View>
      {!!goal.deadline && <Text style={styles.goalDeadline}>By {new Date(goal.deadline).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>}

      <TouchableOpacity
        style={[styles.addToGoalBtn, reached && styles.addToGoalBtnReached]}
        activeOpacity={0.85}
        onPress={() => onAddPress(goal)}
      >
        <Plus size={14} color={reached ? colors.success : colors.accentFg} />
        <Text style={[styles.addToGoalBtnText, reached && { color: colors.success }]}>Add to {goal.name}</Text>
      </TouchableOpacity>
    </Card>
  )
}

// ─── Add to Goal — bottom sheet to enter a contribution amount. Calls the
// add_to_budget_goal RPC, which atomically increments current_amount
// server-side and, from the caller's point of view, moves that amount out
// of "available balance" (see BudgetTab's balance calc). ──────────────────
function AddToGoalSheet({ visible, goal, onClose, onAdded }) {
  const { colors } = useTheme()
  const sheet = __gs_sheet(colors)
  const styles = __gs_styles(colors)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { if (visible) { setAmount(''); setError('') } }, [visible])

  async function submit() {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Enter an amount greater than €0.'); return }
    setSaving(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('add_to_budget_goal', {
      p_goal_id: goal.id, p_amount: val,
    })
    setSaving(false)
    if (rpcError) { setError('Could not add to this goal. Please try again.'); return }
    onAdded(data)
  }

  if (!goal) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sheet.backdrop}>
        <View style={sheet.sheet}>
          <View style={sheet.headerRow}>
            <Text style={sheet.title}>Add to {goal.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={sheet.label}>Amount to add</Text>
          <View style={[styles.lineItemInput, sheet.amountInput]}>
            <Text style={[styles.lineItemCurrency, { fontSize: 20 }]}>€</Text>
            <TextInput
              style={[styles.lineItemAmount, { fontSize: 22 }]}
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.light}
              autoFocus
            />
          </View>
          <Text style={sheet.hint}>This is added to your goal and taken off your available balance above.</Text>
          {!!error && <Text style={sheet.error}>{error}</Text>}
          <TouchableOpacity style={[sheet.submitBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.accentFg} /> : <Text style={sheet.submitBtnText}>Add to Goal</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Add Goal — name, target amount, optional deadline, icon selection ────
function AddGoalSheet({ visible, onClose, onCreate }) {
  const { colors } = useTheme()
  const sheet = __gs_sheet(colors)
  const styles = __gs_styles(colors)
  const [name,     setName]     = useState('')
  const [target,   setTarget]   = useState('')
  const [deadline, setDeadline] = useState('')
  const [icon,     setIcon]     = useState('Target')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (visible) { setName(''); setTarget(''); setDeadline(''); setIcon('Target'); setError('') }
  }, [visible])

  async function submit() {
    if (!name.trim())               { setError('Give your goal a name.'); return }
    const val = parseFloat(target)
    if (!val || val <= 0)           { setError('Enter a target amount greater than €0.'); return }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) { setError('Deadline should be in YYYY-MM-DD format.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await onCreate({ name: name.trim(), target_amount: val, deadline: deadline || null, icon })
    setSaving(false)
    if (err) { setError('Could not create this goal. Please try again.'); return }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sheet.backdrop}>
        <View style={sheet.sheet}>
          <View style={sheet.headerRow}>
            <Text style={sheet.title}>New Goal</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={sheet.label}>Goal name</Text>
            <TextInput style={sheet.input} value={name} onChangeText={setName} placeholder="e.g. New Laptop" placeholderTextColor={colors.light} />

            <Text style={[sheet.label, { marginTop: 16 }]}>Target amount</Text>
            <View style={[styles.lineItemInput, sheet.amountInput]}>
              <Text style={styles.lineItemCurrency}>€</Text>
              <TextInput
                style={styles.lineItemAmount}
                value={target}
                onChangeText={v => setTarget(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.light}
              />
            </View>

            <Text style={[sheet.label, { marginTop: 16 }]}>Deadline (optional)</Text>
            <TextInput style={sheet.input} value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" placeholderTextColor={colors.light} />

            <Text style={[sheet.label, { marginTop: 16 }]}>Icon</Text>
            <View style={sheet.iconRow}>
              {GOAL_ICON_KEYS.map(key => {
                const IconC = GOAL_ICONS[key]
                const active = icon === key
                return (
                  <TouchableOpacity
                    key={key}
                    style={[sheet.iconChip, active && sheet.iconChipActive]}
                    onPress={() => setIcon(key)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${key} icon`}
                    accessibilityState={{ selected: active }}
                  >
                    <IconC size={18} color={active ? colors.accentFg : colors.textPrimary} />
                  </TouchableOpacity>
                )
              })}
            </View>

            {!!error && <Text style={sheet.error}>{error}</Text>}
            <TouchableOpacity style={[sheet.submitBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.accentFg} /> : <Text style={sheet.submitBtnText}>Create Goal</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── SUSI Term (expandable) ───────────────────────────────────────────────────
function SUSITerm({ item }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(v => !v)}>
      <Card style={styles.termCard}>
        <View style={styles.termHeader}>
          <Text style={styles.termName}>{item.term}</Text>
          {open
            ? <ChevronUp   size={15} color={colors.textPrimary} />
            : <ChevronDown size={15} color={colors.muted} />}
        </View>
        {open && <Text style={styles.termPlain}>{item.plain}</Text>}
      </Card>
    </TouchableOpacity>
  )
}

// ─── SUSI Estimator ───────────────────────────────────────────────────────────
function SUSIEstimator() {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [income,     setIncome]     = useState('')
  const [dependants, setDependants] = useState('1')
  const [adjacent,   setAdjacent]   = useState(false)
  const [result,     setResult]     = useState(null)

  function estimate() {
    const inc  = parseFloat(income) || 0
    const deps = Math.max(1, parseInt(dependants) || 1)

    // Walk through each band — threshold scales up per additional dependant
    let matched = null
    for (let i = 0; i < SUSI_BANDS.length; i++) {
      const b = SUSI_BANDS[i]
      const threshold = b.threshold + (deps - 1) * b.perDep
      if (inc <= threshold) { matched = b; break }
    }

    if (matched) {
      const maintenance = adjacent ? matched.adj : matched.nonadj
      setResult({
        band: matched.band,
        maintenance,
        feeOnly: false,
        note: `Based on your household income, you may qualify for the ${matched.band} maintenance grant.`,
      })
    } else if (inc <= SUSI_FEE_THRESHOLD + (deps - 1) * SUSI_FEE_PER_DEP) {
      setResult({
        band: 'Fee Only',
        maintenance: 0,
        feeOnly: true,
        note: 'Your income may be above the maintenance grant threshold but you could still qualify for a fee contribution grant toward your Student Contribution Charge. Check susi.ie for the exact fee bands.',
      })
    } else {
      setResult({
        band: 'over',
        maintenance: 0,
        feeOnly: false,
        note: 'Based on your income, your household may be above all SUSI thresholds for this year. Thresholds change annually, so it is always worth checking susi.ie directly.',
      })
    }
  }

  const depOpts = ['1', '2', '3', '4', '5', '6+']

  return (
    <View>
      <View style={styles.estimatorDisclaimer}>
        <Info size={13} color='#92400E' />
        <Text style={styles.estimatorDisclaimerText}>
          Estimator only, not an official assessment. Rates are published 2026/27 figures from susi.ie. Your actual award depends on full means testing.
        </Text>
      </View>

      <Card style={styles.estimatorCard}>
        <Text style={styles.estimatorFieldLabel}>Household reckonable income (€)</Text>
        <View style={[styles.lineItemInput, styles.estimatorInput]}>
          <Text style={styles.lineItemCurrency}>€</Text>
          <TextInput
            style={[styles.lineItemAmount, { fontSize: 17 }]}
            value={income}
            onChangeText={val => { setIncome(val.replace(/[^0-9.]/g, '')); setResult(null) }}
            keyboardType="decimal-pad"
            placeholder="e.g. 38000"
            placeholderTextColor={colors.light}
          />
        </View>

        <Text style={[styles.estimatorFieldLabel, { marginTop: 16 }]}>Number of dependants in household</Text>
        <View style={styles.depRow}>
          {depOpts.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.depChip, dependants === opt && styles.depChipActive]}
              onPress={() => { setDependants(opt); setResult(null) }}
              activeOpacity={0.8}
            >
              <Text style={[styles.depChipText, dependants === opt && styles.depChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.estimatorFieldLabel, { marginTop: 16 }]}>Distance from college</Text>
        <View style={styles.depRow}>
          <TouchableOpacity
            style={[styles.depChip, { flex: 1 }, !adjacent && styles.depChipActive]}
            onPress={() => { setAdjacent(false); setResult(null) }}
            activeOpacity={0.8}
          >
            <Text style={[styles.depChipText, !adjacent && styles.depChipTextActive]}>Non-Adjacent (30km+)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.depChip, { flex: 1 }, adjacent && styles.depChipActive]}
            onPress={() => { setAdjacent(true); setResult(null) }}
            activeOpacity={0.8}
          >
            <Text style={[styles.depChipText, adjacent && styles.depChipTextActive]}>Adjacent (under 30km)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.estimateBtn} onPress={estimate} activeOpacity={0.8}>
          <Text style={styles.estimateBtnText}>Estimate My Eligibility</Text>
        </TouchableOpacity>
      </Card>

      {result && (
        <Card style={[styles.resultCard, (result.band === 'over' || result.feeOnly) && styles.resultCardOver]}>
          {result.maintenance > 0 && (
            <View style={styles.resultAmount}>
              <Text style={styles.resultAmtLabel}>Estimated annual maintenance grant</Text>
              <Text style={styles.resultAmtValue}>€{result.maintenance.toLocaleString()}</Text>
              <Text style={styles.resultAmtSub}>
                {adjacent ? 'Adjacent rate' : 'Non-adjacent rate'} · {result.band}
              </Text>
            </View>
          )}
          <Text style={styles.resultNote}>{result.note}</Text>
          <Text style={styles.resultDisclaimer}>
            This estimate does not account for all SUSI eligibility conditions. The fee contribution grant may also apply. Official assessment only at susi.ie.
          </Text>
        </Card>
      )}
    </View>
  )
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
let nextId = 100  // simple ID generator (not Date.now — breaks resume)

const DEFAULT_EXPENSES = [
  { id: 10, label: 'Rent / Accommodation', amount: '' },
  { id: 11, label: 'Food & Groceries',     amount: '' },
  { id: 12, label: 'Transport',            amount: '' },
  { id: 13, label: 'Course materials',     amount: '' },
  { id: 14, label: 'Utilities',            amount: '' },
  { id: 15, label: 'Going out',            amount: '' },
  { id: 16, label: 'Subscriptions',        amount: '' },
]
// Seeded once per user the first time they have zero goals on file (tracked
// locally so deliberately deleting every goal afterward doesn't bring them
// back) — matches the "Emergency Fund" / "Holiday Savings" defaults the
// screen used to ship with, now real Supabase rows instead of blank
// AsyncStorage placeholders.
const GOALS_SEEDED_KEY_PREFIX = 'ub_goals_seeded_'
const DEFAULT_GOAL_SEEDS = [
  { name: 'Emergency Fund',  target_amount: 500, icon: 'ShieldCheck' },
  { name: 'Holiday Savings', target_amount: 300, icon: 'Plane' },
]

function BudgetTab({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const { user } = useAuth()
  const { userType, loading: userTypeLoading, label: userTypeLabel } = useUserType()
  const [loaded, setLoaded]   = useState(false)
  const [period, setPeriod]   = useState('month')
  const [mode,   setMode]     = useState('both')
  // Tracks which user type the income categories below were last generated
  // for, so a change made in Settings (see Account Type there) regenerates
  // them, while an unchanged type never clobbers what's already been typed.
  const [appliedUserType, setAppliedUserType] = useState(null)

  const [income,   setIncome]   = useState(() => defaultIncomeForType(userType))
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES)

  // Goals — persisted to Supabase (budget_goals table, RLS scoped to the
  // owning user), not AsyncStorage, since they need to survive a reinstall
  // and follow the account rather than the device.
  const [goals,       setGoals]       = useState([])
  const [goalsLoaded,  setGoalsLoaded]  = useState(false)
  const [addToGoal,    setAddToGoal]    = useState(null)  // goal object, or null when closed
  const [addGoalOpen,  setAddGoalOpen]  = useState(false)

  // Load any previously saved budget the first time this tab mounts — keyed
  // per-user so a different account signing in on the same device never
  // loads (or later overwrites) someone else's income/expenses. Re-runs if
  // the signed-in user changes while this tab stays mounted.
  useEffect(() => {
    if (!user?.id) { setLoaded(false); return }
    let cancelled = false
    setLoaded(false)
    AsyncStorage.getItem(BUDGET_STORAGE_KEY_PREFIX + user.id).then(raw => {
      if (cancelled || !raw) { setLoaded(true); return }
      try {
        const saved = JSON.parse(raw)
        if (saved.period)    setPeriod(saved.period)
        if (saved.mode)      setMode(saved.mode)
        // saved.userType records which type the stored income categories
        // were generated for (older saves have no field — or the pre-user_type
        // "situation" one — and are treated as unset, below).
        if (saved.userType)  setAppliedUserType(saved.userType)
        if (saved.income)    setIncome(saved.income)
        if (saved.expenses)  setExpenses(saved.expenses)
        const maxId = Math.max(100, ...(saved.income || []).map(i => i.id), ...(saved.expenses || []).map(i => i.id))
        nextId = maxId
      } catch {
        // ignore corrupt/old-shape saved data, fall back to defaults
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
    return () => { cancelled = true }
  }, [user?.id])

  // Auto-save on every change, once the initial load has finished — this is
  // what "we track this, save anytime" means: there's no save button because
  // it's always saved.
  useEffect(() => {
    if (!loaded || !user?.id) return
    AsyncStorage.setItem(BUDGET_STORAGE_KEY_PREFIX + user.id, JSON.stringify({ period, mode, userType: appliedUserType, income, expenses })).catch(() => {})
  }, [loaded, user?.id, period, mode, appliedUserType, income, expenses])

  // Keep income categories in step with the account-wide user type (Student /
  // Apprentice / Gap Year / Worker — changed only in Settings > Account
  // Type, see useUserType()). Regenerates just the template rows (ids 1-9)
  // when the type actually changes, leaving any income source the person
  // added themselves (ids 100+, via "Add Income Source") untouched.
  useEffect(() => {
    if (!loaded || userTypeLoading) return
    if (appliedUserType === userType) return
    setIncome(prev => {
      const custom = prev.filter(i => i.id >= 100)
      return [...defaultIncomeForType(userType), ...custom]
    })
    setAppliedUserType(userType)
  }, [loaded, userTypeLoading, userType, appliedUserType])

  // Load goals from Supabase, seeding the two defaults once for a brand new
  // user with nothing on file yet.
  useEffect(() => {
    let cancelled = false
    async function loadGoals() {
      if (!user?.id) { if (!cancelled) { setGoals([]); setGoalsLoaded(true) }; return }
      const { data, error } = await supabase
        .from('budget_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      if (cancelled) return
      if (error) { setGoals([]); setGoalsLoaded(true); return }
      if (data && data.length > 0) { setGoals(data); setGoalsLoaded(true); return }

      const seededKey = `${GOALS_SEEDED_KEY_PREFIX}${user.id}`
      const alreadySeeded = await AsyncStorage.getItem(seededKey).catch(() => null)
      if (alreadySeeded) { setGoals([]); setGoalsLoaded(true); return }
      const { data: inserted, error: seedError } = await supabase
        .from('budget_goals')
        .insert(DEFAULT_GOAL_SEEDS.map(g => ({ ...g, user_id: user.id })))
        .select()
      // Only remember "seeded" once the insert actually succeeded — an RLS
      // or network hiccup here must not permanently skip seeding for a
      // student who genuinely has no goals yet.
      if (!seedError) await AsyncStorage.setItem(seededKey, '1').catch(() => {})
      if (!cancelled) { setGoals(inserted || []); setGoalsLoaded(true) }
    }
    loadGoals()
    return () => { cancelled = true }
  }, [user?.id])

  async function createGoal({ name, target_amount, deadline, icon }) {
    const { data, error } = await supabase
      .from('budget_goals')
      .insert({ user_id: user.id, name, target_amount, deadline, icon })
      .select().single()
    if (!error && data) {
      setGoals(prev => [...prev, data])
      setAddGoalOpen(false)
    }
    return { error }
  }

  function confirmRemoveGoal(goal) {
    Alert.alert('Remove this goal?', `This deletes "${goal.name}" and its progress. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('budget_goals').delete().eq('id', goal.id)
          if (!error) setGoals(prev => prev.filter(g => g.id !== goal.id))
        },
      },
    ])
  }

  function handleContributionAdded(updatedGoal) {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g))
    setAddToGoal(null)
  }

  // Total saved toward goals so far — money already committed isn't
  // "available" any more, so it comes off the balance below.
  const totalGoalContributions = goals.reduce((s, g) => s + (parseFloat(g.current_amount) || 0), 0)

  function goToAccountType() {
    // Budgeting is nested inside the Home stack — hop up to the tab
    // navigator to reach Profile's Account Type setting.
    navigation?.getParent()?.navigate('Profile', { screen: 'ProfileMain' })
  }

  const totalIncome   = income.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalExpenses = expenses.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  // Money already put toward a savings goal isn't available to spend any
  // more, so it comes off the balance — this is what "subtracted from
  // available balance" means for the Add to Goal flow.
  const balance       = totalIncome - totalExpenses - totalGoalContributions
  const hasAnyData    = totalIncome > 0 || totalExpenses > 0

  const periodLabels = { week: 'Weekly', month: 'Monthly', term: 'Per Term' }

  function updateAmount(list, setList, id, val) {
    setList(list.map(item => item.id === id ? { ...item, amount: val } : item))
  }

  function addIncome() {
    nextId++
    setIncome([...income, { id: nextId, label: 'Other income', amount: '' }])
  }

  function addExpense() {
    nextId++
    setExpenses([...expenses, { id: nextId, label: 'Other expense', amount: '' }])
  }

  function removeIncome(id)  { setIncome(income.filter(i => i.id !== id)) }
  function removeExpense(id) { setExpenses(expenses.filter(i => i.id !== id)) }

  const balanceColor = balance > 0
    ? colors.success
    : balance < 0
      ? colors.destructive
      : colors.muted

  const barPalette = isDark
    ? ['#F5F0E8', '#8FB0E8', '#B7A3F0', '#F2A584', '#7DD3CB', '#9CA3AF']
    : ['#1E3A5F', '#5B7DB8', '#7B61C4', '#C96A42', '#4FA3AC', '#8A8F98']
  const spendRows = expenses
    .map(e => ({ id: e.id, label: e.label, value: parseFloat(e.amount) || 0 }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value)
  const periodWord = period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this term'
  const bigBalanceColor = balance < 0 ? colors.destructive : colors.goldText

  return (
    <View>
      {/* Balance first, as a big number. All the other numbers sit just below. */}
      <Text style={[styles.bigLabel, { color: colors.textSecondary }]}>{`BALANCE ${periodWord.toUpperCase()}`}</Text>
      <Text style={[styles.bigNumber, { color: bigBalanceColor }]} accessibilityLabel={`Balance ${periodWord}, ${balance < 0 ? 'minus ' : ''}${Math.abs(Math.round(balance))} euro`} adjustsFontSizeToFit numberOfLines={1}>
        {balance < 0 ? '-' : ''}€{formatNumber(Math.abs(Math.round(balance)))}
      </Text>
      <Text style={[styles.bigSub, { color: colors.textSecondary }]}>
        €{formatNumber(Math.round(totalIncome))} in, €{formatNumber(Math.round(totalExpenses))} out
      </Text>

      {spendRows.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.spendBar} accessibilityLabel="Where your spending went">
            {spendRows.map((r, n) => (
              <View key={r.id} style={{ flex: r.value, backgroundColor: barPalette[n % barPalette.length], marginLeft: n === 0 ? 0 : 2 }} />
            ))}
          </View>
          <Card style={[styles.entriesCard, { marginTop: spacing.md }]}>
            {spendRows.map((r, n) => (
              <View key={r.id} style={[styles.spendRow, n < spendRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[styles.spendDot, { backgroundColor: barPalette[n % barPalette.length] }]} />
                <Text style={[styles.spendLabel, { color: colors.textPrimary }]} numberOfLines={1}>{r.label}</Text>
                <Text style={[styles.spendValue, { color: colors.textPrimary }]}>€{formatNumber(Math.round(r.value))}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <TouchableOpacity style={styles.addExpenseBig} activeOpacity={0.85} onPress={addExpense} accessibilityRole="button" accessibilityLabel="Add expense">
        <Plus size={18} color={colors.accentFg} />
        <Text style={styles.addExpenseBigText}>Add expense</Text>
      </TouchableOpacity>

      {/* Account type — the income categories below are tailored to this.
          Changed in Settings (Profile > Account Type), not here, so it
          stays the same single, reusable concept every screen reads. */}
      <TouchableOpacity style={[styles.userTypeRow, { marginTop: spacing.xl }]} activeOpacity={0.8} onPress={goToAccountType}>
        <View style={{ flex: 1 }}>
          <Text style={styles.userTypeLabel}>Your account type</Text>
          <Text style={styles.userTypeValue}>{userTypeLabel}</Text>
        </View>
        <Text style={styles.userTypeChange}>Change in Settings</Text>
        <ChevronRight size={14} color={colors.light} />
      </TouchableOpacity>

      {/* Period selector */}
      <View style={[styles.segmentRow, { marginTop: spacing.md }]}>
        {[['week','This Week'], ['month','This Month'], ['term','This Term']].map(([k, label]) => (
          <TouchableOpacity
            key={k}
            style={[styles.segChip, period === k && styles.segChipActive]}
            onPress={() => setPeriod(k)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segChipText, period === k && styles.segChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode filter */}
      <View style={[styles.segmentRow, { marginTop: 8 }]}>
        {[['both','Both'], ['saving','Saving'], ['spending','Spending']].map(([k, label]) => (
          <TouchableOpacity
            key={k}
            style={[styles.modeChip, mode === k && styles.modeChipActive]}
            onPress={() => setMode(k)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeChipText, mode === k && styles.modeChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mini dashboard */}
      <View style={styles.dashboard}>
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>Income</Text>
          <Text style={[styles.dashValue, { color: colors.success }]}>
            €{formatNumber(totalIncome, { decimals: 2 })}
          </Text>
          <Text style={styles.dashPeriod}>{periodLabels[period]}</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>Expenses</Text>
          <Text style={[styles.dashValue, { color: colors.textPrimary }]}>
            €{formatNumber(totalExpenses, { decimals: 2 })}
          </Text>
          <Text style={styles.dashPeriod}>{periodLabels[period]}</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>Balance</Text>
          <Text style={[styles.dashValue, { color: balanceColor }]}>
            {balance < 0 ? '-' : ''}€{formatNumber(Math.abs(balance), { decimals: 2 })}
          </Text>
          <Text style={styles.dashPeriod}>{periodLabels[period]}</Text>
        </View>
      </View>

      {/* Empty state */}
      {!hasAnyData && (
        <Card style={styles.emptyState}>
          <Wallet size={40} color="rgba(30,58,95,0.2)" />
          <Text style={styles.emptyTitle}>Your financial picture starts here.</Text>
          <Text style={styles.emptySub}>
            Enter your income and expenses below. Your balance updates live as you type, no submit button needed.
          </Text>
        </Card>
      )}

      {/* Income section */}
      {(mode === 'both' || mode === 'saving') && (
        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <TrendingUp size={16} color={colors.success} />
            <Text style={styles.entriesTitle}>Income</Text>
            <Text style={styles.entriesTotalLabel}>€{formatNumber(totalIncome, { decimals: 2 })}</Text>
          </View>
          <Card style={styles.entriesCard}>
            {income.map((item, i) => (
              <View key={item.id}>
                <LineItem
                  item={item}
                  onChangeAmount={(id, val) => updateAmount(income, setIncome, id, val)}
                  onRemove={income.length > 1 ? removeIncome : null}
                  tint={colors.success}
                />
                {i < income.length - 1 && <View style={styles.lineItemDivider} />}
              </View>
            ))}
          </Card>
          <TouchableOpacity style={styles.addRowBtn} onPress={addIncome} activeOpacity={0.8}>
            <Plus size={14} color={colors.textPrimary} />
            <Text style={styles.addRowBtnText}>Add Income Source</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expenses section */}
      {(mode === 'both' || mode === 'spending') && (
        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <TrendingDown size={16} color={colors.textPrimary} />
            <Text style={styles.entriesTitle}>Expenses</Text>
            <Text style={styles.entriesTotalLabel}>€{formatNumber(totalExpenses, { decimals: 2 })}</Text>
          </View>
          <Card style={styles.entriesCard}>
            {expenses.map((item, i) => (
              <View key={item.id}>
                <LineItem
                  item={item}
                  onChangeAmount={(id, val) => updateAmount(expenses, setExpenses, id, val)}
                  onRemove={expenses.length > 1 ? removeExpense : null}
                  tint={colors.textPrimary}
                />
                {i < expenses.length - 1 && <View style={styles.lineItemDivider} />}
              </View>
            ))}
          </Card>
          <TouchableOpacity style={styles.addRowBtn} onPress={addExpense} activeOpacity={0.8}>
            <Plus size={14} color={colors.textPrimary} />
            <Text style={styles.addRowBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tracking note — this is the "we track this, save anytime" line: there's
          no save button because everything above is auto-saved on your device
          as you type, and will still be here next time you open the app. */}
      <View style={styles.trackingNote}>
        <Save size={13} color={colors.muted} />
        <Text style={styles.trackingNoteText}>
          We track this for you as you go. Come back anytime and your numbers will still be here.
        </Text>
      </View>

      {/* Split the bill: opens the tracker for shared bills and subscriptions */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation?.navigate('SplitBill')}
        accessibilityRole="button"
        accessibilityLabel="Split the bill. Share a bill or subscription with friends."
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: spacing.xl, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, ...shadows.card }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(180,146,58,0.16)' }}>
          <Receipt size={20} color={colors.textPrimary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15.5, color: colors.textPrimary }}>Split the bill</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2 }}>Share a bill or subscription with friends. Tracking only.</Text>
        </View>
        <ChevronRight size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Goals */}
      <SectionHeader eyebrow="Goals" title="Track Your Progress" style={{ marginTop: spacing.xl }} />
      {!goalsLoaded ? (
        <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: spacing.md }} />
      ) : (
        <View style={{ gap: 12 }}>
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onAddPress={setAddToGoal} onRemove={confirmRemoveGoal} />
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.addRowBtn} onPress={() => setAddGoalOpen(true)} activeOpacity={0.8}>
        <Plus size={14} color={colors.textPrimary} />
        <Text style={styles.addRowBtnText}>Add Goal</Text>
      </TouchableOpacity>

      <AddToGoalSheet
        visible={!!addToGoal}
        goal={addToGoal}
        onClose={() => setAddToGoal(null)}
        onAdded={handleContributionAdded}
      />
      <AddGoalSheet
        visible={addGoalOpen}
        onClose={() => setAddGoalOpen(false)}
        onCreate={createGoal}
      />

      {/* Money tip */}
      <Card style={styles.tipCard}>
        <Text style={styles.tipEyebrow}>MONEY TIP</Text>
        <Text style={styles.tipText}>
          The 50/30/20 rule: 50% of income on needs, 30% on wants, 20% on savings. Adjust the split to fit your actual situation, there is no one-size-fits-all.
        </Text>
      </Card>
    </View>
  )
}

// ─── SUSI Tab ─────────────────────────────────────────────────────────────────
function SUSITab() {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [checkedSteps, setCheckedSteps] = useState([])

  function toggleStep(i) {
    setCheckedSteps(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  return (
    <View>
      {/* Editorial intro */}
      <Card style={styles.susiIntro}>
        <Text style={styles.susiIntroTitle}>Every grant and scheme worth knowing</Text>
        <Text style={styles.susiIntroBody}>
          SUSI is the biggest one, and it's where most students should start, but it isn't the only real financial support available. Depending on your situation, several of these can apply alongside SUSI, not instead of it.
        </Text>
        <Text style={[styles.susiIntroBody, { marginTop: 12 }]}>
          A lot of students who qualify for something never apply, either because the process feels complicated or they assume they won't be eligible. This guide is here to change that. If there's a chance you're eligible, it's worth fifteen minutes to find out.
        </Text>
      </Card>

      {/* CourseCompass — more funding options beyond what's listed here */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL('https://coursecompass.ie')}>
        <View style={styles.compassLinkRow}>
          <Text style={styles.compassLinkText}>Find more funding options on CourseCompass</Text>
          <ChevronRight size={15} color={colors.textPrimary} />
        </View>
      </TouchableOpacity>

      {/* What can you get */}
      <SectionHeader eyebrow="Types of Support" title="What SUSI Can Cover" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 12 }}>
        <Card style={styles.susiGrantCard}>
          <Text style={styles.susiGrantType}>Maintenance Grant</Text>
          <Text style={styles.susiGrantDesc}>
            A direct contribution toward your living costs: rent, food, transport, and general expenses while you study. Paid as a lump sum or in instalments, depending on the rate you're awarded.
          </Text>
          <View style={styles.susiRates}>
            <View style={styles.susiRateRow}>
              <Text style={styles.susiRateLabel}>Special Rate · Non-adjacent</Text>
              <Text style={styles.susiRateValue}>€7,936/yr</Text>
            </View>
            <View style={styles.susiRateRow}>
              <Text style={styles.susiRateLabel}>Special Rate · Adjacent</Text>
              <Text style={styles.susiRateValue}>€3,230/yr</Text>
            </View>
            <View style={styles.susiRateRow}>
              <Text style={styles.susiRateLabel}>Band 1 (Full) · Non-adjacent</Text>
              <Text style={styles.susiRateValue}>€4,722/yr</Text>
            </View>
            <View style={[styles.susiRateRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.susiRateLabel}>Band 1 (Full) · Adjacent</Text>
              <Text style={styles.susiRateValue}>€1,774/yr</Text>
            </View>
          </View>
          <Text style={styles.susiRateNote}>
            2026/27 rates from susi.ie. Partial maintenance (Bands 2 to 4: €612 to €3,532/yr) available above Band 1 threshold. Use the estimator below to find your band.
          </Text>
        </Card>

        <Card style={styles.susiGrantCard}>
          <Text style={styles.susiGrantType}>Fee Contribution Grant</Text>
          <Text style={styles.susiGrantDesc}>
            SUSI can also cover part or all of your Student Contribution Charge (the €3,000 annual registration fee most undergraduates pay). Higher household income can still qualify for a partial fee contribution even if you're above the maintenance grant threshold.
          </Text>
        </Card>
      </View>

      {/* Key Terms */}
      <SectionHeader eyebrow="Plain Language" title="Key Terms Explained" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 10 }}>
        {SUSI_TERMS.map(t => <SUSITerm key={t.term} item={t} />)}
      </View>

      {/* SUSI Estimator */}
      <SectionHeader eyebrow="Live Estimator" title="Check Your Eligibility" style={{ marginTop: spacing.xl }} />
      <SUSIEstimator />

      {/* Application checklist */}
      <SectionHeader eyebrow="How to Apply" title="Application Checklist" style={{ marginTop: spacing.xl }} />
      <Card style={styles.checklistCard}>
        {APPLICATION_STEPS.map((step, i) => {
          const done = checkedSteps.includes(i)
          return (
            <TouchableOpacity
              key={i}
              style={[styles.checklistRow, i < APPLICATION_STEPS.length - 1 && styles.checklistRowBorder]}
              onPress={() => toggleStep(i)}
              activeOpacity={0.8}
            >
              {done
                ? <CheckCircle size={18} color={colors.success} />
                : <Circle      size={18} color={colors.light} />}
              <Text style={[styles.checklistText, done && styles.checklistTextDone]} numberOfLines={4}>
                {step}
              </Text>
            </TouchableOpacity>
          )
        })}
      </Card>

      {/* Official link CTA */}
      <TouchableOpacity style={styles.susiCta} activeOpacity={0.8} onPress={() => Linking.openURL('https://susi.ie')}>
        <View>
          <Text style={styles.susiCtaLabel}>Ready to apply?</Text>
          <Text style={styles.susiCtaTitle}>Go to susi.ie</Text>
        </View>
        <ExternalLink size={20} color={colors.accentFg} />
      </TouchableOpacity>

      {/* Other real Irish grants and schemes, alongside SUSI */}
      <SectionHeader eyebrow="Beyond SUSI" title="Other Grants & Schemes" style={{ marginTop: spacing.xl }} />
      <Text style={styles.schemesIntro}>
        These are separate applications, separate funding bodies, and worth checking even if you already get SUSI, or even if SUSI turned you down.
      </Text>
      <View style={{ gap: 12 }}>
        {OTHER_SCHEMES.map(s => <SchemeCard key={s.name} item={s} />)}
      </View>
    </View>
  )
}

// ─── Investment Tab ───────────────────────────────────────────────────────────
// Structure: fundamentals first (what investing is, risk basics, why time
// matters, a plain-language glossary), then the investment partner
// placeholder (see InvestmentPartnerPlaceholder), then a risk disclosure.
// No trading promotion of any kind lives here.
function InvestmentTab({ navigation }) {
  const { canAccess, hasDateOfBirth, minAge, loading } = useInvestmentAccess()

  // Fail closed: while the profile is still loading, or for anyone under
  // minAge (18) — including every account with no date_of_birth on file at
  // all, which is every user created before this field existed. Nobody
  // sees the investment content below on an assumed age.
  if (loading) return null
  if (!canAccess) {
    return (
      <EmptyState
        icon={Lock}
        title="Investing content is for adults."
        subtitle={
          hasDateOfBirth
            ? `This tab covers investing education, so we only show it to people aged ${minAge} and over. It'll unlock automatically once you turn ${minAge}.`
            : `This tab covers investing education, so we only show it to people aged ${minAge} and over. We don't have a date of birth on file for your account yet, so it stays hidden until we do.`
        }
      />
    )
  }

  return <InvestmentTabContent navigation={navigation} />
}

// The actual Investment tab content, split out from the age gate above so
// the gate itself stays simple to read and nothing below it ever renders
// for someone who hasn't cleared it.
function InvestmentTabContent({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View>
      <Card style={styles.investIntro}>
        <Text style={styles.investIntroTitle}>Investing basics</Text>
        <Text style={styles.investIntroBody}>
          UniBlueprint doesn't give financial advice. Everything below is general education, not a recommendation to buy, sell, or trade anything. Do your own research, and only ever commit money you can afford to lose.
        </Text>
      </Card>

      {/* Fundamentals */}
      <SectionHeader eyebrow="Investing Basics" title="What Investing Actually Is" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 12 }}>
        <Card style={styles.investFactCard}>
          <View style={styles.investFactHeader}>
            <PiggyBank size={16} color={colors.textPrimary} />
            <Text style={styles.investFactTitle}>Saving vs. Investing</Text>
          </View>
          <Text style={styles.investFactBody}>
            Saving means keeping money somewhere safe and easy to reach, a bank account, credit union, or An Post, for short-term goals and an emergency fund. It won't fall in value overnight, but it also won't grow much faster than inflation. Investing means putting money into assets, shares, funds, property, that can grow over time, but can also fall in value. You're accepting some risk of loss in exchange for the chance of growing your money faster than a savings account can. Most guidance says build a small emergency fund first, money you're not investing because you might need it at short notice, before putting anything into the markets.
          </Text>
        </Card>

        <Card style={styles.investFactCard}>
          <View style={styles.investFactHeader}>
            <Scale size={16} color={colors.textPrimary} />
            <Text style={styles.investFactTitle}>Risk and Reward</Text>
          </View>
          <Text style={styles.investFactBody}>
            There's no such thing as an investment that's both completely safe and fast-growing. As a rule, the higher the potential return, the higher the potential loss. Diversification, spreading money across many different investments instead of one company or one trade, is one of the main ways investors manage that risk. It doesn't remove risk, but it limits how much damage any single investment going badly can do. How much risk makes sense for you depends on your own situation: how soon you might need the money, and how much of a loss you could genuinely handle without panic-selling at the worst possible time.
          </Text>
        </Card>
      </View>

      <SectionHeader eyebrow="The Power of Time" title="Why Starting Early Matters" style={{ marginTop: spacing.xl }} />
      <Card style={styles.investFactCard}>
        <View style={styles.investFactHeader}>
          <ClockIcon size={16} color={colors.textPrimary} />
          <Text style={styles.investFactTitle}>Compounding, and time in the market</Text>
        </View>
        <Text style={styles.investFactBody}>
          Compounding is what happens when the returns your money earns start earning returns of their own, it snowballs. That's why starting early tends to matter more than starting big.
        </Text>
        <View style={styles.investIllustration}>
          <Text style={styles.investIllustrationLabel}>FOR ILLUSTRATION ONLY, NOT A FORECAST</Text>
          <Text style={styles.investIllustrationBody}>
            €50/month invested from age 20 to 60, at a hypothetical 6% average annual return, could grow to roughly €99,000 from €24,000 actually put in. The same €50/month starting ten years later, at 30, over 30 years, could grow to roughly €50,000, about half the result, from only €6,000 less contributed.
          </Text>
        </View>
        <Text style={styles.investFactBody}>
          Real returns aren't smooth or guaranteed, some years are negative. That's exactly why "time in the market", staying invested through the ups and downs, tends to matter more for long-term growth than trying to time exactly when to buy and sell.
        </Text>
      </Card>

      {/* Glossary */}
      <SectionHeader eyebrow="Plain Language" title="Common Investing Terms" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 10 }}>
        {INVEST_TERMS.map(t => <SUSITerm key={t.term} item={t} />)}
      </View>

      {/* Investment guidance points only to the finance coach in Elevation: opens
          her coach profile (Zainab Adeyemi, Soft Life Investing). */}
      <InvestmentPartnerPlaceholder />

      {/* Strengthened risk disclosure */}
      <Card style={styles.investRiskCard}>
        <View style={styles.investRiskHeader}>
          <ShieldAlert size={17} color={colors.destructive} />
          <Text style={styles.investRiskTitle}>Before You Commit Any Money</Text>
        </View>
        <Text style={styles.investRiskBody}>
          All investing carries real risk, including the risk of losing some or all of the money involved. Past performance and any stated targets are not guarantees of future results. Only ever invest money you can genuinely afford to lose, and consider independent financial advice for anything beyond general education.
        </Text>
      </Card>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetingScreen({ navigation, route }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [tab, setTab] = useState(route?.params?.tab || 'budget')

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle title="Budgeting" />

        <View style={[styles.switchRow, { backgroundColor: colors.tabFill }]}>
          {[['budget', 'Budget'], ['susi', 'Grants'], ['invest', 'Investment']].map(([k, label]) => (
            <TouchableOpacity
              key={k}
              style={[styles.switchBtn, tab === k && { backgroundColor: colors.surface }]}
              onPress={() => setTab(k)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === k }}
            >
              <Text style={[styles.switchText, { color: tab === k ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {tab === 'budget' && <BudgetTab navigation={navigation} />}
          {tab === 'susi'   && <SUSITab />}
          {tab === 'invest' && <InvestmentTab navigation={navigation} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function __gs_styles(colors) {
  return StyleSheet.create({
  switchRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, padding: 4, borderRadius: 14 },
  switchBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 11 },
  switchText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  bigLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1.2, marginTop: 8 },
  bigNumber: { fontFamily: fonts.serif, fontSize: 68, lineHeight: 78, marginTop: 6 },
  bigSub: { fontFamily: fonts.sans, fontSize: 15, marginTop: 2 },
  spendBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  spendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
  spendDot: { width: 10, height: 10, borderRadius: 5 },
  spendLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 15 },
  spendValue: { fontFamily: fonts.sansBold, fontSize: 15 },
  addExpenseBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: radius.button, backgroundColor: colors.accentBg, marginTop: spacing.lg },
  addExpenseBigText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentFg },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 56 },

  // Hero
  hero: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 30, color: colors.chromeFg, marginTop: 6, lineHeight: 38 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },
  heroCurator: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: 'rgba(245,240,232,0.6)', marginTop: 14, lineHeight: 19 },

  // Tab selector
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface, padding: 5,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: radius.button,
  },
  tabBtnActive:     { backgroundColor: colors.accentBg },
  tabBtnText:       { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary, textAlign: 'center', lineHeight: 15 },
  tabBtnTextActive: { color: colors.accentFg },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  // Account type row — links out to Settings rather than editing in place
  userTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  userTypeLabel:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 2 },
  userTypeValue:  { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
  userTypeChange: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary, opacity: 0.65 },

  // Tracking note
  trackingNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: spacing.lg, paddingHorizontal: 4,
  },
  trackingNoteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, flex: 1, lineHeight: 17 },

  // Investment tab
  investIntro:      { padding: 18 },
  investIntroTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary, marginBottom: 8 },
  investIntroBody:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },

  // Fundamentals cards (saving vs investing, risk/reward, compounding)
  investFactCard:   { padding: 18 },
  investFactHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  investFactTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  investFactBody:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  investIllustration: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    padding: 14, marginVertical: 10,
  },
  investIllustrationLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.goldDeep,
    letterSpacing: 0.6, marginBottom: 6,
  },
  investIllustrationBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },

  // Bridge line between fundamentals and coaches
  investBridge: {
    fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted, lineHeight: 21,
    marginTop: spacing.xl, marginBottom: 4, fontStyle: 'italic',
  },

  // Coach option cards
  investCard:    { padding: 16 },
  investCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  investCardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  investIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  investLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  investSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  investBadge: {
    backgroundColor: '#F0FDF4', borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  investBadgeText: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.success,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  investDetail: {
    fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },

  // Strengthened risk disclosure, closing card of the Investment tab
  investRiskCard: {
    marginTop: spacing.xl, padding: 18,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)',
  },
  investRiskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  investRiskTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.destructive },
  investRiskBody:   { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textPrimary, lineHeight: 19 },

  // Segment / filter
  segmentRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.button,
    padding: 4, ...shadows.card,
  },
  segChip:         { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button - 2 },
  segChipActive:   { backgroundColor: colors.accentBg },
  segChipText:     { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  segChipTextActive:{ color: colors.accentFg },
  modeChip:         { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button - 2, backgroundColor: colors.surfaceAlt },
  modeChipActive:   { backgroundColor: colors.accentBg },
  modeChipText:     { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  modeChipTextActive:{ color: colors.accentFg },

  // Mini dashboard
  dashboard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.card, padding: spacing.md, marginTop: spacing.md,
    alignItems: 'center', ...shadows.card,
  },
  dashItem:   { flex: 1, alignItems: 'center' },
  dashLabel:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  dashValue:  { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  dashPeriod: { fontFamily: fonts.sans, fontSize: 10, color: colors.light, marginTop: 3 },
  dashDivider:{ width: 1, height: 42, backgroundColor: colors.border },

  // Empty state
  emptyState: {
    alignItems: 'center', padding: 32, marginTop: spacing.md, gap: 10,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, textAlign: 'center', lineHeight: 27 },
  emptySub:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },

  // Entries section
  entriesSection: { marginTop: spacing.lg },
  entriesHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm,
  },
  entriesTitle:      { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary, flex: 1 },
  entriesTotalLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  entriesCard:       { padding: 0, overflow: 'hidden' },

  // Line item
  lineItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  lineItemDot:     { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  // L9: the label column gets the row's remaining space (with a floor of 0
  // so it can actually shrink instead of pushing the row wider). The amount
  // column itself stays auto-width here — it's reused by the full-width
  // "Add to Goal"/"New Goal" sheet inputs below, which shouldn't be capped —
  // see `lineItemAmountCol`, the fixed-width column used by the actual
  // income/expense list rows.
  lineItemLabel:   { flex: 1, minWidth: 0, fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary },
  lineItemInput:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  lineItemAmountCol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, width: 90, flexShrink: 0 },
  lineItemCurrency:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  lineItemAmount:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary, minWidth: 0, flexShrink: 1, textAlign: 'right' },
  lineItemDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  // Balance summary
  balanceSummary: {
    padding: 20, marginTop: spacing.md,
    borderLeftWidth: 4, alignItems: 'center', gap: 4,
  },
  balanceSummaryLabel:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  balanceSummaryAmount: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 42 },

  // Add row button
  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 4, marginTop: 4,
  },
  addRowBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary, opacity: 0.7 },

  // Goal card
  goalCard:       { padding: 16 },
  goalCardReached: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: 'rgba(22,163,74,0.25)' },
  goalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  goalLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, flex: 1 },
  goalDoneBadge:  { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  goalDoneText:   { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.white },
  progressTrack:  { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: 6, borderRadius: 3 },
  goalAmountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  goalPct:        { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  goalDeadline:   { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 4, fontStyle: 'italic' },
  addToGoalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 11, marginTop: 14,
  },
  addToGoalBtnReached: { backgroundColor: 'rgba(22,163,74,0.12)' },
  addToGoalBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },

  // Tip card
  tipCard:    { marginTop: spacing.lg, backgroundColor: colors.accentBg, padding: 18 },
  tipEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1, marginBottom: 6 },
  tipText:    { fontFamily: fonts.sans, fontSize: 14, color: colors.accentFg, lineHeight: 21 },

  // CourseCompass funding link
  compassLinkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.card,
    paddingHorizontal: 16, paddingVertical: 14, marginTop: spacing.sm, ...shadows.card,
  },
  compassLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary, flex: 1, marginRight: 8 },

  // SUSI intro
  susiIntro:      { padding: 20 },
  susiIntroTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 10 },
  susiIntroBody:  { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 22 },

  // SUSI grant cards
  susiGrantCard:  { padding: 18 },
  susiGrantType:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 8 },
  susiGrantDesc:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  susiRates:      { marginTop: 14, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, overflow: 'hidden' },
  susiRateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  susiRateLabel:  { fontFamily: fonts.sans, fontSize: 12, color: colors.textPrimary },
  susiRateValue:  { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  susiRateNote:   { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 8, fontStyle: 'italic' },

  // Key term cards
  termCard:   { padding: 14 },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termName:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, flex: 1 },
  termPlain:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 10 },

  // SUSI estimator
  estimatorDisclaimer: {
    flexDirection: 'row', gap: 8, backgroundColor: '#FEF3C7',
    borderRadius: radius.button, padding: 12,
    borderWidth: 1, borderColor: 'rgba(146,64,14,0.2)',
    marginBottom: spacing.md,
  },
  estimatorDisclaimerText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  estimatorCard:   { padding: 18 },
  estimatorFieldLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary, marginBottom: 10 },
  estimatorInput:  {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.button,
    paddingHorizontal: 14, height: 48,
  },
  depRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  depChip:     {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.button, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
  },
  depChipActive:    { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  depChipText:      { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  depChipTextActive:{ color: colors.accentFg },
  estimateBtn: {
    backgroundColor: colors.accentBg, borderRadius: radius.button,
    height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  estimateBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },

  // SUSI result
  resultCard:     { padding: 20, marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success },
  resultCardOver: { borderLeftColor: colors.muted },
  resultAmount:   { alignItems: 'flex-start', marginBottom: 12 },
  resultAmtLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  resultAmtValue: { fontFamily: fonts.serif, fontSize: 30, color: colors.textPrimary },
  resultAmtSub:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3 },
  resultNote:     { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  resultDisclaimer:{ fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 10, lineHeight: 16, fontStyle: 'italic' },

  // Application checklist
  checklistCard:      { padding: 0, overflow: 'hidden' },
  checklistRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  checklistRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  checklistText:      { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 20 },
  checklistTextDone:  { color: colors.muted, textDecorationLine: 'line-through' },

  // SUSI CTA
  susiCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.accentBg, borderRadius: radius.card,
    padding: 20, marginTop: spacing.lg,
  },
  susiCtaLabel: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.6)', marginBottom: 2 },
  susiCtaTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.accentFg },

  // Other Grants & Schemes
  schemesIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12 },
  schemeCard:     { padding: 18 },
  schemeName:     { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, marginBottom: 4 },
  schemeForWho:   { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginBottom: 10 },
  schemeDesc:     { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  schemeLinkRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  schemeLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },
  })
}

// ─── Bottom sheet styles (Add to Goal / Add Goal) ──────────────────────────
function __gs_sheet(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary, flex: 1, marginRight: 12 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
  },
  amountInput: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 14, height: 56,
  },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 10, lineHeight: 17 },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 14 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconChip: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt, borderWidth: 1.3, borderColor: 'rgba(30,58,95,0.12)',
  },
  iconChipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 15, marginTop: 22,
  },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  })
}
