// Universal metrics data layer for Studio hubs. Real Supabase-backed query
// functions only -- nothing here returns mock/fabricated data. Every
// function that reads user-linked activity excludes the 24 demo/QA/test
// accounts banned today (auth.users.banned_until = 'infinity') -- either by
// calling a SECURITY DEFINER RPC that already filters them server-side
// (see supabase/migrations/20261022120000_studio_finance_hub_banned_
// exclusion_and_money_requests.sql), or, for metrics with no RPC yet, by
// being explicit in this file's own comments about what is and isn't
// filtered.
//
// Each function's return shape includes a `trackable` flag. `trackable:
// false` means the underlying data genuinely does not exist yet in the
// schema -- this file never invents a column or fakes a zero to paper over
// a gap; it says so, with a `reason`, so the UI can render an honest "not
// yet tracked" state (see MetricBarChart's `tbd` row type) instead of a
// silent/misleading 0.
//
// Checked live against the schema on 2026-10-22 (via Supabase MCP
// list_tables / execute_sql), not assumed:
//   - Profile views: NOT tracked. activity_events.type only ever contains
//     'partner_deal_viewed' / 'partner_deal_claimed' today (plus whatever
//     EVENT_LABELS on FounderDashboardPage separately expects) -- no
//     profile-view event exists for coaches or partners.
//   - Saves/bookmarks: NOT tracked. No bookmarks/saves table exists.
//   - Enquiry response rate / response time: NOT tracked precisely.
//     coach_enquiries and business_enquiries have a `status` column but no
//     responded_at timestamp, so "time to respond" cannot be computed; only
//     a count by status (which doesn't distinguish "responded" from other
//     non-pending states today).
//   - Listing -> action click-through rate: NOT tracked. partner_follows /
//     deal_redemption_codes record the action itself (follow, claim) but
//     there is no listing-impression/view event to divide by for a CTR.

import { supabase } from './supabase'

function notTrackable(reason) {
  return { trackable: false, reason, value: null }
}

// ─────────────────────────────────────────────────────────────────────────
// ENGAGEMENT
// ─────────────────────────────────────────────────────────────────────────

/** Not yet trackable -- see file header. Kept as a real function (not just
 * a comment) so a future hub's code can call it uniformly alongside the
 * trackable ones below, and so wiring in the real column later is a
 * one-function change, not a hunt through every call site. */
export async function getProfileViews() {
  return notTrackable('No profile-view event exists in activity_events or elsewhere yet.')
}

export async function getSavesBookmarks() {
  return notTrackable('No saves/bookmarks table exists yet.')
}

/** Lifestyle partner follow growth. Real, via partner_follows (RLS already
 * lets a partner_tier_admin read via get_all_partner_stats-style RPCs for
 * aggregate counts; this reads the raw per-partner follower count that
 * feeds Founder's existing "Lifestyle partner performance" table, which
 * does NOT currently exclude banned accounts -- Phase 1 scope here is the
 * Finance Hub only, so Founder Dashboard's own query is left untouched. */
export async function getPartnerFollowCount(partnerId) {
  const { count, error } = await supabase
    .from('partner_follows')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
  if (error) throw error
  return { trackable: true, value: count ?? 0 }
}

/** Real redemption code claims (deal_redemption_codes.used_at not null). */
export async function getRedemptionClaimCount(dealId) {
  const { count, error } = await supabase
    .from('deal_redemption_codes')
    .select('id', { count: 'exact', head: true })
    .eq('deal_id', dealId)
    .not('used_at', 'is', null)
  if (error) throw error
  return { trackable: true, value: count ?? 0 }
}

/** Enquiry response rate -- real counts by status, but see the header note:
 * this is a proxy, not a true response rate (no responded_at timestamp). */
