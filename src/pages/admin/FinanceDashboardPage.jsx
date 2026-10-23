import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Euro, Users, TrendingUp, AlertCircle, Wallet, Handshake,
  Receipt, GraduationCap, UserCheck, Megaphone, CreditCard, AlertTriangle,
  PiggyBank, Landmark, Inbox, CheckCircle2, XCircle, History,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StudioShell, StatStrip, MetricBarChart, ComparisonWidget, StatusDot, NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS } from '../../components/studio'
import {
  getFinanceRevenueSnapshot, getFinanceOneTimePayments, getFinanceRevenueByTier,
  getFinanceMarginSummary, getFinancePayoutFailureQueue, getFinanceRevenueByCohort,
  getFinanceCoachRevenueComparison, getFinanceCoachPayoutSummary, getFinancePendingCoachPayouts,
  getFinanceCommissionSummary, getFinancePartnerPayoutSummary, getPartnerTierAdminList,
  getMoneyRequests, createMoneyRequest, decideMoneyRequest,
  weekOverWeekChangePct, percentileRank, findRising,
} from '../../lib/studioMetrics'

// Studio Phase 1 pilot hub -- the Finance Dashboard rebuilt on StudioShell.
// Real data throughout, sourced from supabase/migrations/20260829140000_
// finance_dashboard_views.sql, 20261015150614_finance_revenue_one_time_
// payments.sql, 20261015150039_coach_stripe_connect.sql, and this pass's
// own 20261022120000_studio_finance_hub_banned_exclusion_and_money_
// requests.sql (which re-defines the four RPCs above to exclude the 24
// banned demo/QA accounts, and adds everything else this page calls).
//
// Client Register / Tier Scorecard / A/B Revenue Model below adapt Alex's
// UBP_Partner_Commercial_Toolkit.html (a standalone localStorage-only HTML
// tool) onto real Supabase data -- partner_tier_assignments,
// partner_negotiation_log, tier_change_log via the existing
// get_partner_tier_admin_list() / set_partner_tier() / set_payment_option()
// / set_founding_badge() / record_negotiated_rate() RPCs (already live,
// predate this page) -- keeping the scorecard and A/B calculator's math
// exactly as Alex built it (see classifyScores / calcPricing below, ported
// verbatim).
//
// Scoped strictly to money, same as before -- not the broader platform
// metrics the Founder/Operations dashboards show.

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
]

const PENDING_REASON_LABELS = {
  pending_tier_assignment: 'Awaiting Partner Tier assignment',
  no_connect_account: "Coach hasn't started Stripe onboarding",
  connect_account_not_verified: 'Stripe onboarding not yet verified',
}

const PAGE_STYLES = `
  .fn-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch; }
  .fn-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .fn-table-wrap { overflow-x: auto; }
  .fn-table { width: 100%; border-collapse: collapse; }
  .fn-table th { text-align: left; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; padding: 0 10px 8px; border-bottom: 1px solid rgba(30,58,95,0.1); white-space: nowrap; }
  .fn-table td { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; padding: 8px 10px; border-bottom: 1px solid rgba(30,58,95,0.06); white-space: nowrap; }
  .fn-table tr:last-child td { border-bottom: none; }
  @media (max-width: 1100px) { .fn-two-col { grid-template-columns: 1fr; } .fn-three-col { grid-template-columns: 1fr; } }
`

