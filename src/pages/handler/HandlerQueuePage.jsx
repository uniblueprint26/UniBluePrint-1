import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Loader2, ArrowLeft, Clock, Zap, Check, Flag, AlertTriangle, ShieldAlert,
  Bell, UserCog, XCircle, MessageCircle, Inbox, CheckCircle2, TrendingUp,
  HeartHandshake, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import {
  fetchUnclaimedQueue, fetchMyActiveAssignments, fetchSubmissionDetail,
  claimSubmission, startReview, deliverSubmission,
  submitHandlerDecision, recordClaimAttempt,
  hasTwoSentences,
  fetchPremiumQueue, fetchStandardQueue, fetchOperationsQueue, listActiveHandlers,
  reassignSubmission, cancelSubmission, contactStudent,
  fetchHandlerNotifications, markNotificationRead, fetchJobSearchHandlerGuide,
} from '../../lib/handlerQueue'
import {
  getHandlerQueueSnapshot, getHandlerTicketsByWeek, getHandlerTicketsResolvedComparison,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
} from '../../lib/studioMetrics'
import {
  StudioShell, StatStrip, ComparisonWidget, TaskBoard,
  NAVY, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
} from '../../components/studio'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { FormCard, ErrorBanner } from '../../components/ui/Form'
import JobSearchHandlerGuide from '../../components/handler/JobSearchHandlerGuide'
import QualityScorecard, { DIMENSIONS } from '../../components/handler/QualityScorecard'

