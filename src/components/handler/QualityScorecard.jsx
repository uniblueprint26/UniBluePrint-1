import { useMemo } from 'react'

/**
 * The Handler's quality review of a generated output — five dimensions, scored
 * 1 to 5, summed into a composite out of 25.
 *
 * Nothing is pre-scored. A range input has no "unset" state, so the thumb rests
 * at the midpoint while the score reads "—", and a dimension only counts as
 * scored once the Handler actually touches it. Resting at the midpoint rather
 * than at 1 matters: a 1 is the score that blocks approval outright, and a
 * control that looks like it is already sitting on 1 would misrepresent what
 * has been recorded.
 */

export const DIMENSIONS = [
  {
    key: 'accuracy',
    label: 'Accuracy',
    description: 'Does the output accurately reflect what the student submitted?',
    anchors: {
      1: 'Output contradicts the submission — flag immediately',
      3: 'Mostly accurate with minor misalignments',
      5: 'Every factual detail matches the submission exactly',
    },
  },
  {
    key: 'quality',
    label: 'Quality',
    description: 'Is this output genuinely good?',
    anchors: {
      1: 'Poor — would not represent the student well',
      3: 'Adequate — gets the job done but not remarkable',
      5: 'Excellent — would impress a professional reviewer',
    },
  },
  {
    key: 'completeness',
    label: 'Completeness',
    description: 'Does the output contain everything it should?',
    anchors: {
      1: 'Significant sections missing — flag immediately',
      3: 'One minor element missing',
      5: 'Everything present — nothing missing',
    },
  },
  {
    key: 'tone',
    label: 'Tone and Voice',
    description: 'Does it sound like a professional version of this student — not a robot?',
    anchors: {
      1: 'Clearly AI-generated — no human voice present',
      3: 'Professional but generic',
      5: 'Sounds authentically like a professional version of this specific student',
    },
  },
  {
    key: 'deliverability',
    label: 'Deliverability',
    description: 'Could the student use this right now without changing anything?',
    anchors: {
      1: 'Not deliverable — placeholder brackets, incomplete sentences, formatting errors',
      3: 'Minor tidy-up needed before use',
      5: 'Ready to use immediately — zero action required from the student',
    },
  },
]

const SCORE_COLOURS = { 1: '#DC2626', 2: '#F59E0B', 3: '#1E3A5F', 4: '#1E3A5F', 5: '#16A34A' }

export function compositeBand(total) {
  if (total >= 21) return { colour: '#16A34A', label: 'Excellent — ready to approve' }
  if (total >= 16) return { colour: '#1E3A5F', label: 'Good — approve with thorough note' }
  if (total >= 11) return { colour: '#F59E0B', label: 'Borderline — review carefully' }
  return { colour: '#DC2626', label: 'Low score — consider flagging' }
}

const SLIDER_CSS = `
.ubp-score-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px;
  border-radius: 3px; outline: none; cursor: pointer; }
.ubp-score-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: 50%; background: #1E3A5F; cursor: pointer;
  border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(30,58,95,0.35); }
.ubp-score-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%;
  background: #1E3A5F; cursor: pointer; border: 2px solid #FFFFFF; }
.ubp-score-slider:focus-visible { box-shadow: 0 0 0 3px rgba(30,58,95,0.25); }
`

function DimensionRow({ dimension, score, onScore }) {
  const scored = score !== null && score !== undefined
  // Filled portion of the track, navy up to the thumb and cream beyond it.
  const pct = scored ? ((score - 1) / 4) * 100 : 0
  const track = scored
    ? `linear-gradient(to right, #1E3A5F 0%, #1E3A5F ${pct}%, #F5F0E8 ${pct}%, #F5F0E8 100%)`
    : '#F5F0E8'

  return (
    <div style={{ paddingTop: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#1E3A5F' }}>{dimension.label}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '2px', lineHeight: 1.5 }}>
            {dimension.description}
          </p>
        </div>
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '18px', minWidth: '22px', textAlign: 'right',
            color: scored ? SCORE_COLOURS[score] : '#D1D5DB',
          }}
        >
          {scored ? score : '—'}
        </span>
      </div>

      <input
        className="ubp-score-slider"
        type="range" min={1} max={5} step={1}
        value={scored ? score : 3}
        style={{ background: track, marginTop: '10px' }}
        aria-label={`${dimension.label}: ${dimension.description}`}
        aria-valuetext={scored ? `${score} of 5 — ${dimension.anchors[score] || ''}` : 'Not scored yet'}
        onChange={(e) => onScore(Number(e.target.value))}
        // A click that lands on the value the thumb already rests at fires no
        // change event, so committing on pointer/key release is what lets a
        // Handler deliberately score the midpoint.
        onPointerUp={(e) => onScore(Number(e.currentTarget.value))}
        onKeyUp={(e) => onScore(Number(e.currentTarget.value))}
      />

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: scored ? '#6B7280' : '#9CA3AF', marginTop: '6px', lineHeight: 1.5, minHeight: '18px' }}>
        {scored ? (dimension.anchors[score] || '') : 'Not scored yet — drag or click to score'}
      </p>
    </div>
  )
}

export default function QualityScorecard({ scores, onChange }) {
  const complete = DIMENSIONS.every((d) => scores[d.key] !== null && scores[d.key] !== undefined)
  const total = useMemo(
    () => DIMENSIONS.reduce((sum, d) => sum + (scores[d.key] || 0), 0),
    [scores],
  )
  const band = compositeBand(total)
  const lowDimensions = DIMENSIONS.filter((d) => scores[d.key] === 1)

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '24px', margin: '16px' }}>
      <style>{SLIDER_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Your Quality Review
        </span>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: complete ? band.colour : '#D1D5DB' }}>
          {complete ? `${total}/25` : '—/25'}
        </span>
      </div>

      {DIMENSIONS.map((d) => (
        <DimensionRow
          key={d.key}
          dimension={d}
          score={scores[d.key]}
          onScore={(value) => onChange({ ...scores, [d.key]: value })}
        />
      ))}

      <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(30,58,95,0.08)', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: complete ? band.colour : '#D1D5DB' }}>
          {complete ? `${total}/25` : '—'}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: complete ? band.colour : '#9CA3AF', marginTop: '2px' }}>
          {complete ? band.label : 'Score all five dimensions to see your composite'}
        </p>
      </div>

      {lowDimensions.length > 0 && (
        <div role="alert" style={{ marginTop: '16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#DC2626', lineHeight: 1.55 }}>
            A score of 1 on {lowDimensions.map((d) => d.label).join(' and ')} indicates a serious quality issue. This ticket must be flagged to Operations.
          </p>
        </div>
      )}
    </div>
  )
}