export async function getCoachEnquiryStatusCounts() {
  const { data, error } = await supabase.from('coach_enquiries').select('status')
  if (error) throw error
  const counts = {}
  for (const row of data || []) counts[row.status] = (counts[row.status] || 0) + 1
  return {
    trackable: true,
    caveat: 'Proxy only -- status breakdown, not a true response time (no responded_at column exists).',
    value: counts,
  }
}

export async function getListingClickThroughRate() {
  return notTrackable('No listing-impression/view event exists to divide action counts by.')
}

// ─────────────────────────────────────────────────────────────────────────
// QUALITY
// ─────────────────────────────────────────────────────────────────────────

/** coach_rating_summary -- fixed to security_invoker today, safe to read
 * directly as any authenticated caller (it is a plain aggregate view, no
 * banned-account linkage since a rating belongs to the rater, not the
 * coach being rated, and a banned student's past rating of a coach is real
 * historical signal about that coach, not demo noise to strip out). */
export async function getCoachRatingSummary(coachSlug) {
  const { data, error } = await supabase
    .from('coach_rating_summary')
    .select('*')
    .eq('coach_slug', coachSlug)
    .maybeSingle()
  if (error) throw error
  return { trackable: true, value: data || { rating_count: 0, avg_rating: null } }
}

export async function getResponseTimeToEnquiries() {
  return notTrackable('No responded_at/first-response timestamp exists on coach_enquiries or business_enquiries.')
}

/** Founding Partner Badge + current tier -- real, via get_partner_tier_admin_list()
 * (finance/founder/operations only, already role-gated server-side). */
