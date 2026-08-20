import { supabase } from './supabase'

/**
 * The Campus Handler review pipeline — client side.
 *
 * Mirrors the whitelist in submit_document_for_review / deliver_submission:
 * a submission's actual content lives in one of these 7 tables, named by
 * submissions.document_table. label/title match MyDocumentsPage's SOURCES so
 * the same document reads the same way in both the student's and the
 * Handler's view.
 */
export const DOCUMENT_SOURCES = {
  cv_documents: { label: 'CV', title: (r) => r.title || 'Untitled CV' },
  cover_letters: { label: 'Cover letter', title: (r) => [r.target_role, r.target_company].filter(Boolean).join(' at ') || 'Untitled cover letter' },
  linkedin_documents: { label: 'LinkedIn', title: (r) => r.target_role || r.target_industry || 'LinkedIn profile' },
  application_forms: { label: 'Application form', title: (r) => [r.target_role, r.target_company].filter(Boolean).join(' at ') || 'Untitled application' },
  interview_prep_packs: { label: 'Interview prep', title: (r) => r.target_role || 'Interview prep pack' },
  personal_statements: { label: 'Personal statement', title: (r) => [r.target_course, r.target_institution].filter(Boolean).join(' at ') || 'Untitled statement' },
  portfolio_plans: { label: 'Portfolio plan', title: (r) => r.field || 'Portfolio plan' },
}

const SUBMISSION_COLS =
  'id, user_id, service_id, stage, tier, submitted_at, assigned_at, in_review_at, delivered_at, ' +
  'turnaround_deadline, marked_incomplete, incomplete_reason, document_table, document_id, notes, ' +
  'services(name)'

/** Unclaimed items any handler can pick up — handler_queue rows with no picked_at yet. */
export async function fetchUnclaimedQueue() {
  const { data, error } = await supabase
    .from('handler_queue')
    .select('submission_id, priority, queued_at, picked_at, submissions(' + SUBMISSION_COLS + ')')
    .is('picked_at', null)
    .order('priority', { ascending: false })
    .order('queued_at', { ascending: true })
  if (error) throw error
  return (data || [])
    .filter((row) => row.submissions) // RLS can return null here if a joined row isn't visible
    .map((row) => ({ ...row.submissions, priority: row.priority, queued_at: row.queued_at }))
}

/** This handler's own active (not yet delivered) claims. */
export async function fetchMyActiveAssignments(handlerId) {
  const { data, error } = await supabase
    .from('handler_assignments')
    .select('submission_id, assigned_at, status, submissions(' + SUBMISSION_COLS + ')')
    .eq('handler_id', handlerId)
    .eq('status', 'active')
    .order('assigned_at', { ascending: true })
  if (error) throw error
  return (data || [])
    .filter((row) => row.submissions && row.submissions.stage !== 'delivered')
    .map((row) => row.submissions)
}

/** The full picture for one submission: its metadata, the student's input, and the AI output. */
export async function fetchSubmissionDetail(submission) {
  const source = DOCUMENT_SOURCES[submission.document_table]
  if (!source) throw new Error('This submission has no recognised document type.')

  const { data, error } = await supabase
    .from(submission.document_table)
    .select('*')
    .eq('id', submission.document_id)
    .single()
  if (error) throw error

  return {
    label: source.label,
    title: source.title(data),
    input: data.input ?? null,
    generated: data.generated ?? null,
    handlerNotes: data.generated?.handler_notes ?? null,
  }
}

export async function claimSubmission(submissionId) {
  const { error } = await supabase.rpc('claim_submission', { p_submission_id: submissionId })
  if (error) throw mapClaimError(error)
}

export async function startReview(submissionId) {
  const { error } = await supabase.rpc('start_review', { p_submission_id: submissionId })
  if (error) throw new Error(error.message)
}

export async function deliverSubmission(submissionId, note) {
  const { error } = await supabase.rpc('deliver_submission', { p_submission_id: submissionId, p_handler_note: note })
  if (error) throw new Error(error.message)
}

export async function flagSubmission(submissionId, note) {
  const { error } = await supabase.rpc('flag_submission', { p_submission_id: submissionId, p_handler_note: note })
  if (error) throw new Error(error.message)
}

export async function markIncomplete(submissionId, note) {
  const { error } = await supabase.rpc('mark_submission_incomplete', { p_submission_id: submissionId, p_handler_note: note })
  if (error) throw new Error(error.message)
}

/** A unique_violation on the race-protection index reads as a raw Postgres error otherwise. */
function mapClaimError(error) {
  if (error.code === '23505') return new Error('This submission has already been claimed by another Handler.')
  return new Error(error.message)
}

/** Mirrors has_two_sentences() server-side — same shape check, run client-side first for instant feedback. */
export function hasTwoSentences(text) {
  const trimmed = (text || '').trim()
  if (trimmed.length < 20) return false
  const sentences = trimmed.split(/[.!?]+\s*/).filter(Boolean)
  return sentences.length >= 2
}

// ─────────────────────────────────────────────────────────────────────────────
// Everything below is additive — escalation, performance tracking, the
// Operations queue, and premium/standard queue separation. Nothing above this
// line is touched.

/** The unclaimed queue, filtered to one tier. Same shape as fetchUnclaimedQueue. */
async function fetchUnclaimedByTier(tier) {
  const { data, error } = await supabase
    .from('handler_queue')
    .select('submission_id, priority, queued_at, picked_at, submissions!inner(' + SUBMISSION_COLS + ')')
    .is('picked_at', null)
    .eq('submissions.tier', tier)
    .order('queued_at', { ascending: true })
  if (error) throw error
  return (data || [])
    .filter((row) => row.submissions)
    .map((row) => ({ ...row.submissions, priority: row.priority, queued_at: row.queued_at }))
}

export const fetchPremiumQueue = () => fetchUnclaimedByTier('premium')
export const fetchStandardQueue = () => fetchUnclaimedByTier('standard')

/** Escalated / flagged / incomplete submissions — Operations only, gated server-side by fetch_operations_queue(). */
export async function fetchOperationsQueue() {
  const { data, error } = await supabase.rpc('fetch_operations_queue')
  if (error) throw new Error(error.message)
  return data || []
}

/** Active Handlers available to reassign a ticket to — Operations only, gated server-side. */
export async function listActiveHandlers() {
  const { data, error } = await supabase.rpc('list_active_handlers')
  if (error) throw new Error(error.message)
  return data || []
}

export async function reassignSubmission(ticketId, newHandlerId) {
  const { error } = await supabase.rpc('reassign_submission', { p_ticket_id: ticketId, p_new_handler_id: newHandlerId })
  if (error) throw new Error(error.message)
}

export async function cancelSubmission(submissionId, reason, fullRefund = false) {
  const { error } = await supabase.rpc('cancel_submission', { p_submission_id: submissionId, p_reason: reason, p_full_refund: fullRefund })
  if (error) throw new Error(error.message)
}

export async function contactStudent(submissionId, message) {
  const { error } = await supabase.rpc('contact_student', { p_submission_id: submissionId, p_message: message })
  if (error) throw new Error(error.message)
}

/** A Handler's own notifications (deadline warnings, escalation notices, reassignments, premium alerts). */
export async function fetchHandlerNotifications(handlerId) {
  const { data, error } = await supabase
    .from('handler_notifications')
    .select('id, type, message, priority, read, created_at')
    .eq('handler_id', handlerId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data || []
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('handler_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
