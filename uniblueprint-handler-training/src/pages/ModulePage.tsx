import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { getModule, MODULES } from '../data/modules'
import { fetchProgress, isUnlocked, statusFor, upsertProgress } from '../lib/progress'
import { supabase } from '../lib/supabase'
import type { TrainingProgress } from '../lib/types'

export default function ModulePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const moduleId = Number(params.id)
  const moduleMeta = getModule(moduleId)

  const [progress, setProgress] = useState<TrainingProgress[] | null>(null)
  const [completing, setCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchProgress(user.id)
      .then(async (rows) => {
        setProgress(rows)
        const status = statusFor(moduleId, rows)
        if (status === 'not_started' && isUnlocked(moduleId, rows)) {
          await upsertProgress(user.id, moduleId, { status: 'in_progress' })
          setProgress(await fetchProgress(user.id))
        }
      })
      .catch(() => setLoadError(true))
  }, [user, moduleId])

  if (!moduleMeta || !Number.isFinite(moduleId)) {
    navigate('/dashboard', { replace: true })
    return null
  }

  if (loadError) {
    return (
      <div className="min-h-svh bg-cream">
        <Header backTo="/dashboard" />
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px]">
          Couldn't load this module. Check your connection and refresh the page.
        </div>
      </div>
    )
  }

  if (!user || progress === null) {
    return (
      <div className="min-h-svh bg-cream">
        <Header backTo="/dashboard" />
      </div>
    )
  }

  if (!isUnlocked(moduleId, progress)) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const status = statusFor(moduleId, progress)
  const isPassed = status === 'passed' || justCompleted
  const nextModule = MODULES.find((m) => m.id === moduleId + 1)

  const handleComplete = async () => {
    if (!user) return
    setCompleting(true)
    try {
      await upsertProgress(user.id, moduleId, {
        status: 'passed',
        completed_at: new Date().toISOString(),
        signed_off: true,
      })
      await supabase.from('handler_commitments').insert({
        user_id: user.id,
        module_id: moduleId,
      })
      setJustCompleted(true)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="min-h-svh bg-cream pb-16">
      <Header backTo="/dashboard" />

      <div className="px-6 mt-6">
        <p className="text-[13px] text-faint">Module {moduleId} of 6</p>
        <h1 className="font-heading text-navy text-[22px] mt-1">{moduleMeta.name}</h1>
      </div>

      <div className="bg-card rounded-card shadow-card p-8 mx-4 mt-4">
        <div className="module-content">
          <div className="callout callout-warning !mt-0">
            <BookOpen size={22} className="text-navy shrink-0 mt-0.5" />
            <p className="!mt-0 text-[15px] text-muted">
              Module {moduleId} content loading — content will be added shortly.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy/10">
          {moduleMeta.hasQuiz ? (
            isPassed ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-[14px] text-center">
                  Quiz passed
                  {progress.find((p) => p.module_id === moduleId)?.score != null
                    ? ` — score ${progress.find((p) => p.module_id === moduleId)?.score}%`
                    : ''}
                </div>
                <button
                  onClick={() => navigate(`/quiz/${moduleId}`)}
                  className="w-full h-[52px] rounded-lg border border-navy text-navy font-semibold text-[15px]"
                >
                  Review quiz
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/quiz/${moduleId}`)}
                className="w-full h-[52px] rounded-lg bg-navy text-cream font-semibold text-[15px]"
              >
                Proceed to Quiz
              </button>
            )
          ) : isPassed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-[14px] flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Module complete
              </div>
              {nextModule ? (
                <button
                  onClick={() => navigate(`/module/${nextModule.id}`)}
                  className="w-full h-[52px] rounded-lg bg-navy text-cream font-semibold text-[15px]"
                >
                  Continue to Module {nextModule.id}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-[52px] rounded-lg bg-navy text-cream font-semibold text-[15px]"
                >
                  Back to dashboard
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full h-[52px] rounded-lg bg-navy text-cream font-semibold text-[15px] disabled:opacity-70"
            >
              {completing ? 'Saving...' : 'I have read and understood this module'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