function fmtEuro(cents) {
  if (cents === null || cents === undefined) return '—'
  return `€${(cents / 100).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmt(n) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('en-IE')
}
function pctWhole(x) { return x == null ? '—' : `${Number(x).toFixed(1)}%` }
function safeNumber(v, def = 0) { const n = Number(v); return Number.isFinite(n) ? n : def }

function SectionTitle({ eyebrow, title, caption, action }) {
  return (
    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div>
        <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          {eyebrow}
        </p>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: '19px', color: NAVY, margin: '3px 0 0' }}>{title}</h2>
        {caption && <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, margin: '4px 0 0', lineHeight: 1.5 }}>{caption}</p>}
      </div>
      {action}
    </div>
  )
}

function Card({ children, style, id }) {
  return (
    <div id={id} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(30,58,95,0.08)', padding: '18px 20px', scrollMarginTop: '60px', ...style }}>
      {children}
    </div>
  )
}

function MoneyRow({ label, count, cents, tone = NAVY }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY }}>
        {label} {count != null && <span style={{ color: MUTED }}>({fmt(count)})</span>}
      </span>
      <span style={{ fontFamily: FONT_SERIF, fontSize: '18px', color: tone }}>{fmtEuro(cents)}</span>
    </div>
  )
}

function EmptyNote({ children }) {
  return <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: MUTED, display: 'flex', alignItems: 'center', gap: '6px' }}>{children}</p>
}

// ─── Tier Scorecard math, ported verbatim from Alex's toolkit ────────────
const SCORE_ANCHORS = {
  size: {
    1: ['Early/local', 'Solo or very small operator with a narrow local footprint and early client base.'],
    2: ['Established local', 'Stable local operator with a meaningful customer base but limited reach beyond one area.'],
    3: ['Broader reach', 'Established city/regional reach, meaningful online reach, or clear ability to serve beyond one small locality.'],
    4: ['Scaled regional', 'Multi-location, strong regional presence, or a substantial digital operation serving a wide customer base.'],
    5: ['National-scale', 'Large, highly established operation with broad geographic reach or materially scaled distribution.'],
  },
  service: {
    1: ['Single service', 'One clear core offering with little meaningful service diversification.'],
    2: ['Core + add-ons', 'One primary service supported by a small number of related add-ons or packages.'],
    3: ['Multi-service', 'Several distinct customer-facing services or materially different delivery formats.'],
    4: ['Broad proposition', 'Multiple services plus bundles, recurring offers, online/offline formats or cross-selling opportunities.'],
    5: ['Service ecosystem', 'A broad suite of complementary services capable of serving multiple customer needs under one partner.'],
  },
  pricing: {
    1: ['Accessible', 'Clearly positioned toward the affordable end of comparable providers in its category.'],
    2: ['Lower-mid', 'Still value-oriented, but above the most accessible competitors in the same category.'],
    3: ['Mid-market', 'Broadly in line with established comparable providers in the category.'],
    4: ['Premium', 'Consistently priced above typical category peers, supported by a stronger or differentiated proposition.'],
    5: ['Top-end', 'At or near the premium end of the relevant category, with pricing itself forming part of the market positioning.'],
  },
}
function classifyScores(s) {
  const vals = [s.size, s.service, s.pricing].map(v => Math.max(1, Math.min(5, safeNumber(v, 1))))
  const total = vals.reduce((a, b) => a + b, 0)
  const count3 = vals.filter(v => v >= 3).length
  const count4 = vals.filter(v => v >= 4).length
  let tier = 'access'
  if (total >= 12 && count4 >= 2) tier = 'signature'
  else if (total >= 8 && count3 >= 2) tier = 'plus'
  const spread = Math.max(...vals) - Math.min(...vals)
  const boundary = [7, 8, 11, 12].includes(total)
  return { total, tier, manual: boundary || spread >= 3 }
}
const TIER_LABELS = { access: 'Access', plus: 'Plus', signature: 'Signature candidate' }

// ─── A/B commission calculator math, ported verbatim ──────────────────────
function tierConfig(tier) {
  return tier === 'plus' ? { name: 'Plus', fixed: 45, comm: 0.08 } : { name: 'Access', fixed: 15, comm: 0.10 }
}
function calcPricing(tier, revenue, bRatePct, months) {
  const c = tierConfig(tier)
  const r = Math.max(0, safeNumber(revenue))
  const b = Math.max(0, Math.min(100, safeNumber(bRatePct))) / 100
  const m = Math.max(1, Math.min(36, safeNumber(months, 1)))
  const aMonthly = c.fixed + c.comm * r
  const bMonthly = b * r
  const eq = r > 0 ? c.comm + c.fixed / r : null
  return { c, r, b, m, aMonthly, bMonthly, a: aMonthly * m, bb: bMonthly * m, diff: (bMonthly - aMonthly) * m, eq }
}

const EMPTY_REVENUE = { active_pro_monthly: 0, active_pro_annual: 0, new_subscriptions_in_range: 0, canceled_in_range: 0, estimated_mrr_cents: 0, estimated_arr_cents: 0 }
const EMPTY_ONE_TIME = { foundation_payments_count: 0, foundation_revenue_cents: 0, coach_payments_count: 0, coach_revenue_cents: 0, board_listing_payments_count: 0, board_listing_revenue_cents: 0, total_one_time_revenue_cents: 0 }
const EMPTY_COMMISSIONS = { pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0, declared_in_range_count: 0, declared_in_range_amount_cents: 0 }
const EMPTY_PAYOUTS = { pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0 }
const EMPTY_COACH_PAYOUTS = { pending_count: 0, pending_amount_cents: 0, transferred_count: 0, transferred_amount_cents: 0, failed_count: 0 }
const EMPTY_MARGIN = { gross_collected_cents: 0, paid_to_coaches_cents: 0, ubp_margin_cents: 0, margin_pct: null, transfers_counted: 0 }

export default function FinanceDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [revenue, setRevenue] = useState(EMPTY_REVENUE)
  const [oneTimeRevenue, setOneTimeRevenue] = useState(EMPTY_ONE_TIME)
  const [revenueByTier, setRevenueByTier] = useState([])
  const [margin, setMargin] = useState(EMPTY_MARGIN)
  const [commissions, setCommissions] = useState(EMPTY_COMMISSIONS)
  const [payouts, setPayouts] = useState(EMPTY_PAYOUTS)
  const [coachPayouts, setCoachPayouts] = useState(EMPTY_COACH_PAYOUTS)
  const [pendingCoachPayouts, setPendingCoachPayouts] = useState([])
  const [payoutFailures, setPayoutFailures] = useState([])
  const [revenueByCohort, setRevenueByCohort] = useState([])
  const [comparisonRows, setComparisonRows] = useState([])
  const [comparisonWindow, setComparisonWindow] = useState('week')

  const [clients, setClients] = useState([])
  const [moneyRequests, setMoneyRequests] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        revRes, oneTimeRes, byTierRes, marginRes, commRes, payoutRes,
        coachPayoutRes, pendingCoachPayoutRes, failureRes, cohortRes, compareRes,
        clientsRes, requestsRes,
      ] = await Promise.all([
        getFinanceRevenueSnapshot(range),
        getFinanceOneTimePayments(range),
        getFinanceRevenueByTier(range),
        getFinanceMarginSummary(range),
        getFinanceCommissionSummary(range),
        getFinancePartnerPayoutSummary(),
        getFinanceCoachPayoutSummary(),
        getFinancePendingCoachPayouts(),
        getFinancePayoutFailureQueue(),
        getFinanceRevenueByCohort(),
        getFinanceCoachRevenueComparison(comparisonWindow),
        getPartnerTierAdminList(),
        getMoneyRequests(),
      ])

      setRevenue(revRes.value || EMPTY_REVENUE)
      setOneTimeRevenue(oneTimeRes.value || EMPTY_ONE_TIME)
      setRevenueByTier(byTierRes.value || [])
      setMargin(marginRes.value || EMPTY_MARGIN)
      setCommissions(commRes.value || EMPTY_COMMISSIONS)
      setPayouts(payoutRes.value || EMPTY_PAYOUTS)
      setCoachPayouts(coachPayoutRes.value || EMPTY_COACH_PAYOUTS)
      setPendingCoachPayouts(pendingCoachPayoutRes.value || [])
      setPayoutFailures(failureRes.value || [])
      setRevenueByCohort(cohortRes.value || [])
      setComparisonRows(compareRes.value || [])
      setClients(clientsRes.value || [])
      setMoneyRequests(requestsRes.value || [])
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [range, comparisonWindow])

  useEffect(() => { load() }, [load])

  const totalActiveSubs = revenue.active_pro_monthly + revenue.active_pro_annual

  // ── Comparison widget feed: the coach with the most real revenue this
  // window stands in as the "entity" the widget describes (anonymized
  // top/lowest either way -- it never names anyone), and real top/lowest/
  // rising are all derived from the same get_finance_coach_revenue_
  // comparison() feed, never fabricated.
  const comparison = useMemo(() => {
    const withRevenue = comparisonRows.filter(r => r.revenue_cents_this_period > 0)
    const top = comparisonRows[0]
    const lowestRow = withRevenue.length ? withRevenue[withRevenue.length - 1] : comparisonRows[comparisonRows.length - 1]
    const rising = findRising(comparisonRows)
    const focus = top
    return {
      hasData: comparisonRows.length > 0,
      anyRealRevenue: withRevenue.length > 0,
      focus,
      topValue: top?.revenue_cents_this_period ?? null,
      lowestValue: lowestRow?.revenue_cents_this_period ?? null,
      value: focus?.revenue_cents_this_period ?? null,
      lastPeriodValue: focus?.revenue_cents_last_period ?? null,
      rising,
      percentile: focus ? percentileRank(focus.rank_this_period, comparisonRows.length) : null,
    }
  }, [comparisonRows])

  // ── Money requests, new request form ──────────────────────────────────
  const [reqAmount, setReqAmount] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqSubmitting, setReqSubmitting] = useState(false)

  async function submitMoneyRequest() {
    const cents = Math.round(parseFloat(reqAmount) * 100)
    if (!cents || cents <= 0 || !reqReason.trim()) return
    setReqSubmitting(true)
    try {
      await createMoneyRequest(cents, reqReason.trim())
      setReqAmount(''); setReqReason('')
      const r = await getMoneyRequests()
      setMoneyRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not submit the request.')
    } finally {
      setReqSubmitting(false)
    }
  }
  async function actOnRequest(id, status) {
    try {
      await decideMoneyRequest(id, status)
      const r = await getMoneyRequests()
      setMoneyRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that request.')
    }
  }

  // ── Client Register / Tier Scorecard / A/B Calculator state ───────────
  const [selectedClientKey, setSelectedClientKey] = useState('')
  const selectedClient = clients.find(c => `${c.entity_type}:${c.entity_id}` === selectedClientKey) || null

  const [scoreState, setScoreState] = useState({ size: 1, service: 1, pricing: 1 })
  const [savingTier, setSavingTier] = useState(false)
  const scoreResult = useMemo(() => classifyScores(scoreState), [scoreState])

  const [modelTier, setModelTier] = useState('access')
  const [modelRevenue, setModelRevenue] = useState(500)
  const [modelBRate, setModelBRate] = useState(13)
  const [modelMonths, setModelMonths] = useState(1)
  const [modelRationale, setModelRationale] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)
  const pricing = useMemo(() => calcPricing(modelTier, modelRevenue, modelBRate, modelMonths), [modelTier, modelRevenue, modelBRate, modelMonths])

  async function saveScorecardTier() {
    if (!selectedClient) return
    setSavingTier(true)
    try {
      const tierToSave = scoreResult.tier
      await supabase.rpc('set_partner_tier', { _entity_type: selectedClient.entity_type, _entity_id: selectedClient.entity_id, _tier: tierToSave })
      const r = await getPartnerTierAdminList()
      setClients(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not save the tier assignment.')
    } finally {
      setSavingTier(false)
    }
  }

  async function savePricingDecision() {
    if (!selectedClient) return
    setSavingPricing(true)
    try {
      if (pricing.b > 0 && modelBRate !== '') {
        if (!modelRationale.trim()) throw new Error('A rationale is required to record a negotiated Option B rate.')
        await supabase.rpc('record_negotiated_rate', {
          _entity_type: selectedClient.entity_type, _entity_id: selectedClient.entity_id,
          _negotiated_commission_pct: safeNumber(modelBRate), _rationale: modelRationale.trim(),
        })
      } else {
        await supabase.rpc('set_payment_option', { _entity_type: selectedClient.entity_type, _entity_id: selectedClient.entity_id, _payment_option: 'fixed' })
      }
      const r = await getPartnerTierAdminList()
      setClients(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not save the pricing decision.')
    } finally {
      setSavingPricing(false)
    }
  }

  const sections = [
    { id: 'fn-revenue', label: 'Revenue' },
    { id: 'fn-margin', label: 'Margin & Payouts' },
    { id: 'fn-comparison', label: 'Comparison' },
    { id: 'fn-clients', label: 'Client Register' },
    { id: 'fn-scorecard', label: 'Tier Scorecard' },
    { id: 'fn-pricing', label: 'A/B Revenue Model' },
    { id: 'fn-requests', label: 'Money Requests' },
  ]

  const heroCharts = [
    {
      key: 'by-tier', eyebrow: 'Revenue', title: 'Coaching revenue by tier',
      caption: 'Real, collected coach_payments this period, grouped by Partner Tier.',
      data: revenueByTier.length
        ? revenueByTier.map(r => ({ name: TIER_LABELS[r.tier] || r.tier, value: Number(r.revenue_cents) / 100 }))
        : [],
      valueFormatter: v => `€${Math.round(v)}`,
      emptyLabel: 'No real coaching revenue this period (excluding banned demo/QA accounts).',
    },
    {
      key: 'by-source', eyebrow: 'Revenue', title: 'One-time revenue by source',
      caption: 'Foundation, coaching, and board listings this period.',
      data: [
        { name: 'Foundation', value: oneTimeRevenue.foundation_revenue_cents / 100 },
        { name: 'Coaching', value: oneTimeRevenue.coach_revenue_cents / 100 },
        { name: 'Board listings', value: oneTimeRevenue.board_listing_revenue_cents / 100 },
      ],
      valueFormatter: v => `€${Math.round(v)}`,
    },
    {
      key: 'payout-status', eyebrow: 'Coaches', title: 'Payout status (all time)',
      caption: 'Coach Stripe Connect transfer counts, excluding banned accounts.',
      data: [
        { name: 'Pending', value: coachPayouts.pending_count, color: AMBER },
        { name: 'Transferred', value: coachPayouts.transferred_count, color: GREEN },
        { name: 'Failed', value: coachPayouts.failed_count, color: RED },
      ],
    },
    {
      key: 'margin', eyebrow: 'Margin', title: 'Gross vs. paid to coaches',
      caption: `UBP take-home this period: ${fmtEuro(margin.ubp_margin_cents)}${margin.margin_pct != null ? ` (${pctWhole(margin.margin_pct)} margin)` : ''}.`,
      data: [
        { name: 'Gross collected', value: margin.gross_collected_cents / 100 },
        { name: 'Paid to coaches', value: margin.paid_to_coaches_cents / 100 },
      ],
      valueFormatter: v => `€${Math.round(v)}`,
    },
  ]

  return (
    <>
      <Helmet>
        <title>Finance Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        hubKey="finance"
        title="Finance Hub"
        subtitle="Revenue, commissions, payouts, partner tiering, and cross-team money requests. Real data, excluding the 24 banned demo/QA accounts."
        accentColor={HUB_ACCENTS.finance}
        heroCharts={heroCharts}
        sections={sections}
        rangeControl={(
          <div style={{ display: 'inline-flex', background: '#FFFFFF', borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{
                fontFamily: FONT_SANS, fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: range === r.key ? NAVY : 'transparent', color: range === r.key ? CREAM : GREY, transition: 'background 150ms, color 150ms',
              }}>
                {r.label}
              </button>
            ))}
          </div>
        )}
        error={!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ REVENUE ══════════════════════════════════════════════════ */}
        <div id="fn-revenue" style={{ scrollMarginTop: '60px' }}>
          <Card style={{ marginBottom: '20px' }}>
            <SectionTitle eyebrow="Revenue" title="Subscription revenue"
              caption="Modelled from list price and active subscription counts, excluding banned demo/QA accounts. Not a reconciled Stripe figure -- Stripe's webhook records tier and status, not the amount charged per invoice." />
            <StatStrip
              columns={4}
              style={{ opacity: loading ? 0.6 : 1 }}
              cells={[
                { key: 'mrr', label: 'Estimated MRR', value: fmtEuro(revenue.estimated_mrr_cents), icon: Euro, accent: NAVY },
                { key: 'arr', label: 'Estimated ARR', value: fmtEuro(revenue.estimated_arr_cents), icon: TrendingUp, accent: NAVY },
                { key: 'active-subs', label: 'Active Pro subscribers', sub: `${totalActiveSubs} total`, value: `${revenue.active_pro_monthly} mo / ${revenue.active_pro_annual} yr`, icon: Users, accent: NAVY },
                { key: 'new-this-period', label: 'New this period', sub: `${revenue.canceled_in_range} canceled`, value: revenue.new_subscriptions_in_range, icon: Wallet, accent: revenue.canceled_in_range > revenue.new_subscriptions_in_range ? AMBER : GREEN },
              ]}
            />
          </Card>

          <Card style={{ marginBottom: '20px' }}>
            <SectionTitle eyebrow="One-Time Revenue" title="One-time payments"
              caption="Real Stripe payments actually collected this period, excluding banned demo/QA accounts. Checked live: every coach_payments row that existed before today's ban belonged to a demo account -- 0 real coaching revenue is the honest current number, not a bug." />
            <StatStrip
              columns={4}
              style={{ opacity: loading ? 0.6 : 1 }}
              cells={[
                { key: 'foundation', label: 'Foundation', sub: `${fmt(oneTimeRevenue.foundation_payments_count)} payments`, value: fmtEuro(oneTimeRevenue.foundation_revenue_cents), icon: GraduationCap, accent: '#2563EB' },
                { key: 'coaching', label: 'Coaching', sub: `${fmt(oneTimeRevenue.coach_payments_count)} payments`, value: fmtEuro(oneTimeRevenue.coach_revenue_cents), icon: UserCheck, accent: '#A21CAF' },
                { key: 'board-listings', label: 'Board listings', sub: `${fmt(oneTimeRevenue.board_listing_payments_count)} payments`, value: fmtEuro(oneTimeRevenue.board_listing_revenue_cents), icon: Megaphone, accent: GREEN },
                { key: 'total-one-time', label: 'Total one-time', value: fmtEuro(oneTimeRevenue.total_one_time_revenue_cents), icon: Receipt, accent: NAVY },
              ]}
            />
          </Card>

          <Card>
            <SectionTitle eyebrow="Cohorts" title="Revenue by signup month"
              caption="Real coaching revenue grouped by the paying student's signup month. Campus/institution cohorting is not shown -- profiles.institution is null for every row today, so it would only ever read 'unknown'." />
            <MetricBarChart
              data={revenueByCohort.map(r => ({ name: new Date(r.signup_month).toLocaleDateString('en-IE', { month: 'short', year: '2-digit' }), value: Number(r.revenue_cents) / 100 }))}
              valueFormatter={v => `€${Math.round(v)}`}
              accentColor={HUB_ACCENTS.finance}
              emptyLabel="No real revenue yet to cohort by signup month."
            />
          </Card>
        </div>

        {/* ══ MARGIN + COMMISSIONS + PAYOUTS ═════════════════════════════ */}
        <div id="fn-margin" style={{ marginTop: '20px', scrollMarginTop: '60px' }}>
          <Card style={{ marginBottom: '20px' }}>
            <SectionTitle eyebrow="Margin" title="UBP take-home margin"
              caption="Gross coach payment minus the coach's share, from coach_payment_transfers (transferred + pending, excluding failed and banned accounts)." />
            <StatStrip
              columns={3}
              style={{ opacity: loading ? 0.6 : 1 }}
              cells={[
                { key: 'gross-collected', label: 'Gross collected', value: fmtEuro(margin.gross_collected_cents), icon: Landmark, accent: NAVY },
                { key: 'paid-to-coaches', label: 'Paid to coaches', value: fmtEuro(margin.paid_to_coaches_cents), icon: Wallet, accent: GREY },
                { key: 'ubp-margin', label: 'UBP margin', sub: margin.margin_pct != null ? `${pctWhole(margin.margin_pct)} of gross` : 'no gross yet', value: fmtEuro(margin.ubp_margin_cents), icon: PiggyBank, accent: GREEN },
              ]}
            />
          </Card>

          <div className="fn-two-col" style={{ marginBottom: '20px' }}>
            <Card>
              <SectionTitle eyebrow="Handlers" title="Commission declarations" caption="What Campus Handlers have declared for delivered work." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MoneyRow label="Pending" count={commissions.pending_count} cents={commissions.pending_amount_cents} tone={AMBER} />
                <MoneyRow label="Paid" count={commissions.paid_count} cents={commissions.paid_amount_cents} tone={GREEN} />
                <div style={{ height: '1px', background: 'rgba(30,58,95,0.08)' }} />
                <MoneyRow label="Declared this period" count={commissions.declared_in_range_count} cents={commissions.declared_in_range_amount_cents} tone={NAVY} />
              </div>
            </Card>
            <Card>
              <SectionTitle eyebrow="Lifestyle Partners" title="Partner payouts" caption="Owed and paid to Lifestyle partners for referral or placement agreements." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MoneyRow label="Pending" count={payouts.pending_count} cents={payouts.pending_amount_cents} tone={AMBER} />
                <MoneyRow label="Paid" count={payouts.paid_count} cents={payouts.paid_amount_cents} tone={GREEN} />
                {payouts.pending_count === 0 && payouts.paid_count === 0 && <EmptyNote><Handshake size={12} /> No partner payouts recorded yet.</EmptyNote>}
              </div>
            </Card>
          </div>

          <Card style={{ marginBottom: '20px' }}>
            <SectionTitle eyebrow="Coaches" title="Coach payouts (Stripe Connect)"
              caption="Automated transfers to coaches once a student payment is collected, excluding banned accounts. Pending items need a Partner Tier assigned or the coach's Stripe onboarding finished." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <MoneyRow label="Pending" count={coachPayouts.pending_count} cents={coachPayouts.pending_amount_cents} tone={AMBER} />
              <MoneyRow label="Transferred" count={coachPayouts.transferred_count} cents={coachPayouts.transferred_amount_cents} tone={GREEN} />
            </div>
            {coachPayouts.failed_count > 0 && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', marginBottom: 0, fontFamily: FONT_SANS, fontSize: '12px', color: RED }}>
                <AlertTriangle size={14} /> {fmt(coachPayouts.failed_count)} transfer attempt{coachPayouts.failed_count === 1 ? '' : 's'} failed at Stripe -- see the queue below.
              </p>
            )}
            {pendingCoachPayouts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
                {pendingCoachPayouts.map(row => (
                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: CREAM, borderRadius: '8px', border: '1px solid rgba(30,58,95,0.08)', padding: '9px 13px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: '600', color: NAVY, margin: 0 }}>{row.coach_slug}</p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '2px 0 0' }}>{PENDING_REASON_LABELS[row.pending_reason] || row.pending_reason}</p>
                    </div>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '13px', fontWeight: '600', color: NAVY, flexShrink: 0 }}>{fmtEuro(row.gross_amount_cents)}</span>
                  </div>
                ))}
              </div>
            )}
            {!loading && coachPayouts.pending_count === 0 && coachPayouts.transferred_count === 0 && (
              <EmptyNote><CreditCard size={12} /> No coach Stripe Connect transfers recorded yet.</EmptyNote>
            )}
          </Card>

          <Card>
            <SectionTitle eyebrow="Coaches" title="Payout failure queue" caption="Real Stripe-rejected transfer attempts. Nothing here retries automatically." />
            {payoutFailures.length === 0 ? (
              <EmptyNote><CheckCircle2 size={12} color={GREEN} /> No failed transfer attempts recorded.</EmptyNote>
            ) : (
              <div className="fn-table-wrap">
                <table className="fn-table">
                  <thead><tr><th>Coach</th><th>Gross amount</th><th>Error</th><th>Attempted</th></tr></thead>
                  <tbody>
                    {payoutFailures.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>{f.coach_slug}</td>
                        <td>{fmtEuro(f.gross_amount_cents)}</td>
                        <td style={{ color: RED }}>{f.error_message || '—'}</td>
                        <td>{new Date(f.attempted_at).toLocaleDateString('en-IE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ══ COMPARISON ═════════════════════════════════════════════════ */}
        <div id="fn-comparison" style={{ marginTop: '20px', scrollMarginTop: '60px' }}>
          <SectionTitle eyebrow="Coach performance" title="What You've Got vs What You're Missing"
            caption="Real coach_payments revenue per coach, this window vs the window before it. The widget never names a coach -- 'top performer' and 'lowest performer' are always anonymized." />
          <ComparisonWidget
            entityLabel={comparison.anyRealRevenue ? 'Top real-revenue coach this window' : 'No real coach revenue yet this window'}
            value={comparison.value}
            topValue={comparison.topValue}
            lowestValue={comparison.lowestValue}
            lastPeriodValue={comparison.lastPeriodValue}
            unit="EUR"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.finance}
            loading={loading}
            emptyNote={!comparison.anyRealRevenue ? 'Every coach shows €0 real revenue this window (excluding banned demo/QA accounts) -- the comparisons below will fill in honestly once real bookings are paid.' : (
              comparison.rising ? `Rising this window: a real ${comparison.rising.changePct}% week-over-week increase among coaches with revenue (coach not named here either).` : null
            )}
          />
        </div>

        {/* ══ CLIENT REGISTER ═════════════════════════════════════════════ */}
        <Card id="fn-clients" style={{ marginTop: '20px' }}>
          <SectionTitle eyebrow="Partner Commercial Toolkit" title="Client Register"
            caption="Real partners and coaches from partner_tier_assignments, via the existing get_partner_tier_admin_list() RPC -- not a local-only register. Load a client into the Tier Scorecard or A/B Revenue Model below to assess or reprice them." />
          {/* TODO(phase-2-access-system): negotiated_commission_pct / negotiated_rationale
              are already nulled server-side for anyone who isn't finance/founder
              (see get_partner_tier_admin_list()'s v_can_see_rate check) -- this
              route is currently gated to finance/founder/admin as a whole
              (RequireRole on /admin/finance), with no leader-vs-team-member split
              within that group. Once real per-person staff roles exist, swap this
              route-level gate for a row-level "can this specific person see
              negotiated rates" check right here, and hide the Negotiated rate /
              rationale columns (not just blank them) for a team-member viewer. */}
          {clients.length === 0 ? (
            <EmptyNote>No partners or coaches found.</EmptyNote>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th>Client</th><th>Type</th><th>Category</th><th>Tier</th><th>Payment option</th>
                    <th>Negotiated rate</th><th>Founding badge</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={`${c.entity_type}:${c.entity_id}`}>
                      <td style={{ fontWeight: 600 }}>{c.display_name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{c.entity_type}</td>
                      <td>{c.category || '—'}</td>
                      <td>{c.tier ? TIER_LABELS[c.tier] || c.tier : <span style={{ color: MUTED }}>Unassigned</span>}</td>
                      <td style={{ textTransform: 'capitalize' }}>{c.payment_option || '—'}</td>
                      <td>{c.negotiated_commission_pct != null ? pctWhole(c.negotiated_commission_pct) : '—'}</td>
                      <td>{c.founding_badge ? <StatusDot status="green" label="Founding badge" showLabel /> : <span style={{ color: MUTED }}>—</span>}</td>
                      <td><StatusDot status={c.is_active ? 'green' : 'red'} label={c.is_active ? 'Active' : 'Inactive'} showLabel /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ TIER SCORECARD ══════════════════════════════════════════════ */}
        <Card id="fn-scorecard" style={{ marginTop: '20px' }}>
          <SectionTitle eyebrow="Partner Commercial Toolkit" title="Tier Scorecard"
            caption="Size / service breadth / pricing position, scored 1-5 each -- the exact classification Alex's toolkit used (Access 3-7, Plus 8-11 with 2+ dimensions at 3+, Signature candidate 12-15 with 2+ at 4+). Saving writes the resulting tier to partner_tier_assignments via set_partner_tier()." />
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, display: 'block', marginBottom: '6px' }}>Client</label>
            <select
              value={selectedClientKey}
              onChange={e => { setSelectedClientKey(e.target.value); setScoreState({ size: 1, service: 1, pricing: 1 }) }}
              style={{ fontFamily: FONT_SANS, fontSize: '13px', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(30,58,95,0.15)', width: '100%', maxWidth: '360px' }}
            >
              <option value="">Select a client…</option>
              {clients.map(c => (
                <option key={`${c.entity_type}:${c.entity_id}`} value={`${c.entity_type}:${c.entity_id}`}>
                  {c.display_name} ({c.entity_type})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: '26px', color: NAVY }}>{TIER_LABELS[scoreResult.tier]}</span>
            <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>{scoreResult.total} / 15</span>
            <StatusDot status={scoreResult.manual ? 'yellow' : 'green'} label={scoreResult.manual ? 'Finance review recommended' : 'Clear classification'} showLabel />
          </div>

          <div className="fn-three-col">
            {['size', 'service', 'pricing'].map(group => (
              <div key={group} style={{ border: '1px solid rgba(30,58,95,0.08)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: FONT_SANS, fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, textTransform: 'capitalize' }}>{group === 'service' ? 'Service breadth' : group === 'pricing' ? 'Pricing position' : 'Size'}</h3>
                  <span style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: MUTED }}>{scoreState[group]} / 5</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '10px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setScoreState(s => ({ ...s, [group]: n }))}
                      style={{
                        fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 700, padding: '8px 0', borderRadius: '7px',
                        border: scoreState[group] === n ? `1px solid ${HUB_ACCENTS.finance}` : '1px solid rgba(30,58,95,0.15)',
                        background: scoreState[group] === n ? '#f6edcf' : '#fff', cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, lineHeight: 1.5, margin: 0, background: CREAM, borderRadius: '8px', padding: '8px 10px' }}>
                  <strong>{scoreState[group]} — {SCORE_ANCHORS[group][scoreState[group]][0]}.</strong> {SCORE_ANCHORS[group][scoreState[group]][1]}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button" disabled={!selectedClient || savingTier}
              onClick={saveScorecardTier}
              style={{
                fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, padding: '9px 16px', borderRadius: '8px', border: 'none',
                background: selectedClient ? NAVY : MUTED, color: CREAM, cursor: selectedClient ? 'pointer' : 'not-allowed',
              }}
            >
              {savingTier ? 'Saving…' : `Save ${TIER_LABELS[scoreResult.tier]} to ${selectedClient ? selectedClient.display_name : 'client'}`}
            </button>
          </div>
        </Card>

        {/* ══ A/B REVENUE MODEL ═══════════════════════════════════════════ */}
        <Card id="fn-pricing" style={{ marginTop: '20px' }}>
          <SectionTitle eyebrow="Partner Commercial Toolkit" title="A/B Revenue Model"
            caption="Option A = fixed fee + (A commission × revenue). Option B = B commission × revenue. Equivalent B rate = A commission + fixed fee / revenue. Kept exactly as Alex built it. Saving an Option B rate records it to partner_negotiation_log via record_negotiated_rate() (append-only, requires a rationale)." />
          <div className="fn-two-col">
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <Field label="Commercial tier">
                  <select value={modelTier} onChange={e => setModelTier(e.target.value)} style={inputStyle}>
                    <option value="access">Access — €15 + 10%</option>
                    <option value="plus">Plus — €45 + 8%</option>
                  </select>
                </Field>
                <Field label="Monthly partner revenue (€)">
                  <input type="number" min="0" step="10" value={modelRevenue} onChange={e => setModelRevenue(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Proposed Option B commission (%)">
                  <input type="number" min="0" max="100" step="0.1" value={modelBRate} onChange={e => setModelBRate(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Comparison period (months)">
                  <input type="number" min="1" max="36" step="1" value={modelMonths} onChange={e => setModelMonths(e.target.value)} style={inputStyle} />
                </Field>
              </div>
              <Field label="Rationale (required to save a negotiated Option B rate)">
                <textarea value={modelRationale} onChange={e => setModelRationale(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Commercial context for this rate..." />
              </Field>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button" disabled={!selectedClient || savingPricing}
                  onClick={savePricingDecision}
                  style={{
                    fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, padding: '9px 16px', borderRadius: '8px', border: 'none',
                    background: selectedClient ? NAVY : MUTED, color: CREAM, cursor: selectedClient ? 'pointer' : 'not-allowed',
                  }}
                >
                  {savingPricing ? 'Saving…' : `Save pricing to ${selectedClient ? selectedClient.display_name : 'client'}`}
                </button>
              </div>
            </div>
            <div style={{ background: NAVY, borderRadius: '11px', padding: '14px', color: CREAM }}>
              <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', color: '#cbd8e7' }}>Model logic</p>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                Option A = Fixed fee + (A commission × Revenue)
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                Option B = B commission × Revenue
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                Equivalent B rate = A commission + Fixed fee / Revenue
              </div>
            </div>
          </div>

          <StatStrip
            columns={3}
            style={{ marginTop: '16px' }}
            cells={[
              { key: 'option-a-revenue', label: 'Option A revenue', value: fmtEuro(Math.round(pricing.a * 100)), icon: Receipt, accent: NAVY },
              { key: 'option-b-revenue', label: 'Option B revenue', value: fmtEuro(Math.round(pricing.bb * 100)), icon: Receipt, accent: HUB_ACCENTS.finance },
              { key: 'equivalent-b-rate', label: 'Equivalent B rate', value: pricing.eq != null ? pctWhole(pricing.eq * 100) : '—', icon: TrendingUp, accent: GREEN },
            ]}
          />

          <MetricBarChart
            data={[
              { name: 'Option A', value: pricing.a, color: '#2f6b9d' },
              { name: 'Option B', value: pricing.bb, color: HUB_ACCENTS.finance },
            ]}
            valueFormatter={v => `€${v.toFixed(2)}`}
            nameWidth={90}
            accentColor={NAVY}
          />

          <div style={{ marginTop: '18px' }}>
            <SectionTitle eyebrow="" title="Revenue sensitivity" caption="Equivalent Option B commission required to match Option A at different monthly revenue levels." />
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead><tr><th>Monthly revenue</th><th>Option A revenue</th><th>Equivalent B rate</th></tr></thead>
                <tbody>
                  {[100, 250, 500, 1000, 2000].map(r => {
                    const z = calcPricing(modelTier, r, modelBRate, 1)
                    return (
                      <tr key={r}>
                        <td>€{r.toLocaleString()}</td>
                        <td>{fmtEuro(Math.round(z.aMonthly * 100))}</td>
                        <td>{z.eq != null ? pctWhole(z.eq * 100) : 'N/A'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* ══ MONEY REQUESTS ══════════════════════════════════════════════ */}
        <Card id="fn-requests" style={{ marginTop: '20px' }}>
          <SectionTitle eyebrow="New" title="Money requests from other teams"
            caption="Simple queue -- any team can ask Finance for budget; approve or deny here. Writes to the new money_requests table via create_money_request() / decide_money_request()." />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <Field label="Amount (€)">
              <input type="number" min="0" step="1" value={reqAmount} onChange={e => setReqAmount(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Reason">
              <input type="text" value={reqReason} onChange={e => setReqReason(e.target.value)} style={inputStyle} placeholder="What this is for..." />
            </Field>
            <button
              type="button" disabled={reqSubmitting || !reqAmount || !reqReason.trim()}
              onClick={submitMoneyRequest}
              style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, padding: '9px 16px', borderRadius: '8px', border: 'none', background: NAVY, color: CREAM, cursor: 'pointer', height: '38px' }}
            >
              {reqSubmitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>

          {moneyRequests.length === 0 ? (
            <EmptyNote><Inbox size={12} /> No money requests yet.</EmptyNote>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead><tr><th>Requested by</th><th>Amount</th><th>Reason</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
                <tbody>
                  {moneyRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ textTransform: 'capitalize' }}>{r.requesting_role}</td>
                      <td style={{ fontWeight: 600 }}>{fmtEuro(r.amount_cents)}</td>
                      <td style={{ maxWidth: '260px', whiteSpace: 'normal' }}>{r.reason}</td>
                      <td>
                        <StatusDot
                          status={r.status === 'approved' ? 'green' : r.status === 'denied' ? 'red' : 'yellow'}
                          label={r.status} showLabel
                        />
                      </td>
                      <td>{new Date(r.requested_at).toLocaleDateString('en-IE')}</td>
                      <td>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => actOnRequest(r.id, 'approved')} title="Approve" style={iconBtnStyle}>
                              <CheckCircle2 size={14} color={GREEN} />
                            </button>
                            <button type="button" onClick={() => actOnRequest(r.id, 'denied')} title="Deny" style={iconBtnStyle}>
                              <XCircle size={14} color={RED} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: MUTED, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><History size={11} /> decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </StudioShell>
    </>
  )
}

const inputStyle = {
  fontFamily: FONT_SANS, fontSize: '13px', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid rgba(30,58,95,0.15)', width: '100%', boxSizing: 'border-box',
}
const iconBtnStyle = {
  border: '1px solid rgba(30,58,95,0.12)', background: '#fff', borderRadius: '6px',
  width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, display: 'block', marginBottom: '5px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
