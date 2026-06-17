import { Helmet } from 'react-helmet-async'
import { Zap, Star, BookOpen, Heart } from 'lucide-react'
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
    icon: Zap,
    title: 'Foundation & Elevation Blueprint',
    desc: 'CV, cover letters, coaching, and mentorship — reviewed by trained handlers and coaches.',
  },
  {
    icon: Star,
    title: 'Campus Connect',
    desc: 'Connect with your campus community. Boards for lost and found, carpooling, events, and more.',
  },
  {
    icon: BookOpen,
    title: 'Course Connect',
    desc: 'Find course mates, share notes, form study groups, and search by module code.',
  },
  {
    icon: Heart,
    title: 'Lifestyle Blueprint',
    desc: 'Student discounts, mental health resources, budgeting tools, and lifestyle deals.',
  },
]

// TODO: Replace with real App Store and Google Play links when live
function StoreButton({ label, light }) {
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: '52px', padding: '0 28px',
        background: light ? '#F5F0E8' : '#1E3A5F',
        color: light ? '#1E3A5F' : '#F5F0E8',
        border: 'none', borderRadius: '10px',
        fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export default function DownloadPage() {
  return (
    <>
      <Helmet>
        <title>Download | UniBlueprint</title>
        <meta name="description" content="Download the UniBlueprint app for iOS and Android — the all-in-one platform for students and young people in Ireland, launching September 2026." />
        <script type="application/ld+json">{JSON.stringify(APP_JSON_LD)}</script>
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <UBPLogo height={48} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Download UniBlueprint
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          Everything you need to succeed at university — in one app. Launching September 2026.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <StoreButton label="App Store" />
          <StoreButton label="Google Play" />
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
          Launching September 2026
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Sign up for early access and be first on your campus.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
          <StoreButton label="App Store" light />
          <StoreButton label="Google Play" light />
        </div>
      </section>
    </>
  )
}
