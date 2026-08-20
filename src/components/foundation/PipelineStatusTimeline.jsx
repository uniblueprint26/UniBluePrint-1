import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Circle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * Where a submission actually is in the Handler review pipeline, for the
 * student who submitted it.
 *
 * Reads straight from `submissions` — "Users can read own submissions" (RLS,
 * already in place) covers this, no new policy or RPC needed. Escalation
 * state lives in handler_escalations, which students have no read access to
 * at all — there's no field to filter out here, it's structurally
 * unreachable, which is what "the student never sees the word escalated"
 * actually means in this schema rather than something this component has to
 * police itself.
 *
 * Steps 3 (Reviewed) and 4 (Delivered) complete at the same moment —
 * deliver_submission is one atomic action with no intermediate "reviewed,
 * not yet released" state in this pipeline. Shown as two steps to match the
 * requested shape, but honestly, not by inventing a distinction the data
 * doesn't have.
 */
export default function PipelineStatusTimeline({ submissionId }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!submissionId) { setLoading(false); return }
    let cancelled = false
    supabase
      .from('submissions')
      .select('stage, tier, submitted_at, assigned_at, in_review_at, delivered_at, turnaround_deadline, marked_incomplete')
      .eq('id', submissionId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setStatus(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [submissionId])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF' }}>
        <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading status…
      </div>
    )
  }
  if (!status) return null

  if (status.marked_incomplete) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '20px 24px', marginTop: '20px' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', color: '#374151', lineHeight: 1.65 }}>
          We need a little more information to complete your request. Our team will be in touch shortly.
        </p>
      </div>
    )
  }

  const inReview = status.stage === 'assigned' || status.stage === 'in_review'
  const delivered = status.stage === 'delivered'

  const steps = [
    { label: 'Submitted', complete: true, timestamp: status.submitted_at },
    { label: 'In Review', complete: inReview || delivered, current: inReview, timestamp: status.assigned_at || status.in_review_at },
    { label: 'Reviewed', complete: delivered, timestamp: status.delivered_at },
    { label: 'Delivered', complete: delivered, timestamp: status.delivered_at },
  ]

  const now = new Date()
  const deadline = status.turnaround_deadline ? new Date(status.turnaround_deadline) : null
  const pastDeadline = deadline && now > deadline && !delivered
  const approachingDeadline = deadline && !pastDeadline && !delivered && (deadline - now) < 1000 * 60 * 60 * (status.tier === 'premium' ? 4 : 8)

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '22px 24px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '78px' }}>
              {step.complete ? (
                <CheckCircle size={20} color="#16A34A" aria-hidden="true" />
              ) : step.current ? (
                <Clock size={20} color="#1E3A5F" aria-hidden="true" />
              ) : (
                <Circle size={20} color="#D1D5DB" aria-hidden="true" />
              )}
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, marginTop: '6px', textAlign: 'center',
                color: step.complete ? '#16A34A' : step.current ? '#1E3A5F' : '#9CA3AF',
              }}>
                {step.label}
              </p>
              {step.complete && step.timestamp && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: '#9CA3AF', marginTop: '2px', textAlign: 'center' }}>
                  {new Date(step.timestamp).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: step.complete ? '#16A34A' : '#E5E7EB', marginBottom: '22px' }} />
            )}
          </div>
        ))}
      </div>

      {!delivered && (
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>
            {status.tier === 'premium' ? 'Expected within 24 hours of submission' : 'Expected within 48 hours of submission'}
          </p>
          {pastDeadline ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626', marginTop: '4px' }}>
              We are working on this now and will deliver as soon as possible. Sorry for the wait.
            </p>
          ) : approachingDeadline ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9C6B26', marginTop: '4px' }}>
              Your output is on its way — we are reviewing now.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
