import UBPLogo from '../ui/UBPLogo'

export default function AuthLayout({ title, subtitle, children, footer, note }) {
  return (
    <div style={{
      background: '#F5F0E8',
      padding: '80px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center' }}>
          <a href="/" aria-label="UniBlueprint home" style={{ display: 'inline-block' }}>
            <UBPLogo height={80} />
          </a>
        </div>

        {title && (
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '32px',
            color: '#1E3A5F',
            textAlign: 'center',
            marginTop: '8px',
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
        )}

        {subtitle && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: '#6B7280',
            textAlign: 'center',
            marginTop: '8px',
          }}>
            {subtitle}
          </p>
        )}

        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30, 58, 95, 0.08)',
          padding: '32px',
          marginTop: '24px',
        }}>
          {children}
        </div>

        {footer && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            {footer}
          </div>
        )}

        {note && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12.5px',
            color: '#9CA3AF',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: 1.6,
          }}>
            {note}
          </p>
        )}
      </div>
    </div>
  )
}
