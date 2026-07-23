import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Paperclip, GraduationCap, Library, Users, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CONTRIBUTOR_CATEGORIES, CATEGORY_GROUPS, getCategory } from '../data/contributorCategories'
import {
  FormCard, FormField, FormInput, FormSelect, FormTextarea,
  SubmitButton, SuccessCard, ErrorBanner, FormConsent, parseDbError,
} from '../components/ui/Form'

const KNOWN_COLUMNS = ['subject', 'university', 'course', 'module_name', 'module_code', 'year_group']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 6

const GROUP_ICONS = {
  'leaving-cert': GraduationCap,
  'notes-course': Library,
  'campus': Users,
  'careers': Briefcase,
}

// ─── Category picker ────────────────────────────────────────────────────────────

function CategoryPicker({ onSelect }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F' }}>
          Upload Centre
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#6B7280', marginTop: '10px', maxWidth: '560px', margin: '10px auto 0', lineHeight: 1.7 }}>
          Choose a category to get started. Every submission is reviewed before it joins the UniBlueprint library.
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', maxWidth: '560px', margin: '10px auto 0', lineHeight: 1.6 }}>
          Not going to college? <strong style={{ color: '#6B7280' }}>PLC &amp; Further Education</strong>, <strong style={{ color: '#6B7280' }}>Apprenticeships</strong>, <strong style={{ color: '#6B7280' }}>Straight Into Work</strong> and <strong style={{ color: '#6B7280' }}>Gap Year</strong> are all here too.
        </p>
      </div>

      {CATEGORY_GROUPS.map(group => {
        const GroupIcon = GROUP_ICONS[group.id]
        const categories = CONTRIBUTOR_CATEGORIES.filter(c => c.group === group.id)
        return (
          <div key={group.id} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <GroupIcon size={18} color="#1E3A5F" aria-hidden="true" />
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', color: '#1E3A5F' }}>
                {group.label}
              </h2>
            </div>
            <div className="services-grid">
              {categories.map(category => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelect(category.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: '#FFFFFF', border: 'none', borderRadius: '12px',
                      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
                      padding: '24px', cursor: 'pointer', transition: 'box-shadow 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0px 4px 20px rgba(30,58,95,0.14)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.08)')}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color="#1E3A5F" aria-hidden="true" />
                    </div>
                    <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#1E3A5F', marginTop: '12px' }}>
                      {category.label}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.6 }}>
                      {category.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dynamic upload form ─────────────────────────────────────────────────────────

function UploadForm({ category, onBack }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState(null)
  const [fieldValues, setFieldValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const setField = key => e => setFieldValues(v => ({ ...v, [key]: e.target.value }))

  function handleFileChange(e) {
    let selected = Array.from(e.target.files || [])
    const messages = []

    if (selected.length > MAX_FILES) {
      messages.push(`Only the first ${MAX_FILES} files were kept (max ${MAX_FILES} per submission).`)
      selected = selected.slice(0, MAX_FILES)
    }

    const oversized = selected.filter(f => f.size > MAX_FILE_BYTES)
    if (oversized.length) {
      messages.push(`${oversized.length} file${oversized.length > 1 ? 's were' : ' was'} over 10MB and skipped.`)
      selected = selected.filter(f => f.size <= MAX_FILE_BYTES)
    }

    setFileError(messages.length ? messages.join(' ') : null)
    setFiles(selected)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const file_paths = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const path = `${user.id}/${Date.now()}-${i}-${f.name}`
      const { error: uploadError } = await supabase.storage.from('contributor-uploads').upload(path, f)
      if (uploadError) {
        setError('File upload failed. Please try again.')
        setLoading(false)
        return
      }
      file_paths.push(path)
    }

    const row = {
      user_id: user.id,
      category: category.id,
      title,
      description: description || null,
      link_url: linkUrl || null,
      file_paths,
    }
    const details = {}
    category.fields.forEach(f => {
      const value = fieldValues[f.key] || null
      if (KNOWN_COLUMNS.includes(f.key)) row[f.key] = value
      else details[f.key] = value
    })
    row.details = details

    const { error: dbError } = await supabase.from('contributor_submissions').insert([row])
    if (dbError) { setError(parseDbError(dbError)); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <FormCard>
        <SuccessCard
          title="Submission received"
          subtitle="Our team reviews every submission for quality, accuracy and usefulness. Approved content joins the UniBlueprint library ahead of launch."
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              height: '48px', padding: '0 24px',
              background: '#1E3A5F', color: '#F5F0E8', border: 'none', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Submit another
          </button>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: '48px', padding: '0 24px',
              background: '#FFFFFF', color: '#1E3A5F', border: '1.5px solid rgba(30,58,95,0.15)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500', textDecoration: 'none',
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </FormCard>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: '#1E3A5F',
          marginBottom: '20px', padding: '8px 0', minHeight: '44px',
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Choose a different category
      </button>

      <FormCard title={category.label} subtitle={category.description}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <FormField label="Title" required>
            <FormInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your submission a clear title" required />
          </FormField>

          <FormField label="Description" hint="Add context that helps our reviewers and future students understand this submission.">
            <FormTextarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your submission..." rows={4} />
          </FormField>

          {category.fields.map(f => (
            <FormField key={f.key} label={f.label} required={f.required}>
              {f.type === 'select' && (
                <FormSelect value={fieldValues[f.key] || ''} onChange={setField(f.key)} required={f.required}>
                  <option value="">Select {f.label.toLowerCase()}</option>
                  {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </FormSelect>
              )}
              {f.type === 'textarea' && (
                <FormTextarea value={fieldValues[f.key] || ''} onChange={setField(f.key)} rows={3} required={f.required} />
              )}
              {(f.type === 'text' || f.type === 'date') && (
                <FormInput type={f.type === 'date' ? 'date' : 'text'} value={fieldValues[f.key] || ''} onChange={setField(f.key)} required={f.required} />
              )}
            </FormField>
          ))}

          <FormField label="Link (optional)" hint="Add a URL if relevant — a resource link, article, or listing.">
            <FormInput type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://" />
          </FormField>

          <FormField label="Attach files (optional)" hint={`Photos, PDFs, or documents — up to ${MAX_FILES} files, max 10MB each.`} error={fileError}>
            <label style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: '10px',
              border: '1.5px dashed rgba(30,58,95,0.25)', borderRadius: '8px',
              padding: '12px 14px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F',
            }}>
              <Paperclip size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose files'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
              />
            </label>
            {files.length > 0 && (
              <ul style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none' }}>
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </FormField>

          <FormConsent />
          <SubmitButton loading={loading} label={`Submit ${category.label}`} loadingLabel="Submitting..." />
        </form>
      </FormCard>
    </div>
  )
}

// ─── ContributorUploadPage ───────────────────────────────────────────────────────

export default function ContributorUploadPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  const category = useMemo(() => (categoryId ? getCategory(categoryId) : null), [categoryId])

  function selectCategory(id) {
    setSearchParams({ category: id })
  }

  function clearCategory() {
    setSearchParams({})
  }

  return (
    <>
      <Helmet>
        <title>Upload Centre | Blueprint Contributors | UniBlueprint</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section style={{ background: '#F5F0E8', minHeight: '80vh', padding: '64px 24px 80px' }}>
        {category ? (
          <UploadForm category={category} onBack={clearCategory} />
        ) : (
          <CategoryPicker onSelect={selectCategory} />
        )}
      </section>
    </>
  )
}
