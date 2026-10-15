import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Euro, Users, TrendingUp, AlertCircle, Wallet, Handshake,
  Receipt, GraduationCap, UserCheck, Megaphone, CreditCard, AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Real data, sourced from supabase/migrations/20260829140000_finance_dashboard_views.sql.
// Scoped to money only, by design -- revenue, handler commissions, partner
// payouts -- not the broader platform metrics on the Founder/Operations
// dashboards. Revenue is a modelled estimate off list price (Stripe's
// webhook doesn't record a per-subscription paid amount today), flagged as
// such on the page rather than presented as a reconciled figure.

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
]

// Human labels for coach_payment_transfers.pending_reason — see
// 20261015150039_coach_stripe_connect.sql's own column comment for what
// each value means.
const PENDING_REASON_LABELS = {
  pending_tier_assignment: 'Awaiting Partner Tier assignment',
  no_connect_account: "Coach hasn't started Stripe onboarding",
  connect_account_not_verified: 'Stripe onboarding not yet verified',
}

const NAVY = '#1E3A5F'
const CREAM = '#F5F0E8'
const GREY = '#6B7280'
const MUTED = '#9CA3AF'
const GREEN = '#16A34A'
const AMBER = '#F59E0B'
const RED = '#DC2626'

const PAGE_STYLES = `
  .fn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .fn-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch; }
  @media (max-width: 1100px) { .fn-grid { grid-template-columns: repeat(2, 1fr); } .fn-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .fn-grid { grid-template-columns: 1fr; } }
`

