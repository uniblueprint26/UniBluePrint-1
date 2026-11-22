import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight } from 'lucide-react'
import { COACH_CATEGORIES, COACH_FILTERS, COACH_STEPS } from '../data/coaches'

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .ebp-coaches-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 1023px) { .ebp-coaches-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 639px)  { .ebp-coaches-grid { gap: 10px; } }
  .ebp-hero-inner {
    display: flex; align-items: center; gap: 48px;
    max-width: 1040px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  @media (max-width: 860px) {
    .ebp-hero-inner { flex-direction: column; }
    .ebp-hero-phone { display: none; }
  }
  .ebp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 800px; margin: 64px auto 0; }
  @media (max-width: 639px) { .ebp-steps-grid { grid-template-columns: 1fr; } }
  .ebp-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 36px; }
`

// ─── PhoneMockup ──────────────────────────────────────────────────────────────

// Reused on the homepage hero, which cycles between this and FoundationScreen.
export function ElevationScreen() {
  return (
    <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif" }}>9:41</span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: '3px', height: `${4 + i * 2}px`, background: i === 3 ? 'rgba(245,240,232,0.25)' : 'rgba(245,240,232,0.6)', borderRadius: '1px' }} />
          ))}
        </div>
      </div>
      {/* Header */}
      <div>
        <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elevation Blueprint</p>
        <p style={{ color: '#F5F0E8', fontSize: '16px', fontFamily: "'DM Serif Display',serif", marginTop: '3px', lineHeight: 1.2 }}>Your Coach<br />Session</p>
      </div>
      {/* Coach card */}
      <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(245,240,232,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,240,232,0.3),rgba(245,240,232,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Serif Display',serif" }}>C</span>
          </div>
          <div>
            <p style={{ color: '#F5F0E8', fontSize: '11px', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Your coach</p>
            <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>Uni Coach, Personal Training</p>
          </div>
        </div>
      </div>
      {/* Session info */}
      <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.08)' }}>
        <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next session</p>
        <p style={{ color: '#F5F0E8', fontSize: '13px', fontFamily: "'DM Serif Display',serif", marginTop: '3px' }}>Tomorrow, 7:00 AM</p>
        <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", marginTop: '2px' }}>Physique Development</p>
      </div>
      {/* Stats */}
      {[
        { label: 'Training plan: week 3 of 12', color: '#16A34A' },
        { label: 'Nutrition check-in today',    color: '#3B82F6' },
        { label: 'Progress: on track',           color: '#F59E0B' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', background: 'rgba(245,240,232,0.04)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
          <span style={{ color: 'rgba(245,240,232,0.55)', fontSize: '9px', fontFamily: "'DM Sans',sans-serif" }}>{item.label}</span>
        </div>
      ))}
      {/* CTA */}
      <div style={{ marginTop: 'auto', padding: '8px 10px', borderRadius: '8px', background: '#F5F0E8', textAlign: 'center' }}>
        <span style={{ color: '#1E3A5F', fontSize: '10px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Book your Coach</span>
      </div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="ebp-hero-phone" style={{
      width: 230, borderRadius: '44px', background: '#0c1520', padding: '8px',
      boxShadow: '0 56px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'relative',
      transform: 'rotate(-2deg) translateY(8px)',
    }}>
      <div style={{ position: 'absolute', right: '-3px', top: '96px', width: '3px', height: '44px', background: '#1a2535', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '76px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '32px', background: '#1a2535', borderRadius: '3px 0 0 3px' }} />
      <div style={{ borderRadius: '36px', overflow: 'hidden', width: 214, height: 463, background: '#1E3A5F' }}>
        <ElevationScreen />
      </div>
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  )
}

// ─── CategoryCard ────────────────────────────────────────────────────────

function CategoryCard({ title, blurb, accent }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '14px',
      boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
      borderTop: `3px solid ${accent}`,
      padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
    }}>
      <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: '#1E3A5F', margin: 0 }}>
        {title}
      </p>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: '10px 0 0', flex: 1 }}>
        {blurb}
      </p>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', fontWeight: 600, color: accent, margin: '16px 0 0' }}>
        Meet them in the app
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ElevationBlueprintPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const visible = activeFilter === 'All'
    ? COACH_CATEGORIES
    : COACH_CATEGORIES.filter(c => c.filter === activeFilter)

  return (
    <>
      <Helmet>
        <title>Uni Coaches | UniBlueprint</title>
        <meta name="description" content="Uni Coaches delivering personal training, career coaching, finance, creative skills, and more across Ireland. Book directly in the app." />
        <meta property="og:title" content="Uni Coaches | UniBlueprint" />
        <meta property="og:description" content="Uni Coaches delivering personal training, career coaching, finance, creative skills, and more across Ireland." />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '120px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="ebp-hero-inner">
          <PhoneMockup />

          {/* Text block */}
          <div style={{
            flex: 1,
            background: 'rgba(245,240,232,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.12)',
            borderRadius: '20px',
            padding: '48px 40px',
          }}>
            <p style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
              color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
            }}>
              Elevation Blueprint
            </p>
            <h1 style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: 'clamp(28px,3.5vw,46px)', color: '#F5F0E8',
              marginTop: '10px', lineHeight: 1.12,
            }}>
              Uni Coaches
            </h1>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '15px', color: 'rgba(245,240,232,0.65)',
              marginTop: '14px', lineHeight: 1.7,
            }}>
              Coaches across Ireland in fitness, career, finance, creative skills, and more.
              Meet them in the app, where every coach has their own profile.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              {[
                'Personal training, physique coaching, and online fitness plans',
                'Personal finance, digital marketing, and personal branding',
                'Photography, videography, and creative mentorship',
                'Academic grinds, career counselling, and sports coaching',
              ].map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F5F0E8', flexShrink: 0, marginTop: '8px', opacity: 0.55 }} />
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.55, margin: 0 }}>
                    {pt}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/coming-soon" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginTop: '30px', height: '46px', padding: '0 24px',
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
              fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
              Download the app <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COACHES GRID ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Filter bar */}
          <div className="ebp-filter-bar">
            {COACH_FILTERS.map(f => {
              const active = f === activeFilter
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                    border: `1.5px solid ${active ? '#1E3A5F' : 'rgba(30,58,95,0.15)'}`,
                    background: active ? '#1E3A5F' : '#FFFFFF',
                    color: active ? '#F5F0E8' : '#6B7280',
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: '13px', fontWeight: active ? '600' : '400',
                    transition: 'all 160ms ease', whiteSpace: 'nowrap',
                  }}
                >
                  {f}
                </button>
              )
            })}
          </div>

          {/* Grid */}
          {visible.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '15px', color: '#9CA3AF', textAlign: 'center', padding: '48px 0' }}>
              Nothing in this category yet.
            </p>
          ) : (
            <div className="ebp-coaches-grid">
              {visible.map(c => <CategoryCard key={c.id} {...c} />)}
            </div>
          )}

          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF',
            textAlign: 'center', marginTop: '40px', lineHeight: 1.6,
          }}>
            Names, profiles, pricing and booking are inside the UniBlueprint app.
          </p>

          <div className="ebp-steps-grid">
            {COACH_STEPS.map(st => (
              <div key={st.n}>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '28px', color: '#1E3A5F', margin: 0 }}>{st.n}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: 600, color: '#1E3A5F', margin: '6px 0 0' }}>{st.title}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '6px 0 0' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BECOME A COACH CTA ───────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '88px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: '11px', fontWeight: '700',
          color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>
          Join the team
        </p>
        <h2 style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: 'clamp(28px,4vw,42px)', color: '#F5F0E8',
          marginTop: '10px', lineHeight: 1.12,
        }}>
          Want to be featured here?
        </h2>
        <p style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '15px', color: 'rgba(245,240,232,0.6)',
          marginTop: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
        }}>
          Apply to become a Uni Coach and build your client base through UniBlueprint.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          <Link to="/join#coach-form" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            height: '50px', padding: '0 30px',
            background: '#F5F0E8', color: '#1E3A5F', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Apply as a Coach <ArrowRight size={15} />
          </Link>
          <Link to="/coming-soon" style={{
            display: 'inline-flex', alignItems: 'center',
            height: '50px', padding: '0 28px',
            background: 'transparent', color: 'rgba(245,240,232,0.75)',
            border: '1px solid rgba(245,240,232,0.2)', borderRadius: '8px',
            fontFamily: "'DM Sans',sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Download the app
          </Link>
        </div>
      </section>
    </>
  )
}
