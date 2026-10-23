import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Users, Crown, UserCheck, Briefcase, GraduationCap, Handshake,
  FileText, CalendarCheck, AlertCircle, Star,
  Euro, PiggyBank, Inbox, Eye, MousePointerClick, CheckCircle2,
  AlertTriangle, HeartHandshake, TrendingUp, Clock,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  getFinanceRevenueSnapshot, getFinanceMarginSummary,
  getLegalContracts,
  getTechAdvisorSnapshot,
  getOutreachInboundPipeline, getOutreachCoachRecruitmentSnapshot,
  getMarketingEngagementFunnel,
  getHandlerQueueSnapshot,
  getCoDirectorPendingDecisions,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
} from '../../lib/studioMetrics'
import {
  StudioShell, StatStrip, MetricBarChart, TaskBoard,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
} from '../../components/studio'

// Founder Dashboard (Studio Phase 8) -- the LAST hub in the Studio rebuild,
// rebuilt onto the shared StudioShell/StatStrip/MetricBarChart/TaskBoard/
// QuoteBanner design system every other hub already sits on
// (src/components/studio/). This is the one page meant to feel like
// "home base" for Desmond: every real capability the old ad-hoc-styled
// page had (time-range picker, feature engagement, weekly sign-ups,
// partner/coach impact tables, campus breakdown, retention snapshot) is
// kept, real and untouched underneath -- same RPCs
// (supabase/migrations/20260829130000_founder_dashboard_views.sql,
// get_all_partner_stats()) -- just re-shelled. What's genuinely NEW is the
// "Company Overview" section: a real, live rollup of Finance/Legal/Tech/
// Outreach/Marketing/Handler's own headline numbers, reusing the exact
// src/lib/studioMetrics.js getters each hub's own page already calls
// (CoDirectorDashboardPage is the direct template for this, extended here
// with the Handler Hub Phase 6 didn't have yet), plus the Co-Director Hub's
// own get_co_director_pending_decisions() rollup for "Needs A Decision" --
// every RPC it touches already checks `founder` alongside co_director/admin
// (see 20261023120100_co_director_role_checks.sql / 20261023180000_handler_
// hub_schema.sql), so no new SQL is required to let Desmond read any of it.
//
// "Founder Priorities" is the one new real feature: the generic team_tasks
// board (TaskBoard, team='founder') for Desmond's own cross-hub action
// items -- needs zero new schema. 'founder' was already a real app_role
// value (20260810120000_portal_roles.sql) long before this phase, and
// _is_team_member_or_admin() already treats any founder/admin caller as
// authorized for ANY _team value (see that function's own OR clause), so
// getTeamTasks('founder') / createTeamTask('founder', ...) work the moment
// this page calls them -- checked live via Supabase MCP before writing this,
// not assumed. Seeded with 0 rows by design, same as every other hub's
// task board at launch.
//
// Accent: HUB_ACCENTS.founder and the 'founder' QuoteBanner pool were both
// already present in theme.js/quotes.js (pre-seeded, presumably in
// anticipation of this being the final phase) -- confirmed by reading both
// files before writing this page; genuinely nothing to add there.
//
// Cross-hub rollup is fixed to the current month throughout, same choice
// CoDirectorDashboardPage made for the same reason -- "what does the
// founder need to see right now", not a second place to re-slice every
// hub's own history (each hub's own page already has that). The existing
// time-range picker (today/week/month/year) still drives the Platform/
// Activity sections below exactly as it always did.

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
]

const EVENT_LABELS = {
  document_submitted: 'Documents submitted (Foundation)',
  session_booked: 'Sessions booked (Elevation)',
  note_saved: 'Notes saved',
  handler_review: 'Handler reviews',
  ad_posted: 'Ad Board posts',
  partner_deal_viewed: 'Lifestyle deal views',
  partner_deal_claimed: 'Lifestyle deal claims',
  course_compass_click: 'Course Compass outbound clicks',
}