// Campus Handler Hub (Studio Phase 7) -- /handler/queue, rebuilt onto the
// shared Studio design system (StudioShell/StatStrip/ComparisonWidget/
// TaskBoard/QuoteBanner -- see src/components/studio/). This is a redesign,
// not a feature rewrite: every real action a Handler takes (claim a
// submission, review it, score it, approve/flag/mark-incomplete; Operations
// reassign/deliver/contact/cancel) is the exact same src/lib/handlerQueue.js
// pipeline as before, untouched. What changes is the shell around it --
// Overview/Queue/Performance/Team Tasks sections, real headline metrics via
// the 3 new RPCs in supabase/migrations/20261023180000_handler_hub_schema.sql
// (src/lib/studioMetrics.js's getHandlerQueueSnapshot/getHandlerTicketsByWeek/
// getHandlerTicketsResolvedComparison), and the generic team_tasks board
// (team='handler') for shift-coordination/handoff work that sits outside the
// formal per-ticket pipeline.
//
// Genuinely all-zero today -- submissions/handler_queue/handler_escalations
// hold 0 rows (checked live via Supabase MCP, 2026-10-23), a real pre-launch
// pipeline, the same honest state Outreach Hub's inbound pipeline found --
// not a broken query. Every metric excludes the banned demo/QA accounts the
// same way every other Studio hub does.
//
// The ticket-review workflow itself (claim -> scorecard -> decision,
// Operations' reassign/deliver/contact/cancel) keeps its own specialized,
// master-detail UI (SubmissionDetail below) rather than being forced into
// TaskBoard's generic create/status shape -- a ticket's real lifecycle
// (claim, start review, score 5 quality dimensions, a 2-sentence-minimum
// note, approve/flag/incomplete, Operations-only reassign/deliver/contact/
// cancel) doesn't fit TaskBoard's todo/in_progress/done model. TaskBoard IS
// reused, but for a genuinely different, simpler thing: ad-hoc Handler-team
// coordination tasks (team='handler'), the same way Legal/Tech/Outreach/
// Marketing each reuse it for their own team's batches/targets.
export default function HandlerQueuePage() {
  const { user } = useAuth()
  const { isOperations } = useUserRole()
  const { runLocked } = useSubmitLock()
  const [tab, setTab] = useState('premium')
  const [premium, setPremium] = useState([])
  const [standard, setStandard] = useState([])
  const [mine, setMine] = useState([])
  const [escalated, setEscalated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Studio Overview/Performance/Team Tasks -- new in Phase 7.
  const [snapshot, setSnapshot] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [comparisonWindow, setComparisonWindow] = useState('week')
  const [comparison, setComparison] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const tasksToRun = [
        fetchPremiumQueue(), fetchStandardQueue(), fetchMyActiveAssignments(user.id), fetchHandlerNotifications(user.id),
        getHandlerQueueSnapshot(), getHandlerTicketsByWeek(), getHandlerTicketsResolvedComparison(comparisonWindow),
        getTeamTasks('handler'), getTeamRoster('handler'),
      ]
      if (isOperations) tasksToRun.push(fetchOperationsQueue())
      const [p, s, m, n, snapRes, weekRes, compRes, tasksRes, membersRes, e] = await Promise.all(tasksToRun)
      setPremium(p)
      setStandard(s)
      setMine(m)
      setNotifications(n)
      setSnapshot(snapRes.value || null)
      setWeekly(weekRes.value || [])
      setComparison(compRes.value || null)
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
      if (isOperations) setEscalated(e || [])
    } catch (err) {
      setError(err.message || 'Could not load the queue.')
    } finally {
      setLoading(false)
    }
  }, [user.id, isOperations, comparisonWindow])

  useEffect(() => { load() }, [load])

  // ── Handler Team Tasks (generic team_tasks, team='handler') ────────────
  async function addTask(fields) {
    try {
      await createTeamTask('handler', fields)
      const r = await getTeamTasks('handler')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not create that task.')
    }
  }
  async function changeTaskStatus(id, status) {
    try {
      await setTeamTaskStatus(id, status)
      const r = await getTeamTasks('handler')
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that task.')
    }
  }

  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  const handleClaim = (submissionId) => runLocked(async () => {
    setClaimingId(submissionId)
    setError('')
    try {
      // Recorded first, and deliberately not fatal: this is measurement, and a
      // Handler should never be blocked from claiming because a metric write
      // failed.
      await recordClaimAttempt(submissionId).catch(() => {})
      await claimSubmission(submissionId)
      await load()
      setTab('mine')
    } catch (err) {
      setError(err.message)
    } finally {
      setClaimingId(null)
    }
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleOpenNotifications = async () => {
    setNotifOpen((v) => !v)
    const unread = notifications.filter((n) => !n.read)
    if (unread.length > 0) {
      await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => {})))
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    }
  }

  if (selected) {
    return (
      <SubmissionDetail
        submission={selected.row}
        mode={selected.mode}
        onBack={() => setSelected(null)}
        onResolved={async () => { setSelected(null); await load() }}
      />
    )
  }

  const tabs = [
    { key: 'premium', label: `Premium Queue (${premium.length})` },
    { key: 'standard', label: `Standard Queue (${standard.length})` },
    { key: 'mine', label: `Mine (${mine.length})` },
    ...(isOperations ? [{ key: 'escalated', label: `Escalated (${escalated.length})` }] : []),
  ]

  const sections = [
    { id: 'hh-overview', label: 'Overview' },
    { id: 'hh-queue', label: 'Queue' },
    { id: 'hh-performance', label: 'Performance' },
    { id: 'hh-tasks', label: 'Handler Team Tasks' },
  ]

  const heroCharts = [
    {
      key: 'queue-by-tier', eyebrow: 'Live', title: 'Open queue, by tier',
      caption: snapshot
        ? `${fmt(snapshot.open_tickets)} tickets currently open (not yet delivered) across both tiers -- ${fmt(snapshot.unclaimed_tickets)} still unclaimed.`
        : 'Loading…',
      data: snapshot ? [
        { name: 'Premium', value: snapshot.premium_open, color: HUB_ACCENTS.handler },
        { name: 'Standard', value: snapshot.standard_open, color: NAVY },
      ] : [],
      emptyLabel: 'Loading…',
    },
    {
      key: 'opened-by-week', eyebrow: 'Real, 6 weeks', title: 'Tickets opened, by week',
      caption: 'Real submissions.submitted_at count, by calendar week -- includes genuine zero weeks, not skipped.',
      data: weekly.map(w => ({ name: w.week_label, value: w.opened_count, color: HUB_ACCENTS.handler })),
      emptyLabel: 'Loading…',
      nameWidth: 80,
    },
    {
      key: 'resolved-by-week', eyebrow: 'Real, 6 weeks', title: 'Tickets delivered, by week',
      caption: 'Real submissions.delivered_at count, by calendar week.',
      data: weekly.map(w => ({ name: w.week_label, value: w.resolved_count, color: GREEN })),
      emptyLabel: 'Loading…',
      nameWidth: 80,
    },
  ]

  const notifBell = (
    <div style={{ position: 'relative' }}>
      <button
        type="button" onClick={handleOpenNotifications} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        style={{ position: 'relative', background: '#FFFFFF', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={17} color={NAVY} aria-hidden="true" />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: RED, color: '#FFFFFF', fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700, borderRadius: '9px', minWidth: '17px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {unreadCount}
          </span>
        )}
      </button>
      {notifOpen && (
        <div style={{ position: 'absolute', right: 0, top: '46px', width: '320px', maxHeight: '360px', overflowY: 'auto', background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 8px 30px rgba(30,58,95,0.18)', zIndex: 10, padding: '10px' }}>
          {notifications.length === 0 ? (
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: MUTED, padding: '10px' }}>No notifications yet.</p>
          ) : notifications.map((n) => (
            <div key={n.id} style={{ padding: '9px 10px', borderRadius: '7px', background: n.read ? 'transparent' : 'rgba(30,58,95,0.05)' }}>
              <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: '#374151', lineHeight: 1.5 }}>{n.message}</p>
              <p style={{ fontFamily: FONT_SANS, fontSize: '10.5px', color: MUTED, marginTop: '3px' }}>{new Date(n.created_at).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Campus Handler Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <StudioShell
        hubKey="handler"
        title="Campus Handler Hub"
        subtitle="Real queue, claim, review and delivery pipeline for Campus/Job-Search Handlers and Operations. Claim a submission to review it -- every decision needs a note before it can go through. Real headline metrics below exclude banned demo/QA accounts."
        accentColor={HUB_ACCENTS.handler}
        heroCharts={heroCharts}
        sections={sections}
        rangeControl={notifBell}
        error={!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ OVERVIEW ═════════════════════════════════════════════════ */}
        <div id="hh-overview" style={{ scrollMarginTop: '60px' }}>
          <Card style={{ marginBottom: '20px' }}>
            <SectionTitle eyebrow="Live" title="Queue at a glance"
              caption="Real, live counts from submissions/handler_queue/handler_escalations, excluding banned demo/QA accounts. Genuinely all-zero until a real submission enters the pipeline -- a real pre-launch state, not a broken query." />
            <StatStrip
              columns={3}
              style={{ opacity: loading ? 0.6 : 1 }}
              cells={[
                { key: 'open', label: 'Open tickets', value: fmt(snapshot?.open_tickets), icon: Inbox, accent: HUB_ACCENTS.handler },
                { key: 'unclaimed', label: 'Unclaimed', value: fmt(snapshot?.unclaimed_tickets), icon: Clock, accent: snapshot?.unclaimed_tickets > 0 ? AMBER : GREEN },
                { key: 'escalated', label: 'Escalated, unresolved', value: fmt(snapshot?.escalated_open), icon: Flag, accent: snapshot?.escalated_open > 0 ? RED : GREEN },
                { key: 'overdue', label: 'Overdue right now', value: fmt(snapshot?.overdue_open), icon: AlertTriangle, accent: snapshot?.overdue_open > 0 ? RED : GREEN },
                { key: 'delivered-week', label: 'Delivered this week', value: fmt(snapshot?.delivered_this_week), icon: CheckCircle2, accent: GREEN },
                { key: 'avg-hours', label: 'Avg resolution, this week', sub: 'hours', value: fmt(snapshot?.avg_resolution_hours_this_week), icon: TrendingUp, accent: NAVY },
              ]}
            />
          </Card>
        </div>

        {/* ══ QUEUE ════════════════════════════════════════════════════ */}
        <Card id="hh-queue" style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Work the queue" title="Premium Queue, Standard Queue, Mine, Escalated"
            caption="Claim a submission to review it. Every decision needs a note of at least two sentences before it can go through." />

          <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} label={t.label} />
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT_SANS, fontSize: '14px', color: GREY }}>
              <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading…
            </div>
          ) : tab === 'premium' ? (
            premium.length === 0 ? (
              <EmptyState text="No premium tickets waiting. Premium submissions will appear here." />
            ) : (
              <ListBlock>
                {premium.map((s) => (
                  <QueueRow key={s.id} submission={s} action={<ClaimButton s={s} claimingId={claimingId} onClaim={handleClaim} />} />
                ))}
              </ListBlock>
            )
          ) : tab === 'standard' ? (
            standard.length === 0 ? (
              <EmptyState text="No standard tickets waiting. Standard submissions will appear here." />
            ) : (
              <ListBlock>
                {standard.map((s) => (
                  <QueueRow key={s.id} submission={s} action={<ClaimButton s={s} claimingId={claimingId} onClaim={handleClaim} />} />
                ))}
              </ListBlock>
            )
          ) : tab === 'mine' ? (
            mine.length === 0 ? (
              <EmptyState text="Nothing currently assigned to you." />
            ) : (
              <ListBlock>
                {mine.map((s) => (
                  <QueueRow key={s.id} submission={s} onClick={() => setSelected({ row: s, mode: 'handler' })} clickable />
                ))}
              </ListBlock>
            )
          ) : escalated.length === 0 ? (
            <EmptyState text="Nothing escalated, flagged, or incomplete right now." />
          ) : (
            <ListBlock>
              {escalated.map((s) => (
                <QueueRow key={s.ticket_id} submission={{ id: s.submission_id, ...s }} onClick={() => setSelected({ row: { id: s.submission_id, ...s }, mode: 'operations' })} clickable operationsView />
              ))}
            </ListBlock>
          )}
        </Card>

        {/* ══ PERFORMANCE ══════════════════════════════════════════════ */}
        <div id="hh-performance" style={{ marginBottom: '20px', scrollMarginTop: '60px' }}>
          <SectionTitle eyebrow="Progress" title="What You've Got vs What You're Missing"
            caption="Real, banned-excluded count of tickets delivered this window vs the window before it. Like Legal/Tech/Outreach/Marketing's own comparisons, this is a single hub-wide total, not a cohort of comparable Handlers, so top/lowest are left honestly blank; only the self-vs-last-period row below is real." />
          <ComparisonWidget
            entityLabel="Real tickets delivered"
            value={comparison?.resolved_this_period ?? null}
            topValue={null}
            lowestValue={null}
            lastPeriodValue={comparison?.resolved_last_period ?? null}
            unit="tickets"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.handler}
            loading={loading}
            emptyNote={comparison && comparison.resolved_this_period === 0 && comparison.resolved_last_period === 0
              ? 'No real tickets have been delivered this window or last -- an honest 0, the pipeline is pre-launch. This fills in the moment a real ticket is delivered.'
              : null}
          />
        </div>

        {/* ══ HANDLER TEAM TASKS ═══════════════════════════════════════ */}
        <Card id="hh-tasks">
          <SectionTitle eyebrow="New" title="Handler Team Tasks"
            caption="Real, generic team_tasks rows for the Handler team (the same reusable TaskBoard component Legal/Tech/Outreach/Marketing use) -- shift coordination, onboarding a new Handler, and other work that sits outside the formal per-ticket review pipeline above. Seeded empty -- nothing below is a placeholder." />
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
            accentColor={HUB_ACCENTS.handler}
            emptyLabel="No Handler team tasks yet -- add the first real one above."
          />
        </Card>

      </StudioShell>
    </>
  )
}

