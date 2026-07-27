import { supabase } from './supabase'

/**
 * Submits a generated document into the Campus Handler review pipeline.
 *
 * Replaces the previous two-step client-side pattern (insert a `submissions`
 * row, then update the document's `submission_id`), where a failure on the
 * second step left an orphaned submission pointing at nothing. The RPC runs
 * both writes inside one function body — a single transaction — so they commit
 * together or not at all, and it verifies ownership of the document server-side.
 *
 * @param {string} table    whitelisted document table, e.g. 'cv_documents'
 * @param {string} documentId
 * @param {string} serviceName  matched against services.name for pricing linkage
 * @param {string} notes        short human label shown in the Handler queue
 * @returns {Promise<string>}   the new submission id
 */
export async function submitForReview(table, documentId, serviceName, notes) {
  const { data, error } = await supabase.rpc('submit_document_for_review', {
    p_table: table,
    p_document_id: documentId,
    p_service_name: serviceName,
    p_notes: notes,
  })
  if (error) throw new Error(error.message || 'Could not submit for review. Please try again.')
  return data
}
