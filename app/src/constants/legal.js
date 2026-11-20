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

// ── Age gating ───────────────────────────────────────────────────────────────
// MIN_SIGNUP_AGE (18): UniBlueprint is for people aged 18 and over. This
// matches the website Terms ("at least 18 years of age") and the store age
// rating (18+). SignUpScreen collects date of birth at step 1 and blocks
// sign-up entirely for anyone under this age, the account is never created.
// Enforced again at the database level (see the profiles_date_of_birth_age_gate
// and min_age_18 migrations) so it can't be bypassed by calling the API directly.
//
// MIN_INVESTMENT_AGE (18): the Budgeting screen's Investment tab. It is the same
// number now, but it stays its own constant because it guards a different
// thing (investing education). See
// hooks/useInvestmentAccess.js.
export const MIN_SIGNUP_AGE     = 18
export const MIN_INVESTMENT_AGE = 18
