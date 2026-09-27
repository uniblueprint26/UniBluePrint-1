import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck, Eye, Ticket, Percent, Lock, Mail, Tag, AlertCircle, Clock3,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Real data, sourced from supabase/migrations/20260810120100_portals_operations_schema.sql
// (partner_users, get_my_partner_stats(), partner_category_benchmark()) plus
// 20260927180000_partner_portal_own_deals_policy.sql, which lets a business
// user read their own deals row directly. This used to be a hardcoded DEMO
// object inventing a fictional business's numbers -- every real partner was
// seeing that same fake company's stats presented as their own. See
// docs/audits/2026-09-26-website-product-audit.md, P0-4.
//
// No day-by-day or week-by-week trend here on purpose, same reasoning as
// FounderDashboardPage: there is no historical snapshot table for a
// partner's views/claims yet, and no per-institution or per-day breakdown a
// business role is allowed to read (activity_events' own RLS only lets a
// user read their own rows, not another user's view/claim event, even
// filtered to "about my listing"). Rather than fabricate a trend or a
// breakdown the data can't actually support, those sections show an honest
// "Coming soon" -- same pattern used for CoachStudioScreen's Client Activity
// fix in the app.

// ─── Design tokens (matches site-wide system) ──────────────────────────────────
const NAVY   = '#1E3A5F'
const CREAM  = '#F5F0E8'
const SAND   = '#EDE8DF'
const GREY   = '#6B7280'
const MUTED  = '#9CA3AF'
const GREEN  = '#16A34A'
const AMBER  = '#F59E0B'
const RED    = '#DC2626'
const CARD_SHADOW = '0px 2px 12px rgba(30,58,95,0.08)'
const SERIF = "'DM Serif Display', serif"
const SANS  = "'DM Sans', sans-serif"

const EMPTY_STATS = { views: 0, claims: 0, uniqueEngagedUsers: 0 }

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IE')
}

// partners.type is a lowercase slug ('fitness', 'mental-health', ...) --
// this is display formatting only, not a source of truth for the value.
function formatCategoryLabel(type) {
  if (!type) return 'Lifestyle'
  return type.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Small shared bits ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: SANS, fontSize: '12px', fontWeight: '600',
      color: GREY, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
    }}>
      {children}
    </p>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '16px', boxShadow: CARD_SHADOW,
      padding: '28px', ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Stat tile row (all-time counts, no fabricated delta) ──────────────────────

function StatTile({ icon: Icon, label, value, caption }) {
  return (
    <Card style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(30,58,95,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={NAVY} strokeWidth={2} />
        </div>
        <SectionLabel>{label}</SectionLabel>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: '34px', color: NAVY, marginTop: '14px', lineHeight: 1 }}>
        {value}
      </p>
      {caption && (
        <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginTop: '10px' }}>{caption}</p>
      )}
    </Card>
  )
}

// ─── Coming soon placeholder for a section the real schema can't back yet ─────

function ComingSoonCard({ title, message }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Clock3 size={17} color={NAVY} />
        <p style={{ fontFamily: SERIF, fontSize: '19px', color: NAVY }}>{title}</p>
      </div>
      <p style={{
        fontFamily: SANS, fontSize: '11px', fontWeight: '700', color: AMBER,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px', marginBottom: '10px',
      }}>
        Coming soon
      </p>
      <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, lineHeight: 1.65 }}>{message}</p>
    </Card>
  )
}

// ─── Comparison paired bar (you vs anonymized category average/median) ────────

function ComparisonBar({ label, yourValue, categoryValue, categoryLabel = 'Category average', suffix = '', captionPrefix }) {
  const maxV = Math.max(yourValue, categoryValue, 1) * 1.1
  const yourPct = (yourValue / maxV) * 100
  const catPct = (categoryValue / maxV) * 100
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontFamily: SANS, fontSize: '13px', fontWeight: '600', color: NAVY, marginBottom: '10px' }}>{label}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY, width: '108px', flexShrink: 0 }}>You</span>
        <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'rgba(30,58,95,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${yourPct}%`, borderRadius: '5px', background: NAVY }} />
        </div>
        <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '700', color: NAVY, width: '52px', textAlign: 'right', flexShrink: 0 }}>
          {Number.isFinite(yourValue) ? `${Math.round(yourValue * 10) / 10}${suffix}` : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY, width: '108px', flexShrink: 0 }}>{categoryLabel}</span>
        <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'rgba(30,58,95,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${catPct}%`, borderRadius: '5px', background: AMBER }} />
        </div>
        <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '700', color: '#B45309', width: '52px', textAlign: 'right', flexShrink: 0 }}>
          {Number.isFinite(categoryValue) ? `${Math.round(categoryValue * 10) / 10}${suffix}` : '—'}
        </span>
      </div>

      {captionPrefix && (
        <p style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '6px' }}>{captionPrefix}</p>
      )}
    </div>
  )
}

