import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, Clock, Lock, XCircle } from 'lucide-react'
import Header from '../components/Header'
import LoginDetailsCard from '../components/LoginDetailsCard'
import { useAuth } from '../context/AuthContext'
import { MODULES } from '../data/modules'
import { fetchProgress, isUnlocked, statusFor } from '../lib/progress'
import type { ProgressStatus, TrainingProgress } from '../lib/types'

const STATUS_CONFIG: Record<
  ProgressStatus,
  { icon: typeof Circle; iconColor: string; borderColor: string; label: string; labelColor: string }
> = {
  not_started: {
    icon: Circle,
    iconColor: 'text-faint',
    borderColor: '',
    label: 'Not started',
    labelColor: 'text-faint',
  },
  in_progress: {
    icon: Clock,
    iconColor: 'text-navy',
    borderColor: 'border-l-navy',
    label: 'In progress',
    labelColor: 'text-navy',
  },
  passed: {
    icon: CheckCircle,
    iconColor: 'text-success',
    borderColor: 'border-l-success',
    label: 'Passed',
    labelColor: 'text-success',
  },
  failed: {
    icon: XCircle,
    iconColor: 'text-danger',
    borderColor: 'border-l-danger',
    label: 'Failed',
    labelColor: 'text-danger',
  },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [progress, setProgress] = useState<TrainingProgress[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchProgress(user.id)
      .then(setProgress)
      .catch(() => {
        setLoadError(true)
        setProgress([])
      })
  }, [user])

  if (!user || progress === null) {
    return (
      <div className="min-h-svh bg-cream">
        <Header />
      </div>
    )
  }

  const completedCount = MODULES.filter((m) => statusFor(m.id, progress) === 'passed').length
  const firstName = user.full_name.split(' ')[0]

  return (
    <div className="min-h-svh bg-cream">
      <Header />

      {loadError && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px]">
          Couldn't load your progress. Check your connection and refresh the page.
        </div>
      )}

      <div className="px-6 mt-6">
        <h1 className="font-heading text-navy text-[32px]">Welcome back, {firstName}.</h1>
        <p className="mt-2 text-[16px] text-muted">
          Complete all 6 modules to become an active Campus Handler.
        </p>
      </div>

      <div className="mx-4 mt-4">
        <LoginDetailsCard
          email={user.email}
          accessCode={user.access_code}
          className="bg-card shadow-card"
        />
      </div>

      <div className="bg-card rounded-card shadow-card p-5 mx-4 mt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
          Your progress
        </p>
        <div className="w-full h-2 bg-cream rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-navy rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / MODULES.length) * 100}%` }}
          />
        </div>
        <p className="text-right text-[13px] text-muted mt-2">
          {completedCount} of {MODULES.length} modules complete
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-4 mt-6 pb-10">
        {MODULES.map((module) => {
          const status = statusFor(module.id, progress)
          const unlocked = isUnlocked(module.id, progress)
          const config = STATUS_CONFIG[status]
          const Icon = unlocked ? config.icon : Lock

          let ctaLabel = 'Start Module'
          let ctaStyle = 'bg-navy text-cream'
          if (!unlocked) {
            ctaLabel = 'Locked'
            ctaStyle = 'bg-gray-200 text-faint cursor-not-allowed'
          } else if (status === 'in_progress') {
            ctaLabel = 'Continue'
            ctaStyle = 'bg-navy text-cream'
          } else if (status === 'passed') {
            ctaLabel = 'Review'
            ctaStyle = 'border border-navy text-navy bg-transparent'
          } else if (status === 'failed') {
            ctaLabel = 'Retake Quiz'
            ctaStyle = 'border border-danger text-danger bg-transparent'
          }

          return (
            <div
              key={module.id}
              className={`relative bg-card rounded-card shadow-card p-6 border-l-[3px] ${
                unlocked ? config.borderColor : 'border-l-transparent'
              } ${!unlocked ? 'opacity-60' : ''}`}
            >
              <Icon size={20} className={`absolute top-6 right-6 ${unlocked ? config.iconColor : 'text-faint'}`} />

              <p className="text-[11px] font-semibold uppercase text-faint tracking-[0.04em]">
                Module {module.id}
              </p>
              <h3 className="font-heading text-navy text-[18px] mt-1">{module.name}</h3>
              <p className="text-[13px] text-muted mt-2">{module.description}</p>
              <p className={`text-[12px] mt-3 ${unlocked ? config.labelColor : 'text-faint'}`}>
                {unlocked ? config.label : 'Locked'}
              </p>

              <button
                disabled={!unlocked}
                onClick={() =>
                  navigate(
                    status === 'failed' && module.hasQuiz
                      ? `/quiz/${module.id}`
                      : `/module/${module.id}`,
                  )
                }
                className={`w-full h-11 rounded-lg font-semibold text-[14px] mt-4 ${ctaStyle}`}
              >
                {ctaLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
