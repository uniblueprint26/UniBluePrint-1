/**
 * usePartnerContact — fetches a Lifestyle Blueprint partner's real contact
 * details (email, phone, Instagram/TikTok handle, website) from the backend
 * instead of reading them out of the static data/lifestylePartners.js /
 * data/adBoardAds.js objects.
 *
 * GDPR fix (task #94, same pattern as coach_contact_details /
 * hooks used by CoachProfileScreen etc): those files used to hardcode every
 * partner's real personal contact info directly into the JS bundle. That
 * data now lives in the backend-only lifestyle_partner_contact_details
 * table (see supabase/migrations/20261012180000_lifestyle_partner_contact_details.sql),
 * reachable only via the get_lifestyle_partner_contact() SECURITY DEFINER
 * RPC — not by querying the table directly, which has no
 * blanket-authenticated-read policy.
 *
 * That RPC is also the real enforcement point for the Lifestyle Blueprint
 * browse/claim split (docs/business/subscription-pricing-model.md: Free
 * users can browse every deal, but only Pro users — or a Mental Health
 * partner, or Founder/Operations — can see the contact info needed to
 * actually claim one). A caller without access gets back
 * `requires_pro: true` and every contact field null, rather than an error,
 * so the UI can show an upgrade prompt instead of a raw failure.
 *
 * Returns { contact, loading, requiresPro }:
 *   - contact: { email, phone, instagramHandle, tiktokHandle, websiteUrl } | null
 *   - loading: true while the RPC call is in flight
 *   - requiresPro: true when the backend withheld contact info pending Pro
 *
 * `enabled` (default true) lets a caller defer the fetch until it's
 * actually needed — e.g. only while a modal/sheet showing this partner is
 * open, not on every render of a list.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePartnerContact(partnerSlug, { enabled = true } = {}) {
  const [state, setState] = useState({ contact: null, loading: false, requiresPro: false })

  useEffect(() => {
    if (!enabled || !partnerSlug) {
      setState({ contact: null, loading: false, requiresPro: false })
      return
    }
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    supabase.rpc('get_lifestyle_partner_contact', { _partner_slug: partnerSlug })
      .then(({ data, error }) => {
        if (cancelled) return
        const row = !error && Array.isArray(data) ? data[0] : null
        if (!row) {
          setState({ contact: null, loading: false, requiresPro: false })
          return
        }
        setState({
          loading: false,
          requiresPro: !!row.requires_pro,
          contact: row.requires_pro ? null : {
            email: row.email || null,
            phone: row.phone || null,
            instagramHandle: row.instagram_handle || null,
            tiktokHandle: row.tiktok_handle || null,
            websiteUrl: row.website_url || null,
          },
        })
      })
      .catch(() => {
        if (!cancelled) setState({ contact: null, loading: false, requiresPro: false })
      })
    return () => { cancelled = true }
  }, [partnerSlug, enabled])

  return state
}