const PAGE_STYLES = `
  .ppp-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .ppp-split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }
  .ppp-highlight-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .ppp-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
  @media (max-width: 820px) {
    .ppp-stat-grid { grid-template-columns: 1fr; }
    .ppp-split-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .ppp-highlight-grid { grid-template-columns: 1fr; }
  }
`

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function PartnerPortalPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notLinked, setNotLinked] = useState(false)

  const [partner, setPartner] = useState(null)
  const [deal, setDeal] = useState(null)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [benchmark, setBenchmark] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotLinked(false)
    try {
      // Who am I, as a partner? A business user with no row here can log in
      // but the portal has nothing to scope to -- that's a setup error on
      // our side, shown honestly below, not a silent empty dashboard.
      const { data: partnerUser, error: partnerUserError } = await supabase
        .from('partner_users')
        .select('partner_id')
        .limit(1)
        .maybeSingle()
      if (partnerUserError) throw partnerUserError

      if (!partnerUser) {
        setNotLinked(true)
        setLoading(false)
        return
      }

      const [partnerRes, dealRes, statsRes] = await Promise.all([
        supabase.from('partners').select('id, name, type, logo_url, verified').eq('id', partnerUser.partner_id).maybeSingle(),
        supabase.from('deals')
          .select('id, title, description, discount_percent, active')
          .eq('partner_id', partnerUser.partner_id)
          .order('active', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.rpc('get_my_partner_stats'),
      ])
      if (partnerRes.error) throw partnerRes.error
      if (dealRes.error) throw dealRes.error
      if (statsRes.error) throw statsRes.error

      const partnerRow = partnerRes.data
      setPartner(partnerRow)
      setDeal(dealRes.data || null)

      const statsRow = statsRes.data?.[0]
      setStats(statsRow
        ? { views: statsRow.views || 0, claims: statsRow.claims || 0, uniqueEngagedUsers: statsRow.unique_engaged_users || 0 }
        : EMPTY_STATS)

      // Anonymized category benchmark -- only ever an aggregate across other
      // partners in the same category, never another partner's individual
      // numbers (see partner_category_benchmark()'s own comment).
      if (partnerRow?.type) {
        const { data: benchmarkData, error: benchmarkError } = await supabase
          .rpc('partner_category_benchmark', { _category: partnerRow.type })
        if (benchmarkError) throw benchmarkError
        const row = benchmarkData?.[0]
        setBenchmark(row && row.avg_views != null
          ? { avgViews: Number(row.avg_views), avgClaims: Number(row.avg_claims) || 0, medianViews: Number(row.median_views) || 0 }
          : null)
      } else {
        setBenchmark(null)
      }
    } catch (err) {
      setError(err.message || 'Could not load your Partner Portal data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <PageShell>
        <Card style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY }}>Loading your Partner Portal…</p>
        </Card>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <Card style={{ border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
          <p style={{ fontFamily: SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} /> {error}
          </p>
        </Card>
      </PageShell>
    )
  }

  if (notLinked) {
    return (
      <PageShell>
        <Card style={{ textAlign: 'center' }}>
          <ShieldCheck size={22} color={MUTED} style={{ marginBottom: '10px' }} />
          <p style={{ fontFamily: SERIF, fontSize: '20px', color: NAVY, marginBottom: '8px' }}>Not linked to a partner yet</p>
          <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, lineHeight: 1.65, maxWidth: '440px', margin: '0 auto' }}>
            Your account isn't linked to a partner listing yet, so there's nothing to show here. Contact your Partnership Contact or uniblueprintoperations@gmail.com to get set up.
          </p>
        </Card>
      </PageShell>
    )
  }

  const categoryLabel = formatCategoryLabel(partner?.type)
  const redemptionRatePct = stats.views > 0 ? (stats.claims / stats.views) * 100 : null
  const categoryAvgRedemptionRatePct = benchmark && benchmark.avgViews > 0
    ? (benchmark.avgClaims / benchmark.avgViews) * 100
    : null
  const viewsMultiplier = benchmark && benchmark.avgViews > 0 ? stats.views / benchmark.avgViews : null
  const redemptionDeltaPp = redemptionRatePct != null && categoryAvgRedemptionRatePct != null
    ? redemptionRatePct - categoryAvgRedemptionRatePct
    : null

  const isMentalHealth = partner?.type === 'mental-health'
  const initials = (partner?.name || '?')
    .split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  return (
    <PageShell>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: '24px' }}>
        <div className="ppp-header-row">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: SAND, borderRadius: '20px', padding: '5px 12px', marginBottom: '14px',
            }}>
              <ShieldCheck size={13} color={NAVY} />
              <span style={{ fontFamily: SANS, fontSize: '11px', fontWeight: '600', color: NAVY }}>
                Logged in as {partner?.name || 'your business'} &middot; Partner Portal
              </span>
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '32px', color: NAVY, lineHeight: 1.15 }}>
              Welcome back, {partner?.name || 'partner'}.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: '14px', color: GREY, marginTop: '8px', maxWidth: '520px', lineHeight: 1.6 }}>
              Here is how your Lifestyle Blueprint listing is performing, and how it compares to other {categoryLabel} partners on the platform.
            </p>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: SAND, borderRadius: '10px', padding: '8px 14px', flexShrink: 0,
          }}>
            <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '600', color: NAVY }}>All-time performance</span>
          </div>
        </div>
      </Card>

      {/* ── YOUR LISTING PERFORMANCE ──────────────────────────────────── */}
      <div style={{ marginBottom: '10px' }}>
        <SectionLabel>Your listing performance &middot; All time</SectionLabel>
      </div>
      <div className="ppp-stat-grid" style={{ marginBottom: '24px' }}>
        <StatTile icon={Eye} label="Views" value={fmt(stats.views)} />
        <StatTile icon={Ticket} label="Deal claims" value={fmt(stats.claims)} />
        <StatTile
          icon={Percent} label="Redemption rate"
          value={redemptionRatePct != null ? `${redemptionRatePct.toFixed(1)}%` : '—'}
          caption={redemptionRatePct == null ? 'Not enough data yet -- shows once your listing has views.' : 'Share of views that turned into a claim.'}
        />
      </div>

      {/* ── VIEWS OVER TIME (no history table yet -- honest placeholder) ─ */}
      <div style={{ marginBottom: '24px' }}>
        <ComingSoonCard
          title="Views over time"
          message="A day-by-day trend needs a historical snapshot we don't record yet. Once we do, you'll see how your views move week to week here."
        />
      </div>

      {/* ── MEMBER ENGAGEMENT + REDEMPTION BY DAY (same reason) ─────────── */}
      <div className="ppp-split-grid" style={{ marginBottom: '24px' }}>
        <ComingSoonCard
          title="Member engagement"
          message="A breakdown of which institutions your claims come from isn't available yet -- claim events aren't currently linked to institution data."
        />
        <ComingSoonCard
          title="Redemption by day"
          message="Which days your deal gets claimed most isn't available yet -- useful for staffing, and on our list to add."
        />
      </div>

      {/* ── HOW YOU COMPARE ───────────────────────────────────────────── */}
      <div style={{ marginBottom: '10px' }}>
        <SectionLabel>How you compare</SectionLabel>
      </div>
      {!benchmark ? (
        <Card style={{ marginBottom: '24px' }}>
          <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, lineHeight: 1.65 }}>
            Not enough other {categoryLabel} partners yet for an anonymized category comparison. This section will fill in as more {categoryLabel} listings go live.
          </p>
        </Card>
      ) : (
        <Card style={{ marginBottom: '24px' }}>
          <div className="ppp-highlight-grid" style={{ marginBottom: '24px' }}>
            <div style={{ background: 'rgba(22,163,74,0.08)', borderRadius: '12px', padding: '18px 20px' }}>
              <p style={{ fontFamily: SERIF, fontSize: '26px', color: GREEN }}>
                {viewsMultiplier != null ? `${viewsMultiplier.toFixed(1)}x` : '—'}
              </p>
              <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '6px', lineHeight: 1.55 }}>
                {viewsMultiplier != null
                  ? `Your all-time views are ${viewsMultiplier.toFixed(1)}x the ${categoryLabel} category average.`
                  : 'Not enough category data yet.'}
              </p>
            </div>
            <div style={{ background: 'rgba(30,58,95,0.06)', borderRadius: '12px', padding: '18px 20px' }}>
              <p style={{ fontFamily: SERIF, fontSize: '26px', color: NAVY }}>
                {redemptionDeltaPp != null ? `${redemptionDeltaPp >= 0 ? '+' : ''}${redemptionDeltaPp.toFixed(1)}pp` : '—'}
              </p>
              <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '6px', lineHeight: 1.55 }}>
                {redemptionDeltaPp != null
                  ? `Your redemption rate is ${redemptionDeltaPp >= 0 ? 'above' : 'below'} the ${categoryLabel} category average.`
                  : 'Not enough data yet to compare your redemption rate.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: NAVY }} />
            <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY }}>You</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: AMBER, marginLeft: '10px' }} />
            <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY }}>Category average</span>
          </div>

          <ComparisonBar
            label="Views (all time)"
            yourValue={stats.views}
            categoryValue={benchmark.medianViews}
            categoryLabel="Category median"
            captionPrefix={`Category median all-time views: ${fmt(Math.round(benchmark.medianViews))}. Your all-time views: ${fmt(stats.views)}.`}
          />
          <ComparisonBar
            label="Redemption rate"
            yourValue={redemptionRatePct ?? 0}
            categoryValue={categoryAvgRedemptionRatePct ?? 0}
            suffix="%"
          />

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '22px',
            paddingTop: '18px', borderTop: '1px solid rgba(30,58,95,0.08)',
          }}>
            <Lock size={13} color={MUTED} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>
              Comparisons are anonymized category averages. We never share another partner's individual performance data or name them directly.
            </p>
          </div>
        </Card>
      )}

      {/* ── YOUR DEAL, AS MEMBERS SEE IT ──────────────────────────────── */}
      <div style={{ marginBottom: '10px' }}>
        <SectionLabel>Your deal, as members see it</SectionLabel>
      </div>
      <Card style={{ marginBottom: '24px', maxWidth: '380px' }}>
        {!deal ? (
          <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, lineHeight: 1.65 }}>
            You don't have a deal listed yet. Contact your Partnership Contact to get one live in the Lifestyle Blueprint tab.
          </p>
        ) : (
          <div style={{ position: 'relative' }}>
            {!isMentalHealth && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: NAVY, color: CREAM, borderRadius: '4px', padding: '3px 8px',
                fontFamily: SANS, fontSize: '10px', fontWeight: '700',
              }}>
                Pro Deal
              </span>
            )}

            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', background: NAVY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: SERIF, fontSize: '18px', color: '#FFFFFF' }}>{initials}</span>
            </div>

            <p style={{ fontFamily: SERIF, fontSize: '20px', color: NAVY, marginTop: '14px' }}>{partner?.name}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              <span style={{ background: SAND, color: NAVY, borderRadius: '6px', padding: '3px 10px', fontFamily: SANS, fontSize: '11px' }}>
                <Tag size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                {categoryLabel}
              </span>
              <span style={{ background: 'rgba(20,90,62,0.1)', color: '#145A3E', borderRadius: '6px', padding: '3px 10px', fontFamily: SANS, fontSize: '11px', fontWeight: '600' }}>
                {deal.discount_percent ? `${deal.discount_percent}% off — ` : ''}{deal.title}
              </span>
            </div>

            {deal.description && (
              <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '12px', lineHeight: 1.65 }}>
                {deal.description}
              </p>
            )}

            {!deal.active && (
              <p style={{ fontFamily: SANS, fontSize: '11px', color: RED, marginTop: '12px', fontWeight: '600' }}>
                This listing is currently switched off and not visible to members.
              </p>
            )}

            <p style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '14px' }}>
              This is close to how your listing renders to members in the Lifestyle Blueprint tab.
            </p>
          </div>
        )}
      </Card>

      {/* ── FOOTER NOTE ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '32px', textAlign: 'center' }}>
        <Mail size={12} color={MUTED} />
        <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED }}>
          Questions about your listing or performance? Contact your Partnership Contact or uniblueprintoperations@gmail.com.
        </p>
      </div>
    </PageShell>
  )
}

function PageShell({ children }) {
  return (
    <>
      <Helmet>
        <title>Partner Portal | UniBlueprint</title>
        <meta name="description" content="Your Lifestyle Blueprint partner performance dashboard: listing stats, member engagement, and anonymized category benchmarking." />
        <meta name="robots" content="noindex" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: CREAM, minHeight: '100vh', padding: '48px 20px 88px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </>
  )
}
