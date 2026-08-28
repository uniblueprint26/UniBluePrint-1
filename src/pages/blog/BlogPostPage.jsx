import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowUp, ChevronLeft } from 'lucide-react'
import { POSTS, calcReadTime, formatDate } from '../../data/blogPosts'

const SITE_URL = 'https://uniblueprint.ie'

// Category accent palette (mirrors BlogPage)
const CATEGORY_ACCENTS = {
  'CV & Career':            '#2563EB',
  'UniBlueprint Updates':   '#0891B2',
  'CAO & Education':        '#C2410C',
  'Apprenticeships':        '#166534',
  'Graduate Life':          '#6D28D9',
  'Mental Health':          '#15803D',
  'Lifestyle':              '#B45309',
}

const PRINT_STYLES = `
@media print {
  [role="banner"], header, nav, footer,
  .reading-progress, .back-to-top { display: none !important; }
  body { background: white !important; font-size: 11pt; }
  * { color: black !important; }
  article { max-width: 100% !important; }
  h1, h2, h3 { page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { text-decoration: none; }
}
`

// ─── Reading progress bar ──────────────────────────────────────────────────────

function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="reading-progress"
      aria-hidden="true"
      style={{
        position: 'fixed', top: 0, left: 0,
        height: '3px',
        width: `${progress}%`,
        background: '#1E3A5F',
        zIndex: 1000,
        transition: 'width 50ms linear',
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Back to top button ────────────────────────────────────────────────────────

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '48px', height: '48px',
        background: '#1E3A5F', color: '#F5F0E8',
        border: 'none', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 400,
        boxShadow: '0px 4px 12px rgba(30,58,95,0.3)',
        transition: 'opacity 200ms',
      }}
    >
      <ArrowUp size={20} />
    </button>
  )
}

// ─── Section renderer ──────────────────────────────────────────────────────────

function renderSection(section, index) {
  switch (section.type) {
    case 'heading':
      return (
        <h2 key={index} style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '24px', color: '#1E3A5F',
          marginTop: '40px', marginBottom: '12px',
        }}>
          {section.text}
        </h2>
      )
    case 'paragraph':
      return (
        <p key={index} style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#374151',
          lineHeight: 1.8, marginBottom: '16px',
        }}>
          {section.text}
        </p>
      )
    case 'list':
      return (
        <ul key={index} style={{
          listStyle: 'none', padding: 0,
          margin: '0 0 16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {(section.items || []).map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#1E3A5F', marginTop: '8px', flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '16px', color: '#374151',
                lineHeight: 1.7,
              }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      )
    default:
      return null
  }
}

// ─── BlogPostPage ──────────────────────────────────────────────────────────────

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = POSTS.find(p => p.slug === slug)

  if (!post) {
    return (
      <>
        <Helmet>
          <title>Post Not Found | UniBlueprint</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section style={{
          background: '#F5F0E8', minHeight: '70vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>
              Post not found
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '12px' }}>
              This article does not exist or has been removed.
            </p>
            <Link
              to="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '24px', color: '#1E3A5F',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              }}
            >
              <ChevronLeft size={16} /> Back to blog
            </Link>
          </div>
        </section>
      </>
    )
  }

  const readTime = calcReadTime(post.sections)

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'UniBlueprint' },
    url: `${SITE_URL}/blog/${post.slug}`,
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | UniBlueprint</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`${SITE_URL}/blog/${post.slug}`} />
        <script type="application/ld+json">{JSON.stringify(postJsonLd)}</script>
        <style>{PRINT_STYLES}</style>
      </Helmet>

      <ReadingProgress />

      {/* ARTICLE HERO — poster banner */}
      <section style={{
        background: '#1E3A5F', padding: '64px 24px 56px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Accent stripe */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: CATEGORY_ACCENTS[post.category] || '#2563EB',
        }} />
        {/* Dot grid texture */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            to="/blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              color: 'rgba(245,240,232,0.55)',
              marginBottom: '28px',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.55)')}
          >
            <ChevronLeft size={14} /> Blog
          </Link>
          <span style={{
            display: 'inline-block',
            background: CATEGORY_ACCENTS[post.category] || '#2563EB',
            color: '#fff',
            borderRadius: '20px', padding: '4px 12px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: '18px',
          }}>
            {post.category}
          </span>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', color: '#F5F0E8',
            lineHeight: 1.18,
          }}>
            {post.title}
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginTop: '18px', flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
              {formatDate(post.date)}
            </span>
            <span aria-hidden="true" style={{ color: 'rgba(245,240,232,0.25)', fontSize: '10px' }}>·</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
              {readTime}
            </span>
            <span aria-hidden="true" style={{ color: 'rgba(245,240,232,0.25)', fontSize: '10px' }}>·</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
              UniBlueprint Team
            </span>
          </div>
        </div>
      </section>

      {/* ARTICLE CONTENT */}
      <section style={{ background: '#F5F0E8', padding: '64px 24px' }}>
        <article style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
            padding: '48px 40px',
          }}>
            {post.sections.map((section, i) => renderSection(section, i))}
          </div>

          {/* Back to blog */}
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link
              to="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '44px', padding: '0 24px',
                background: 'none', color: '#1E3A5F',
                border: '1.5px solid rgba(30,58,95,0.2)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <ChevronLeft size={16} /> Back to blog
            </Link>
          </div>
        </article>
      </section>

      <BackToTop />
    </>
  )
}
