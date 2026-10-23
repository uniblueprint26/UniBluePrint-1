import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { NAVY, CREAM, GREY, MUTED, FONT_SANS } from './theme'
import StatusDot from './StatusDot'

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

  return (
    <div>
      <div
        className="studio-taskboard-form"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end', marginBottom: '16px' }}
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
          type="button" disabled={submitting || !form.title.trim()}
          onClick={submit}
          style={{
            fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, padding: '9px 14px', borderRadius: '8px', border: 'none',
            background: form.title.trim() ? accentColor : MUTED, color: '#fff', cursor: form.title.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', whiteSpace: 'nowrap',
          }}
        >
          {submitting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={13} />}
          Add
        </button>
      </div>

      {tasks.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: MUTED }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: loading ? 0.6 : 1 }}>
          {tasks.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
              background: CREAM, borderRadius: '9px', border: '1px solid rgba(30,58,95,0.08)', padding: '10px 14px',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: '13px', fontWeight: 600, color: NAVY }}>{t.title}</span>
                  {t.batch_label && (
                    <span style={{ fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700, color: GREY, background: '#fff', border: '1px solid rgba(30,58,95,0.1)', borderRadius: '999px', padding: '2px 8px' }}>
                      {t.batch_label}
                    </span>
                  )}
                </div>
                {t.description && (
                  <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '4px 0 0', lineHeight: 1.4 }}>{t.description}</p>
                )}
                <p style={{ fontFamily: FONT_SANS, fontSize: '11px', color: MUTED, margin: '5px 0 0' }}>
                  {t.assignee_name || 'Unassigned'}{t.target_date ? ` · due ${fmtDate(t.target_date)}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <StatusDot status={STATUS_META[t.status]?.dot || 'grey'} />
                <select
                  value={t.status}
                  disabled={changingId === t.id || !onStatusChange}
                  onChange={e => changeStatus(t.id, e.target.value)}
                  style={{ fontFamily: FONT_SANS, fontSize: '11.5px', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(30,58,95,0.15)', background: '#fff' }}
                >
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TBField({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, display: 'block', marginBottom: '4px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const tbInput = {
  fontFamily: FONT_SANS, fontSize: '12.5px', padding: '7px 9px', borderRadius: '7px',
  border: '1px solid rgba(30,58,95,0.15)', width: '100%', boxSizing: 'border-box', height: '36px',
}
