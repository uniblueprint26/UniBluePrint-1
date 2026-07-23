import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import { FormField, FormSelect, FormInput } from '../../components/ui/Form'
import { UNIVERSITIES } from '../../data/contributorCategories'
import {
  submitButtonStyle,
  submitButtonDisabledStyle,
  errorBannerStyle,
  belowCardStyle,
  linkStyle,
} from '../../styles/auth'

const PATHWAYS = [
  'College / University',
  'PLC / Further Education',
  'Apprenticeship',
  'Gap Year',
  'Straight Into Work',
  'Repeating the Leaving Cert',
  'Not sure yet',
]

const PATHWAY_DETAIL_LABEL = {
  'PLC / Further Education': 'Where are you doing it?',
  'Apprenticeship': 'Employer / trade',
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [pathway, setPathway] = useState('')
  const [pathwayDetail, setPathwayDetail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handlePathwayChange = (e) => {
    setPathway(e.target.value)
    setPathwayDetail('')
  }

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
      const { data, error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (err) throw err
      if (pathway && data?.user?.id) {
        await supabase
          .from('profiles')
          .update({ pathway, pathway_detail: pathwayDetail || null })
          .eq('id', data.user.id)
      }
      navigate('/dashboard')
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

        <div style={{ marginBottom: '16px' }}>
          <FormField id="pathway" label="What are you doing after school? (optional)" hint="Helps us show you the most relevant content — every avenue is welcome here.">
            <FormSelect id="pathway" value={pathway} onChange={handlePathwayChange}>
              <option value="">Prefer not to say</option>
              {PATHWAYS.map(p => <option key={p} value={p}>{p}</option>)}
            </FormSelect>
          </FormField>

          {pathway === 'College / University' && (
            <div style={{ marginTop: '12px' }}>
              <FormField id="pathway-detail" label="Which college?">
                <FormSelect id="pathway-detail" value={pathwayDetail} onChange={e => setPathwayDetail(e.target.value)}>
                  <option value="">Select a college</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </FormSelect>
              </FormField>
            </div>
          )}

          {PATHWAY_DETAIL_LABEL[pathway] && (
            <div style={{ marginTop: '12px' }}>
              <FormField id="pathway-detail" label={PATHWAY_DETAIL_LABEL[pathway]}>
                <FormInput
                  id="pathway-detail"
                  value={pathwayDetail}
                  onChange={e => setPathwayDetail(e.target.value)}
                  placeholder={pathway === 'Apprenticeship' ? 'e.g. ESB, Electrical' : 'e.g. City of Dublin PLC College'}
                />
              </FormField>
            </div>
          )}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '8px', lineHeight: 1.6,
        }}>
          By creating an account you agree to UniBlueprint's Terms and Privacy Policy.
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
