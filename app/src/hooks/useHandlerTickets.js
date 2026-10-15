/**
 * useHandlerTickets — a Handler's own active ticket queue.
 *
 * Backed directly by public.submissions (no separate "ticket" table exists
 * — see 20260726110000_handler_pipeline's own comment: submissions already
 * tracks pipeline position via `stage`, and claim_submission() is what sets
 * submissions.handler_id). "Active" here means claimed by this Handler and
 * not yet delivered: stage in ('assigned', 'in_review'). This is the same
 * source StudioQueueScreen's ticket list and AvailabilityScreen's
 * activeTicketCount both read, so the two screens can't disagree about how
 * many tickets a Handler is carrying.
 *
 * refunded_at is excluded too (foundation_refund_flow.sql) — a refunded
 * submission is withdrawn from the live queue even if its stage hadn't
 * otherwise moved to 'delivered' yet, since Operations/Founder refunding it
 * means no further Handler work on it is expected. refund-foundation-
 * payment doesn't change `stage` itself (see that migration's own comment
 * on why), so this filter is what actually keeps a refunded ticket out of
 * a Handler's active list.
 *
 * Note on turnaround_deadline vs. submissions.deadline: the pipeline's own
 * SQL helper, ticket_urgency(), reads submissions.deadline, but nothing in
 * the app ever writes that column — submit_document_for_review() only sets
 * turnaround_deadline (tier-based: 24h premium / 48h standard). That split
 * predates this screen and is out of scope here; ticketUrgency() below
 * mirrors ticket_urgency()'s thresholds against turnaround_deadline, the
 * column that is actually populated.
 *
 * Note on student names: submissions.submitted_name exists in the schema
 * but nothing currently writes it (the self-declaration step that would set
 * it isn't wired up either), and Handlers have no RLS read path to
 * profiles.full_name (profiles is select-own-row-only). So a ticket's
 * student name is genuinely unavailable today — see getTicketDisplayName()
 * below, which degrades to a generic label rather than guessing.
 *
 * import { useHandlerTickets, ticketUrgency, getTicketDisplayName } from '../../hooks/useHandlerTickets'
 * const { loading, loadError, tickets, reload } = useHandlerTickets(user?.id)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ACTIVE_STAGES = ['assigned', 'in_review']

export function useHandlerTickets(userId) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tickets, setTickets] = useState([])

  const load = useCallback(async () => {
    if (!userId) {
      setTickets([])
      setLoading(false)
      return
    }
    setLoadError(false)
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, tier, stage, turnaround_deadline, submitted_name, services(name)')
        .eq('handler_id', userId)
        .in('stage', ACTIVE_STAGES)
        .is('refunded_at', null)
        .order('turnaround_deadline', { ascending: true })
      if (error) throw error
      setTickets(data || [])
    } catch {
      setLoadError(true)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { loading, loadError, tickets, reload: load }
}

// Mirrors public.ticket_urgency(_deadline, _tier)'s thresholds exactly
// (red < 6h out, amber < 24h out, else green), applied to
// turnaround_deadline since that's the column the pipeline actually sets.
export function ticketUrgency(deadline, tier) {
  if (!deadline) return 'green'
  const msOut = new Date(deadline).getTime() - Date.now()
  if (msOut < 6 * 60 * 60 * 1000) return 'red'
  if (msOut < 24 * 60 * 60 * 1000) return 'amber'
  return 'green'
}

// See the module-level note above — submissions.submitted_name is never
// actually written by any current submission flow, so this almost always
// falls back to a generic label today. Flagged in the handoff report rather
// than guessed at.
export function getTicketDisplayName(ticket) {
  const raw = (ticket?.submitted_name || '').trim()
  if (!raw) return 'Student'
  return raw.split(/\s+/)[0]
}
