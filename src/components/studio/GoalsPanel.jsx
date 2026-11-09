import { useState } from 'react'
import { Plus, Loader2, Target } from 'lucide-react'
import {
  NAVY, GREY, MUTED, WHITE, BORDER, BORDER_STRONG, STUDIO_INPUT, FONT_SANS, studioButton, tint, getStatusColor,
} from './theme'
import StatusDot from './StatusDot'
import Avatar from './Avatar'
import { EmptyNote } from './StudioPrimitives'

// Studio Phase 16 -- the shared monthly-goals component every hub page
// renders through (task #41's "Leaders: monthly goals" + the Extras
// backlog's "goals" item, one feature covering both). Backed by
// studio_goals (supabase/migrations/20261109230156_studio_phase16_goals_v2.sql).
//
// Same "UI holds state, caller fetches" split as TaskBoard/RequestPanel --
// this component holds no Supabase calls itself. A hub wires it to real
// data via src/lib/studioMetrics.js's listStudioGoals/createStudioGoal/
// updateStudioGoal.
//
// `goals`: real rows from listStudioGoals(team), newest month first.
// `isLead`: whether the caller can create/update a goal for this team
// (am_i_team_lead via useStudioTheme or a direct getIsTeamLead call --
// the hub page already knows this the same way it gates Finance's
// negotiated-rate column / Tech's idea-triage control). A non-lead sees
// the list read-only, no create form -- same split RequestPanel does NOT
// need (anyone can send a request) but Goals does (only a lead sets one).

// StatusDot/getStatusColor only know green/yellow/red/grey (theme.js) --
// grey for "no verdict yet" (in_progress), yellow for "needs attention"
// (at_risk), green for "good" (on_track/achieved), red for "didn't land"
// (missed).
const STATUS_META = {
  in_progress: { label: 'In progress', dot: 'grey' },
  on_track: { label: 'On track', dot: 'green' },
  at_risk: { label: 'At risk', dot: 'yellow' },
  achieved: { label: 'Achieved', dot: 'green' },
  missed: { label: 'Missed', dot: 'red' },
}

