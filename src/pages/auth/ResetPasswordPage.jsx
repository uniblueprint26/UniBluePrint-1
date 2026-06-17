import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import {
  submitButtonStyle,
  submitButtonDisabledStyle,
  errorBannerStyle,
} from '../../styles/auth'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
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
      const { error: err } = await supabase.auth.updateUser({ password: form.password })
      if (err) throw err
      navigate('/sign-in', {
        state: { message: 'Password updated successfully. Please sign in.' },
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password">
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
          label="New password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="At least 8 characters"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <AuthInput
          label="Confirm new password"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
        />

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
            ) : 'Update Password'}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
