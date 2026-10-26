import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ShieldAlert, Server, Lightbulb, Inbox, CheckCircle2, XCircle,
  Bug, FlaskConical, Filter, Cpu, AlertCircle, Megaphone, Clock,
} from 'lucide-react'
import {
  StudioShell, StudioCard as Card, SectionTitle, EmptyNote, StatStrip, MetricBarChart, ComparisonWidget, StatusDot, TaskBoard, RequestPanel,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
  StudioField, STUDIO_INPUT, STUDIO_SELECT_SM, studioButton,
  PeriodToggle, DAY_WEEK_MONTH_YEAR, TrendLineChart, GlanceCard, MiniCalendar, ActivityHeatmap, getStatusColor,
} from '../../components/studio'
import {
  getTechAdvisorSnapshot, getTechEdgeFunctionSnapshot, getTechFunctionHealthRates,
  getTechGenerationUsageSummary, getTechIdeas, createTechIdea, setTechIdeaStatus,
  getTechIdeasTriagedComparison, getTechIdeasTriagedTrend, getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
  getIsTeamLead, listStudioRequests, createStudioRequest, approveStudioRequest, denyStudioRequest,
  getTaskDueDateDensity, getTeamActivityHeatmap,
} from '../../lib/studioMetrics'

// Tech Hub (Studio Phase 3) -- for Eman and Tayyab (leads, full access +
// review/triage authority over the idea inbox below), Praise (data analyst
// -- gets the exact same real read access as everyone else on this page,
// not a locked-down view), and Enoch (the only tester -- QA/Test Board
// section). Built on the Studio component library from Phases 1-2
// (StudioShell/MetricBarChart/ComparisonWidget/TaskBoard etc.), gated by the
// new 'tech' app_role the same way finance/legal/operations already are.
//
// Real data throughout, via supabase/migrations/20261022180000_tech_role_enum.sql
// and 20261022180100_tech_hub_schema.sql (+ a small follow-up comment fix):
//   - Health Overview: Supabase's own security + performance advisor
//     findings and the 23 real deployed Edge Functions. Both are
//     Management-API-only data this deployed web app cannot poll live with
//     its anon/authenticated project keys, so they are captured as a real,
//     timestamped SNAPSHOT (tech_advisor_snapshots / tech_edge_function_
//     snapshots, seeded with today's real counts) rather than faked as a
//     live poll -- see that migration's header for the full investigation.
//     Per-function invocation/error RATES are deliberately shown as tbd,
//     not fabricated -- query_logs held only 2 real log lines total at
//     build time, nowhere near enough volume for a meaningful rate.
//   - generation_usage: real, live-queried table (get_tech_generation_usage_
//     summary), genuinely 0 calls logged today -- the pipeline is wired
//     into every generate-*/review-* Edge Function's rate limiter, just
//     genuinely unused by any real generation so far (same "honest 0"
//     pattern as Legal's gdpr_requests).
//   - activity_events (partner_deal_viewed/claimed) was checked and is NOT
//     used here -- it is general partner/deal engagement analytics, not
//     crash/error-shaped; that belongs to a future Marketing/Growth hub.
//   - Idea Inbox: tech_ideas / tech_idea_status_log, new tables, same "RLS
//     enabled, zero direct policies, SECURITY DEFINER functions only"
//     pattern as Legal's legal_contracts/team_tasks. Submit is open to
//     anyone who can reach this page (tech/founder/admin); triage (status
//     change, notes, flagging brought_to_founder) is gated the same way
//     today -- see the TODO below and in the migration for the leads-only
//     (Eman/Tayyab) split this should become once real per-person staff
//     roles exist. Until then this is an honest team-wide gate, not a
//     silent no-op.
//   - QA/Test Board: the existing generic team_tasks table (Legal Hub,
//     Studio Phase 2) with team='tech' -- no new task table. Enoch's
//     testing work is tracked with the batch label "QA" (a convention, not
//     a schema constraint) so it can be filtered to just his work below.

