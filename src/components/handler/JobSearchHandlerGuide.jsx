import { ShieldAlert } from 'lucide-react'

/**
 * The Handler-only guidance generated alongside a Job Search Support strategy —
 * diagnostic questions and talking points for the live advisory conversation,
 * plus a wellbeing flag and an interview-prep redirect where the model raised
 * one.
 *
 * Shared between JobSearchSupportPage (a harmless dev/admin preview — it only
 * resolves for an account that is itself a Handler or Operations, which is
 * never the real student) and HandlerQueuePage's ticket view, where it is the
 * actual Handler-facing surface, reachable once handler_assignments exists for
 * the session.
 */
export default function JobSearchHandlerGuide({ guide }) {
  if (!guide) return null
  return (
    <div style={{ border: '2px dashed #9C6B26', borderRadius: '10px', padding: '18px', background: 'rgba(156,107,38,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <ShieldAlert size={16} color="#9C6B26" aria-hidden="true" />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#9C6B26', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Handler only — do not share this section with the student
        </p>
      </div>
      {guide.redirect_to_interview_prep && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#7A1D1D', marginBottom: '10px', fontWeight: 600 }}>
          Redirect flag: {guide.redirect_reason}
        </p>
      )}
      {guide.wellbeing_note && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', marginBottom: '10px' }}>{guide.wellbeing_note}</p>
      )}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '6px' }}>Opening questions</p>
      <ul style={{ margin: '0 0 12px', paddingLeft: '18px' }}>
        {guide.diagnostic_opening_questions?.map((q, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{q}</li>)}
      </ul>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', marginBottom: '6px' }}>Talking points</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {guide.talking_points?.map((t, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{t}</li>)}
      </ul>
    </div>
  )
}
