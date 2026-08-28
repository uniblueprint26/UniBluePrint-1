import { Helmet } from 'react-helmet-async'
import { ArrowRight } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────
// Real titles, dates, and photos from the VSCO series. The full archive (43+
// posts) lives at vsco.co/uniblueprint — this page is a curated slice, not a
// mirror of it. Add new entries here as more get shared.

const BTB = [
  { label: '#001', date: 'Feb 28, 2026',   title: 'Pilot',              photo: '/images/btb/btb-001.jpg' },
  { label: '#002', date: 'Feb 28, 2026',   title: 'Cakes and Candles',  photo: '/images/btb/btb-002.jpg' },
  { label: '#003', date: 'Mar — Apr 2026', title: 'Finding the Pieces', photo: '/images/btb/btb-003.jpg' },
  { label: '#025', date: 'Apr 10, 2026',   title: 'First Look',         photo: '/images/btb/btb-025.jpg' },
  { label: '#027', date: 'Apr 14, 2026',   title: "We're Online",       photo: '/images/btb/btb-027.jpg' },
  { label: '#031', date: '2026',           title: 'Course Compass',    photo: '/images/btb/btb-031.jpg' },
  { label: '#036', date: 'May 5, 2026',    title: 'Ballyhaunis CS',     photo: '/images/btb/btb-036.jpg' },
  { label: '#037', date: 'May 7, 2026',    title: 'ATU Galway',         photo: '/images/btb/btb-037.jpg' },
  { label: '#038', date: 'May 8, 2026',    title: 'UCD',                photo: '/images/btb/btb-038.jpg' },
  { label: '#039', date: 'May 9, 2026',    title: 'Maynooth',           photo: '/images/btb/btb-039.jpg' },
  { label: '#040', date: 'May 13, 2026',   title: 'Preparations Pt. 1', photo: '/images/btb/btb-040.jpg' },
  { label: '#041', date: 'May 13, 2026',   title: 'Preparations Pt. 2', photo: '/images/btb/btb-041.jpg' },
  { label: '#042', date: 'May 14, 2026',   title: 'Showtime',           photo: '/images/btb/btb-042.jpg' },
  { label: '#043', date: 'May 16, 2026',   title: 'Cafe Conversations', photo: '/images/btb/btb-043.jpg' },
]

const ROTATIONS = [-2.4, 1.6, -1.2, 2.2, -2, 1.2, -2.6, 1.8, -1.6, 2.8, -1.8, 1.4, -2.2, 0.9]

// ─── Page styles ───────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .btb-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 36px 24px;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 24px;
  }
  @media (max-width: 900px) { .btb-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) { .btb-grid { grid-template-columns: repeat(2, 1fr); gap: 28px 16px; } }
`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BehindTheBlueprintPage() {
  return (
    <>
      <Helmet>
        <title>Behind The Blueprint | UniBlueprint</title>
        <meta
          name="description"
          content="The real, dated, documented story of how UniBlueprint got built — from a birthday dinner in Belfast to launch day, one post at a time."
        />
        <meta property="og:title" content="Behind The Blueprint | UniBlueprint" />
        <meta
          property="og:description"
          content="The real, dated, documented story of how UniBlueprint got built, one post at a time."
        />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '110px 24px 80px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(245,240,232,0.045) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', fontWeight: '700',
            color: 'rgba(245,240,232,0.45)',
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Behind The Blueprint
          </p>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(30px, 4.5vw, 50px)', color: '#F5F0E8',
            marginTop: '14px', lineHeight: 1.1, textWrap: 'balance',
          }}>
            Nothing here is a highlight reel.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.62)',
            marginTop: '18px', lineHeight: 1.7,
          }}>
            Every post is real, dated, and unedited — the actual calls, the actual campus
            visits, the actual nights spent piecing this together. This page is a slice of it.
            The rest lives on VSCO, if you want to go looking.
          </p>
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#EDE8DF', padding: '72px 0', position: 'relative' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(30,58,95,0.035) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="btb-grid" style={{ position: 'relative', zIndex: 1 }}>
          {BTB.map((item, i) => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', maxWidth: '220px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)',
                transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`,
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <img
                  src={item.photo}
                  alt={`Behind The Blueprint ${item.label.replace('#', '')} — "${item.title}"`}
                  loading="lazy"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VSCO CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(24px, 3vw, 32px)', color: '#1E3A5F',
            lineHeight: 1.2, margin: 0, textWrap: 'balance',
          }}>
            This is {BTB.length} of the posts. There are 40+ more.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280',
            marginTop: '14px', lineHeight: 1.7,
          }}>
            The full, ongoing archive — pilot to launch day — lives on VSCO. Nobody's
            advertising it. If you're here, you already found it.
          </p>
          <a
            href="https://vsco.co/uniblueprint"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              height: '50px', padding: '0 28px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              textDecoration: 'none', marginTop: '26px',
            }}
          >
            See the full archive on VSCO <ArrowRight size={14} />
          </a>
        </div>
      </section>
    </>
  )
}
