import { useMemo } from 'react'
import { PARTNER_UPDATES } from '../data/partnerUpdates'

// The partners that have a live update, one entry per partner, newest first.
// Empty today. The Spotlight strip shows nothing while this is empty.
export function usePartnerUpdates(partners) {
  return useMemo(() => {
    const now = Date.now()
    const seen = new Set()
    return [...PARTNER_UPDATES]
      .filter(u => !u.expiresAt || new Date(u.expiresAt).getTime() > now)
      .sort((a, b) => String(b.postedAt || '').localeCompare(String(a.postedAt || '')))
      .filter(u => {
        if (seen.has(u.partnerId)) return false
        seen.add(u.partnerId)
        return true
      })
      .map(u => ({ ...u, partner: (partners || []).find(p => p.id === u.partnerId) }))
      .filter(u => !!u.partner)
  }, [partners])
}
