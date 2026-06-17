export const submitButtonStyle = {
  width: '100%',
  height: '52px',
  background: '#1E3A5F',
  color: '#F5F0E8',
  borderRadius: '8px',
  border: 'none',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

export const submitButtonDisabledStyle = {
  ...submitButtonStyle,
  opacity: 0.7,
  cursor: 'not-allowed',
}

export const errorBannerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  background: '#FEF2F2',
  border: '1px solid #FCA5A5',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '16px',
}

export const belowCardStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  color: '#6B7280',
  textAlign: 'center',
  marginTop: '24px',
}

export const linkStyle = {
  color: '#1E3A5F',
  fontWeight: '500',
}
