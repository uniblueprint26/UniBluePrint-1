import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  placeholder,
  autoComplete,
  id,
}) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#1E3A5F',
            fontWeight: '500',
            marginBottom: '8px',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: '52px',
            background: '#FFFFFF',
            border: `1px solid ${error ? '#DC2626' : focused ? '#1E3A5F' : 'rgba(30, 58, 95, 0.2)'}`,
            borderRadius: '8px',
            padding: isPassword ? '0 48px 0 16px' : '0 16px',
            fontSize: '16px',
            fontFamily: "'DM Sans', sans-serif",
            color: '#1E3A5F',
            outline: 'none',
            boxShadow: focused && !error ? '0 0 0 3px rgba(30, 58, 95, 0.1)' : 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {hint && !error && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: '#9CA3AF',
          marginTop: '6px',
        }}>
          {hint}
        </p>
      )}

      {error && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: '#DC2626',
          marginTop: '8px',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
