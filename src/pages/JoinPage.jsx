import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UserCheck, Award, Megaphone, User, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  FormCard, FormField, FormInput, FormTextarea, FormSelect,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, getUTM, parseDbError,
} from '../components/ui/Form'

/*
  TODO: Create Supabase table:

  create table handler_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    university text not null,
    course text not null,
    year text not null,
    email text not null,
    why_apply text not null,
    hours_per_week text not null,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table handler_applications enable row level security;
  create policy "anon_insert" on handler_applications for insert to anon with check (true);

  create table coach_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    email text not null,
    linkedin_url text not null,
    specialisms text[] not null,
    experience text not null,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table coach_applications enable row level security;
  create policy "anon_insert" on coach_applications for insert to anon with check (true);

  create table ambassador_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    university text not null,
    course text not null,
    year text not null,
    email text not null,
    instagram_handle text,
    why_apply text not null,
    how_promote text not null,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text default 'pending'
  );
  alter table ambassador_applications enable row level security;
  create policy "anon_insert" on ambassador_applications for insert to anon with check (true);
*/

// ─── Data ──────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'handler-form',
    icon: UserCheck,
    title: 'Campus Handler',
    description: 'Review and deliver Foundation Blueprint outputs for students on your campus. Earn money per ticket. Get Pro free.',
    pills: ['Earn per ticket', 'Pro free', 'Flexible hours'],
    requirement: 'Must be a current university student in Ireland',
    cta: 'Apply as a Handler →',
  },
  {
    id: 'coach-form',
    icon: Award,
    title: 'Uni Coach',
    description: 'Deliver Elevation Blueprint services in your area of expertise. Earn commission per engagement. Get Pro free.',
    pills: ['Earn commission', 'Pro free', 'Build your practice'],
    requirement: 'Relevant professional experience or expertise required',
    cta: 'Apply as a Coach →',
  },
  {
    id: 'ambassador-form',
    icon: Megaphone,
    title: 'Ambassador',
    description: 'Represent UniBlueprint on your campus. Spread the word, recruit Handlers, and be part of the September launch.',
    pills: ['Pro free', 'Launch team', 'Campus presence'],
    requirement: null,
    cta: 'Apply as an Ambassador →',
  },
]

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

const COACH_PREVIEWS = [
  { category: 'Personal Branding', name: 'Coach Name', location: 'Dublin' },
  { category: 'Pitch Coaching',    name: 'Coach Name', location: 'Cork' },
  { category: 'Postgrad Support',  name: 'Coach Name', location: 'Dublin' },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function CoachPreviewCard({ category, name, location }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: '#F5F0E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <User size={36} color="#1E3A5F" />
      </div>
      <span style={{
        background: '#1E3A5F', color: '#F5F0E8',
        borderRadius: '20px', padding: '3px 10px',
        fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
        marginTop: '12px',
      }}>
        {category}
      </span>
      <p style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '17px', color: '#1E3A5F', marginTop: '8px',
      }}>
        {name}
      </p>
      <p style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280',
        marginTop: '4px',
      }}>
        <MapPin size={13} color="#6B7280" /> {location}
      </p>
      <Link
        to="/our-coaches"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '36px', padding: '0 20px',
          background: 'none', color: '#1E3A5F',
          border: '1.5px solid #1E3A5F', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
          textDecoration: 'none', marginTop: '14px',
        }}
      >
        View Profile
      </Link>
    </div>
  )
}

