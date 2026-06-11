import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'

export default function VerifyEmailPage() {
  const location = useLocation()
  const email = location.state?.email || ''

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResend = async () => {
    if (!email) { setResendError('No email address found. Please sign up again.'); return }
    setResendError('')
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setResent(true)
    } catch (err) {
      setResendError(err.message || 'Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout title="Verify your email">
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: '104px',
          height: '104px',
          borderRadius: '50%',
          background: '#F5F0E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Mail size={52} color="#1E3A5F" />
        </div>

        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '28px',
          color: '#1E3A5F',
          marginBottom: '12px',
        }}>
          Check your inbox
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: '#6B7280',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          We sent a verification link to your email address. Click the link to activate your account.
        </p>

        {resendError && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#DC2626',
            marginBottom: '12px',
          }}>
            {resendError}
          </p>
        )}

        {resent ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#16A34A',
            marginBottom: '16px',
          }}>
            Email resent!
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: '1px solid #1E3A5F',
              borderRadius: '8px',
              padding: '11px 24px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              color: '#1E3A5F',
              cursor: resending ? 'not-allowed' : 'pointer',
              opacity: resending ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {resending ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Sending...
              </>
            ) : 'Resend email'}
          </button>
        )}

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: '#6B7280',
          marginTop: '8px',
        }}>
          Already verified?{' '}
          <Link to="/sign-in" style={{ color: '#1E3A5F', fontWeight: '500' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
