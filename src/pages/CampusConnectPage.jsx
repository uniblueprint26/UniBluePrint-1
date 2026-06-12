import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Users, MessageCircle, Star, Car, Search, Lightbulb,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    name: 'Campus Groups',
    description: 'Join or create groups for societies, clubs, courses, and shared interests on your campus.',
  },
  {
    icon: MessageCircle,
    name: 'Problems & Solutions',
    description: "Post questions, get answers from students who've been there — from housing to modules.",
  },
  {
    icon: Star,
    name: 'Deals & Reviews',
    description: 'Share and discover reviews of local spots, landlords, services, and campus facilities.',
  },
  {
    icon: Car,
    name: 'Carpool',
    description: 'Find or offer lifts between campus and home — connect with students going your way.',
  },
  {
    icon: Search,
    name: 'Lost & Found',
    description: 'Report and find lost items across campus. A simple board that actually works.',
  },
  {
    icon: Lightbulb,
    name: 'Suggestions',
    description: 'Submit ideas for your campus community — the best ones get acted on.',
  },
]

const UNIVERSITIES = [
  { name: 'University College Dublin', short: 'UCD' },
  { name: 'Trinity College Dublin', short: 'TCD' },
  { name: 'University College Cork', short: 'UCC' },
  { name: 'Dublin City University', short: 'DCU' },
  { name: 'University of Galway', short: 'UoG' },
  { name: 'University of Limerick', short: 'UL' },
  { name: 'Maynooth University', short: 'MU' },
  { name: 'Technological University Dublin', short: 'TUD' },
  { name: 'RCSI University', short: 'RCSI' },
  { name: 'Dundalk Institute of Technology', short: 'DKIT' },
  { name: 'Waterford Institute of Technology', short: 'SETU' },
  { name: 'Atlantic Technological University', short: 'ATU' },
]

const STANDARDS = [
  { title: 'Be respectful', description: 'Treat every member as you would want to be treated. No harassment, hate speech, or personal attacks.' },
  { title: 'Keep it relevant', description: 'Post in the right board. Keep discussions on topic so everyone gets value from the community.' },
  { title: 'No spam or promotion', description: 'Unsolicited advertising or repeated self-promotion is not permitted.' },
  { title: 'Protect privacy', description: 'Do not share personal information about others without their consent.' },
]

// ─── CampusConnectPage ─────────────────────────────────────────────────────────

export default function CampusConnectPage() {
  return (
    <>
      <Helmet>
        <title>Campus Connect | Uniblueprint</title>
        <meta
          name="description"
          content="Your campus community on Uniblueprint — groups, problems & solutions, deals, carpool, lost & found, and suggestions. Free for all users."
        />
        <meta property="og:title" content="Campus Connect | Uniblueprint" />
        <meta property="og:description" content="Your campus community on Uniblueprint — groups, problems & solutions, deals, carpool, lost & found, and suggestions. Free for all users." />
      </Helmet>

      {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '48px', color: '#1E3A5F',
        }}>
          Campus Connect
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.6,
        }}>
          Your campus. Your community.
        </p>
        <div style={{ marginTop: '16px' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(22,163,74,0.1)', color: '#16A34A',
            borderRadius: '6px', padding: '5px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: '700',
          }}>
            Free for all users
          </span>
        </div>
      </section>

      {/* ── SECTION 2 — FEATURE CARDS ────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600',
            color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            What's included
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Everything your campus needs in one place
          </h2>

          <div className="services-grid" style={{ marginTop: '40px' }}>
            {FEATURES.map(f => (
              <div key={f.name} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#F5F0E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={24} color="#1E3A5F" />
                </div>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '17px', color: '#1E3A5F', marginTop: '12px',
                }}>
                  {f.name}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: '#6B7280',
                  marginTop: '6px', lineHeight: 1.6,
                }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — CAMPUS GRID ───────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Launching across Ireland
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          textAlign: 'center', margin: '12px auto 0', maxWidth: '560px', lineHeight: 1.7,
        }}>
          Campus Connect launches at Irish universities and colleges during freshers week, September 2026.
        </p>

        <div style={{
          maxWidth: '900px', margin: '40px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          {UNIVERSITIES.map(u => (
            <div key={u.short} style={{
              background: '#F5F0E8', borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <span style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '20px', color: '#1E3A5F',
              }}>
                {u.short}
              </span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#9CA3AF',
                lineHeight: 1.4,
              }}>
                {u.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — COMMUNITY STANDARDS ──────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '36px', color: '#1E3A5F',
          textAlign: 'center',
        }}>
          Community standards
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: '#6B7280',
          textAlign: 'center', margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.7,
        }}>
          Campus Connect is moderated. We set standards that keep the community genuinely useful and safe.
        </p>

        <div className="about-team-grid" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          {STANDARDS.map(s => (
            <div key={s.title} style={{
              background: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
              padding: '20px 24px',
            }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '16px', color: '#1E3A5F',
              }}>
                {s.title}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', color: '#6B7280',
                marginTop: '6px', lineHeight: 1.6,
              }}>
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5 — CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '40px', color: '#F5F0E8',
        }}>
          Join your campus community
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px', color: 'rgba(245,240,232,0.7)',
          marginTop: '12px',
        }}>
          Free for every Uniblueprint user. No upgrade required.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            to="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Sign up free
          </Link>
        </div>
      </section>
    </>
  )
}
