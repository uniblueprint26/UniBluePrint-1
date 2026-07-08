import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function LoginDetailsCard({
  email,
  accessCode,
  className = 'bg-cream',
}: {
  email: string
  accessCode: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Email: ${email}\nAccess code: ${accessCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3 ${className}`}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-faint">
          Login details
        </p>
        <p className="text-[14px] text-navy mt-1">{email}</p>
        <p className="text-[14px] text-navy font-mono tracking-wider">{accessCode}</p>
      </div>
      <button
        onClick={handleCopy}
        className="h-[36px] px-3 rounded-lg border border-navy/20 flex items-center gap-1.5 text-[13px] text-navy shrink-0"
      >
        {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
