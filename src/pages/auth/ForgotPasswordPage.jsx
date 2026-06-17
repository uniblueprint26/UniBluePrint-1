import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import {
  submitButtonStyle,
  submitButtonDisabledStyle,
  errorBannerStyle,
  linkStyle,
} from '../../styles/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '24px',
            color: '#1E3A5F',
            marginBottom: '8px',
          }}>
            Check your email
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '24px',
          }}>
            Reset link sent to <strong style={{ color: '#1E3A5F' }}>{email}</strong>
          </p>
          <Link
            to="/sign-in"
            style={{
              ...linkStyle,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
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
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="jane@example.com"
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
            ) : 'Send Reset Link'}
          </button>
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link
          to="/sign-in"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
