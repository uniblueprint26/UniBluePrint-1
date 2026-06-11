import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

// ─── UTM helper ───────────────────────────────────────────────────────────────

export function getUTM() {
  try {
    return JSON.parse(sessionStorage.getItem('ubp_utm') || '{}')
  } catch {
    return {}
  }
}

// ─── Error helper ─────────────────────────────────────────────────────────────

export function parseDbError(dbError) {
  if (!dbError) return null
  if (dbError.code === '23505') return 'This email address is already registered.'
  if (
    !navigator.onLine ||
    dbError.message?.toLowerCase().includes('fetch') ||
    dbError.message?.toLowerCase().includes('network')
  ) {
    return 'Network error. Please check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

// ─── SubmitButton ─────────────────────────────────────────────────────────────

export function SubmitButton({ loading, label = 'Submit', loadingLabel = 'Please wait...' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-disabled={loading}
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
      {loading && <Loader2 size={18} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />}
      {loading ? loadingLabel : label}
    </button>
  )
}

// ─── SuccessCard ──────────────────────────────────────────────────────────────

export function SuccessCard({
  title = 'Submitted successfully',
  subtitle = 'We will be in touch within 2 business days.',
}) {
  return (
    <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <CheckCircle
        size={56}
        color="#16A34A"
        aria-hidden="true"
        style={{ margin: '0 auto 16px', display: 'block' }}
      />
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '24px', color: '#1E3A5F',
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', color: '#6B7280',
        marginTop: '8px', lineHeight: 1.6,
      }}>
        {subtitle}
      </p>
    </div>
  )
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex', alignItems: 'flex-start',
        gap: '10px',
        background: 'rgba(220,38,38,0.1)',
        borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
      }}
    >
      <AlertCircle size={18} color="#DC2626" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }} />
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#DC2626', lineHeight: 1.5, flex: 1,
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

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({ id, label, hint, error, required, children }) {
  const errorId = id ? `${id}-error` : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', fontWeight: '500', color: '#1E3A5F',
        }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
      </label>
      {hint && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '-2px' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#DC2626', marginTop: '2px' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Shared input styles ──────────────────────────────────────────────────────

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

const focusOn  = e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }
const focusOff = e => { e.target.style.borderColor = 'rgba(30,58,95,0.2)'; e.target.style.boxShadow = 'none' }

// ─── FormInput ────────────────────────────────────────────────────────────────

export function FormInput({
  id, value, onChange, placeholder,
  type = 'text', required,
  'aria-describedby': describedBy,
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      aria-required={required || undefined}
      aria-describedby={describedBy}
      style={inputBase}
      onFocus={focusOn}
      onBlur={focusOff}
    />
  )
}

// Backwards-compatible alias
export const TextInput = FormInput

// ─── FormSelect ───────────────────────────────────────────────────────────────

export function FormSelect({
  id, value, onChange, children, required,
  'aria-describedby': describedBy,
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      aria-required={required || undefined}
      aria-describedby={describedBy}
      style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}
      onFocus={focusOn}
      onBlur={focusOff}
    >
      {children}
    </select>
  )
}

// Backwards-compatible alias
export const SelectInput = FormSelect

// ─── FormTextarea ─────────────────────────────────────────────────────────────

export function FormTextarea({
  id, value, onChange, placeholder,
  rows = 4, required,
  'aria-describedby': describedBy,
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      aria-required={required || undefined}
      aria-describedby={describedBy}
      style={{
        ...inputBase,
        height: 'auto', padding: '12px 14px',
        resize: 'vertical', lineHeight: 1.6,
      }}
      onFocus={focusOn}
      onBlur={focusOff}
    />
  )
}

// Backwards-compatible alias
export const TextArea = FormTextarea

// ─── FormCheckbox ─────────────────────────────────────────────────────────────

export function FormCheckbox({ id, checked, onChange, label, required }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#1E3A5F', lineHeight: 1.5,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        required={required}
        aria-required={required || undefined}
        style={{
          width: '18px', height: '18px',
          marginTop: '2px', flexShrink: 0,
          accentColor: '#1E3A5F',
          cursor: 'pointer',
        }}
      />
      {label}
    </label>
  )
}

// ─── FormCard ─────────────────────────────────────────────────────────────────

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