function fmt(n) { return n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IE') }

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

function ClaimButton({ s, claimingId, onClaim }) {
  return (
    <button
      type="button" onClick={() => onClaim(s.id)} disabled={claimingId === s.id}
      style={primaryButtonSmall(claimingId === s.id)}
    >
      {claimingId === s.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Claim'}
    </button>
  )
}

function ListBlock({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
}

/** "4m" / "2h 10m" / "3d" — how long an unclaimed ticket has been waiting. */
function formatTimeInQueue(queuedAt) {
  if (!queuedAt) return null
  const mins = Math.floor((Date.now() - new Date(queuedAt).getTime()) / 60000)
  if (mins < 0) return null
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  return `${Math.floor(hours / 24)}d`
}

function QueueRow({ submission: s, action, onClick, clickable, operationsView }) {
  const overdue = s.turnaround_deadline && new Date(s.turnaround_deadline) < new Date()
  // Only meaningful while nothing has picked it up yet.
  const timeInQueue = s.picked_at ? null : formatTimeInQueue(s.queued_at)
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
        cursor: clickable ? 'pointer' : 'default',
        border: operationsView ? '1.5px solid rgba(220,38,38,0.3)' : 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.services?.name || 'Foundation Blueprint'}
          </span>
          {s.tier === 'premium' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 700, color: '#9C6B26', background: 'rgba(156,107,38,0.12)', padding: '2px 7px', borderRadius: '9px' }}>
              <Zap size={10} aria-hidden="true" /> Premium
            </span>
          )}
          {operationsView && s.queue_status && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,0.1)', padding: '2px 7px', borderRadius: '9px', textTransform: 'capitalize' }}>
              {s.queue_status}
            </span>
          )}
          {!operationsView && s.marked_incomplete && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,0.1)', padding: '2px 7px', borderRadius: '9px' }}>
              Marked incomplete
            </span>
          )}
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#374151', marginTop: '4px' }}>{s.notes || 'No label given'}</p>
        {operationsView && s.handler_name && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>Was with: {s.handler_name}</p>
        )}
        {s.turnaround_deadline && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: overdue ? '#DC2626' : '#9CA3AF', marginTop: '4px' }}>
            <Clock size={11} aria-hidden="true" />
            {overdue ? 'Overdue — due ' : 'Due '}{new Date(s.turnaround_deadline).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {/* Time sitting unclaimed — separate from the delivery deadline above.
            This is the number that says whether the queue is being picked up. */}
        {timeInQueue && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '3px' }}>
            In queue {timeInQueue}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        padding: '10px 16px', borderRadius: '8px', border: active ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
        background: active ? '#1E3A5F' : '#FFFFFF', color: active ? '#F5F0E8' : '#1E3A5F',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function EmptyState({ text }) {
  return (
    <FormCard>
      <p style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#9CA3AF' }}>{text}</p>
    </FormCard>
  )
}

