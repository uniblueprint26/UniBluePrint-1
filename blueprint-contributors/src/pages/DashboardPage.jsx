import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Loader2, UploadCloud, CheckCircle2, Clock, XCircle, ClipboardList, Lightbulb,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getCategory } from '../data/contributorCategories'

const STATUS_META = {
  approved: { label: 'Approved', color: '#16A34A', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 },
  pending: { label: 'Pending review', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: Clock },
  rejected: { label: 'Not approved', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: XCircle },
}

const UPLOAD_TIPS = [
  'One detailed, accurate resource beats ten thin ones — quality is judged first.',
  'Add real context: why it helped, who it is for, and when to use it.',
  'Spread contributions across categories to show variety and impact.',
  'Double-check subject, university and course details before submitting.',
]

function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '140px',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px 24px', textAlign: 'center',
    }}>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: color || '#1E3A5F' }}>
        {value}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
        {label}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const Icon = meta.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: meta.bg, color: meta.color,
      borderRadius: '20px', padding: '4px 12px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
      flexShrink: 0,
    }}>
      <Icon size={13} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function SubmissionRow({ submission }) {
  const category = getCategory(submission.category)
  const date = new Date(submission.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '18px 20px',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F' }}>
          {submission.title}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
          {category?.label || submission.category} &middot; {date}
        </p>
      </div>
      <StatusBadge status={submission.status} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
    }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <ClipboardList size={26} color="#1E3A5F" aria-hidden="true" />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F', marginTop: '16px' }}>
        No submissions yet
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '8px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Head to the Upload Centre to submit your first piece of content and start building your impact.
      </p>
      <Link
        to="/upload"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          height: '48px', padding: '0 28px', marginTop: '20px',
          background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', textDecoration: 'none',
        }}
      >
        <UploadCloud size={16} aria-hidden="true" />
        Go to Upload Centre
      </Link>
    </div>
  )
}

export default function ContributorDashboardPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [fullName, setFullName] = useState(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: subs, error: subsError }, { data: profile }] = await Promise.all([
        supabase.from('contributor_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ])
      if (subsError) setFetchError(true)
      else setSubmissions(subs || [])
      setFullName(profile?.full_name || null)
      setLoading(false)
    }
    load()
  }, [user])

  const firstName = fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Contributor'
  const counts = {
    total: submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    pending: submissions.filter(s => s.status === 'pending').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  return (
    <>
      <Helmet>
        <title>Contributor Dashboard | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Blueprint Contributors
            </p>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '6px' }}>
              Welcome back, {firstName}
            </h1>
          </div>
          <Link
            to="/upload"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '48px', padding: '0 24px',
              background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <UploadCloud size={16} aria-hidden="true" />
            Upload Centre
          </Link>
        </div>
      </section>

      <section style={{ background: '#F5F0E8', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <Loader2 size={32} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>Loading your dashboard…</p>
            </div>
          )}

          {!loading && fetchError && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#DC2626' }}>
                Something went wrong loading your submissions. Please refresh the page.
              </p>
            </div>
          )}

          {!loading && !fetchError && (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <StatCard label="Total submissions" value={counts.total} />
                <StatCard label="Approved" value={counts.approved} color="#16A34A" />
                <StatCard label="Pending review" value={counts.pending} color="#6B7280" />
                <StatCard label="Not approved" value={counts.rejected} color="#DC2626" />
              </div>

              {/* Submission history */}
              <div style={{ marginTop: '48px' }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1E3A5F', marginBottom: '16px' }}>
                  Your submissions
                </h2>
                {submissions.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {submissions.map(s => <SubmissionRow key={s.id} submission={s} />)}
                  </div>
                )}
              </div>

              {/* Upload tips */}
              <div style={{
                marginTop: '40px', background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '28px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lightbulb size={20} color="#1E3A5F" aria-hidden="true" />
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
                    Upload tips
                  </h3>
                </div>
                <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
                  {UPLOAD_TIPS.map(tip => (
                    <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={16} color="#16A34A" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
