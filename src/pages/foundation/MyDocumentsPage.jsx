import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Trash2, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FormCard, ErrorBanner } from '../../components/ui/Form'

/**
 * Every builder inserts its row BEFORE calling the generator, so any failure
 * (or an abandoned tab) leaves a `draft` row the user could never see or clean
 * up. This is the recovery surface for that: one unified list across all
 * document types, with delete. Deliberately minimal — the job is visibility,
 * not polish.
 */
const SOURCES = [
  { table: 'cv_documents', label: 'CV', route: '/foundation/cv-builder', title: (r) => r.title || 'Untitled CV' },
  { table: 'cover_letters', label: 'Cover letter', route: '/foundation/cover-letter', title: (r) => [r.target_role, r.target_company].filter(Boolean).join(' at ') || 'Untitled cover letter' },
  { table: 'linkedin_documents', label: 'LinkedIn', route: '/foundation/linkedin-optimisation', title: (r) => r.target_role || r.target_industry || 'LinkedIn profile' },
  { table: 'application_forms', label: 'Application form', route: '/foundation/application-form-assistance', title: (r) => [r.target_role, r.target_company].filter(Boolean).join(' at ') || 'Untitled application' },
  { table: 'interview_prep_packs', label: 'Interview prep', route: '/foundation/interview-preparation', title: (r) => r.target_role || 'Interview prep pack' },
  { table: 'personal_statements', label: 'Personal statement', route: '/foundation/personal-statement', title: (r) => [r.target_course, r.target_institution].filter(Boolean).join(' at ') || 'Untitled statement' },
  { table: 'portfolio_plans', label: 'Portfolio plan', route: '/foundation/portfolio-building', title: (r) => r.field || 'Portfolio plan' },
  { table: 'job_search_sessions', label: 'Job search', route: '/foundation/job-search-support', title: (r) => r.input?.field_or_industry || 'Job search strategy' },
]

const STATUS_STYLE = {
  draft: { bg: 'rgba(156,107,38,0.12)', fg: '#9C6B26', label: 'Draft — not generated' },
  generated: { bg: 'rgba(30,58,95,0.08)', fg: '#1E3A5F', label: 'Generated' },
  submitted: { bg: 'rgba(22,163,74,0.12)', fg: '#15803D', label: 'With Handler' },
  delivered: { bg: 'rgba(22,163,74,0.18)', fg: '#14532D', label: 'Delivered' },
}

export default function MyDocumentsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.all(
        SOURCES.map(async (src) => {
          const { data, error: err } = await supabase
            .from(src.table)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (err) throw err
          return (data || []).map((r) => ({
            id: r.id,
            table: src.table,
            label: src.label,
            route: src.route,
            title: src.title(r),
            status: r.status || 'draft',
            createdAt: r.created_at,
          }))
        }),
      )
      setRows(results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) {
      setError(err.message || 'Could not load your documents.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  const handleDelete = async (row) => {
    const { error: err } = await supabase.from(row.table).delete().eq('id', row.id)
    if (err) { setError(err.message); return }
    setRows((rs) => rs.filter((r) => !(r.id === row.id && r.table === row.table)))
  }

  return (
    <>
      <Helmet><title>My Documents | UniBlueprint</title></Helmet>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link to="/foundation-blueprint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Foundation Blueprint
        </Link>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>My Documents</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '8px', marginBottom: '32px', lineHeight: 1.7 }}>
          Everything you've started across the Foundation Blueprint tools. Drafts are ones that never finished generating — you can delete them here.
        </p>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280' }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Loading your documents…
          </div>
        ) : rows.length === 0 ? (
          <FormCard>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <FileText size={40} color="#9CA3AF" aria-hidden="true" style={{ marginBottom: '12px' }} />
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1E3A5F' }}>Nothing here yet</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7280', marginTop: '6px' }}>
                Anything you build with the Foundation Blueprint tools will show up here.
              </p>
            </div>
          </FormCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map((row) => {
              const s = STATUS_STYLE[row.status] || STATUS_STYLE.draft
              return (
                <div key={`${row.table}-${row.id}`} style={{ background: '#FFFFFF', borderRadius: '10px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: s.fg, background: s.bg, padding: '2px 8px', borderRadius: '10px' }}>{s.label}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14.5px', fontWeight: 600, color: '#1E3A5F', marginTop: '5px' }}>{row.title}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <Link to={row.route} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1E3A5F', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      Open tool
                    </Link>
                    <button
                      type="button" onClick={() => handleDelete(row)}
                      aria-label={`Delete ${row.label}: ${row.title}`}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
