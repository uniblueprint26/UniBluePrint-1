import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { NAVY, CREAM, GREY, WHITE, BORDER, BORDER_STRONG, STUDIO_INPUT, FONT_SANS, studioButton, tint, getStatusColor } from './theme'
import StatusDot from './StatusDot'
import { EmptyNote } from './StudioPrimitives'

// Generic "targets, batches, delegated tasks" board -- per the founder's
// brief, Legal is the first hub to need this, but Tech/Outreach/Marketing
// etc. will too, so this is a reusable Studio component (takes a `team`
// prop) backed by the generic team_tasks table/RPCs
// (supabase/migrations/20261022174125_legal_hub_schema.sql), not a
// Legal-only one-off. A hub wires it to real data via
// src/lib/studioMetrics.js's getTeamTasks/createTeamTask/updateTeamTask/
// setTeamTaskStatus/getTeamRoster -- this component itself holds no
// Supabase calls, same "UI holds state, caller fetches" split as
// ComparisonWidget.
//
// `tasks`: real rows from getTeamTasks(team) (already resolved
// assignee_name/created_by_name server-side).
// `members`: real roster from getTeamRoster(team), for the assignee picker.
// `onCreate(fields)` / `onStatusChange(id, status)`: thunks the caller wires
// to createTeamTask/setTeamTaskStatus and then re-fetches with.

const STATUS_META = {
  todo: { label: 'To do', dot: 'grey' },
  in_progress: { label: 'In progress', dot: 'yellow' },
  done: { label: 'Done', dot: 'green' },
}
const STATUS_ORDER = ['todo', 'in_progress', 'done']

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

export default function TaskBoard({
  tasks = [], members = [], loading = false,
  onCreate, onStatusChange, accentColor = NAVY,
  emptyLabel = 'No tasks yet -- add the first one below.',
}) {
  const [form, setForm] = useState({ title: '', description: '', batchLabel: '', targetDate: '', assignedTo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [changingId, setChangingId] = useState(null)

  async function submit() {
    if (!form.title.trim() || !onCreate) return
    setSubmitting(true)
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim() || null,
        batchLabel: form.batchLabel.trim() || null,
        targetDate: form.targetDate || null,
        assignedTo: form.assignedTo || null,
      })
      setForm({ title: '', description: '', batchLabel: '', targetDate: '', assignedTo: '' })
    } finally {
      setSubmitting(false)
    }
  }

  async function changeStatus(id, status) {
    if (!onStatusChange) return
    setChangingId(id)
    try {
      await onStatusChange(id, status)
    } finally {
      setChangingId(null)
    }
  }

  const canSubmit = !!form.title.trim()

  return (
    <div>
      {/* Studio Phase 10: the create form sits in its own tinted panel so it
          reads as "add something" rather than as a row of the list below;
          same grid + the exact Phase 9 breakpoints (700px -> 2 cols, 480px
          -> 1 col, full-width button), only restyled within them. */}
      <div className="studio-form-panel">
        <div
          className="studio-taskboard-form"
          style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}
        >
          <style>{`
            @media (max-width: 700px) { .studio-taskboard-form { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 480px) { .studio-taskboard-form { grid-template-columns: 1fr !important; } }
            @media (max-width: 480px) { .studio-taskboard-form button { width: 100%; } }
          `}</style>
          <TBField label="Title">
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={tbInput} placeholder="What needs doing..." />
          </TBField>
          <TBField label="Description">
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={tbInput} placeholder="Optional detail..." />
          </TBField>
          <TBField label="Batch">
            <input type="text" value={form.batchLabel} onChange={e => setForm(f => ({ ...f, batchLabel: e.target.value }))} style={tbInput} placeholder="e.g. Q4 contracts" />
          </TBField>
          <TBField label="Target date">
            <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} style={tbInput} />
          </TBField>
          <TBField label="Assign to">
            <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} style={tbInput}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </TBField>
          <button
            type="button" disabled={submitting || !canSubmit}
            onClick={submit}
            style={studioButton(accentColor, canSubmit)}
          >
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
            Add
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyNote style={{
          border: `1px dashed ${BORDER_STRONG}`, borderRadius: '10px', padding: '14px 16px', fontSize: '13px',
        }}>
          {emptyLabel}
        </EmptyNote>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {tasks.map(t => {
            const meta = STATUS_META[t.status]
            const statusColor = getStatusColor(meta?.dot || 'grey')
            const done = t.status === 'done'
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                background: WHITE, borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '12px 16px',
              }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '13.5px', fontWeight: 600, color: done ? GREY : NAVY, lineHeight: 1.4 }}>{t.title}</span>
                    {t.batch_label && (
                      <span style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 600, color: NAVY, background: CREAM, border: `1px solid ${BORDER}`, borderRadius: '999px', padding: '2px 9px', lineHeight: 1.4 }}>
                        {t.batch_label}
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: '4px 0 0', lineHeight: 1.55 }}>{t.description}</p>
                  )}
                  <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, margin: '8px 0 0' }}>
                    {t.assignee_name || 'Unassigned'}{t.target_date ? ` · due ${fmtDate(t.target_date)}` : ''}
                  </p>
                </div>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                  background: tint(statusColor, 0.1), border: `1px solid ${tint(statusColor, 0.35)}`,
                  borderRadius: '999px', padding: '0 4px 0 10px', height: '30px',
                }}>
                  <StatusDot status={meta?.dot || 'grey'} />
                  <select
                    value={t.status}
                    aria-label="Task status"
                    disabled={changingId === t.id || !onStatusChange}
                    onChange={e => changeStatus(t.id, e.target.value)}
                    style={{ fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY, padding: '4px 2px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TBField({ label, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: GREY, display: 'block', marginBottom: '6px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const tbInput = STUDIO_INPUT
