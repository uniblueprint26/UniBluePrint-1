import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FileText, TrendingUp, Tag, Users } from 'lucide-react'
import UBPLogo from '../components/ui/UBPLogo'

const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'UniBlueprint',
  description: 'The all-in-one platform for students and young people in Ireland',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EducationApplication',
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Foundation Blueprint',
    desc: 'Professional career support — reviewed by Campus Handlers.',
  },
  {
    icon: TrendingUp,
    title: 'Elevation Blueprint',
    desc: 'Expert coaching from Uni Coaches.',
  },
  {
    icon: Tag,
    title: 'Lifestyle Blueprint',
    desc: 'Exclusive deals for Pro subscribers.',
  },
  {
    icon: Users,
    title: 'Campus Connect',
    desc: 'Your campus community online.',
  },
]

export default function DownloadPage() {
  return (
    <>
      <Helmet>
        <title>Download | UniBlueprint</title>
        <meta name="description" content="Download the UniBlueprint app for iOS and Android — the all-in-one platform for students and young people in Ireland, launching September 2026." />
        <meta property="og:title" content="Download | UniBlueprint" />
        <meta property="og:description" content="Download the UniBlueprint app for iOS and Android — the all-in-one platform for students and young people in Ireland, launching September 2026." />
        <script type="application/ld+json">{JSON.stringify(APP_JSON_LD)}</script>
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <UBPLogo height={80} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Download UniBlueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          Free to download. Free to join. Launching September 2026 across Irish campuses.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          {/* TODO: Replace href with real App Store link when live */}
          <a
            href="#"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              border: 'none', borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Download on the App Store
          </a>
          {/* TODO: Replace href with real Google Play link when live */}
          <a
            href="#"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 28px',
              background: '#F5F0E8', color: '#1E3A5F',
              border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Get it on Google Play
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginBottom: '40px',
          }}>
            Everything in one place
          </h2>
          <div className="about-team-grid">
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <f.icon size={22} color="#1E3A5F" />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#1E3A5F', marginBottom: '6px' }}>
                  {f.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Sign up for early access
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Create your free account and be ready to go when we launch.
        </p>
        <Link
          to="/sign-up"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 36px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '28px',
          }}
        >
          Create account →
        </Link>
      </section>
    </>
  )
}
