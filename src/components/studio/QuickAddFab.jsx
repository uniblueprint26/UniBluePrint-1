import { useEffect, useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { NAVY, GREY, WHITE, BORDER, BORDER_STRONG, STUDIO_INPUT, FONT_SANS, FONT_SERIF, studioButton, OVERLAY } from './theme'
import { createTeamTask, getTeamRoster } from '../../lib/studioMetrics'

// Studio Phase 14 -- a persistent "quick-add a task" button, same
// bottom-right spot on every hub, so adding something doesn't require
// scrolling down to that hub's own Tasks & Batches section first. Calls
// the exact same createTeamTask(team, fields) RPC TaskBoard's own form
// already uses (src/components/studio/TaskBoard.jsx) -- no second
// create-task code path, just a second place to reach it from. `team` is
// always the hub's own hubKey (every hub's TEAM constant already equals
// its hubKey, checked live across all 8 hub pages before building this).
export default function QuickAddFab({ team, accentColor = NAVY, onCreated }) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ title: '', description: '', batchLabel: '', targetDate: '', assignedTo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    getTeamRoster(team).then(r => setMembers(r.value || [])).catch(() => setMembers([]))
  }, [open, team])

  async function submit() {
    if (!form.title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createTeamTask(team, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        batchLabel: form.batchLabel.trim() || null,
        targetDate: form.targetDate || null,
        assignedTo: form.assignedTo || null,
      })
      setForm({ title: '', description: '', batchLabel: '', targetDate: '', assignedTo: '' })
      setOpen(false)
      if (onCreated) await onCreated()
    } catch (err) {
      setError(err.message || 'Could not create that task.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !!form.title.trim() && !submitting

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick-add a task"
        title="Quick-add a task (from anywhere on this hub)"
        className="studio-fab"
        style={{ background: accentColor }}
      >
        <Plus size={22} />
      </button>
      <style>{FAB_STYLES}</style>

      {open && (
        <div
          role="presentation"
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 210, background: OVERLAY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div role="dialog" aria-modal="true" aria-label="Quick-add a task" className="studio-fab-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: '20px', color: NAVY, margin: 0 }}>Quick-add a task</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', color: GREY, cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FabField label="Title">
                <input autoFocus type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={STUDIO_INPUT} placeholder="What needs doing..." />
              </FabField>
              <FabField label="Description">
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={STUDIO_INPUT} placeholder="Optional detail..." />
              </FabField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FabField label="Target date">
                  <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} style={STUDIO_INPUT} />
                </FabField>
                <FabField label="Assign to">
                  <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} style={STUDIO_INPUT}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
                  </select>
                </FabField>
              </div>
              {error && <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: 'var(--studio-red)', margin: 0 }}>{error}</p>}
              <button type="button" disabled={!canSubmit} onClick={submit} style={{ ...studioButton(accentColor, canSubmit), width: '100%', marginTop: '4px' }}>
                {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FabField({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: GREY, display: 'block', marginBottom: '6px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const FAB_STYLES = `
  .studio-fab {
    position: fixed; right: 24px; bottom: 24px; z-index: 90; width: 52px; height: 52px; border-radius: 50%;
    border: none; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.28); transition: transform 150ms;
  }
  .studio-fab:hover, .studio-fab:focus-visible { transform: scale(1.06); outline: none; }
  .studio-fab-panel {
    width: min(420px, 100%); background: ${WHITE}; border-radius: 14px; border: 1px solid ${BORDER_STRONG};
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 20px;
  }
  @media (max-width: 480px) { .studio-fab { right: 16px; bottom: 16px; width: 48px; height: 48px; } }
`
