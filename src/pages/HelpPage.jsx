import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Search, BookOpen, CreditCard, UserCheck, Award,
  Users, MessageCircle, Settings, ChevronRight,
} from 'lucide-react'

// ─── Help centre data ──────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    icon: BookOpen,
    title: 'Foundation Blueprint',
    description: 'CV, cover letters, LinkedIn, CAO, and more.',
    articles: [
      'How to submit a Foundation Blueprint request',
      'What to expect from your Campus Handler',
      'Standard vs Premium — which should I choose?',
      'How to request a revision',
      'Why is my submission taking longer than expected?',
    ],
  },
  {
    icon: Award,
    title: 'Elevation Blueprint',
    description: 'Career coaching, branding, and mentorship.',
    articles: [
      'How to book a Uni Coach session',
      'What is the Elevation engagement model?',
      'How mentorship matching works',
      'Requesting a follow-up or revision',
      'What if I need to reschedule a session?',
    ],
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Pro plans, payments, and cancellations.',
    articles: [
      'How to upgrade to Pro',
      'How to cancel your Pro subscription',
      'Understanding the September trial pricing',
      'What payment methods are accepted?',
      'I was charged incorrectly — what do I do?',
    ],
  },
  {
    icon: UserCheck,
    title: 'Account & Profile',
    description: 'Sign in, settings, and account management.',
    articles: [
      'How to reset your password',
      'How to update your email address',
      'Deleting your account',
      'I did not receive a verification email',
      'How to change your profile information',
    ],
  },
  {
    icon: Users,
    title: 'Campus Connect',
    description: 'Community boards, groups, and features.',
    articles: [
      'How Campus Connect boards work',
      'How to join a campus group',
      'Reporting inappropriate content',
      'How the Carpool board works',
      'Lost & Found — how to post and search',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Course Connect',
    description: 'Course boards, study groups, and resources.',
    articles: [
      'How to find your course board',
      'How to share notes and resources',
      'Creating a study group',
      'Cross-campus study groups',
      'How to search by module code',
    ],
  },
  {
    icon: Settings,
    title: 'Technical',
    description: 'App issues, bugs, and troubleshooting.',
    articles: [
      'The app is not loading — what do I do?',
      'How to clear your cache',
      'Supported devices and browsers',
      'How to report a bug',
      'Accessibility settings',
    ],
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryCard({ icon: Icon, title, description, articles }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '24px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '12px',
      }}>
        <Icon size={24} color="#1E3A5F" />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
        {title}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
        {description}
      </p>
      <ul style={{ marginTop: '16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {articles.map(a => (
          <li key={a}>
            {/* TODO: Link to individual help articles when they are created */}
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#1E3A5F',
                cursor: 'default',
              }}
            >
              <ChevronRight size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
              {a}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SearchResult({ category, article }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    }}>
      <div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F', fontWeight: '500' }}>
          {article}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
          {category}
        </p>
      </div>
      <ChevronRight size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
    </div>
  )
}

// ─── HelpPage ──────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => {
    const lower = query.toLowerCase().trim()
    if (!lower) return []
    return CATEGORIES.flatMap(cat =>
      cat.articles
        .filter(a => a.toLowerCase().includes(lower) || cat.title.toLowerCase().includes(lower))
        .map(a => ({ category: cat.title, article: a }))
    )
  }, [query])

  const showSearch = query.trim().length > 0

  return (
    <>
      <Helmet>
        <title>Help Centre | Uniblueprint</title>
        <meta
          name="description"
          content="Uniblueprint Help Centre — guides and answers for Foundation Blueprint, Elevation Blueprint, billing, accounts, and campus features."
        />
        <meta property="og:title" content="Help Centre | Uniblueprint" />
        <meta property="og:description" content="Uniblueprint Help Centre — guides and answers for Foundation Blueprint, Elevation Blueprint, billing, accounts, and campus features." />
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Help Centre
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          How can we help you today?
        </p>

        {/* Search */}
        <div style={{ maxWidth: '560px', margin: '32px auto 0', position: 'relative' }}>
          <Search
            size={18} color="#9CA3AF"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search help articles..."
            aria-label="Search help articles"
            style={{
              width: '100%', height: '52px',
              border: '1.5px solid rgba(30,58,95,0.15)',
              borderRadius: '10px',
              paddingLeft: '44px', paddingRight: '16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#1E3A5F',
              background: '#FFFFFF', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.15)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Search results dropdown */}
        {showSearch && (
          <div style={{ maxWidth: '560px', margin: '12px auto 0', textAlign: 'left' }}>
            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(r => (
                  <SearchResult key={r.article} {...r} />
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
                  and we'll help directly.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── CATEGORIES GRID ───────────────────────────────────────────────── */}
      {!showSearch && (
        <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '32px', color: '#1E3A5F',
              textAlign: 'center', marginBottom: '40px',
            }}>
              Browse by topic
            </h2>
            <div className="services-grid">
              {CATEGORIES.map(c => <CategoryCard key={c.title} {...c} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── STILL NEED HELP ───────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F' }}>
          Still need help?
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '480px', lineHeight: 1.6,
        }}>
          Our team reads every message and responds within 2 business days.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
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
            Contact us
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
