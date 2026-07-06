import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Users, MessageCircle, Star, Car, Search, Lightbulb,
  BookOpen, Calendar, Map, AlertCircle, GitMerge, Sparkles,
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
  {
    icon: BookOpen,
    name: 'Shared Notes Board',
    description: 'Upload and access lecture notes, study guides, and revision materials shared by students on your campus.',
  },
  {
    icon: Users,
    name: 'Study Groups',
    description: 'Find or create study groups for your module or subject area. Set a time, place, and topic — others join from your campus.',
  },
  {
    icon: GitMerge,
    name: 'Project Collaboration',
    description: 'Post a project idea, find teammates across any discipline, and build something real — from apps and startups to research and creative work.',
  },
  {
    icon: Calendar,
    name: 'Campus Events Board',
    description: 'Find out what is happening on your campus — society events, career fairs, open days, and student-run events.',
  },
  {
    icon: Map,
    name: 'Campus Map',
    description: 'Interactive map of your campus — rooms, buildings, facilities, and services.',
    comingSoon: true,
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

const BOARDS_PREVIEW = [
  {
    name: 'Lost & Found',
    icon: Search,
    posts: [
      { author: 'Siofra', time: '2h ago', text: 'Found a set of keys near the library entrance — small keyring with a green fob. Drop me a message if they are yours.' },
      { author: 'Ciarán', time: '4h ago', text: 'Lost my navy hoodie in the sports hall yesterday afternoon. It has my initials on the sleeve. Anyone seen it?' },
      { author: 'Nicole', time: '1d ago', text: 'Handing in a student ID card to the main reception — name is too blurred to read. Owner please check with reception.' },
    ],
  },
  {
    name: 'Carpooling',
    icon: Car,
    posts: [
      { author: 'Abdullah', time: '1h ago', text: 'Driving Galway to Dublin this Friday evening, leaving around 5pm. Two seats free. €10 contribution towards petrol.' },
      { author: 'Eman', time: '3h ago', text: 'Looking for a lift from Cork to Dublin on Sunday morning. Happy to share costs — shoot me a message.' },
      { author: 'Ethan', time: '5h ago', text: 'Regular Athlone to Dublin commute Monday mornings. Can take one passenger — €8 each way.' },
      { author: 'Sam', time: '1d ago', text: 'Driving from Sligo to Galway on Saturday morning. Space for two. Just cover your share of fuel.' },
    ],
  },
  {
    name: 'Study Groups',
    icon: BookOpen,
    posts: [
      { author: 'Fiza', time: '30m ago', text: 'Setting up a Psychology study group for the upcoming end-of-semester exams. Galway campus, library room 2B. DM to join.' },
      { author: 'Zafir', time: '2h ago', text: 'Computer Science students — anyone want to work through the algorithms module together? Online or in DCU library.' },
      { author: 'Emily', time: '6h ago', text: 'Accounting and Finance study group forming for the financial reporting module. DCU students welcome. Starting next week.' },
    ],
  },
  {
    name: 'Events',
    icon: Calendar,
    posts: [
      { author: 'Mairead', time: '1h ago', text: 'DCU Fresher\'s Ball tickets go on sale this Thursday at 12pm. €25 each, limited numbers. Get them early.' },
      { author: 'Billy', time: '3h ago', text: 'ATU Galway Careers Fair next Tuesday in the main sports hall. Over 40 employers attending. Free entry for students.' },
      { author: 'Roisin', time: '1d ago', text: 'UCC Environmental Society beach clean this Saturday. Meeting at 10am at the main gate. All welcome — bring gloves!' },
      { author: 'Aoife', time: '2d ago', text: 'University of Galway Traditional Music Society session this Wednesday at 7pm in the Student Union bar. All instruments welcome.' },
    ],
  },
  {
    name: 'Problems & Solutions',
    icon: MessageCircle,
    posts: [
      { author: 'Harry', time: '45m ago', text: 'Anyone know how to apply for repeat accommodation after a deferred exam? The portal is confusing and the office is closed.' },
      { author: 'Sinead', time: '2h ago', text: 'Has anyone had issues with SUSI payments being delayed this semester? Mine is 3 weeks late and I can\'t get through on the phone.' },
      { author: 'Mohammed', time: '4h ago', text: 'DCU library booking system is down again. Anyone know another way to reserve a study room or a workaround?' },
    ],
  },
  {
    name: 'General Chat',
    icon: Users,
    posts: [
      { author: 'Gigi', time: '10m ago', text: 'Can we talk about how good the new canteen menu is? Finally something worth eating between lectures.' },
      { author: 'Luca', time: '1h ago', text: 'First week done. Already feels like I\'ve been here forever. Anyone else still figuring out where half the buildings are?' },
      { author: 'Sofia', time: '2h ago', text: 'Freshers week was so well organised this year. Shout out to the student union — genuinely enjoyed it.' },
      { author: 'Kofi', time: '3h ago', text: 'Does anyone know if the campus gym has student rates for new members? I can\'t find the pricing anywhere on their site.' },
    ],
  },
  {
    name: 'Open Projects',
    icon: GitMerge,
    posts: [
      { author: 'Luca', time: '2h ago', text: 'Building a student budgeting app for a final year project. Looking for a UX designer and someone with React experience. Reply if interested.' },
      { author: 'Zafir', time: '5h ago', text: 'Starting a podcast about student life and career paths. Need a co-host who is confident on audio and has opinions. DM me.' },
      { author: 'James', time: '1d ago', text: 'Engineering project: designing a low-cost water filtration system for a developing region. Need a teammate with CAD or materials experience.' },
    ],
  },
]

const CAMPUS_AD_POSTS = [
  { name: 'Aoife',    university: 'University of Galway', title: 'Piano & Music Lessons',    description: '1-to-1 from a 3rd year Music student. All levels welcome.', tag: 'Lessons',   price: 'From €20/hr' },
  { name: 'Zafir',   university: 'DCU',                  title: 'Maths & Stats Grinds',      description: 'Leaving Cert and 1st year college maths. Exam prep included.',  tag: 'Grinds',    price: '€25/hr' },
  { name: 'Luca',    university: 'UCD',                  title: 'Graphic Design Services',   description: 'Logos, social media content, and branding for student projects.', tag: 'Design',    price: 'From €50' },
  { name: 'Emma',    university: 'UL',                   title: 'Essay Proofreading',         description: 'Academic proofreading and feedback. 24hr turnaround available.',  tag: 'Academic',  price: 'From €15' },
  { name: 'Kofi',    university: 'DCU',                  title: 'Social Media Management',   description: 'Instagram and TikTok strategy, posting, and growth.',             tag: 'Marketing', price: 'From €80/mo' },
]

// ─── CampusConnectPage ─────────────────────────────────────────────────────────

export default function CampusConnectPage() {
  return (
    <>
      <Helmet>
        <title>Campus Connect | UniBlueprint</title>
        <meta
          name="description"
          content="Your campus community on UniBlueprint — groups, problems & solutions, deals, carpool, lost & found, and suggestions. Free for all users."
        />
        <meta property="og:title" content="Campus Connect | UniBlueprint" />
        <meta property="og:description" content="Your campus community on UniBlueprint — groups, problems & solutions, deals, carpool, lost & found, and suggestions. Free for all users." />
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
                position: 'relative',
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '24px',
              }}>
                {f.comingSoon && (
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(156,163,175,0.15)', color: '#9CA3AF',
                    borderRadius: '4px', padding: '3px 8px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    Coming Soon
                  </span>
                )}
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

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic',
          textAlign: 'center', margin: '24px auto 0', maxWidth: '560px',
        }}>
          UniBlueprint is launching across Irish campuses in September 2026. Confirmed institutions will be announced shortly.
        </p>
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

        <div style={{
          maxWidth: '900px', margin: '24px auto 0',
          background: '#FFFFFF', borderRadius: '12px',
          boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '20px', textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#F5F0E8', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={22} color="#1E3A5F" aria-hidden="true" />
          </div>
          <div>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '16px', color: '#1E3A5F',
            }}>
              No self-promotion in Campus Connect
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#6B7280',
              marginTop: '8px', lineHeight: 1.6,
            }}>
              Campus Connect is a community space — not an advertising board. Posts promoting businesses, services, or products will be removed. Use the Advertisement Board instead.
            </p>
            <a
              href="#"
              // TODO: Link to Advertisement Board deep link in app when available
              style={{
                display: 'inline-block', marginTop: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: '600', color: '#1E3A5F',
                textDecoration: 'none',
              }}
            >
              Go to Advertisement Board →
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 4.5 — BOARDS PREVIEW ─────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600', color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center',
          }}>
            Board Previews
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            What your campus boards look like
          </h2>

          {/* Mock content banner */}
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            borderLeft: '3px solid #1E3A5F',
            padding: '20px', margin: '32px 0',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
            boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#F5F0E8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#1E3A5F" />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>
                You are looking at example content
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
                These posts are sample content to show what Campus Connect boards look like inside the app. Real posts are created by students on your campus.
              </p>
            </div>
          </div>

          {/* Carpool safety notice */}
          <div style={{
            background: 'rgba(234,179,8,0.08)', borderRadius: '10px',
            border: '1px solid rgba(234,179,8,0.3)',
            padding: '14px 18px', marginBottom: '32px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <AlertCircle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#B45309', lineHeight: 1.5, margin: 0 }}>
              <strong>Carpooling safety reminder:</strong> Always verify who you are travelling with, share your journey details with a friend, and meet in a public place. UniBlueprint is not responsible for carpool arrangements made through the platform.
            </p>
          </div>

          {/* Board cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {BOARDS_PREVIEW.map(board => (
              <div key={board.name} style={{
                background: '#F5F0E8', borderRadius: '12px',
                padding: '24px',
              }}>
                {/* Board header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#1E3A5F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <board.icon size={20} color="#F5F0E8" />
                  </div>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F', margin: 0 }}>
                    {board.name}
                  </p>
                </div>

                {/* Posts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {board.posts.map((post, i) => (
                    <div key={i} style={{
                      background: '#FFFFFF', borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0px 1px 6px rgba(30,58,95,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: '#1E3A5F',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '13px', color: '#FFFFFF' }}>
                              {post.author.charAt(0)}
                            </span>
                          </div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600' }}>
                            {post.author}
                          </span>
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>
                          {post.time}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#374151', lineHeight: 1.55, margin: 0 }}>
                        {post.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4.75 — ADVERTISEMENT BOARD ───────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', fontWeight: '600', color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center',
          }}>
            Advertisement Board
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#1E3A5F',
            textAlign: 'center', marginTop: '8px',
          }}>
            Students helping students
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: '#6B7280',
            textAlign: 'center', margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.65,
          }}>
            The Advertisement Board is where students post services, gigs, and opportunities. Free to post for every user.
          </p>

          {/* Mock content banner */}
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            borderLeft: '3px solid #1E3A5F',
            padding: '20px', margin: '32px 0',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#F5F0E8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#1E3A5F" />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>
                You are looking at example content
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
                These are sample student ads to illustrate what the Advertisement Board looks like in the app. Real posts are created by students.
              </p>
            </div>
          </div>

          {/* 2-column ad grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
          className="campus-ad-grid">
            {CAMPUS_AD_POSTS.map(ad => (
              <div key={ad.title} style={{
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#1E3A5F', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '15px', color: '#FFFFFF' }}>
                      {ad.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600', margin: 0 }}>{ad.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{ad.university}</p>
                  </div>
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', margin: 0 }}>{ad.title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.45 }}>{ad.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                  <span style={{
                    background: '#F5F0E8', color: '#1E3A5F',
                    borderRadius: '6px', padding: '3px 10px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
                  }}>
                    {ad.tag}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', fontWeight: '600' }}>
                    {ad.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 600px) { .campus-ad-grid { grid-template-columns: 1fr !important; } }
        `}</style>
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
          Free for every UniBlueprint user. No upgrade required.
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