const TEAM = 'tech'
const LINT_LEVEL_COLOR = { ERROR: RED, WARN: AMBER, INFO: MUTED }
const IDEA_STATUS_LABELS = {
  new: 'New', under_review: 'Under review', brought_to_founder: 'Brought to founder',
  actioned: 'Actioned', declined: 'Declined',
}
const IDEA_STATUS_DOT = {
  new: 'grey', under_review: 'yellow', brought_to_founder: 'yellow', actioned: 'green', declined: 'red',
}

// Captured via `npm run lint`, 2026-10-22 -- same command Legal Hub's own
// verification pass used as its baseline (14 warnings). Shown as a simple
// static stat, not a live poll -- running the build toolchain from a
// browser page is out of scope; re-capture this by hand after a real lint
// cleanup pass, same as any other point-in-time engineering metric here.
const LINT_BASELINE = { errors: 0, warnings: 14, capturedAt: '2026-10-22', command: 'npm run lint' }

const PAGE_STYLES = `
  .tc-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  @media (max-width: 1100px) { .tc-two-col { grid-template-columns: minmax(0, 1fr); } }
`

function fmt(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-IE') }
function fmtEuro(cents) {
  if (cents === null || cents === undefined) return '—'
  return `€${(cents / 100).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}


export default function TechDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [advisorFindings, setAdvisorFindings] = useState([])
  const [edgeFunctions, setEdgeFunctions] = useState([])
  const [functionHealth, setFunctionHealth] = useState(null)
  const [genUsage, setGenUsage] = useState({ call_count: 0, total_cost_cents: 0, by_function: [] })
  const [genRange, setGenRange] = useState('month')

  const [ideas, setIdeas] = useState([])
  const [comparisonWindow, setComparisonWindow] = useState('week')
  const [comparison, setComparison] = useState(null)
  const [triagedTrend, setTriagedTrend] = useState([])

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [qaOnly, setQaOnly] = useState(false)
  const [requests, setRequests] = useState([])
  const [isLead, setIsLead] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [advisorRes, edgeFnRes, healthRes, genRes, ideasRes, compareRes, trendRes, tasksRes, membersRes, requestsRes, leadRes] = await Promise.all([
        getTechAdvisorSnapshot(),
        getTechEdgeFunctionSnapshot(),
        getTechFunctionHealthRates(),
        getTechGenerationUsageSummary(genRange),
        getTechIdeas(),
        getTechIdeasTriagedComparison(comparisonWindow),
        getTechIdeasTriagedTrend(8),
        getTeamTasks(TEAM),
        getTeamRoster(TEAM),
        listStudioRequests(TEAM),
        getIsTeamLead(TEAM),
      ])
      setAdvisorFindings(advisorRes.value || [])
      setEdgeFunctions(edgeFnRes.value || [])
      setFunctionHealth(healthRes)
      setGenUsage(genRes.value || { call_count: 0, total_cost_cents: 0, by_function: [] })
      setIdeas(ideasRes.value || [])
      setComparison(compareRes.value || null)
      setTriagedTrend(trendRes.value || [])
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
      setRequests(requestsRes.value || [])
      setIsLead(!!leadRes.value)
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [genRange, comparisonWindow])

  useEffect(() => { load() }, [load])

  // ── Idea Inbox ───────────────────────────────────────────────────────────
  const [savingIdeaId, setSavingIdeaId] = useState(null)
  const [ideaForm, setIdeaForm] = useState({ title: '', description: '' })
  const [submittingIdea, setSubmittingIdea] = useState(false)

  async function submitIdea() {
    if (!ideaForm.title.trim()) return
    setSubmittingIdea(true)
    try {
      await createTechIdea(ideaForm.title.trim(), ideaForm.description.trim() || null)
      setIdeaForm({ title: '', description: '' })
      const r = await getTechIdeas()
      setIdeas(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not submit that idea.')
    } finally {
      setSubmittingIdea(false)
    }
  }

  async function changeIdeaStatus(id, status) {
    setSavingIdeaId(id)
    try {
      await setTechIdeaStatus(id, status)
      const r = await getTechIdeas()
      setIdeas(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that idea.')
    } finally {
      setSavingIdeaId(null)
    }
  }

  // ── QA / Test Board ──────────────────────────────────────────────────────
  async function addTask(fields) {
    try {
      await createTeamTask(TEAM, fields)
      const r = await getTeamTasks(TEAM)
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not create that task.')
    }
  }
  async function changeTaskStatus(id, status) {
    try {
      await setTeamTaskStatus(id, status)
      const r = await getTeamTasks(TEAM)
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that task.')
    }
  }
  const visibleTasks = useMemo(
    () => (qaOnly ? tasks.filter(t => (t.batch_label || '').trim().toLowerCase() === 'qa') : tasks),
    [tasks, qaOnly]
  )

  // ── Requests (Studio Phase 11 -- cross-hub task handoff / access requests) ──
  async function createRequest(fields) {
    try {
      await createStudioRequest(fields)
      const r = await listStudioRequests(TEAM)
      setRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not send that request.')
    }
  }
  async function approveRequest(id, note, assignTo) {
    try {
      await approveStudioRequest(id, note, assignTo)
      const [r, t] = await Promise.all([listStudioRequests(TEAM), getTeamTasks(TEAM)])
      setRequests(r.value || [])
      setTasks(t.value || [])
    } catch (err) {
      setError(err.message || 'Could not approve that request.')
    }
  }
  async function denyRequest(id, note) {
    try {
      await denyStudioRequest(id, note)
      const r = await listStudioRequests(TEAM)
      setRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not deny that request.')
    }
  }

  // ── Derived: advisor findings by severity ───────────────────────────────
  const severityTotals = useMemo(() => {
    const totals = { security: { ERROR: 0, WARN: 0, INFO: 0 }, performance: { ERROR: 0, WARN: 0, INFO: 0 } }
    for (const f of advisorFindings) {
      if (totals[f.category]) totals[f.category][f.level] = (totals[f.category][f.level] || 0) + f.finding_count
    }
    return totals
  }, [advisorFindings])
  const totalErrors = severityTotals.security.ERROR + severityTotals.performance.ERROR
  const totalFindings = advisorFindings.reduce((s, f) => s + f.finding_count, 0)
  const capturedAt = advisorFindings[0]?.captured_at || edgeFunctions[0]?.captured_at || null

  const edgeFnStatusCounts = useMemo(() => {
    const active = edgeFunctions.filter(f => f.status === 'ACTIVE').length
    const verified = edgeFunctions.filter(f => f.verify_jwt).length
    const publicNoJwt = edgeFunctions.filter(f => !f.verify_jwt).length
    return { active, verified, publicNoJwt, total: edgeFunctions.length }
  }, [edgeFunctions])

  const sections = [
    { id: 'tech-health', label: 'Health Overview' },
    { id: 'tech-ideas', label: 'Idea Inbox' },
    { id: 'tech-comparison', label: 'Comparison' },
    { id: 'tech-qa', label: 'QA / Test Board' },
    { id: 'tech-activity', label: 'Calendar & Activity' },
    { id: 'tech-requests', label: 'Requests' },
  ]

  // Studio Phase 13 -- memoized so MiniCalendar/ActivityHeatmap's own
  // effects (keyed on this function identity) fetch exactly once per
  // scope/mount, not on every TechDashboardPage render.
  const fetchDueDates = useCallback(scope => getTaskDueDateDensity(TEAM, scope), [])
  const fetchHeatmap = useCallback(d => getTeamActivityHeatmap(TEAM, d), [])

  const heroCharts = [
    {
      key: 'security-findings', eyebrow: 'Live Health', title: 'Security advisor findings',
      caption: `Real Supabase security-advisor counts by severity (captured ${capturedAt ? fmtDateTime(capturedAt) : '—'} -- a snapshot, not a live poll; see caption below).`,
      data: [
        { name: 'Error', value: severityTotals.security.ERROR, color: RED },
        { name: 'Warn', value: severityTotals.security.WARN, color: AMBER },
        { name: 'Info', value: severityTotals.security.INFO, color: MUTED },
      ],
    },
    {
      key: 'performance-findings', eyebrow: 'Live Health', title: 'Performance advisor findings',
      caption: 'Real Supabase performance-advisor counts by severity, same snapshot as above.',
      data: [
        { name: 'Error', value: severityTotals.performance.ERROR, color: RED },
        { name: 'Warn', value: severityTotals.performance.WARN, color: AMBER },
        { name: 'Info', value: severityTotals.performance.INFO, color: MUTED },
      ],
    },
    {
      key: 'edge-functions', eyebrow: 'Infrastructure', title: 'Edge Functions',
      caption: `${fmt(edgeFnStatusCounts.total)} real deployed functions, same snapshot.`,
      data: [
        { name: 'Active', value: edgeFnStatusCounts.active, color: GREEN },
        { name: 'JWT-verified', value: edgeFnStatusCounts.verified, color: NAVY },
        { name: 'Public (no JWT)', value: edgeFnStatusCounts.publicNoJwt, color: AMBER },
      ],
    },
    {
      key: 'generation-usage', eyebrow: 'AI generation', title: 'Generation calls by function',
      caption: genUsage.call_count === 0
        ? "Genuinely 0 real AI-generation calls logged this range -- the pipeline (generation_usage) is wired into every generate-*/review-* function's rate limiter, just unused by any real call so far. Not a broken chart."
        : `${fmt(genUsage.call_count)} real calls, ${fmtEuro(genUsage.total_cost_cents)} estimated cost this range (excludes banned demo/QA accounts).`,
      data: (genUsage.by_function || []).map(f => ({ name: f.function_name, value: f.calls, color: HUB_ACCENTS.tech })),
      emptyLabel: 'No AI-generation calls logged yet this range.',
    },
    {
      key: 'findings-mix', eyebrow: 'Live Health', title: 'Advisor findings mix',
      caption: 'The same real snapshot as the two charts above, combined across security + performance into one proportional mix.',
      type: 'donut',
      data: [
        { name: 'Error', value: totalErrors, color: getStatusColor('red') },
        { name: 'Warn', value: severityTotals.security.WARN + severityTotals.performance.WARN, color: getStatusColor('yellow') },
        { name: 'Info', value: severityTotals.security.INFO + severityTotals.performance.INFO, color: getStatusColor('grey') },
      ],
      emptyLabel: 'No advisor snapshot captured yet.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Tech Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        heroChartsLoading={loading}
        hubKey="tech"
        title="Tech Hub"
        subtitle="Live platform health (Supabase advisors, Edge Functions, AI-generation usage), an idea inbox, and the QA/test board. Real data, excluding banned demo/QA accounts. Read access is team-wide (Praise included) -- triage/approve is leads-only, see the Idea Inbox note below."
        accentColor={HUB_ACCENTS.tech}
        heroCharts={heroCharts}
        sections={sections}
        rangeControl={<PeriodToggle options={DAY_WEEK_MONTH_YEAR} value={genRange} onChange={setGenRange} ariaLabel="Generation usage range" />}
        glanceCard={(
          <GlanceCard
            accentColor={HUB_ACCENTS.tech}
            loading={loading}
            items={[
              { key: 'errors', label: 'ERROR-level findings', value: fmt(totalErrors), health: totalErrors > 0 ? 'critical' : 'good' },
              { key: 'functions', label: 'Edge Functions deployed', value: fmt(edgeFnStatusCounts.total) },
              { key: 'ideas-open', label: 'Ideas awaiting triage', value: fmt(ideas.filter(i => i.status === 'new' || i.status === 'under_review').length), health: ideas.some(i => i.status === 'brought_to_founder') ? 'warning' : 'neutral' },
            ]}
          />
        )}
        error={!!error && (
          <Card style={{ marginBottom: 'var(--studio-gap)', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ HEALTH OVERVIEW ══════════════════════════════════════════ */}
        <div id="tech-health" >
          <Card style={{ marginBottom: 'var(--studio-gap)' }}>
            <SectionTitle eyebrow="Snapshot" title="Health at a glance"
              caption={`Captured ${capturedAt ? fmtDateTime(capturedAt) : '—'} via Supabase's security + performance advisors and its deployed Edge Function list -- both are Management-API-only checks this web app cannot poll live with its anon/authenticated keys, so this is a real, timestamped snapshot rather than a live-refreshing page. Refreshing it today means re-running the advisor check and inserting a new batch (manual) -- an automated refresh is real future work, not built here.`} />
            <StatStrip
              columns={4}
              cells={[
                { key: 'errors', label: 'ERROR-level findings', value: fmt(totalErrors), icon: ShieldAlert, accent: totalErrors > 0 ? RED : GREEN },
                { key: 'findings', label: 'Total advisor findings', value: fmt(totalFindings), icon: AlertCircle, accent: AMBER },
                { key: 'functions', label: 'Deployed Edge Functions', value: fmt(edgeFnStatusCounts.total), icon: Server, accent: NAVY },
                { key: 'lint', label: `Lint warnings (${LINT_BASELINE.command}, ${LINT_BASELINE.capturedAt})`, value: fmt(LINT_BASELINE.warnings), icon: Bug, accent: LINT_BASELINE.errors > 0 ? RED : AMBER },
              ]}
            />
          </Card>

          <div className="tc-two-col" style={{ marginBottom: 'var(--studio-gap)' }}>
            <Card>
              <SectionTitle eyebrow="Drill-down" title="Advisor findings by check"
                caption="Every real lint type Supabase's advisors currently report, with its severity and count -- not just the two hero totals above." />
              {advisorFindings.length === 0 ? (
                <EmptyNote><ShieldAlert size={12} /> No advisor snapshot captured yet.</EmptyNote>
              ) : (
                <div className="studio-table-wrap">
                  <table className="studio-table">
                    <thead><tr><th>Category</th><th>Check</th><th>Level</th><th>Count</th></tr></thead>
                    <tbody>
                      {advisorFindings.map(f => (
                        <tr key={`${f.category}-${f.lint_name}`}>
                          <td style={{ textTransform: 'capitalize' }}>{f.category}</td>
                          <td>
                            {f.remediation_url ? (
                              <a href={f.remediation_url} target="_blank" rel="noreferrer" style={{ color: NAVY, textDecoration: 'underline' }}>{f.title}</a>
                            ) : f.title}
                          </td>
                          <td><StatusDot status={f.level === 'ERROR' ? 'red' : f.level === 'WARN' ? 'yellow' : 'grey'} label={f.level} showLabel /></td>
                          <td style={{ fontWeight: 600 }}>{fmt(f.finding_count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle eyebrow="Drill-down" title="Deployed Edge Functions"
                caption="Every real function from this project's deployment, same snapshot as the hero chart above." />
              {edgeFunctions.length === 0 ? (
                <EmptyNote><Server size={12} /> No function snapshot captured yet.</EmptyNote>
              ) : (
                <div className="studio-table-wrap" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table className="studio-table">
                    <thead><tr><th>Function</th><th>Status</th><th>Version</th><th>JWT</th></tr></thead>
                    <tbody>
                      {edgeFunctions.map(f => (
                        <tr key={f.slug}>
                          <td style={{ fontWeight: 600 }}>{f.slug}</td>
                          <td><StatusDot status={f.status === 'ACTIVE' ? 'green' : 'grey'} label={f.status} showLabel /></td>
                          <td>v{f.version}</td>
                          <td>{f.verify_jwt ? 'Verified' : 'Public'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, lineHeight: 1.5, margin: '12px 0 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Cpu size={12} style={{ flexShrink: 0, marginTop: '2px' }} /> Per-function invocation/error rate: {functionHealth && !functionHealth.trackable ? `TBD -- ${functionHealth.reason}` : 'loading…'}
              </p>
            </Card>
          </div>
        </div>

        {/* ══ IDEA INBOX ═══════════════════════════════════════════════ */}
        <Card id="tech-ideas" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Idea Inbox"
            caption="Anyone on the Tech team can submit an idea below. Eman/Tayyab triage it (mark under review, action, decline, or flag Brought to founder to escalate to Desmond)." />
          {/* RESOLVED (Studio Phase 11, was TODO(phase-2-access-system)):
              triage is now gated server-side to a real tech LEAD (is_lead
              on user_roles, i.e. Eman/Tayyab once real) or founder/admin/
              co_director -- set_tech_idea_status() enforces this itself, and
              the dropdown below mirrors it client-side (read-only status
              badge for a non-lead viewer like Praise/Enoch, who still see
              everything, just cannot change it). */}
          <div className="studio-form-panel">
            <div className="studio-form-row" style={{ gridTemplateColumns: '1.4fr 2fr auto' }}>
              <StudioField label="Title">
                <input type="text" value={ideaForm.title} onChange={e => setIdeaForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What's the idea..." style={STUDIO_INPUT} />
              </StudioField>
              <StudioField label="Description">
                <input type="text" value={ideaForm.description} onChange={e => setIdeaForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional detail..." style={STUDIO_INPUT} />
              </StudioField>
              <button
                type="button" disabled={submittingIdea || !ideaForm.title.trim()} onClick={submitIdea}
                className="studio-form-wide"
                style={studioButton(HUB_ACCENTS.tech, !!ideaForm.title.trim())}
              >
                <Lightbulb size={14} /> Submit idea
              </button>
            </div>
          </div>

          {ideas.length === 0 ? (
            <EmptyNote><Inbox size={12} /> No ideas submitted yet -- add the first real one above.</EmptyNote>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table">
                <thead><tr><th>Idea</th><th>Submitted by</th><th>Status</th><th>Notes</th><th>Submitted</th></tr></thead>
                <tbody>
                  {ideas.map(idea => (
                    <tr key={idea.id}>
                      <td style={{ minWidth: '200px', maxWidth: '260px', whiteSpace: 'normal' }}>
                        <span style={{ fontWeight: 600 }}>{idea.title}</span>
                        {idea.description && <div style={{ color: GREY, fontSize: '12.5px', marginTop: '3px', lineHeight: 1.5 }}>{idea.description}</div>}
                      </td>
                      <td>{idea.submitted_by_label}</td>
                      <td>
                        {isLead ? (
                          <select
                            value={idea.status}
                            disabled={savingIdeaId === idea.id}
                            onChange={e => changeIdeaStatus(idea.id, e.target.value)}
                            style={STUDIO_SELECT_SM}
                          >
                            {Object.keys(IDEA_STATUS_LABELS).map(s => <option key={s} value={s}>{IDEA_STATUS_LABELS[s]}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY }}>{IDEA_STATUS_LABELS[idea.status]}</span>
                        )}
                        <span style={{ marginLeft: '10px', display: 'inline-flex', verticalAlign: 'middle' }}><StatusDot status={IDEA_STATUS_DOT[idea.status]} /></span>
                        {idea.status === 'brought_to_founder' && (
                          <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700, color: AMBER }}>
                            <Megaphone size={11} /> Desmond
                          </span>
                        )}
                      </td>
                      <td style={{ minWidth: '200px', maxWidth: '240px', whiteSpace: 'normal', color: idea.reviewer_notes ? GREY : MUTED }}>{idea.reviewer_notes || '—'}</td>
                      <td>{fmtDateTime(idea.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ COMPARISON ═══════════════════════════════════════════════ */}
        <div id="tech-comparison" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Progress" title="What You've Got vs What You're Missing"
            caption="Real ideas triaged (moved out of New) this window vs the window before it, from tech_idea_status_log -- an append-only history, not a guess. Like Legal's contracts-resolved comparison, this is a single hub-wide total, not a cohort of comparable people -- there is no real 'top performer' or 'category floor' to rank an idea-inbox total against, so top/lowest are left honestly blank rather than fabricated; only the self-vs-last-period row below is real." />
          <ComparisonWidget
            entityLabel="Ideas triaged"
            value={comparison?.triaged_this_period ?? null}
            topValue={null}
            lowestValue={null}
            lastPeriodValue={comparison?.triaged_last_period ?? null}
            unit="ideas"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.tech}
            loading={loading}
            emptyNote={comparison && comparison.triaged_this_period === 0 && comparison.triaged_last_period === 0
              ? 'No ideas have moved out of New yet this window or last -- honest 0s, this will fill in as Eman/Tayyab start triaging.'
              : null}
          />
          <Card style={{ marginTop: '16px' }}>
            <SectionTitle eyebrow="Studio Phase 13" title="Ideas triaged, weekly trend"
              caption="The same real tech_idea_status_log feed as above, now bucketed by calendar week instead of collapsed to one this-period/last-period pair." />
            <TrendLineChart
              data={triagedTrend.map(w => ({ x: w.week_label, y: w.triaged_count }))}
              accentColor={HUB_ACCENTS.tech}
              emptyLabel="Not enough real triage activity yet to show a weekly trend -- this will fill in as Eman/Tayyab triage more ideas."
              loading={loading}
              exportFilename="tech-ideas-triaged-trend"
            />
          </Card>
        </div>

        {/* ══ QA / TEST BOARD ══════════════════════════════════════════ */}
        <Card id="tech-qa" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="For Enoch" title="QA / Test Board"
            caption={'Real, generic team_tasks rows for the Tech team (the same reusable TaskBoard component Legal Hub uses). Use the batch label "QA" for Enoch\'s test-tracking work so it can be filtered to just his tasks below -- a convention, not a database constraint, so the board still works for any other tech task/target too.'}
            action={(
              <button
                type="button"
                onClick={() => setQaOnly(v => !v)}
                style={{
                  fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 700, padding: '0 14px', height: '32px', borderRadius: '999px',
                  border: `1px solid ${qaOnly ? HUB_ACCENTS.tech : 'rgba(30,58,95,0.15)'}`,
                  background: qaOnly ? HUB_ACCENTS.tech : '#fff', color: qaOnly ? '#fff' : GREY,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                }}
              >
                <Filter size={12} /> {qaOnly ? 'Showing QA only' : 'Show QA only'}
              </button>
            )}
          />
          {qaOnly && visibleTasks.length === 0 && tasks.length > 0 && (
            <EmptyNote style={{ marginBottom: '12px' }}><FlaskConical size={12} /> No tasks labelled "QA" yet -- use the Batch field below when adding one for Enoch's testing work.</EmptyNote>
          )}
          <TaskBoard
            tasks={visibleTasks}
            members={members}
            loading={loading}
            onCreate={addTask}
            onStatusChange={changeTaskStatus}
            accentColor={HUB_ACCENTS.tech}
            emptyLabel="No tasks yet -- add the first real one above (use Batch 'QA' for Enoch's testing work)."
          />
        </Card>

        {/* ══ CALENDAR & ACTIVITY ══════════════════════════════════════
            Studio Phase 13 -- real team_tasks.target_date due-date density
            (scope: mine / this hub / UBP-wide) and a real contribution-
            style activity heatmap off tech_idea_status_log + team_tasks. */}
        <div id="tech-activity" className="tc-two-col" style={{ marginTop: 'var(--studio-gap)' }}>
          <Card>
            <SectionTitle eyebrow="New" title="Due-date calendar"
              caption="Real team_tasks.target_date rows for the Tech team. 'UBP-wide' covers every hub's tasks -- founder/co_director/admin only; anyone else who taps it simply gets a real, honest 'not authorized' message, not a fake empty calendar." />
            <MiniCalendar team={TEAM} accentColor={HUB_ACCENTS.tech} canViewAll onFetchScope={fetchDueDates} />
          </Card>
          <Card>
            <SectionTitle eyebrow="New" title="Activity heatmap"
              caption="Real per-day event density for the Tech team over the last ~26 weeks -- tech_idea_status_log triage activity plus team_tasks created/closed activity. Most hubs are pre-launch, so most squares are honestly empty." />
            <ActivityHeatmap team={TEAM} accentColor={HUB_ACCENTS.tech} onFetch={fetchHeatmap} exportFilename="tech-activity-heatmap" />
          </Card>
        </div>

        {/* ══ REQUESTS ═══════════════════════════════════════════════════
            Studio Phase 11 -- cross-hub task handoff / access requests. */}
        <Card id="tech-requests" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Requests"
            caption="Hand a task to a different hub, or ask another hub's leads for access -- real studio_requests rows, both directions. Approving a task handoff actually moves it to that hub's own board." />
          <RequestPanel
            team={TEAM}
            requests={requests}
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={createRequest}
            onApprove={approveRequest}
            onDeny={denyRequest}
            accentColor={HUB_ACCENTS.tech}
          />
        </Card>

      </StudioShell>
    </>
  )
}