function fmtEuro(cents) {
  if (cents === null || cents === undefined) return '—'
  return `€${(cents / 100).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('en-IE')
}

function SectionTitle({ eyebrow, title, caption }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700',
        color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
      }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', color: NAVY, margin: '3px 0 0' }}>
        {title}
      </h2>
      {caption && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '4px 0 0', lineHeight: 1.5 }}>
          {caption}
        </p>
      )}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Tile({ label, sub, value, icon: Icon, accent = NAVY }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '7px',
        background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={accent} />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: accent, lineHeight: 1.1, marginTop: '2px' }}>
        {value}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, lineHeight: 1.3 }}>
        {label}{sub ? `, ${sub}` : ''}
      </p>
    </div>
  )
}

function MoneyRow({ label, count, cents, tone = NAVY }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: GREY }}>
        {label} {count != null && <span style={{ color: MUTED }}>({fmt(count)})</span>}
      </span>
      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: tone }}>
        {fmtEuro(cents)}
      </span>
    </div>
  )
}

function PendingPayoutRow({ coachSlug, reason, cents }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      background: CREAM, borderRadius: '8px', border: '1px solid rgba(30,58,95,0.08)',
      padding: '9px 13px',
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: '600', color: NAVY, margin: 0 }}>
          {coachSlug}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, margin: '2px 0 0' }}>
          {PENDING_REASON_LABELS[reason] || reason}
        </p>
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: NAVY, flexShrink: 0 }}>
        {fmtEuro(cents)}
      </span>
    </div>
  )
}

const EMPTY_REVENUE = {
  active_pro_monthly: 0, active_pro_annual: 0, new_subscriptions_in_range: 0,
  canceled_in_range: 0, estimated_mrr_cents: 0, estimated_arr_cents: 0,
}
const EMPTY_ONE_TIME = {
  foundation_payments_count: 0, foundation_revenue_cents: 0,
  coach_payments_count: 0, coach_revenue_cents: 0,
  board_listing_payments_count: 0, board_listing_revenue_cents: 0,
  total_one_time_revenue_cents: 0,
}
const EMPTY_COMMISSIONS = {
  pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0,
  declared_in_range_count: 0, declared_in_range_amount_cents: 0,
}
const EMPTY_PAYOUTS = { pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0 }
const EMPTY_COACH_PAYOUTS = {
  pending_count: 0, pending_amount_cents: 0,
  transferred_count: 0, transferred_amount_cents: 0,
  failed_count: 0,
}

export default function FinanceDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [revenue, setRevenue] = useState(EMPTY_REVENUE)
  const [oneTimeRevenue, setOneTimeRevenue] = useState(EMPTY_ONE_TIME)
  const [commissions, setCommissions] = useState(EMPTY_COMMISSIONS)
  const [payouts, setPayouts] = useState(EMPTY_PAYOUTS)
  const [coachPayouts, setCoachPayouts] = useState(EMPTY_COACH_PAYOUTS)
  const [pendingCoachPayouts, setPendingCoachPayouts] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [revRes, oneTimeRes, commRes, payoutRes, coachPayoutRes, pendingCoachPayoutRes] = await Promise.all([
        supabase.rpc('get_finance_revenue_snapshot', { _range: range }),
        // Real, actually-collected one-time Stripe revenue (foundation,
        // coaching, board listings) — a separate RPC (20261015150614) from
        // the subscription-based snapshot above, not blended into its
        // modelled MRR/ARR. Shares the same _range window.
        supabase.rpc('get_finance_one_time_payments_summary', { _range: range }),
        supabase.rpc('get_finance_commission_summary', { _range: range }),
        supabase.rpc('get_finance_partner_payout_summary'),
        // Coach Stripe Connect automated payouts (20261015150039) — separate
        // from the Lifestyle Blueprint partner payouts above (that table is
        // partners-only; coach_payment_transfers is a new, coach-only table).
        // Not range-scoped: it reflects the current pending/transferred/
        // failed state of the table, not activity within the selected period.
        supabase.rpc('get_finance_coach_payout_summary'),
        supabase.rpc('get_finance_pending_coach_payouts'),
      ])
      const firstError = [revRes, oneTimeRes, commRes, payoutRes, coachPayoutRes, pendingCoachPayoutRes].find(r => r.error)
      if (firstError) throw firstError.error

      setRevenue(revRes.data?.[0] || EMPTY_REVENUE)
      setOneTimeRevenue(oneTimeRes.data?.[0] || EMPTY_ONE_TIME)
      setCommissions(commRes.data?.[0] || EMPTY_COMMISSIONS)
      setPayouts(payoutRes.data?.[0] || EMPTY_PAYOUTS)
      setCoachPayouts(coachPayoutRes.data?.[0] || EMPTY_COACH_PAYOUTS)
      setPendingCoachPayouts(pendingCoachPayoutRes.data || [])
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const totalActiveSubs = revenue.active_pro_monthly + revenue.active_pro_annual

  return (
    <>
      <Helmet>
        <title>Finance Dashboard | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: CREAM, minHeight: '100vh', padding: '24px 28px 64px' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: NAVY, margin: 0 }}>
              Finance Dashboard
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: GREY, margin: '4px 0 0' }}>
              Subscription revenue, handler commissions, and partner payouts. Read only, for internal reference.
            </p>
          </div>
          <div style={{ display: 'inline-flex', background: '#FFFFFF', borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: range === r.key ? NAVY : 'transparent',
                  color: range === r.key ? CREAM : GREY,
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}

        {/* ── REVENUE ──────────────────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Revenue"
            title="Subscription revenue"
            caption="Modelled from list price and active subscription counts, not a reconciled Stripe figure, Stripe's webhook records tier and status, not the amount actually charged per invoice."
          />
          <div className="fn-grid" style={{ opacity: loading ? 0.6 : 1 }}>
            <Tile label="Estimated MRR" value={fmtEuro(revenue.estimated_mrr_cents)} icon={Euro} accent={NAVY} />
            <Tile label="Estimated ARR" value={fmtEuro(revenue.estimated_arr_cents)} icon={TrendingUp} accent={NAVY} />
            <Tile label="Active Pro subscribers" sub={`${totalActiveSubs} total`} value={`${revenue.active_pro_monthly} mo / ${revenue.active_pro_annual} yr`} icon={Users} accent={NAVY} />
            <Tile label="New this period" sub={`${revenue.canceled_in_range} canceled`} value={revenue.new_subscriptions_in_range} icon={Wallet} accent={revenue.canceled_in_range > revenue.new_subscriptions_in_range ? AMBER : GREEN} />
          </div>
        </Card>

        {/* ── ONE-TIME REVENUE ─────────────────────────────────────────── */}
        {/* Real Stripe payments actually collected (foundation_payments /
            coach_payments / board_listing_payments, migration 20261015170000
            per the mobile FinancePortalScreen; summary RPC is 20261015150614).
            Deliberately separate from SUBSCRIPTION REVENUE above — these are
            one-off charges, never blended into the modelled MRR/ARR. */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="One-Time Revenue"
            title="One-time payments"
            caption="Real Stripe payments actually collected this period, Foundation services, coaching bookings, and board listings. Kept separate from the subscription MRR/ARR above."
          />
          <div className="fn-grid" style={{ opacity: loading ? 0.6 : 1 }}>
            <Tile
              label="Foundation" sub={`${fmt(oneTimeRevenue.foundation_payments_count)} payments`}
              value={fmtEuro(oneTimeRevenue.foundation_revenue_cents)} icon={GraduationCap} accent="#2563EB"
            />
            <Tile
              label="Coaching" sub={`${fmt(oneTimeRevenue.coach_payments_count)} payments`}
              value={fmtEuro(oneTimeRevenue.coach_revenue_cents)} icon={UserCheck} accent="#A21CAF"
            />
            <Tile
              label="Board listings" sub={`${fmt(oneTimeRevenue.board_listing_payments_count)} payments`}
              value={fmtEuro(oneTimeRevenue.board_listing_revenue_cents)} icon={Megaphone} accent={GREEN}
            />
            <Tile label="Total one-time" value={fmtEuro(oneTimeRevenue.total_one_time_revenue_cents)} icon={Receipt} accent={NAVY} />
          </div>
        </Card>

        {/* ── COMMISSIONS + PAYOUTS ────────────────────────────────────── */}
        <div className="fn-two-col">
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
              {payouts.pending_count === 0 && payouts.paid_count === 0 && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: MUTED }}>
                  <Handshake size={12} /> No partner payouts recorded yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ── COACH PAYOUTS (STRIPE CONNECT) ───────────────────────────── */}
        {/* Automated Stripe Connect transfers to coaches (20261015150039) --
            separate from the Lifestyle Blueprint partner payouts above
            (different table, different entity). "Pending" here means an
            actual payment Stripe already collected from a student but that
            could NOT yet be transferred to the coach -- the list below is
            what Finance/Founder resolve manually (assign a Partner Tier, or
            prompt the coach to finish Stripe onboarding). Nothing here is
            guessed or retried automatically, and it isn't scoped to the
            selected period -- it reflects the table's current state. */}
        <Card style={{ marginTop: '20px' }}>
          <SectionTitle
            eyebrow="Coaches"
            title="Coach payouts (Stripe Connect)"
            caption="Automated transfers to coaches once a student payment is collected. Pending items below need a Partner Tier assigned or the coach's Stripe onboarding finished before they can transfer."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <MoneyRow label="Pending" count={coachPayouts.pending_count} cents={coachPayouts.pending_amount_cents} tone={AMBER} />
            <MoneyRow label="Transferred" count={coachPayouts.transferred_count} cents={coachPayouts.transferred_amount_cents} tone={GREEN} />
          </div>

          {coachPayouts.failed_count > 0 && (
            <p style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', marginBottom: 0,
              fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: RED,
            }}>
              <AlertTriangle size={14} />
              {fmt(coachPayouts.failed_count)} transfer attempt{coachPayouts.failed_count === 1 ? '' : 's'} failed at Stripe, check function logs.
            </p>
          )}

          {pendingCoachPayouts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
              {pendingCoachPayouts.map(row => (
                <PendingPayoutRow key={row.id} coachSlug={row.coach_slug} reason={row.pending_reason} cents={row.gross_amount_cents} />
              ))}
            </div>
          )}

          {!loading && coachPayouts.pending_count === 0 && coachPayouts.transferred_count === 0 && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', marginBottom: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: MUTED }}>
              <CreditCard size={12} /> No coach Stripe Connect transfers recorded yet.
            </p>
          )}
        </Card>

      </div>
    </>
  )
}