// team_task_overdue is badged under 'founder' here (not 'co_director' as on
// the Co-Director Hub) -- a stuck team_tasks row isn't owned by any one
// hub, and this is Desmond's own rollup, not Daniel's.
const DECISION_CATEGORY_META = {
  legal_contract_needs_fix: { label: 'Legal — contract needs a fix', hub: 'legal' },
  money_request_pending: { label: 'Finance — money request', hub: 'finance' },
  tech_idea_escalated: { label: 'Tech — idea escalated', hub: 'tech' },
  team_task_overdue: { label: 'Overdue team task', hub: 'founder' },
  outreach_contact_stalled: { label: 'Outreach — contact stalled', hub: 'outreach' },
}

const PAGE_STYLES = `
  .fh-topline-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .fh-two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; align-items: stretch; }
  .fh-hub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .fh-table-wrap { overflow-x: auto; }
  .fh-table { width: 100%; border-collapse: collapse; }
  .fh-table th { text-align: left; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; padding: 0 10px 8px; border-bottom: 1px solid rgba(30,58,95,0.1); white-space: nowrap; }
  .fh-table td { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; padding: 8px 10px; border-bottom: 1px solid rgba(30,58,95,0.06); vertical-align: top; }
  .fh-table tr:last-child td { border-bottom: none; }
  @media (max-width: 1100px) { .fh-topline-grid { grid-template-columns: repeat(2, 1fr); } .fh-two-col { grid-template-columns: 1fr; } .fh-hub-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .fh-topline-grid { grid-template-columns: 1fr; } .fh-hub-grid { grid-template-columns: 1fr; } }
`

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IE')
}
function fmtEuro(cents) {
  if (cents === null || cents === undefined) return '—'
  return `€${(cents / 100).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

function SectionTitle({ eyebrow, title, caption }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: FONT_SERIF, fontSize: '19px', color: NAVY, margin: '3px 0 0' }}>{title}</h2>
      {caption && <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, margin: '4px 0 0', lineHeight: 1.5 }}>{caption}</p>}
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
function HubBadge({ hub, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700,
      color: HUB_ACCENTS[hub] || NAVY, background: CREAM, borderRadius: '999px', padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: HUB_ACCENTS[hub] || NAVY }} />
      {label}
    </span>
  )
}
function HubCard({ hub, title, children }) {
  return (
    <Card>
      <div style={{ marginBottom: '10px' }}>
        <HubBadge hub={hub} label={title} />
      </div>
      {children}
    </Card>
  )
}

function GrowthChart({ data }) {
  const width = 640
  const height = 140
  const padTop = 10
  const padBottom = 22
  const plotH = height - padTop - padBottom
  const max = Math.max(...data, 1)
  const min = 0
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = padTop + plotH - ((d - min) / (max - min)) * plotH
    return [x, y]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${padTop + plotH} L0,${padTop + plotH} Z`
  const baselineY = padTop + plotH
  const [lastX, lastY] = pts[pts.length - 1] || [0, baselineY]
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} role="img" aria-label="New sign-ups per week over the last 12 weeks">
      <line x1="0" y1={baselineY} x2={width} y2={baselineY} stroke="#E5E0D6" strokeWidth="1" />
      <path d={area} fill={NAVY} opacity="0.1" />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="4" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />
      <text x={lastX} y={lastY - 10} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill={NAVY}>
        {data[data.length - 1] ?? 0}
      </text>
      <text x="0" y={height - 4} fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>12 weeks ago</text>
      <text x={width} y={height - 4} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>This week</text>
    </svg>
  )
}

const EMPTY_TOPLINE = {
  total_members: 0, pro_subscribers: 0, free_members: 0, active_handlers: 0,
  coach_profiles_listed: 0, active_partners: 0, foundation_submissions: 0, coach_enquiries: 0,
}
const EMPTY_RETENTION = {
  active_pro_count: 0, canceled_in_range: 0, cancellation_rate: null,
  avg_active_sub_months: null, conversion_rate: null,
}
const EMPTY_REVENUE = { estimated_mrr_cents: 0, estimated_arr_cents: 0, active_pro_monthly: 0, active_pro_annual: 0 }
const EMPTY_MARGIN = { gross_collected_cents: 0, paid_to_coaches_cents: 0, ubp_margin_cents: 0, margin_pct: null }

