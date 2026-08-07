import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Megaphone, Camera, BookOpen, Home, Briefcase, ShoppingBag, Search } from 'lucide-react'

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .adboard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 1023px) { .adboard-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 639px)  { .adboard-grid { grid-template-columns: 1fr; } }

  .adboard-filter::-webkit-scrollbar { display: none; }

  .ad-card {
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(30,58,95,0.07);
    overflow: hidden;
    transition: box-shadow 180ms, transform 180ms;
    cursor: default;
    display: flex;
    flex-direction: column;
  }
  .ad-card:hover {
    box-shadow: 0 8px 28px rgba(30,58,95,0.12);
    transform: translateY(-3px);
  }
`

// ─── Sample listings data ───────────────────────────────────────────────────────

const LISTINGS = [
  {
    id: 1, category: 'Textbooks',
    title: 'Business Law textbook — 3rd Edition',
    desc: 'Great condition. Highlighted chapters 1–8. Perfect for 1st year business students.',
    price: '€25', type: 'For Sale',
    poster: 'Emily', university: 'DCU',
    postedAgo: '2 hours ago', accent: '#2D4B8E',
  },
  {
    id: 2, category: 'Services',
    title: 'Headshots for LinkedIn and internship apps',
    desc: 'Professional portraits taken on campus. Edited and delivered within 48 hours. Bookings open for September.',
    price: '€40 / session', type: 'Service',
    poster: 'Nathan', university: 'UCD',
    postedAgo: '4 hours ago', accent: '#7C3500',
  },
  {
    id: 3, category: 'Accommodation',
    title: 'Room available — Phibsborough, Dublin 7',
    desc: 'Double room in shared house, 15 min from DCU and 20 min from TUD. Available from Sept 1. Bills included.',
    price: '€750 / month', type: 'Room',
    poster: 'Ciarán', university: 'DCU',
    postedAgo: '6 hours ago', accent: '#1E3A5F',
  },
  {
    id: 4, category: 'Gigs',
    title: 'Social media content creator wanted',
    desc: 'Looking for someone to manage Instagram and TikTok for a small fitness brand. Flexible hours, €15/hr.',
    price: '€15 / hr', type: 'Paid gig',
    poster: 'Alex', university: 'ATU Galway',
    postedAgo: '8 hours ago', accent: '#4C1D95',
  },
  {
    id: 5, category: 'Textbooks',
    title: 'Anatomy and Physiology — Tortora, 16th Ed',
    desc: 'Nursing and healthcare students — used for one year, some annotation. Selling well below college shop price.',
    price: '€35', type: 'For Sale',
    poster: 'Nicole', university: 'Maynooth University',
    postedAgo: '1 day ago', accent: '#2D4B8E',
  },
  {
    id: 6, category: 'Items',
    title: 'Study desk lamp — barely used',
    desc: 'LED desk lamp with 3 brightness settings. Moving out, no room for it. Collect from Rathmines.',
    price: '€12', type: 'For Sale',
    poster: 'Sam', university: 'TU Dublin',
    postedAgo: '1 day ago', accent: '#134E4A',
  },
  {
    id: 7, category: 'Services',
    title: 'Grinds — Maths and Applied Maths (LC)',
    desc: 'Leaving Cert results: H1 Maths, H1 Applied Maths. Now in 2nd year Engineering. 1-to-1 or small group.',
    price: '€20 / hr', type: 'Service',
    poster: 'Luca', university: 'UCD',
    postedAgo: '2 days ago', accent: '#1E3A5F',
  },
  {
    id: 8, category: 'Gigs',
    title: 'Campus rep wanted for student events brand',
    desc: 'Paid role promoting student events on your campus. Flexible, commission-based. Contact via the app.',
    price: 'Commission', type: 'Paid gig',
    poster: 'Sofia', university: 'DCU',
    postedAgo: '2 days ago', accent: '#4C1D95',
  },
  {
    id: 9, category: 'Accommodation',
    title: 'Seeking accommodation near UL campus',
    desc: 'Final year student looking for a room or studio near University of Limerick from September. Budget €700.',
    price: 'Budget €700 / mo', type: 'Seeking',
    poster: 'Emma', university: 'UL',
    postedAgo: '3 days ago', accent: '#1E3A5F',
  },
  {
    id: 10, category: 'Items',
    title: 'MacBook Air M1 — 2021, 8GB, 256GB',
    desc: 'Used for two years, excellent condition, original charger included. Ideal for students. No issues.',
    price: '€680', type: 'For Sale',
    poster: 'Mohammed', university: 'DCU',
    postedAgo: '3 days ago', accent: '#134E4A',
  },
  {
    id: 11, category: 'Services',
    title: 'Proofreading and editing for essays',
    desc: 'Final year English and Media student. 24-hr turnaround, cover letters and essays. Rate per 1000 words.',
    price: '€15 / 1000 words', type: 'Service',
    poster: 'Mairead', university: 'DCU',
    postedAgo: '4 days ago', accent: '#7C3500',
  },
  {
    id: 12, category: 'Textbooks',
    title: 'Company Law and Commercial Law bundle',
    desc: 'Two textbooks for Law 2nd year. Minor highlighting, in great shape. Selling as a bundle only.',
    price: '€45 bundle', type: 'For Sale',
    poster: 'Gigi', university: 'UCD',
    postedAgo: '5 days ago', accent: '#2D4B8E',
  },
]

const CATEGORIES = ['All', 'Textbooks', 'Services', 'Accommodation', 'Gigs', 'Items']

const CATEGORY_ICONS = {
  Textbooks: BookOpen,
  Services: Camera,
  Accommodation: Home,
  Gigs: Briefcase,
  Items: ShoppingBag,
}

const CATEGORY_ACCENT = {
  Textbooks: '#2D4B8E',
  Services: '#7C3500',
  Accommodation: '#1E3A5F',
  Gigs: '#4C1D95',
  Items: '#134E4A',
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: light ? 'rgba(245,240,232,0.5)' : '#6B7280',
    }}>
      {children}
    </p>
  )
}

function ListingCard({ title, desc, price, type, poster, university, postedAgo, category, accent }) {
  const CatIcon = CATEGORY_ICONS[category] || ShoppingBag

  return (
    <div className="ad-card">
      {/* Colour stripe + category */}
      <div style={{
        height: '6px',
        background: accent || CATEGORY_ACCENT[category] || '#1E3A5F',
      }} />

      <div style={{ padding: '18px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            {/* Category pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <CatIcon size={11} color={accent || CATEGORY_ACCENT[category]} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px', fontWeight: '700',
                color: accent || CATEGORY_ACCENT[category],
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {type}
              </span>
            </div>

            {/* Title */}
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '15px', color: '#1E3A5F', lineHeight: 1.3,
            }}>
              {title}
            </p>
          </div>

          {/* Price */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '15px', color: '#1E3A5F',
            }}>
              {price}
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#6B7280',
          lineHeight: 1.55, marginTop: '8px', flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {desc}
        </p>

        {/* Footer row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '14px', paddingTop: '12px',
          borderTop: '1px solid rgba(30,58,95,0.07)',
        }}>
          {/* Poster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: accent || CATEGORY_ACCENT[category],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '11px', color: '#F5F0E8',
              }}>
                {poster.charAt(0)}
              </span>
            </div>
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', color: '#1E3A5F', fontWeight: '600',
              }}>{poster}</p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px', color: '#9CA3AF',
              }}>{university}</p>
            </div>
          </div>

          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', color: '#9CA3AF',
          }}>
            {postedAgo}
          </span>
        </div>
      </div>

      {/* Contact CTA */}
      <div style={{ padding: '0 18px 16px' }}>
        <div style={{
          height: '36px', borderRadius: '7px',
          border: `1.5px solid ${accent || CATEGORY_ACCENT[category]}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', fontWeight: '600',
          color: accent || CATEGORY_ACCENT[category],
          background: `${accent || CATEGORY_ACCENT[category]}08`,
        }}>
          Contact via app
        </div>
      </div>
    </div>
  )
}

