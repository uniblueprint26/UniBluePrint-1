import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import { FormCheckbox, syncMailchimp } from '../../components/ui/Form'
import { getReferralCode } from '../../hooks/useReferralCapture'
import {
  submitButtonStyle,
  submitButtonDisabledStyle,
  errorBannerStyle,
  belowCardStyle,
  linkStyle,
} from '../../styles/auth'

// Members must be 18 or over. Keep in step with app/src/constants/legal.js
// (MIN_SIGNUP_AGE) and the database check. The versions below are the
// "Last updated" month of /terms and /privacy, recorded as consent.
const MIN_SIGNUP_AGE = 18
const TERMS_VERSION = '2026-09'
const PRIVACY_VERSION = '2026-09'

// "YYYY-MM-DD" from a date input. Returns a Date at local midnight or null.
function parseDob(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null
  return d
}

function isAtLeastAge(dob, years) {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - years)
  return dob <= cutoff
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', dob: '' })
  // Pre-filled from ?ref=<code> if someone arrived via a friend's invite
  // link (see useReferralCapture) — still editable, so someone who was
  // handed a code by word of mouth rather than a link can type it in too.
  // Attribution only, see the referral_tracking migration: this never
  // affects price, access, or anything billing-related.
  const [referralCode, setReferralCode] = useState(() => getReferralCode())
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters'
    const dob = parseDob(form.dob)
    if (!form.dob) errs.dob = 'Date of birth is required'
    else if (!dob || dob > new Date() || dob.getFullYear() < 1900) errs.dob = 'Enter a valid date of birth'
    else if (!isAtLeastAge(dob, MIN_SIGNUP_AGE)) errs.dob = `UniBlueprint is for people aged ${MIN_SIGNUP_AGE} and over.`
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: {
          full_name: form.fullName,
          marketing_consent: marketingConsent,
          date_of_birth: form.dob,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
          ...(referralCode.trim() ? { referred_by_code: referralCode.trim() } : {}),
        } },
      })
      if (err) throw err
      if (marketingConsent) syncMailchimp(form.email, form.fullName, 'sign_up')
      navigate('/verify-email', { state: { email: form.email } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your Blueprint"
      subtitle="Free to join. No card required."
      note="One UniBlueprint account, everywhere. The email and password you create here sign you in on the app too, Foundation Blueprint, Elevation Blueprint, and everything else you build live there."
      footer={
        <>
          <p style={belowCardStyle}>
            Already have an account?{' '}
            <Link to="/sign-in" style={linkStyle}>Sign in</Link>
          </p>
          <p style={{ ...belowCardStyle, marginTop: '10px' }}>
            Not ready for an account?{' '}
            <Link to="/coming-soon" style={linkStyle}>Just leave your email</Link>
          </p>
        </>
      }
    >
      {error && (
        <div style={errorBannerStyle}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#DC2626' }}>
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Full name"
          type="text"
          value={form.fullName}
          onChange={set('fullName')}
          error={fieldErrors.fullName}
          autoComplete="name"
          placeholder="Jane Murphy"
        />
        <AuthInput
          label="Email address"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="jane@example.com"
        />
        <AuthInput
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={set('dob')}
          error={fieldErrors.dob}
          hint="You must be 18 or over."
          autoComplete="bday"
        />
        <AuthInput
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="At least 8 characters"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <AuthInput
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <AuthInput
          label="Invite code (optional)"
          type="text"
          value={referralCode}
          onChange={e => setReferralCode(e.target.value)}
          hint="Got invited by a friend? Enter their code here."
          autoComplete="off"
          placeholder="e.g. a1b2c3d4"
        />

        <div style={{ marginTop: '4px' }}>
          <FormCheckbox
            id="signup-marketing-consent"
            checked={marketingConsent}
            onChange={e => setMarketingConsent(e.target.checked)}
            label="Send me marketing emails about UniBlueprint (optional, separate from your account, you can unsubscribe any time)."
          />
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '8px', lineHeight: 1.6,
        }}>
          By creating an account you agree to our{' '}
          <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</Link>
          .
        </p>

        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            disabled={loading}
            style={loading ? submitButtonDisabledStyle : submitButtonStyle}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Please wait...
              </>
            ) : 'Create Account'}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
