import { useState } from 'react'
import { Send, Check, X, Loader2, ArrowRightLeft, KeyRound, Inbox } from 'lucide-react'
import {
  NAVY, CREAM, GREY, MUTED, GREEN, RED, WHITE, BORDER, STUDIO_INPUT, STATUS_COLORS, HUB_LABELS, FONT_SANS, studioButton, tint,
} from './theme'
import StatusDot from './StatusDot'

// Studio Phase 11 -- the shared cross-hub Requests component every hub page
// renders through (task #28). Two real request types, backed by the new
// studio_requests table (supabase/migrations/
// studio_phase11_leads_and_requests_v2.sql):
//   - task_handoff: delegate an existing team_tasks row (picked from
//     `tasks`, the caller's own open tasks) to a DIFFERENT hub. The
//     requester cannot name a specific person on that other hub (no cross-
//     hub roster lookup is exposed) -- the APPROVER picks a specific
//     teammate from THEIR OWN roster (`members`) at approval time instead,
//     via the optional "Assign to" picker next to Approve below.
//   - access_request: ask to see another hub's data, or ask your own
//     hub's leads for the lead-only view -- a free-text message, no task.
//
// Same "UI holds state, caller fetches" split as TaskBoard/ComparisonWidget
// -- this component holds no Supabase calls itself. A hub wires it to real
// data via src/lib/studioMetrics.js's listStudioRequests/createStudioRequest/
// approveStudioRequest/denyStudioRequest.
//
// `requests`: real rows from listStudioRequests(team) -- both directions,
// each tagged `direction: 'incoming' | 'outgoing'`.
// `tasks`: the caller's own OPEN team_tasks (optional -- a hub with no
// TaskBoard of its own, e.g. Finance, can omit this and the panel simply
// won't offer task_handoff as a creatable type, only access_request).
// `members`: the caller's own team roster (optional, same reasoning), used
// only to let an approver re-assign an incoming task_handoff on their team.