// ─── AdBoardPage ───────────────────────────────────────────────────────────────

export default function AdBoardPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let items = LISTINGS
    if (activeCategory !== 'All') {
      items = items.filter(l => l.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.desc.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.university.toLowerCase().includes(q)
      )
    }
    return items
  }, [activeCategory, searchQuery])

  return (
    <>
      <Helmet>
        <title>Ad Board | UniBlueprint</title>
        <meta name="description" content="Buy and sell textbooks, post gigs, find accommodation, and offer services — all within the UniBlueprint campus community." />
        <meta property="og:title" content="Ad Board | UniBlueprint" />
        <meta property="og:description" content="Buy and sell textbooks, post gigs, find accommodation, and offer services — all within the UniBlueprint campus community." />
      </Helmet>

      <style>{PAGE_STYLES}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '96px 24px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.02) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.02) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Ad Board</SectionLabel>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.1,
          }}>
            Buy. Sell. Connect.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.6)',
            marginTop: '16px', maxWidth: '460px',
            margin: '16px auto 0', lineHeight: 1.65,
          }}>
            The student marketplace built into UniBlueprint. Textbooks, services, accommodation, gigs, and more.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            {CATEGORIES.slice(1).map(cat => {
              const CatIcon = CATEGORY_ICONS[cat]
              return (
                <span key={cat} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px', color: 'rgba(245,240,232,0.6)',
                  border: '1px solid rgba(245,240,232,0.15)',
                  borderRadius: '20px', padding: '5px 14px',
                }}>
                  <CatIcon size={12} />
                  {cat}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE CONTENT NOTICE ───────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid rgba(30,58,95,0.07)',
        padding: '14px 24px',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <Megaphone size={16} color="#1E3A5F" style={{ flexShrink: 0, marginTop: '2px', opacity: 0.6 }} />
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#6B7280', lineHeight: 1.5,
          }}>
            These listings are example content showing what the Ad Board looks like in the app. Real listings are posted by verified UniBlueprint users.
          </p>
        </div>
      </div>

      {/* ── FILTER + SEARCH BAR ──────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid rgba(30,58,95,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 24px' }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={15} color="#9CA3AF" style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
            <input
              type="search"
              placeholder="Search listings, universities, categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', height: '40px',
                paddingLeft: '40px', paddingRight: '14px',
                border: '1.5px solid rgba(30,58,95,0.12)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                color: '#1E3A5F', background: '#F5F0E8',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category filter */}
          <div
            className="adboard-filter"
            style={{
              display: 'flex', gap: '8px',
              overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px',
            }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: cat === activeCategory ? '#1E3A5F' : '#FFFFFF',
                  color: cat === activeCategory ? '#F5F0E8' : '#6B7280',
                  border: cat === activeCategory ? 'none' : '1px solid rgba(30,58,95,0.15)',
                  borderRadius: '20px', padding: '6px 14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 140ms, color 140ms',
                }}
              >
                {CATEGORY_ICONS[cat] && (() => {
                  const CatIcon = CATEGORY_ICONS[cat]
                  return <CatIcon size={12} />
                })()}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LISTINGS GRID ────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '40px 24px 96px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Count + context */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', flexWrap: 'wrap', gap: '8px',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', color: '#9CA3AF',
            }}>
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''} shown
              {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', color: '#9CA3AF',
            }}>
              Sample content only
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F',
              }}>
                No listings found
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#9CA3AF', marginTop: '8px',
              }}>
                Try clearing your search or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="adboard-grid">
              {filtered.map(listing => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          )}

          {/* Post a listing prompt */}
          <div style={{
            background: '#FFFFFF', borderRadius: '14px',
            padding: '28px 32px', marginTop: '48px',
            display: 'flex', alignItems: 'center', gap: '24px',
            boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: '#1E3A5F', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Megaphone size={22} color="#F5F0E8" />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F',
              }}>
                Want to post a listing?
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '6px', lineHeight: 1.55,
              }}>
                The Ad Board is built into the UniBlueprint app. Download to post a listing or contact sellers directly.
              </p>
            </div>
            <Link
              to="/download"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '44px', padding: '0 24px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '8px', flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Get the app
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionLabel>How Ad Board works</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F', marginTop: '10px',
          }}>
            Post, browse, connect
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            marginTop: '12px', maxWidth: '440px',
            margin: '12px auto 0', lineHeight: 1.65,
          }}>
            Ad Board is verified and campus-specific. Everyone posting has a verified UniBlueprint account.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px', marginTop: '48px',
            // mobile overrides below
          }}>
            <style>{`@media (max-width: 639px) { .hiw-steps { grid-template-columns: 1fr !important; } }`}</style>
            {[
              {
                n: '01', title: 'Download the app',
                body: 'Sign up free and verify your account. Your campus board is automatically activated.',
                colour: '#1E3A5F',
              },
              {
                n: '02', title: 'Browse or post',
                body: 'Search listings by category or university. Tap to post your own in under 60 seconds.',
                colour: '#2D4B8E',
              },
              {
                n: '03', title: 'Connect directly',
                body: 'Message the poster directly through the app. No middleman, no hidden fees.',
                colour: '#134E4A',
              },
            ].map(step => (
              <div key={step.n} className="hiw-steps" style={{
                background: '#F5F0E8', borderRadius: '12px', padding: '28px',
                textAlign: 'left',
              }}>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '28px', color: step.colour, lineHeight: 1,
                }}>
                  {step.n}
                </p>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '18px', color: '#1E3A5F', marginTop: '12px',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.6,
                }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#F5F0E8',
        }}>
          Free for every user
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.6)',
          marginTop: '12px', maxWidth: '400px',
          margin: '12px auto 0', lineHeight: 1.65,
        }}>
          Ad Board is included in the free tier. No subscription needed to browse or post.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            to="/download"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Get the app
          </Link>
        </div>
      </section>
    </>
  )
}
