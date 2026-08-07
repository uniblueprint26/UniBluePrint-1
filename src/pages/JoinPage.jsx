import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UserCheck, Award, Megaphone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../components/ui/Form'

// ─── Data ─────────────────────────────────────────────────────────────────────

const UNIVERSITIES = [
  'University College Dublin',
  'Trinity College Dublin',
  'University College Cork',
  'Dublin City University',
  'University of Galway',
  'University of Limerick',
  'Maynooth University',
  'Technological University Dublin',
  'RCSI University',
  'Atlantic Technological University',
  'South East Technological University',
  'Dundalk Institute of Technology',
  'Other',
]

const YEARS = ['1st', '2nd', '3rd', '4th', '5th', 'Postgrad']
const HOURS = ['5-10', '10-15', '15-20', '20+']
const SPECIALISMS = [
  'Personal Branding',
  'Network Assistance',
  'Portfolio Building',
  'Mentorship Matching',
  'Pitch Coaching',
  'Postgrad Support',
]

// ─── Shared small components ──────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700',
      color: light ? 'rgba(245,240,232,0.45)' : '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: 0,
    }}>
      {children}
    </p>
  )
}

function BulletList({ items, dark }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: dark ? '#1E3A5F' : 'rgba(30,58,95,0.5)',
            flexShrink: 0, marginTop: '8px',
          }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', color: '#6B7280', lineHeight: 1.55,
          }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── SpecialismToggle ─────────────────────────────────────────────────────────

