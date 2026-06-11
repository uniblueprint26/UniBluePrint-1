import { Link } from 'react-router-dom'
import logo from '../../assets/ubp-logo.png'

export default function AuthLayout({ title, subtitle, children, footer }) {
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
          <Link to="/">
            <img src={logo} alt="Uniblueprint logo" width="80" height="80" loading="lazy" style={{ width: '80px', height: '80px' }} />
          </Link>
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
      </div>
    </div>
  )
}
