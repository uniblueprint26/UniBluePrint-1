import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Loader2, ArrowLeft, Clock, Zap, Check, Flag, AlertTriangle, ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUnclaimedQueue, fetchMyActiveAssignments, fetchSubmissionDetail,
  claimSubmission, startReview, deliverSubmission, flagSubmission, markIncomplete,
  hasTwoSentences,
} from '../../lib/handlerQueue'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { FormCard, ErrorBanner } from '../../components/ui/Form'

/**
 * The Campus Handler review queue — /handler/queue.
 *
 * Two lists (unclaimed, mine), one detail view. Deliberately functional
 * rather than polished: the content view renders input/generated jsonb
 * generically across all 7 document types rather than 7 bespoke renderers,
 * matching the same "visibility over prettiness" call MyDocumentsPage made.
 */
export default function HandlerQueuePage() {
  const { user } = useAuth()
  const { runLocked } = useSubmitLock()
  const [tab, setTab] = useState('queue')
  const [unclaimed, setUnclaimed] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [claimingId, setClaimingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [q, m] = await Promise.all([fetchUnclaimedQueue(), fetchMyActiveAssignments(user.id)])
      setUnclaimed(q)
      setMine(m)
    } catch (err) {
      setError(err.message || 'Could not load the queue.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  const handleClaim = (submissionId) => runLocked(async () => {
    setClaimingId(submissionId)
    setError('')
    try {
      await claimSubmission(submissionId)
      await load()
      setTab('mine')
    } catch (err) {
      setError(err.message)
    } finally {
      setClaimingId(null)
    }
  })

  if (selected) {
    return (
      <SubmissionDetail
        submission={selected}
        onBack={() => setSelected(null)}
        onResolved={async () => { setSelected(null); await load() }}
      />
    )
  }

  return (
    <>
      <Helmet><title>Handler Queue | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Home
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>Handler Queue</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '28px', lineHeight: 1.7 }}>
          Claim a submission to review it. Every decision needs a note before it can go through.
        </p>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          <TabButton active={tab === 'queue'} onClick={() => setTab('queue')} label={`Unclaimed (${unclaimed.length})`} />
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} label={`My assignments (${mine.length})`} />
        </div>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading…
          </div>
        ) : tab === 'queue' ? (
          unclaimed.length === 0 ? (
            <EmptyState text="Nothing waiting — the queue is clear." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unclaimed.map((s) => (
                <QueueRow
                  key={s.id} submission={s}
                  action={
                    <button
                      type="button" onClick={() => handleClaim(s.id)} disabled={claimingId === s.id}
                      style={primaryButtonSmall(claimingId === s.id)}
                    >
                      {claimingId === s.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Claim'}
                    </button>
                  }
                />
              ))}
            </div>
          )
        ) : mine.length === 0 ? (
          <EmptyState text="Nothing currently assigned to you." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mine.map((s) => (
              <QueueRow key={s.id} submission={s} onClick={() => setSelected(s)} clickable />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function QueueRow({ submission: s, action, onClick, clickable }) {
  const overdue = s.turnaround_deadline && new Date(s.turnaround_deadline) < new Date()
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
        cursor: clickable ? 'pointer' : 'default',
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
          {s.marked_incomplete && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,0.1)', padding: '2px 7px', borderRadius: '9px' }}>
              Marked incomplete
            </span>
          )}
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#374151', marginTop: '4px' }}>{s.notes || 'No label given'}</p>
        {s.turnaround_deadline && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: overdue ? '#DC2626' : '#9CA3AF', marginTop: '4px' }}>
            <Clock size={11} aria-hidden="true" />
            {overdue ? 'Overdue — due ' : 'Due '}{new Date(s.turnaround_deadline).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
        padding: '10px 18px', borderRadius: '8px', border: active ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
        background: active ? '#1E3A5F' : '#FFFFFF', color: active ? '#F5F0E8' : '#1E3A5F',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
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

function SubmissionDetail({ submission, onBack, onResolved }) {
  const { runLocked } = useSubmitLock()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSubmissionDetail(submission)
      .then((d) => { if (!cancelled) setDetail(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    // Best-effort — moves the pipeline stage to in_review, but the review is
    // still usable even if this particular call fails.
    if (submission.stage === 'assigned') startReview(submission.id).catch(() => {})
    return () => { cancelled = true }
  }, [submission])

  const noteValid = hasTwoSentences(note)

  const handleAction = (label, fn) => runLocked(async () => {
    if (!noteValid) { setError('Add a Handler note — at least two sentences — before submitting a decision.'); return }
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
          </div>

          {detail.handlerNotes?.length > 0 && (
            <div style={{ border: '2px dashed #9C6B26', borderRadius: '10px', padding: '16px 18px', background: 'rgba(156,107,38,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <ShieldAlert size={15} color="#9C6B26" aria-hidden="true" />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes from the generator</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {detail.handlerNotes.map((n, i) => (
                  <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <FormCard title="Student's submission">
            <DataView value={detail.input} />
          </FormCard>

          <FormCard title="Generated output">
            <DataView value={detail.generated} skipKeys={['handler_notes', 'benchmarked_against']} />
          </FormCard>

          <FormCard title="Your decision">
            <label htmlFor="handler_note" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A5F', display: 'block', marginBottom: '6px' }}>
              Handler note <span style={{ color: '#DC2626' }}>*</span>
              <span style={{ fontWeight: 400, color: '#9CA3AF' }}> — at least two sentences, required for any decision</span>
            </label>
            <textarea
              id="handler_note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000}
              style={{ width: '100%', border: '1.5px solid rgba(30,58,95,0.2)', borderRadius: '8px', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#1E3A5F', boxSizing: 'border-box', resize: 'vertical' }}
            />
            {note && !noteValid && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#DC2626', marginTop: '5px' }}>Needs at least two sentences.</p>
            )}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <ActionButton
                label="Approve and deliver" icon={Check} tone="primary"
                busy={acting === 'deliver'} onClick={handleAction('deliver', deliverSubmission)}
              />
              <ActionButton
                label="Flag to Operations" icon={Flag} tone="secondary"
                busy={acting === 'flag'} onClick={handleAction('flag', flagSubmission)}
              />
              <ActionButton
                label="Mark incomplete" icon={AlertTriangle} tone="secondary"
                busy={acting === 'incomplete'} onClick={handleAction('incomplete', markIncomplete)}
              />
            </div>
          </FormCard>
        </div>
      ) : null}
    </div>
  )
}

function ActionButton({ label, icon: Icon, tone, busy, onClick }) {
  const primary = tone === 'primary'
  return (
    <button
      type="button" onClick={onClick} disabled={busy}
      style={{
        height: '44px', padding: '0 18px', borderRadius: '8px',
        border: primary ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
        background: busy ? 'rgba(30,58,95,0.5)' : primary ? '#1E3A5F' : '#FFFFFF',
        color: primary ? '#F5F0E8' : '#1E3A5F',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
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
