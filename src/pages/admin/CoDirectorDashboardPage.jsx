import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Euro, TrendingUp, PiggyBank, Landmark,
  Inbox, UserCheck, Eye, MousePointerClick, CheckCircle2, AlertCircle, HeartHandshake,
} from 'lucide-react'
import {
  StudioShell, StudioCard as Card, SectionTitle, EmptyNote, StatStrip, MetricBarChart, TaskBoard, RequestPanel,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, HUB_LABELS, FONT_SERIF, FONT_SANS, tint,
} from '../../components/studio'
import {
  getFinanceRevenueSnapshot, getFinanceMarginSummary,
  getLegalContracts,
  getTechAdvisorSnapshot,
  getOutreachInboundPipeline, getOutreachCoachRecruitmentSnapshot,
  getMarketingEngagementFunnel,
  getCoDirectorPendingDecisions,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
  listStudioRequests, createStudioRequest, approveStudioRequest, denyStudioRequest, getAllPendingStudioRequests,
} from '../../lib/studioMetrics'

// Co-Director Hub (Studio Phase 6) -- for Daniel (Co-Director), genuine
// founder-equivalent "master key" oversight. NOT a sixth operational hub --
// deliberately no new write tools, no new per-hub detail. Every headline
// number below reuses the exact same src/lib/studioMetrics.js functions
// the Finance/Legal/Tech/Outreach/Marketing hub pages already call (see
// each section's own comment for which) -- nothing here re-derives the
// underlying SQL. The one genuinely new thing is the "What Needs A
// Decision" section at the bottom, via get_co_director_pending_decisions()
// (supabase/migrations/20261023120200_co_director_hub_schema.sql) -- a
// real company-wide rollup of Legal/Finance/Tech/Outreach items explicitly
// flagged for leadership sign-off, checked live before building (see that
// migration's header for what's genuinely 0 today, including one leftover
// Playwright-QA scratch row this query deliberately excludes).
//
// Access: route-gated to co_director/founder/admin (src/App.jsx), and the
// underlying Finance/Legal/Tech/Outreach/Marketing RPCs this page calls
// were all updated (supabase/migrations/20261023120100_co_director_role_
// checks.sql) to accept co_director alongside founder, so Daniel's access
// is real all the way down to the data, not just this page's shell.
//
// Fixed to the current month/live snapshot throughout -- a range toggle is
// each hub's OWN detail page's job (Finance/Tech already have one); this
// rollup's job is "what does leadership need to see right now", not a
// second place to slice every hub's history.
//
// Studio Phase 9 addition -- "Co-Director Priorities": the same generic
// team_tasks board (TaskBoard, team='co_director') the Founder Dashboard
// got in Phase 8 as "Founder Priorities", for Daniel's own cross-hub action
// items. This hub had gone without one, which the Phase 9 audit flagged as
// an unintentional asymmetry between the two apex-oversight hubs. Needs
// zero new schema: 'co_director' is already a real app_role value
// (pre-dating this hub), team_tasks.team is a plain text column with no
// CHECK constraint on its values, and _is_team_member_or_admin() already
// treats any co_director/founder/admin caller as authorized for ANY _team
// value -- confirmed live via Supabase MCP (list_team_tasks/create_team_
// task/set_team_task_status/get_team_roster all gate on that one function)
// before writing this, not assumed, the same way Founder Priorities did.

const PAGE_STYLES = `
  .cd-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  @media (max-width: 1100px) { .cd-two-col { grid-template-columns: minmax(0, 1fr); } }
`

