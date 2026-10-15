import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, ExternalLink, CalendarDays, Smartphone } from 'lucide-react'
import { getCoachById } from '../data/coaches'

// ─── Elevation Blueprint — one coach's shareable preview page ─────────────────
//
// The "Partiful pattern" for Elevation coaches: a direct, public link to a
// single coach (uniblueprint.ie/elevation/coach/:id) that works for a
// visitor who is signed out and has never opened the app. Tapping it lands
// here, not on a sign-in wall — same real fields the grid card on
// ElevationBlueprintPage already shows to anyone browsing (name, category,
// location, services, headline price), just given its own addressable,
// shareable URL and its own link-preview metadata, so sharing one coach
// doesn't mean sharing (and scrolling through) all fifteen.
//
// Deliberately shows nothing beyond what the public grid card already
// reveals — no bio, no contact details — per Desmond's existing "enough to
// convert, not the full picture" rule for coaches on the website (see
// ../data/coaches.js). The two CTAs below are exactly the two real paths
// that already exist elsewhere: "Book This Coach" reuses the same booking
// page + query params the app's own coachBookingUrl() builds
// (app/src/constants/site.js), and "Get the App" is a plain link to
// /download — there is no app-side deep link for a specific coach today
// (navigation/linking.js has no per-item routes for anything in the app
// yet), so this page does not pretend to open one.
const SITE_URL = 'https://uniblueprint.ie'

function bookingUrl(coach) {
  const params = [
    `coach=${encodeURIComponent(`coach-${coach.id}`)}`,
    coach.name ? `name=${encodeURIComponent(coach.name)}` : null,
    coach.category ? `category=${encodeURIComponent(coach.category)}` : null,
  ].filter(Boolean).join('&')
  return `/elevation/book-coach?${params}`
}

export default function ElevationCoachProfilePage() {
  const { id } = useParams()
  const coach = getCoachById(id)

  if (!coach) {
    return (
      <>
        <Helmet>
          <title>Coach Not Found | UniBlueprint</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section style={{
          background: '#F5F0E8', minHeight: '70vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F' }}>
              Coach not found
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '12px' }}>
              This coach listing does not exist or has been removed.
            </p>
            <Link
              to="/elevation-blueprint"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '24px', color: '#1E3A5F',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              }}
            >
              <ArrowLeft size={16} /> See all coaches
            </Link>
          </div>
        </section>
      </>
    )
  }

  const { id: coachId, name, via, photo, category, location, services, accent, from, badge, href, crossLinkHref, crossLinkLabel } = coach
  const initial = name.charAt(0).toUpperCase()
  const canonicalUrl = `${SITE_URL}/elevation/coach/${coachId}`
  const ogImage = photo ? `${SITE_URL}${photo}` : `${SITE_URL}/og-image.png`
  const metaTitle = `${name} — ${category} | UniBlueprint Elevation`
  const metaDescription = `${name}${via ? ` (${via})` : ''}, ${category} in ${location}. ${services.join(', ')}. Book a session with a real Uni Coach on UniBlueprint.`

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: category,
    url: canonicalUrl,
    ...(photo ? { image: ogImage } : {}),
  }

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(personJsonLd)}</script>
      </Helmet>

      <section style={{ background: '#1E3A5F', padding: '48px 24px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <Link
            to="/elevation-blueprint"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: 'rgba(245,240,232,0.7)', fontFamily: "'DM Sans',sans-serif",
              fontSize: '13px', fontWeight: '600', textDecoration: 'none', marginBottom: '28px',
            }}
          >
            <ArrowLeft size={14} /> All Coaches
          </Link>
        </div>
      </section>

      <section style={{ background: '#F5F0E8', padding: '0 24px 64px' }}>
        <div style={{
          maxWidth: '640px', margin: '-1px auto 0',
          background: '#FFFFFF', borderRadius: '18px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(30,58,95,0.18)',
          borderTop: `4px solid ${accent}`,
        }}>
          {/* Photo / avatar */}
          <div style={{
            height: '220px', background: photo ? '#0c1520' : `linear-gradient(135deg, ${accent}22 0%, ${accent}44 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {photo ? (
              <img src={photo} alt={`${name} — ${category}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%', background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 24px ${accent}55`,
              }}>
                <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '38px', color: '#F5F0E8' }}>{initial}</span>
              </div>
            )}
          </div>

          <div style={{ padding: '28px 28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                color: accent, fontFamily: "'DM Sans',sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em',
              }}>
                {category.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{location}</span>
            </div>

            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '32px', color: '#1E3A5F', margin: '10px 0 0' }}>
              {name}
            </h1>
            {via && (
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>{via}</p>
            )}
            {from && from !== 'Enquire in the app' && (
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '15px', color: accent, fontWeight: '700', margin: '8px 0 0' }}>
                {from}
              </p>
            )}
            {badge && (
              <span style={{
                display: 'inline-block', marginTop: '12px',
                background: '#F0FDF4', color: '#15803D', borderRadius: '20px',
                padding: '4px 12px', fontFamily: "'DM Sans',sans-serif",
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {badge}
              </span>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              {services.map(s => (
                <span key={s} style={{
                  background: `${accent}0D`, color: accent, borderRadius: '7px',
                  padding: '6px 12px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '500',
                  border: `1px solid ${accent}1A`,
                }}>
                  {s}
                </span>
              ))}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {href ? (
                <a
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: '#1E3A5F', color: '#F5F0E8', borderRadius: '10px', padding: '15px',
                    fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '700', textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={16} /> Visit Course Compass
                </a>
              ) : (
                <Link
                  to={bookingUrl(coach)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: '#1E3A5F', color: '#F5F0E8', borderRadius: '10px', padding: '15px',
                    fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '700', textDecoration: 'none',
                  }}
                >
                  <CalendarDays size={16} /> Book This Coach
                </Link>
              )}
              <Link
                to="/download"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.2)',
                  borderRadius: '10px', padding: '15px',
                  fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '700', textDecoration: 'none',
                }}
              >
                <Smartphone size={16} /> Get the UniBlueprint App
              </Link>
            </div>

            {crossLinkHref && (
              <Link
                to={crossLinkHref}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: '16px', textDecoration: 'none',
                }}
              >
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: accent, fontWeight: '600' }}>
                  {crossLinkLabel}
                </span>
              </Link>
            )}

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11.5px', color: '#9CA3AF', textAlign: 'center', marginTop: '20px', lineHeight: 1.5 }}>
              Every Uni Coach sets and collects their own price directly — booking sends a request, not a confirmed or paid session.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
