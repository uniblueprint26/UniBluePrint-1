import { Loader2, CheckCircle } from 'lucide-react'

export function SubmitButton({ loading, label = 'Submit', loadingLabel = 'Submitting...' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', height: '52px',
        background: loading ? 'rgba(30,58,95,0.7)' : '#1E3A5F',
        color: '#F5F0E8',
        borderRadius: '8px', border: 'none',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'background 150ms',
      }}
    >
      {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {loading ? loadingLabel : label}
    </button>
  )
}

export function SuccessCard({ title = 'Submitted successfully', subtitle = 'We will be in touch within 2 business days.' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 16px', display: 'block' }} />
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '24px', color: '#1E3A5F',
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {subtitle}
      </p>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '12px',
      background: '#FEF2F2', border: '1px solid #FCA5A5',
      borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
    }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#DC2626', lineHeight: 1.5,
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none', border: 'none',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#DC2626', fontWeight: '600',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function FormField({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', fontWeight: '500', color: '#1E3A5F',
      }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '-2px' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
          {error}
        </p>
      )}
    </div>
  )
}

const inputBase = {
  height: '48px', width: '100%',
  border: '1.5px solid rgba(30,58,95,0.2)',
  borderRadius: '8px', padding: '0 14px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '15px', color: '#1E3A5F',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
}

export function TextInput({ value, onChange, placeholder, type = 'text', required }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={inputBase}
      onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.2)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function SelectInput({ value, onChange, children, required }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}
      onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.2)'; e.target.style.boxShadow = 'none' }}
    >
      {children}
    </select>
  )
}

export function TextArea({ value, onChange, placeholder, rows = 4, required }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      style={{
        ...inputBase,
        height: 'auto', padding: '12px 14px',
        resize: 'vertical', lineHeight: 1.6,
      }}
      onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.2)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function FormCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '36px', maxWidth: '640px', margin: '0 auto',
    }}>
      {title && (
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '28px', color: '#1E3A5F',
        }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: '#6B7280',
          marginTop: '6px', lineHeight: 1.6,
        }}>
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: title ? '24px' : 0 }}>
        {children}
      </div>
    </div>
  )
}
