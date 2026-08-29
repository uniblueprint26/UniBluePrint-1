import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Euro, Users, TrendingUp, AlertCircle, Wallet, Handshake } from 'lucide-react'
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

const EMPTY_REVENUE = {
  active_pro_monthly: 0, active_pro_annual: 0, new_subscriptions_in_range: 0,
  canceled_in_range: 0, estimated_mrr_cents: 0, estimated_arr_cents: 0,
}
const EMPTY_COMMISSIONS = {
  pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0,
  declared_in_range_count: 0, declared_in_range_amount_cents: 0,
}
const EMPTY_PAYOUTS = { pending_count: 0, pending_amount_cents: 0, paid_count: 0, paid_amount_cents: 0 }

export default function FinanceDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [revenue, setRevenue] = useState(EMPTY_REVENUE)
  const [commissions, setCommissions] = useState(EMPTY_COMMISSIONS)
  const [payouts, setPayouts] = useState(EMPTY_PAYOUTS)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [revRes, commRes, payoutRes] = await Promise.all([
        supabase.rpc('get_finance_revenue_snapshot', { _range: range }),
        supabase.rpc('get_finance_commission_summary', { _range: range }),
        supabase.rpc('get_finance_partner_payout_summary'),
      ])
      const firstError = [revRes, commRes, payoutRes].find(r => r.error)
      if (firstError) throw firstError.error

      setRevenue(revRes.data?.[0] || EMPTY_REVENUE)
      setCommissions(commRes.data?.[0] || EMPTY_COMMISSIONS)
      setPayouts(payoutRes.data?.[0] || EMPTY_PAYOUTS)
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
            caption="Modelled from list price and active subscription counts, not a reconciled Stripe figure — Stripe's webhook records tier and status, not the amount actually charged per invoice."
          />
          <div className="fn-grid" style={{ opacity: loading ? 0.6 : 1 }}>
            <Tile label="Estimated MRR" value={fmtEuro(revenue.estimated_mrr_cents)} icon={Euro} accent={NAVY} />
            <Tile label="Estimated ARR" value={fmtEuro(revenue.estimated_arr_cents)} icon={TrendingUp} accent={NAVY} />
            <Tile label="Active Pro subscribers" sub={`${totalActiveSubs} total`} value={`${revenue.active_pro_monthly} mo / ${revenue.active_pro_annual} yr`} icon={Users} accent={NAVY} />
            <Tile label="New this period" sub={`${revenue.canceled_in_range} canceled`} value={revenue.new_subscriptions_in_range} icon={Wallet} accent={revenue.canceled_in_range > revenue.new_subscriptions_in_range ? AMBER : GREEN} />
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

      </div>
    </>
  )
}
