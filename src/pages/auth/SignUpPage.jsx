import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import {
  submitButtonStyle,
  submitButtonDisabledStyle,
  errorBannerStyle,
  belowCardStyle,
  linkStyle,
} from '../../styles/auth'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
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
        options: { data: { full_name: form.fullName } },
      })
      if (err) throw err
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
      note="One UniBlueprint account, everywhere. The email and password you create here sign you in on the app too — Foundation Blueprint, Elevation Blueprint, and everything else you build live there."
      footer={
        <p style={belowCardStyle}>
          Already have an account?{' '}
          <Link to="/sign-in" style={linkStyle}>Sign in</Link>
        </p>
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
