import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Loader2, CheckCircle2, XCircle, Clock, Paperclip, Link2, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getCategory, CONTRIBUTOR_CATEGORIES } from '../data/contributorCategories'

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

const STATUS_META = {
  approved: { label: 'Approved', color: '#16A34A', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: Clock },
  rejected: { label: 'Rejected', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: XCircle },
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

function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '120px',
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '18px 20px', textAlign: 'center',
    }}>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: color || '#1E3A5F' }}>{value}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{label}</p>
    </div>
  )
}

function ActionButton({ onClick, disabled, variant, children }) {
  const styles = {
    approve: { background: '#16A34A', color: '#FFFFFF' },
    reject: { background: '#DC2626', color: '#FFFFFF' },
    reset: { background: '#FFFFFF', color: '#1E3A5F', border: '1px solid rgba(30,58,95,0.2)' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '36px', padding: '0 16px',
        borderRadius: '8px', border: 'none',
        fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...styles,
      }}
    >
      {children}
    </button>
  )
}

function SubmissionRow({ submission, submitterName, onUpdateStatus, updating }) {
  const category = getCategory(submission.category)
  const date = new Date(submission.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })

  async function handleViewFile(path) {
    const { data, error } = await supabase.storage
      .from('contributor-uploads')
      .createSignedUrl(path, 60)
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const filePaths = submission.file_paths || []

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#F5F0E8', color: '#1E3A5F', borderRadius: '6px', padding: '3px 10px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
            }}>
              {category?.label || submission.category}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F', marginTop: '10px' }}>
            {submission.title}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            by {submitterName || 'Unknown'} &middot; {date}
          </p>
          {submission.description && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '10px', lineHeight: 1.6 }}>
              {submission.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
            {submission.link_url && (
              <a
                href={submission.link_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}
              >
                <Link2 size={14} aria-hidden="true" /> View link
              </a>
            )}
            {filePaths.map((path, i) => (
              <button
                key={path}
                onClick={() => handleViewFile(path)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}
              >
                <Paperclip size={14} aria-hidden="true" /> {filePaths.length > 1 ? `File ${i + 1}` : 'View file'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {submission.status !== 'approved' && (
            <ActionButton variant="approve" disabled={updating} onClick={() => onUpdateStatus(submission.id, 'approved')}>
              <CheckCircle2 size={14} aria-hidden="true" /> Approve
            </ActionButton>
          )}
          {submission.status !== 'rejected' && (
            <ActionButton variant="reject" disabled={updating} onClick={() => onUpdateStatus(submission.id, 'rejected')}>
              <XCircle size={14} aria-hidden="true" /> Reject
            </ActionButton>
          )}
          {submission.status !== 'pending' && (
            <ActionButton variant="reset" disabled={updating} onClick={() => onUpdateStatus(submission.id, 'pending')}>
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OperationsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [statusTab, setStatusTab] = useState('pending')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  async function load() {
    setLoading(true)
    const [{ data: subs, error: subsError }, { data: profiles }] = await Promise.all([
      supabase.from('contributor_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
    ])
    if (subsError) setFetchError(true)
    else setSubmissions(subs || [])
    const map = {}
    ;(profiles || []).forEach(p => { map[p.id] = p.full_name })
    setProfilesById(map)
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function handleUpdateStatus(id, status) {
    setUpdatingId(id)
    const { error } = await supabase.from('contributor_submissions').update({ status }).eq('id', id)
    if (!error) {
      setSubmissions(subs => subs.map(s => (s.id === id ? { ...s, status } : s)))
    }
    setUpdatingId(null)
  }

  const counts = useMemo(() => ({
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    total: submissions.length,
  }), [submissions])

  const filtered = useMemo(() => submissions
    .filter(s => statusTab === 'all' || s.status === statusTab)
    .filter(s => categoryFilter === 'all' || s.category === categoryFilter),
  [submissions, statusTab, categoryFilter])

  return (
    <>
      <Helmet>
        <title>Operations | Blueprint Contributors</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '64px 24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Operations
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', marginTop: '6px' }}>
            Submission review
          </h1>
        </div>
      </section>

      <section style={{ background: '#F5F0E8', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <Loader2 size={32} color="#1E3A5F" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>Loading submissions…</p>
            </div>
          )}

          {!loading && fetchError && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#DC2626' }}>
                Something went wrong loading submissions. Please refresh the page.
              </p>
            </div>
          )}

          {!loading && !fetchError && (
            <>
              <div className="stats-grid">
                <StatCard label="Pending" value={counts.pending} color="#6B7280" />
                <StatCard label="Approved" value={counts.approved} color="#16A34A" />
                <StatCard label="Rejected" value={counts.rejected} color="#DC2626" />
                <StatCard label="Total" value={counts.total} />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '32px' }}>
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusTab(tab.value)}
                    style={{
                      height: '36px', padding: '0 18px', borderRadius: '20px',
                      border: 'none', cursor: 'pointer',
                      background: statusTab === tab.value ? '#1E3A5F' : '#FFFFFF',
                      color: statusTab === tab.value ? '#F5F0E8' : '#1E3A5F',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{
                    height: '36px', borderRadius: '20px', border: '1px solid rgba(30,58,95,0.15)',
                    padding: '0 14px', background: '#FFFFFF', color: '#1E3A5F',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  <option value="all">All categories</option>
                  {CONTRIBUTOR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>No submissions match this filter.</p>
                  </div>
                )}
                {filtered.map(s => (
                  <SubmissionRow
                    key={s.id}
                    submission={s}
                    submitterName={profilesById[s.user_id]}
                    onUpdateStatus={handleUpdateStatus}
                    updating={updatingId === s.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
