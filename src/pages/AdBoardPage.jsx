import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Megaphone, Star, GraduationCap, Award, Building2, Newspaper, MapPin,
  Sparkles, ShoppingBag, Users, Wallet, Heart, ChevronRight, BookOpen, Briefcase,
} from 'lucide-react'

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .wb-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px) { .wb-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .wb-grid { grid-template-columns: 1fr; } }

  .wb-steps { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 639px) { .wb-steps { grid-template-columns: 1fr !important; } }

  .wb-market-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px) { .wb-market-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .wb-market-grid { grid-template-columns: 1fr; } }

  .wb-section-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(30,58,95,0.06);
    transition: box-shadow 180ms, transform 180ms;
  }
  .wb-section-card:hover {
    box-shadow: 0 8px 28px rgba(30,58,95,0.12);
    transform: translateY(-3px);
  }

  .wb-market-card {
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(30,58,95,0.07);
    overflow: hidden;
  }
`

// ─── What's inside every issue ─────────────────────────────────────────────────
// Mirrors the real table of contents rendered by the in-app magazine
// (app/src/screens/AdBoardScreen.jsx) — every section named here is a real,
// built part of the product, not aspirational copy.

const SECTIONS = [
  { Icon: Star,          title: 'Deals & Discounts', desc: "This week's Lifestyle Partner offers, plus what's waiting in the Deal Room for Pro." },
  { Icon: GraduationCap, title: 'Coach Spotlights',  desc: 'A different Uni Coach featured every week, real advice from their own field.' },
  { Icon: Award,         title: 'Foundation Focus',  desc: 'Genuinely useful CV, LinkedIn, and interview advice, straight from the Foundation Blueprint.' },
  { Icon: Building2,     title: 'Campus Connect',    desc: "What's happening on campuses across Ireland this week, and what's on if you're travelling." },
  { Icon: Newspaper,     title: 'Student Spotlight', desc: 'Real student stories, with the full one always a tap away on the blog.' },
  { Icon: MapPin,        title: 'Campus Guide',      desc: 'One useful campus guide a week — study spots, transport, hidden gems, and more.' },
  { Icon: Sparkles,      title: 'The Lifestyle Edit', desc: 'An editorial-style edit of Lifestyle Partner fashion and student brands.' },
  { Icon: ShoppingBag,   title: 'Marketplace',       desc: 'Offer a skill or find one. Photography, tutoring, design, freelancing, and more.' },
  { Icon: Users,         title: 'UBP Team',          desc: 'Meet the people building UniBlueprint, and how to join them.' },
  { Icon: Wallet,        title: 'Money Moves',       desc: 'A practical financial tip every week, from a real UniBlueprint finance coach.' },
  { Icon: Heart,         title: 'Coach Board',       desc: 'Short, sharp tips from multiple coaches across every field, one page.' },
  { Icon: Megaphone,     title: 'Ad Board',          desc: 'Partner ads and student businesses, curated in one clean noticeboard.' },
]

// ─── Marketplace example listings ──────────────────────────────────────────────
// Illustrative only — real listings are posted by verified users inside the
// Marketplace section of the magazine, not managed from the website.

const MARKET_EXAMPLES = [
  { Icon: BookOpen,   type: 'For Sale', title: 'Business Law textbook, 3rd Edition', price: '€25', accent: '#2D4B8E' },
  { Icon: Star,       type: 'Service',  title: 'Headshots for LinkedIn and internships', price: '€40 / session', accent: '#7C3500' },
  { Icon: Briefcase,  type: 'Paid gig', title: 'Social media help for a small brand', price: '€15 / hr', accent: '#4C1D95' },
]

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

// ─── AdBoardPage ───────────────────────────────────────────────────────────────

export default function AdBoardPage() {
  return (
    <>
      <Helmet>
        <title>The Weekly Blueprint | UniBlueprint</title>
        <meta name="description" content="A new issue every week, built into the UniBlueprint app. Deals, coach advice, campus events, student stories, and a marketplace to buy, sell, and offer your skills." />
        <meta property="og:title" content="The Weekly Blueprint | UniBlueprint" />
        <meta property="og:description" content="A new issue every week, built into the UniBlueprint app. Deals, coach advice, campus events, student stories, and a marketplace to buy, sell, and offer your skills." />
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
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(245,240,232,0.2)',
            borderRadius: '20px', padding: '6px 14px', marginBottom: '18px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(245,240,232,0.75)', letterSpacing: '0.06em' }}>
              A NEW ISSUE, EVERY WEEK
            </span>
          </div>
          <SectionLabel light>The Weekly Blueprint</SectionLabel>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.1,
          }}>
            The structure behind{'\n'}your success.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.6)',
            marginTop: '16px', maxWidth: '520px',
            margin: '16px auto 0', lineHeight: 1.65,
          }}>
            A weekly digital magazine built into the UniBlueprint app. Deals, coach advice, campus
            events, student stories, and a marketplace to buy, sell, and offer your skills. Same
            structure every week, new content every time.
          </p>
        </div>
      </section>

      {/* ── WHAT'S INSIDE ─────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <SectionLabel>Every Issue</SectionLabel>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '10px' }}>
              What's inside
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
              marginTop: '12px', maxWidth: '480px', margin: '12px auto 0', lineHeight: 1.65,
            }}>
              Twelve sections, in the same order every week, so you always know where to find
              what you're looking for.
            </p>
          </div>

          <div className="wb-grid">
            {SECTIONS.map(s => (
              <div key={s.title} className="wb-section-card">
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(30,58,95,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
                }}>
                  <s.Icon size={17} color="#1E3A5F" strokeWidth={1.8} />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', lineHeight: 1.3 }}>
                  {s.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6B7280', marginTop: '6px', lineHeight: 1.55 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center', marginTop: '36px',
            fontFamily: "'DM Serif Display', serif", fontStyle: 'italic',
            fontSize: '18px', color: '#1E3A5F',
          }}>
            The structure stays. The story changes.
          </p>
        </div>
      </section>

      {/* ── MARKETPLACE TEASER ───────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            flexWrap: 'wrap', gap: '12px', marginBottom: '28px',
          }}>
            <div>
              <SectionLabel>One Section, Every Issue</SectionLabel>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: '#1E3A5F', marginTop: '8px' }}>
                The Marketplace
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', maxWidth: '440px', lineHeight: 1.6 }}>
                Textbooks, services, gigs, and more — offered by verified UniBlueprint students, posted from inside the app.
              </p>
            </div>
          </div>

          <div className="wb-market-grid">
            {MARKET_EXAMPLES.map(item => (
              <div key={item.title} className="wb-market-card">
                <div style={{ height: '6px', background: item.accent }} />
                <div style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <item.Icon size={12} color={item.accent} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '700', color: item.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.type}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#1E3A5F', lineHeight: 1.3 }}>
                    {item.title}
                  </p>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#1E3A5F', marginTop: '10px' }}>
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
            Illustrative examples. Real listings are posted by verified UniBlueprint users inside the app.
          </p>

          {/* Post a listing prompt */}
          <div style={{
            background: '#F5F0E8', borderRadius: '14px',
            padding: '28px 32px', marginTop: '32px',
            display: 'flex', alignItems: 'center', gap: '24px',
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
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>
                Want to post something?
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '6px', lineHeight: 1.55 }}>
                Post to the Marketplace, or the wider Ad Board, from inside the app in under a minute.
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
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '10px' }}>
            Open, swipe, jump straight there
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280',
            marginTop: '12px', maxWidth: '440px', margin: '12px auto 0', lineHeight: 1.65,
          }}>
            The Weekly Blueprint lives in the Ad Board tab of the app, and reads like a real magazine.
          </p>

          <div className="wb-steps" style={{ display: 'grid', gap: '20px', marginTop: '48px' }}>
            {[
              {
                n: '01', title: 'Open the Ad Board tab',
                body: 'Every UniBlueprint user gets the current issue automatically, free tier included.',
                colour: '#1E3A5F',
              },
              {
                n: '02', title: 'Swipe through the issue',
                body: 'Tap an arrow or swipe left and right, page by page, like flipping through a real magazine.',
                colour: '#2D4B8E',
              },
              {
                n: '03', title: 'Jump straight there',
                body: 'Tap any section on the contents page to skip straight to it, no flipping required.',
                colour: '#134E4A',
              },
            ].map(step => (
              <div key={step.n} style={{
                background: '#FFFFFF', borderRadius: '12px', padding: '28px',
                textAlign: 'left',
              }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: step.colour, lineHeight: 1 }}>
                  {step.n}
                </p>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', marginTop: '12px' }}>
                  {step.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: 1.6 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', color: '#F5F0E8' }}>
          Free for every user
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.6)',
          marginTop: '12px', maxWidth: '420px', margin: '12px auto 0', lineHeight: 1.65,
        }}>
          The Weekly Blueprint, and posting to the Marketplace and Ad Board, are included in the free
          tier. No subscription needed to read or post.
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