function SpecialismToggle({ value, onChange }) {
  function toggle(item) {
    if (value.includes(item)) onChange(value.filter(v => v !== item))
    else onChange([...value, item])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {SPECIALISMS.map(s => {
        const active = value.includes(s)
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            aria-pressed={active}
            style={{
              padding: '8px 14px',
              background: active ? '#1E3A5F' : '#F5F0E8',
              color: active ? '#F5F0E8' : '#1E3A5F',
              border: 'none', borderRadius: '20px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'background 150ms, color 150ms',
            }}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}

// ─── Application forms ────────────────────────────────────────────────────────

function HandlerForm() {
  const [form, setForm] = useState({
    full_name: '', university: '', course: '', year: '',
    email: '', why_apply: '', hours_per_week: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('handler_applications').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <FormCard title="Handler Application" subtitle="Applications are reviewed on a rolling basis. We'll be in touch within 2 business days.">
      {success ? (
        <SuccessCard title="Application received" subtitle="We'll review your application and be in touch within 2 business days." />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text" name="website" value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
          />
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <FormField label="Full name">
            <FormInput value={form.full_name} onChange={set('full_name')} placeholder="Aoife Murphy" required />
          </FormField>
          <FormField label="University">
            <FormSelect value={form.university} onChange={set('university')} required>
              <option value="">Select your university</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Course">
            <FormInput value={form.course} onChange={set('course')} placeholder="Business & Management" required />
          </FormField>
          <FormField label="Year of study">
            <FormSelect value={form.year} onChange={set('year')} required>
              <option value="">Select year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Email">
            <FormInput type="email" value={form.email} onChange={set('email')} placeholder="aoife@university.ie" required />
          </FormField>
          <FormField label="Why do you want to be a Campus Handler?">
            <FormTextarea value={form.why_apply} onChange={set('why_apply')} placeholder="I want to..." rows={5} required />
          </FormField>
          <FormField label="Hours available per week">
            <FormSelect value={form.hours_per_week} onChange={set('hours_per_week')} required>
              <option value="">Select hours</option>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </FormSelect>
          </FormField>

          <FormConsent />
          <SubmitButton loading={loading} label="Submit Handler Application" />
        </form>
      )}
    </FormCard>
  )
}

function CoachForm() {
  const [form, setForm] = useState({
    full_name: '', email: '', linkedin_url: '', experience: '',
  })
  const [specialisms, setSpecialisms] = useState([])
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('coach_applications').insert([{
      ...form,
      specialisms,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <FormCard title="Coach Application" subtitle="All applications are reviewed by our team. We will be in touch within 2 business days.">
      {success ? (
        <SuccessCard title="Application received" subtitle="We'll review your application and be in touch within 2 business days." />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text" name="website" value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
          />
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <FormField label="Full name">
            <FormInput value={form.full_name} onChange={set('full_name')} placeholder="Ciarán Kelly" required />
          </FormField>
          <FormField label="Email">
            <FormInput type="email" value={form.email} onChange={set('email')} placeholder="ciaran@example.ie" required />
          </FormField>
          <FormField label="LinkedIn profile URL">
            <FormInput value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/yourname" required />
          </FormField>
          <FormField label="Area of specialism" hint="Select all that apply">
            <SpecialismToggle value={specialisms} onChange={setSpecialisms} />
          </FormField>
          <FormField label="Describe your relevant experience">
            <FormTextarea value={form.experience} onChange={set('experience')} placeholder="I have experience in..." rows={5} required />
          </FormField>

          <FormConsent />
          <SubmitButton loading={loading} label="Submit Coach Application" />
        </form>
      )}
    </FormCard>
  )
}

function AmbassadorForm() {
  const [form, setForm] = useState({
    full_name: '', university: '', course: '', year: '',
    email: '', instagram_handle: '', why_apply: '', how_promote: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) { setSuccess(true); return }
    setLoading(true); setError(null)
    const { utm_source, utm_medium, utm_campaign } = getUTM()
    const { error: dbError } = await supabase.from('ambassador_applications').insert([{
      ...form,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      status: 'pending',
    }])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <FormCard title="Ambassador Application" subtitle="We're selecting ambassadors campus by campus ahead of September 2026. We will be in touch within 2 business days.">
      {success ? (
        <SuccessCard title="Application received" subtitle="We'll review your application and be in touch within 2 business days." />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text" name="website" value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
          />
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <FormField label="Full name">
            <FormInput value={form.full_name} onChange={set('full_name')} placeholder="Siobhán Ryan" required />
          </FormField>
          <FormField label="University">
            <FormSelect value={form.university} onChange={set('university')} required>
              <option value="">Select your university</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Course">
            <FormInput value={form.course} onChange={set('course')} placeholder="Business & Management" required />
          </FormField>
          <FormField label="Year of study">
            <FormSelect value={form.year} onChange={set('year')} required>
              <option value="">Select year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Email">
            <FormInput type="email" value={form.email} onChange={set('email')} placeholder="siobhan@university.ie" required />
          </FormField>
          <FormField label="Instagram handle (optional)">
            <FormInput value={form.instagram_handle} onChange={set('instagram_handle')} placeholder="@yourhandle" />
          </FormField>
          <FormField label="Why do you want to be an Ambassador?">
            <FormTextarea value={form.why_apply} onChange={set('why_apply')} placeholder="I want to represent UniBlueprint because..." rows={4} required />
          </FormField>
          <FormField label="How would you promote UniBlueprint on your campus?">
            <FormTextarea value={form.how_promote} onChange={set('how_promote')} placeholder="I would promote UniBlueprint by..." rows={4} required />
          </FormField>

          <FormConsent />
          <SubmitButton loading={loading} label="Submit Ambassador Application" />
        </form>
      )}
    </FormCard>
  )
}

// ─── Page styles ──────────────────────────────────────────────────────────────

const JOIN_STYLES = `
  .join-role-row {
    display: flex;
    gap: 64px;
    align-items: flex-start;
    max-width: 1100px;
    margin: 0 auto;
  }
  .join-role-info {
    flex: 1;
    min-width: 0;
  }
  .join-role-form {
    flex: 1;
    min-width: 0;
    max-width: 560px;
  }
  @media (max-width: 880px) {
    .join-role-row {
      flex-direction: column;
      gap: 40px;
    }
    .join-role-form {
      max-width: 100%;
      width: 100%;
    }
  }
`

// ─── RoleInfo ─────────────────────────────────────────────────────────────────

function RoleInfo({ icon: Icon, title, tagline, doItems, getItems }) {
  return (
    <div>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: '#1E3A5F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Icon size={28} color="#F5F0E8" strokeWidth={1.8} />
      </div>

      <h2 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: '32px', color: '#1E3A5F',
        lineHeight: 1.1, margin: 0,
      }}>
        {title}
      </h2>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px', color: '#6B7280',
        marginTop: '10px', lineHeight: 1.65,
        maxWidth: '400px',
      }}>
        {tagline}
      </p>

      <div style={{ marginTop: '28px' }}>
        <SectionLabel>What you do</SectionLabel>
        <BulletList items={doItems} dark />
      </div>

      <div style={{ marginTop: '24px' }}>
        <SectionLabel>What you get</SectionLabel>
        <BulletList items={getItems} dark />
      </div>
    </div>
  )
}

// ─── JoinPage ─────────────────────────────────────────────────────────────────

export default function JoinPage() {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Helmet>
        <title>Join the Team | UniBlueprint</title>
        <meta
          name="description"
          content="Join the team behind the Blueprint. Apply to become a Campus Handler, Uni Coach, or UniBlueprint Ambassador."
        />
        <style>{JOIN_STYLES}</style>
      </Helmet>

      {/* ── SECTION 1 — HERO ───────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '100px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '56px 56px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Join the team</SectionLabel>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(36px, 5vw, 60px)',
            color: '#F5F0E8',
            marginTop: '10px',
            lineHeight: 1.08,
          }}>
            Build something real.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: 'rgba(245,240,232,0.65)',
            margin: '16px auto 0',
            maxWidth: '560px',
            lineHeight: 1.65,
          }}>
            Campus Handlers, Uni Coaches, and Ambassadors are the people behind UniBlueprint. Join us.
          </p>

          {/* Role pills — scroll to each section */}
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'center',
            flexWrap: 'wrap', marginTop: '36px',
          }}>
            {[
              { label: 'Campus Handler', id: 'handler-form' },
              { label: 'Uni Coach', id: 'coach-form' },
              { label: 'Ambassador', id: 'ambassador-form' },
            ].map(({ label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px', fontWeight: '600',
                  color: '#1E3A5F', background: '#F5F0E8',
                  border: 'none', borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2a — CAMPUS HANDLER ────────────────────────────────────── */}
      <section id="handler-form" style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div className="join-role-row">
          <div className="join-role-info">
            <RoleInfo
              icon={UserCheck}
              title="Campus Handler"
              tagline="Review Foundation Blueprint submissions and provide written feedback to young people on your campus. Earn per review. Work flexibly."
              doItems={[
                'Review Foundation Blueprint submissions',
                'Provide written feedback to each user',
                'Work 2-4 hours per week, flexibly',
              ]}
              getItems={[
                'Paid per completed review',
                'Build your own CV and professional skills',
                'Part of the UniBlueprint team',
              ]}
            />
          </div>
          <div className="join-role-form">
            <HandlerForm />
          </div>
        </div>
      </section>

      {/* ── SECTION 2b — UNI COACH ─────────────────────────────────────────── */}
      <section id="coach-form" style={{ background: '#EDE8DF', padding: '80px 24px' }}>
        <div className="join-role-row">
          <div className="join-role-info">
            <RoleInfo
              icon={Award}
              title="Uni Coach"
              tagline="Deliver Elevation Blueprint services in your area of expertise. Set your own rates, choose your availability, and keep the majority of every booking."
              doItems={[
                'Deliver Elevation Blueprint services',
                'One-to-one sessions, coaching, and strategy',
                'Set your own rates and availability',
              ]}
              getItems={[
                'Keep 85% of every booking',
                'Full flexibility — you choose your hours',
                'Verified Coach badge on your profile',
              ]}
            />
          </div>
          <div className="join-role-form">
            <CoachForm />
          </div>
        </div>
      </section>

      {/* ── SECTION 2c — AMBASSADOR ────────────────────────────────────────── */}
      <section id="ambassador-form" style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div className="join-role-row">
          <div className="join-role-info">
            <RoleInfo
              icon={Megaphone}
              title="Ambassador"
              tagline="Be the face of UniBlueprint on your campus. Spread the word, build community, and shape how UniBlueprint launches in September 2026."
              doItems={[
                'Represent UniBlueprint on your campus',
                'Share with your network',
                'Host or attend events',
              ]}
              getItems={[
                'Free Pro subscription',
                'Exclusive Ambassador merchandise',
                'First access to new features',
              ]}
            />
          </div>
          <div className="join-role-form">
            <AmbassadorForm />
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — CTA ────────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '28px', color: '#F5F0E8',
          margin: 0,
        }}>
          Questions? Get in touch.
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', color: 'rgba(245,240,232,0.55)',
          marginTop: '8px',
        }}>
          We will help you find the right role.
        </p>
        <Link
          to="/contact"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '48px', padding: '0 28px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '24px',
          }}
        >
          Contact us
        </Link>
      </section>
    </>
  )
}
