import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, Handshake } from 'lucide-react'

// TODO: Replace with live CourseCompass URL when provided by Stephen McKeon
const COURSECOMPASS_URL = 'TODO: Insert CourseCompass URL'

function PartnerCard({ name, tagline, description, url, badgeLabel }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '36px',
      maxWidth: '640px',
      margin: '0 auto',
      borderTop: '3px solid #1E3A5F',
    }}>
      {/* Logo placeholder */}
      <div style={{
        width: '64px', height: '64px',
        borderRadius: '12px',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
      }}>
        {/* TODO: Replace with actual CourseCompass logo when provided by Stephen McKeon */}
        <Handshake size={28} color="#1E3A5F" aria-hidden="true" />
      </div>

      {/* Badge */}
      <span style={{
        display: 'inline-block',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px', fontWeight: '600', color: '#1E3A5F',
        background: 'rgba(30,58,95,0.07)',
        borderRadius: '4px', padding: '3px 8px',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        marginBottom: '12px',
      }}>
        {badgeLabel}
      </span>

      {/* Name */}
      <h2 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '28px', color: '#1E3A5F',
        marginBottom: '8px',
      }}>
        {name}
      </h2>

      {/* Tagline */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', color: '#6B7280',
        fontWeight: '500', marginBottom: '16px',
      }}>
        {tagline}
      </p>

      {/* Description */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', color: '#6B7280',
        lineHeight: 1.7, marginBottom: '28px',
      }}>
        {description}
      </p>

      {/* Link */}
      {/* TODO: Replace with live CourseCompass URL when provided by Stephen McKeon */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          height: '48px', padding: '0 24px',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', fontWeight: '600',
          textDecoration: 'none',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Visit CourseCompass
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </div>
  )
}

export default function PartnersPage() {
  return (
    <>
      <Helmet>
        <title>Partners | Uniblueprint</title>
        <meta
          name="description"
          content="Uniblueprint partners with best-in-class platforms to give Irish students the tools they need. Meet CourseCompass — Ireland's AI-powered CAO course matching platform."
        />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '600', color: '#6B7280',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '16px',
        }}>
          Built together
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '44px', color: '#1E3A5F',
          lineHeight: 1.15,
        }}>
          Our Partners
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px', color: '#6B7280',
          marginTop: '16px', maxWidth: '560px',
          margin: '16px auto 0', lineHeight: 1.7,
        }}>
          Uniblueprint integrates with trusted platforms so students get the best guidance in one place.
        </p>
      </section>

      {/* ── PARTNER CARDS ────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <PartnerCard
            name="CourseCompass"
            badgeLabel="Integration Partner"
            tagline="Ireland's AI-powered CAO course matching platform"
            description="CourseCompass, built by Stephen McKeon, helps Irish students find the right CAO course using AI-powered matching. Answer a few questions about your interests and goals, and CourseCompass surfaces the courses most likely to suit you — before you submit your CAO application. Uniblueprint integrates with CourseCompass directly in the app, so Course Selection Guidance is powered by real AI matching, not guesswork."
            url={COURSECOMPASS_URL}
          />
        </div>
      </section>

      {/* ── PARTNERSHIP CTA ──────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px', color: '#1E3A5F',
        }}>
          Interested in partnering with Uniblueprint?
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          marginTop: '12px', maxWidth: '480px',
          margin: '12px auto 32px', lineHeight: 1.7,
        }}>
          We work with platforms and businesses that genuinely serve Irish students. If that's you, we'd love to talk.
        </p>
        <Link
          to="/for-businesses"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 32px',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', fontWeight: '600',
            textDecoration: 'none',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Work with us
        </Link>
      </section>
    </>
  )
}
