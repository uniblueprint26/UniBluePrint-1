import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Smartphone, ArrowLeft } from 'lucide-react'

// Old shareable links to one coach (/elevation/coach/:id) still resolve, so
// nothing a person saved or shared breaks. The website no longer shows
// individual coaches, their names or photos. Those live in the app, so this
// page simply sends people there.
export default function ElevationCoachProfilePage() {
  return (
    <>
      <Helmet>
        <title>Meet your coach in the app | UniBlueprint</title>
        <meta name="description" content="Coach profiles, pricing and booking are in the UniBlueprint app." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <section style={{
        background: '#F5F0E8', minHeight: '70vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '96px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '460px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', background: '#1E3A5F',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          }}>
            <Smartphone size={24} color="#F5F0E8" aria-hidden="true" />
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', marginTop: '20px', lineHeight: 1.2 }}>
            Meet your coach in the app
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '12px', lineHeight: 1.7 }}>
            Coach profiles, pricing and booking live in the UniBlueprint app, so they are always up to date.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            <Link to="/download" style={{
              display: 'inline-flex', alignItems: 'center', height: '48px', padding: '0 24px',
              background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600,
            }}>
              Get the app
            </Link>
            <Link to="/elevation-blueprint" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', height: '48px', padding: '0 22px',
              color: '#1E3A5F', border: '1px solid rgba(30,58,95,0.2)', borderRadius: '8px', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600,
            }}>
              <ArrowLeft size={16} aria-hidden="true" /> What coaching covers
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
