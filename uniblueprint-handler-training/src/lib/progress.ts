import { supabase } from './supabase'
import type { ProgressStatus, TrainingProgress } from './types'

export async function fetchProgress(userId: string): Promise<TrainingProgress[]> {
  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

export function statusFor(moduleId: number, rows: TrainingProgress[]): ProgressStatus {
  return rows.find((r) => r.module_id === moduleId)?.status ?? 'not_started'
}

export function isUnlocked(moduleId: number, rows: TrainingProgress[]): boolean {
  if (moduleId === 1) return true
  return statusFor(moduleId - 1, rows) === 'passed'
}

export async function upsertProgress(
  userId: string,
  moduleId: number,
  patch: Partial<Pick<TrainingProgress, 'status' | 'score' | 'completed_at' | 'signed_off'>> & {
    incrementAttempts?: boolean
  },
) {
  const existing = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()

  const attempts = existing.data?.attempts ?? 0

  const { incrementAttempts, ...rest } = patch

  const { error } = await supabase.from('training_progress').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      attempts: incrementAttempts ? attempts + 1 : attempts,
      ...rest,
    },
    { onConflict: 'user_id,module_id' },
  )

  if (error) throw error
}
