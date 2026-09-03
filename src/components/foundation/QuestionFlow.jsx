import { useState, useMemo } from 'react'
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react'

/**
 * A one-question-at-a-time flow — the reusable engine behind Foundation
 * Blueprint's questionnaires.
 *
 * Built for CV Optimisation first, as the reference pattern the other 8
 * Foundation services will replicate. The core principle it exists to serve:
 * "the questionnaire is not a form, it is a conversation" — a mobile user
 * should see one question, one input, one Next, never a wall of fields.
 *
 * A "question" here is a coherent unit a person would answer as one beat —
 * contact details are one question, one education entry is one question —
 * not literally one HTML input per screen. Splitting "email" and "phone"
 * into separate screens would be the wrong kind of literal-mindedness the
 * spec's own framing ("a smart careers advisor", not "a government form")
 * argues against.
 *
 * Each step is: { key, render(ctx), title?, optional?, whyItHelps?, validate?,
 * skip? }. `render` gets { form, set, setPath } and returns the step's body —
 * full control, so callers reach for FormField/FormInput etc. directly rather
 * than this component reinventing field types. `skip(form)` lets a step drop
 * out entirely when its answer is already known (e.g. target industry, once
 * confirmed on the profile-check step) — the progress bar is computed only
 * over the steps actually being shown, so skipping never produces a
 * misleading "3 of 15" that was really "3 of 12".
 *
 * `initialStepKey` resumes a saved draft at the exact question the student
 * left on, rather than the data alone (the caller stashes the current
 * step's key into the draft's input._current_step on every autosave — see
 * CvBuilderPage/LinkedInOptimisationPage's saveDraft). Read once on mount
 * only: this is a resume point, not a controlled prop, so it does not fight
 * the user's own Back/Next navigation afterwards.
 */
export default function QuestionFlow({
  steps, form, onFieldChange, onComplete, completing, completeLabel,
  onStepAdvance, strapline, initialStepKey,
}) {
  const visibleSteps = useMemo(() => steps.filter((s) => !s.skip?.(form)), [steps, form])
  const [index, setIndex] = useState(() => {
    if (!initialStepKey) return 0
    // Against visibleSteps, not the raw step list — a step's position can
    // differ between the two once anything ahead of it is being skipped
    // (e.g. the profile-check opener, or the experience step for someone
    // who has none), and jumping to the wrong index would land on the
    // wrong question entirely.
    const i = visibleSteps.findIndex((s) => s.key === initialStepKey)
    return i > 0 ? i : 0
  })
  const [error, setError] = useState('')
  const clamped = Math.min(index, visibleSteps.length - 1)
  const current = visibleSteps[clamped]

  const set = (path) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    onFieldChange(path, value)
  }
  // For nested list updates (education/experience entries) the caller passes
  // a whole-object replacement rather than a dotted path — same onFieldChange,
  // just called directly rather than through the event-shaped `set` helper.
  const setPath = onFieldChange

  const goNext = async () => {
    if (current.validate) {
      const err = current.validate(form)
      if (err) { setError(err); return }
    }
    setError('')
    if (onStepAdvance) await onStepAdvance(current.key, clamped, visibleSteps.length)
    if (clamped === visibleSteps.length - 1) {
      onComplete()
      return
    }
    setIndex(clamped + 1)
  }
  const goBack = () => { setError(''); setIndex((i) => Math.max(i - 1, 0)) }
  const skipOptional = () => { setError(''); if (clamped === visibleSteps.length - 1) { onComplete(); return } setIndex(clamped + 1) }

  if (!current) return null
  const isLast = clamped === visibleSteps.length - 1

  return (
    <div>
      {strapline && clamped === 0 && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', marginBottom: '18px', lineHeight: 1.6 }}>
          {strapline}
        </p>
      )}

      <ProgressBar current={clamped} total={visibleSteps.length} />

      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '32px', marginTop: '16px' }}>
        {current.title && (
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F', marginBottom: current.optional ? '4px' : '20px' }}>
            {current.title}
          </h2>
        )}
        {current.optional && current.whyItHelps && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.5 }}>
            Optional — {current.whyItHelps}
          </p>
        )}

        {current.render({ form, set, setPath })}

        {error && (
          <p role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626', marginTop: '14px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', gap: '12px' }}>
          <button
            type="button" onClick={goBack} disabled={clamped === 0}
            style={{ background: 'none', border: 'none', color: clamped === 0 ? '#9CA3AF' : '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, cursor: clamped === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {current.optional && (
              <button
                type="button" onClick={skipOptional}
                style={{ background: 'none', border: 'none', color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', cursor: 'pointer' }}
              >
                Skip
              </button>
            )}
            <button
              type="button" onClick={goNext} disabled={isLast && completing}
              style={{ height: '46px', padding: '0 26px', background: (isLast && completing) ? 'rgba(30,58,95,0.7)' : '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: 600, cursor: (isLast && completing) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isLast && completing && <Loader2 size={16} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />}
              {isLast ? (completing ? 'Working…' : (completeLabel || 'Finish')) : 'Next'}
              {!isLast && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ current, total }) {
  const pct = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100)
  return (
    <div>
      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(30,58,95,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#1E3A5F', transition: 'width 200ms ease' }} />
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: '#9CA3AF', marginTop: '6px' }}>
        {current + 1} of {total}
      </p>
    </div>
  )
}

/** Shared field-cluster heading, matching the rest of the app's step headings. */
export const questionSubheading = { fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#6B7280', marginBottom: '18px', lineHeight: 1.6 }
