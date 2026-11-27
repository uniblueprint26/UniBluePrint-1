// Partner Spotlight strip data. Story style circles at the top of the wallet, one per
// partner that has a new update. There is no data yet, so the strip stays hidden
// (the component renders nothing when this list is empty, never an empty strip).
//
// To add one update later, push an object here:
//   { partnerId: 'energie', title: 'New student plan', postedAt: '2026-12-01', expiresAt: '2026-12-08' }
// `expiresAt` is optional. Past updates are dropped. A remote source can replace this
// list inside hooks/usePartnerUpdates.js without touching the strip.
export const PARTNER_UPDATES = []
