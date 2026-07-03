import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error, user } = await login(email, accessCode)
    setLoading(false)
    if (error || !user) {
      setError(error)
      return
    }
    navigate(user.role === 'operations' ? '/operations' : '/dashboard')
  }

  return (
    <div className="min-h-svh bg-cream flex flex-col items-center px-4 py-10">
      <div className="text-center">
        <h1 className="font-heading text-navy text-[48px] leading-none inline-block border-b-2 border-navy pb-2">
          UBP
        </h1>
        <p className="mt-2 text-[16px] text-muted">Blueprint Studio Training</p>
      </div>

      <div className="w-full max-w-[400px] bg-card rounded-card shadow-card p-8 mt-10">
        <h2 className="font-heading text-navy text-[28px]">Welcome</h2>
        <p className="mt-2 text-[14px] text-muted">
          Enter your details to access your training.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-navy mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[52px] px-4 text-[16px] rounded-lg border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-[13px] font-semibold text-navy mb-1.5">
              Access code
            </label>
            <div className="relative">
              <input
                id="code"
                type={showCode ? 'text' : 'password'}
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full h-[52px] pl-4 pr-12 text-[16px] rounded-lg border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
                placeholder="Enter your access code"
              />
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                aria-label={showCode ? 'Hide access code' : 'Show access code'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-faint"
              >
                {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-[52px] rounded-lg bg-navy text-cream font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking...
              </>
            ) : (
              'Access Training'
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-[13px] text-faint text-center">
        Need help? Contact hello@uniblueprint.com
      </p>
    </div>
  )
}
