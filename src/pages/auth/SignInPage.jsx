import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
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

export default function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const successMessage = location.state?.message

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    if (!form.password) errs.password = 'Password is required'
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
      const { error: err } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (err) throw err
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Blueprint"
      footer={
        <p style={belowCardStyle}>
          New to UniBlueprint?{' '}
          <Link to="/sign-up" style={linkStyle}>Create account</Link>
        </p>
      }
    >
      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#16A34A' }}>
            {successMessage}
          </span>
        </div>
      )}

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
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '20px' }}>
          <Link
            to="/forgot-password"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#1E3A5F',
              fontWeight: '500',
            }}
          >
            Forgot your password?
          </Link>
        </div>

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
          ) : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  )
}