function fmtMonth(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
}

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function GoalsPanel({
  team, goals = [], loading = false, isLead = false,
  onCreate, onUpdateProgress,
  accentColor = NAVY,
  emptyLabel = 'No goals set for this hub yet.',
}) {
  const [form, setForm] = useState({
    title: '', month: currentMonthValue(), targetValue: '', targetUnit: '', description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [progressDraft, setProgressDraft] = useState({})
  const [savingId, setSavingId] = useState(null)

  async function submit() {
    if (!form.title.trim() || !onCreate) return
    setSubmitting(true)
    try {
      await onCreate({
        title: form.title.trim(),
        month: form.month,
        description: form.description.trim() || null,
        targetValue: form.targetValue === '' ? null : Number(form.targetValue),
        targetUnit: form.targetUnit.trim() || null,
      })
      setForm(f => ({ ...f, title: '', targetValue: '', targetUnit: '', description: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveProgress(goal) {
    if (!onUpdateProgress) return
    const draft = progressDraft[goal.id]
    if (!draft) return
    setSavingId(goal.id)
    try {
      await onUpdateProgress(goal.id, {
        currentValue: draft.currentValue !== undefined && draft.currentValue !== ''
          ? Number(draft.currentValue) : undefined,
        status: draft.status || undefined,
      })
      setProgressDraft(d => { const next = { ...d }; delete next[goal.id]; return next })
    } finally {
      setSavingId(null)
    }
  }

  const canSubmit = !!form.title.trim() && !!form.month

  return (
    <div>
      {isLead && (
        <div className="studio-form-panel">
          <div
            className="studio-goal-form"
            style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.9fr auto', gap: '12px', alignItems: 'flex-end' }}
          >
            <style>{`
              @media (max-width: 760px) { .studio-goal-form { grid-template-columns: 1fr 1fr !important; } }
              @media (max-width: 480px) { .studio-goal-form { grid-template-columns: 1fr !important; } }
              @media (max-width: 480px) { .studio-goal-form button { width: 100%; } }
            `}</style>
            <GPField label="Goal">
              <input
                type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={STUDIO_INPUT} placeholder="What this hub is aiming for this month…"
              />
            </GPField>
            <GPField label="Month">
              <input
                type="month"
                value={form.month.slice(0, 7)}
                onChange={e => setForm(f => ({ ...f, month: `${e.target.value}-01` }))}
                style={STUDIO_INPUT}
              />
            </GPField>
            <GPField label="Target">
              <input
                type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                style={STUDIO_INPUT} placeholder="e.g. 10"
              />
            </GPField>
            <GPField label="Unit">
              <input
                type="text" value={form.targetUnit} onChange={e => setForm(f => ({ ...f, targetUnit: e.target.value }))}
                style={STUDIO_INPUT} placeholder="e.g. contracts"
              />
            </GPField>
            <button type="button" disabled={submitting || !canSubmit} onClick={submit} style={studioButton(accentColor, canSubmit)}>
              {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Set goal
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyNote style={{
          border: `1px dashed ${BORDER_STRONG}`, borderRadius: '10px', padding: '14px 16px', fontSize: '13px',
        }}>
          {emptyLabel}
        </EmptyNote>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {goals.map(g => {
            const meta = STATUS_META[g.status] || STATUS_META.in_progress
            const draft = progressDraft[g.id] || {}
            const hasTarget = g.target_value !== null && g.target_value !== undefined
            const pct = hasTarget && g.target_value > 0
              ? Math.min(100, Math.round(((g.current_value || 0) / g.target_value) * 100))
              : null
            return (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                background: WHITE, borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '12px 16px',
              }}>
                <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: NAVY }}>
                      <Target size={12} /> {g.title}
                    </span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: '11px', color: GREY }}>{fmtMonth(g.month)}</span>
                  </div>
                  {g.description && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, margin: '4px 0 0', lineHeight: 1.55 }}>{g.description}</p>
                  )}
                  {hasTarget && (
                    <div style={{ marginTop: '8px', maxWidth: '260px' }}>
                      <div style={{ height: '6px', borderRadius: '3px', background: tint(accentColor, 0.12), overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct ?? 0}%`, background: accentColor, borderRadius: '3px' }} />
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: '11px', color: MUTED, margin: '4px 0 0' }}>
                        {g.current_value ?? 0} / {g.target_value} {g.target_unit || ''}
                      </p>
                    </div>
                  )}
                  <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: MUTED, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Avatar name={g.created_by_name} userId={g.created_by} avatarUrl={g.created_by_avatar_url} size={16} />
                    Set by {g.created_by_name}
                  </p>
                </div>

                {isLead && onUpdateProgress ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    {hasTarget && (
                      <input
                        type="number"
                        placeholder={String(g.current_value ?? 0)}
                        value={draft.currentValue ?? ''}
                        onChange={e => setProgressDraft(d => ({ ...d, [g.id]: { ...d[g.id], currentValue: e.target.value } }))}
                        style={{ ...STUDIO_INPUT, height: '30px', fontSize: '12px', width: '80px' }}
                        aria-label="Current progress"
                      />
                    )}
                    <select
                      value={draft.status || g.status}
                      onChange={e => setProgressDraft(d => ({ ...d, [g.id]: { ...d[g.id], status: e.target.value } }))}
                      style={{ ...STUDIO_INPUT, height: '30px', fontSize: '12px', width: '130px' }}
                      aria-label="Goal status"
                    >
                      {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button
                      type="button" disabled={savingId === g.id || (!draft.currentValue && !draft.status)}
                      onClick={() => saveProgress(g)}
                      style={{ ...studioButton(accentColor, !!(draft.currentValue || draft.status)), height: '30px', padding: '0 12px', fontSize: '12px' }}
                    >
                      {savingId === g.id ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Update'}
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                    background: tint(getStatusColor(meta.dot), 0.1), border: `1px solid ${tint(getStatusColor(meta.dot), 0.35)}`,
                    borderRadius: '999px', padding: '4px 10px', height: '30px',
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

function GPField({ label, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: GREY, display: 'block', marginBottom: '6px' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
