/**
 * BudgetingScreen — UniBlueprint financial companion
 *
 * ATTRIBUTION NOTE: The hero copy references "financial expert Suzi Grant."
 * Confirm correct spelling/full name and obtain appropriate permission
 * before this copy goes live. See HERO_ATTRIBUTION_NOTE below.
 *
 * SUSI FIGURES: Rates are the published 2026/27 full-time undergraduate figures
 * from susi.ie. Thresholds adjust per additional dependant as listed per band.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  TrendingUp, TrendingDown, Wallet, Target, Plus, Minus,
  ChevronDown, ChevronUp, ChevronRight, ExternalLink,
  CheckCircle, Circle, Info, Save, TrendingUp as InvestIcon, GraduationCap, BadgeEuro,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { COACHES } from './ElevationScreen'

const BUDGET_STORAGE_KEY = 'ub_budget_v1'

// ─── "Your situation" — tailors the default income label instead of shipping
// a separate tool per situation. Picking one relabels the first income row.
const SITUATIONS = [
  { key: 'student-pt', label: 'Student · Part-time work', incomeLabel: 'Part-time work' },
  { key: 'student-ft', label: 'Student · Full-time work', incomeLabel: 'Full-time work' },
  { key: 'apprentice', label: 'Apprentice',                incomeLabel: 'Apprenticeship wage' },
  { key: 'gapyear',    label: 'Gap Year',                  incomeLabel: 'Gap year income' },
  { key: 'sidehustle', label: 'Side Hustle / Self-employed', incomeLabel: 'Side hustle income' },
]

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
]

function SchemeCard({ item }) {
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
        <ExternalLink size={12} color={colors.navy} />
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
  return (
    <View style={styles.lineItem}>
      <View style={[styles.lineItemDot, { backgroundColor: tint }]} />
      <Text style={styles.lineItemLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.lineItemInput}>
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
        <TouchableOpacity onPress={() => onRemove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Minus size={14} color={colors.light} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Goal Card (visual progress, editable target + current) ──────────────────
function GoalCard({ goal, onUpdate, onRemove }) {
  const target  = parseFloat(goal.target)  || 0
  const current = parseFloat(goal.current) || 0
  const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const done    = pct >= 100

  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Target size={16} color={colors.navy} style={{ flexShrink: 0 }} />
        <Text style={styles.goalLabel} numberOfLines={1}>{goal.label}</Text>
        {done && (
          <View style={styles.goalDoneBadge}>
            <Text style={styles.goalDoneText}>Done</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => onRemove(goal.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Minus size={14} color={colors.light} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${pct}%`,
          backgroundColor: done ? colors.success : colors.navy,
        }]} />
      </View>
      <Text style={styles.goalPct}>{pct}% of €{target.toFixed(0)}</Text>

      {/* Editable fields */}
      <View style={styles.goalFields}>
        <View style={styles.goalField}>
          <Text style={styles.goalFieldLabel}>Saved so far</Text>
          <View style={styles.lineItemInput}>
            <Text style={styles.lineItemCurrency}>€</Text>
            <TextInput
              style={styles.lineItemAmount}
              value={goal.current}
              onChangeText={val => onUpdate(goal.id, 'current', val.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.light}
            />
          </View>
        </View>
        <View style={styles.goalField}>
          <Text style={styles.goalFieldLabel}>Target</Text>
          <View style={styles.lineItemInput}>
            <Text style={styles.lineItemCurrency}>€</Text>
            <TextInput
              style={styles.lineItemAmount}
              value={goal.target}
              onChangeText={val => onUpdate(goal.id, 'target', val.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.light}
            />
          </View>
        </View>
      </View>
    </Card>
  )
}

// ─── SUSI Term (expandable) ───────────────────────────────────────────────────
function SUSITerm({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(v => !v)}>
      <Card style={styles.termCard}>
        <View style={styles.termHeader}>
          <Text style={styles.termName}>{item.term}</Text>
          {open
            ? <ChevronUp   size={15} color={colors.navy} />
            : <ChevronDown size={15} color={colors.muted} />}
        </View>
        {open && <Text style={styles.termPlain}>{item.plain}</Text>}
      </Card>
    </TouchableOpacity>
  )
}