function SubmissionDetail({ submission, mode, onBack, onResolved }) {
  const { runLocked } = useSubmitLock()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(null)
  const [handlers, setHandlers] = useState([])
  const [reassignTo, setReassignTo] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [refund, setRefund] = useState(false)
  const [scores, setScores] = useState({ accuracy: null, quality: null, completeness: null, tone: null, deliverability: null })
  const [showLowScore, setShowLowScore] = useState(false)
  const [jobSearchGuide, setJobSearchGuide] = useState(null)
  const isJobSearch = submission.document_table === 'job_search_sessions'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSubmissionDetail(submission)
      .then((d) => { if (!cancelled) setDetail(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    if (mode === 'handler' && submission.stage === 'assigned') startReview(submission.id).catch(() => {})
    if (mode === 'operations') listActiveHandlers().then(setHandlers).catch(() => {})
    // Richer than the generic handler_notes array, so it's fetched and
    // rendered separately (JobSearchHandlerGuide) rather than folded into the
    // generic dashed-border Handler Guidance box below.
    if (isJobSearch) {
      fetchJobSearchHandlerGuide(submission.document_id).then((g) => { if (!cancelled) setJobSearchGuide(g) }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [submission, mode, isJobSearch])

  const noteValid = hasTwoSentences(note)

  const scorecardComplete = DIMENSIONS.every((d) => scores[d.key] !== null)
  const compositeTotal = DIMENSIONS.reduce((sum, d) => sum + (scores[d.key] || 0), 0)
  const hasCriticalScore = DIMENSIONS.some((d) => scores[d.key] === 1)
  const lowComposite = scorecardComplete && compositeTotal < 11

  // Operations keeps the original path — the scorecard is the Handler's own
  // review of their ticket, and Operations acting on an escalation is not that.
  const handleAction = (label, fn) => runLocked(async () => {
    if (!noteValid) { setError('Add a note — at least two sentences — before submitting a decision.'); return }
    setActing(label)
    setError('')
    try {
      await fn(submission.id, note)
      onResolved()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(null)
    }
  })

  const submitDecision = (decision, override = false) => runLocked(async () => {
    if (!scorecardComplete) { setError('Score all five quality dimensions before submitting a decision.'); return }
    if (!noteValid) { setError('Add a note — at least two sentences — before submitting a decision.'); return }
    if (decision === 'approved' && hasCriticalScore) {
      setError('A score of 1 indicates a serious quality issue. Flag this ticket to Operations instead.')
      return
    }
    setActing(decision)
    setError('')
    try {
      await submitHandlerDecision(submission.id, decision, note, scores, override)
      setShowLowScore(false)
      onResolved()
    } catch (err) {
      setError(err.message)
      setShowLowScore(false)
    } finally {
      setActing(null)
    }
  })

  const handleApprove = () => {
    if (lowComposite) { setShowLowScore(true); return }
    submitDecision('approved')()
  }

  const handleReassign = () => runLocked(async () => {
    if (!reassignTo) { setError('Choose a Handler to reassign to.'); return }
    setActing('reassign')
    setError('')
    try {
      await reassignSubmission(submission.ticket_id, reassignTo)
      onResolved()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(null)
    }
  })

  const handleContact = () => runLocked(async () => {
    if (!note.trim()) { setError('Write a message to send the student.'); return }
    setActing('contact')
    setError('')
    try {
      await contactStudent(submission.id, note)
      onResolved()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(null)
    }
  })

  const handleCancel = () => runLocked(async () => {
    if (!noteValid) { setError('A cancellation reason of at least two sentences is required.'); return }
    setActing('cancel')
    setError('')
    try {
      await cancelSubmission(submission.id, note, refund)
      onResolved()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(null)
    }
  })

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px 96px' }}>
      <button
        type="button" onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to queue
      </button>

      {error && <div style={{ marginBottom: '18px' }}><ErrorBanner message={error} /></div>}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading…
        </div>
      ) : detail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{detail.label}</span>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#1E3A5F', marginTop: '4px' }}>{detail.title}</h1>
            {mode === 'operations' && submission.escalation_reason && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626', marginTop: '6px' }}>
                Escalated: {submission.escalation_reason} — was due {submission.deadline_was ? new Date(submission.deadline_was).toLocaleString('en-IE') : 'unknown'}
              </p>
            )}
          </div>

          <FormCard title="Student's submission">
            <DataView value={detail.input} />
          </FormCard>

          {/* Handler Guidance sits between the student's submission and the AI
              output on purpose — it's meant to inform the review, not confirm
              it after the fact. Job Search Support carries a richer, purpose-
              built guide (diagnostic questions, talking points, a wellbeing
              flag) instead of the generic handler_notes array every other
              document type uses, so it gets its own component here rather
              than being flattened into a bullet list. */}
          {isJobSearch ? (
            jobSearchGuide ? (
              <JobSearchHandlerGuide guide={jobSearchGuide} />
            ) : (
              <div style={{ border: '2px dashed #9C6B26', borderRadius: '12px', padding: '20px', background: '#FFFFFF', borderLeft: '3px solid #1E3A5F' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6 }}>
                  No Handler guide found for this session — the strategy has already been delivered to the student; use the diagnostic questions in the intake form above to run the advisory conversation.
                </p>
              </div>
            )
          ) : (
            <div style={{ border: '2px dashed #9C6B26', borderRadius: '12px', padding: '20px', background: '#FFFFFF', borderLeft: '3px solid #1E3A5F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <ShieldAlert size={15} color="#9C6B26" aria-hidden="true" />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Handler Guidance</span>
              </div>
              {detail.handlerNotes?.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {detail.handlerNotes.map((n, i) => (
                    <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{n}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', lineHeight: 1.6 }}>
                  No specific guidance for this submission type. Apply the standard quality checklist.
                </p>
              )}
            </div>
          )}

          <FormCard title="Generated output">
            <DataView value={detail.generated} skipKeys={['handler_notes', 'benchmarked_against']} />
          </FormCard>

          {mode === 'handler' ? (
            <>
              {/* Scored after reading the output, before the note is written —
                  the judgement comes first, then the note explaining it. */}
              <QualityScorecard scores={scores} onChange={setScores} />

              <FormCard title="Your decision">
                <NoteField note={note} setNote={setNote} noteValid={noteValid} disabled={!scorecardComplete} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <ActionButton
                    label={isJobSearch ? 'Mark consultation complete' : 'Approve and deliver'} icon={Check} tone="primary"
                    busy={acting === 'approved'}
                    disabled={!scorecardComplete || hasCriticalScore}
                    onClick={handleApprove}
                  />
                  <ActionButton
                    label="Flag to Operations" icon={Flag} tone="secondary"
                    busy={acting === 'flagged'}
                    disabled={!scorecardComplete}
                    onClick={submitDecision('flagged')}
                  />
                  <ActionButton
                    label="Mark incomplete" icon={AlertTriangle} tone="secondary"
                    busy={acting === 'incomplete'}
                    disabled={!scorecardComplete}
                    onClick={submitDecision('incomplete')}
                  />
                </div>
                {hasCriticalScore && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#DC2626', marginTop: '10px' }}>
                    Approval is disabled while any dimension is scored 1. Flag this ticket to Operations.
                  </p>
                )}
                {!scorecardComplete && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF', marginTop: '10px' }}>
                    Score all five dimensions above to unlock your review note and decision.
                  </p>
                )}
              </FormCard>

              {showLowScore && (
                <LowScoreModal
                  total={compositeTotal}
                  busy={acting === 'approved'}
                  onConfirm={submitDecision('approved', true)}
                  onCancel={() => setShowLowScore(false)}
                />
              )}
            </>
          ) : (
            <FormCard title="Operations actions">
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="reassign_to" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, color: '#1E3A5F', display: 'block', marginBottom: '6px' }}>Reassign to</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    id="reassign_to" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}
                    style={{ flex: 1, height: '42px', border: '1.5px solid rgba(30,58,95,0.2)', borderRadius: '8px', padding: '0 10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#1E3A5F' }}
                  >
                    <option value="">Select a Handler…</option>
                    {handlers.map((h) => <option key={h.id} value={h.id}>{h.full_name || h.id}</option>)}
                  </select>
                  <ActionButton label="Reassign" icon={UserCog} tone="primary" busy={acting === 'reassign'} onClick={handleReassign} />
                </div>
              </div>

              <NoteField note={note} setNote={setNote} noteValid={noteValid} label="Note (used for delivery, cancellation, or the message to the student)" />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                <ActionButton label="Deliver as Operations" icon={Check} tone="primary" busy={acting === 'deliver'} onClick={handleAction('deliver', deliverSubmission)} />
                <ActionButton label="Contact student" icon={MessageCircle} tone="secondary" busy={acting === 'contact'} onClick={handleContact} />
                <ActionButton label={showCancel ? 'Confirm cancel' : 'Cancel submission'} icon={XCircle} tone="secondary" busy={acting === 'cancel'} onClick={showCancel ? handleCancel : () => setShowCancel(true)} />
              </div>
              {showCancel && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} />
                  Flag for full refund
                </label>
              )}
            </FormCard>
          )}
        </div>
      ) : null}
    </div>
  )
}

