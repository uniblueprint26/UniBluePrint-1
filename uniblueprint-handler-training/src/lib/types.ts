export type Role = 'handler' | 'operations'
export type ProgressStatus = 'not_started' | 'in_progress' | 'passed' | 'failed'

export interface TrainingUser {
  id: string
  email: string
  full_name: string
  university: string | null
  access_code: string
  role: Role
  notes: string | null
  created_at: string
}

export interface TrainingProgress {
  id: string
  user_id: string
  module_id: number
  status: ProgressStatus
  attempts: number
  score: number | null
  completed_at: string | null
  signed_off: boolean
  created_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  module_id: number
  answers: Record<string, number>
  score: number
  passed: boolean
  created_at: string
}

export interface HandlerCommitment {
  id: string
  user_id: string
  module_id: number
  confirmed_at: string
  ip_address: string | null
}

export interface SessionUser {
  id: string
  email: string
  full_name: string
  university: string | null
  role: Role
}
