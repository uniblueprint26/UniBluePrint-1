import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { POSTS, calcReadTime, formatDate } from '../../data/blogPosts'

const POSTS_PER_PAGE = 6
const SITE_URL = 'https://uniblueprint.ie'
const CATEGORIES = ['All', ...Array.from(new Set(POSTS.map(p => p.category)))]

// ─── Category accent palette ──────────────────────────────────────────────────
const CATEGORY_ACCENTS = {
  'CV & Career':            '#2563EB',
  'UniBlueprint Updates':   '#0891B2',
  'CAO & Education':        '#C2410C',
  'Apprenticeships':        '#166534',
  'Graduate Life':          '#6D28D9',
  'Mental Health':          '#15803D',
  'Lifestyle':              '#B45309',
}

// ─── Inline poster cover ──────────────────────────────────────────────────────
function PostCover({ title, category }) {
  const accent = CATEGORY_ACCENTS[category] || '#1E3A5F'
  return (
    <div aria-hidden="true" style={{
      height: '160px',
      background: '#1E3A5F',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '16px 20px 18px',
      flexShrink: 0,
    }}>
      {/* Top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accent }} />
      {/* Dot grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(245,240,232,0.055) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }} />
      {/* UBP watermark */}
      <span style={{
        position: 'absolute', top: '12px', right: '16px',
        fontFamily: "'DM Serif Display', serif",
        fontSize: '12px', color: 'rgba(245,240,232,0.18)',
        letterSpacing: '0.06em',
      }}>UBP</span>
      {/* Category pill */}
      <span style={{
        display: 'inline-block', alignSelf: 'flex-start',
        background: accent,
        color: '#fff',
        borderRadius: '20px', padding: '2px 9px',
        fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '8px',
        position: 'relative', zIndex: 1,
      }}>
        {category}
      </span>
      {/* Title */}
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '14px', color: '#F5F0E8',
        lineHeight: 1.35, margin: 0,
        position: 'relative', zIndex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {title}
      </p>
    </div>
  )
}

const BLOG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'UniBlueprint Insights',
  description: 'Career tips, platform updates, and guides for young people across all pathways in Ireland',
}

function PostCard({ slug, title, excerpt, category, date, sections }) {
  const readTime = calcReadTime(sections)
  return (
    <Link to={`/blog/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          overflow: 'hidden', height: '100%',
          transition: 'box-shadow 200ms, transform 200ms',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0px 4px 20px rgba(30,58,95,0.14)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <PostCover title={title} category={category} />

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{
            display: 'inline-block',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '20px', padding: '3px 10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: '10px', alignSelf: 'flex-start',
          }}>
            {category}
          </span>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px', color: '#1E3A5F',
            lineHeight: 1.3, marginBottom: '8px',
          }}>
            {title}
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#6B7280',
            lineHeight: 1.6, flex: 1,
          }}>
            {excerpt}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginTop: '16px',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>
              {formatDate(date)}
            </span>
            <span aria-hidden="true" style={{ color: '#D1D5DB', fontSize: '10px' }}>·</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>
              {readTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function BlogPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? POSTS
    : POSTS.filter(p => p.category === activeCategory)

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE)
  const safePage = Math.min(page, Math.max(1, totalPages))
  const displayed = filtered.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE)

  const canonical = safePage === 1 ? `${SITE_URL}/blog` : `${SITE_URL}/blog?page=${safePage}`

  function handleCategoryChange(cat) {
    setActiveCategory(cat)
    navigate('/blog')
  }

  return (
    <>
      <Helmet>
        <title>{safePage > 1 ? `Blog — Page ${safePage} | UniBlueprint` : 'Blog | UniBlueprint'}</title>
        <meta name="description" content="Career tips, platform updates, and guides for young people across all pathways in Ireland from the UniBlueprint team." />
        <link rel="canonical" href={canonical} />
        {/* TODO: Uncomment before going live — adds noindex on paginated pages beyond page 1 to prevent duplicate content penalties */}
        {/* {safePage > 1 && <meta name="robots" content="noindex, follow" />} */}
        <script type="application/ld+json">{JSON.stringify(BLOG_JSON_LD)}</script>
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          UniBlueprint Insights
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F', marginTop: '8px' }}>
          Blog
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          Career tips, platform updates, and guides for young people across all pathways in Ireland.
        </p>
      </section>

      {/* POSTS */}
      <section style={{ background: '#F5F0E8', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px', justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '8px 18px',
                  background: activeCategory === cat ? '#1E3A5F' : '#FFFFFF',
                  color: activeCategory === cat ? '#F5F0E8' : '#6B7280',
                  border: activeCategory === cat ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
                  borderRadius: '20px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {displayed.length > 0 ? (
            <div className="blog-grid">
              {displayed.map(post => (
                <PostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#9CA3AF', padding: '48px 0' }}>
              No posts in this category yet.
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
              {safePage > 1 ? (
                <Link
                  to={safePage === 2 ? '/blog' : `/blog?page=${safePage - 1}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    height: '40px', padding: '0 16px',
                    background: '#FFFFFF', color: '#1E3A5F',
                    border: '1.5px solid rgba(30,58,95,0.15)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </Link>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  height: '40px', padding: '0 16px',
                  background: 'rgba(30,58,95,0.04)', color: '#9CA3AF',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                  cursor: 'default',
                }}>
                  <ChevronLeft size={14} /> Previous
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Link
                  key={n}
                  to={n === 1 ? '/blog' : `/blog?page=${n}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '40px', height: '40px',
                    background: n === safePage ? '#1E3A5F' : '#FFFFFF',
                    color: n === safePage ? '#F5F0E8' : '#6B7280',
                    border: n === safePage ? 'none' : '1.5px solid rgba(30,58,95,0.15)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  {n}
                </Link>
              ))}

              {safePage < totalPages ? (
                <Link
                  to={`/blog?page=${safePage + 1}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    height: '40px', padding: '0 16px',
                    background: '#FFFFFF', color: '#1E3A5F',
                    border: '1.5px solid rgba(30,58,95,0.15)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  Next <ChevronRight size={14} />
                </Link>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  height: '40px', padding: '0 16px',
                  background: 'rgba(30,58,95,0.04)', color: '#9CA3AF',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                  cursor: 'default',
                }}>
                  Next <ChevronRight size={14} />
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