function RoleCard({ id, icon: Icon, title, description, pills, requirement, cta }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '28px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#F5F0E8', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={32} color="#1E3A5F" />
      </div>
      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '22px', color: '#1E3A5F',
        textAlign: 'center', marginTop: '16px',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#6B7280',
        textAlign: 'center', marginTop: '8px', lineHeight: 1.6,
      }}>
        {description}
      </p>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        justifyContent: 'center', marginTop: '16px',
      }}>
        {pills.map(p => (
          <span key={p} style={{
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '6px', padding: '4px 10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
          }}>
            {p}
          </span>
        ))}
      </div>
      {requirement && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#9CA3AF',
          textAlign: 'center', marginTop: '16px',
        }}>
          {requirement}
        </p>
      )}
      <a
        href={`#${id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '52px', width: '100%',
          background: '#1E3A5F', color: '#F5F0E8',
          borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
          textDecoration: 'none', marginTop: '20px',
        }}
      >
        {cta}
      </a>
    </div>
  )
}

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

// ─── Application forms ─────────────────────────────────────────────────────────

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

// ─── JoinPage ──────────────────────────────────────────────────────────────────

export default function JoinPage() {
  return (
    <>
      <Helmet>
        <title>Join the Team | UniBlueprint</title>
        <meta name="description" content="Join the team behind the Blueprint. Apply to become a Campus Handler, Uni Coach, or UniBlueprint Ambassador." />
        <meta property="og:title" content="Join the Team | UniBlueprint" />
        <meta property="og:description" content="Join the team behind the Blueprint. Apply to become a Campus Handler, Uni Coach, or UniBlueprint Ambassador." />
      </Helmet>

      <div style={{ background: '#F5F0E8' }}>
        {/* ── SECTION 1 — HERO ─────────────────────────────────────────────── */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '48px', color: '#1E3A5F',
          }}>
            Join the Team Behind the Blueprint
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px', color: '#6B7280',
            margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.6,
          }}>
            Campus Handlers. Uni Coaches. Ambassadors. Three ways to be part of something building across Ireland.
          </p>
        </section>

        {/* ── SECTION 2 — COACH PREVIEWS ──────────────────────────────────── */}
        <section style={{ background: '#F5F0E8', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '36px', color: '#1E3A5F',
            }}>
              Meet some of the coaches you would be joining
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px', color: '#6B7280',
              margin: '12px auto 0', maxWidth: '600px', lineHeight: 1.6,
            }}>
              As a Uni Coach you become part of a vetted network of specialists delivering Elevation Blueprint services across Ireland.
            </p>
            <div className="about-diff-grid" style={{ maxWidth: '900px', margin: '40px auto 0', gap: '16px' }}>
              {COACH_PREVIEWS.map(c => (
                <CoachPreviewCard key={c.category} {...c} />
              ))}
            </div>
            <Link
              to="/our-coaches"
              style={{
                display: 'inline-block',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                color: '#1E3A5F', textDecoration: 'none',
                marginTop: '24px',
              }}
            >
              See all coaches →
            </Link>
          </div>
        </section>

        {/* ── SECTION 3 — ROLE CARDS ───────────────────────────────────────── */}
        <section style={{ padding: '80px 24px 0' }}>
          <div className="about-diff-grid" style={{ maxWidth: '1100px', margin: '40px auto 0', gap: '16px' }}>
            {ROLES.map(r => (
              <RoleCard key={r.id} {...r} />
            ))}
          </div>
        </section>

        {/* ── SECTION 4 — APPLICATION FORMS ────────────────────────────────── */}
        <section style={{ padding: '80px 24px' }}>
          <div id="handler-form" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <HandlerForm />
          </div>
          <div id="coach-form" style={{ maxWidth: '640px', margin: '48px auto 0' }}>
            <CoachForm />
          </div>
          <div id="ambassador-form" style={{ maxWidth: '640px', margin: '48px auto 0' }}>
            <AmbassadorForm />
          </div>
        </section>

        {/* ── SECTION 5 — GENERAL CTA ──────────────────────────────────────── */}
        <section style={{ background: '#1E3A5F', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '32px', color: '#F5F0E8',
          }}>
            Not sure which role is right for you?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.7)',
            marginTop: '12px',
          }}>
            Get in touch and we will help you find the right fit.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '52px', padding: '0 36px',
              background: '#F5F0E8', color: '#1E3A5F',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              textDecoration: 'none', marginTop: '24px',
            }}
          >
            Get in touch →
          </Link>
        </section>
      </div>
    </>
  )
}
