import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { generateAccessCode } from '../lib/accessCode'
import { supabase } from '../lib/supabase'

export default function AddHandlerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [university, setUniversity] = useState('')
  const [accessCode, setAccessCode] = useState(() => generateAccessCode())
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error } = await supabase.from('training_users').insert({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      university: university.trim() || null,
      access_code: accessCode.trim(),
      role: 'handler',
    })
    setSaving(false)
    if (error) {
      setError(
        error.code === '23505'
          ? 'A handler with that email already exists.'
          : 'Something went wrong. Please try again.',
      )
      return
    }
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 px-4">
      <div className="bg-card rounded-card shadow-card w-full max-w-[440px] p-8 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-faint hover:text-navy"
        >
          <X size={20} />
        </button>

        <h2 className="font-heading text-navy text-[22px]">Add handler</h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-[48px] px-4 text-[15px] rounded-lg border border-navy/20 bg-white text-navy"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[48px] px-4 text-[15px] rounded-lg border border-navy/20 bg-white text-navy"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5">University</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full h-[48px] px-4 text-[15px] rounded-lg border border-navy/20 bg-white text-navy"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5">
              Access code
            </label>
            <div className="flex gap-2">
              <input
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="flex-1 h-[48px] px-4 text-[15px] tracking-wider rounded-lg border border-navy/20 bg-white text-navy font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="h-[48px] w-[48px] shrink-0 rounded-lg border border-navy/20 flex items-center justify-center text-navy"
                aria-label="Copy access code"
              >
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-[48px] rounded-lg bg-navy text-cream font-semibold text-[15px] mt-1 disabled:opacity-70"
          >
            {saving ? 'Adding...' : 'Add handler'}
          </button>
        </form>
      </div>
    </div>
  )
}