function fmt(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-IE') }
function fmtEuro(cents) {
  if (cents === null || cents === undefined) return '—'
  return `€${(cents / 100).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function pctWhole(x) { return x == null ? '—' : `${Number(x).toFixed(1)}%` }
function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

const DECISION_CATEGORY_META = {
  legal_contract_needs_fix: { label: 'Legal — contract needs a fix', hub: 'legal' },
  money_request_pending: { label: 'Finance — money request', hub: 'finance' },
  tech_idea_escalated: { label: 'Tech — idea escalated', hub: 'tech' },
  team_task_overdue: { label: 'Overdue task', hub: 'co_director' },
  outreach_contact_stalled: { label: 'Outreach — contact stalled', hub: 'outreach' },
}

function HubBadge({ hub, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700,
      color: HUB_ACCENTS[hub] || NAVY, background: tint(HUB_ACCENTS[hub] || NAVY, 0.08), border: `1px solid ${tint(HUB_ACCENTS[hub] || NAVY, 0.2)}`, borderRadius: '999px', padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: HUB_ACCENTS[hub] || NAVY }} />
      {label}
    </span>
  )
}

const EMPTY_REVENUE = { estimated_mrr_cents: 0, estimated_arr_cents: 0, active_pro_monthly: 0, active_pro_annual: 0 }
const EMPTY_MARGIN = { gross_collected_cents: 0, paid_to_coaches_cents: 0, ubp_margin_cents: 0, margin_pct: null }

export default function CoDirectorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [revenue, setRevenue] = useState(EMPTY_REVENUE)
  const [margin, setMargin] = useState(EMPTY_MARGIN)
  const [contracts, setContracts] = useState([])
  const [advisorFindings, setAdvisorFindings] = useState([])
  const [pipeline, setPipeline] = useState([])
  const [coachSnapshot, setCoachSnapshot] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [decisions, setDecisions] = useState([])

  // ── Co-Director Priorities (generic team_tasks, team='co_director') ────
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])
  const [allPendingRequests, setAllPendingRequests] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        revRes, marginRes, contractsRes, advisorRes,
        pipelineRes, coachRes, funnelRes, decisionsRes,
        tasksRes, membersRes, requestsRes, allPendingRes,
      ] = await Promise.all([
        getFinanceRevenueSnapshot('month'),
        getFinanceMarginSummary('month'),
        getLegalContracts(),
        getTechAdvisorSnapshot(),
        getOutreachInboundPipeline(),
        getOutreachCoachRecruitmentSnapshot(),
        getMarketingEngagementFunnel(),
        getCoDirectorPendingDecisions(),
        getTeamTasks('co_director'),
        getTeamRoster('co_director'),
        listStudioRequests('co_director'),
        getAllPendingStudioRequests(),
      ])
      setRevenue(revRes.value || EMPTY_REVENUE)
      setMargin(marginRes.value || EMPTY_MARGIN)
      setContracts(contractsRes.value || [])
      setAdvisorFindings(advisorRes.value || [])
      setPipeline(pipelineRes.value || [])
      setCoachSnapshot(coachRes.value || null)
      setFunnel(funnelRes.value || null)
      setDecisions(decisionsRes.value || [])
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
      setRequests(requestsRes.value || [])
      setAllPendingRequests(allPendingRes.value || [])
    } catch (err) {
      setError(err.message || 'Could not load the rollup data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Co-Director Priorities task actions ─────────────────────────────────
  async function addTask(fields) {
    try {
      await createTeamTask('co_director', fields)
      const r = await getTeamTasks('co_director')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not create that priority.')
    }
  }
  async function changeTaskStatus(id, status) {
    try {
      await setTeamTaskStatus(id, status)
      const r = await getTeamTasks('co_director')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that priority.')
    }
  }

  // ── Requests (Studio Phase 11 -- cross-hub task handoff / access requests) ──
  async function createRequest(fields) {
    try {
      await createStudioRequest(fields)
      const r = await listStudioRequests('co_director')
      setRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not send that request.')
    }
  }
  async function approveRequest(id, note, assignTo) {
    try {
      await approveStudioRequest(id, note, assignTo)
      const [r, t, allP] = await Promise.all([listStudioRequests('co_director'), getTeamTasks('co_director'), getAllPendingStudioRequests()])
      setRequests(r.value || [])
      setTasks(t.value || [])
      setAllPendingRequests(allP.value || [])
    } catch (err) {
      setError(err.message || 'Could not approve that request.')
    }
  }
  async function denyRequest(id, note) {
    try {
      await denyStudioRequest(id, note)
      const [r, allP] = await Promise.all([listStudioRequests('co_director'), getAllPendingStudioRequests()])
      setRequests(r.value || [])
      setAllPendingRequests(allP.value || [])
    } catch (err) {
      setError(err.message || 'Could not deny that request.')
    }
  }

  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  // ── Derived: Legal contracts by status (same shape as LegalDashboardPage) ──
  const contractsByStatus = useMemo(() => {
    const counts = { not_sent: 0, sent: 0, signed: 0, needs_fix: 0, expired: 0 }
    for (const c of contracts) counts[c.status] = (counts[c.status] || 0) + 1
    return counts
  }, [contracts])

  // ── Derived: Tech advisor findings, combined security+performance -- a
  // rollup needs the single platform-health number, not the category split
  // TechDashboardPage itself drills into. ──
  const severityTotals = useMemo(() => {
    const totals = { ERROR: 0, WARN: 0, INFO: 0 }
    for (const f of advisorFindings) totals[f.level] = (totals[f.level] || 0) + f.finding_count
    return totals
  }, [advisorFindings])
  const totalFindings = severityTotals.ERROR + severityTotals.WARN + severityTotals.INFO
  const capturedAt = advisorFindings[0]?.captured_at || null

  const totalPipeline = pipeline.reduce((s, p) => s + (p.pipeline_count || 0), 0)

  const sections = [
    { id: 'cd-finance', label: 'Finance' },
    { id: 'cd-legal', label: 'Legal' },
    { id: 'cd-tech', label: 'Tech' },
    { id: 'cd-outreach', label: 'Outreach' },
    { id: 'cd-marketing', label: 'Marketing' },
    { id: 'cd-decisions', label: 'Needs A Decision' },
    { id: 'cd-priorities', label: 'Co-Director Priorities' },
    { id: 'cd-all-requests', label: 'Cross-Hub Requests' },
    { id: 'cd-requests', label: 'Requests' },
  ]

  return (
    <>
      <Helmet>
        <title>Co-Director Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        hubKey="co_director"
        title="Co-Director Hub"
        subtitle="One bird's-eye rollup of Finance, Legal, Tech, Outreach and Marketing's real headline numbers -- for Daniel. Every figure below is read live from the same hub RPCs each team's own page already calls; nothing is re-derived or duplicated. This month's snapshot throughout."
        accentColor={HUB_ACCENTS.co_director}
        sections={sections}
        error={!!error && (
          <Card style={{ marginBottom: 'var(--studio-gap)', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ FINANCE ══════════════════════════════════════════════════ */}
        <Card id="cd-finance" style={{ marginBottom: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="From Finance Hub" title="Revenue & margin"
            caption="Real subscription MRR/ARR and UBP take-home margin this month, excluding the 24 banned demo/QA accounts -- the same get_finance_revenue_snapshot()/get_finance_margin_summary() calls FinanceDashboardPage uses. See the Finance Hub itself for commissions, payouts, client register and the full picture." />
          <StatStrip
            columns={4}
            style={{ opacity: loading ? 0.6 : 1 }}
            cells={[
              { key: 'mrr', label: 'Estimated MRR', value: fmtEuro(revenue.estimated_mrr_cents), icon: Euro, accent: HUB_ACCENTS.finance },
              { key: 'arr', label: 'Estimated ARR', value: fmtEuro(revenue.estimated_arr_cents), icon: TrendingUp, accent: HUB_ACCENTS.finance },
              { key: 'margin', label: 'UBP margin, this month', sub: margin.margin_pct != null ? `${pctWhole(margin.margin_pct)} of gross` : 'no gross yet', value: fmtEuro(margin.ubp_margin_cents), icon: PiggyBank, accent: GREEN },
              { key: 'gross', label: 'Gross collected', value: fmtEuro(margin.gross_collected_cents), icon: Landmark, accent: NAVY },
            ]}
          />
        </Card>

        {/* ══ LEGAL ════════════════════════════════════════════════════ */}
        <Card id="cd-legal" style={{ marginBottom: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="From Legal Hub" title="Contracts register, by status"
            caption="Real legal_contracts rows, by status -- the same list_legal_contracts() call LegalDashboardPage uses. See the Legal Hub itself for GDPR requests and acknowledgement coverage." />
          <MetricBarChart
            data={[
              { name: 'Not sent', value: contractsByStatus.not_sent, color: MUTED },
              { name: 'Sent', value: contractsByStatus.sent, color: AMBER },
              { name: 'Signed', value: contractsByStatus.signed, color: GREEN },
              { name: 'Needs fix', value: contractsByStatus.needs_fix, color: RED },
              { name: 'Expired', value: contractsByStatus.expired, color: RED },
            ]}
            accentColor={HUB_ACCENTS.legal}
            emptyLabel="No contracts tracked yet."
          />
        </Card>

        {/* ══ TECH ═════════════════════════════════════════════════════ */}
        <Card id="cd-tech" style={{ marginBottom: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="From Tech Hub" title="Platform health, by severity"
            caption={`Real Supabase security + performance advisor findings, by severity (captured ${capturedAt ? fmtDateTime(capturedAt) : '—'} -- a snapshot, same get_tech_advisor_snapshot() call TechDashboardPage uses; see that page's own caption for why this is a snapshot, not a live poll). ${fmt(totalFindings)} total findings across both categories.`} />
          <MetricBarChart
            data={[
              { name: 'Error', value: severityTotals.ERROR, color: RED },
              { name: 'Warn', value: severityTotals.WARN, color: AMBER },
              { name: 'Info', value: severityTotals.INFO, color: MUTED },
            ]}
            accentColor={HUB_ACCENTS.tech}
            emptyLabel="No advisor snapshot captured yet."
          />
        </Card>

        {/* ══ OUTREACH ═════════════════════════════════════════════════ */}
        <Card id="cd-outreach" style={{ marginBottom: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="From Outreach Hub" title="Inbound pipeline & coach recruitment"
            caption="Real counts across all 8 enquiry/application tables, and the real coach_profiles breakdown -- the same get_outreach_inbound_pipeline()/get_outreach_coach_recruitment_snapshot() calls OutreachDashboardPage uses." />
          <div className="cd-two-col" style={{ opacity: loading ? 0.6 : 1 }}>
            <StatStrip
              columns={1}
              cells={[
                { key: 'pipeline', label: 'Total inbound pipeline, all types', value: fmt(totalPipeline), icon: Inbox, accent: HUB_ACCENTS.outreach },
              ]}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', minWidth: 0,
              background: tint(coachSnapshot?.real_live_coaches > 0 ? GREEN : RED, 0.06),
              border: `1px solid ${tint(coachSnapshot?.real_live_coaches > 0 ? GREEN : RED, 0.35)}`,
            }}>
              <UserCheck size={18} style={{ flexShrink: 0 }} color={coachSnapshot?.real_live_coaches > 0 ? GREEN : RED} />
              <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, margin: 0, lineHeight: 1.55 }}>
                <strong>{coachSnapshot ? fmt(coachSnapshot.real_live_coaches) : '—'} real, live Elevation coach{coachSnapshot?.real_live_coaches === 1 ? '' : 'es'}</strong> recruited to date
                {coachSnapshot && coachSnapshot.real_live_coaches === 0 && ' -- genuinely 0, not rounded up (see Outreach Hub for the breakdown).'}
              </p>
            </div>
          </div>
          {totalPipeline === 0 && (
            <EmptyNote style={{ marginTop: '12px' }}><Inbox size={12} /> Genuinely 0 inbound across all 8 tables today -- an honest pre-launch state, see Outreach Hub for the full breakdown.</EmptyNote>
          )}
        </Card>

        {/* ══ MARKETING ════════════════════════════════════════════════ */}
        <Card id="cd-marketing" style={{ marginBottom: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="From Marketing Hub" title="Deal engagement funnel"
            caption="Real, banned-excluded partner_deal_viewed/claimed counts -- the same get_marketing_engagement_funnel() call MarketingDashboardPage uses. Raw totals shown as honest context, never as the headline." />
          <StatStrip
            columns={4}
            style={{ opacity: loading ? 0.6 : 1 }}
            cells={[
              { key: 'real-views', label: 'Real deal views', value: fmt(funnel?.real_views), icon: Eye, accent: HUB_ACCENTS.marketing },
              { key: 'real-claims', label: 'Real deal claims', value: fmt(funnel?.real_claims), icon: MousePointerClick, accent: funnel?.real_claims > 0 ? GREEN : AMBER },
              { key: 'raw-views', label: 'Raw views (incl. banned)', value: fmt(funnel?.total_views), icon: Eye, accent: MUTED },
              { key: 'raw-claims', label: 'Raw claims (incl. banned)', value: fmt(funnel?.total_claims), icon: MousePointerClick, accent: MUTED },
            ]}
          />
        </Card>

        {/* ══ WHAT NEEDS A DECISION ═══════════════════════════════════════
            The one genuinely new query this page adds -- see
            get_co_director_pending_decisions() and this page's own header
            comment. */}
        <Card id="cd-decisions">
          <SectionTitle eyebrow="New -- across every hub" title="What needs a decision"
            caption="A real, live rollup of items explicitly flagged for leadership sign-off: Legal contracts needing a fix, open Finance money requests, Tech ideas escalated to the founder, overdue team tasks (any team), and outreach contacts stalled 14+ days with no response. Checked live before building this -- one leftover QA-script test row in Tech's idea inbox is deliberately excluded (it was Playwright test scratch data from an earlier phase, not a real decision), the same contamination diligence every Studio phase has applied to its own data." />
          {decisions.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px',
              background: tint(GREEN, 0.06), border: `1px solid ${tint(GREEN, 0.35)}`,
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} color={GREEN} />
              <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, margin: 0, lineHeight: 1.55 }}>
                <strong>Nothing pending.</strong> Every category above is genuinely caught up right now -- a real, honest "all clear", not an empty state hiding missing data.
              </p>
            </div>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table studio-table--top">
                <thead><tr><th>Hub</th><th>Item</th><th>Detail</th><th>Flagged</th></tr></thead>
                <tbody>
                  {decisions.map((d, i) => {
                    const meta = DECISION_CATEGORY_META[d.category] || { label: d.category, hub: 'co_director' }
                    return (
                      <tr key={`${d.category}-${i}`}>
                        <td><HubBadge hub={meta.hub} label={meta.label} /></td>
                        <td style={{ fontWeight: 600, minWidth: '200px', maxWidth: '220px', whiteSpace: 'normal' }}>{d.label}</td>
                        <td style={{ minWidth: '200px', maxWidth: '320px', whiteSpace: 'normal', color: GREY }}>{d.detail || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(d.flagged_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ CO-DIRECTOR PRIORITIES ═══════════════════════════════════
            Studio Phase 9 addition: the generic team_tasks board,
            team='co_director' -- Daniel's own cross-hub action items,
            parity with the Founder Dashboard's "Founder Priorities". */}
        <Card id="cd-priorities" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Co-Director Priorities"
            caption="Real, generic team_tasks rows for the Co-Director team (the same reusable TaskBoard component Legal/Tech/Outreach/Marketing/Handler/Founder use) -- Daniel's own cross-hub action items that don't belong to any one team. Seeded empty -- nothing below is a placeholder." />
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
            accentColor={HUB_ACCENTS.co_director}
            emptyLabel="No Co-Director priorities yet -- add the first real one above."
          />
        </Card>

        {/* ══ CROSS-HUB REQUESTS (COMPANY-WIDE) ═════════════════════════
            Studio Phase 11 -- every pending task_handoff/access_request,
            any team, not just ones directed at Co-Director. The
            studio_requests counterpart to "What needs a decision" above,
            via get_all_pending_studio_requests() -- reused by the Founder
            Dashboard the same way that rollup pattern already is. */}
        <Card id="cd-all-requests" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New -- across every hub" title="Cross-hub requests, company-wide"
            caption="Every pending task handoff or access request, any hub, not just ones sent to Co-Director -- a real-time view of who's asking whom for what across the whole Studio." />
          {allPendingRequests.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px',
              background: tint(GREEN, 0.06), border: `1px solid ${tint(GREEN, 0.35)}`,
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} color={GREEN} />
              <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, margin: 0, lineHeight: 1.55 }}>
                <strong>Nothing pending.</strong> No cross-hub request is waiting on anyone right now.
              </p>
            </div>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table studio-table--top">
                <thead><tr><th>From</th><th>To</th><th>Type</th><th>Detail</th><th>Sent</th></tr></thead>
                <tbody>
                  {allPendingRequests.map(r => (
                    <tr key={r.id}>
                      <td><HubBadge hub={r.requester_team} label={HUB_LABELS[r.requester_team] || r.requester_team} /></td>
                      <td><HubBadge hub={r.target_team} label={HUB_LABELS[r.target_team] || r.target_team} /></td>
                      <td style={{ textTransform: 'capitalize' }}>{r.request_type.replace('_', ' ')}</td>
                      <td style={{ minWidth: '200px', maxWidth: '320px', whiteSpace: 'normal', color: GREY }}>{r.related_task_title ? `${r.related_task_title} -- ` : ''}{r.message}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ REQUESTS (CO-DIRECTOR'S OWN) ═══════════════════════════════
            Studio Phase 11 -- hand a Co-Director priority to a specific
            hub, or receive/approve requests directed at Co-Director. */}
        <Card id="cd-requests" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Requests"
            caption="Hand a task to a different hub, or ask another hub's leads for access -- real studio_requests rows, both directions." />
          <RequestPanel
            team="co_director"
            requests={requests}
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={createRequest}
            onApprove={approveRequest}
            onDeny={denyRequest}
            accentColor={HUB_ACCENTS.co_director}
          />
        </Card>

      </StudioShell>
    </>
  )
}
