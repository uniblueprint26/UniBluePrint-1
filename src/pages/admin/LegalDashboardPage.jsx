import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  FileText, ShieldCheck, FolderOpen, AlertCircle,
  AlertTriangle, CheckCircle2, Users, Inbox, Mail,
} from 'lucide-react'
import {
  StudioShell, StudioCard as Card, SectionTitle, EmptyNote, StatStrip, MetricBarChart, ComparisonWidget, StatusDot, TaskBoard,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
  SURFACE_TINT, BORDER, STUDIO_SELECT_SM,
} from '../../components/studio'
import {
  getLegalContracts, setLegalContractStatus, getLegalContractsResolvedComparison,
  getLegalGdprRequests, getLegalAcknowledgementCoverage,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
} from '../../lib/studioMetrics'

// Legal Hub (Studio Phase 2) -- for Rachel and Basmail, built on the same
// StudioShell/MetricBarChart/ComparisonWidget pattern FinanceDashboardPage
// pioneered in Phase 1. Real data throughout, sourced from
// supabase/migrations/20261022174125_legal_hub_schema.sql:
//   - legal_contracts / legal_contract_status_log -- the new contracts
//     register (seeded only with what is genuinely known -- see that
//     migration's header comment for the Made By Kelan / Poiema Dexigns
//     judgment call, flagged in the handback report).
//   - gdpr_requests / legal_acknowledgements -- existing tables, both
//     genuinely empty today (checked live before this page was built), not
//     padded with anything to make the page look busier than it is.
//   - team_tasks -- the generic cross-hub "targets, batches, delegated
//     tasks" table the founder asked for, via the reusable TaskBoard Studio
//     component (src/components/studio/TaskBoard.jsx) -- Tech/Outreach/
//     Marketing etc. reuse the exact same table/component later, not a
//     Legal-only one-off.
//
// "Individual folders" (the founder's brief) is rendered below as a grouped
// VIEW of team_tasks by assigned_to, not a new file-storage feature -- real
// per-person document/file storage is explicitly out of scope for this
// pass; see the comment on that section further down.

const TEAM = 'legal'

const CONTRACT_STATUS_LABELS = {
  not_sent: 'Not sent', sent: 'Sent', signed: 'Signed', needs_fix: 'Needs fix', expired: 'Expired',
}
const CONTRACT_STATUS_DOT = {
  not_sent: 'grey', sent: 'yellow', signed: 'green', needs_fix: 'red', expired: 'red',
}
const GDPR_TYPE_LABELS = { export: 'Export', deletion: 'Deletion', correction: 'Correction', restriction: 'Restriction' }
const DOC_TYPE_LABELS = { terms_of_service: 'Terms of Service', privacy_policy: 'Privacy Policy' }

const PAGE_STYLES = `
  .lg-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  .lg-folders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  @media (max-width: 1100px) { .lg-two-col { grid-template-columns: minmax(0, 1fr); } }
`

