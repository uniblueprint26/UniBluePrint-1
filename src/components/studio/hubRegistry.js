import { HUB_LABELS } from './theme'

// Studio Phase 14 -- the one place the command palette (CommandPalette.jsx)
// reads "which hubs exist, where do they live, who's allowed in" from, so
// jumping to another hub stays role-aware without duplicating App.jsx's own
// RequireRole gates. `roles` below is copied EXACTLY from each hub's
// <RequireRole allow={[...]}> in src/App.jsx (checked live before writing
// this) -- if a hub's allowed roles ever change there, update the matching
// entry here too, same "one source of truth per concern, kept in sync by
// hand because it's cheap and rare to change" judgment every prior Studio
// phase already made for HUB_ACCENTS/HUB_LABELS. `operations` and
// `business` roles exist in the app but have no Studio hub built on
// StudioShell (OperationsDashboardPage/PartnerPortalPage aren't Studio
// pages) -- deliberately absent here.
export const HUB_REGISTRY = {
  finance: { label: HUB_LABELS.finance, path: '/admin/finance', roles: ['finance', 'founder', 'admin', 'co_director'] },
  legal: { label: HUB_LABELS.legal, path: '/admin/legal', roles: ['legal', 'founder', 'admin', 'co_director'] },
  tech: { label: HUB_LABELS.tech, path: '/admin/tech', roles: ['tech', 'founder', 'admin', 'co_director'] },
  outreach: { label: HUB_LABELS.outreach, path: '/admin/outreach', roles: ['outreach', 'founder', 'admin', 'co_director'] },
  marketing: { label: HUB_LABELS.marketing, path: '/admin/marketing', roles: ['marketing', 'founder', 'admin', 'co_director'] },
  co_director: { label: HUB_LABELS.co_director, path: '/admin/co-director', roles: ['co_director', 'founder', 'admin'] },
  handler: { label: HUB_LABELS.handler, path: '/handler/queue', roles: ['handler', 'operations', 'co_director', 'founder', 'admin'] },
  founder: { label: HUB_LABELS.founder, path: '/admin/founder', roles: ['founder', 'admin', 'co_director'] },
}

/** Every hub whose roles overlap with `roles` (the signed-in user's own
 * role list from useAuth()), excluding `exceptHubKey` (normally the hub
 * currently being viewed). */
export function hubsAccessibleTo(roles = [], exceptHubKey = null) {
  return Object.entries(HUB_REGISTRY)
    .filter(([key, hub]) => key !== exceptHubKey && hub.roles.some(r => roles.includes(r)))
    .map(([key, hub]) => ({ key, ...hub }))
}