function NoteField({ note, setNote, noteValid, label, disabled }) {
  return (
    <>
      <label htmlFor="handler_note" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: disabled ? '#9CA3AF' : '#1E3A5F', display: 'block', marginBottom: '6px' }}>
        {label || 'Handler note'} <span style={{ color: '#DC2626' }}>*</span>
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}> — at least two sentences, required for any decision</span>
      </label>
      <textarea
        id="handler_note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000}
        disabled={disabled}
        placeholder={disabled ? 'Complete the quality scorecard above before writing your review note' : undefined}
        style={{
          width: '100%', border: '1.5px solid rgba(30,58,95,0.2)', borderRadius: '8px', padding: '12px 14px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: disabled ? '#9CA3AF' : '#1E3A5F',
          background: disabled ? '#F9FAFB' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'text',
          boxSizing: 'border-box', resize: 'vertical',
        }}
      />
      {!disabled && note && !noteValid && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#DC2626', marginTop: '5px' }}>Needs at least two sentences.</p>
      )}
    </>
  )
}

/** Explicit confirmation for approving a composite below 11. */
function LowScoreModal({ total, busy, onConfirm, onCancel }) {
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="low-score-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 }}
    >
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 8px 32px rgba(30,58,95,0.25)', padding: '26px', maxWidth: '440px', width: '100%' }}>
        <h2 id="low-score-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
          Confirm low-score approval
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', marginTop: '10px', lineHeight: 1.6 }}>
          This output has a low composite score of {total}. Confirm you are satisfied it meets the quality standard before approving.
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#9CA3AF', marginTop: '8px' }}>
          Your confirmation is recorded against this review.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            type="button" onClick={onCancel} disabled={busy}
            style={{ height: '42px', padding: '0 18px', background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.2)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            Go back
          </button>
          <button
            type="button" onClick={onConfirm} disabled={busy}
            style={{ height: '42px', padding: '0 18px', background: busy ? 'rgba(220,38,38,0.7)' : '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Approving…' : 'Confirm and approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ label, icon: Icon, tone, busy, onClick, disabled }) {
  const primary = tone === 'primary'
  const off = busy || disabled
  return (
    <button
      type="button" onClick={onClick} disabled={off}
      style={{
        height: '44px', padding: '0 18px', borderRadius: '8px',
        border: primary ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
        background: off ? (primary ? 'rgba(30,58,95,0.4)' : '#F9FAFB') : primary ? '#1E3A5F' : '#FFFFFF',
        color: primary ? '#F5F0E8' : off ? '#9CA3AF' : '#1E3A5F',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600,
        cursor: off ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
      }}
    >
      {busy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Icon size={14} aria-hidden="true" />}
      {label}
    </button>
  )
}

const primaryButtonSmall = (busy) => ({
  height: '36px', padding: '0 16px', borderRadius: '7px', border: 'none',
  background: busy ? 'rgba(30,58,95,0.6)' : '#1E3A5F', color: '#F5F0E8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
  cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '64px',
})

/**
 * Renders an arbitrary jsonb value as readable key/value blocks. Generic on
 * purpose — the 7 document types' input/generated shapes differ enough that
 * 7 bespoke renderers would be a lot of surface for a first working queue;
 * this gets a Handler something genuinely readable across all of them.
 */
function DataView({ value, skipKeys = [] }) {
  if (value === null || value === undefined) {
    return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF' }}>Nothing here.</p>
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(value)}</p>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF' }}>None</p>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {value.map((item, i) =>
          typeof item === 'object' && item !== null ? (
            <div key={i} style={{ border: '1px solid rgba(30,58,95,0.1)', borderRadius: '8px', padding: '10px 12px' }}>
              <DataView value={item} />
            </div>
          ) : (
            <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>•</span>{String(item)}
            </p>
          ),
        )}
      </div>
    )
  }
  const entries = Object.entries(value).filter(([k, v]) => !skipKeys.includes(k) && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
  if (entries.length === 0) return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF' }}>Nothing here.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {entries.map(([key, v]) => (
        <div key={key}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            {key.replace(/_/g, ' ')}
          </p>
          <DataView value={v} skipKeys={skipKeys} />
        </div>
      ))}
    </div>
  )
}
