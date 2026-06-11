import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { BREADCRUMB_MAP } from '../../data/breadcrumbs'

const SITE_URL = 'https://uniblueprint.com'

export default function Breadcrumbs() {
  const { pathname } = useLocation()

  let trail = BREADCRUMB_MAP[pathname]

  // Dynamic breadcrumb for blog posts
  if (!trail && pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '')
    const label = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    trail = [
      { label: 'Home', path: '/' },
      { label: 'Blog', path: '/blog' },
      { label: label, path: pathname },
    ]
  }

  if (!trail || trail.length < 2) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <nav
        aria-label="Breadcrumb"
        style={{
          background: '#FFFFFF',
          padding: '10px 24px',
          borderBottom: '1px solid rgba(30,58,95,0.06)',
        }}
      >
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          listStyle: 'none',
          maxWidth: '1200px',
          margin: '0 auto',
          flexWrap: 'wrap',
          padding: 0,
        }}>
          {trail.map((item, i) => {
            const isLast = i === trail.length - 1
            return (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {i > 0 && (
                  <ChevronRight
                    size={13}
                    color="#9CA3AF"
                    aria-hidden="true"
                    style={{ flexShrink: 0, margin: '0 2px' }}
                  />
                )}
                {isLast || !item.path ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      color: isLast ? '#1E3A5F' : '#9CA3AF',
                      fontWeight: isLast ? '500' : '400',
                    }}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
