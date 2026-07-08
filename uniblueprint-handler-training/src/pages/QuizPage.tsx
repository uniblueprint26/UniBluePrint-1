import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { getModule, MODULES } from '../data/modules'
import { QUIZZES } from '../data/quizzes'
import { fetchProgress, isUnlocked, upsertProgress } from '../lib/progress'
import { supabase } from '../lib/supabase'
import type { TrainingProgress } from '../lib/types'

const PASS_THRESHOLD = 80

export default function QuizPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const moduleId = Number(params.id)
  const moduleMeta = getModule(moduleId)
  const questions = QUIZZES[moduleId]

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [progress, setProgress] = useState<TrainingProgress[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchProgress(user.id)
      .then(setProgress)
      .catch(() => setLoadError(true))
  }, [user])

  if (!moduleMeta || !questions) {
    navigate('/dashboard', { replace: true })
    return null
  }

  if (loadError) {
    return (
      <div className="min-h-svh bg-cream">
        <Header backTo={`/module/${moduleId}`} />
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px]">
          Couldn't load this quiz. Check your connection and refresh the page.
        </div>
      </div>
    )
  }

  if (!user || progress === null) {
    return (
      <div className="min-h-svh bg-cream">
        <Header backTo={`/module/${moduleId}`} />
      </div>
    )
  }

  if (!isUnlocked(moduleId, progress)) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const question = questions[index]
  const isLast = index === questions.length - 1
  const nextModule = MODULES.find((m) => m.id === moduleId + 1)

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [index]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (!user || submitting) return
    setSubmitting(true)
    try {
      const correct = questions.reduce(
        (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
        0,
      )
      const score = Math.round((correct / questions.length) * 100)
      const passed = score >= PASS_THRESHOLD

      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        module_id: moduleId,
        answers,
        score,
        passed,
      })

      await upsertProgress(user.id, moduleId, {
        status: passed ? 'passed' : 'failed',
        score,
        completed_at: passed ? new Date().toISOString() : undefined,
        signed_off: passed,
        incrementAttempts: true,
      })

      if (passed) {
        await supabase.from('handler_commitments').insert({
          user_id: user.id,
          module_id: moduleId,
        })
      }

      setResult({ score, passed })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetake = () => {
    setAnswers({})
    setIndex(0)
    setResult(null)
  }

  if (result) {
    return (
      <div className="min-h-svh bg-cream">
        <Header backTo={`/module/${moduleId}`} />
        <div className="max-w-[700px] mx-auto mt-16 px-4 flex flex-col items-center text-center">
          {result.passed ? (
            <>
              <CheckCircle size={64} className="text-success" />
              <h1 className="font-heading text-navy text-[32px] mt-6">Quiz passed!</h1>
              <p className="text-[18px] text-muted mt-2">You scored {result.score}%</p>
              <button
                onClick={() => navigate(nextModule ? `/module/${nextModule.id}` : '/dashboard')}
                className="mt-8 h-[52px] px-8 rounded-lg bg-navy text-cream font-semibold text-[15px]"
              >
                {nextModule ? `Continue to Module ${nextModule.id}` : 'Back to dashboard'}
              </button>
            </>
          ) : (
            <>
              <XCircle size={64} className="text-danger" />
              <h1 className="font-heading text-navy text-[32px] mt-6">Not quite</h1>
              <p className="text-[16px] text-muted mt-2">
                You scored {result.score}% — you need {PASS_THRESHOLD}% to pass.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/module/${moduleId}`)}
                  className="h-[52px] px-8 rounded-lg border border-navy text-navy font-semibold text-[15px]"
                >
                  Review the module
                </button>
                <button
                  onClick={handleRetake}
                  className="h-[52px] px-8 rounded-lg bg-navy text-cream font-semibold text-[15px]"
                >
                  Retake Quiz
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream pb-16">
      <Header backTo={`/module/${moduleId}`} />

      <div className="text-center mt-6 px-4">
        <h1 className="font-heading text-navy text-[28px]">Module {moduleId} Quiz</h1>
        <p className="text-[14px] text-muted mt-2">
          Score 80% or above to pass. You can retake as many times as needed.
        </p>
      </div>

      <div className="bg-card rounded-card shadow-card p-8 max-w-[700px] mx-auto mt-4">
        <p className="text-[12px] text-faint">
          Question {index + 1} of {questions.length}
        </p>
        <h2 className="font-heading text-navy text-[20px] mt-3">{question.question}</h2>

        <div className="flex flex-col gap-3 mt-6">
          {question.options.map((option, optionIndex) => {
            const selected = answers[index] === optionIndex
            return (
              <button
                key={optionIndex}
                onClick={() => selectOption(optionIndex)}
                className={`text-left rounded-card border-[1.5px] px-4 py-4 text-[15px] transition-shadow hover:shadow-card ${
                  selected
                    ? 'border-navy bg-cream text-navy'
                    : 'border-navy/20 bg-white text-navy'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between gap-3 mt-8">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="h-[52px] px-6 rounded-lg border border-navy text-navy font-semibold text-[15px] disabled:opacity-40"
          >
            Previous
          </button>
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={answers[index] === undefined || submitting}
              className="h-[52px] px-6 rounded-lg bg-navy text-cream font-semibold text-[15px] disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={answers[index] === undefined}
              className="h-[52px] px-6 rounded-lg bg-navy text-cream font-semibold text-[15px] disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