function fmt(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-IE') }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }


export default function LegalDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [contracts, setContracts] = useState([])
  const [gdprRequests, setGdprRequests] = useState([])
  const [ackCoverage, setAckCoverage] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])

  const [comparisonWindow, setComparisonWindow] = useState('week')
  const [comparison, setComparison] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [contractsRes, gdprRes, ackRes, tasksRes, membersRes, compareRes] = await Promise.all([
        getLegalContracts(),
        getLegalGdprRequests(),
        getLegalAcknowledgementCoverage(),
        getTeamTasks(TEAM),
        getTeamRoster(TEAM),
        getLegalContractsResolvedComparison(comparisonWindow),
      ])
      setContracts(contractsRes.value || [])
      setGdprRequests(gdprRes.value || [])
      setAckCoverage(ackRes.value || [])
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
      setComparison(compareRes.value || null)
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [comparisonWindow])

  useEffect(() => { load() }, [load])

  // ── Contracts register: status change ──────────────────────────────────
  const [savingContractId, setSavingContractId] = useState(null)
  async function changeContractStatus(id, status) {
    setSavingContractId(id)
    try {
      await setLegalContractStatus(id, status)
      const r = await getLegalContracts()
      setContracts(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that contract.')
    } finally {
      setSavingContractId(null)
    }
  }

  // ── Tasks & Batches ─────────────────────────────────────────────────────
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

  // ── Derived counts ───────────────────────────────────────────────────────
  const contractsByStatus = useMemo(() => {
    const counts = { not_sent: 0, sent: 0, signed: 0, needs_fix: 0, expired: 0 }
    for (const c of contracts) counts[c.status] = (counts[c.status] || 0) + 1
    return counts
  }, [contracts])

  const gdprOpenCount = gdprRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length
  const gdprOverdueCount = gdprRequests.filter(r => r.is_overdue).length
  const gdprCompletedCount = gdprRequests.filter(r => r.status === 'completed').length
  const gdprRejectedCount = gdprRequests.filter(r => r.status === 'rejected').length

  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  const folders = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      const key = t.assigned_to || 'unassigned'
      const label = t.assigned_to ? (t.assignee_name || 'Team member') : 'Unassigned'
      if (!map.has(key)) map.set(key, { label, tasks: [] })
      map.get(key).tasks.push(t)
    }
    return [...map.values()].sort((a, b) => (a.label === 'Unassigned' ? 1 : 0) - (b.label === 'Unassigned' ? 1 : 0))
  }, [tasks])

  const sections = [
    { id: 'lg-contracts', label: 'Contracts Register' },
    { id: 'lg-compliance', label: 'Compliance' },
    { id: 'lg-comparison', label: 'Comparison' },
    { id: 'lg-tasks', label: 'Tasks & Batches' },
    { id: 'lg-folders', label: 'Individual Folders' },
  ]

  const heroCharts = [
    {
      key: 'contracts-status', eyebrow: 'Contracts', title: 'Register by status',
      caption: '27 real partners tracked. Every status below reflects real paperwork, not an estimate.',
      data: [
        { name: 'Not sent', value: contractsByStatus.not_sent, color: MUTED },
        { name: 'Sent', value: contractsByStatus.sent, color: AMBER },
        { name: 'Signed', value: contractsByStatus.signed, color: GREEN },
        { name: 'Needs fix', value: contractsByStatus.needs_fix, color: RED },
        { name: 'Expired', value: contractsByStatus.expired, color: RED },
      ],
    },
    {
      key: 'gdpr-status', eyebrow: 'Compliance', title: 'GDPR requests',
      caption: gdprRequests.length === 0 ? 'Genuinely 0 requests on file today -- not filtered down from something larger.' : 'Real gdpr_requests rows, by status.',
      data: [
        { name: 'Open', value: gdprOpenCount, color: AMBER },
        { name: 'Overdue', value: gdprOverdueCount, color: RED },
        { name: 'Completed', value: gdprCompletedCount, color: GREEN },
        { name: 'Rejected', value: gdprRejectedCount, color: MUTED },
      ],
      emptyLabel: 'No GDPR requests on file.',
    },
    {
      key: 'ack-coverage', eyebrow: 'Compliance', title: 'Acknowledgement coverage',
      caption: 'Real % of active (non-banned) users who have acknowledged the latest version of each document.',
      data: ackCoverage.map(a => ({
        name: DOC_TYPE_LABELS[a.document_type] || a.document_type,
        value: a.coverage_pct ?? 0,
      })),
      valueFormatter: v => `${v}%`,
      emptyLabel: 'No acknowledgement data yet.',
    },
    {
      key: 'tasks-status', eyebrow: 'Tasks', title: 'Legal tasks by status',
      caption: tasks.length === 0 ? 'No tasks created yet -- see Tasks & Batches below to add the first one.' : 'Real team_tasks rows for the Legal team.',
      data: [
        { name: 'To do', value: tasksByStatus.todo, color: MUTED },
        { name: 'In progress', value: tasksByStatus.in_progress, color: AMBER },
        { name: 'Done', value: tasksByStatus.done, color: GREEN },
      ],
      emptyLabel: 'No tasks yet.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Legal Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        hubKey="legal"
        title="Legal Hub"
        subtitle="Contracts register, GDPR & acknowledgement compliance, and team tasks/batches. Real data, excluding banned demo/QA accounts."
        accentColor={HUB_ACCENTS.legal}
        heroCharts={heroCharts}
        sections={sections}
        error={!!error && (
          <Card style={{ marginBottom: 'var(--studio-gap)', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ CONTRACTS REGISTER ═══════════════════════════════════════ */}
        <Card id="lg-contracts">
          <SectionTitle eyebrow="Contracts Register" title="Partner & coach contracts"
            caption="Real rows from legal_contracts. Seeded honestly: every partner starts at Not sent unless a real status was actually known -- see the row(s) flagged Needs fix/Sent below for why. No coach rows exist yet -- there is currently no real, non-demo coach account to track a contract against (checked live: coach_profiles has only seed/placeholder listings or banned demo accounts)." />
          {contracts.length === 0 ? (
            <EmptyNote><FileText size={12} /> No contracts tracked yet.</EmptyNote>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table">
                <thead>
                  <tr><th>Entity</th><th>Type</th><th>Contract</th><th>Status</th><th>Notes</th><th>Last checked</th></tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.display_name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{c.entity_type}</td>
                      <td>{c.contract_name}</td>
                      <td>
                        <select
                          value={c.status}
                          disabled={savingContractId === c.id}
                          onChange={e => changeContractStatus(c.id, e.target.value)}
                          style={STUDIO_SELECT_SM}
                        >
                          {Object.keys(CONTRACT_STATUS_LABELS).map(s => <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>)}
                        </select>
                        <span style={{ marginLeft: '10px', display: 'inline-flex', verticalAlign: 'middle' }}><StatusDot status={CONTRACT_STATUS_DOT[c.status]} /></span>
                      </td>
                      <td style={{ minWidth: '200px', maxWidth: '320px', whiteSpace: 'normal', color: c.notes ? GREY : MUTED }}>{c.notes || '—'}</td>
                      <td>{c.last_checked_by_label || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ COMPLIANCE ═══════════════════════════════════════════════ */}
        <div id="lg-compliance" style={{ marginTop: 'var(--studio-gap)' }}>
          <Card style={{ marginBottom: 'var(--studio-gap)' }}>
            <SectionTitle eyebrow="Compliance" title="GDPR request queue"
              caption="Every real gdpr_requests row, with a computed overdue flag (open status + past the 30-day statutory due_at)." />
            <StatStrip
              columns={4}
              cells={[
                { key: 'open', label: 'Open requests', value: fmt(gdprOpenCount), icon: Inbox, accent: AMBER },
                { key: 'overdue', label: 'Overdue', value: fmt(gdprOverdueCount), icon: AlertTriangle, accent: gdprOverdueCount > 0 ? RED : GREEN },
                { key: 'completed', label: 'Completed', value: fmt(gdprCompletedCount), icon: CheckCircle2, accent: GREEN },
                { key: 'rejected', label: 'Rejected', value: fmt(gdprRejectedCount), icon: AlertCircle, accent: MUTED },
              ]}
              style={{ marginBottom: '16px' }}
            />
            {gdprRequests.length === 0 ? (
              <EmptyNote><ShieldCheck size={12} color={GREEN} /> No GDPR requests on file -- genuinely 0, not filtered down from something larger.</EmptyNote>
            ) : (
              <div className="studio-table-wrap">
                <table className="studio-table">
                  <thead><tr><th>Type</th><th>Status</th><th>Requested</th><th>Due</th><th>Requester</th></tr></thead>
                  <tbody>
                    {gdprRequests.map(r => (
                      <tr key={r.id}>
                        <td>{GDPR_TYPE_LABELS[r.request_type] || r.request_type}</td>
                        <td>
                          <StatusDot
                            status={r.is_overdue ? 'red' : r.status === 'completed' ? 'green' : r.status === 'rejected' ? 'grey' : 'yellow'}
                            label={r.is_overdue ? 'Overdue' : r.status} showLabel
                          />
                        </td>
                        <td>{fmtDate(r.requested_at)}</td>
                        <td>{fmtDate(r.due_at)}</td>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color={GREY} /> {r.requester_label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle eyebrow="Compliance" title="Terms & Privacy acknowledgement coverage"
              caption="Real coverage against legal_acknowledgements, as a % of active (non-banned) users. Both document types are tracked here even while the table is empty, so this honestly shows 0% rather than hiding the metric." />
            <div className="lg-two-col">
              {ackCoverage.map(a => (
                <div key={a.document_type} style={{ background: SURFACE_TINT, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, color: GREY, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {DOC_TYPE_LABELS[a.document_type] || a.document_type}
                  </p>
                  <p style={{ fontFamily: FONT_SERIF, fontSize: '30px', lineHeight: 1.1, color: a.coverage_pct > 0 ? NAVY : GREY, margin: '8px 0 6px' }}>
                    {a.coverage_pct != null ? `${a.coverage_pct}%` : '—'}
                  </p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: 0, lineHeight: 1.5 }}>
                    {fmt(a.acknowledged_count)} of {fmt(a.active_user_count)} active users
                    {a.latest_version ? ` · latest version ${a.latest_version}` : ' · no version recorded yet'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══ COMPARISON ═══════════════════════════════════════════════ */}
        <div id="lg-comparison" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Progress" title="What You've Got vs What You're Missing"
            caption="Real contracts resolved (moved to Signed) this window vs the window before it, from legal_contract_status_log -- an append-only history, not a guess. Unlike Finance's per-coach comparison, this is a single hub-wide total, not a cohort of comparable people -- there is no real 'top performer' or 'category floor' to rank against, so only the self-vs-last-period row below is a real comparison; top/lowest are left honestly blank rather than fabricated from this one number." />
          <ComparisonWidget
            entityLabel="Contracts resolved"
            value={comparison?.resolved_this_period ?? null}
            topValue={null}
            lowestValue={null}
            lastPeriodValue={comparison?.resolved_last_period ?? null}
            unit="contracts"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.legal}
            loading={loading}
            emptyNote={comparison && comparison.resolved_this_period === 0 && comparison.resolved_last_period === 0
              ? 'No contracts have moved to Signed yet this window or last -- honest 0s, this will fill in as real paperwork closes out.'
              : null}
          />
        </div>

        {/* ══ TASKS & BATCHES ══════════════════════════════════════════ */}
        <Card id="lg-tasks" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Tasks & Batches"
            caption="Real, generic team_tasks rows for the Legal team -- targets, batches, and delegated work Rachel/Basmail assign to each other. The same table/component (TaskBoard) is reusable by any future hub (Tech/Outreach/Marketing). Seeded empty on purpose -- nothing below is a placeholder." />
          <TaskBoard
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={addTask}
            onStatusChange={changeTaskStatus}
            accentColor={HUB_ACCENTS.legal}
            emptyLabel="No tasks yet -- add the first real one above."
          />
        </Card>

        {/* ══ INDIVIDUAL FOLDERS ══════════════════════════════════════════
            Minimal, real grouping of the same team_tasks rows by assignee
            -- NOT a file-storage feature. Real per-person document/file
            storage (the fuller "folder" the founder's brief gestures at)
            is explicitly out of scope for this pass; this is the honest,
            minimal version: "what does each person on the team currently
            have on their plate", not a place to upload files yet. */}
        <Card id="lg-folders" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Team" title="Individual folders"
            caption="Legal team tasks grouped by assignee -- a view of the same real team_tasks data above, not a separate store. Real per-person file/document storage is a future phase (noted in code, not built here)." />
          {folders.length === 0 ? (
            <EmptyNote><FolderOpen size={12} /> No tasks assigned to anyone yet.</EmptyNote>
          ) : (
            <div className="lg-folders-grid">
              {folders.map(f => (
                <div key={f.label} style={{ background: SURFACE_TINT, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFFFFF', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={13} color={HUB_ACCENTS.legal} />
                    </div>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '13px', fontWeight: 700, color: NAVY }}>{f.label}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY }}>({f.tasks.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {f.tasks.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: NAVY, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                        <StatusDot status={t.status === 'done' ? 'green' : t.status === 'in_progress' ? 'yellow' : 'grey'} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </StudioShell>
    </>
  )
}
