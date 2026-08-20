import { Zap, Clock } from 'lucide-react'

/**
 * Standard vs Premium turnaround, chosen at the point of submission — not
 * inferred from payment, since nothing currently charges for Premium. This is
 * what lets submit_document_for_review record a real turnaround_deadline
 * immediately, rather than tier sitting null forever the way it did before.
 */
export default function TierPicker({ value, onChange }) {
  return (
    <div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E3A5F', marginBottom: '8px' }}>
        Turnaround
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Option
          selected={value === 'standard'} onClick={() => onChange('standard')}
          icon={Clock} title="Standard" desc="Reviewed within 48 hours"
        />
        <Option
          selected={value === 'premium'} onClick={() => onChange('premium')}
          icon={Zap} title="Premium" desc="Reviewed same day"
        />
      </div>
    </div>
  )
}

function Option({ selected, onClick, icon: Icon, title, desc }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
        border: selected ? '2px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.15)',
        background: selected ? 'rgba(30,58,95,0.05)' : '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={13} color={selected ? '#1E3A5F' : '#9CA3AF'} aria-hidden="true" />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#1E3A5F' }}>{title}</span>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{desc}</p>
    </button>
  )
}