const TYPE_LABELS = { task_handoff: 'Task handoff', access_request: 'Access request' }
const STATUS_META = {
  pending: { label: 'Pending', dot: 'yellow' },
  approved: { label: 'Approved', dot: 'green' },
  denied: { label: 'Denied', dot: 'red' },
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

export default function RequestPanel({
  team, requests = [], tasks = [], members = [], loading = false,
  onCreate, onApprove, onDeny, accentColor = NAVY,
  emptyLabel = 'No cross-hub requests yet -- send or receive the first one below.',
}) {
  const otherTeams = Object.keys(HUB_LABELS).filter(t => t !== team)
  const openTasks = tasks.filter(t => t.status !== 'done')

  // Always starts on access_request: tasks/openTasks arrive async (the
  // caller's own data fetch), so a default keyed off openTasks.length at
  // mount would go stale the moment that data actually loads. The Type
  // selector itself is always shown (not gated on openTasks.length) --
  // picking "Task handoff" with nothing yet to hand off simply leaves the
  // task picker on "Select a task..." and the Send button disabled.
  const [form, setForm] = useState({
    requestType: 'access_request',
    targetTeam: otherTeams[0] || '',
    relatedTaskId: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [assignDraft, setAssignDraft] = useState({})

  async function submit() {
    if (!form.targetTeam || !form.message.trim() || !onCreate) return
    if (form.requestType === 'task_handoff' && !form.relatedTaskId) return
    setSubmitting(true)
    try {
      await onCreate({
        targetTeam: form.targetTeam,
        requestType: form.requestType,
        message: form.message.trim(),
        relatedTaskId: form.requestType === 'task_handoff' ? form.relatedTaskId : null,
      })
      setForm(f => ({ ...f, relatedTaskId: '', message: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  async function approve(id) {
    if (!onApprove) return
    setResolvingId(id)
    try {
      await onApprove(id, null, assignDraft[id] || null)
    } finally {
      setResolvingId(null)
    }
  }
  async function deny(id) {
    if (!onDeny) return
    setResolvingId(id)
    try {
      await onDeny(id, null)
    } finally {
      setResolvingId(null)
    }
  }

  const canSubmit = !!form.targetTeam && !!form.message.trim() && (form.requestType !== 'task_handoff' || !!form.relatedTaskId)

  return (
    <div>
      <div className="studio-form-panel">
        <div
          className="studio-request-form"
          style={{ display: 'grid', gridTemplateColumns: form.requestType === 'task_handoff' ? '1fr 1fr 1.2fr 1.8fr auto' : '1fr 1fr 1.8fr auto', gap: '12px', alignItems: 'flex-end' }}
        >
          <style>{`
            @media (max-width: 760px) { .studio-request-form { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 480px) { .studio-request-form { grid-template-columns: 1fr !important; } }
            @media (max-width: 480px) { .studio-request-form button { width: 100%; } }
          `}</style>
          <RPField label="Type">
            <select
              value={form.requestType}
              onChange={e => setForm(f => ({ ...f, requestType: e.target.value, relatedTaskId: '' }))}
              style={STUDIO_INPUT}
            >
              <option value="access_request">Access request</option>
              <option value="task_handoff">Task handoff</option>
            </select>
          </RPField>
          <RPField label="Send to">
            <select value={form.targetTeam} onChange={e => setForm(f => ({ ...f, targetTeam: e.target.value }))} style={STUDIO_INPUT}>
              {otherTeams.map(t => <option key={t} value={t}>{HUB_LABELS[t]}</option>)}
            </select>
          </RPField>
          {form.requestType === 'task_handoff' && (
            <RPField label="Which task">
              <select value={form.relatedTaskId} onChange={e => setForm(f => ({ ...f, relatedTaskId: e.target.value }))} style={STUDIO_INPUT}>
                <option value="">{openTasks.length === 0 ? 'No open tasks yet' : 'Select a task…'}</option>
                {openTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </RPField>
          )}
          <RPField label="Message">
            <input
              type="text" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              style={STUDIO_INPUT}
              placeholder={form.requestType === 'task_handoff' ? 'Why this belongs with them...' : 'What access, and why...'}
            />
          </RPField>
          <button type="button" disabled={submitting || !canSubmit} onClick={submit} style={studioButton(accentColor, canSubmit)}>
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <p style={{
          fontFamily: FONT_SANS, fontSize: '13px', color: GREY, lineHeight: 1.5, margin: 0,
          border: '1px dashed rgba(30,58,95,0.2)', borderRadius: '10px', padding: '14px 16px',
        }}>
          {emptyLabel}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {requests.map(r => {
            const meta = STATUS_META[r.status] || STATUS_META.pending
            const incoming = r.direction === 'incoming'
            const TypeIcon = r.request_type === 'task_handoff' ? ArrowRightLeft : KeyRound
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                background: WHITE, borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '12px 16px',
              }}>
                <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: FONT_SANS, fontSize: '10.5px', fontWeight: 700,
                      color: incoming ? accentColor : GREY, background: incoming ? tint(accentColor, 0.1) : CREAM,
                      border: `1px solid ${incoming ? tint(accentColor, 0.3) : BORDER}`, borderRadius: '999px', padding: '2px 9px', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {incoming ? 'Incoming' : 'Sent'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY }}>
                      <TypeIcon size={12} /> {TYPE_LABELS[r.request_type] || r.request_type}
                    </span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY }}>
                      {incoming ? `from ${HUB_LABELS[r.requester_team] || r.requester_team}` : `to ${HUB_LABELS[r.target_team] || r.target_team}`}
                    </span>
                  </div>
                  {r.related_task_title && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 600, color: NAVY, margin: '6px 0 0', lineHeight: 1.5 }}>
                      Task: {r.related_task_title}
                    </p>
                  )}
                  <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: '4px 0 0', lineHeight: 1.55 }}>{r.message}</p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: MUTED, margin: '8px 0 0' }}>
                    {r.requester_name}{r.created_at ? ` · ${fmtDate(r.created_at)}` : ''}
                    {r.status !== 'pending' && r.resolved_by_name ? ` · ${meta.label.toLowerCase()} by ${r.resolved_by_name}` : ''}
                  </p>
                </div>

                {incoming && r.status === 'pending' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    {r.request_type === 'task_handoff' && members.length > 0 && (
                      <select
                        value={assignDraft[r.id] || ''}
                        onChange={e => setAssignDraft(d => ({ ...d, [r.id]: e.target.value }))}
                        style={{ ...STUDIO_INPUT, height: '30px', fontSize: '12px', width: '150px' }}
                        aria-label="Assign to on approval"
                      >
                        <option value="">Assign to…</option>
                        {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
                      </select>
                    )}
                    <button
                      type="button" disabled={resolvingId === r.id} onClick={() => approve(r.id)}
                      style={{ ...studioButton(GREEN, true), height: '30px', padding: '0 12px', fontSize: '12px' }}
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      type="button" disabled={resolvingId === r.id} onClick={() => deny(r.id)}
                      style={{ ...studioButton(RED, true), height: '30px', padding: '0 12px', fontSize: '12px' }}
                    >
                      <X size={13} /> Deny
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                    background: tint(STATUS_COLORS[meta.dot], 0.1), border: `1px solid ${tint(STATUS_COLORS[meta.dot], 0.35)}`,
                    borderRadius: '999px', padding: '4px 10px 4px 10px', height: '30px',
                  }}>
                    <StatusDot status={meta.dot} />
                    <span style={{ fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY }}>{meta.label}</span>
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RPField({ label, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: GREY, display: 'block', marginBottom: '6px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
