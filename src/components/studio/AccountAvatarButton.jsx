import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { NAVY, GREY, WHITE, BORDER, BORDER_STRONG, FONT_SANS, FONT_SERIF, OVERLAY } from './theme'
import { getMyStudioAvatar, uploadMyStudioAvatar } from '../../lib/studioMetrics'
import Avatar from './Avatar'

const MAX_BYTES = 5 * 1024 * 1024

// Studio Phase 14 -- the one clean, obvious spot in the Studio surface for
// a person to set their own photo: there is no existing account/profile
// settings page here to reuse (checked live -- every Studio hub page is a
// single dashboard, none has a "my account" section), so this is the
// minimal real upload UI the brief asks for when that's the case, placed
// in StudioShell's own header (rendered on every hub, same spot) rather
// than invented as a whole new page. The upload mechanism itself is NOT
// new -- getMyStudioAvatar()/uploadMyStudioAvatar() (studioMetrics.js)
// reuse the exact profile-pictures bucket/path/upsert convention the
// mobile app's ProfileScreen.jsx already writes through.
export default function AccountAvatarButton() {
  const [me, setMe] = useState(null) // { userId, fullName, avatarUrl }
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    getMyStudioAvatar().then(setMe).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > MAX_BYTES) { setError('Images must be under 5MB.'); return }
    setUploading(true)
    setError('')
    try {
      const url = await uploadMyStudioAvatar(file)
      setMe(m => ({ ...(m || {}), avatarUrl: url }))
    } catch (err) {
      setError(err.message || 'Could not upload that photo.')
    } finally {
      setUploading(false)
    }
  }

  if (!me) return null

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Your photo"
        title={me.fullName || 'Your photo'}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '50%', lineHeight: 0 }}
      >
        <Avatar name={me.fullName} userId={me.userId} avatarUrl={me.avatarUrl} size={32} />
      </button>

      {open && (
        <div className="studio-account-popover" role="dialog" aria-label="Your photo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={me.fullName} userId={me.userId} avatarUrl={me.avatarUrl} size={44} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: FONT_SERIF, fontSize: '15px', color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {me.fullName || 'Your profile'}
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: GREY, margin: '2px 0 0' }}>
                {me.avatarUrl ? 'Real photo' : 'Showing initials -- add a photo below'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: '12px', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              fontFamily: FONT_SANS, fontSize: '12.5px', fontWeight: 700, color: NAVY, height: '36px', borderRadius: '8px',
              border: `1px solid ${BORDER_STRONG}`, background: WHITE, cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Camera size={13} />}
            {me.avatarUrl ? 'Change photo' : 'Add a photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          {error && <p style={{ fontFamily: FONT_SANS, fontSize: '11.5px', color: 'var(--studio-red)', margin: '8px 0 0' }}>{error}</p>}
        </div>
      )}

      <style>{`
        .studio-account-popover {
          position: absolute; top: calc(100% + 10px); right: 0; z-index: 120; width: 240px;
          background: ${WHITE}; border: 1px solid ${BORDER_STRONG}; border-radius: 12px; box-shadow: 0 12px 32px ${OVERLAY};
          padding: 14px;
        }
        @media (max-width: 480px) { .studio-account-popover { right: -8px; width: 220px; } }
      `}</style>
    </div>
  )
}
