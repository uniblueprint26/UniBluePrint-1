// Consent versioning — the version string recorded in legal_acknowledgements
// whenever a user accepts a policy. Bump these whenever the corresponding
// website legal page changes in a way that needs re-consent, and keep them
// matched to that page's own "Last updated" line so the two never drift.
//
// Website source of truth:
//   src/pages/legal/TermsPage.jsx   → "Last updated: June 2026"
//   src/pages/legal/PrivacyPage.jsx → "Last updated: June 2026"

export const TERMS_VERSION   = '2026-06'
export const PRIVACY_VERSION = '2026-06'