// ─── SUSI Estimator ───────────────────────────────────────────────────────────
function SUSIEstimator() {
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

const DEFAULT_INCOME = [
  { id: 1, label: 'Part-time work',        amount: '' },
  { id: 2, label: 'SUSI Grant',            amount: '' },
  { id: 3, label: 'Family support',        amount: '' },
  { id: 4, label: 'Scholarship / Bursary', amount: '' },
]
const DEFAULT_EXPENSES = [
  { id: 10, label: 'Rent / Accommodation', amount: '' },
  { id: 11, label: 'Food & Groceries',     amount: '' },
  { id: 12, label: 'Transport',            amount: '' },
  { id: 13, label: 'Course materials',     amount: '' },
  { id: 14, label: 'Utilities',            amount: '' },
  { id: 15, label: 'Going out',            amount: '' },
  { id: 16, label: 'Subscriptions',        amount: '' },
]
const DEFAULT_GOALS = [
  { id: 50, label: 'Emergency Fund', target: '', current: '' },
  { id: 51, label: 'Holiday Savings', target: '', current: '' },
]

function BudgetTab() {
  const [loaded, setLoaded]   = useState(false)
  const [period, setPeriod]   = useState('week')
  const [mode,   setMode]     = useState('both')
  const [situation, setSituation] = useState('student-pt')

  const [income,   setIncome]   = useState(DEFAULT_INCOME)
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES)
  const [goals,    setGoals]    = useState(DEFAULT_GOALS)

  // Load any previously saved budget the first time this tab mounts.
  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(BUDGET_STORAGE_KEY).then(raw => {
      if (cancelled || !raw) { setLoaded(true); return }
      try {
        const saved = JSON.parse(raw)
        if (saved.period)    setPeriod(saved.period)
        if (saved.mode)      setMode(saved.mode)
        if (saved.situation) setSituation(saved.situation)
        if (saved.income)    setIncome(saved.income)
        if (saved.expenses)  setExpenses(saved.expenses)
        if (saved.goals)     setGoals(saved.goals)
        const maxId = Math.max(100, ...(saved.income || []).map(i => i.id), ...(saved.expenses || []).map(i => i.id), ...(saved.goals || []).map(i => i.id))
        nextId = maxId
      } catch {
        // ignore corrupt/old-shape saved data, fall back to defaults
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
    return () => { cancelled = true }
  }, [])

  // Auto-save on every change, once the initial load has finished — this is
  // what "we track this, save anytime" means: there's no save button because
  // it's always saved.
  useEffect(() => {
    if (!loaded) return
    AsyncStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ period, mode, situation, income, expenses, goals })).catch(() => {})
  }, [loaded, period, mode, situation, income, expenses, goals])

  function changeSituation(key) {
    setSituation(key)
    const next = SITUATIONS.find(s => s.key === key)
    if (!next) return
    // Relabel the first income row to match the new situation, without
    // touching anything the student has already typed in.
    setIncome(prev => prev.map((item, i) => (i === 0 ? { ...item, label: next.incomeLabel } : item)))
  }

  const totalIncome   = income.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalExpenses = expenses.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const balance       = totalIncome - totalExpenses
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

  function addGoal() {
    nextId++
    setGoals([...goals, { id: nextId, label: 'New Goal', target: '', current: '' }])
  }

  function removeIncome(id)  { setIncome(income.filter(i => i.id !== id)) }
  function removeExpense(id) { setExpenses(expenses.filter(i => i.id !== id)) }
  function removeGoal(id)    { setGoals(goals.filter(g => g.id !== id)) }

  function updateGoal(id, field, val) {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: val } : g))
  }

  const balanceColor = balance > 0
    ? colors.success
    : balance < 0
      ? colors.destructive
      : colors.muted

  return (
    <View>
      {/* Situation — tailors labels instead of shipping a separate tool per situation */}
      <Text style={styles.situationLabel}>Your situation</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.situationScroll} contentContainerStyle={styles.situationContent}>
        {SITUATIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.situationChip, situation === s.key && styles.situationChipActive]}
            onPress={() => changeSituation(s.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.situationChipText, situation === s.key && styles.situationChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            €{totalIncome.toFixed(2)}
          </Text>
          <Text style={styles.dashPeriod}>{periodLabels[period]}</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>Expenses</Text>
          <Text style={[styles.dashValue, { color: colors.navy }]}>
            €{totalExpenses.toFixed(2)}
          </Text>
          <Text style={styles.dashPeriod}>{periodLabels[period]}</Text>
        </View>
        <View style={styles.dashDivider} />
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>Balance</Text>
          <Text style={[styles.dashValue, { color: balanceColor }]}>
            {balance < 0 ? '-' : ''}€{Math.abs(balance).toFixed(2)}
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
            <Text style={styles.entriesTotalLabel}>€{totalIncome.toFixed(2)}</Text>
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
            <Plus size={14} color={colors.navy} />
            <Text style={styles.addRowBtnText}>Add Income Source</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expenses section */}
      {(mode === 'both' || mode === 'spending') && (
        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <TrendingDown size={16} color={colors.navy} />
            <Text style={styles.entriesTitle}>Expenses</Text>
            <Text style={styles.entriesTotalLabel}>€{totalExpenses.toFixed(2)}</Text>
          </View>
          <Card style={styles.entriesCard}>
            {expenses.map((item, i) => (
              <View key={item.id}>
                <LineItem
                  item={item}
                  onChangeAmount={(id, val) => updateAmount(expenses, setExpenses, id, val)}
                  onRemove={expenses.length > 1 ? removeExpense : null}
                  tint={colors.navy}
                />
                {i < expenses.length - 1 && <View style={styles.lineItemDivider} />}
              </View>
            ))}
          </Card>
          <TouchableOpacity style={styles.addRowBtn} onPress={addExpense} activeOpacity={0.8}>
            <Plus size={14} color={colors.navy} />
            <Text style={styles.addRowBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Balance summary card */}
      {hasAnyData && (
        <Card style={[styles.balanceSummary, { borderLeftColor: balanceColor }]}>
          <Text style={styles.balanceSummaryLabel}>
            {balance >= 0 ? 'You have' : 'You are'}
          </Text>
          <Text style={[styles.balanceSummaryAmount, { color: balanceColor }]}>
            {balance < 0 ? '-' : ''}€{Math.abs(balance).toFixed(2)}
          </Text>
          <Text style={styles.balanceSummaryLabel}>
            {balance >= 0 ? 'left over this ' + (period === 'week' ? 'week' : period === 'month' ? 'month' : 'term') : 'over budget this ' + (period === 'week' ? 'week' : period === 'month' ? 'month' : 'term')}
          </Text>
        </Card>
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

      {/* Goals */}
      <SectionHeader eyebrow="Goals" title="Track Your Progress" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 12 }}>
        {goals.map(g => (
          <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onRemove={removeGoal} />
        ))}
      </View>
      <TouchableOpacity style={styles.addRowBtn} onPress={addGoal} activeOpacity={0.8}>
        <Plus size={14} color={colors.navy} />
        <Text style={styles.addRowBtnText}>Add Goal</Text>
      </TouchableOpacity>

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
        <ExternalLink size={20} color={colors.cream} />
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
// Links out to the trading/investment coaches on Elevation Blueprint rather
// than duplicating their profiles here.
function InvestmentTab({ navigation }) {
  const zainab  = COACHES.find(c => c.id === 16)
  const dg      = COACHES.find(c => c.name === 'DG Trading')
  const dinero  = COACHES.find(c => c.name === 'Dinero Trading Group')

  const OPTIONS = [
    { key: 'zainab', label: 'Learn with Zainab',              sub: zainab?.category || 'Investing & Finance Coach', coach: zainab, Icon: GraduationCap },
    { key: 'dg',      label: 'DG Trading',                     sub: dg?.title || 'Funded Futures Trader',            coach: dg,     Icon: InvestIcon },
    { key: 'dinero',  label: 'Invest with Dinero Trading Group', sub: 'Low-Risk Copier · targets 5–15%/month',       coach: dinero, Icon: BadgeEuro },
  ]

  return (
    <View>
      <Card style={styles.investIntro}>
        <Text style={styles.investIntroTitle}>Investing & trading education</Text>
        <Text style={styles.investIntroBody}>
          UniBlueprint doesn't give financial advice. These are independent coaches and trading educators available through the platform. Do your own research, and only ever commit money you can afford to lose.
        </Text>
      </Card>

      <View style={{ gap: 12, marginTop: spacing.md }}>
        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={opt.coach ? 0.8 : 1}
            disabled={!opt.coach}
            onPress={() => opt.coach && navigation.navigate('CoachProfile', { coach: opt.coach })}
          >
            <Card style={styles.investCard}>
              <View style={styles.investIconWrap}>
                <opt.Icon size={20} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.investLabel}>{opt.label}</Text>
                <Text style={styles.investSub} numberOfLines={1}>{opt.sub}</Text>
              </View>
              <ChevronRight size={16} color={colors.light} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetingScreen({ navigation, route }) {
  const [tab, setTab] = useState(route?.params?.tab || 'budget')

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        {/*
          HERO_ATTRIBUTION_NOTE: The copy below references "Suzi Grant."
          Confirm correct spelling/full name and obtain appropriate permission
          before this version goes live. The placeholder copy is intentionally
          written so it can be dropped in or updated once confirmed.
        */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>FINANCIAL COMPANION</Text>
          <Text style={styles.heroTitle}>Know where your money goes, every week.</Text>
          <Text style={styles.heroSub}>
            Track your term spending, set savings goals, understand what you're owed, and explore investing, all in one place.
          </Text>
          {/* NOTE: Attribution copy — confirm "Suzi Grant" spelling and permission before going live */}
          {/*
          <Text style={styles.heroCurator}>
            Insights and guidance from financial expert Suzi Grant.
          </Text>
          */}
        </View>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'budget' && styles.tabBtnActive]}
            onPress={() => setTab('budget')}
          >
            <Wallet size={15} color={tab === 'budget' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'budget' && styles.tabBtnTextActive]}>Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'susi' && styles.tabBtnActive]}
            onPress={() => setTab('susi')}
          >
            <Target size={15} color={tab === 'susi' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'susi' && styles.tabBtnTextActive]}>Grants & Schemes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'invest' && styles.tabBtnActive]}
            onPress={() => setTab('invest')}
          >
            <InvestIcon size={15} color={tab === 'invest' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'invest' && styles.tabBtnTextActive]}>Investment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {tab === 'budget' && <BudgetTab />}
          {tab === 'susi'   && <SUSITab />}
          {tab === 'invest' && <InvestmentTab navigation={navigation} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 56 },

  // Hero
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, marginTop: 6, lineHeight: 38 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  // Tab selector
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 5,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: radius.button,
  },
  tabBtnActive:     { backgroundColor: colors.navy },
  tabBtnText:       { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tabBtnTextActive: { color: colors.white },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  // Situation picker
  situationLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginBottom: 8 },
  situationScroll: { marginHorizontal: -spacing.md },
  situationContent: { paddingHorizontal: spacing.md, gap: 8, flexDirection: 'row' },
  situationChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  situationChipActive:     { backgroundColor: colors.navy, borderColor: colors.navy },
  situationChipText:       { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.muted, whiteSpace: 'nowrap' },
  situationChipTextActive: { color: colors.white },

  // Tracking note
  trackingNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: spacing.lg, paddingHorizontal: 4,
  },
  trackingNoteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, flex: 1, lineHeight: 17 },

  // Investment tab
  investIntro:      { padding: 18 },
  investIntroTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, marginBottom: 8 },
  investIntroBody:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  investCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  investIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  investLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  investSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  // Segment / filter
  segmentRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.button,
    padding: 4, ...shadows.card,
  },
  segChip:         { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button - 2 },
  segChipActive:   { backgroundColor: colors.navy },
  segChipText:     { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  segChipTextActive:{ color: colors.white },
  modeChip:         { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button - 2, backgroundColor: colors.cream },
  modeChipActive:   { backgroundColor: colors.navy },
  modeChipText:     { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  modeChipTextActive:{ color: colors.white },

  // Mini dashboard
  dashboard: {
    flexDirection: 'row', backgroundColor: colors.white,
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
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, textAlign: 'center', lineHeight: 27 },
  emptySub:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },

  // Entries section
  entriesSection: { marginTop: spacing.lg },
  entriesHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm,
  },
  entriesTitle:      { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, flex: 1 },
  entriesTotalLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  entriesCard:       { padding: 0, overflow: 'hidden' },

  // Line item
  lineItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  lineItemDot:     { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  lineItemLabel:   { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },
  lineItemInput:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  lineItemCurrency:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  lineItemAmount:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, minWidth: 60, textAlign: 'right' },
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
  addRowBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, opacity: 0.7 },

  // Goal card
  goalCard:       { padding: 16 },
  goalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  goalLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, flex: 1 },
  goalDoneBadge:  { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  goalDoneText:   { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.white },
  progressTrack:  { height: 6, backgroundColor: colors.cream, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: 6, borderRadius: 3 },
  goalPct:        { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 6 },
  goalFields:     { flexDirection: 'row', gap: 12, marginTop: 14 },
  goalField:      { flex: 1 },
  goalFieldLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 6 },

  // Tip card
  tipCard:    { marginTop: spacing.lg, backgroundColor: colors.navy, padding: 18 },
  tipEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1, marginBottom: 6 },
  tipText:    { fontFamily: fonts.sans, fontSize: 14, color: colors.cream, lineHeight: 21 },

  // SUSI intro
  susiIntro:      { padding: 20 },
  susiIntroTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginBottom: 10 },
  susiIntroBody:  { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 22 },

  // SUSI grant cards
  susiGrantCard:  { padding: 18 },
  susiGrantType:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginBottom: 8 },
  susiGrantDesc:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  susiRates:      { marginTop: 14, backgroundColor: colors.cream, borderRadius: radius.button, overflow: 'hidden' },
  susiRateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  susiRateLabel:  { fontFamily: fonts.sans, fontSize: 12, color: colors.navy },
  susiRateValue:  { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  susiRateNote:   { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 8, fontStyle: 'italic' },

  // Key term cards
  termCard:   { padding: 14 },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termName:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, flex: 1 },
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
  estimatorFieldLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, marginBottom: 10 },
  estimatorInput:  {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.button,
    paddingHorizontal: 14, height: 48,
  },
  depRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  depChip:     {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.button, backgroundColor: colors.cream,
    borderWidth: 1, borderColor: colors.border,
  },
  depChipActive:    { backgroundColor: colors.navy, borderColor: colors.navy },
  depChipText:      { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  depChipTextActive:{ color: colors.white },
  estimateBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  estimateBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },

  // SUSI result
  resultCard:     { padding: 20, marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success },
  resultCardOver: { borderLeftColor: colors.muted },
  resultAmount:   { alignItems: 'flex-start', marginBottom: 12 },
  resultAmtLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  resultAmtValue: { fontFamily: fonts.serif, fontSize: 30, color: colors.navy },
  resultAmtSub:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3 },
  resultNote:     { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, lineHeight: 21 },
  resultDisclaimer:{ fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 10, lineHeight: 16, fontStyle: 'italic' },

  // Application checklist
  checklistCard:      { padding: 0, overflow: 'hidden' },
  checklistRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  checklistRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  checklistText:      { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, flex: 1, lineHeight: 20 },
  checklistTextDone:  { color: colors.muted, textDecorationLine: 'line-through' },

  // SUSI CTA
  susiCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 20, marginTop: spacing.lg,
  },
  susiCtaLabel: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.6)', marginBottom: 2 },
  susiCtaTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },

  // Other Grants & Schemes
  schemesIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12 },
  schemeCard:     { padding: 18 },
  schemeName:     { fontFamily: fonts.serif, fontSize: 17, color: colors.navy, marginBottom: 4 },
  schemeForWho:   { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginBottom: 10 },
  schemeDesc:     { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  schemeLinkRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  schemeLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
})