export async function getPartnerTierAdminList() {
  const { data, error } = await supabase.rpc('get_partner_tier_admin_list')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

// ─────────────────────────────────────────────────────────────────────────
// REVENUE (Finance Hub) -- all via the banned-account-excluding RPCs.
// ─────────────────────────────────────────────────────────────────────────

export async function getFinanceRevenueSnapshot(range = 'month') {
  const { data, error } = await supabase.rpc('get_finance_revenue_snapshot', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getFinanceOneTimePayments(range = 'month') {
  const { data, error } = await supabase.rpc('get_finance_one_time_payments_summary', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getFinanceRevenueByTier(range = 'month') {
  const { data, error } = await supabase.rpc('get_finance_revenue_by_tier', { _range: range })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getFinanceMarginSummary(range = 'month') {
  const { data, error } = await supabase.rpc('get_finance_margin_summary', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getFinancePayoutFailureQueue() {
  const { data, error } = await supabase.rpc('get_finance_payout_failure_queue')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getFinanceRevenueByCohort() {
  const { data, error } = await supabase.rpc('get_finance_revenue_by_cohort')
  if (error) throw error
  return {
    trackable: true,
    caveat: 'By signup month only -- campus/institution cohorting is not included, profiles.institution is null for every row today.',
    value: data || [],
  }
}

export async function getFinanceCoachRevenueComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_finance_coach_revenue_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getFinanceCoachPayoutSummary() {
  const { data, error } = await supabase.rpc('get_finance_coach_payout_summary')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getFinancePendingCoachPayouts() {
  const { data, error } = await supabase.rpc('get_finance_pending_coach_payouts')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getFinanceCommissionSummary(range = 'month') {
  const { data, error } = await supabase.rpc('get_finance_commission_summary', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getFinancePartnerPayoutSummary() {
  const { data, error } = await supabase.rpc('get_finance_partner_payout_summary')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

// ─────────────────────────────────────────────────────────────────────────
// GROWTH -- week-over-week %, percentile rank, "rising" flag.
// ─────────────────────────────────────────────────────────────────────────

/** Generic WoW %, used by any hub once it has two real period totals. */
export function weekOverWeekChangePct(current, previous) {
  if (current == null || previous == null) return null
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/** Percentile rank within a same-category cohort (0-100, higher = better),
 * from a { rank, total } pair such as get_finance_coach_revenue_comparison
 * already returns per coach. */
export function percentileRank(rank, total) {
  if (!rank || !total || total <= 1) return null
  return Math.round(100 * (1 - (rank - 1) / (total - 1)))
}

/** "Rising" = fastest week-over-week growth among a comparison list (array
 * of { key, revenue_cents_this_period, revenue_cents_last_period }). Real
 * computation off get_finance_coach_revenue_comparison's own feed, never a
 * separate fabricated score. */
export function findRising(comparisonRows = []) {
  let best = null
  let bestPct = -Infinity
  for (const row of comparisonRows) {
    const pct = weekOverWeekChangePct(row.revenue_cents_this_period, row.revenue_cents_last_period)
    if (pct != null && pct > bestPct && row.revenue_cents_this_period > 0) {
      bestPct = pct
      best = row
    }
  }
  return best ? { ...best, changePct: bestPct } : null
}

// ─────────────────────────────────────────────────────────────────────────
// Money requests queue (new, Finance Hub write tool).
// ─────────────────────────────────────────────────────────────────────────

export async function getMoneyRequests() {
  const { data, error } = await supabase
    .from('money_requests')
    .select('*')
    .order('requested_at', { ascending: false })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createMoneyRequest(amountCents, reason) {
  const { data, error } = await supabase.rpc('create_money_request', { _amount_cents: amountCents, _reason: reason })
  if (error) throw error
  return data
}

export async function decideMoneyRequest(id, status, note) {
  const { error } = await supabase.rpc('decide_money_request', { _id: id, _status: status, _note: note || null })
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────
// Legal Hub (Studio Phase 2) -- contracts register, GDPR/acknowledgement
// compliance reads, and the generic cross-hub team_tasks reader/writers.
// All via supabase/migrations/20261022174125_legal_hub_schema.sql's
// SECURITY DEFINER RPCs -- legal_contracts/legal_contract_status_log/
// team_tasks have no direct table grant at all, same pattern as
// partner_tier_assignments.
// ─────────────────────────────────────────────────────────────────────────

export async function getLegalContracts() {
  const { data, error } = await supabase.rpc('list_legal_contracts')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createLegalContract(entityType, entityId, contractName, status = 'not_sent', notes = null) {
  const { data, error } = await supabase.rpc('create_legal_contract', {
    _entity_type: entityType, _entity_id: entityId, _contract_name: contractName, _status: status, _notes: notes,
  })
  if (error) throw error
  return data
}

export async function setLegalContractStatus(id, status, notes) {
  const { error } = await supabase.rpc('set_legal_contract_status', { _id: id, _status: status, _notes: notes || null })
  if (error) throw error
}

/** Real feed for the Legal Hub's ComparisonWidget -- contracts resolved (signed) this range vs the prior one, from legal_contract_status_log. */
export async function getLegalContractsResolvedComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_legal_contracts_resolved_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Studio Phase 13 -- same real legal_contract_status_log feed as the comparison above, bucketed by calendar week instead of collapsed to one this/last pair, for the Legal Hub's new TrendLineChart. Includes genuine zero weeks. */
export async function getLegalContractsResolvedTrend(weeks = 8) {
  const { data, error } = await supabase.rpc('get_legal_contracts_resolved_trend', { _weeks: weeks })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real gdpr_requests rows (0 today -- genuinely empty, not filtered down) with a computed is_overdue flag. */
export async function getLegalGdprRequests() {
  const { data, error } = await supabase.rpc('get_legal_gdpr_requests')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real % of active (non-banned) users who've acknowledged the latest version of each known legal document, excluding banned demo/QA accounts from both sides of the fraction. */
export async function getLegalAcknowledgementCoverage() {
  const { data, error } = await supabase.rpc('get_legal_acknowledgement_coverage')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

// ── Generic team_tasks ("targets, batches, delegated tasks") -- reusable
// by any future hub the same way Legal uses it here, see TaskBoard.jsx. ──

export async function getTeamTasks(team) {
  const { data, error } = await supabase.rpc('list_team_tasks', { _team: team })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getTeamRoster(team) {
  const { data, error } = await supabase.rpc('get_team_roster', { _team: team })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createTeamTask(team, fields) {
  const { data, error } = await supabase.rpc('create_team_task', {
    _team: team,
    _title: fields.title,
    _description: fields.description || null,
    _batch_label: fields.batchLabel || null,
    _target_date: fields.targetDate || null,
    _assigned_to: fields.assignedTo || null,
  })
  if (error) throw error
  return data
}

export async function updateTeamTask(id, fields) {
  const { error } = await supabase.rpc('update_team_task', {
    _id: id,
    _title: fields.title || null,
    _description: fields.description || null,
    _batch_label: fields.batchLabel || null,
    _target_date: fields.targetDate || null,
    _assigned_to: fields.assignedTo || null,
    _clear_assigned_to: !!fields.clearAssignedTo,
  })
  if (error) throw error
}

export async function setTeamTaskStatus(id, status) {
  const { error } = await supabase.rpc('set_team_task_status', { _id: id, _status: status })
  if (error) throw error
}

// ── Lead-tier access (Studio Phase 11) -- is this caller a real LEAD of
// _team (or founder/admin/co_director), per user_roles.is_lead. Resolves
// each hub's TODO(phase-2-access-system): Finance's negotiated-rate
// visibility and Tech's idea-triage gate both call this to decide what to
// render, same "ask a real RPC, never guess from the route-level role
// alone" principle every hub already follows. ──
export async function getIsTeamLead(team) {
  const { data, error } = await supabase.rpc('am_i_team_lead', { _team: team })
  if (error) throw error
  return { trackable: true, value: !!data }
}

// ── Cross-hub access/request system (Studio Phase 11) -- the "no hub has
// an access-request flow" gap the audit flagged. Two real request types
// via the new studio_requests table: task_handoff (delegate an existing
// team_tasks row to a DIFFERENT hub) and access_request (ask to see
// another hub's data, or ask your own hub's leads for the lead-only
// view). See supabase/migrations' studio_phase11_leads_and_requests_v2
// for the full RPC bodies and the shared RequestPanel Studio component
// every hub page renders this through. ──
export async function listStudioRequests(team) {
  const { data, error } = await supabase.rpc('list_studio_requests', { _team: team })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createStudioRequest(fields) {
  const { data, error } = await supabase.rpc('create_studio_request', {
    _target_team: fields.targetTeam,
    _request_type: fields.requestType,
    _message: fields.message,
    _target_user_id: fields.targetUserId || null,
    _related_task_id: fields.relatedTaskId || null,
  })
  if (error) throw error
  return data
}

export async function approveStudioRequest(id, resolutionNote, assignTo) {
  const { error } = await supabase.rpc('approve_studio_request', {
    _id: id, _resolution_note: resolutionNote || null, _assign_to: assignTo || null,
  })
  if (error) throw error
}

export async function denyStudioRequest(id, resolutionNote) {
  const { error } = await supabase.rpc('deny_studio_request', { _id: id, _resolution_note: resolutionNote || null })
  if (error) throw error
}

/** Company-wide rollup of every pending cross-hub request, any team -- founder/admin/co_director only. Reused by both the Co-Director Hub and Founder Dashboard, same way getCoDirectorPendingDecisions() already is. */
export async function getAllPendingStudioRequests() {
  const { data, error } = await supabase.rpc('get_all_pending_studio_requests')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

// ─────────────────────────────────────────────────────────────────────────
// Tech Hub (Studio Phase 3) -- health overview snapshots (advisor findings
// + deployed Edge Functions, both Management-API-only data captured as
// real timestamped snapshots -- see supabase/migrations/
// 20261022180100_tech_hub_schema.sql's header for why), live generation_usage
// reads, and the idea inbox (tech_ideas / tech_idea_status_log). All via
// that migration's SECURITY DEFINER RPCs -- same "no direct table grant"
// pattern as Legal's legal_contracts/team_tasks. team_tasks itself needs no
// new code here -- getTeamTasks('tech') / getTeamRoster('tech') /
// createTeamTask('tech', ...) / setTeamTaskStatus already work the moment
// the 'tech' role exists, reused directly for Enoch's QA/test board.
// ─────────────────────────────────────────────────────────────────────────

export async function getTechAdvisorSnapshot() {
  const { data, error } = await supabase.rpc('get_tech_advisor_snapshot')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getTechEdgeFunctionSnapshot() {
  const { data, error } = await supabase.rpc('get_tech_edge_function_snapshot')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real per-function invocation/error rate -- NOT trackable today. See
 * tech_edge_function_snapshots' own migration comment: query_logs
 * (function_edge_logs) held only 2 real log lines total at the time this
 * was built, nowhere near enough real volume for a meaningful rate. Kept as
 * a real function (not just a comment) for the same reason getProfileViews
 * etc. are above -- a future pass with real log volume swaps this one
 * function's body in, nothing else changes. */
export async function getTechFunctionHealthRates() {
  return notTrackable('Edge Function invocation/error logs (function_edge_logs) held only 2 real log lines total at capture time -- not enough real volume for a meaningful per-function rate. The deployed-function list/status above is real; this rate is not fabricated from 2 data points.')
}

/** Real AI-generation call volume + estimated cost from generation_usage
 * (excludes banned demo/QA accounts server-side). Genuinely 0 today -- see
 * that RPC's own comment -- the pipeline is real and wired, just unused by
 * any real generation so far. */
export async function getTechGenerationUsageSummary(range = 'month') {
  const { data, error } = await supabase.rpc('get_tech_generation_usage_summary', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || { call_count: 0, total_cost_cents: 0, by_function: [] } }
}

export async function getTechIdeas() {
  const { data, error } = await supabase.rpc('list_tech_ideas')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createTechIdea(title, description) {
  const { data, error } = await supabase.rpc('create_tech_idea', { _title: title, _description: description || null })
  if (error) throw error
  return data
}

export async function setTechIdeaStatus(id, status, notes) {
  const { error } = await supabase.rpc('set_tech_idea_status', { _id: id, _status: status, _notes: notes || null })
  if (error) throw error
}

/** Real feed for the Tech Hub's ComparisonWidget -- ideas triaged (moved
 * out of `new`) this range vs the prior one, from tech_idea_status_log. */
export async function getTechIdeasTriagedComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_tech_ideas_triaged_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Studio Phase 13 -- same real tech_idea_status_log feed, bucketed by calendar week, for the Tech Hub's new TrendLineChart. Includes genuine zero weeks. */
export async function getTechIdeasTriagedTrend(weeks = 8) {
  const { data, error } = await supabase.rpc('get_tech_ideas_triaged_trend', { _weeks: weeks })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

// ─────────────────────────────────────────────────────────────────────────
// Outreach Hub (Studio Phase 4) -- for Sienna/Ethan/Fabz/James. Inbound
// pipeline (8 real enquiry/application tables, genuinely 0 rows each
// today), the real 0-live-coaches recruitment fact, real partner
// growth/engagement (excluding synthetic partner rows and banned demo/QA
// accounts), and the new outreach_contacts log + its generic team_tasks
// reuse (team='outreach'). All via supabase/migrations/
// 20261022190100_outreach_hub_schema.sql's SECURITY DEFINER RPCs -- same
// "no direct table grant" pattern as Legal's legal_contracts/Tech's
// tech_ideas. team_tasks itself needs no new code here -- getTeamTasks
// ('outreach') / getTeamRoster('outreach') / createTeamTask('outreach', ...)
// already work the moment the 'outreach' role exists.
// ─────────────────────────────────────────────────────────────────────────

/** Real, live per-table counts across all 8 enquiry/application tables --
 * genuinely 0 across the board today, not a broken query. */
export async function getOutreachInboundPipeline() {
  const { data, error } = await supabase.rpc('get_outreach_inbound_pipeline')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real coach_profiles breakdown -- surfaces the 0-real-live-coaches fact
 * directly rather than burying it in a bigger number. */
export async function getOutreachCoachRecruitmentSnapshot() {
  const { data, error } = await supabase.rpc('get_outreach_coach_recruitment_snapshot')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Real partner/top-of-funnel counts (excludes the 7 synthetic "Example/
 * Placeholder/Sample" partner rows) plus early_access_signups/referrals. */
export async function getOutreachPartnerSnapshot() {
  const { data, error } = await supabase.rpc('get_outreach_partner_snapshot')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Real month-by-month new (non-synthetic) partner count, last 6 months. */
export async function getOutreachPartnerGrowthByMonth() {
  const { data, error } = await supabase.rpc('get_outreach_partner_growth_by_month')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real month-by-month partner_follows trend, excluding banned demo/QA
 * accounts (19 of 20 real rows today) -- honestly near-all-zero. */
export async function getOutreachPartnerFollowTrendByMonth() {
  const { data, error } = await supabase.rpc('get_outreach_partner_follow_trend_by_month')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function getOutreachContacts() {
  const { data, error } = await supabase.rpc('list_outreach_contacts')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function createOutreachContact(fields) {
  const { data, error } = await supabase.rpc('create_outreach_contact', {
    _entity_type: fields.entityType,
    _entity_name: fields.entityName,
    _contact_channel: fields.contactChannel || null,
    _contacted_at: fields.contactedAt || new Date().toISOString(),
    _status: fields.status || 'contacted',
    _notes: fields.notes || null,
  })
  if (error) throw error
  return data
}

export async function updateOutreachContact(id, fields) {
  const { error } = await supabase.rpc('update_outreach_contact', {
    _id: id,
    _entity_name: fields.entityName || null,
    _contact_channel: fields.contactChannel || null,
    _contacted_at: fields.contactedAt || null,
    _notes: fields.notes || null,
  })
  if (error) throw error
}

export async function setOutreachContactStatus(id, status, notes) {
  const { error } = await supabase.rpc('set_outreach_contact_status', { _id: id, _status: status, _notes: notes || null })
  if (error) throw error
}

/** Real feed for the Outreach Hub's ComparisonWidget -- contacts signed
 * this range vs the prior one, from outreach_contact_status_log. */
export async function getOutreachContactsSignedComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_outreach_contacts_signed_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

// ─────────────────────────────────────────────────────────────────────────
// Marketing Hub (Studio Phase 5) -- for Alex, Elizabeth, Ethan and Fabz.
// Real deal-view/deal-claim funnel (activity_events, banned-excluded --
// almost entirely demo-contaminated, see migration header) and its
// per-partner breakdown (also excludes the synthetic "Example/Placeholder/
// Sample" partner rows), real early_access_signups (4 rows) as a list and a
// month-by-month trend, the real featured_content management view (toggle
// active + edit caption/CTA/priority -- writes straight through to the
// live home-screen carousel), and the generic team_tasks reuse
// (team='marketing'). All via supabase/migrations/
// 20261022200100_marketing_hub_schema.sql's SECURITY DEFINER RPCs -- same
// "no direct table grant" pattern as Legal's legal_contracts/Outreach's
// outreach_contacts (featured_content itself DOES have its own direct RLS
// for the live carousel -- untouched -- these RPCs are a management layer
// on top of it, not a replacement). team_tasks itself needs no new code
// here -- getTeamTasks('marketing') / getTeamRoster('marketing') /
// createTeamTask('marketing', ...) already work the moment the 'marketing'
// role exists.
// ─────────────────────────────────────────────────────────────────────────

/** Real partner_deal_viewed/partner_deal_claimed funnel, banned-excluded,
 * with the raw totals alongside for honest context -- genuinely 1 real
 * view / 0 real claims today, out of 1818 raw rows. */
export async function getMarketingEngagementFunnel() {
  const { data, error } = await supabase.rpc('get_marketing_engagement_funnel')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Real per-partner engagement -- excludes banned demo/QA accounts AND the
 * synthetic "Example/Placeholder/Sample" partner rows. Genuinely just one
 * real row today. */
export async function getMarketingEngagementByPartner() {
  const { data, error } = await supabase.rpc('get_marketing_engagement_by_partner')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real feed for the Marketing Hub's ComparisonWidget -- banned-excluded
 * partner_deal_claimed count this range vs the prior one. */
export async function getMarketingDealClaimsComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_marketing_deal_claims_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Real early_access_signups rows (4 today) -- a genuine lead list. */
export async function getMarketingEarlyAccessSignups() {
  const { data, error } = await supabase.rpc('get_marketing_early_access_signups')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real month-by-month early_access_signups count, last 6 months. */
export async function getMarketingEarlyAccessSignupsByMonth() {
  const { data, error } = await supabase.rpc('get_marketing_early_access_signups_by_month')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Full featured_content list (active AND inactive) -- the carousel's own
 * RLS only shows active rows to a plain authenticated user. */
export async function getMarketingFeaturedContent() {
  const { data, error } = await supabase.rpc('get_marketing_featured_content')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

export async function setMarketingFeaturedContentActive(id, active) {
  const { error } = await supabase.rpc('set_marketing_featured_content_active', { _id: id, _active: active })
  if (error) throw error
}

export async function updateMarketingFeaturedContentDetails(id, fields) {
  const { error } = await supabase.rpc('update_marketing_featured_content_details', {
    _id: id,
    _caption: fields.caption ?? null,
    _cta_label: fields.ctaLabel ?? null,
    _priority: fields.priority ?? null,
  })
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────
// Co-Director Hub (Studio Phase 6) -- for Daniel, genuinely founder-
// equivalent oversight across Finance/Legal/Tech/Outreach/Marketing. Every
// headline number the Co-Director Dashboard shows reuses the functions
// above (Finance/Legal/Tech/Outreach/Marketing's own getters) -- this is
// the ONE genuinely new query this phase adds: a company-wide "what needs
// a decision" rollup, via get_co_director_pending_decisions() (supabase/
// migrations/20261023120200_co_director_hub_schema.sql). Checked live
// before building it -- see that migration's own header for what's
// genuinely 0 today (including one leftover Playwright-QA scratch row in
// tech_ideas this query deliberately excludes, same contamination-
// exclusion diligence every prior Studio phase applied to its own data).
// ─────────────────────────────────────────────────────────────────────────

export async function getCoDirectorPendingDecisions() {
  const { data, error } = await supabase.rpc('get_co_director_pending_decisions')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

// ─────────────────────────────────────────────────────────────────────────
// Campus Handler Hub (Studio Phase 7) -- the Campus/Job-Search Handler
// team's existing review pipeline (submissions/handler_queue/
// handler_assignments/handler_escalations, built well before any Studio
// hub existed -- see src/lib/handlerQueue.js for the full claim/review/
// deliver pipeline this layer sits on top of) gets a real Studio Overview/
// Performance reporting layer via supabase/migrations/
// 20261023180000_handler_hub_schema.sql's 3 new SECURITY DEFINER RPCs.
// Genuinely all-zero today -- submissions/handler_queue/handler_escalations
// hold 0 rows (checked live), a real pre-launch pipeline, same honest state
// Outreach Hub's inbound pipeline found, not a broken query. Every function
// excludes the banned demo/QA accounts via submissions.user_id.
// team_tasks reuse (team='handler') needs no new code here -- getTeamTasks
// ('handler') / getTeamRoster('handler') / createTeamTask('handler', ...)
// already work the moment a 'handler' role exists, which it has since the
// very first migration.
// ─────────────────────────────────────────────────────────────────────────

export async function getHandlerQueueSnapshot() {
  const { data, error } = await supabase.rpc('get_handler_queue_snapshot')
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

export async function getHandlerTicketsByWeek() {
  const { data, error } = await supabase.rpc('get_handler_tickets_by_week')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real feed for the Handler Hub's ComparisonWidget -- tickets delivered this range vs the prior one. */
export async function getHandlerTicketsResolvedComparison(range = 'week') {
  const { data, error } = await supabase.rpc('get_handler_tickets_resolved_comparison', { _range: range })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

// ─────────────────────────────────────────────────────────────────────────
// PERSONALIZED GREETINGS (Studio Phase 12) -- see supabase/migrations/
// 20261026120000_studio_phase12_greetings.sql. The read is unauthenticated-
// safe to call from any hub -- get_active_studio_greeting() returns zero
// rows (not an error) when nothing is set for this caller/hub, and
// GreetingBanner.jsx falls back to the existing quotes.js pool itself.
// Seeded with zero real messages -- the founder is writing those himself.
// ─────────────────────────────────────────────────────────────────────────

/** `{ message, source: 'user'|'team' }` for the caller on this hub, or
 * `null` if nothing is set (GreetingBanner then uses the quote pool). */
export async function getActiveStudioGreeting(team) {
  const { data, error } = await supabase.rpc('get_active_studio_greeting', { _team: team })
  if (error) throw error
  return { trackable: true, value: data?.[0] || null }
}

/** Founder/Co-Director/Admin only -- every greeting, for the management
 * panel on the Founder Hub. */
export async function listStudioGreetings() {
  const { data, error } = await supabase.rpc('list_studio_greetings')
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** scope: 'team' (needs `team`) or 'user' (needs `userId`, `team` optional
 * to restrict that person's greeting to just one hub). */
export async function createStudioGreeting({ message, scope, team = null, userId = null }) {
  const { data, error } = await supabase.rpc('create_studio_greeting', {
    _message: message, _scope: scope, _team: team, _user_id: userId,
  })
  if (error) throw error
  return { trackable: true, value: data }
}

export async function setStudioGreetingActive(id, isActive) {
  const { error } = await supabase.rpc('set_studio_greeting_active', { _id: id, _is_active: isActive })
  if (error) throw error
  return { trackable: true, value: true }
}

export async function deleteStudioGreeting(id) {
  const { error } = await supabase.rpc('delete_studio_greeting', { _id: id })
  if (error) throw error
  return { trackable: true, value: true }
}

// ─────────────────────────────────────────────────────────────────────────
// STUDIO PHASE 13 -- dashboard intelligence layer. The mini calendar and
// activity heatmap are cross-hub (any team can use either), so their
// getters live here rather than under one specific hub's section above.
// See supabase/migrations/20261026130000_studio_phase13_dashboard_
// intelligence.sql for get_task_due_date_density()/get_team_activity_
// heatmap()'s full bodies and the no-new-table reasoning.
// ─────────────────────────────────────────────────────────────────────────

/** Real team_tasks.target_date counts per day, for the Studio mini
 * calendar. `scope`: 'team' (every real task for `team`), 'mine' (further
 * restricted to the caller's own assigned_to), 'all' (every team --
 * founder/co_director/admin only; a non-admin caller gets the RPC's own
 * real "not authorized" error, which MiniCalendar.jsx shows inline). */
export async function getTaskDueDateDensity(team, scope = 'team') {
  const { data, error } = await supabase.rpc('get_task_due_date_density', { _team: team, _scope: scope })
  if (error) throw error
  return { trackable: true, value: data || [] }
}

/** Real per-day event-count density for the Studio contribution-style
 * activity heatmap, for the last `days` days (default ~26 weeks). Always
 * includes `team`'s own real team_tasks activity; legal/tech/outreach
 * additionally get their real append-only status-log table unioned in --
 * see the migration's own comment for which. */
export async function getTeamActivityHeatmap(team, days = 182) {
  const { data, error } = await supabase.rpc('get_team_activity_heatmap', { _team: team, _days: days })
  if (error) throw error
  return { trackable: true, value: data || [] }
}
