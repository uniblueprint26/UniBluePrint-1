import { Loader2, Plus } from 'lucide-react'
import { FormCard } from '../ui/Form'

/**
 * Shared step furniture for QuestionFlow-based Foundation Blueprint
 * questionnaires — pulled out of the CV Optimisation rebuild (the reference
 * implementation) so each following service reuses these instead of
 * re-copying the same ~150 lines. A service-specific step builder computes
 * its own `rows`/copy and passes them in; nothing here knows about CVs,
 * LinkedIn profiles, or any other service.
 */

/**
 * Label/value rows in tinted cards, with an optional intro paragraph above
 * them. Used for both the profile-confirm opener ("here's what we already
 * know") and the closing summary ("here's what we'll build from") — those
 * two steps are visually identical, just with different intro text, an
 * emptyLabel only the opener needs, and rows computed differently.
 */
export function SummaryRows({ intro, rows, emptyLabel }) {
  return (
    <div>
      {intro && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.6 }}>
          {intro}
        </p>
      )}
      {rows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F5F0E8', borderRadius: '8px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>{label}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#1E3A5F', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      ) : emptyLabel ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#9CA3AF' }}>{emptyLabel}</p>
      ) : null}
    </div>
  )
}

/** Offered when a returning student has an unfinished draft for this service. */
export function ResumeDraftCard({ onResume, onDiscard, title, description }) {
  return (
    <FormCard>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }}>
        {title || 'You have an unfinished request'}
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>
        {description || 'Continue where you left off, or start fresh — either way, nothing is lost until you choose.'}
      </p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="button" onClick={onResume} style={{ height: '46px', padding: '0 22px', background: '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Continue where I left off
        </button>
        <button type="button" onClick={onDiscard} style={{ height: '46px', padding: '0 18px', background: 'none', color: '#6B7280', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}>
          Start fresh
        </button>
      </div>
    </FormCard>
  )
}

/** Shown while the draft check / profile load is still in flight, before QuestionFlow can render at all. */
export function LoadingLine({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px 0', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> {label}
    </div>
  )
}

/** A single-select list of tappable cards — for a question with a handful of named options (e.g. an experience-level band). */
export function ChoiceGrid({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)}
          style={{
            textAlign: 'left', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
            border: value === o.value ? '2px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.15)',
            background: value === o.value ? 'rgba(30,58,95,0.05)' : '#FFFFFF',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: value === o.value ? 600 : 500, color: '#1E3A5F',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** "+ Add another …" affordance under a list of repeating entry cards. */
export function AddRowButton({ onClick, label }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px dashed rgba(30,58,95,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#1E3A5F', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}
    >
      <Plus size={14} aria-hidden="true" /> {label}
    </button>
  )
}

/** Shared style tokens for repeating-entry cards (education, experience, etc.) and section headings. */
export const repeatCard = { position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#F5F0E8', borderRadius: '10px' }
export const removeBtn = { position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }
export const sectionHeading = { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F' }

/** Comma-separated free text -> trimmed, deduped-nothing, blank-filtered array. Used wherever a question collects a flat list as one input. */
export function splitCsv(v) { return (v || '').split(',').map((s) => s.trim()).filter(Boolean) }
