import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import UBPLogo from '../components/ui/UBPLogo'

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{
        background: '#F5F0E8', minHeight: '80vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '480px' }}>
          <Link to="/" aria-label="UniBlueprint home" style={{ display: 'inline-block', marginBottom: '32px' }}>
            <UBPLogo height={80} />
          </Link>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '96px', color: '#1E3A5F',
            lineHeight: 1, marginBottom: '16px',
            opacity: 0.15,
          }}>
            404
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#1E3A5F' }}>
            Page not found
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
            marginTop: '12px', lineHeight: 1.6,
          }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '48px', padding: '0 28px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Back to home
            </Link>
            <Link
              to="/help"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '48px', padding: '0 28px',
                background: 'none', color: '#1E3A5F',
                border: '1.5px solid rgba(30,58,95,0.2)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Help Centre
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
