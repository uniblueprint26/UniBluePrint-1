import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Minus, XCircle } from 'lucide-react'
import Header from '../components/Header'
import AddHandlerModal from '../components/AddHandlerModal'
import HandlerDetailModal from '../components/HandlerDetailModal'
import { MODULES } from '../data/modules'
import { supabase } from '../lib/supabase'
import type { ProgressStatus, TrainingProgress, TrainingUser } from '../lib/types'

type OverallStatus = 'Fully Trained' | 'In Progress' | 'Not Started'

function overallStatusFor(rows: TrainingProgress[]): OverallStatus {
  const statuses = MODULES.map((m) => rows.find((r) => r.module_id === m.id)?.status ?? 'not_started')
  if (statuses.every((s) => s === 'passed')) return 'Fully Trained'
  if (statuses.every((s) => s === 'not_started')) return 'Not Started'
  return 'In Progress'
}

const OVERALL_PILL: Record<OverallStatus, string> = {
  'Fully Trained': 'bg-green-100 text-success',
  'In Progress': 'bg-navy/10 text-navy',
  'Not Started': 'bg-gray-100 text-faint',
}

function ModuleCell({ status }: { status: ProgressStatus }) {
  if (status === 'passed') return <CheckCircle size={16} className="text-success mx-auto" />
  if (status === 'failed') return <XCircle size={16} className="text-danger mx-auto" />
  if (status === 'in_progress') return <Clock size={16} className="text-warning mx-auto" />
  return <Minus size={16} className="text-faint mx-auto" />
}

export default function OperationsDashboard() {
  const [handlers, setHandlers] = useState<TrainingUser[]>([])
  const [progressByUser, setProgressByUser] = useState<Record<string, TrainingProgress[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [detailHandler, setDetailHandler] = useState<TrainingUser | null>(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data: users } = await supabase
        .from('training_users')
        .select('*')
        .eq('role', 'handler')
        .order('created_at', { ascending: false })

      const { data: progress } = await supabase.from('training_progress').select('*')

      const grouped: Record<string, TrainingProgress[]> = {}
      for (const row of progress ?? []) {
        grouped[row.user_id] = grouped[row.user_id] ? [...grouped[row.user_id], row] : [row]
      }

      setHandlers(users ?? [])
      setProgressByUser(grouped)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalHandlers = handlers.length
  const fullyTrained = handlers.filter(
    (h) => overallStatusFor(progressByUser[h.id] ?? []) === 'Fully Trained',
  ).length
  const inProgress = handlers.filter(
    (h) => overallStatusFor(progressByUser[h.id] ?? []) === 'In Progress',
  ).length
  const notStarted = handlers.filter(
    (h) => overallStatusFor(progressByUser[h.id] ?? []) === 'Not Started',
  ).length

  return (
    <div className="min-h-svh bg-cream pb-16">
      <Header title="Operations — Handler Training" />

      {loadError && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px] flex items-center justify-between gap-3">
          <span>Couldn't load handler data. Check your connection and try again.</span>
          <button onClick={loadData} className="font-semibold underline shrink-0">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-4 mt-6">
        {[
          { label: 'Total Handlers', value: totalHandlers },
          { label: 'Fully Trained', value: fullyTrained },
          { label: 'In Progress', value: inProgress },
          { label: 'Not Started', value: notStarted },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-card shadow-card p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted">
              {stat.label}
            </p>
            <p className="font-heading text-navy text-[32px] mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-card shadow-card mx-4 mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-heading text-navy text-[18px]">Handlers</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-[40px] px-5 rounded-lg bg-navy text-cream font-semibold text-[13px]"
          >
            Add handler
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-t border-navy/10">
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-navy uppercase">
                  Handler
                </th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-navy uppercase">
                  University
                </th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-navy uppercase">
                  Email
                </th>
                {MODULES.map((m) => (
                  <th key={m.id} className="px-2 py-3 text-[12px] font-semibold text-navy uppercase">
                    M{m.id}
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-navy uppercase">
                  Overall
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-[13px] text-faint">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && handlers.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-[13px] text-faint">
                    No handlers yet.
                  </td>
                </tr>
              )}
              {handlers.map((h) => {
                const rows = progressByUser[h.id] ?? []
                const overall = overallStatusFor(rows)
                return (
                  <tr key={h.id} className="border-t border-navy/10">
                    <td className="px-4 py-3 text-[13px] text-navy font-medium whitespace-nowrap">
                      {h.full_name}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted whitespace-nowrap">
                      {h.university ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted whitespace-nowrap">{h.email}</td>
                    {MODULES.map((m) => (
                      <td key={m.id} className="px-2 py-3">
                        <ModuleCell status={rows.find((r) => r.module_id === m.id)?.status ?? 'not_started'} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${OVERALL_PILL[overall]}`}>
                        {overall}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setDetailHandler(h)}
                        className="text-[13px] text-navy font-semibold underline underline-offset-2"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddHandlerModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            loadData()
          }}
        />
      )}

      {detailHandler && (
        <HandlerDetailModal handler={detailHandler} onClose={() => setDetailHandler(null)} />
      )}
    </div>
  )
}
