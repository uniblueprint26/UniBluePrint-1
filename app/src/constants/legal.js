// Consent versioning — the version string recorded in legal_acknowledgements
// whenever a user accepts a policy. Bump these whenever the corresponding
// website legal page changes in a way that needs re-consent, and keep them
// matched to that page's own "Last updated" line so the two never drift.
//
// Website source of truth:
//   src/pages/legal/TermsPage.jsx   → "Last updated: September 2026"
//   src/pages/legal/PrivacyPage.jsx → "Last updated: September 2026"
//
// 2026-09 bump: both pages now name UniBlueprint Limited as the operating
// entity/data controller with its CRO number and registered office (the
// company registered with the CRO on 2026-09-23; previously the pages said
// only "a company registered in Ireland" with no legal-entity detail), and
// correct the "VAT where applicable" copy to state plainly that the company
// isn't VAT-registered. Recorded here so this is the reference point once
// a real re-consent flow exists (see docs/audits/2026-09-24-APP-FIX-PLAN.md,
// "No re-consent flow" under batch 7) — bumping the version alone does not
// yet prompt existing users to re-accept anything.

export const TERMS_VERSION   = '2026-09'
export const PRIVACY_VERSION = '2026-09'

// The legal-entity line shown in-app (About, Privacy & Data, Profile) so the
// operating company is identifiable from inside the app itself, not just on
// the website's Terms/Privacy pages. Keep this in sync with the intro
// paragraph of both of those pages if the entity details ever change.
export const LEGAL_ENTITY_LINE =
  'UniBlueprint Limited is registered in Ireland, company number 826545. Registered office: Ballyhaunis Road, Claremorris, Co. Mayo, F12 V0F9, Ireland.'
