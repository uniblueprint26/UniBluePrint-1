import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Search, Rocket, User, Send, Package,
  CreditCard, FileText, TrendingUp, Users, Settings,
} from 'lucide-react'

const CATEGORIES = [
  { icon: Rocket,      title: 'Getting Started' },
  { icon: User,        title: 'Your Account' },
  { icon: Send,        title: 'Submitting a Service' },
  { icon: Package,     title: 'Tracking Your Order' },
  { icon: CreditCard,  title: 'Subscription and Billing' },
  { icon: FileText,    title: 'Foundation Blueprint' },
  { icon: TrendingUp,  title: 'Elevation Blueprint' },
  { icon: Users,       title: 'Campus and Course Connect' },
  { icon: Settings,    title: 'Technical Issues' },
]

function CategoryCard({ icon: Icon, title }) {
  return (
    <div
      style={{
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
        padding: '20px', textAlign: 'center',
        cursor: 'pointer', transition: 'box-shadow 150ms, transform 150ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0px 4px 24px rgba(30,58,95,0.14)'
        e.currentTarget.style.transform = 'scale(1.01)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <Icon size={28} color="#1E3A5F" />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F' }}>
        {title}
      </p>
    </div>
  )
}

export default function HelpPage() {
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => {
    const lower = query.toLowerCase().trim()
    if (!lower) return []
    return CATEGORIES.filter(c => c.title.toLowerCase().includes(lower))
  }, [query])

  const showSearch = query.trim().length > 0

  return (
    <>
      <Helmet>
        <title>Help Centre | UniBlueprint</title>
        <meta name="description" content="UniBlueprint Help Centre — guides and answers for Foundation Blueprint, Elevation Blueprint, billing, accounts, and campus features." />
        <meta property="og:title" content="Help Centre | UniBlueprint" />
        <meta property="og:description" content="UniBlueprint Help Centre — guides and answers for Foundation Blueprint, Elevation Blueprint, billing, accounts, and campus features." />
      </Helmet>

      {/* HERO */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '44px', color: '#1E3A5F' }}>
          Help Centre
        </h1>

        <div style={{ maxWidth: '600px', margin: '32px auto 0', position: 'relative' }}>
          <Search
            size={18} color="#9CA3AF"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for help..."
            aria-label="Search for help"
            style={{
              width: '100%', height: '52px',
              border: '1.5px solid rgba(30,58,95,0.15)',
              borderRadius: '8px',
              paddingLeft: '44px', paddingRight: '16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#1E3A5F',
              background: '#FFFFFF', outline: 'none',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.15)'; e.target.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)' }}
          />
        </div>

        {showSearch && (
          <div style={{ maxWidth: '600px', margin: '12px auto 0', textAlign: 'left' }}>
            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(c => (
                  <div key={c.title} style={{
                    background: '#FFFFFF', borderRadius: '10px',
                    boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#F5F0E8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <c.icon size={18} color="#1E3A5F" />
                    </div>
                    <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#1E3A5F' }}>
                      {c.title}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF', borderRadius: '10px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '20px 24px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
                  No results found.{' '}
                  <Link to="/contact" style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'none' }}>
                    Contact us
                  </Link>{' '}
                  and we will help directly.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CATEGORIES GRID */}
      {!showSearch && (
        <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="services-grid">
              {CATEGORIES.map(c => <CategoryCard key={c.title} {...c} />)}
            </div>
          </div>
        </section>
      )}

      {/* STILL NEED HELP */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>
          Still need help?
        </h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Contact Us
          </Link>
          <Link
            to="/faqs"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', padding: '0 28px',
              background: 'none', color: '#1E3A5F',
              border: '1.5px solid rgba(30,58,95,0.2)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Browse FAQs
          </Link>
        </div>
      </section>
    </>
  )
}