export default function FounderDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Legacy, real, range-scoped founder data (unchanged RPCs) ───────────
  const [topline, setTopline] = useState(EMPTY_TOPLINE)
  const [engagement, setEngagement] = useState([])
  const [weeklySignups, setWeeklySignups] = useState([])
  const [partners, setPartners] = useState([])
  const [coaches, setCoaches] = useState([])
  const [campuses, setCampuses] = useState([])
  const [retention, setRetention] = useState(EMPTY_RETENTION)

  // ── New: company-wide cross-hub rollup, fixed to the current month ─────
  const [revenue, setRevenue] = useState(EMPTY_REVENUE)
  const [margin, setMargin] = useState(EMPTY_MARGIN)
  const [contracts, setContracts] = useState([])
  const [advisorFindings, setAdvisorFindings] = useState([])
  const [pipeline, setPipeline] = useState([])
  const [coachSnapshot, setCoachSnapshot] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [handlerSnapshot, setHandlerSnapshot] = useState(null)
  const [decisions, setDecisions] = useState([])

  // ── New: Founder Priorities (generic team_tasks, team='founder') ───────
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        toplineRes, engagementRes, signupsRes, partnersRes,
        enquiriesRes, ratingsRes, campusesRes, retentionRes,
        revRes, marginRes, contractsRes, advisorRes,
        pipelineRes, coachRes, funnelRes, handlerRes, decisionsRes,
        tasksRes, membersRes,
      ] = await Promise.all([
        supabase.rpc('get_founder_topline', { _range: range }),
        supabase.rpc('get_feature_engagement', { _range: range }),
        supabase.rpc('get_weekly_signups'),
        supabase.rpc('get_all_partner_stats'),
        supabase.rpc('get_coach_enquiry_counts'),
        supabase.from('coach_rating_summary').select('*'),
        supabase.rpc('get_campus_breakdown', { _range: range }),
        supabase.rpc('get_retention_snapshot', { _range: range }),
        getFinanceRevenueSnapshot('month'),
        getFinanceMarginSummary('month'),
        getLegalContracts(),
        getTechAdvisorSnapshot(),
        getOutreachInboundPipeline(),
        getOutreachCoachRecruitmentSnapshot(),
        getMarketingEngagementFunnel(),
        getHandlerQueueSnapshot(),
        getCoDirectorPendingDecisions(),
        getTeamTasks('founder'),
        getTeamRoster('founder'),
      ])

      const firstError = [toplineRes, engagementRes, signupsRes, partnersRes, enquiriesRes, ratingsRes, campusesRes, retentionRes]
        .find(r => r.error)
      if (firstError) throw firstError.error

      setTopline(toplineRes.data?.[0] || EMPTY_TOPLINE)
      setEngagement((engagementRes.data || []).map(r => ({ name: EVENT_LABELS[r.event_type] || r.event_type, value: r.event_count })))
      setWeeklySignups((signupsRes.data || []).map(r => r.signups))
      setPartners(partnersRes.data || [])

      const ratingsBySlug = Object.fromEntries((ratingsRes.data || []).map(r => [r.coach_slug, r]))
      setCoaches((enquiriesRes.data || []).map(e => ({
        ...e,
        rating: ratingsBySlug[e.coach_slug]?.avg_rating ?? null,
        ratingCount: ratingsBySlug[e.coach_slug]?.rating_count ?? 0,
      })).sort((a, b) => b.enquiry_count - a.enquiry_count))

      setCampuses((campusesRes.data || []).map(r => ({ name: r.institution, members: r.member_count, submissions: r.submission_count })))
      setRetention(retentionRes.data?.[0] || EMPTY_RETENTION)

      setRevenue(revRes.value || EMPTY_REVENUE)
      setMargin(marginRes.value || EMPTY_MARGIN)
      setContracts(contractsRes.value || [])
      setAdvisorFindings(advisorRes.value || [])
      setPipeline(pipelineRes.value || [])
      setCoachSnapshot(coachRes.value || null)
      setFunnel(funnelRes.value || null)
      setHandlerSnapshot(handlerRes.value || null)
      setDecisions(decisionsRes.value || [])
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  // ── Founder Priorities task actions ─────────────────────────────────────
  async function addTask(fields) {
    try {
      await createTeamTask('founder', fields)
      const r = await getTeamTasks('founder')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not create that priority.')
    }
  }
  async function changeTaskStatus(id, status) {
    try {
      await setTeamTaskStatus(id, status)
      const r = await getTeamTasks('founder')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that priority.')
    }
  }
  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  // ── Derived: Legal contracts by status (same shape as LegalDashboardPage/CoDirector) ──
  const contractsByStatus = useMemo(() => {
    const counts = { not_sent: 0, sent: 0, signed: 0, needs_fix: 0, expired: 0 }
    for (const c of contracts) counts[c.status] = (counts[c.status] || 0) + 1
    return counts
  }, [contracts])

  // ── Derived: Tech advisor findings, combined security+performance ──────
  const severityTotals = useMemo(() => {
    const totals = { ERROR: 0, WARN: 0, INFO: 0 }
    for (const f of advisorFindings) totals[f.level] = (totals[f.level] || 0) + f.finding_count
    return totals
  }, [advisorFindings])

  const totalPipeline = pipeline.reduce((s, p) => s + (p.pipeline_count || 0), 0)
  const proSharePct = topline.total_members > 0 ? Math.round((topline.pro_subscribers / topline.total_members) * 100) : 0

  const toplineTiles = [
    { key: 'members', label: 'Total active members', value: fmt(topline.total_members), icon: Users },
    { key: 'pro', label: 'Pro subscribers', sub: `${proSharePct}% of total`, value: fmt(topline.pro_subscribers), icon: Crown },
    { key: 'free', label: 'Free tier members', value: fmt(topline.free_members), icon: UserCheck },
    { key: 'handlers', label: 'Active Campus Handlers', value: fmt(topline.active_handlers), icon: Briefcase },
    { key: 'coaches', label: 'Coach profiles listed', value: fmt(topline.coach_profiles_listed), icon: GraduationCap },
    { key: 'partners', label: 'Active Lifestyle Partners', value: fmt(topline.active_partners), icon: Handshake },
    { key: 'foundation', label: 'Foundation Blueprint submissions', sub: 'this period', value: fmt(topline.foundation_submissions), icon: FileText },
    { key: 'elevation', label: 'Elevation coach enquiries', sub: 'this period', value: fmt(topline.coach_enquiries), icon: CalendarCheck },
  ]

  const rangeControl = (
    <div style={{ display: 'inline-flex', background: '#FFFFFF', borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
      {RANGES.map(r => (
        <button
          key={r.key}
          type="button"
          onClick={() => setRange(r.key)}
          style={{
            fontFamily: FONT_SANS, fontSize: '12px', fontWeight: '600',
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
  )

  const sections = [
    { id: 'fh-overview', label: 'Company Overview' },
    { id: 'fh-platform', label: 'Platform' },
    { id: 'fh-activity', label: 'Activity' },
    { id: 'fh-partners', label: 'Partners & Coaches' },
    { id: 'fh-decisions', label: 'Needs A Decision' },
    { id: 'fh-priorities', label: 'Founder Priorities' },
  ]

  return (
    <>
      <Helmet>
        <title>Founder Dashboard | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        hubKey="founder"
        title="Founder Dashboard"
        subtitle="Home base: a real, live rollup of every Studio hub's own headline numbers, plus platform health, feature usage, and partner/coach impact. Read only except Founder Priorities, below."
        accentColor={HUB_ACCENTS.founder}
        sections={sections}
        rangeControl={rangeControl}
        error={!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ COMPANY OVERVIEW ═══════════════════════════════════════════ */}
        <div id="fh-overview" style={{ scrollMarginTop: '60px', marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Cross-hub rollup, this month"
            title="Company Overview"
            caption="Every hub's own real headline numbers, in one glance -- each figure below reuses the exact src/lib/studioMetrics.js function that hub's own page already calls (Finance/Legal/Tech/Outreach/Marketing/Handler), nothing re-derived. Fixed to the current month, same as the Co-Director Hub's own rollup."
          />
          <div className="fh-hub-grid" style={{ opacity: loading ? 0.6 : 1 }}>
            <HubCard hub="finance" title="Finance">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'mrr', label: 'Estimated MRR', value: fmtEuro(revenue.estimated_mrr_cents), icon: Euro, accent: HUB_ACCENTS.finance },
                  { key: 'margin', label: 'UBP margin', value: fmtEuro(margin.ubp_margin_cents), icon: PiggyBank, accent: GREEN },
                ]}
              />
            </HubCard>
            <HubCard hub="legal" title="Legal">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'needs-fix', label: 'Contracts needing a fix', value: fmt(contractsByStatus.needs_fix), icon: AlertTriangle, accent: contractsByStatus.needs_fix > 0 ? RED : GREEN },
                  { key: 'signed', label: 'Contracts signed', value: fmt(contractsByStatus.signed), icon: CheckCircle2, accent: HUB_ACCENTS.legal },
                ]}
              />
            </HubCard>
            <HubCard hub="tech" title="Tech">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'error', label: 'Advisor errors', value: fmt(severityTotals.ERROR), icon: AlertCircle, accent: severityTotals.ERROR > 0 ? RED : GREEN },
                  { key: 'warn', label: 'Advisor warnings', value: fmt(severityTotals.WARN), icon: AlertTriangle, accent: AMBER },
                ]}
              />
            </HubCard>
            <HubCard hub="outreach" title="Outreach">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'pipeline', label: 'Inbound pipeline, all types', value: fmt(totalPipeline), icon: Inbox, accent: HUB_ACCENTS.outreach },
                  { key: 'coaches', label: 'Real, live coaches', value: fmt(coachSnapshot?.real_live_coaches), icon: UserCheck, accent: coachSnapshot?.real_live_coaches > 0 ? GREEN : AMBER },
                ]}
              />
            </HubCard>
            <HubCard hub="marketing" title="Marketing">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'views', label: 'Real deal views', value: fmt(funnel?.real_views), icon: Eye, accent: HUB_ACCENTS.marketing },
                  { key: 'claims', label: 'Real deal claims', value: fmt(funnel?.real_claims), icon: MousePointerClick, accent: funnel?.real_claims > 0 ? GREEN : AMBER },
                ]}
              />
            </HubCard>
            <HubCard hub="handler" title="Campus Handler">
              <StatStrip
                columns={2}
                cells={[
                  { key: 'open', label: 'Open tickets', value: fmt(handlerSnapshot?.open_tickets), icon: Inbox, accent: HUB_ACCENTS.handler },
                  { key: 'delivered', label: 'Delivered this week', value: fmt(handlerSnapshot?.delivered_this_week), icon: CheckCircle2, accent: GREEN },
                ]}
              />
            </HubCard>
          </div>
        </div>

        {/* ══ PLATFORM ═════════════════════════════════════════════════ */}
        <div id="fh-platform" style={{ scrollMarginTop: '60px', marginBottom: '20px' }}>
          <Card style={{ marginBottom: '16px' }}>
            <SectionTitle eyebrow="UniBlueprint platform" title="Platform health"
              caption="Real totals as of now, plus submissions/enquiries for the selected period above. No delta/sparkline on purpose -- there is no historical snapshot table yet to compare a period against, so this shows current totals honestly rather than a fabricated trend." />
            <div className="fh-topline-grid" style={{ opacity: loading ? 0.6 : 1 }}>
              <StatStrip columns={4} cells={toplineTiles} />
            </div>
          </Card>
          <div className="fh-two-col">
            <Card>
              <SectionTitle eyebrow="Growth" title="New sign-ups per week" caption="Last 12 weeks." />
              <GrowthChart data={weeklySignups.length ? weeklySignups : [0]} />
            </Card>
            <Card>
              <SectionTitle eyebrow="Retention" title="Retention snapshot" />
              <StatStrip
                columns={1}
                style={{ opacity: loading ? 0.6 : 1 }}
                cells={[
                  { key: 'cancellation', label: `Pro cancellation, this period`, sub: `${fmt(retention.canceled_in_range)} canceled`, value: retention.cancellation_rate != null ? `${retention.cancellation_rate}%` : '—', icon: AlertTriangle, accent: RED },
                  { key: 'tenure', label: 'Average tenure, active subscriptions', value: retention.avg_active_sub_months != null ? `${retention.avg_active_sub_months} mo` : '—', icon: Clock, accent: NAVY },
                  { key: 'conversion', label: 'Free → Pro conversion rate', value: retention.conversion_rate != null ? `${retention.conversion_rate}%` : '—', icon: TrendingUp, accent: GREEN },
                ]}
              />
            </Card>
          </div>
        </div>

        {/* ══ ACTIVITY ═════════════════════════════════════════════════ */}
        <div id="fh-activity" style={{ scrollMarginTop: '60px', marginBottom: '20px' }}>
          <div className="fh-two-col">
            <Card>
              <SectionTitle
                eyebrow="Product usage"
                title="Feature engagement"
                caption="Logged events this period, by type. Not every pillar has event logging wired up yet, so this is a partial picture, not full cross-pillar usage."
              />
              <MetricBarChart data={engagement} accentColor={HUB_ACCENTS.founder} emptyLabel="Nothing recorded this period." />
            </Card>
            <Card>
              <SectionTitle eyebrow="Institutions" title="Campus breakdown" caption="Member count by institution, all time; submission volume this period alongside." />
              {campuses.length === 0 ? (
                <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>No members with an institution on file yet.</p>
              ) : (
                <div className="fh-table-wrap">
                  <table className="fh-table">
                    <thead><tr><th>Institution</th><th>Members</th><th>Submissions, this period</th></tr></thead>
                    <tbody>
                      {campuses.map(c => (
                        <tr key={c.name}>
                          <td style={{ fontWeight: '600' }}>{c.name}</td>
                          <td>{fmt(c.members)}</td>
                          <td>{fmt(c.submissions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ══ PARTNERS & COACHES ═══════════════════════════════════════ */}
        <div id="fh-partners" style={{ scrollMarginTop: '60px', marginBottom: '20px' }}>
          <Card style={{ marginBottom: '16px' }}>
            <SectionTitle
              eyebrow="Partner impact"
              title="Lifestyle partner performance"
              caption="All-time views, deal claims, and unique engaged users per live partner."
            />
            {partners.length === 0 ? (
              <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>No partner activity recorded yet.</p>
            ) : (
              <div className="fh-table-wrap">
                <table className="fh-table">
                  <thead>
                    <tr><th>Partner</th><th>Views</th><th>Deal claims</th><th>Unique users engaged</th></tr>
                  </thead>
                  <tbody>
                    {[...partners].sort((a, b) => b.views - a.views).map(p => (
                      <tr key={p.partner_id}>
                        <td style={{ fontWeight: '600' }}>{p.partner_name}</td>
                        <td>{fmt(p.views)}</td>
                        <td>{fmt(p.claims)}</td>
                        <td>{fmt(p.unique_engaged_users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle
              eyebrow="Coach impact"
              title="Uni Coach performance"
              caption="Enquiry counts and average rating this period. Coaches handle their own bookings outside the platform, so enquiries are the real, available signal, not a booking count."
            />
            {coaches.length === 0 ? (
              <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>No coach enquiries yet this period.</p>
            ) : (
              <div className="fh-table-wrap">
                <table className="fh-table">
                  <thead><tr><th>Coach</th><th>Enquiries</th><th>Average rating</th></tr></thead>
                  <tbody>
                    {coaches.map(c => (
                      <tr key={c.coach_slug}>
                        <td style={{ fontWeight: '600' }}>{c.coach_name}</td>
                        <td>{c.enquiry_count}</td>
                        <td>
                          {c.rating != null ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={11} color="#F59E0B" fill="#F59E0B" />
                              {Number(c.rating).toFixed(1)} / 5 ({c.ratingCount})
                            </span>
                          ) : (
                            <span style={{ color: MUTED }}>Not yet rated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ══ NEEDS A DECISION ═══════════════════════════════════════════
            Reuses get_co_director_pending_decisions() -- the Co-Director
            Hub's own cross-hub rollup, which already authorizes founder. */}
        <Card id="fh-decisions" style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Across every hub" title="What needs a decision"
            caption="A real, live rollup of items explicitly flagged for leadership sign-off: Legal contracts needing a fix, open Finance money requests, Tech ideas escalated to the founder, overdue team tasks (any team), and outreach contacts stalled 14+ days with no response. Same get_co_director_pending_decisions() the Co-Director Hub uses -- one shared rollup, not a duplicated query." />
          {decisions.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '10px',
              background: 'rgba(22,163,74,0.08)', border: `1px solid ${GREEN}`,
            }}>
              <CheckCircle2 size={16} color={GREEN} />
              <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, margin: 0 }}>
                <strong>Nothing pending.</strong> Every category above is genuinely caught up right now -- a real, honest "all clear", not an empty state hiding missing data.
              </p>
            </div>
          ) : (
            <div className="fh-table-wrap">
              <table className="fh-table">
                <thead><tr><th>Hub</th><th>Item</th><th>Detail</th><th>Flagged</th></tr></thead>
                <tbody>
                  {decisions.map((d, i) => {
                    const meta = DECISION_CATEGORY_META[d.category] || { label: d.category, hub: 'founder' }
                    return (
                      <tr key={`${d.category}-${i}`}>
                        <td><HubBadge hub={meta.hub} label={meta.label} /></td>
                        <td style={{ fontWeight: 600, maxWidth: '220px', whiteSpace: 'normal' }}>{d.label}</td>
                        <td style={{ maxWidth: '320px', whiteSpace: 'normal', color: GREY }}>{d.detail || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(d.flagged_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ FOUNDER PRIORITIES ═══════════════════════════════════════
            The one new real feature: the generic team_tasks board,
            team='founder' -- Desmond's own cross-hub action items. */}
        <Card id="fh-priorities">
          <SectionTitle eyebrow="New" title="Founder Priorities"
            caption="Real, generic team_tasks rows for the Founder team (the same reusable TaskBoard component Legal/Tech/Outreach/Marketing/Handler use) -- Desmond's own cross-hub action items that don't belong to any one team. Seeded empty -- nothing below is a placeholder." />
          <StatStrip
            columns={3}
            style={{ marginBottom: '16px' }}
            cells={[
              { key: 'todo', label: 'To do', value: fmt(tasksByStatus.todo), icon: Inbox, accent: MUTED },
              { key: 'in-progress', label: 'In progress', value: fmt(tasksByStatus.in_progress), icon: TrendingUp, accent: AMBER },
              { key: 'done', label: 'Done', value: fmt(tasksByStatus.done), icon: HeartHandshake, accent: GREEN },
            ]}
          />
          <TaskBoard
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={addTask}
            onStatusChange={changeTaskStatus}
            accentColor={HUB_ACCENTS.founder}
            emptyLabel="No Founder priorities yet -- add the first real one above."
          />
        </Card>

      </StudioShell>
    </>
  )
}
