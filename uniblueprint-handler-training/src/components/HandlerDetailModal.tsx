import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import LoginDetailsCard from './LoginDetailsCard'
import { MODULES } from '../data/modules'
import { supabase } from '../lib/supabase'
import type { QuizAttempt, TrainingProgress, TrainingUser } from '../lib/types'

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  passed: 'Passed',
  failed: 'Failed',
}

const STATUS_COLOR: Record<string, string> = {
  not_started: 'text-faint',
  in_progress: 'text-navy',
  passed: 'text-success',
  failed: 'text-danger',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HandlerDetailModal({
  handler,
  onClose,
}: {
  handler: TrainingUser
  onClose: () => void
}) {
  const [progress, setProgress] = useState<TrainingProgress[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [notes, setNotes] = useState(handler.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', handler.id)
      .then(({ data }) => setProgress(data ?? []))

    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', handler.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAttempts(data ?? []))
  }, [handler.id])

  const handleSaveNotes = async () => {
    setSaving(true)
    await supabase.from('training_users').update({ notes }).eq('id', handler.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-card rounded-card shadow-card w-full max-w-[640px] p-8 relative my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-faint hover:text-navy"
        >
          <X size={20} />
        </button>

        <h2 className="font-heading text-navy text-[24px]">{handler.full_name}</h2>
        <p className="text-[13px] text-muted mt-1">
          {handler.email} {handler.university ? `· ${handler.university}` : ''}
        </p>

        <div className="mt-4">
          <LoginDetailsCard email={handler.email} accessCode={handler.access_code} />
        </div>

        <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted mt-6">
          Module progress
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          {MODULES.map((m) => {
            const row = progress.find((p) => p.module_id === m.id)
            const status = row?.status ?? 'not_started'
            return (
              <div
                key={m.id}
                className="flex items-center justify-between border border-navy/10 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-[14px] text-navy font-semibold">
                    Module {m.id} — {m.name}
                  </p>
                  <p className="text-[12px] text-faint mt-0.5">
                    Attempts: {row?.attempts ?? 0} · Completed: {formatDate(row?.completed_at ?? null)}
                  </p>
                </div>
                <span className={`text-[13px] font-semibold ${STATUS_COLOR[status]}`}>
                  {STATUS_LABEL[status]}
                  {row?.score != null ? ` (${row.score}%)` : ''}
                </span>
              </div>
            )
          })}
        </div>

        <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted mt-6">
          Quiz attempt history
        </h3>
        <div className="mt-3 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          {attempts.length === 0 && <p className="text-[13px] text-faint">No quiz attempts yet.</p>}
          {attempts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border border-navy/10 rounded-lg px-4 py-2.5"
            >
              <span className="text-[13px] text-navy">Module {a.module_id}</span>
              <span className="text-[13px] text-muted">{formatDate(a.created_at)}</span>
              <span className={`text-[13px] font-semibold ${a.passed ? 'text-success' : 'text-danger'}`}>
                {a.score}% {a.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          ))}
        </div>

        <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted mt-6">
          Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full mt-2 p-3 text-[14px] rounded-lg border border-navy/20 bg-white text-navy resize-none"
          placeholder="Add a note about this handler..."
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          className="mt-3 h-[40px] px-5 rounded-lg bg-navy text-cream font-semibold text-[13px] disabled:opacity-70"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}
