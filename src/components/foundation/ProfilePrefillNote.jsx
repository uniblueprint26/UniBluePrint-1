import { Link } from 'react-router-dom'

/**
 * Shown on a builder page after it has silently filled fields from the user's
 * Career Profile / active application target. Used identically across every
 * builder so the behaviour reads as one consistent system, not a per-page
 * surprise — and always says the same thing: this is a starting point, not a
 * locked answer.
 */
export default function ProfilePrefillNote() {
  return (
    <div style={{
      background: 'rgba(30,58,95,0.05)', borderRadius: '8px', padding: '12px 14px',
      marginBottom: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px',
      color: '#1E3A5F', lineHeight: 1.6,
    }}>
      We've filled in what we already know from your{' '}
      <Link to="/foundation/career-profile" style={{ color: '#1E3A5F', fontWeight: 600 }}>Career Profile</Link>.
      Change anything here — what you type on this form is what we'll use.
    </div>
  )
}
