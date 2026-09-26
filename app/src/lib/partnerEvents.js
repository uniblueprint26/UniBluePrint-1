/**
 * partnerEvents — logs Lifestyle Partner deal views/claims into
 * `activity_events`, which `partner_performance_stats` (and therefore the
 * Partner Portal's `get_my_partner_stats()`/`get_all_partner_stats()`) reads
 * by joining `activity_events.detail = partners.id::text` where
 * `type in ('partner_deal_viewed', 'partner_deal_claimed')` — see migration
 * 20260810120100_portals_operations_schema.sql, section 10.
 *
 * Until now nothing ever inserted those rows, so every Partner Portal metric
 * read as 0 even though the aggregation itself works. This is the missing
 * write side.
 *
 * Partners shown in the Lifestyle screens are static data (data/lifestylePartners.js)
 * keyed by a slug string (e.g. 'zvisionapparel'), not the `partners` table's
 * uuid — that row only exists once the Founder Portal has set a logo/photo
 * for that partner (see FounderPortalScreen's PhotoPickerModal, which upserts
 * `partners` by `partner_slug`). So logging a real event first needs the
 * uuid for that slug. `partners` INSERT/UPDATE is Founder/Operations-only
 * (RLS: founder_operations_manage_partners), so a student can only ever
 * resolve an existing row here, never create one — a deal viewed/claimed
 * for a partner with no `partners` row yet has nothing to log against, and
 * is silently skipped rather than attempting a write that RLS would reject.
 */
import { supabase } from './supabase'

const partnerIdCache = new Map()

async function resolvePartnerId(partnerSlug) {
  if (partnerIdCache.has(partnerSlug)) return partnerIdCache.get(partnerSlug)

  const { data: existing } = await supabase
    .from('partners')
    .select('id')
    .eq('partner_slug', partnerSlug)
    .maybeSingle()

  if (existing?.id) {
    partnerIdCache.set(partnerSlug, existing.id)
    return existing.id
  }
  return null
}

/**
 * Fire a 'partner_deal_viewed' or 'partner_deal_claimed' activity event for
 * the given partner. Silently no-ops on failure — this is metrics logging,
 * never something that should block or interrupt the student's own action
 * (opening a listing, tapping a contact link).
 */
export async function logPartnerEvent({ userId, partnerSlug, type, title }) {
  if (!userId || !partnerSlug || !type) return
  try {
    const partnerId = await resolvePartnerId(partnerSlug)
    if (!partnerId) return
    await supabase.from('activity_events').insert({
      user_id: userId,
      type,
      title: title || (type === 'partner_deal_claimed' ? 'Claimed a partner deal' : 'Viewed a partner deal'),
      detail: partnerId,
    })
  } catch {
    // Best-effort only.
  }
}
